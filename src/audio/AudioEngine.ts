// Pure Client-Side Procedural Web Audio Engine v6.0 (Zero-Crackle Background Master)
// latencyHint: 'playback' (Guaranteed buffer underrun protection in background / screen locked)
// Smooth Brownian Noise (Zero harsh static/spikes) • Zero CPU LFO Modulators
// ChannelMergerNode Stereo Routing (Zero Panner CPU load)
// sm000ky × Zero Two // KANSEI DECK

import { MasterEqProfile } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
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
  private windBuffer: AudioBuffer | null = null;
  private wavesBuffer: AudioBuffer | null = null;
  private fireBuffer: AudioBuffer | null = null;
  private cafeBuffer: AudioBuffer | null = null;
  private clockBuffer: AudioBuffer | null = null;

  // Master Volume & Profile
  private masterVol = 0.8;
  private currentProfile: MasterEqProfile = 'flat';

  constructor() {
    // Lazy init
  }

  public async init(): Promise<void> {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

    // CRITICAL: latencyHint 'playback' tells OS to allocate a large, safe hardware audio buffer.
    // This completely eliminates buffer underflow crackles when running in the background or with screen locked!
    this.ctx = new AudioContextClass({
      latencyHint: 'playback'
    });

    // 1. Master Analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.85;

    // 2. Master EQ Filters (Gentle, musical shelving)
    this.masterEqLow = this.ctx.createBiquadFilter();
    this.masterEqLow.type = 'lowshelf';
    this.masterEqLow.frequency.setValueAtTime(250, this.ctx.currentTime);
    this.masterEqLow.gain.setValueAtTime(0, this.ctx.currentTime);

    this.masterEqHigh = this.ctx.createBiquadFilter();
    this.masterEqHigh.type = 'lowpass';
    this.masterEqHigh.frequency.setValueAtTime(20000, this.ctx.currentTime);
    this.masterEqHigh.Q.setValueAtTime(0.7, this.ctx.currentTime);

    // 3. Master Gain (Pure linear gain, no compressor distortion!)
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterVol, this.ctx.currentTime);

    // Signal Path: Channels -> masterGain -> masterEqLow -> masterEqHigh -> analyser -> destination
    this.masterGain.connect(this.masterEqLow);
    this.masterEqLow.connect(this.masterEqHigh);
    this.masterEqHigh.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // 4. Pre-render all seamless buffers once
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
      this.masterEqHigh.frequency.setTargetAtTime(3600, now, 0.05);
      this.masterEqLow.gain.setTargetAtTime(2.0, now, 0.05);
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

  // --- SEAMLESS PRE-RENDERED BUFFERS ---

  private preRenderAllBuffers(): void {
    if (!this.ctx) return;
    const sr = this.ctx.sampleRate;

    // Helper: Creates seamless looping noise with 100% continuous overlap (ZERO boundary clicks)
    const createSeamlessBuffer = (
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
          data[i] = raw[i] * fadeIn + raw[mainLen + i] * fadeOut;
        } else {
          data[i] = raw[i];
        }
      }
      return buf;
    };

    // 1. Rain Buffer (Smooth brown/pink noise, no harsh white static)
    let brownLast = 0;
    this.rainBuffer = createSeamlessBuffer(6, 0.6, () => {
      const white = Math.random() * 2 - 1;
      brownLast = brownLast * 0.94 + white * 0.06;
      return brownLast * 1.8;
    });

    // 2. Vinyl Buffer (Subtle warm analog turntable floor)
    this.vinylBuffer = createSeamlessBuffer(6, 0.6, () => {
      return (Math.random() * 2 - 1) * 0.012;
    });

    // 3. Wind & Cabin Buffer (Pre-rendered wind swell + 55Hz spacecraft cabin foundation)
    this.windBuffer = createSeamlessBuffer(8, 0.8, (_i, t) => {
      const white = Math.random() * 2 - 1;
      const swell = (Math.sin(2 * Math.PI * 0.12 * t) + 1) / 2;
      const cabinHum = Math.sin(2 * Math.PI * 55 * t) * 0.25;
      return (white * 0.06 * (0.3 + swell * 0.7)) + cabinHum;
    });

    // 4. Waves Buffer (8s rolling ocean swell)
    this.wavesBuffer = createSeamlessBuffer(8, 0.8, (_i, t) => {
      const swell = (Math.sin(2 * Math.PI * 0.125 * t - Math.PI / 2) + 1) / 2;
      const shaped = Math.pow(swell, 2.2);
      return (Math.random() * 2 - 1) * 0.15 * (0.12 + shaped * 0.88);
    });

    // 5. Fire Buffer (Cozy fireplace with soft wood crackles)
    const fireData = createSeamlessBuffer(6, 0.6, () => {
      return (Math.random() * 2 - 1) * 0.012;
    });
    const fCh = fireData.getChannelData(0);
    const fLen = fCh.length;
    for (let p = 0; p < 20; p++) {
      const start = Math.floor(Math.random() * (fLen - 1200));
      const freq = 650 + Math.random() * 1200;
      for (let s = 0; s < 500; s++) {
        const t = s / sr;
        fCh[start + s] += Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 240) * 0.07;
      }
    }
    this.fireBuffer = fireData;

    // 6. Cafe Buffer (Warm diffuse room murmur)
    this.cafeBuffer = createSeamlessBuffer(6, 0.6, () => {
      return (Math.random() * 2 - 1) * 0.02;
    });

    // 7. Clock Buffer (1s tactile metronome)
    const clockBuf = this.ctx.createBuffer(1, sr, sr);
    const clkData = clockBuf.getChannelData(0);
    for (let s = 0; s < 1000; s++) {
      const t = s / sr;
      clkData[s] = Math.sin(2 * Math.PI * 1050 * t) * Math.exp(-t * 160) * 0.08;
    }
    this.clockBuffer = clockBuf;

    // 8. Lo-Fi Rhodes Buffer (16s loop of 4 warm jazz chords: Dmaj9 -> Bm9 -> Gmaj7 -> A7sus4)
    // Pure additive sine synthesis without asin/distortion — lush, silky, and clean!
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
        // Warm exponential envelope
        const env = Math.exp(-t * 0.85) * Math.min(1, t * 20);
        let sum = 0;
        chordNotes.forEach((freq) => {
          // Subtle tape vibrato
          const vibPhase = 2 * Math.PI * 4.2 * t;
          const vib = Math.sin(vibPhase) * 1.0;
          const noteFreq = freq + vib;
          // Fundamental sine + 2nd harmonic (warm Rhodes tone)
          const f1 = Math.sin(2 * Math.PI * noteFreq * t);
          const f2 = Math.sin(4 * Math.PI * noteFreq * t) * 0.3;
          sum += (f1 + f2);
        });
        rCh[s] = (sum / chordNotes.length) * env * 0.24;
      }
    });
    this.rhodesBuffer = rhodesBuf;
  }

  // --- START GENERATORS ---

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

  // 1. TOKYO RAIN (Silky smooth brown noise)
  private initRainGenerator(): void {
    if (!this.ctx || !this.rainBuffer) return;
    const targetGain = this.getOrCreateChannelGain('rain');

    const source = this.ctx.createBufferSource();
    source.buffer = this.rainBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.7, this.ctx.currentTime);

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

    source.connect(targetGain);
    source.start();

    this.activeGenerators.set('vinyl', { source });
  }

  // 3. NIGHT WIND & CABIN HUM (Pre-rendered wind swell)
  private initWindGenerator(): void {
    if (!this.ctx || !this.windBuffer) return;
    const targetGain = this.getOrCreateChannelGain('wind');

    const source = this.ctx.createBufferSource();
    source.buffer = this.windBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(targetGain);
    source.start();

    this.activeGenerators.set('wind', { source });
  }

  // 4. LO-FI RHODES (Clean, warm 16s chord progression)
  private initLoFiKeysGenerator(): void {
    if (!this.ctx || !this.rhodesBuffer) return;
    const targetGain = this.getOrCreateChannelGain('keys');

    const source = this.ctx.createBufferSource();
    source.buffer = this.rhodesBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.7, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(targetGain);
    source.start();

    this.activeGenerators.set('keys', { source });
  }

  // 5. BINAURAL ALPHA DRONE (ChannelMerger stereo routing - Zero CPU Panning)
  private initBinauralGenerator(): void {
    if (!this.ctx) return;
    const targetGain = this.getOrCreateChannelGain('binaural');

    const baseFreq = 216; // A3
    const beat = 10.0;   // 10Hz Alpha

    const oscL = this.ctx.createOscillator();
    oscL.type = 'sine';
    oscL.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

    const oscR = this.ctx.createOscillator();
    oscR.type = 'sine';
    oscR.frequency.setValueAtTime(baseFreq + beat, this.ctx.currentTime);

    // ChannelMergerNode: hardware stereo routing (0% CPU, no panner distortion!)
    const merger = this.ctx.createChannelMerger(2);
    oscL.connect(merger, 0, 0); // Left channel
    oscR.connect(merger, 0, 1); // Right channel

    const toneGain = this.ctx.createGain();
    toneGain.gain.setValueAtTime(0.28, this.ctx.currentTime);

    merger.connect(toneGain);
    toneGain.connect(targetGain);

    oscL.start();
    oscR.start();

    this.activeGenerators.set('binaural', { oscL, oscR });
  }

  // 6. MECHANICAL CLOCK
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
    filter.frequency.setValueAtTime(700, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.0, this.ctx.currentTime);

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

    source.connect(targetGain);
    source.start();

    this.activeGenerators.set('fire', { source });
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
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(targetGain);
    source.start();

    this.activeGenerators.set('cafe', { source });
  }

  // 10. COSMIC AURORA
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
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(targetGain);

    osc1.start();
    osc2.start();

    this.activeGenerators.set('aurora', { osc1, osc2 });
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
