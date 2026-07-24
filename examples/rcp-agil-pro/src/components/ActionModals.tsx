import { JSX, useMemo, useState } from 'react';
import {
  ADRENALINE_MAX_INTERVAL_MS,
  ADRENALINE_MIN_INTERVAL_MS,
  ATROPINE_MAX_TOTAL_MG,
  DEFIB_ENERGIES,
  MEDICATIONS,
  RHYTHMS,
  getRhythm,
} from '../constants';
import { CprEvent, LogEntry, Outcome } from '../types';
import { currentRhythm, formatClock, medicationEntries, newId, shockCount } from '../utils';

interface BaseModalProps {
  event: CprEvent;
  onConfirm: (entry: LogEntry) => void;
  onClose: () => void;
}

function performerSelect(event: CprEvent, value: string, onChange: (v: string) => void): JSX.Element {
  return (
    <div className="field">
      <label>Responsável</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {event.team.map((m) => (
          <option key={m.role} value={m.name}>
            {m.name} ({m.role})
          </option>
        ))}
      </select>
    </div>
  );
}

/* ---------- Verificar Ritmo ---------- */
export function RhythmModal(props: BaseModalProps): JSX.Element {
  const [performer, setPerformer] = useState(props.event.team.find((m) => m.role === 'Coordenador')?.name ?? '');
  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Verificar Ritmo</h2>
        <p style={{ color: 'var(--silver)' }}>Selecione o ritmo identificado no monitor:</p>
        <div className="options">
          {RHYTHMS.map((r) => (
            <button
              key={r.code}
              className={`btn ${r.perfusing ? 'btn-green' : r.shockable ? 'btn-red' : 'btn-orange'}`}
              onClick={() =>
                props.onConfirm({
                  id: newId(),
                  type: 'ritmo',
                  at: Date.now(),
                  label: `Ritmo: ${r.name} (${r.code === 'PERFUNDIVEL' ? 'Perfundível' : r.code})`,
                  performer,
                  data: { code: r.code, name: r.name, shockable: r.shockable },
                })
              }
            >
              {r.code === 'PERFUNDIVEL' ? 'Perfundível' : r.code}
              <div style={{ fontSize: 11, fontWeight: 400 }}>{r.name}</div>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>{performerSelect(props.event, performer, setPerformer)}</div>
        <div className="row">
          <button className="btn btn-ghost" onClick={props.onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Medicação (seleção → confirmação com validações) ---------- */
export function MedicationModal(props: BaseModalProps): JSX.Element {
  const { event } = props;
  const [selected, setSelected] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [dose, setDose] = useState('');
  const [route, setRoute] = useState('IV');
  const [performer, setPerformer] = useState(event.team.find((m) => m.role === 'Medicador')?.name ?? '');
  const [ackWarnings, setAckWarnings] = useState(false);

  const med = MEDICATIONS.find((m) => m.name === selected);

  const warnings = useMemo(() => {
    const list: string[] = [];
    if (!med) {
      return list;
    }
    const doseNum = parseFloat(dose.replace(',', '.'));
    // Validação de dose
    if (med.minDose !== undefined && med.maxDose !== undefined && !Number.isNaN(doseNum)) {
      if (doseNum < med.minDose || doseNum > med.maxDose) {
        list.push(`Dose fora do intervalo recomendado (${med.minDose}-${med.maxDose} ${med.unit}). Confirmar?`);
      }
    }
    // Validação de intervalo (Adrenalina a cada 3-5 min)
    if (med.name === 'Adrenalina') {
      const prev = medicationEntries(event, 'Adrenalina');
      if (prev.length > 0) {
        const elapsed = Date.now() - prev[prev.length - 1].at;
        if (elapsed < ADRENALINE_MIN_INTERVAL_MS) {
          list.push('Intervalo anormal: última adrenalina há menos de 2 minutos. Confirmar?');
        } else if (elapsed > ADRENALINE_MAX_INTERVAL_MS) {
          list.push('Intervalo anormal: última adrenalina há mais de 6 minutos. Confirmar?');
        }
      }
    }
    // Validação de sequência (Amiodarona após 3º choque)
    if (med.name === 'Amiodarona' && shockCount(event) < 3) {
      list.push('Sequência fora do protocolo: Amiodarona recomendada após o 3º choque. Confirmar?');
    }
    // Dose máxima acumulada de Atropina
    if (med.name === 'Atropina' && !Number.isNaN(doseNum)) {
      const total = medicationEntries(event, 'Atropina').reduce((sum, e) => sum + Number(e.data?.doseNum ?? 0), 0);
      if (total + doseNum > ATROPINE_MAX_TOTAL_MG) {
        list.push(`Dose máxima total de Atropina (${ATROPINE_MAX_TOTAL_MG} mg) seria excedida. Confirmar?`);
      }
    }
    return list;
  }, [med, dose, event]);

  function confirm(): void {
    const name = med?.name === 'Outra' ? customName.trim() || 'Medicação' : (med?.name ?? '');
    const doseNum = parseFloat(dose.replace(',', '.'));
    props.onConfirm({
      id: newId(),
      type: 'medicacao',
      at: Date.now(),
      label: `${name} ${dose}${med?.unit ? ` ${med.unit}` : ''} ${route}`,
      performer,
      data: {
        name,
        dose: `${dose}${med?.unit ? ` ${med.unit}` : ''}`,
        doseNum: Number.isNaN(doseNum) ? 0 : doseNum,
        route,
        warnings: warnings.length > 0,
      },
    });
  }

  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Registrar Medicação</h2>
        {!med && (
          <div className="options">
            {MEDICATIONS.map((m) => (
              <button
                key={m.name}
                className="btn"
                onClick={() => {
                  setSelected(m.name);
                  setDose(m.defaultDose);
                  setRoute(m.defaultRoute);
                }}
              >
                {m.name}
                {m.note && <div style={{ fontSize: 11, fontWeight: 400, color: 'var(--silver)' }}>{m.note}</div>}
              </button>
            ))}
          </div>
        )}
        {med && (
          <>
            <p>
              Confirmar: <strong>{med.name === 'Outra' ? customName || '(informe o nome)' : med.name}</strong> · Timestamp:{' '}
              <span style={{ fontFamily: 'var(--mono)' }}>{formatClock(Date.now())}</span>
            </p>
            {med.name === 'Outra' && (
              <div className="field">
                <label>Nome da medicação</label>
                <input value={customName} onChange={(e) => setCustomName(e.target.value)} autoFocus />
              </div>
            )}
            <div className="form-grid">
              <div className="field">
                <label>Dose {med.unit ? `(${med.unit})` : ''}</label>
                <input value={dose} onChange={(e) => setDose(e.target.value)} inputMode="decimal" />
              </div>
              <div className="field">
                <label>Via</label>
                <select value={route} onChange={(e) => setRoute(e.target.value)}>
                  {['IV', 'IO', 'ET', 'IM', 'SC'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            {performerSelect(props.event, performer, setPerformer)}
            {warnings.map((w) => (
              <div className="warn-box" key={w}>
                ⚠ {w}
              </div>
            ))}
            {warnings.length > 0 && (
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#fdba74' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={ackWarnings}
                  onChange={(e) => setAckWarnings(e.target.checked)}
                />
                Estou ciente e confirmo a administração
              </label>
            )}
            <div className="row">
              <button className="btn btn-green" disabled={!dose || (warnings.length > 0 && !ackWarnings)} onClick={confirm}>
                Confirmar
              </button>
              <button className="btn btn-ghost" onClick={() => setSelected('')}>
                Voltar
              </button>
            </div>
          </>
        )}
        {!med && (
          <div className="row">
            <button className="btn btn-ghost" onClick={props.onClose}>
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Desfibrilação ---------- */
export function DefibModal(props: BaseModalProps): JSX.Element {
  const { event } = props;
  const nShocks = shockCount(event);
  const rhythm = currentRhythm(event);
  const rhythmInfo = rhythm ? getRhythm(rhythm) : undefined;
  const contraindicated = rhythmInfo ? !rhythmInfo.shockable : false;
  const [energy, setEnergy] = useState<number>(DEFIB_ENERGIES[2]);
  const [performer, setPerformer] = useState(event.team.find((m) => m.role === 'Desfibrilador')?.name ?? '');
  const [ack, setAck] = useState(false);

  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Desfibrilação — Choque {nShocks + 1}</h2>
        {contraindicated && (
          <div className="danger-box">
            ⚠ Desfibrilação não indicada para este ritmo ({rhythmInfo?.name}). Confirmar mesmo assim?
          </div>
        )}
        <div className="field">
          <label>Energia (J)</label>
          <div className="options">
            {DEFIB_ENERGIES.map((e) => (
              <button key={e} className={`btn btn-sm ${energy === e ? 'btn-gold' : ''}`} onClick={() => setEnergy(e)}>
                {e} J
              </button>
            ))}
          </div>
        </div>
        {performerSelect(event, performer, setPerformer)}
        {contraindicated && (
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#fca5a5' }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={ack} onChange={(e) => setAck(e.target.checked)} />
            Confirmo a indicação clínica do choque
          </label>
        )}
        <div className="row">
          <button
            className="btn btn-red"
            disabled={contraindicated && !ack}
            onClick={() =>
              props.onConfirm({
                id: newId(),
                type: 'choque',
                at: Date.now(),
                label: `Desfibrilação (Choque ${nShocks + 1}, ${energy} J)`,
                performer,
                data: { number: nShocks + 1, energy, rhythmBefore: rhythm ?? '' },
              })
            }
          >
            APLICAR CHOQUE {energy} J
          </button>
          <button className="btn btn-ghost" onClick={props.onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Intervenção / Sinais Vitais / Complicação / Nota ---------- */
export function NoteModal(props: BaseModalProps & { kind: 'intervencao' | 'sinais-vitais' | 'complicacao' | 'nota' }): JSX.Element {
  const titles = {
    intervencao: 'Registrar Intervenção',
    'sinais-vitais': 'Registrar Sinais Vitais',
    complicacao: 'Registrar Complicação',
    nota: 'Adicionar Nota',
  } as const;
  const placeholders = {
    intervencao: 'Ex: Intubação orotraqueal, tubo 8.0, capnografia positiva',
    'sinais-vitais': 'Ex: FC 0 · PA 0/0 · SpO₂ 92% · ETCO₂ 15 mmHg · Temp 36,3 °C',
    complicacao: 'Ex: Fratura de costela — RCP mantida',
    nota: 'Observação livre',
  } as const;
  const [text, setText] = useState('');
  const [performer, setPerformer] = useState('');
  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{titles[props.kind]}</h2>
        <div className="field">
          <label>Descrição</label>
          <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholders[props.kind]} autoFocus />
        </div>
        {performerSelect(props.event, performer, setPerformer)}
        <div className="row">
          <button
            className="btn btn-green"
            disabled={!text.trim()}
            onClick={() =>
              props.onConfirm({ id: newId(), type: props.kind, at: Date.now(), label: text.trim(), performer })
            }
          >
            Confirmar
          </button>
          <button className="btn btn-ghost" onClick={props.onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Encerramento (RCE / Interrupção / ECMO) com confirmação dupla ---------- */
export interface EndModalProps {
  event: CprEvent;
  mode: Outcome;
  onConfirm: (entry: LogEntry, outcome: Outcome, detail: string) => void;
  onClose: () => void;
}

export function EndModal(props: EndModalProps): JSX.Element {
  const { mode, event } = props;
  const [detail, setDetail] = useState('');
  const [performer, setPerformer] = useState(event.team.find((m) => m.role === 'Coordenador')?.name ?? '');
  const [confirmStep, setConfirmStep] = useState(false);

  const config = {
    RCE: {
      title: 'Retorno de Circulação Espontânea (RCE)',
      label: 'RCE — Retorno de Circulação Espontânea',
      type: 'rce' as const,
      detailLabel: 'Ritmo final / pulso / PA (opcional)',
      btn: 'btn-green',
      confirmText: 'CONFIRMAR RCE',
      requireDetail: false,
    },
    OBITO: {
      title: 'Interromper RCP',
      label: 'RCP interrompida — óbito declarado',
      type: 'interrupcao' as const,
      detailLabel: 'Motivo da interrupção (obrigatório)',
      btn: 'btn-red',
      confirmText: 'CONFIRMAR INTERRUPÇÃO',
      requireDetail: true,
    },
    ECMO: {
      title: 'Transferência para ECMO',
      label: 'Transferência para ECMO (RCP extracorpórea)',
      type: 'ecmo' as const,
      detailLabel: 'Observações da transferência',
      btn: 'btn-orange',
      confirmText: 'CONFIRMAR TRANSFERÊNCIA',
      requireDetail: false,
    },
  }[mode];

  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{config.title}</h2>
        {mode === 'OBITO' && (
          <div className="danger-box">
            Ação irreversível: encerra o evento e bloqueia edição dos dados históricos. Requer confirmação dupla.
          </div>
        )}
        <div className="field">
          <label>{config.detailLabel}</label>
          <textarea rows={2} value={detail} onChange={(e) => setDetail(e.target.value)} autoFocus />
        </div>
        {performerSelect(event, performer, setPerformer)}
        {!confirmStep ? (
          <div className="row">
            <button
              className={`btn ${config.btn}`}
              disabled={config.requireDetail && !detail.trim()}
              onClick={() => setConfirmStep(true)}
            >
              Continuar
            </button>
            <button className="btn btn-ghost" onClick={props.onClose}>
              Cancelar
            </button>
          </div>
        ) : (
          <>
            <div className="warn-box">
              Confirmar: {config.label}
              {detail.trim() ? ` — ${detail.trim()}` : ''} · {formatClock(Date.now())}
              {performer ? ` · por ${performer}` : ''}
            </div>
            <div className="row">
              <button
                className={`btn ${config.btn}`}
                onClick={() =>
                  props.onConfirm(
                    {
                      id: newId(),
                      type: config.type,
                      at: Date.now(),
                      label: config.label + (detail.trim() ? ` — ${detail.trim()}` : ''),
                      performer,
                      data: { detail: detail.trim() },
                    },
                    mode,
                    detail.trim()
                  )
                }
              >
                {config.confirmText}
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirmStep(false)}>
                Voltar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
