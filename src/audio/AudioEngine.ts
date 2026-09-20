// Pure Client-Side Procedural Web Audio Engine v5.0 (Zero-GC / True Background Resilience)
// 100% Seamless Looping Buffers (Mathematically Continuous Overlap)
// Zero Timers / Zero setInterval / Zero Background Dropouts
// Built-in Studio Master Dynamics Compressor
// sm000ky × Zero Two // KANSEI DECK

import { MasterEqProfile } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterEqLow: BiquadFilterNode | null = null;
  private masterEqHigh: BiquadFilterNode | null = null;
  private analyser: AnalyserNode | null = null;

  private isInitialized = false;
  private isPlaybackActive = false;

  // Channel Gain Nodes & Volume Store
  private channelGains: Map<string, GainNode> = new Map();
  private channelVolumes: Map<string, number> = new Map();
  private channelMutes: Map<string, boolean> = new Map();

  // Active Running Nodes
  private activeGenerators: Map<string, any> = new Map();

  // Pre-rendered Seamless Audio Buffers
  private rainBuffer: AudioBuffer | null = null;
  private rhodesBuffer: AudioBuffer | null = null;
  private vinylBuffer: AudioBuffer | null = null;
  private wavesBuffer: AudioBuffer | null = null;
  private fireBuffer: AudioBuffer | null = null;
  private cafeBuffer: AudioBuffer | null = null;
  private clockBuffer: AudioBuffer | null = null;

  // Master Volume & Profile
  private masterVol = 0.8;
  private currentProfile: MasterEqProfile = 'flat';

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

    // 1. Master Analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.85;

    // 2. Master EQ Filters
    this.masterEqLow = this.ctx.createBiquadFilter();
    this.masterEqLow.type = 'lowshelf';
    this.masterEqLow.frequency.setValueAtTime(250, this.ctx.currentTime);
    this.masterEqLow.gain.setValueAtTime(0, this.ctx.currentTime);

    this.masterEqHigh = this.ctx.createBiquadFilter();
    this.masterEqHigh.type = 'lowpass';
    this.masterEqHigh.frequency.setValueAtTime(20000, this.ctx.currentTime);
    this.masterEqHigh.Q.setValueAtTime(0.7, this.ctx.currentTime);

    // 3. Studio Master Dynamics Compressor (Limiter)
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

    // 4. Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterVol, this.ctx.currentTime);

    // Routing Chain: Channels -> masterGain -> masterEqLow -> masterEqHigh -> compressor -> analyser -> destination
    this.masterGain.connect(this.masterEqLow);
    this.masterEqLow.connect(this.masterEqHigh);
    this.masterEqHigh.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // 5. Pre-render all seamless buffers once (Zero runtime GC or setInterval timers!)
    this.preRenderAllBuffers();

    this.isInitialized = true;
    this.isPlaybackActive = true;
  }

  public async resumeContext(): Promise<void> {
    if (!this.ctx) {
      await this.init();
    } else if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public async setPlayback(active: boolean): Promise<void> {
    await this.resumeContext();
    this.isPlaybackActive = active;

    if (!this.masterGain || !this.ctx) return;
    const now = this.ctx.currentTime;

    if (active) {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.masterVol, now + 0.08);

      // Start any unstarted active channels
      this.channelVolumes.forEach((vol, id) => {
        const isMuted = this.channelMutes.get(id) || false;
        if (vol > 0 && !isMuted && !this.activeGenerators.has(id)) {
          this.startGenerator(id);
        }
      });
    } else {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0, now + 0.08);
    }
  }

  public isPlaying(): boolean {
    return this.isPlaybackActive && this.ctx?.state === 'running';
  }

  public setMasterVolume(val: number): void {
    this.masterVol = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && this.isPlaybackActive) {
      this.masterGain.gain.setTargetAtTime(this.masterVol, this.ctx.currentTime, 0.04);
    }
  }

  public getMasterVolume(): number {
    return this.masterVol;
  }

  public setMasterProfile(profile: MasterEqProfile): void {
    this.currentProfile = profile;
    if (!this.ctx || !this.masterEqLow || !this.masterEqHigh) return;

    const now = this.ctx.currentTime;
    if (profile === 'lofi') {
      this.masterEqHigh.frequency.setTargetAtTime(3400, now, 0.05);
      this.masterEqLow.gain.setTargetAtTime(2.5, now, 0.05);
    } else if (profile === 'cyber') {
      this.masterEqHigh.frequency.setTargetAtTime(18000, now, 0.05);
      this.masterEqLow.gain.setTargetAtTime(-1.0, now, 0.05);
    } else {
      this.masterEqHigh.frequency.setTargetAtTime(20000, now, 0.05);
      this.masterEqLow.gain.setTargetAtTime(0, now, 0.05);
    }
  }

  public setChannelVolume(channelId: string, volume: number, isMuted: boolean): void {
    this.channelVolumes.set(channelId, volume);
    this.channelMutes.set(channelId, isMuted);

    if (!this.isInitialized || !this.ctx) return;
    const gainNode = this.getOrCreateChannelGain(channelId);
    const targetVol = isMuted ? 0 : Math.max(0, Math.min(1, volume));

    gainNode.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.04);

    if (targetVol > 0 && !this.activeGenerators.has(channelId)) {
      this.startGenerator(channelId);
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

  // --- SEAMLESS BUFFER PRE-RENDERING (ZERO JITTER / ZERO BACKGROUND DROPOUTS) ---

  private preRenderAllBuffers(): void {
    if (!this.ctx) return;
    const sr = this.ctx.sampleRate;

    // Helper: generate continuous noise with perfect overlap crossfade
    const createSeamlessNoise = (
      seconds: number,
      overlapSec: number,
      generatorFn: (i: number, t: number) => number
    ): AudioBuffer => {
      const mainLen = Math.floor(sr * seconds);
      const overlapLen = Math.floor(sr * overlapSec);
      const totalLen = mainLen + overlapLen;

      const raw = new Float32Array(totalLen);
      for (let i = 0; i < totalLen; i++) {
        raw[i] = generatorFn(i, i / sr);
      }

      const buf = this.ctx!.createBuffer(1, mainLen, sr);
      const data = buf.getChannelData(0);

      for (let i = 0; i < mainLen; i++) {
        if (i < overlapLen) {
          const t = i / overlapLen;
          const fadeIn = Math.sin((t * Math.PI) / 2);
          const fadeOut = Math.cos((t * Math.PI) / 2);
          // Equal power crossfade with extra tail sample:
          data[i] = raw[i] * fadeIn + raw[mainLen + i] * fadeOut;
        } else {
          data[i] = raw[i];
        }
      }
      return buf;
    };

    // 1. Rain Buffer (6s continuous pink noise + gentle droplet pings)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    this.rainBuffer = createSeamlessNoise(6, 0.5, () => {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.14;
      b6 = white * 0.115926;
      return pink;
    });

    // 2. Vinyl Buffer (Gentle analog surface hiss - subtle & soft)
    this.vinylBuffer = createSeamlessNoise(6, 0.5, () => {
      return (Math.random() * 2 - 1) * 0.015;
    });

    // 3. Waves Buffer (8s rolling ocean surf swell)
    this.wavesBuffer = createSeamlessNoise(8, 0.6, (_i, t) => {
      const swell = (Math.sin(2 * Math.PI * 0.125 * t - Math.PI / 2) + 1) / 2;
      const shaped = Math.pow(swell, 2.4);
      return (Math.random() * 2 - 1) * 0.16 * (0.15 + shaped * 0.85);
    });

    // 4. Fire Buffer (Cozy fireplace crackle)
    const fireData = createSeamlessNoise(6, 0.5, () => {
      return (Math.random() * 2 - 1) * 0.015;
    });
    // Add soft wood pops
    const fCh = fireData.getChannelData(0);
    const fLen = fCh.length;
    for (let p = 0; p < 25; p++) {
      const start = Math.floor(Math.random() * (fLen - 1500));
      const freq = 700 + Math.random() * 1400;
      for (let s = 0; s < 600; s++) {
        const t = s / sr;
        fCh[start + s] += Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 220) * 0.08;
      }
    }
    this.fireBuffer = fireData;

    // 5. Cafe Buffer (Warm diffuse room murmur)
    this.cafeBuffer = createSeamlessNoise(6, 0.5, () => {
      return (Math.random() * 2 - 1) * 0.025;
    });

    // 6. Clock Buffer (1s tick-tock at 60 BPM)
    const clockBuf = this.ctx.createBuffer(1, sr, sr);
    const clkData = clockBuf.getChannelData(0);
    // Tick at t=0
    for (let s = 0; s < 1200; s++) {
      const t = s / sr;
      clkData[s] = Math.sin(2 * Math.PI * 1100 * t) * Math.exp(-t * 140) * 0.09;
    }
    this.clockBuffer = clockBuf;

    // 7. Lo-Fi Rhodes Buffer (16s loop of 4 lush chords: Dmaj9 -> Bm9 -> Gmaj7 -> A7sus4)
    // Pre-synthesized into a buffer so NO setInterval or dynamic node creation runs in background!
    const chordDur = 4.0;
    const chords = [
      [146.83, 185.0, 220.0, 277.18, 329.63], // Dmaj9
      [123.47, 146.83, 185.0, 220.0, 277.18], // Bm9
      [98.0, 123.47, 146.83, 185.0, 246.94],  // Gmaj7
      [110.0, 146.83, 164.81, 196.0, 246.94]  // A7sus4
    ];
    const totalChordLen = Math.floor(sr * chordDur * chords.length);
    const rhodesBuf = this.ctx.createBuffer(1, totalChordLen, sr);
    const rCh = rhodesBuf.getChannelData(0);

    chords.forEach((chordNotes, cIdx) => {
      const startSample = Math.floor(cIdx * chordDur * sr);
      const endSample = startSample + Math.floor(chordDur * sr);

      for (let s = startSample; s < endSample && s < totalChordLen; s++) {
        const t = (s - startSample) / sr;
        const env = Math.exp(-t * 0.9) * Math.min(1, t * 15); // soft attack & warm decay
        let sum = 0;
        chordNotes.forEach((freq, nIdx) => {
          // Subtle tape vibrato
          const vib = Math.sin(2 * Math.PI * 4.2 * t) * 1.2;
          const noteFreq = freq + vib;
          // Triangle + Sine harmonic blend
          const osc1 = nIdx % 2 === 0 ? Math.asin(Math.sin(2 * Math.PI * noteFreq * t)) * (2 / Math.PI) : Math.sin(2 * Math.PI * noteFreq * t);
          const osc2 = Math.sin(2 * Math.PI * noteFreq * 1.002 * t);
          sum += (osc1 * 0.6 + osc2 * 0.4);
        });
        rCh[s] = (sum / chordNotes.length) * env * 0.22;
      }
    });
    this.rhodesBuffer = rhodesBuf;
  }

  // --- START GENERATORS (PURE BUFFER LOOPS OR CONTINUOUS OSCILLATORS) ---

  public startGenerator(channelId: string): void {
    if (!this.ctx || this.activeGenerators.has(channelId)) return;

    switch (channelId) {
      case 'rain': this.initRainGenerator(); break;
      case 'vinyl': this.initVinylGenerator(); break;
      case 'wind': this.initWindGenerator(); break;
      case 'keys': this.initLoFiKeysGenerator(); break;
      case 'binaural': this.initBinauralGenerator(); break;
      case 'clock': this.initClockGenerator(); break;
      case 'waves': this.initWavesGenerator(); break;
      case 'fire': this.initFireGenerator(); break;
      case 'cafe': this.initCafeGenerator(); break;
      case 'aurora': this.initAuroraGenerator(); break;
    }
  }

  // 1. TOKYO RAIN
  private initRainGenerator(): void {
    if (!this.ctx || !this.rainBuffer) return;
    const targetGain = this.getOrCreateChannelGain('rain');

    const source = this.ctx.createBufferSource();
    source.buffer = this.rainBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(targetGain);
    source.start();

    this.activeGenerators.set('rain', { source });
  }

  // 2. VINYL WARMTH
  private initVinylGenerator(): void {
    if (!this.ctx || !this.vinylBuffer) return;
    const targetGain = this.getOrCreateChannelGain('vinyl');

    const source = this.ctx.createBufferSource();
    source.buffer = this.vinylBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const rumble = this.ctx.createOscillator();
    rumble.type = 'triangle';
    rumble.frequency.setValueAtTime(38, this.ctx.currentTime);

    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(targetGain);
    rumble.connect(rumbleGain);
    rumbleGain.connect(targetGain);

    source.start();
    rumble.start();

    this.activeGenerators.set('vinyl', { source, rumble });
  }

  // 3. NIGHT WIND & CABIN HUM
  private initWindGenerator(): void {
    if (!this.ctx || !this.rainBuffer) return;
    const targetGain = this.getOrCreateChannelGain('wind');

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.rainBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.2, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(220, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const hum = this.ctx.createOscillator();
    hum.type = 'sine';
    hum.frequency.setValueAtTime(55, this.ctx.currentTime);

    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.14, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(targetGain);
    hum.connect(humGain);
    humGain.connect(targetGain);

    noise.start();
    lfo.start();
    hum.start();

    this.activeGenerators.set('wind', { noise, lfo, hum });
  }

  // 4. LO-FI RHODES (Pure Buffer Loop - Zero Timers!)
  private initLoFiKeysGenerator(): void {
    if (!this.ctx || !this.rhodesBuffer) return;
    const targetGain = this.getOrCreateChannelGain('keys');

    const source = this.ctx.createBufferSource();
    source.buffer = this.rhodesBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.7, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(targetGain);
    source.start();

    this.activeGenerators.set('keys', { source });
  }

  // 5. BINAURAL ALPHA DRONE (Continuous Pure Sine Waves)
  private initBinauralGenerator(): void {
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('binaural');

    const baseFreq = 216; // A3
    const beat = 10.0;   // 10Hz Alpha

    const oscL = this.ctx.createOscillator();
    oscL.type = 'sine';
    oscL.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

    const panL = this.ctx.createStereoPanner();
    panL.pan.setValueAtTime(-1, this.ctx.currentTime);

    const oscR = this.ctx.createOscillator();
    oscR.type = 'sine';
    oscR.frequency.setValueAtTime(baseFreq + beat, this.ctx.currentTime);

    const panR = this.ctx.createStereoPanner();
    panR.pan.setValueAtTime(1, this.ctx.currentTime);

    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(108, this.ctx.currentTime);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    const toneGain = this.ctx.createGain();
    toneGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    oscL.connect(panL);
    panL.connect(toneGain);
    oscR.connect(panR);
    panR.connect(toneGain);
    subOsc.connect(subGain);
    subGain.connect(targetGain);
    toneGain.connect(targetGain);

    oscL.start();
    oscR.start();
    subOsc.start();

    this.activeGenerators.set('binaural', { oscL, oscR, subOsc });
  }

  // 6. MECHANICAL CLOCK (Pure Buffer Loop - Zero Timers!)
  private initClockGenerator(): void {
    if (!this.ctx || !this.clockBuffer) return;
    const targetGain = this.getOrCreateChannelGain('clock');

    const source = this.ctx.createBufferSource();
    source.buffer = this.clockBuffer;
    source.loop = true;

    source.connect(targetGain);
    source.start();

    this.activeGenerators.set('clock', { source });
  }

  // 7. OCEAN SURF / WAVES
  private initWavesGenerator(): void {
    if (!this.ctx || !this.wavesBuffer) return;
    const targetGain = this.getOrCreateChannelGain('waves');

    const source = this.ctx.createBufferSource();
    source.buffer = this.wavesBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(targetGain);
    source.start();

    this.activeGenerators.set('waves', { source });
  }

  // 8. CAMPFIRE HEARTH
  private initFireGenerator(): void {
    if (!this.ctx || !this.fireBuffer) return;
    const targetGain = this.getOrCreateChannelGain('fire');

    const source = this.ctx.createBufferSource();
    source.buffer = this.fireBuffer;
    source.loop = true;

    const rumble = this.ctx.createOscillator();
    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(45, this.ctx.currentTime);
    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    rumble.connect(rumbleGain);
    rumbleGain.connect(targetGain);

    source.connect(targetGain);
    source.start();
    rumble.start();

    this.activeGenerators.set('fire', { source, rumble });
  }

  // 9. CYBER CAFE
  private initCafeGenerator(): void {
    if (!this.ctx || !this.cafeBuffer) return;
    const targetGain = this.getOrCreateChannelGain('cafe');

    const source = this.ctx.createBufferSource();
    source.buffer = this.cafeBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(targetGain);
    source.start();

    this.activeGenerators.set('cafe', { source });
  }

  // 10. COSMIC AURORA (Lush Eno Drone)
  private initAuroraGenerator(): void {
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('aurora');

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(216, this.ctx.currentTime);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(324, this.ctx.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(300, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(targetGain);

    osc1.start();
    osc2.start();
    lfo.start();

    this.activeGenerators.set('aurora', { osc1, osc2, lfo });
  }

  // --- SPECIAL FX ---

  public playChime(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51];

    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.1);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 1.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 2.0);
    });
  }

  public playClick(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.015);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.02);
  }
}

export const audioEngine = new AudioEngine();
