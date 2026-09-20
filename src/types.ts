export type VisualizerMode = 'bars' | 'wave' | 'radial' | 'matrix';

export type DeckTheme = 'strelizia' | 'neotokyo' | 'cyberamber' | 'pasteldream';

export interface SoundChannel {
  id: string;
  name: string;
  jpName: string;
  description: string;
  icon: string;
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  color: string;
}

export interface SoundPreset {
  id: string;
  name: string;
  jpName: string;
  description: string;
  icon: string;
  volumes: Record<string, number>; // channel id -> volume (0 to 1)
}

export type FocusMode = 'pomodoro' | 'deep' | 'shortBreak' | 'longBreak' | 'free';

export interface FocusConfig {
  mode: FocusMode;
  name: string;
  durationMinutes: number;
}
