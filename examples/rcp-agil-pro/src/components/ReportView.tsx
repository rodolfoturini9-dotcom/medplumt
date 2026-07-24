import { JSX } from 'react';
import { APP_NAME, TAGLINE } from '../constants';
import { CprEvent, LogEntry } from '../types';
import { cycleCount, entriesOf, formatDate, formatDateTime, formatDuration, medicationEntries, relTime } from '../utils';

export interface ReportViewProps {
  event: CprEvent;
  onBack: () => void;
}

interface ComplianceItem {
  criterion: string;
  ok: boolean | undefined;
  note: string;
}

/** Verificação automática de conformidade com ACLS 2020 a partir dos registros */
function computeCompliance(event: CprEvent): ComplianceItem[] {
  const items: ComplianceItem[] = [];
  const shocks = entriesOf(event, 'choque');
  const rhythms = entriesOf(event, 'ritmo');
  const firstShockable = rhythms.find((r) => r.data?.shockable === true);
  const duration = (event.endedAt ?? Date.now()) - event.startedAt;

  if (firstShockable) {
    const firstShock = shocks[0];
    const ok = firstShock !== undefined && firstShock.at - event.startedAt < 3 * 60 * 1000;
    items.push({
      criterion: 'Desfibrilação em < 3 minutos',
      ok,
      note: firstShock ? relTime(event, firstShock.at) : 'Nenhum choque registrado',
    });
  }

  const adren = medicationEntries(event, 'Adrenalina');
  if (adren.length >= 2) {
    const intervalsOk = adren.every((dose, i) => {
      if (i === 0) {
        return true;
      }
      const gap = dose.at - adren[i - 1].at;
      return gap >= 2 * 60 * 1000 && gap <= 6 * 60 * 1000;
    });
    items.push({
      criterion: 'Adrenalina a cada 3-5 minutos',
      ok: intervalsOk,
      note: intervalsOk ? 'Intervalos corretos' : 'Intervalo fora da janela detectado',
    });
  } else if (adren.length === 1) {
    items.push({ criterion: 'Adrenalina administrada', ok: true, note: relTime(event, adren[0].at) });
  }

  const amio = medicationEntries(event, 'Amiodarona');
  if (amio.length > 0) {
    const thirdShock = shocks[2];
    const ok = thirdShock !== undefined && amio[0].at >= thirdShock.at;
    items.push({
      criterion: 'Amiodarona após 3º choque',
      ok,
      note: relTime(event, amio[0].at),
    });
  }

  const expectedChecks = Math.floor(duration / (2 * 60 * 1000));
  const checksOk = expectedChecks === 0 ? true : cycleCount(event) >= expectedChecks * 0.75;
  items.push({
    criterion: 'Verificação de ritmo a cada 2 minutos',
    ok: checksOk,
    note: `${cycleCount(event)} verificações em ${formatDuration(duration)}`,
  });

  items.push({
    criterion: 'Critério de encerramento registrado',
    ok: Boolean(event.outcome),
    note:
      event.outcome === 'RCE'
        ? 'RCE obtida'
        : event.outcome === 'OBITO'
          ? 'Interrupção documentada'
          : event.outcome === 'ECMO'
            ? 'Transferência ECMO'
            : 'Não registrado',
  });

  return items;
}

function medRows(event: CprEvent): JSX.Element[] {
  return medicationEntries(event).map((m: LogEntry) => (
    <tr key={m.id}>
      <td>{String(m.data?.name ?? '')}</td>
      <td>{String(m.data?.dose ?? '')}</td>
      <td>{String(m.data?.route ?? '')}</td>
      <td>{relTime(event, m.at)}</td>
      <td>{m.performer ?? '—'}</td>
      <td>{m.data?.warnings ? 'Registrada com aviso de validação' : '—'}</td>
    </tr>
  ));
}

