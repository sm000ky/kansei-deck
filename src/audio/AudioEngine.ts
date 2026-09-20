// Pure Client-Side Procedural Web Audio Engine v2.0
// 100% Real-Time Synthesized — Zero External Samples / Anti-LMK Safe
// sm000ky × Zero Two // KANSEI DECK

import { MasterEqProfile } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterEqLow: BiquadFilterNode | null = null;
  private masterEqHigh: BiquadFilterNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isInitialized = false;

  // Channel Gain Nodes
  private channelGains: Map<string, GainNode> = new Map();

  // Active Generators State & Intervals
  private activeGenerators: Map<string, any> = new Map();

  // Master Volume & Profile
  private masterVol = 0.8;
  private currentProfile: MasterEqProfile = 'flat';

  // Binaural Beat Frequency (Hz)
  private binauralBeatFreq = 10.0; // default 10Hz Alpha

  constructor() {
    // Lazy initialization
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

    // Master EQ Filters (Low & High)
    this.masterEqLow = this.ctx.createBiquadFilter();
    this.masterEqLow.type = 'lowshelf';
    this.masterEqLow.frequency.setValueAtTime(250, this.ctx.currentTime);
    this.masterEqLow.gain.setValueAtTime(0, this.ctx.currentTime);

    this.masterEqHigh = this.ctx.createBiquadFilter();
    this.masterEqHigh.type = 'lowpass';
    this.masterEqHigh.frequency.setValueAtTime(20000, this.ctx.currentTime);
    this.masterEqHigh.Q.setValueAtTime(0.7, this.ctx.currentTime);

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterVol, this.ctx.currentTime);

    // Routing: Channels -> masterGain -> masterEqLow -> masterEqHigh -> analyser -> destination
    this.masterGain.connect(this.masterEqLow);
    this.masterEqLow.connect(this.masterEqHigh);
    this.masterEqHigh.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.isInitialized = true;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public setMasterVolume(val: number): void {
    this.masterVol = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
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
      // Warm lo-fi: cut harsh highs above 2800Hz, warm boost at 200Hz
      this.masterEqHigh.frequency.setTargetAtTime(3200, now, 0.05);
      this.masterEqLow.gain.setTargetAtTime(3.5, now, 0.05);
    } else if (profile === 'cyber') {
      // Crisp cyber: open highs with high shelf clarity, tight bass
      this.masterEqHigh.frequency.setTargetAtTime(18000, now, 0.05);
      this.masterEqLow.gain.setTargetAtTime(-1.5, now, 0.05);
    } else {
      // Flat bypass
      this.masterEqHigh.frequency.setTargetAtTime(20000, now, 0.05);
      this.masterEqLow.gain.setTargetAtTime(0, now, 0.05);
    }
  }

  public getMasterProfile(): MasterEqProfile {
    return this.currentProfile;
  }

  // Set individual channel volume with smooth ramping
  public setChannelVolume(channelId: string, volume: number, isMuted: boolean): void {
    if (!this.isInitialized || !this.ctx) return;
    const gainNode = this.getOrCreateChannelGain(channelId);
    const targetVol = isMuted ? 0 : Math.max(0, Math.min(1, volume));

    gainNode.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.04);

    // Auto-start generator if not yet active
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

  // Helper to create a seamless looping pink noise buffer with crossfaded edges
  private createCrossfadedPinkNoise(seconds = 5): AudioBuffer {
    if (!this.ctx) throw new Error('No context');
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
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
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
      b6 = white * 0.115926;
    }

    // Apply smooth sine crossfade on the first and last 250ms to guarantee zero clicks on loop
    const fadeLen = Math.floor(sampleRate * 0.25);
    for (let i = 0; i < fadeLen; i++) {
      const t = i / fadeLen;
      const fadeIn = Math.sin((t * Math.PI) / 2);
      const fadeOut = Math.cos((t * Math.PI) / 2);
      // Blend ends
      const blended = data[i] * fadeIn + data[bufferSize - fadeLen + i] * fadeOut;
      data[i] = blended;
      data[bufferSize - fadeLen + i] = blended;
    }

    return buffer;
  }

  // --- PROCEDURAL GENERATORS ---

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
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('rain');

    const buffer = this.createCrossfadedPinkNoise(5);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(850, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(targetGain);
    noiseSource.start();

    // Randomized droplet pings
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

    gain.gain.setValueAtTime(0.018 + Math.random() * 0.02, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.045);

    osc.connect(gain);
    gain.connect(destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // 2. VINYL CRACKLE
  private initVinylGenerator(): void {
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('vinyl');

    const rumble = this.ctx.createOscillator();
    rumble.type = 'triangle';
    rumble.frequency.setValueAtTime(32, this.ctx.currentTime);

    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    rumble.connect(rumbleGain);
    rumbleGain.connect(targetGain);
    rumble.start();

    const crackleInterval = window.setInterval(() => {
      if (!this.ctx || targetGain.gain.value <= 0.001) return;

      const count = Math.floor(Math.random() * 3);
      for (let c = 0; c < count; c++) {
        const popOsc = this.ctx.createOscillator();
        const popFilter = this.ctx.createBiquadFilter();
        const popGain = this.ctx.createGain();

        popOsc.type = 'square';
        popOsc.frequency.setValueAtTime(300 + Math.random() * 3500, this.ctx.currentTime);

        popFilter.type = 'bandpass';
        popFilter.frequency.setValueAtTime(1500 + Math.random() * 2200, this.ctx.currentTime);
        popFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

        const dur = 0.004 + Math.random() * 0.007;
        popGain.gain.setValueAtTime(0.04 + Math.random() * 0.07, this.ctx.currentTime);
        popGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);

        popOsc.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(targetGain);

        popOsc.start();
        popOsc.stop(this.ctx.currentTime + dur);
      }
    }, 70);

    this.activeGenerators.set('vinyl', { rumble, crackleInterval });
  }

  // 3. NIGHT WIND & CABIN HUM
  private initWindGenerator(): void {
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('wind');

    const buffer = this.createCrossfadedPinkNoise(4);
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(360, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.2, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.1, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(200, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const hum = this.ctx.createOscillator();
    hum.type = 'sine';
    hum.frequency.setValueAtTime(55, this.ctx.currentTime);

    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.07, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(targetGain);
    hum.connect(humGain);
    humGain.connect(targetGain);

    noise.start();
    lfo.start();
    hum.start();

    this.activeGenerators.set('wind', { noise, lfo, hum });
  }

  // 4. LO-FI RHODES / JAZZ CHORD PROGRESSIONS
  private initLoFiKeysGenerator(): void {
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('keys');

    // 4 Distinct Lo-Fi Chord Progressions
    const progressions = [
      // 1. Neo-Tokyo Melancholy: Dmaj9 -> Bm9 -> Gmaj7 -> A7sus4
      [[146.83, 185.0, 220.0, 277.18, 329.63], [123.47, 146.83, 185.0, 220.0, 277.18], [98.0, 123.47, 146.83, 185.0, 246.94], [110.0, 146.83, 164.81, 196.0, 246.94]],
      // 2. Shibuya Nightfall: Cmaj9 -> Am9 -> Fmaj7 -> G9
      [[130.81, 164.81, 196.0, 246.94, 293.66], [110.0, 130.81, 164.81, 196.0, 246.94], [87.31, 130.81, 164.81, 174.61, 261.63], [98.0, 123.47, 146.83, 174.61, 293.66]],
      // 3. Sunset Reverie: Ebmaj9 -> Cm9 -> Abmaj7 -> Bb7sus
      [[155.56, 196.0, 233.08, 293.66, 349.23], [130.81, 155.56, 196.0, 233.08, 293.66], [103.83, 155.56, 196.0, 261.63, 311.13], [116.54, 155.56, 174.61, 207.65, 311.13]]
    ];

    let progIdx = 0;
    let chordIdx = 0;

    const playChord = () => {
      if (!this.ctx || targetGain.gain.value <= 0.001) return;
      const currentProg = progressions[progIdx % progressions.length];
      const notes = currentProg[chordIdx % currentProg.length];
      chordIdx++;
      if (chordIdx % currentProg.length === 0) progIdx++;

      const chordDuration = 4.4;
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        // Dual oscillators for rich Rhodes body
        osc1.type = idx % 2 === 0 ? 'triangle' : 'sine';
        osc1.frequency.setValueAtTime(freq, now);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 1.002, now); // subtle detune chorus

        // Tape wow & flutter vibrato
        const vibrato = this.ctx.createOscillator();
        const vibratoGain = this.ctx.createGain();
        vibrato.frequency.setValueAtTime(4.2 + Math.random() * 0.8, now);
        vibratoGain.gain.setValueAtTime(0.9, now);
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc1.frequency);
        vibratoGain.connect(osc2.frequency);
        vibrato.start(now);
        vibrato.stop(now + chordDuration);

        // Warm 24dB low-pass filter
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(750, now);
        filter.frequency.exponentialRampToValueAtTime(320, now + chordDuration);

        // Envelope
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.07 / notes.length, now + 0.1);
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
    const chordInterval = window.setInterval(playChord, 4600);
    this.activeGenerators.set('keys', { chordInterval });
  }

  // 5. BINAURAL ALPHA/THETA DRONE
  private initBinauralGenerator(): void {
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('binaural');

    const baseFreq = 432;
    const beat = this.binauralBeatFreq;

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

  // 6. MECHANICAL CLOCK & METRONOME
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

      const freq = isHighTick ? 1400 : 950;
      isHighTick = !isHighTick;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.025);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, now);
      filter.Q.setValueAtTime(2.2, now);

      gain.gain.setValueAtTime(0.055, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(targetGain);

      osc.start(now);
      osc.stop(now + 0.03);
    }, 1000); // 60 BPM

    this.activeGenerators.set('clock', { clockInterval });
  }

  // 7. OCEAN SURF / WAVES (潮騒)
  // Low-frequency modulated pink noise swell simulating rolling waves
  private initWavesGenerator(): void {
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('waves');

    const buffer = this.createCrossfadedPinkNoise(6);
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // Wave swell LFO (slow 0.08Hz swell)
    const swellLfo = this.ctx.createOscillator();
    swellLfo.type = 'sine';
    swellLfo.frequency.setValueAtTime(0.08, this.ctx.currentTime);

    const swellGain = this.ctx.createGain();
    swellGain.gain.setValueAtTime(320, this.ctx.currentTime);

    swellLfo.connect(swellGain);
    swellGain.connect(filter.frequency);

    // Secondary volume swell
    const volGain = this.ctx.createGain();
    volGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

    const volLfo = this.ctx.createOscillator();
    volLfo.type = 'sine';
    volLfo.frequency.setValueAtTime(0.08, this.ctx.currentTime);

    const volLfoGain = this.ctx.createGain();
    volLfoGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    volLfo.connect(volLfoGain);
    volLfoGain.connect(volGain.gain);

    noise.connect(filter);
    filter.connect(volGain);
    volGain.connect(targetGain);

    noise.start();
    swellLfo.start();
    volLfo.start();

    this.activeGenerators.set('waves', { noise, swellLfo, volLfo });
  }

  // 8. CAMPFIRE & FIREPLACE (焚き火)
  // Warm low rumble + sharp snappy wood crackles
  private initFireGenerator(): void {
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('fire');

    // Fire hearth low rumble
    const rumble = this.ctx.createOscillator();
    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(45, this.ctx.currentTime);
    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    rumble.connect(rumbleGain);
    rumbleGain.connect(targetGain);
    rumble.start();

    // Wood crackle bursts
    const fireInterval = window.setInterval(() => {
      if (!this.ctx || targetGain.gain.value <= 0.001) return;

      if (Math.random() > 0.3) {
        const popOsc = this.ctx.createOscillator();
        const popFilter = this.ctx.createBiquadFilter();
        const popGain = this.ctx.createGain();

        popOsc.type = 'sawtooth';
        popOsc.frequency.setValueAtTime(600 + Math.random() * 2400, this.ctx.currentTime);

        popFilter.type = 'bandpass';
        popFilter.frequency.setValueAtTime(1200 + Math.random() * 1800, this.ctx.currentTime);
        popFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

        const dur = 0.015 + Math.random() * 0.03;
        popGain.gain.setValueAtTime(0.06 + Math.random() * 0.09, this.ctx.currentTime);
        popGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);

        popOsc.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(targetGain);

        popOsc.start();
        popOsc.stop(this.ctx.currentTime + dur);
      }
    }, 90);

    this.activeGenerators.set('fire', { rumble, fireInterval });
  }

  // 9. CYBER CAFE MURMUR (カフェ)
  // Diffuse warm ambient murmur + gentle ceramic clinks
  private initCafeGenerator(): void {
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('cafe');

    const buffer = this.createCrossfadedPinkNoise(5);
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(targetGain);
    noise.start();

    // Ceramic cup/spoon clinks
    const clinkInterval = window.setInterval(() => {
      if (!this.ctx || targetGain.gain.value <= 0.001) return;
      if (Math.random() > 0.65) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const freq = 2400 + Math.random() * 1800;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.02 + Math.random() * 0.025, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(targetGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.09);
      }
    }, 600);

    this.activeGenerators.set('cafe', { noise, clinkInterval });
  }

  // 10. COSMIC AURORA PAD (オーロラ)
  // Ethereal dual-sine harmonic drone with slow shimmer
  private initAuroraGenerator(): void {
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('aurora');

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(216, this.ctx.currentTime); // A3 harmonic

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(324, this.ctx.currentTime); // E4 5th harmonic

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    // Shimmer LFO
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);

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

  // Pomodoro Completion Chime (Pentatonic Bell Arpeggio)
  public playChime(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6

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

  // UI Click sound
  public playClick(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.015);

    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.02);
  }
}

export const audioEngine = new AudioEngine();
