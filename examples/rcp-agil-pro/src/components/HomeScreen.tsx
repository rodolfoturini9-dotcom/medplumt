import { JSX } from 'react';
import { APP_NAME, TAGLINE } from '../constants';
import { deleteEvent } from '../storage';
import { CprEvent } from '../types';
import { formatDateTime, formatDuration } from '../utils';

export interface HomeScreenProps {
  events: CprEvent[];
  onNew: () => void;
  onOpen: (event: CprEvent) => void;
  onRefresh: () => void;
}

function outcomeBadge(event: CprEvent): JSX.Element {
  if (!event.endedAt) {
    return <span className="badge badge-gold">EM ANDAMENTO</span>;
  }
  switch (event.outcome) {
    case 'RCE':
      return <span className="badge badge-green">RCE</span>;
    case 'ECMO':
      return <span className="badge badge-orange">ECMO</span>;
    case 'OBITO':
      return <span className="badge badge-red">ÓBITO</span>;
    default:
      return <span className="badge badge-gold">ENCERRADO</span>;
  }
}

export function HomeScreen(props: HomeScreenProps): JSX.Element {
  const { events, onNew, onOpen, onRefresh } = props;
  return (
    <div>
      <div className="home-hero">
        <img src="/logo.jpg" alt={`Logo ${APP_NAME}`} />
        <h1>{APP_NAME}</h1>
        <p>{TAGLINE}</p>
        <button className="btn btn-red" style={{ minWidth: 280, fontSize: 20 }} onClick={onNew}>
          + NOVO EVENTO RCP
        </button>
      </div>
      <h2 className="section-title">Eventos Registrados</h2>
      {events.length === 0 && <p style={{ color: 'var(--gray)' }}>Nenhum evento registrado ainda.</p>}
      {events.map((e) => (
        <div className="event-card" key={e.id}>
          <div>
            <strong>{e.patient.name || 'Paciente sem nome'}</strong>{' '}
            <span style={{ color: 'var(--gray)' }}>· {e.location || 'Local não informado'}</span>
            <div style={{ fontSize: 13, color: 'var(--silver)' }}>
              {formatDateTime(e.startedAt)}
              {e.endedAt ? ` · Duração ${formatDuration(e.endedAt - e.startedAt)}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {outcomeBadge(e)}
            <button className="btn btn-gold btn-sm" onClick={() => onOpen(e)}>
              {e.endedAt ? 'Abrir' : 'Retomar'}
            </button>
            {e.endedAt && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  if (window.confirm('Excluir este evento permanentemente?')) {
                    deleteEvent(e.id);
                    onRefresh();
                  }
                }}
              >
                Excluir
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
