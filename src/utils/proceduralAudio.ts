class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private rainGain: GainNode | null = null;
  private riverGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private muted = false;
  private initialized = false;

  public init(): void {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Create 2-second looping pink-ish noise buffer for rain & river flow
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
        b6 = white * 0.115926;
      }

      // Rain stream
      const rainSource = this.ctx.createBufferSource();
      rainSource.buffer = noiseBuffer;
      rainSource.loop = true;
      this.rainFilter = this.ctx.createBiquadFilter();
      this.rainFilter.type = 'bandpass';
      this.rainFilter.frequency.value = 1800;
      this.rainFilter.Q.value = 0.6;
      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.value = 0;
      rainSource.connect(this.rainFilter);
      this.rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.ctx.destination);
      rainSource.start();

      // River stream
      const riverSource = this.ctx.createBufferSource();
      riverSource.buffer = noiseBuffer;
      riverSource.loop = true;
      const riverFilter = this.ctx.createBiquadFilter();
      riverFilter.type = 'lowpass';
      riverFilter.frequency.value = 420;
      this.riverGain = this.ctx.createGain();
      this.riverGain.gain.value = 0;
      riverSource.connect(riverFilter);
      riverFilter.connect(this.riverGain);
      this.riverGain.connect(this.ctx.destination);
      riverSource.start();

      this.initialized = true;
    } catch {
      // Ignore audio errors on restricted devices
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.muted && this.ctx) {
      const now = this.ctx.currentTime;
      this.rainGain?.gain.setTargetAtTime(0, now, 0.08);
      this.riverGain?.gain.setTargetAtTime(0, now, 0.08);
    }
  }

  public updateAmbience(rainfallMmHr: number, waterLevelM: number): void {
    if (!this.ctx || !this.rainGain || !this.riverGain || !this.rainFilter) return;
    if (this.muted) return;
    const now = this.ctx.currentTime;
    const rainTarget = Math.min(0.22, (rainfallMmHr / 150) * 0.22);
    const riverTarget = 0.03 + Math.min(0.14, Math.max(0, (waterLevelM - 1.2) / 3.8) * 0.14);
    this.rainGain.gain.setTargetAtTime(rainTarget, now, 0.25);
    this.rainFilter.frequency.setTargetAtTime(1200 + (rainfallMmHr / 150) * 1400, now, 0.25);
    this.riverGain.gain.setTargetAtTime(riverTarget, now, 0.25);
  }

  public playTone(type: 'click' | 'toggleOn' | 'toggleOff' | 'success' | 'error' | 'station'): void {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.06);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'toggleOn') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.11);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'toggleOff') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.1);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (type === 'station') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.07);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.26);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.09);
      osc.frequency.setValueAtTime(783.99, now + 0.18);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      osc.start(now);
      osc.stop(now + 0.38);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.linearRampToValueAtTime(175, now + 0.18);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.24);
    }
  }
}

export const audioEngine = new ProceduralAudioEngine();
