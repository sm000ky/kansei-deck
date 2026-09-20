// Pure Client-Side Procedural Web Audio Engine v4.0 (Studio DSP Grade)
// Zero Audio-Thread Dropouts • Pre-Rendered Organic Looping Buffers
// Built-in Master Dynamics Compressor / Limiter (Zero Digital Clipping)
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

  // Channel Gain Nodes & Master Channel Volume Store
  private channelGains: Map<string, GainNode> = new Map();
  private channelVolumes: Map<string, number> = new Map();
  private channelMutes: Map<string, boolean> = new Map();

  // Active Generators (BufferSources & Oscillators)
  private activeGenerators: Map<string, any> = new Map();

  // Pre-rendered Audio Buffers (Calculated once at init, zero runtime GC!)
  private rainBuffer: AudioBuffer | null = null;
  private vinylBuffer: AudioBuffer | null = null;
  private wavesBuffer: AudioBuffer | null = null;
  private fireBuffer: AudioBuffer | null = null;
  private cafeBuffer: AudioBuffer | null = null;

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
    // Completely eliminates digital clipping, pops, and distortion when multiple channels sum together!
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-10, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.12, this.ctx.currentTime);

    // 4. Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterVol, this.ctx.currentTime);

    // Routing Chain: Channels -> masterGain -> masterEqLow -> masterEqHigh -> compressor -> analyser -> destination
    this.masterGain.connect(this.masterEqLow);
    this.masterEqLow.connect(this.masterEqHigh);
    this.masterEqHigh.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // 5. Pre-render all procedural buffers once (Zero runtime GC dropouts)
    this.preRenderBuffers();

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

  // --- PRE-RENDERING ORGANIC BUFFERS (ZERO GC IN RUNTIME LOOP) ---

  private preRenderBuffers(): void {
    if (!this.ctx) return;
    const sr = this.ctx.sampleRate;
    const dur = 8; // 8-second seamless looping buffers
    const len = sr * dur;

    // 1. Rain Buffer (Pink noise + soft droplet pings baked in)
    this.rainBuffer = this.ctx.createBuffer(1, len, sr);
    const rData = this.rainBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      rData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.15;
      b6 = white * 0.115926;
    }
    // Bake in occasional soft water droplet ripples
    const numDroplets = 24;
    for (let d = 0; d < numDroplets; d++) {
      const startIdx = Math.floor(Math.random() * (len - 4000));
      const freq = 1400 + Math.random() * 1200;
      for (let s = 0; s < 2500; s++) {
        const t = s / sr;
        const env = Math.exp(-t * 80);
        rData[startIdx + s] += Math.sin(2 * Math.PI * freq * t) * env * 0.04;
      }
    }
    this.applyCrossfade(rData, sr, 0.4);

    // 2. Vinyl Buffer (Analog surface warmth + subtle gentle turntable dust)
    this.vinylBuffer = this.ctx.createBuffer(1, len, sr);
    const vData = this.vinylBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      // Warm low-frequency vinyl hiss
      vData[i] = (Math.random() * 2 - 1) * 0.025;
    }
    // Bake in soft, organic turntable dust pops (soft bandpassed impulses, not harsh square waves!)
    const numDustPops = 35;
    for (let p = 0; p < numDustPops; p++) {
      const startIdx = Math.floor(Math.random() * (len - 1000));
      const popFreq = 800 + Math.random() * 1500;
      for (let s = 0; s < 400; s++) {
        const t = s / sr;
        const env = Math.exp(-t * 300);
        vData[startIdx + s] += Math.sin(2 * Math.PI * popFreq * t) * env * 0.08;
      }
    }
    this.applyCrossfade(vData, sr, 0.4);

    // 3. Waves Buffer (Rolling ocean surf swell)
    this.wavesBuffer = this.ctx.createBuffer(1, len, sr);
    const wData = this.wavesBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      // 0.125 Hz swell cycle = 8 second wave rhythm
      const swell = (Math.sin(2 * Math.PI * 0.125 * t - Math.PI / 2) + 1) / 2;
      const shapedSwell = Math.pow(swell, 2.5); // organic wave crest
      wData[i] = (Math.random() * 2 - 1) * 0.18 * (0.15 + shapedSwell * 0.85);
    }
    this.applyCrossfade(wData, sr, 0.5);

    // 4. Fire Buffer (Cozy fireplace wood snaps)
    this.fireBuffer = this.ctx.createBuffer(1, len, sr);
    const fData = this.fireBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      fData[i] = (Math.random() * 2 - 1) * 0.02; // subtle air hiss
    }
    const numSnaps = 40;
    for (let s = 0; s < numSnaps; s++) {
      const startIdx = Math.floor(Math.random() * (len - 2000));
      const snapFreq = 600 + Math.random() * 1800;
      for (let i = 0; i < 800; i++) {
        const t = i / sr;
        const env = Math.exp(-t * 200);
        fData[startIdx + i] += Math.sin(2 * Math.PI * snapFreq * t) * env * 0.15;
      }
    }
    this.applyCrossfade(fData, sr, 0.4);

    // 5. Cafe Buffer (Warm diffuse room murmur)
    this.cafeBuffer = this.ctx.createBuffer(1, len, sr);
    const cData = this.cafeBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      cData[i] = (Math.random() * 2 - 1) * 0.035;
    }
    const numClinks = 12;
    for (let c = 0; c < numClinks; c++) {
      const startIdx = Math.floor(Math.random() * (len - 3000));
      const clinkFreq = 2600 + Math.random() * 800;
      for (let s = 0; s < 1800; s++) {
        const t = s / sr;
        const env = Math.exp(-t * 70);
        cData[startIdx + s] += Math.sin(2 * Math.PI * clinkFreq * t) * env * 0.03;
      }
    }
    this.applyCrossfade(cData, sr, 0.4);
  }

  private applyCrossfade(data: Float32Array, sr: number, fadeSeconds: number): void {
    const fadeLen = Math.floor(sr * fadeSeconds);
    const totalLen = data.length;
    for (let i = 0; i < fadeLen; i++) {
      const t = i / fadeLen;
      const fadeIn = Math.sin((t * Math.PI) / 2);
      const fadeOut = Math.cos((t * Math.PI) / 2);
      const blended = data[i] * fadeIn + data[totalLen - fadeLen + i] * fadeOut;
      data[i] = blended;
      data[totalLen - fadeLen + i] = blended;
    }
  }

  // --- SOUND GENERATORS ---

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

  // 1. TOKYO RAIN (雨音) - Continuous pre-rendered looping buffer
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

  // 2. VINYL CRACKLE (レコード) - Continuous warm surface noise + 38Hz turntable rumble
  private initVinylGenerator(): void {
    if (!this.ctx || !this.vinylBuffer) return;
    const targetGain = this.getOrCreateChannelGain('vinyl');

    // Continuous looping vinyl buffer
    const source = this.ctx.createBufferSource();
    source.buffer = this.vinylBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    // Warm turntable rumble (38Hz)
    const rumble = this.ctx.createOscillator();
    rumble.type = 'triangle';
    rumble.frequency.setValueAtTime(38, this.ctx.currentTime);

    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(targetGain);
    rumble.connect(rumbleGain);
    rumbleGain.connect(targetGain);

    source.start();
    rumble.start();

    this.activeGenerators.set('vinyl', { source, rumble });
  }

  // 3. NIGHT WIND & CABIN HUM (風と客室)
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

  // 4. LO-FI RHODES / JAZZ CHORD PROGRESSIONS (チルピアノ)
  private initLoFiKeysGenerator(): void {
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('keys');

    const progressions = [
      [[146.83, 185.0, 220.0, 277.18, 329.63], [123.47, 146.83, 185.0, 220.0, 277.18], [98.0, 123.47, 146.83, 185.0, 246.94], [110.0, 146.83, 164.81, 196.0, 246.94]],
      [[130.81, 164.81, 196.0, 246.94, 293.66], [110.0, 130.81, 164.81, 196.0, 246.94], [87.31, 130.81, 164.81, 174.61, 261.63], [98.0, 123.47, 146.83, 174.61, 293.66]],
      [[155.56, 196.0, 233.08, 293.66, 349.23], [130.81, 155.56, 196.0, 233.08, 293.66], [103.83, 155.56, 196.0, 261.63, 311.13], [116.54, 155.56, 174.61, 207.65, 311.13]]
    ];

    let progIdx = 0;
    let chordIdx = 0;

    const playChord = () => {
      if (!this.ctx) return;
      const isMuted = this.channelMutes.get('keys');
      const vol = this.channelVolumes.get('keys') || 0;
      if (isMuted || vol <= 0.01) return;

      const currentProg = progressions[progIdx % progressions.length];
      const notes = currentProg[chordIdx % currentProg.length];
      chordIdx++;
      if (chordIdx % currentProg.length === 0) progIdx++;

      const chordDuration = 4.2;
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc1.type = idx % 2 === 0 ? 'triangle' : 'sine';
        osc1.frequency.setValueAtTime(freq, now);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 1.002, now);

        const vibrato = this.ctx.createOscillator();
        const vibratoGain = this.ctx.createGain();
        vibrato.frequency.setValueAtTime(4.2 + Math.random() * 0.8, now);
        vibratoGain.gain.setValueAtTime(0.9, now);
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc1.frequency);
        vibratoGain.connect(osc2.frequency);
        vibrato.start(now);
        vibrato.stop(now + chordDuration);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(950, now);
        filter.frequency.exponentialRampToValueAtTime(380, now + chordDuration);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.22 / notes.length, now + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + chordDuration);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(targetGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + chordDuration);
        osc2.stop(now + chordDuration);
      });
    };

    playChord();
    const chordInterval = window.setInterval(playChord, 4500);
    this.activeGenerators.set('keys', { chordInterval });
  }

  // 5. BINAURAL ALPHA DRONE (脳波シンク) - Meditative, silky smooth 216Hz + 10Hz alpha beat
  private initBinauralGenerator(): void {
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('binaural');

    const baseFreq = 216;
    const beat = 10.0;

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

    // Warm sub-drone foundation (108Hz)
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

  // 6. MECHANICAL CLOCK & METRONOME (機械時計)
  private initClockGenerator(): void {
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('clock');

    let isHighTick = false;
    const clockInterval = window.setInterval(() => {
      if (!this.ctx) return;
      const isMuted = this.channelMutes.get('clock');
      const vol = this.channelVolumes.get('clock') || 0;
      if (isMuted || vol <= 0.01) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      const freq = isHighTick ? 1400 : 950;
      isHighTick = !isHighTick;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.03);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, now);
      filter.Q.setValueAtTime(2.2, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(targetGain);

      osc.start(now);
      osc.stop(now + 0.035);
    }, 1000);

    this.activeGenerators.set('clock', { clockInterval });
  }

  // 7. OCEAN SURF / WAVES (潮騒) - Pre-rendered continuous rolling swell
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

  // 8. CAMPFIRE HEARTH (焚き火) - Continuous pre-rendered fireplace buffer
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

  // 9. CYBER CAFE (電脳喫茶) - Continuous pre-rendered room buffer
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

  // 10. COSMIC AURORA (極光) - Brian Eno style lush harmonic drone
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
