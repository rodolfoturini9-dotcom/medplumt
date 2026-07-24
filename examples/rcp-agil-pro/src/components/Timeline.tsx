import { JSX, useState } from 'react';
import { CprEvent } from '../types';
import { relTime } from '../utils';

export interface TimelineProps {
  event: CprEvent;
  onUpdate?: (event: CprEvent) => void;
  editable?: boolean;
}

const TYPE_ICONS: Record<string, string> = {
  inicio: '▶',
  ritmo: '♥',
  choque: '⚡',
  medicacao: '💉',
  compressoes: '↓',
  pausa: '⏸',
  intervencao: '✚',
  'sinais-vitais': '📈',
  complicacao: '⚠',
  rce: '✓',
  interrupcao: '■',
  ecmo: '→',
  nota: '✎',
};

export function Timeline(props: TimelineProps): JSX.Element {
  const { event, onUpdate, editable } = props;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  function saveEdit(id: string): void {
    if (!onUpdate || !editText.trim()) {
      setEditingId(null);
      return;
    }
    const old = event.entries.find((e) => e.id === id);
    const updated: CprEvent = {
      ...event,
      entries: event.entries.map((e) => (e.id === id ? { ...e, label: editText.trim() } : e)),
      audit: [
        ...event.audit,
        { at: Date.now(), who: 'Registrador', what: `Registro editado: "${old?.label}" → "${editText.trim()}"` },
      ],
    };
    onUpdate(updated);
    setEditingId(null);
  }

  return (
    <div className="timeline">
      {event.entries.map((e) => (
        <div className="timeline-item" key={e.id}>
          <span className="t">{relTime(event, e.at)}</span>
          <span aria-hidden>{TYPE_ICONS[e.type] ?? '·'}</span>
          <div style={{ flex: 1 }}>
            {editingId === e.id ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={editText} onChange={(ev) => setEditText(ev.target.value)} autoFocus />
                <button className="btn btn-green btn-sm" onClick={() => saveEdit(e.id)}>
                  ✓
                </button>
              </div>
            ) : (
              <>
                {e.label}
                {e.performer && <div className="who">por {e.performer}</div>}
              </>
            )}
          </div>
          {editable && editingId !== e.id && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ minHeight: 28, padding: '2px 8px' }}
              title="Editar registro (mudança auditada)"
              onClick={() => {
                setEditingId(e.id);
                setEditText(e.label);
              }}
            >
              ✎
            </button>
          )}
        </div>
      ))}
      <div className="timeline-item">
        <span className="t">{relTime(event, event.endedAt ?? Date.now())}</span>
        <span aria-hidden>●</span>
        <div style={{ color: 'var(--gray)' }}>{event.endedAt ? 'Evento encerrado' : '[Agora]'}</div>
      </div>
    </div>
  );
}
