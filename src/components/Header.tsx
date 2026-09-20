import React from 'react';
import { BarChart3, Waves, Disc3, Sparkles, Tv, Palette, Heart } from 'lucide-react';
import { VisualizerMode, DeckTheme } from '../types';
import { audioEngine } from '../audio/AudioEngine';

interface HeaderProps {
  visualizerMode: VisualizerMode;
  theme: DeckTheme;
  crtEnabled: boolean;
  onSelectVisualizerMode: (m: VisualizerMode) => void;
  onSelectTheme: (t: DeckTheme) => void;
  onToggleCrt: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  visualizerMode,
  theme,
  crtEnabled,
  onSelectVisualizerMode,
  onSelectTheme,
  onToggleCrt
}) => {
  return (
    <header className="border-b border-[#242d42] bg-[#0c0f18]/90 backdrop-blur sticky top-0 z-40 px-4 py-3">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff2a5f] to-[#ff007f] flex items-center justify-center shadow-lg shadow-rose-500/20">
              <span className="text-white font-mono font-bold text-sm">02</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-lg tracking-wider text-white">
                  KANSEI DECK
                </h1>
                <span className="font-mono text-xs text-slate-400">感性</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                <span className="text-[#ff2a5f] font-semibold">CODE: 002</span>
                <span>×</span>
                <span className="text-white font-medium">sm000ky</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400">DAY 6</span>
              </div>
            </div>
          </div>

          {/* CRT toggle on mobile */}
          <button
            onClick={() => {
              audioEngine.playClick();
              onToggleCrt();
            }}
            className={`p-2 rounded-xl border md:hidden transition-all ${
              crtEnabled
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400'
                : 'bg-[#161b29] border-[#242d42] text-slate-400'
            }`}
            title="Toggle CRT Scanline Effect"
          >
            <Tv className="w-4 h-4" />
          </button>
        </div>

        {/* Controls: Visualizer Modes + Themes + CRT */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          {/* Visualizer Mode Switcher */}
          <div className="flex items-center p-1 bg-[#10141e] border border-[#242d42] rounded-xl">
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
                    ? 'bg-[#1e2638] text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Theme Selector */}
          <div className="flex items-center p-1 bg-[#10141e] border border-[#242d42] rounded-xl gap-1">
            <Palette className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
            {(
              [
                { id: 'strelizia', name: 'Strelizia', color: '#ff2a5f' },
                { id: 'neotokyo', name: 'Neo Tokyo', color: '#00f0ff' },
                { id: 'cyberamber', name: 'Amber', color: '#ffb703' },
                { id: 'pasteldream', name: 'Pastel', color: '#c084fc' }
              ] as const
            ).map(({ id, name, color }) => (
              <button
                key={id}
                onClick={() => {
                  audioEngine.playClick();
                  onSelectTheme(id);
                }}
                title={`Theme: ${name}`}
                className={`w-5 h-5 rounded-full transition-transform ${
                  theme === id ? 'scale-125 ring-2 ring-white shadow-lg' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* CRT scanlines toggle (Desktop) */}
          <button
            onClick={() => {
              audioEngine.playClick();
              onToggleCrt();
            }}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-mono text-xs transition-all ${
              crtEnabled
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 shadow-sm shadow-emerald-500/20'
                : 'bg-[#10141e] border-[#242d42] text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>CRT {crtEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
