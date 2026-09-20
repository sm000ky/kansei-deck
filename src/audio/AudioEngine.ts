// Pure Client-Side Procedural Web Audio Engine
// No external MP3/WAV assets required — 100% synthesized in real-time
// sm000ky × Zero Two // KANSEI DECK

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isInitialized = false;

  // Channel Gain Nodes
  private channelGains: Map<string, GainNode> = new Map();

  // Active Generators State & Intervals
  private activeGenerators: Map<string, any> = new Map();
  private isRunning = false;

  // Master Volume
  private masterVol = 0.8;

  constructor() {
    // Lazy init on first user gesture
  }

  public async init(): Promise<void> {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Master Analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.82;

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterVol, this.ctx.currentTime);

    // Routing: Channels -> masterGain -> analyser -> destination
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.isInitialized = true;
    this.isRunning = true;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getContextState(): string {
    return this.ctx ? this.ctx.state : 'uninitialized';
  }

  public setMasterVolume(val: number): void {
    this.masterVol = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.masterVol, this.ctx.currentTime, 0.05);
    }
  }

  public getMasterVolume(): number {
    return this.masterVol;
  }

  // Set individual channel volume
  public setChannelVolume(channelId: string, volume: number, isMuted: boolean): void {
    if (!this.isInitialized) return;
    const gainNode = this.getOrCreateChannelGain(channelId);
    const targetVol = isMuted ? 0 : Math.max(0, Math.min(1, volume));
    if (this.ctx) {
      gainNode.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.05);
    }

    // Start generator if volume > 0 and not already running
    if (targetVol > 0 && !this.activeGenerators.has(channelId)) {
      this.startGenerator(channelId);
    } else if (targetVol === 0 && this.activeGenerators.has(channelId)) {
      // Optional: keep running or sleep
    }
  }

  private getOrCreateChannelGain(channelId: string): GainNode {
    if (!this.channelGains.has(channelId)) {
      if (!this.ctx || !this.masterGain) throw new Error('AudioEngine not initialized');
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.connect(this.masterGain);
      this.channelGains.set(channelId, gain);
    }
    return this.channelGains.get(channelId)!;
  }

  // --- PROCEDURAL SOUND GENERATORS ---

  public startGenerator(channelId: string): void {
    if (!this.ctx || this.activeGenerators.has(channelId)) return;

    switch (channelId) {
      case 'rain':
        this.initRainGenerator();
        break;
      case 'vinyl':
        this.initVinylGenerator();
        break;
      case 'wind':
        this.initWindGenerator();
        break;
      case 'keys':
        this.initLoFiKeysGenerator();
        break;
      case 'binaural':
        this.initBinauralGenerator();
        break;
      case 'clock':
        this.initClockGenerator();
        break;
    }
  }

  // 1. TOKYO RAIN GENERATOR
  // Pink noise + low-pass filter + randomized droplet pings
  private initRainGenerator(): void {
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('rain');

    // Pink noise buffer
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
      b6 = white * 0.115926;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Filter to simulate soft rainfall against glass
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(850, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(targetGain);
    noiseSource.start();

    // Random droplet pings
    const dropletInterval = window.setInterval(() => {
      if (!this.ctx || targetGain.gain.value <= 0.001) return;
      if (Math.random() > 0.4) {
        this.triggerRaindrop(targetGain);
      }
    }, 180);

    this.activeGenerators.set('rain', { noiseSource, dropletInterval });
  }

  private triggerRaindrop(destination: GainNode): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freq = 1200 + Math.random() * 1400;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.015 + Math.random() * 0.02, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.045);

    osc.connect(gain);
    gain.connect(destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // 2. VINYL CRACKLE GENERATOR
  // Low rumble + micro-crackles/pops with analog texture
  private initVinylGenerator(): void {
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('vinyl');

    // Rumble oscillator (30Hz hum)
    const rumble = this.ctx.createOscillator();
    rumble.type = 'triangle';
    rumble.frequency.setValueAtTime(32, this.ctx.currentTime);

    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    rumble.connect(rumbleGain);
    rumbleGain.connect(targetGain);
    rumble.start();

    // Crackle pops interval
    const crackleInterval = window.setInterval(() => {
      if (!this.ctx || targetGain.gain.value <= 0.001) return;

      const count = Math.floor(Math.random() * 3);
      for (let c = 0; c < count; c++) {
        const popOsc = this.ctx.createOscillator();
        const popFilter = this.ctx.createBiquadFilter();
        const popGain = this.ctx.createGain();

        popOsc.type = 'square';
        popOsc.frequency.setValueAtTime(200 + Math.random() * 3500, this.ctx.currentTime);

        popFilter.type = 'bandpass';
        popFilter.frequency.setValueAtTime(1500 + Math.random() * 2000, this.ctx.currentTime);
        popFilter.Q.setValueAtTime(3, this.ctx.currentTime);

        const dur = 0.003 + Math.random() * 0.008;
        popGain.gain.setValueAtTime(0.03 + Math.random() * 0.07, this.ctx.currentTime);
        popGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);

        popOsc.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(targetGain);

        popOsc.start();
        popOsc.stop(this.ctx.currentTime + dur);
      }
    }, 75);

    this.activeGenerators.set('vinyl', { rumble, crackleInterval });
  }

  // 3. NIGHT WIND & CABIN HUM GENERATOR
  // Swept resonant bandpass noise + low spacecraft cabin frequency
  private initWindGenerator(): void {
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('wind');

    // White noise
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Resonant sweep filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    // LFO for slow wind gusts
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(220, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Cabin low hum (55Hz / A1)
    const hum = this.ctx.createOscillator();
    hum.type = 'sine';
    hum.frequency.setValueAtTime(55, this.ctx.currentTime);

    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(targetGain);
    hum.connect(humGain);
    humGain.connect(targetGain);

    noise.start();
    lfo.start();
    hum.start();

    this.activeGenerators.set('wind', { noise, lfo, hum });
  }

  // 4. LO-FI ELECTRIC KEYS / CHORD PROGRESSION GENERATOR
  // Neo-Tokyo jazzy lo-fi synth chord progression (Dmaj9 - Bm9 - Gmaj7 - A7sus4)
  // Tape wow/flutter vibrato + warm low-pass filter
  private initLoFiKeysGenerator(): void {
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('keys');

    // Chord progressions (frequencies in Hz)
    const chords = [
      // Dmaj9 (D3, F#3, A3, C#4, E4)
      [146.83, 185.00, 220.00, 277.18, 329.63],
      // Bm9 (B2, D3, F#3, A3, C#4)
      [123.47, 146.83, 185.00, 220.00, 277.18],
      // Gmaj7 (G2, B2, D3, F#3, B3)
      [98.00, 123.47, 146.83, 185.00, 246.94],
      // A7sus4 (A2, D3, E3, G3, B3)
      [110.00, 146.83, 164.81, 196.00, 246.94]
    ];

    let chordIndex = 0;

    const playChord = () => {
      if (!this.ctx || targetGain.gain.value <= 0.001) return;
      const notes = chords[chordIndex % chords.length];
      chordIndex++;

      const chordDuration = 4.2;
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        // Hybrid waveform for warm Rhodes/EP sound
        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Tape wow / flutter subtle vibrato
        const vibrato = this.ctx.createOscillator();
        const vibratoGain = this.ctx.createGain();
        vibrato.frequency.setValueAtTime(4.5 + Math.random() * 0.8, now);
        vibratoGain.gain.setValueAtTime(0.8, now);
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);
        vibrato.start(now);
        vibrato.stop(now + chordDuration);

        // Warm 24dB low-pass filter
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(700, now);
        filter.frequency.exponentialRampToValueAtTime(320, now + chordDuration);

        // Gentle envelope
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.06 / notes.length, now + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + chordDuration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(targetGain);

        osc.start(now);
        osc.stop(now + chordDuration);
      });
    };

    // Play immediately and loop every 4.5 seconds
    playChord();
    const chordInterval = window.setInterval(playChord, 4500);

    this.activeGenerators.set('keys', { chordInterval });
  }

  // 5. BINAURAL ALPHA DRONE (432Hz & 10Hz BEAT)
  // Left ear: 432Hz | Right ear: 442Hz -> Generates 10Hz alpha wave focus state
  private initBinauralGenerator(): void {
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('binaural');

    // Left channel (432 Hz)
    const oscL = this.ctx.createOscillator();
    oscL.type = 'sine';
    oscL.frequency.setValueAtTime(432, this.ctx.currentTime);

    const panL = this.ctx.createStereoPanner();
    panL.pan.setValueAtTime(-1, this.ctx.currentTime);

    // Right channel (442 Hz -> 10Hz Alpha beat)
    const oscR = this.ctx.createOscillator();
    oscR.type = 'sine';
    oscR.frequency.setValueAtTime(442, this.ctx.currentTime);

    const panR = this.ctx.createStereoPanner();
    panR.pan.setValueAtTime(1, this.ctx.currentTime);

    // Sub-bass warm foundation (108Hz octave down)
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(108, this.ctx.currentTime);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

    oscL.connect(panL);
    panL.connect(targetGain);

    oscR.connect(panR);
    panR.connect(targetGain);

    subOsc.connect(subGain);
    subGain.connect(targetGain);

    oscL.start();
    oscR.start();
    subOsc.start();

    this.activeGenerators.set('binaural', { oscL, oscR, subOsc });
  }

  // 6. MECHANICAL CLOCK & RHYTHM
  // Gentle tactile clock tick / mechanical metronome at 60 BPM
  private initClockGenerator(): void {
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('clock');

    let isHighTick = false;
    const clockInterval = window.setInterval(() => {
      if (!this.ctx || targetGain.gain.value <= 0.001) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Alternate tick-tock frequencies
      const freq = isHighTick ? 1400 : 980;
      isHighTick = !isHighTick;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.025);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, now);
      filter.Q.setValueAtTime(2.0, now);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(targetGain);

      osc.start(now);
      osc.stop(now + 0.03);
    }, 1000); // 60 BPM

    this.activeGenerators.set('clock', { clockInterval });
  }

  // --- SPECIAL FX ---

  // Pomodoro Completion Bell Chime
  public playChime(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio

    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.1);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 1.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 2.0);
    });
  }

  // UI Micro-interaction click sound
  public playClick(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.015);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.02);
  }
}

// Export singleton
export const audioEngine = new AudioEngine();
