import React from 'react';
import { BarChart3, Waves, Disc3, Sparkles, Tv, Palette, Maximize2, Play, Pause } from 'lucide-react';
import { VisualizerMode, DeckTheme } from '../types';
import { audioEngine } from '../audio/AudioEngine';

interface HeaderProps {
  visualizerMode: VisualizerMode;
  theme: DeckTheme;
  crtEnabled: boolean;
  isPlaying: boolean;
  onSelectVisualizerMode: (m: VisualizerMode) => void;
  onSelectTheme: (t: DeckTheme) => void;
  onToggleCrt: () => void;
  onToggleZen: () => void;
  onTogglePlayback: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  visualizerMode,
  theme,
  crtEnabled,
  isPlaying,
  onSelectVisualizerMode,
  onSelectTheme,
  onToggleCrt,
  onToggleZen,
  onTogglePlayback
}) => {
  return (
    <header className="border-b border-[#242d42] bg-[#0b0e17]/95 backdrop-blur sticky top-0 z-40 px-3 md:px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Identity (Clean, no Day labels) */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff2a5f] to-[#ff007f] flex items-center justify-center shadow-lg shadow-rose-500/25 shrink-0">
            <span className="text-white font-mono font-bold text-xs">02</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-display font-bold text-base md:text-lg tracking-wider text-white">
                KANSEI DECK
              </h1>
              <span className="font-mono text-[11px] text-slate-500">感性</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <span className="text-[#ff2a5f] font-semibold">CODE: 002</span>
              <span>×</span>
              <span className="text-white font-medium">sm000ky</span>
            </div>
          </div>
        </div>

        {/* Controls: Playback + Visualizer Modes + Themes + CRT + Zen */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Quick Play/Pause Button */}
          <button
            onClick={onTogglePlayback}
            className={`px-2.5 py-1 rounded-xl border font-mono text-xs flex items-center gap-1.5 transition-all active:scale-95 ${
              isPlaying
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-400 shadow-sm shadow-emerald-500/20'
                : 'bg-[#121624] border-[#242d42] text-slate-400 hover:text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            <span className="hidden sm:inline text-[11px]">{isPlaying ? 'PLAYING' : 'PAUSED'}</span>
          </button>

          {/* Visualizer Mode Switcher */}
          <div className="flex items-center p-0.5 bg-[#10141e] border border-[#242d42] rounded-xl">
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
                    ? 'bg-[#1f273b] text-white shadow'
                    : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          {/* Theme Selector */}
          <div className="flex items-center p-1 bg-[#10141e] border border-[#242d42] rounded-xl gap-1">
            <Palette className="w-3 h-3 text-slate-500 ml-1 mr-0.5" />
            {(
              [
                { id: 'strelizia', name: 'Strelizia Red', color: '#ff2a5f' },
                { id: 'neotokyo', name: 'Neo Tokyo Cyan', color: '#00f0ff' },
                { id: 'cyberamber', name: 'Amber Gold', color: '#ffb703' },
                { id: 'pasteldream', name: 'Pastel Lavender', color: '#c084fc' }
              ] as const
            ).map(({ id, name, color }) => (
              <button
                key={id}
                onClick={() => {
                  audioEngine.playClick();
                  onSelectTheme(id);
                }}
                title={name}
                className={`w-4 h-4 rounded-full transition-transform ${
                  theme === id ? 'scale-125 ring-2 ring-white shadow' : 'opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* CRT Scanline Toggle */}
          <button
            onClick={() => {
              audioEngine.playClick();
              onToggleCrt();
            }}
            className={`p-1.5 md:px-2 md:py-1 rounded-xl border font-mono text-xs transition-all flex items-center gap-1 ${
              crtEnabled
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400'
                : 'bg-[#10141e] border-[#242d42] text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle CRT Scanline Overlay"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[10px]">CRT</span>
          </button>

          {/* Zen Mode */}
          <button
            onClick={() => {
              audioEngine.playClick();
              onToggleZen();
            }}
            className="p-1.5 md:px-2 md:py-1 rounded-xl bg-[#10141e] border border-[#242d42] text-slate-400 hover:text-white transition-all flex items-center gap-1"
            title="Immersive Zen Mode"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="hidden md:inline text-[10px] font-mono">ZEN</span>
          </button>
        </div>
      </div>
    </header>
  );
};
