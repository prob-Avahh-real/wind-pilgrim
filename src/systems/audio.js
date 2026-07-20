/** Procedural chirps & wind bed — no external assets. */
export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.wind = null;
    this.gain = null;
  }

  ensure() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0.35;
    this.gain.connect(this.ctx.destination);
    this._startWind();
  }

  resume() {
    this.ensure();
    this.ctx?.resume();
  }

  _startWind() {
    if (!this.ctx) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.35;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 280;
    filter.Q.value = 0.7;

    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.08;

    noise.connect(filter);
    filter.connect(windGain);
    windGain.connect(this.gain);
    noise.start();
    this.wind = { noise, filter, windGain };
  }

  setWindIntensity(t) {
    if (!this.wind) return;
    this.wind.windGain.gain.setTargetAtTime(0.04 + t * 0.14, this.ctx.currentTime, 0.2);
    this.wind.filter.frequency.setTargetAtTime(220 + t * 400, this.ctx.currentTime, 0.2);
  }

  chirp(pitch = 1, remote = false) {
    this.ensure();
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const base = remote ? 520 : 660;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base * pitch, t0);
    osc.frequency.exponentialRampToValueAtTime(base * pitch * 1.6, t0 + 0.18);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(remote ? 0.18 : 0.28, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
    osc.connect(g);
    g.connect(this.gain);
    osc.start(t0);
    osc.stop(t0 + 0.6);
  }
}
