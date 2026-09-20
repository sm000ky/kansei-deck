import { SoundChannel, SoundPreset } from '../types';

export const INITIAL_CHANNELS: SoundChannel[] = [
  {
    id: 'rain',
    name: 'Tokyo Rain',
    jpName: '雨音',
    description: 'Soft pink noise rainfall with randomized droplet pings against window glass',
    icon: 'CloudRain',
    volume: 0.65,
    isMuted: false,
    color: '#00f0ff'
  },
  {
    id: 'vinyl',
    name: 'Vinyl Crackle',
    jpName: 'レコード',
    description: 'Warm analog turntable hum with dynamic micro-crackles and dust pops',
    icon: 'Disc',
    volume: 0.45,
    isMuted: false,
    color: '#ffb703'
  },
  {
    id: 'wind',
    name: 'Cockpit Cabin',
    jpName: '風と客室',
    description: 'Atmospheric night wind and resonant 55Hz spacecraft cabin ambient hum',
    icon: 'Wind',
    volume: 0.4,
    isMuted: false,
    color: '#38bdf8'
  },
  {
    id: 'keys',
    name: 'Lo-Fi Rhodes',
    jpName: 'チルピアノ',
    description: 'Dreamy Neo-Tokyo jazz chord progressions with tape wow and flutter vibrato',
    icon: 'Music',
    volume: 0.7,
    isMuted: false,
    color: '#ff007f'
  },
  {
    id: 'binaural',
    name: 'Alpha 432Hz',
    jpName: '脳波シンク',
    description: 'Pure 432Hz stereo sine wave with 10Hz binaural beat for deep cognitive flow',
    icon: 'Activity',
    volume: 0.5,
    isMuted: false,
    color: '#a855f7'
  },
  {
    id: 'clock',
    name: 'Mechanical Tick',
    jpName: '機械時計',
    description: 'Tactile rhythmic mechanical metronome ticking at steady 60 BPM',
    icon: 'Clock',
    volume: 0.3,
    isMuted: true,
    color: '#10b981'
  }
];

export const PRESETS: SoundPreset[] = [
  {
    id: 'midnight-shibuya',
    name: 'Midnight Shibuya',
    jpName: '雨の渋谷',
    description: 'Melancholic Tokyo rain, warm vinyl dust, and soulful lo-fi Rhodes chords',
    icon: '🌧️',
    volumes: {
      rain: 0.8,
      vinyl: 0.5,
      wind: 0.2,
      keys: 0.75,
      binaural: 0.0,
      clock: 0.0
    }
  },
  {
    id: 'cockpit-drift',
    name: 'Cockpit Drift',
    jpName: 'コックピット巡航',
    description: 'Deep spacecraft cabin hum and binaural waves cruising through the stars',
    icon: '🚀',
    volumes: {
      rain: 0.0,
      vinyl: 0.15,
      wind: 0.7,
      keys: 0.3,
      binaural: 0.85,
      clock: 0.25
    }
  },
  {
    id: 'cyber-cafe',
    name: 'Cyber Cafe',
    jpName: '電脳カフェ',
    description: 'Warm vinyl crackle, gentle chords, soft rain backdrop, and steady focus',
    icon: '☕',
    volumes: {
      rain: 0.4,
      vinyl: 0.65,
      wind: 0.1,
      keys: 0.8,
      binaural: 0.2,
      clock: 0.25
    }
  },
  {
    id: 'deep-sync',
    name: 'Deep Sync 432Hz',
    jpName: '深層同調',
    description: 'High-focus binaural brainwave lock with gentle wind and sub-bass resonance',
    icon: '🧘',
    volumes: {
      rain: 0.1,
      vinyl: 0.0,
      wind: 0.35,
      keys: 0.2,
      binaural: 0.95,
      clock: 0.0
    }
  },
  {
    id: 'quiet-study',
    name: 'Quiet Study',
    jpName: '深夜学習',
    description: 'Gentle raindrops, soothing vinyl warmth, and minimal distraction',
    icon: '📖',
    volumes: {
      rain: 0.6,
      vinyl: 0.4,
      wind: 0.25,
      keys: 0.4,
      binaural: 0.45,
      clock: 0.0
    }
  }
];
