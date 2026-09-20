import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  Waves,
  Disc3,
  Sparkles,
  Flame,
  RotateCcw,
  ShieldCheck,
  Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VisualizerCanvas } from './VisualizerCanvas';
import { VisualizerMode, DeckTheme, FocusMode, SoundPreset } from '../types';
import { PRESETS } from '../data/channels';
import { audioEngine } from '../audio/AudioEngine';

interface MonitorDisplayProps {
  visualizerMode: VisualizerMode;
  theme: DeckTheme;
  isPlaying: boolean;
  activePresetId: string | null;
  onSelectVisualizerMode: (m: VisualizerMode) => void;
  onSelectPreset: (preset: SoundPreset) => void;
}

export const MonitorDisplay: React.FC<MonitorDisplayProps> = ({
  visualizerMode,
  theme,
  isPlaying,
  activePresetId,
  onSelectVisualizerMode,
  onSelectPreset
}) => {
  // Focus Timer State
  const [mode, setMode] = useState<FocusMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const totalDuration = useRef<number>(25 * 60);

  // Preset Filter Tag
  const [selectedTag, setSelectedTag] = useState<string>('All');

  const modeDurations: Record<FocusMode, number> = {
    pomodoro: 25 * 60,
    deep: 50 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
    free: 0
  };

  const handleSelectMode = (newMode: FocusMode) => {
    audioEngine.playClick();
    setMode(newMode);
    totalDuration.current = modeDurations[newMode];
    setTimeLeft(modeDurations[newMode]);
  };

  const resetTimer = () => {
    audioEngine.playClick();
    setTimeLeft(modeDurations[mode]);
  };

  // Timer tick when deck is playing
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        if (mode === 'free') {
          setTimeLeft((prev) => prev + 1);
        } else {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              audioEngine.playChime();
              confetti({
                particleCount: 75,
                spread: 60,
                origin: { y: 0.5 }
              });
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, mode]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  let progress = 0;
  let syncRate = 85.0;
  if (mode !== 'free' && totalDuration.current > 0) {
    progress = ((totalDuration.current - timeLeft) / totalDuration.current) * 100;
    syncRate = 75.0 + (progress * 0.249);
  } else if (mode === 'free') {
    progress = Math.min(100, (timeLeft / 3600) * 100);
    syncRate = Math.min(99.9, 78.0 + (timeLeft / 60) * 0.5);
  }

  const filteredPresets =
    selectedTag === 'All'
      ? PRESETS
      : PRESETS.filter((p) => p.tag === selectedTag);

  return (
    <div className="flex-1 flex flex-col bg-[#0b0e18] border border-[#20273b] rounded-2xl overflow-hidden shadow-2xl p-3 md:p-4 gap-3">
      {/* Visualizer Frame with integrated mode switcher */}
      <div className="relative flex-1 min-h-[160px] md:min-h-[200px] rounded-xl overflow-hidden bg-[#070911] border border-[#1b2234]">
        <VisualizerCanvas
          mode={visualizerMode}
          theme={theme}
          isPlaying={isPlaying}
        />

        {/* Floating Top Mode Selector */}
        <div className="absolute top-2.5 right-2.5 flex items-center p-0.5 bg-[#0e1320]/85 backdrop-blur border border-[#242e46] rounded-xl z-10">
          {(
            [
              { id: 'bars', icon: BarChart3, title: 'Spectrum Bars' },
              { id: 'wave', icon: Waves, title: 'Oscilloscope' },
              { id: 'radial', icon: Disc3, title: 'Radial Reactor' },
              { id: 'matrix', icon: Sparkles, title: 'Matrix Starfield' }
            ] as const
          ).map(({ id, icon: Icon, title }) => (
            <button
              key={id}
              onClick={() => {
                audioEngine.playClick();
                onSelectVisualizerMode(id);
              }}
              title={title}
              className={`p-1.5 rounded-lg transition-all ${
                visualizerMode === id
                  ? 'bg-[#202b42] text-white shadow'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-3 h-3" />
            </button>
          ))}
        </div>
      </div>

      {/* Integrated Focus HUD Bar */}
      <div className="bg-[#0f1422] border border-[#1d253a] rounded-xl p-2.5 md:p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        {/* Mode Chips */}
        <div className="flex items-center gap-1 p-0.5 bg-[#090c14] rounded-lg border border-[#192135] w-full sm:w-auto justify-between sm:justify-start">
          {(
            [
              { id: 'pomodoro', label: '25m' },
              { id: 'deep', label: '50m' },
              { id: 'shortBreak', label: '5m' },
              { id: 'longBreak', label: '15m' },
              { id: 'free', label: 'Flow' }
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleSelectMode(id)}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition-all ${
                mode === id
                  ? 'bg-[#202c46] text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Digital Clock + Sync Rate */}
        <div className="flex items-center gap-4">
          <div className="font-mono text-3xl font-bold tracking-tight text-white drop-shadow">
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center gap-2 bg-[#090c14] border border-[#1d253a] px-2.5 py-1 rounded-lg">
            <Flame className="w-3.5 h-3.5 text-[#ff2a5f]" />
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1 font-mono text-[9px] text-slate-400">
                <span>SYNC</span>
                <span className="text-emerald-400 font-bold text-[11px]">{syncRate.toFixed(1)}%</span>
              </div>
              <div className="w-14 h-1 bg-[#161c2c] rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#00f0ff] via-[#ffb703] to-[#ff2a5f]"
                  style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={resetTimer}
            title="Reset Timer"
            className="p-1.5 rounded-lg bg-[#141b2a] hover:bg-[#1d273d] border border-[#202b40] text-slate-400 hover:text-white transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Atmospheric Presets Bar */}
      <div className="bg-[#0f1422] border border-[#1d253a] rounded-xl p-2.5 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            ATMOSPHERIC PRESETS // プリセット
          </span>

          {/* Filter Pills */}
          <div className="flex items-center gap-1">
            {['All', 'Focus', 'Chill', 'Sleep', 'Energy'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  audioEngine.playClick();
                  setSelectedTag(tag);
                }}
                className={`px-1.5 py-0.5 rounded font-mono text-[9px] transition-all ${
                  selectedTag === tag
                    ? 'bg-[#222e47] text-white font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Preset Chips Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {filteredPresets.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  audioEngine.playClick();
                  onSelectPreset(preset);
                }}
                className={`px-2.5 py-1.5 rounded-lg border text-left shrink-0 transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#1b253b] border-cyan-400/80 text-white shadow-sm shadow-cyan-500/20'
                    : 'bg-[#121726] border-[#1c2336] text-slate-300 hover:bg-[#171d30] hover:text-white'
                }`}
              >
                <span className="text-sm">{preset.icon}</span>
                <div className="flex flex-col">
                  <span className="font-display font-semibold text-[11px] leading-none whitespace-nowrap">
                    {preset.name}
                  </span>
                  <span className="font-mono text-[8px] text-slate-500 leading-tight">
                    {preset.jpName}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
