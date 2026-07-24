import { JSX, useEffect, useRef, useState } from 'react';
import { METRONOME_DEFAULT_BPM, METRONOME_MAX_BPM, METRONOME_MIN_BPM } from '../constants';
import { Metronome } from '../metronome';

export interface MetronomePanelProps {
  /** Notifica início/parada para registro na timeline */
  onToggle?: (running: boolean, bpm: number) => void;
}

export function MetronomePanel(props: MetronomePanelProps): JSX.Element {
  const metronomeRef = useRef<Metronome | null>(null);
  const [bpm, setBpm] = useState(METRONOME_DEFAULT_BPM);
  const [running, setRunning] = useState(false);
  const [beatOn, setBeatOn] = useState(false);

  useEffect(() => {
    const m = new Metronome(METRONOME_DEFAULT_BPM);
    m.onBeat = () => {
      setBeatOn(true);
      window.setTimeout(() => setBeatOn(false), 110);
    };
    metronomeRef.current = m;
    return () => m.dispose();
  }, []);

  function toggle(): void {
    const m = metronomeRef.current;
    if (!m) {
      return;
    }
    if (m.running) {
      m.stop();
      setRunning(false);
      props.onToggle?.(false, m.bpm);
    } else {
      m.start();
      setRunning(true);
      props.onToggle?.(true, m.bpm);
    }
  }

  function adjust(delta: number): void {
    const m = metronomeRef.current;
    if (!m) {
      return;
    }
    const next = Math.min(METRONOME_MAX_BPM, Math.max(METRONOME_MIN_BPM, m.bpm + delta));
    m.setBpm(next);
    setBpm(next);
  }

  const inRange = bpm >= METRONOME_MIN_BPM && bpm <= METRONOME_MAX_BPM;

  return (
    <div className="metronome">
      <h3 style={{ margin: '0 0 10px', color: 'var(--gold)', textTransform: 'uppercase', fontSize: 15, letterSpacing: 1 }}>
        Metrônomo de Compressões
      </h3>
      <div className="beat-row">
        <div className={`beat-dot ${beatOn ? 'on' : ''}`} aria-hidden />
        <div>
          <div className="bpm">{bpm} bpm</div>
          <div className={inRange ? 'bpm-ok' : ''} style={inRange ? undefined : { color: 'var(--orange)' }}>
            {inRange ? '✓ Frequência adequada (100-120 bpm)' : 'Ajuste para 100-120 bpm'}
          </div>
          {running && <div style={{ fontSize: 12, color: 'var(--gray)' }}>Som alto contínuo + vibração sincronizada</div>}
        </div>
        <div className="controls">
          <button className="btn btn-sm" onClick={() => adjust(-5)} disabled={bpm <= METRONOME_MIN_BPM}>
            − Diminuir
          </button>
          <button className="btn btn-sm" onClick={() => adjust(5)} disabled={bpm >= METRONOME_MAX_BPM}>
            + Aumentar
          </button>
          <button className={`btn btn-sm ${running ? 'btn-orange' : 'btn-green'}`} onClick={toggle}>
            {running ? 'Pausar' : 'Iniciar Compressões'}
          </button>
        </div>
      </div>
    </div>
  );
}
