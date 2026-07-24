import { CprEvent } from './types';

const EVENTS_KEY = 'rcp-agil-pro:events';

/**
 * Persistência local (modo offline).
 * Backup automático: saveEvent() é chamado a cada ação registrada,
 * permitindo recuperação de falha ao reabrir o app.
 */
export function loadEvents(): CprEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as CprEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEvent(event: CprEvent): void {
  const events = loadEvents();
  const idx = events.findIndex((e) => e.id === event.id);
  if (idx >= 0) {
    events[idx] = event;
  } else {
    events.unshift(event);
  }
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

export function deleteEvent(id: string): void {
  const events = loadEvents().filter((e) => e.id !== id);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

/** Evento em andamento (sem hora de término) para recuperação de falha */
export function findActiveEvent(): CprEvent | undefined {
  return loadEvents().find((e) => !e.endedAt);
}
