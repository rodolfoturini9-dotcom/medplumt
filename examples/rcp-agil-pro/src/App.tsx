import { JSX, useCallback, useEffect, useState } from 'react';
import { GuidelinesModal } from './components/GuidelinesModal';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { NewEventForm } from './components/NewEventForm';
import { ReportView } from './components/ReportView';
import { ResuscitationScreen } from './components/ResuscitationScreen';
import { SplashScreen } from './components/SplashScreen';
import { SummaryScreen } from './components/SummaryScreen';
import { findActiveEvent, loadEvents, saveEvent } from './storage';
import { CprEvent, LogEntry } from './types';
import { newId } from './utils';

type Phase = 'splash' | 'home' | 'new' | 'active' | 'summary' | 'report';

export function App(): JSX.Element {
  const [phase, setPhase] = useState<Phase>('splash');
  const [event, setEvent] = useState<CprEvent | undefined>(undefined);
  const [events, setEvents] = useState<CprEvent[]>([]);
  const [showGuidelines, setShowGuidelines] = useState(false);

  useEffect(() => {
    // Splash breve; recuperação de falha: retoma evento em andamento
    const t = window.setTimeout(() => {
      setEvents(loadEvents());
      const active = findActiveEvent();
      if (active) {
        setEvent(active);
        setPhase('active');
      } else {
        setPhase('home');
      }
    }, 1400);
    return () => window.clearTimeout(t);
  }, []);

  const persist = useCallback((updated: CprEvent) => {
    setEvent(updated);
    saveEvent(updated); // backup automático a cada ação
    setEvents(loadEvents());
  }, []);

  const startEvent = useCallback(
    (created: CprEvent) => {
      const withStart: CprEvent = {
        ...created,
        entries: [
          {
            id: newId(),
            type: 'inicio',
            at: created.startedAt,
            label: 'RCP iniciada',
            performer: created.team.find((m) => m.role === 'Coordenador')?.name,
          },
        ],
        audit: [
          ...created.audit,
          { at: Date.now(), who: created.team.find((m) => m.role === 'Registrador')?.name ?? 'Sistema', what: 'Evento criado' },
        ],
      };
      persist(withStart);
      setPhase('active');
    },
    [persist]
  );

  const addEntry = useCallback(
    (entry: LogEntry) => {
      if (!event) {
        return;
      }
      const updated: CprEvent = {
        ...event,
        entries: [...event.entries, entry],
        audit: [...event.audit, { at: Date.now(), who: entry.performer ?? 'Equipe', what: entry.label }],
      };
      persist(updated);
    },
    [event, persist]
  );

  const endEvent = useCallback(
    (finished: CprEvent) => {
      persist(finished);
      setPhase('summary');
    },
    [persist]
  );

  const openEvent = useCallback((e: CprEvent) => {
    setEvent(e);
    setPhase(e.endedAt ? 'summary' : 'active');
  }, []);

  if (phase === 'splash') {
    return <SplashScreen />;
  }

  return (
    <div className="app">
      <Header
        event={phase === 'active' || phase === 'summary' || phase === 'report' ? event : undefined}
        onHome={phase === 'active' ? undefined : () => setPhase('home')}
        onGuidelines={() => setShowGuidelines(true)}
      />
      <div className="main">
        {phase === 'home' && (
          <HomeScreen events={events} onNew={() => setPhase('new')} onOpen={openEvent} onRefresh={() => setEvents(loadEvents())} />
        )}
        {phase === 'new' && <NewEventForm onCancel={() => setPhase('home')} onStart={startEvent} />}
        {phase === 'active' && event && (
          <ResuscitationScreen event={event} onAddEntry={addEntry} onEnd={endEvent} onUpdate={persist} />
        )}
        {phase === 'summary' && event && (
          <SummaryScreen event={event} onUpdate={persist} onReport={() => setPhase('report')} onHome={() => setPhase('home')} />
        )}
        {phase === 'report' && event && <ReportView event={event} onBack={() => setPhase('summary')} />}
      </div>
      {showGuidelines && <GuidelinesModal onClose={() => setShowGuidelines(false)} />}
    </div>
  );
}
