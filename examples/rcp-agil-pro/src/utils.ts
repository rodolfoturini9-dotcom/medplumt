import { CprEvent, LogEntry, RhythmCode } from './types';

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Formata duração em MM:SS (ou HH:MM:SS acima de 1h) */
export function formatDuration(ms: number): string {
  if (ms < 0) {
    ms = 0;
  }
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR');
}

/** Tempo relativo ao início da RCP, ex: "02:35" */
export function relTime(event: CprEvent, ts: number): string {
  return formatDuration(ts - event.startedAt);
}

export function lastEntryOf(event: CprEvent, type: LogEntry['type']): LogEntry | undefined {
  for (let i = event.entries.length - 1; i >= 0; i--) {
    if (event.entries[i].type === type) {
      return event.entries[i];
    }
  }
  return undefined;
}

export function entriesOf(event: CprEvent, type: LogEntry['type']): LogEntry[] {
  return event.entries.filter((e) => e.type === type);
}

export function currentRhythm(event: CprEvent): RhythmCode | undefined {
  const last = lastEntryOf(event, 'ritmo');
  return last?.data?.code as RhythmCode | undefined;
}

export function shockCount(event: CprEvent): number {
  return entriesOf(event, 'choque').length;
}

export function medicationEntries(event: CprEvent, name?: string): LogEntry[] {
  const meds = entriesOf(event, 'medicacao');
  return name ? meds.filter((m) => m.data?.name === name) : meds;
}

export function cycleCount(event: CprEvent): number {
  return entriesOf(event, 'ritmo').length;
}
