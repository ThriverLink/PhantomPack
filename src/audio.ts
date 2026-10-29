/**
 * Tiny synthesized sound kit. No audio files, no network, no autoplay: the
 * context is created on the first user gesture (a button click or a grab).
 */

export class PhantomAudio {
  private context: AudioContext | undefined;
  private master: GainNode | undefined;
  private noiseBuffer: AudioBuffer | undefined;
  private muted = false;

  ensure(): void {
    if (this.context) {
      if (this.context.state === 'suspended') {
        void this.context.resume();
      }
      return;
    }
    const AudioContextConstructor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextConstructor) {
      return;
    }
    const context = new AudioContextConstructor();
    const master = context.createGain();
    master.gain.value = 0.55;
    master.connect(context.destination);
    this.context = context;
    this.master = master;

    const length = Math.floor(context.sampleRate * 0.8);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master) {
      this.master.gain.value = this.muted ? 0 : 0.55;
    }
    return this.muted;
  }

  click(): void {
    this.tone(520, 0.06, 'triangle', 0.12, 660);
  }

  buy(): void {
    this.tone(660, 0.1, 'sine', 0.16, 880);
    this.tone(990, 0.14, 'sine', 0.1, 1320, 0.09);
  }

  open(): void {
    this.tone(280, 0.12, 'triangle', 0.1, 420);
    this.noise(0.12, 0.05, 1800);
  }

  close(): void {
    this.tone(220, 0.1, 'sine', 0.08, 160);
  }

  light(): void {
    this.noise(0.28, 0.08, 2600);
    this.tone(180, 0.18, 'sawtooth', 0.06, 90);
  }

  puff(): void {
    this.noise(0.34, 0.09, 900);
    this.tone(120, 0.2, 'sine', 0.04, 80);
  }

  chime(): void {
    this.tone(880, 0.22, 'sine', 0.11, 880);
    this.tone(1320, 0.32, 'sine', 0.07, 1320, 0.06);
  }

  confetti(): void {
    this.noise(0.5, 0.12, 3200);
    this.tone(660, 0.16, 'triangle', 0.1, 990);
    this.tone(990, 0.2, 'triangle', 0.08, 1480, 0.12);
    this.tone(1320, 0.26, 'sine', 0.06, 1760, 0.24);
  }

  crush(): void {
    this.noise(0.24, 0.13, 420);
    this.tone(90, 0.22, 'sawtooth', 0.06, 55);
  }

  private tone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    gain: number,
    endFrequency: number,
    delay = 0,
  ): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master) {
      return;
    }
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(30, endFrequency),
      start + duration,
    );
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  private noise(duration: number, gain: number, cutoff: number): void {
    const context = this.context;
    const master = this.master;
    const buffer = this.noiseBuffer;
    if (!context || !master || !buffer) {
      return;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    filter.Q.value = 0.7;
    const envelope = context.createGain();
    const start = context.currentTime;
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(master);
    source.start(start);
    source.stop(start + duration + 0.02);
  }
}
