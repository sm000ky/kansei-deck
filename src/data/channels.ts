import { SoundChannel, SoundPreset } from '../types';

export const INITIAL_CHANNELS: SoundChannel[] = [
  {
    id: 'rain',
    name: 'Tokyo Rain',
    jpName: '雨音',
    description: 'Soft pink noise rainfall with gentle droplet pings against window glass',
    icon: 'CloudRain',
    volume: 0.65,
    isMuted: false,
    color: '#00f0ff'
  },
  {
    id: 'vinyl',
    name: 'Vinyl Warmth',
    jpName: 'レコード',
    description: 'Warm analog turntable hum with subtle turntable surface texture',
    icon: 'Disc',
    volume: 0.2,
    isMuted: true, // Muted by default so no unwanted crackle!
    color: '#ffb703'
  },
  {
    id: 'wind',
    name: 'Cockpit Cabin',
    jpName: '風と客室',
    description: 'Atmospheric night wind and resonant 55Hz spacecraft cabin ambient hum',
    icon: 'Wind',
    volume: 0.45,
    isMuted: false,
    color: '#38bdf8'
  },
  {
    id: 'keys',
    name: 'Lo-Fi Rhodes',
    jpName: 'チルピアノ',
    description: 'Dreamy Neo-Tokyo jazz chord progressions with tape wow and flutter vibrato',
    icon: 'Music',
    volume: 0.8,
    isMuted: false,
    color: '#ff007f'
  },
  {
    id: 'binaural',
    name: 'Alpha 216Hz',
    jpName: '脳波シンク',
    description: 'Pure 216Hz stereo sine wave with 10Hz binaural beat for deep cognitive flow',
    icon: 'Activity',
    volume: 0.45,
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
  },
  {
    id: 'waves',
    name: 'Ocean Surf',
    jpName: '潮騒',
    description: 'Rhythmic ambient ocean tide swell with deep resonant shoreline wash',
    icon: 'Waves',
    volume: 0.4,
    isMuted: true,
    color: '#06b6d4'
  },
  {
    id: 'fire',
    name: 'Campfire Hearth',
    jpName: '焚き火',
    description: 'Crackling campfire embers with warm woody snaps and cozy low rumble',
    icon: 'Flame',
    volume: 0.4,
    isMuted: true,
    color: '#f97316'
  },
  {
    id: 'cafe',
    name: 'Cyber Cafe',
    jpName: '電脳喫茶',
    description: 'Subtle ambient room murmur with occasional ceramic cup and spoon clinks',
    icon: 'Coffee',
    volume: 0.35,
    isMuted: true,
    color: '#eab308'
  },
  {
    id: 'aurora',
    name: 'Cosmic Aurora',
    jpName: '極光',
    description: 'Ethereal harmonic celestial drone with shimmering harmonic overtones',
    icon: 'Sparkles',
    volume: 0.45,
    isMuted: true,
    color: '#ec4899'
  }
];