export function ReportView(props: ReportViewProps): JSX.Element {
  const { event, onBack } = props;
  const duration = (event.endedAt ?? Date.now()) - event.startedAt;
  const shocks = entriesOf(event, 'choque');
  const rhythms = entriesOf(event, 'ritmo');
  const interventions = entriesOf(event, 'intervencao');
  const vitals = entriesOf(event, 'sinais-vitais');
  const complications = entriesOf(event, 'complicacao');
  const compliance = computeCompliance(event);
  const okCount = compliance.filter((c) => c.ok).length;
  const compliancePct = compliance.length > 0 ? Math.round((okCount / compliance.length) * 100) : 100;

  const outcomeText =
    event.outcome === 'RCE'
      ? 'Retorno de Circulação Espontânea (RCE)'
      : event.outcome === 'ECMO'
        ? 'Transferência para ECMO'
        : event.outcome === 'OBITO'
          ? 'Óbito'
          : 'Não registrado';

  return (
    <div>
      <div className="no-print" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button className="btn btn-gold" onClick={() => window.print()}>
          Exportar PDF / Imprimir
        </button>
        <button className="btn btn-ghost" onClick={onBack}>
          ← Voltar ao resumo
        </button>
      </div>

      <div className="report">
        {/* Cabeçalho */}
        <div className="rpt-header">
          <img src="/logo.jpg" alt="Logo" />
          <div>
            <h1>{APP_NAME}</h1>
            <div style={{ color: '#777', fontStyle: 'italic' }}>{TAGLINE}</div>
            <div style={{ fontWeight: 700, marginTop: 6, fontSize: 15 }}>RELATÓRIO DE REANIMAÇÃO CARDIOPULMONAR</div>
          </div>
        </div>
        <dl className="kv" style={{ marginTop: 12 }}>
          <dt>Hospital:</dt>
          <dd>{event.hospital || '—'}</dd>
          <dt>Unidade / Local:</dt>
          <dd>{event.location || '—'}</dd>
          <dt>Data do evento:</dt>
          <dd>{formatDate(event.startedAt)}</dd>
          <dt>Hora de início:</dt>
          <dd>{new Date(event.startedAt).toLocaleTimeString('pt-BR')}</dd>
          <dt>Hora de término:</dt>
          <dd>{event.endedAt ? new Date(event.endedAt).toLocaleTimeString('pt-BR') : '—'}</dd>
          <dt>Duração total:</dt>
          <dd>{formatDuration(duration)}</dd>
          <dt>Relatório gerado em:</dt>
          <dd>{formatDateTime(Date.now())}</dd>
          <dt>Gerado por:</dt>
          <dd>{event.signedBy ?? event.team.find((m) => m.role === 'Coordenador')?.name ?? '—'}</dd>
        </dl>

        <h2>1. Dados do Paciente</h2>
        <dl className="kv">
          <dt>Nome:</dt>
          <dd>{event.patient.name || '—'}</dd>
          <dt>Número de prontuário:</dt>
          <dd>{event.patient.recordId || '—'}</dd>
          <dt>Data de nascimento:</dt>
          <dd>{event.patient.birthDate ? event.patient.birthDate.split('-').reverse().join('/') : '—'}</dd>
          <dt>Idade:</dt>
          <dd>{event.patient.age ? `${event.patient.age} anos` : '—'}</dd>
          <dt>Sexo:</dt>
          <dd>{event.patient.sex || '—'}</dd>
          <dt>Alergias:</dt>
          <dd>{event.patient.allergies || 'Sem alergias conhecidas'}</dd>
          <dt>Comorbidades:</dt>
          <dd>{event.patient.comorbidities || '—'}</dd>
          <dt>Medicações em uso:</dt>
          <dd>{event.patient.medications || '—'}</dd>
        </dl>

        <h2>2. Contexto Clínico</h2>
        <dl className="kv">
          <dt>Causa presumida:</dt>
          <dd>{event.presumedCause}</dd>
          <dt>Tempo colapso → RCP:</dt>
          <dd>{event.collapseToStartMin ? `${event.collapseToStartMin} min` : '—'}</dd>
          <dt>Testemunhado:</dt>
          <dd>{event.witnessed ? 'Sim' : 'Não'}</dd>
          <dt>Descrição:</dt>
          <dd>{event.clinicalContext || '—'}</dd>
        </dl>

        <h2>3. Equipe Presente</h2>
        {event.team.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Papel</th>
                <th>Nome</th>
              </tr>
            </thead>
            <tbody>
              {event.team.map((m) => (
                <tr key={m.role}>
                  <td>{m.role}</td>
                  <td>{m.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Equipe não registrada.</p>
        )}

        <h2>4. Cronologia de Eventos</h2>
        <table>
          <thead>
            <tr>
              <th>Tempo</th>
              <th>Evento</th>
              <th>Responsável</th>
            </tr>
          </thead>
          <tbody>
            {event.entries.map((e) => (
              <tr key={e.id}>
                <td>{relTime(event, e.at)}</td>
                <td>{e.label}</td>
                <td>{e.performer ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>5. Ritmos Cardíacos Registrados</h2>
        {rhythms.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Tempo</th>
                <th>Ritmo</th>
                <th>Chocável</th>
              </tr>
            </thead>
            <tbody>
              {rhythms.map((r) => (
                <tr key={r.id}>
                  <td>{relTime(event, r.at)}</td>
                  <td>{String(r.data?.name ?? '')}</td>
                  <td>{r.data?.shockable ? 'Sim' : 'Não'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Nenhum ritmo registrado.</p>
        )}

        <h2>6. Medicações Administradas</h2>
        {medicationEntries(event).length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Medicação</th>
                <th>Dose</th>
                <th>Via</th>
                <th>Tempo</th>
                <th>Responsável</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>{medRows(event)}</tbody>
          </table>
        ) : (
          <p>Nenhuma medicação registrada.</p>
        )}

        <h2>7. Desfibrilações</h2>
        {shocks.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Choque</th>
                <th>Tempo</th>
                <th>Energia</th>
                <th>Ritmo pré-choque</th>
                <th>Responsável</th>
              </tr>
            </thead>
            <tbody>
              {shocks.map((s) => (
                <tr key={s.id}>
                  <td>{String(s.data?.number ?? '')}º</td>
                  <td>{relTime(event, s.at)}</td>
                  <td>{String(s.data?.energy ?? '')} J</td>
                  <td>{String(s.data?.rhythmBefore ?? '—')}</td>
                  <td>{s.performer ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Nenhuma desfibrilação registrada.</p>
        )}

        <h2>8. Outras Intervenções</h2>
        {interventions.length > 0 ? (
          <ul>
            {interventions.map((i) => (
              <li key={i.id}>
                <strong>{relTime(event, i.at)}</strong> — {i.label}
                {i.performer ? ` (${i.performer})` : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhuma intervenção adicional registrada.</p>
        )}

        <h2>9. Qualidade de RCP</h2>
        <p className="narrative">{event.qualityNote || 'Sem observações registradas sobre qualidade de compressão/ventilação.'}</p>

        <h2>10. Sinais Vitais Registrados</h2>
        {vitals.length > 0 ? (
          <ul>
            {vitals.map((v) => (
              <li key={v.id}>
                <strong>{relTime(event, v.at)}</strong> — {v.label}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhum registro de sinais vitais.</p>
        )}

        <h2>11. Complicações</h2>
        {complications.length > 0 ? (
          <ul>
            {complications.map((c) => (
              <li key={c.id}>
                <strong>{relTime(event, c.at)}</strong> — {c.label}
                {c.performer ? ` (${c.performer})` : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhuma complicação registrada.</p>
        )}

        <h2>12. Resultado Final</h2>
        <dl className="kv">
          <dt>Resultado da RCP:</dt>
          <dd>{outcomeText}</dd>
          <dt>Detalhes:</dt>
          <dd>{event.outcomeDetail || '—'}</dd>
          <dt>Duração total de RCP:</dt>
          <dd>{formatDuration(duration)}</dd>
          <dt>Prognóstico estimado:</dt>
          <dd>{event.prognosis || '—'}</dd>
          <dt>Próximas ações:</dt>
          <dd className="narrative">{event.nextActions || '—'}</dd>
        </dl>

        <h2>13. Narrativa Clínica</h2>
        <p className="narrative">{event.narrative || 'Narrativa não preenchida.'}</p>

        <h2>14. Conformidade com Diretrizes ACLS 2020</h2>
        <table>
          <thead>
            <tr>
              <th>Critério</th>
              <th>Status</th>
              <th>Observação</th>
            </tr>
          </thead>
          <tbody>
            {compliance.map((c) => (
              <tr key={c.criterion}>
                <td>{c.criterion}</td>
                <td className={c.ok ? 'ok' : 'nok'}>{c.ok ? '✓ Sim' : '✗ Não'}</td>
                <td>{c.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          <strong>Conformidade geral: {compliancePct}%</strong>
        </p>

        <h2>15. Assinatura e Validação</h2>
        {event.signedAt ? (
          <dl className="kv">
            <dt>Coordenador de RCP:</dt>
            <dd>{event.signedBy}</dd>
            <dt>Especialidade:</dt>
            <dd>{event.signedSpecialty || '—'}</dd>
            <dt>Registro profissional:</dt>
            <dd>{event.signedCrm}</dd>
            <dt>Assinatura digital:</dt>
            <dd>Assinado em {formatDateTime(event.signedAt)}</dd>
            <dt>Confirmação:</dt>
            <dd className="ok">✓ Validado</dd>
          </dl>
        ) : (
          <p className="nok">Documento ainda não assinado digitalmente.</p>
        )}

        <h2>Trilha de Auditoria</h2>
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Quem</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {event.audit.map((a, i) => (
              <tr key={i}>
                <td>{formatDateTime(a.at)}</td>
                <td>{a.who}</td>
                <td>{a.what}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Rodapé */}
        <div className="rpt-footer">
          <strong>{APP_NAME}</strong> — {TAGLINE}
          <br />
          Documento confidencial — Uso restrito a profissionais de saúde autorizados
        </div>
      </div>
    </div>
  );
}
