import { JSX, useState } from 'react';
import { CprEvent } from '../types';
import { cycleCount, formatDuration, medicationEntries, shockCount } from '../utils';
import { Timeline } from './Timeline';

export interface SummaryScreenProps {
  event: CprEvent;
  onUpdate: (event: CprEvent) => void;
  onReport: () => void;
  onHome: () => void;
}

/**
 * Tela de encerramento: dados históricos ficam bloqueados;
 * apenas campos narrativos podem ser editados (edições auditadas).
 */
export function SummaryScreen(props: SummaryScreenProps): JSX.Element {
  const { event, onUpdate, onReport, onHome } = props;
  const [narrative, setNarrative] = useState(event.narrative);
  const [context, setContext] = useState(event.clinicalContext);
  const [prognosis, setPrognosis] = useState(event.prognosis);
  const [nextActions, setNextActions] = useState(event.nextActions);
  const [quality, setQuality] = useState(event.qualityNote);
  const [signName, setSignName] = useState(event.signedBy ?? event.team.find((m) => m.role === 'Coordenador')?.name ?? '');
  const [signCrm, setSignCrm] = useState(event.signedCrm ?? '');
  const [signSpecialty, setSignSpecialty] = useState(event.signedSpecialty ?? '');
  const [pendingWarn, setPendingWarn] = useState('');

  const duration = (event.endedAt ?? Date.now()) - event.startedAt;

  function saveNarratives(): CprEvent {
    const updated: CprEvent = {
      ...event,
      narrative,
      clinicalContext: context,
      prognosis,
      nextActions,
      qualityNote: quality,
      audit: [...event.audit, { at: Date.now(), who: signName || 'Coordenador', what: 'Campos narrativos atualizados' }],
    };
    onUpdate(updated);
    return updated;
  }

  function sign(): void {
    // Validação de integridade antes de assinar
    if (!signName.trim() || !signCrm.trim()) {
      setPendingWarn('Informe nome e registro profissional (CRM) para assinar.');
      return;
    }
    if (!narrative.trim()) {
      setPendingWarn('Dados incompletos: preencha a narrativa clínica antes de assinar.');
      return;
    }
    const base = saveNarratives();
    onUpdate({
      ...base,
      signedBy: signName.trim(),
      signedCrm: signCrm.trim(),
      signedSpecialty: signSpecialty.trim(),
      signedAt: Date.now(),
      audit: [...base.audit, { at: Date.now(), who: signName.trim(), what: `Relatório assinado digitalmente (${signCrm.trim()})` }],
    });
    setPendingWarn('');
  }

  const outcomeText =
    event.outcome === 'RCE'
      ? 'Retorno de Circulação Espontânea'
      : event.outcome === 'ECMO'
        ? 'Transferência para ECMO'
        : event.outcome === 'OBITO'
          ? 'Óbito'
          : '—';

  return (
    <div>
      <h2 className="section-title">Resumo do Evento</h2>

      <div className="status-strip">
        <div className="stat">
          <div className="stat-label">Duração Total</div>
          <div className="stat-value">{formatDuration(duration)}</div>
        </div>
        <div className={`stat ${event.outcome === 'RCE' ? 'ok' : event.outcome === 'OBITO' ? 'danger' : 'warn'}`}>
          <div className="stat-label">Resultado</div>
          <div className="stat-value small">{outcomeText}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Verificações de Ritmo</div>
          <div className="stat-value">{cycleCount(event)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Desfibrilações</div>
          <div className="stat-value">{shockCount(event)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Medicações</div>
          <div className="stat-value">{medicationEntries(event).length}</div>
        </div>
      </div>

      <div className="cpr-grid">
        <div>
          <div className="panel" style={{ marginBottom: 16 }}>
            <h3>Campos Narrativos (editáveis)</h3>
            <div className="field">
              <label>Contexto clínico</label>
              <textarea rows={2} value={context} onChange={(e) => setContext(e.target.value)} />
            </div>
            <div className="field">
              <label>Narrativa clínica (resumo do evento, 200-500 palavras)</label>
              <textarea rows={7} value={narrative} onChange={(e) => setNarrative(e.target.value)} />
            </div>
            <div className="field">
              <label>Qualidade de RCP (observações)</label>
              <textarea rows={2} value={quality} onChange={(e) => setQuality(e.target.value)} />
            </div>
            <div className="field">
              <label>Prognóstico estimado</label>
              <input value={prognosis} onChange={(e) => setPrognosis(e.target.value)} placeholder="Reservado / Guardado / Bom" />
            </div>
            <div className="field">
              <label>Próximas ações</label>
              <textarea
                rows={2}
                value={nextActions}
                onChange={(e) => setNextActions(e.target.value)}
                placeholder="Ex: Transferência para UTI; hipotermia terapêutica; cateterismo em 24h"
              />
            </div>
            <button className="btn btn-sm btn-gold" onClick={saveNarratives}>
              Salvar campos narrativos
            </button>
          </div>

          <div className="panel" style={{ marginBottom: 16 }}>
            <h3>Assinatura Digital</h3>
            {event.signedAt ? (
              <div className="alert alert-green" style={{ marginBottom: 0 }}>
                ✓ Assinado por {event.signedBy} (CRM {event.signedCrm}) em{' '}
                {new Date(event.signedAt).toLocaleString('pt-BR')}
              </div>
            ) : (
              <>
                <div className="form-grid">
                  <div className="field">
                    <label>Médico coordenador</label>
                    <input value={signName} onChange={(e) => setSignName(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>CRM / UF</label>
                    <input value={signCrm} onChange={(e) => setSignCrm(e.target.value)} placeholder="CRM 12345/SP" />
                  </div>
                  <div className="field">
                    <label>Especialidade</label>
                    <input value={signSpecialty} onChange={(e) => setSignSpecialty(e.target.value)} />
                  </div>
                </div>
                {pendingWarn && <div className="warn-box">{pendingWarn}</div>}
                <button className="btn btn-green" onClick={sign}>
                  Assinar digitalmente
                </button>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className="btn btn-gold"
              style={{ flex: 2, fontSize: 18 }}
              onClick={() => {
                saveNarratives();
                onReport();
              }}
            >
              GERAR RELATÓRIO
            </button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onHome}>
              Início
            </button>
          </div>
        </div>

        <div className="panel">
          <h3>Cronologia (bloqueada)</h3>
          <Timeline event={event} />
        </div>
      </div>
    </div>
  );
}
