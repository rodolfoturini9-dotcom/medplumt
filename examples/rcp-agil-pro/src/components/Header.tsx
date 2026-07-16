import { JSX } from 'react';
import { APP_NAME } from '../constants';
import { CprEvent } from '../types';

export interface HeaderProps {
  event?: CprEvent;
  onHome?: () => void;
  onGuidelines: () => void;
}

export function Header(props: HeaderProps): JSX.Element {
  const { event, onHome, onGuidelines } = props;
  return (
    <div className="header no-print">
      <img className="logo-sm" src="/logo.jpg" alt="Logo" />
      <span className="brand">{APP_NAME}</span>
      <span className="context">
        {event ? `Paciente: ${event.patient.name || '—'} | ID: ${event.patient.recordId || '—'}` : ''}
      </span>
      <button className="btn btn-ghost btn-sm" onClick={onGuidelines}>
        Diretrizes
      </button>
      {onHome && (
        <button className="btn btn-ghost btn-sm" onClick={onHome}>
          Início
        </button>
      )}
    </div>
  );
}
