/**
 * Metrônomo de compressões com som alto e contínuo (Web Audio API).
 * Frequência ajustável 100-120 bpm, indicação visual sincronizada e
 * feedback tátil (vibração) quando suportado pelo dispositivo.
 */
export class Metronome {
  private ctx: AudioContext | null = null;
  private timer: number | null = null;
  private nextBeatTime = 0;
  private beatIndex = 0;
  private _bpm: number;
  private _running = false;
  onBeat: ((index: number) => void) | null = null;

  constructor(bpm: number) {
    this._bpm = bpm;
  }

  get bpm(): number {
    return this._bpm;
  }

  get running(): boolean {
    return this._running;
  }

  setBpm(bpm: number): void {
    this._bpm = bpm;
  }

  start(): void {
    if (this._running) {
      return;
    }
    this.ctx = this.ctx ?? new AudioContext();
    void this.ctx.resume();
    this._running = true;
    this.nextBeatTime = this.ctx.currentTime + 0.05;
    this.beatIndex = 0;
    // Agendamento com lookahead para precisão temporal
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  stop(): void {
    this._running = false;
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  dispose(): void {
    this.stop();
    void this.ctx?.close();
    this.ctx = null;
  }

  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || !this._running) {
      return;
    }
    while (this.nextBeatTime < ctx.currentTime + 0.1) {
      this.playClick(this.nextBeatTime, this.beatIndex);
      const t = this.nextBeatTime;
      const idx = this.beatIndex;
      const delayMs = Math.max(0, (t - ctx.currentTime) * 1000);
      window.setTimeout(() => {
        this.onBeat?.(idx);
        if (navigator.vibrate) {
          navigator.vibrate(40);
        }
      }, delayMs);
      this.nextBeatTime += 60 / this._bpm;
      this.beatIndex++;
    }
  }

  private playClick(time: number, index: number): void {
    const ctx = this.ctx as AudioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    // Batida acentuada a cada 10 (marca ~contagem de ciclos de compressão)
    const accent = index % 10 === 0;
    osc.type = 'square';
    osc.frequency.value = accent ? 1320 : 880;
    // Ganho alto — som deve ser audível em ambiente crítico
    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.1);
  }
}

/** Bipe de alerta isolado (ações vencidas, alertas temporais) */
export function alertBeep(): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
    window.setTimeout(() => void ctx.close(), 800);
    if (navigator.vibrate) {
      navigator.vibrate([120, 60, 120]);
    }
  } catch {
    // áudio indisponível — alerta visual permanece
  }
}
