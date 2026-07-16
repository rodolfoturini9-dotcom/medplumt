import { JSX, useEffect, useRef, useState } from 'react';
import {
  ADRENALINE_INTERVAL_MS,
  NO_ROSC_LIMIT_MS,
  RHYTHM_CHECK_INTERVAL_MS,
  getRhythm,
} from '../constants';
import { alertBeep } from '../metronome';
import { CprEvent, LogEntry, Outcome } from '../types';
import {
  currentRhythm,
  cycleCount,
  formatDuration,
  lastEntryOf,
  medicationEntries,
  newId,
  shockCount,
} from '../utils';
import { DefibModal, EndModal, MedicationModal, NoteModal, RhythmModal } from './ActionModals';
import { MetronomePanel } from './MetronomePanel';
import { Timeline } from './Timeline';

export interface ResuscitationScreenProps {
  event: CprEvent;
  onAddEntry: (entry: LogEntry) => void;
  onEnd: (event: CprEvent) => void;
  onUpdate: (event: CprEvent) => void;
}

type ModalKind =
  | 'ritmo'
  | 'medicacao'
  | 'choque'
  | 'intervencao'
  | 'sinais-vitais'
  | 'complicacao'
  | 'nota'
  | 'RCE'
  | 'OBITO'
  | 'ECMO'
  | null;

/** Passos do algoritmo ACLS conforme o ritmo atual */
function algorithmSteps(event: CprEvent): { title: string; steps: string[] } {
  const rhythm = currentRhythm(event);
  const shocks = shockCount(event);
  if (!rhythm) {
    return {
      title: 'ALGORITMO ACLS — INÍCIO',
      steps: [
        'Iniciar compressões torácicas 100-120 bpm (5-6 cm)',
        'Ventilação 10-12 irpm — evitar hiperventilação',
        'Monitorizar e VERIFICAR RITMO assim que possível',
        'Obter acesso IV/IO',
      ],
    };
  }
  const info = getRhythm(rhythm);
  if (info.perfusing) {
    return {
      title: 'RITMO PERFUNDÍVEL — AVALIAR RCE',
      steps: [
        'Checar pulso central e pressão arterial',
        'Se pulso presente: registrar RCE',
        'Cuidados pós-PCR: SpO₂ 92-98%, PAS ≥ 90 mmHg',
        'ECG 12 derivações; considerar cateterismo',
        'Controle direcionado de temperatura',
      ],
    };
  }
  if (info.shockable) {
    return {
      title: `ALGORITMO ACLS — ${info.name.toUpperCase()}`,
      steps: [
        `Desfibrilação (choques aplicados: ${shocks})`,
        'Compressões torácicas 100-120 bpm',
        'Ventilação 10-12 irpm',
        'Adrenalina 1 mg IV a cada 3-5 min (após 2º choque)',
        shocks >= 3 ? 'Amiodarona 300 mg IV (indicada — 3º choque aplicado)' : 'Amiodarona 300 mg IV após 3º choque',
        'Tratar causas reversíveis (5H e 5T)',
      ],
    };
  }
  return {
    title: `ALGORITMO ACLS — ${info.name.toUpperCase()}`,
    steps: [
      'Desfibrilação NÃO indicada',
      'Compressões torácicas 100-120 bpm contínuas',
      'Adrenalina 1 mg IV imediata; repetir a cada 3-5 min',
      'Ventilação 10-12 irpm; considerar via aérea avançada',
      'Buscar causas reversíveis (5H e 5T)',
    ],
  };
}