export const PRESETS: SoundPreset[] = [
  {
    id: 'midnight-shibuya',
    name: 'Midnight Shibuya',
    jpName: '雨の渋谷',
    description: 'Melancholic Tokyo rain, soft cabin wind, and soulful lo-fi Rhodes chords',
    icon: '🌧️',
    tag: 'Focus',
    volumes: {
      rain: 0.75,
      vinyl: 0.0, // Zero crackle by default!
      wind: 0.35,
      keys: 0.85,
      binaural: 0.3,
      clock: 0.0,
      waves: 0.0,
      fire: 0.0,
      cafe: 0.0,
      aurora: 0.0
    }
  },
  {
    id: 'cockpit-drift',
    name: 'Cockpit Drift',
    jpName: 'コックピット巡航',
    description: 'Deep spacecraft cabin hum, cosmic aurora, and binaural waves cruising stars',
    icon: '🚀',
    tag: 'Focus',
    volumes: {
      rain: 0.0,
      vinyl: 0.0,
      wind: 0.65,
      keys: 0.4,
      binaural: 0.75,
      clock: 0.0,
      waves: 0.0,
      fire: 0.0,
      cafe: 0.0,
      aurora: 0.65
    }
  },
  {
    id: 'cyber-cafe',
    name: 'Akihabara Cafe',
    jpName: '電脳喫茶',
    description: 'Warm cafe murmur, gentle Rhodes chords, soft rain backdrop, and calm focus',
    icon: '☕',
    tag: 'Chill',
    volumes: {
      rain: 0.35,
      vinyl: 0.1,
      wind: 0.1,
      keys: 0.75,
      binaural: 0.2,
      clock: 0.0,
      waves: 0.0,
      fire: 0.0,
      cafe: 0.6,
      aurora: 0.0
    }
  },
  {
    id: 'deep-sync',
    name: 'Deep Sync 216Hz',
    jpName: '深層同調',
    description: 'High-focus binaural brainwave lock with gentle wind and sub-bass resonance',
    icon: '🧘',
    tag: 'Focus',
    volumes: {
      rain: 0.1,
      vinyl: 0.0,
      wind: 0.4,
      keys: 0.3,
      binaural: 0.9,
      clock: 0.0,
      waves: 0.0,
      fire: 0.0,
      cafe: 0.0,
      aurora: 0.35
    }
  },
  {
    id: 'campfire-void',
    name: 'Campfire in Void',
    jpName: '虚空の焚き火',
    description: 'Cozy snapping wood embers, cosmic wind, and gentle reflective piano chords',
    icon: '🔥',
    tag: 'Chill',
    volumes: {
      rain: 0.0,
      vinyl: 0.0,
      wind: 0.45,
      keys: 0.55,
      binaural: 0.35,
      clock: 0.0,
      waves: 0.0,
      fire: 0.75,
      cafe: 0.0,
      aurora: 0.35
    }
  },
  {
    id: 'neon-shoreline',
    name: 'Neon Shoreline',
    jpName: 'ネオンの渚',
    description: 'Rolling ocean surf under neon skies with soft rain and ethereal aurora pad',
    icon: '🌊',
    tag: 'Chill',
    volumes: {
      rain: 0.4,
      vinyl: 0.0,
      wind: 0.25,
      keys: 0.65,
      binaural: 0.3,
      clock: 0.0,
      waves: 0.8,
      fire: 0.0,
      cafe: 0.0,
      aurora: 0.5
    }
  },
  {
    id: 'late-night-code',
    name: 'Late Night Code',
    jpName: '深夜コーディング',
    description: 'Steady mechanical tick, relaxing rain on glass, and lo-fi Rhodes chords',
    icon: '💻',
    tag: 'Focus',
    volumes: {
      rain: 0.6,
      vinyl: 0.0,
      wind: 0.2,
      keys: 0.85,
      binaural: 0.4,
      clock: 0.4,
      waves: 0.0,
      fire: 0.0,
      cafe: 0.0,
      aurora: 0.0
    }
  },
  {
    id: 'kyoto-rain',
    name: 'Kyoto Sanctuary',
    jpName: '京都の庭園',
    description: 'Meditative rainfall, ocean swells, and gentle fireplace warmth in a quiet pavilion',
    icon: '⛩️',
    tag: 'Chill',
    volumes: {
      rain: 0.75,
      vinyl: 0.0,
      wind: 0.25,
      keys: 0.35,
      binaural: 0.35,
      clock: 0.0,
      waves: 0.45,
      fire: 0.45,
      cafe: 0.0,
      aurora: 0.0
    }
  },
  {
    id: 'sanctuary-sleep',
    name: 'Zero Two Sanctuary',
    jpName: 'ふたりの聖域',
    description: 'Slow delta brainwaves, crackling fireplace, and gentle night rain for deep sleep',
    icon: '🌸',
    tag: 'Sleep',
    volumes: {
      rain: 0.5,
      vinyl: 0.0,
      wind: 0.35,
      keys: 0.25,
      binaural: 0.8,
      clock: 0.0,
      waves: 0.0,
      fire: 0.6,
      cafe: 0.0,
      aurora: 0.4
    }
  },
  {
    id: 'strelizia-overdrive',
    name: 'Strelizia Drive',
    jpName: 'ストレリチア全開',
    description: 'High-energy cosmic hum, rhythmic tick, and driving binaural sync pulse',
    icon: '⚡',
    tag: 'Energy',
    volumes: {
      rain: 0.0,
      vinyl: 0.0,
      wind: 0.65,
      keys: 0.7,
      binaural: 0.85,
      clock: 0.5,
      waves: 0.0,
      fire: 0.0,
      cafe: 0.0,
      aurora: 0.8
    }
  },
  {
    id: 'rainy-bookshop',
    name: 'Rainy Bookshop',
    jpName: '雨の古書店',
    description: 'Quiet cafe whispers, soft rain on glass, and warm nostalgic Rhodes keys',
    icon: '📚',
    tag: 'Chill',
    volumes: {
      rain: 0.7,
      vinyl: 0.05,
      wind: 0.15,
      keys: 0.7,
      binaural: 0.0,
      clock: 0.0,
      waves: 0.0,
      fire: 0.0,
      cafe: 0.55,
      aurora: 0.0
    }
  },
  {
    id: 'orbital-station',
    name: 'Orbital Station',
    jpName: '軌道ステーション',
    description: 'Low spacecraft vibrations, cosmic aurora harmonics, and steady clock sync',
    icon: '🛰️',
    tag: 'Focus',
    volumes: {
      rain: 0.0,
      vinyl: 0.0,
      wind: 0.75,
      keys: 0.45,
      binaural: 0.7,
      clock: 0.35,
      waves: 0.0,
      fire: 0.0,
      cafe: 0.0,
      aurora: 0.75
    }
  }
];