export function ResuscitationScreen(props: ResuscitationScreenProps): JSX.Element {
  const { event, onAddEntry, onEnd, onUpdate } = props;
  const [now, setNow] = useState(Date.now());
  const [modal, setModal] = useState<ModalKind>(null);
  const beepedRef = useRef<{ rhythm: boolean; limit: boolean }>({ rhythm: false, limit: false });

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);

  const elapsed = now - event.startedAt;
  const rhythm = currentRhythm(event);
  const rhythmInfo = rhythm ? getRhythm(rhythm) : undefined;
  const lastRhythmEntry = lastEntryOf(event, 'ritmo');
  const rhythmDue = (lastRhythmEntry?.at ?? event.startedAt) + RHYTHM_CHECK_INTERVAL_MS;
  const rhythmRemaining = rhythmDue - now;
  const adrenalineDoses = medicationEntries(event, 'Adrenalina');
  const lastAdrenaline = adrenalineDoses[adrenalineDoses.length - 1];
  const adrenalineDue = lastAdrenaline ? lastAdrenaline.at + ADRENALINE_INTERVAL_MS : undefined;
  const adrenalineRemaining = adrenalineDue !== undefined ? adrenalineDue - now : undefined;
  const overLimit = elapsed > NO_ROSC_LIMIT_MS;
  const algo = algorithmSteps(event);

  // Alertas sonoros únicos por transição de estado
  useEffect(() => {
    if (rhythmRemaining < 0 && !beepedRef.current.rhythm) {
      beepedRef.current.rhythm = true;
      alertBeep();
    }
    if (rhythmRemaining >= 0) {
      beepedRef.current.rhythm = false;
    }
    if (overLimit && !beepedRef.current.limit) {
      beepedRef.current.limit = true;
      alertBeep();
    }
  }, [rhythmRemaining, overLimit]);

  function handleModalConfirm(entry: LogEntry): void {
    onAddEntry(entry);
    setModal(null);
  }

  function handleEnd(entry: LogEntry, outcome: Outcome, detail: string): void {
    const finished: CprEvent = {
      ...event,
      entries: [...event.entries, entry],
      endedAt: entry.at,
      outcome,
      outcomeDetail: detail,
      audit: [...event.audit, { at: Date.now(), who: entry.performer ?? 'Equipe', what: `Evento encerrado: ${entry.label}` }],
    };
    setModal(null);
    onEnd(finished);
  }

  function metronomeToggled(running: boolean, bpm: number): void {
    onAddEntry({
      id: newId(),
      type: running ? 'compressoes' : 'pausa',
      at: Date.now(),
      label: running ? `Compressões iniciadas (metrônomo ${bpm} bpm)` : 'Compressões pausadas',
    });
  }

  return (
    <div>
      {/* Alertas de ação pendente */}
      {rhythmRemaining < 0 && (
        <div className="alert alert-red no-print">
          ⚠ PRÓXIMA AÇÃO VENCIDA — Verificar ritmo (vencido há {formatDuration(-rhythmRemaining)})
          <button className="btn btn-red btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setModal('ritmo')}>
            Verificar Agora
          </button>
        </div>
      )}
      {adrenalineRemaining !== undefined && adrenalineRemaining < 0 && (
        <div className="alert alert-orange no-print">
          ⚠ Medicação: considerar Adrenalina 1 mg IV (última dose há {formatDuration(now - (lastAdrenaline?.at ?? now))})
          <button className="btn btn-orange btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setModal('medicacao')}>
            Registrar
          </button>
        </div>
      )}
      {overLimit && (
        <div className="alert alert-red no-print">
          ⚠ CRITÉRIO DE INTERRUPÇÃO — {formatDuration(elapsed)} de RCP sem RCE (ACLS 2020: considerar após 30 min).
          Avaliar interrupção ou causas reversíveis.
        </div>
      )}

      {/* Painel de status */}
      <div className="status-strip">
        <div className="stat">
          <div className="stat-label">Tempo Decorrido</div>
          <div className="stat-value">{formatDuration(elapsed)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Ritmo Atual</div>
          <div className="stat-value small">
            {rhythmInfo ? (
              <span
                className={`rhythm-badge ${
                  rhythmInfo.perfusing ? 'rhythm-perfusing' : rhythmInfo.shockable ? 'rhythm-shockable' : 'rhythm-nonshockable'
                }`}
              >
                {rhythmInfo.code === 'PERFUNDIVEL' ? 'PERFUNDÍVEL' : rhythmInfo.code}
              </span>
            ) : (
              '—'
            )}
          </div>
          {lastRhythmEntry && (
            <div style={{ fontSize: 12, color: 'var(--gray)' }}>
              Última verificação há {formatDuration(now - lastRhythmEntry.at)}
            </div>
          )}
        </div>
        <div className={`stat ${rhythmRemaining < 0 ? 'danger' : rhythmRemaining < 30000 ? 'warn' : ''}`}>
          <div className="stat-label">Verificar Ritmo Em</div>
          <div className="stat-value">{rhythmRemaining < 0 ? 'AGORA' : formatDuration(rhythmRemaining)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Ciclo / Choques</div>
          <div className="stat-value">
            {cycleCount(event)} <span style={{ fontSize: 15, color: 'var(--silver)' }}>/ {shockCount(event)}⚡</span>
          </div>
        </div>
        {adrenalineRemaining !== undefined && (
          <div className={`stat ${adrenalineRemaining < 0 ? 'warn' : ''}`}>
            <div className="stat-label">Adrenalina Em</div>
            <div className="stat-value">{adrenalineRemaining < 0 ? 'AGORA' : formatDuration(adrenalineRemaining)}</div>
          </div>
        )}
      </div>

      <div className="cpr-grid">
        <div>
          <MetronomePanel onToggle={metronomeToggled} />

          {/* Algoritmo dinâmico */}
          <div className="panel algo" style={{ marginBottom: 16 }}>
            <h3>{algo.title}</h3>
            <ul>
              {algo.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="next-action">
              → Próxima ação: {rhythmRemaining < 0 ? 'Verificar ritmo AGORA' : `Verificar ritmo em ${formatDuration(rhythmRemaining)}`}
            </div>
          </div>

          {/* Ações rápidas — máximo 2 toques por ação crítica */}
          <div className="panel">
            <h3>Ações Rápidas</h3>
            <div className="action-grid">
              <button className="btn btn-gold" onClick={() => setModal('ritmo')}>
                Verificar Ritmo
              </button>
              <button className="btn" onClick={() => setModal('medicacao')}>
                Medicação
              </button>
              <button className="btn btn-red" onClick={() => setModal('choque')}>
                Desfibrilação ⚡
              </button>
              <button className="btn" onClick={() => setModal('intervencao')}>
                Intervenção
              </button>
              <button className="btn" onClick={() => setModal('sinais-vitais')}>
                Sinais Vitais
              </button>
              <button className="btn" onClick={() => setModal('complicacao')}>
                Complicação
              </button>
              <button className="btn" onClick={() => setModal('nota')}>
                Nota
              </button>
              <button className="btn btn-green" onClick={() => setModal('RCE')}>
                ✓ RCE
              </button>
              <button className="btn btn-orange" onClick={() => setModal('ECMO')}>
                Transferência ECMO
              </button>
              <button className="btn btn-red" onClick={() => setModal('OBITO')}>
                Interromper RCP
              </button>
            </div>
          </div>
        </div>

        {/* Timeline lateral */}
        <div className="panel">
          <h3>Timeline</h3>
          <Timeline event={event} onUpdate={onUpdate} editable />
        </div>
      </div>

      {modal === 'ritmo' && <RhythmModal event={event} onConfirm={handleModalConfirm} onClose={() => setModal(null)} />}
      {modal === 'medicacao' && <MedicationModal event={event} onConfirm={handleModalConfirm} onClose={() => setModal(null)} />}
      {modal === 'choque' && <DefibModal event={event} onConfirm={handleModalConfirm} onClose={() => setModal(null)} />}
      {(modal === 'intervencao' || modal === 'sinais-vitais' || modal === 'complicacao' || modal === 'nota') && (
        <NoteModal kind={modal} event={event} onConfirm={handleModalConfirm} onClose={() => setModal(null)} />
      )}
      {(modal === 'RCE' || modal === 'OBITO' || modal === 'ECMO') && (
        <EndModal event={event} mode={modal} onConfirm={handleEnd} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
