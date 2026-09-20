import React from 'react';
import { Play, Pause, Volume2, VolumeX, Tv, Palette, Maximize2, Sliders } from 'lucide-react';
import { DeckTheme, MasterEqProfile } from '../types';
import { audioEngine } from '../audio/AudioEngine';

interface ConsoleHeaderProps {
  theme: DeckTheme;
  isPlaying: boolean;
  masterVolume: number;
  isMasterMuted: boolean;
  masterProfile: MasterEqProfile;
  crtEnabled: boolean;
  onTogglePlayback: () => void;
  onMasterVolumeChange: (vol: number) => void;
  onToggleMasterMute: () => void;
  onSelectMasterProfile: (p: MasterEqProfile) => void;
  onSelectTheme: (t: DeckTheme) => void;
  onToggleCrt: () => void;
  onToggleZen: () => void;
}

export const ConsoleHeader: React.FC<ConsoleHeaderProps> = ({
  theme,
  isPlaying,
  masterVolume,
  isMasterMuted,
  masterProfile,
  crtEnabled,
  onTogglePlayback,
  onMasterVolumeChange,
  onToggleMasterMute,
  onSelectMasterProfile,
  onSelectTheme,
  onToggleCrt,
  onToggleZen
}) => {
  return (
    <header className="h-12 md:h-14 border-b border-[#20273b] bg-[#0a0d16] px-3 md:px-4 flex items-center justify-between shrink-0 select-none z-30">
      {/* Brand & Identity */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-tr from-[#ff2a5f] to-[#ff007f] flex items-center justify-center shadow-md shadow-rose-500/25 shrink-0">
          <span className="text-white font-mono font-bold text-xs">02</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-display font-bold text-sm md:text-base tracking-wider text-white">
              KANSEI DECK
            </span>
            <span className="font-mono text-[10px] text-slate-500 hidden sm:inline">感性</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400">
            <span className="text-[#ff2a5f] font-semibold">002</span>
            <span>×</span>
            <span className="text-white font-medium">sm000ky</span>
          </div>
        </div>
      </div>

      {/* Center: Master Play/Pause Switch & Volume */}
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={onTogglePlayback}
          className={`px-3 py-1.5 md:px-4 md:py-1.5 rounded-xl font-display uppercase tracking-wider text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-lg ${
            isPlaying
              ? 'bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-emerald-500/25'
              : 'bg-[#ff2a5f] hover:bg-[#e60049] text-white shadow-rose-500/25 font-bold'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isPlaying ? 'PAUSE' : 'ENGAGE'}</span>
        </button>

        {/* Master Volume */}
        <div className="hidden sm:flex items-center gap-2 bg-[#101522] border border-[#20273b] px-2.5 py-1 rounded-xl">
          <button
            onClick={() => {
              audioEngine.playClick();
              onToggleMasterMute();
            }}
            title={isMasterMuted ? 'Unmute Master' : 'Mute Master'}
            className="text-slate-400 hover:text-white"
          >
            {isMasterMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMasterMuted ? 0 : Math.round(masterVolume * 100)}
            onChange={(e) => onMasterVolumeChange(Number(e.target.value) / 100)}
            className="w-16 md:w-24 h-1 bg-[#1c2438] rounded-lg appearance-none cursor-pointer accent-[#ff2a5f]"
          />
          <span className="font-mono text-[10px] text-slate-300 w-7 text-right">
            {isMasterMuted ? '0%' : `${Math.round(masterVolume * 100)}%`}
          </span>
        </div>

        {/* Master EQ Profile */}
        <div className="hidden lg:flex items-center gap-0.5 p-0.5 bg-[#101522] border border-[#20273b] rounded-xl">
          {(
            [
              { id: 'flat', label: 'Flat' },
              { id: 'lofi', label: 'Lo-Fi' },
              { id: 'cyber', label: 'Air' }
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => {
                audioEngine.playClick();
                onSelectMasterProfile(id);
              }}
              className={`px-2 py-0.5 rounded-lg font-mono text-[10px] transition-all ${
                masterProfile === id
                  ? 'bg-[#1e273e] text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Themes & CRT & Zen */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Theme Picker */}
        <div className="flex items-center p-1 bg-[#101522] border border-[#20273b] rounded-xl gap-1">
          <Palette className="w-3 h-3 text-slate-500 ml-0.5 mr-0.5" />
          {(
            [
              { id: 'strelizia', color: '#ff2a5f' },
              { id: 'neotokyo', color: '#00f0ff' },
              { id: 'cyberamber', color: '#ffb703' },
              { id: 'pasteldream', color: '#c084fc' }
            ] as const
          ).map(({ id, color }) => (
            <button
              key={id}
              onClick={() => {
                audioEngine.playClick();
                onSelectTheme(id);
              }}
              className={`w-3.5 h-3.5 rounded-full transition-transform ${
                theme === id ? 'scale-125 ring-1.5 ring-white' : 'opacity-50 hover:opacity-100'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* CRT Scanlines Toggle */}
        <button
          onClick={() => {
            audioEngine.playClick();
            onToggleCrt();
          }}
          className={`p-1.5 rounded-xl border transition-all ${
            crtEnabled
              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400'
              : 'bg-[#101522] border-[#20273b] text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle CRT Scanline Effect"
        >
          <Tv className="w-3.5 h-3.5" />
        </button>

        {/* Zen Fullscreen */}
        <button
          onClick={() => {
            audioEngine.playClick();
            onToggleZen();
          }}
          className="p-1.5 rounded-xl bg-[#101522] border border-[#20273b] text-slate-400 hover:text-white transition-all"
          title="Immersive Zen Mode"
        >
          <Maximize2 className="w-3.5 h-3.5 text-[#00f0ff]" />
        </button>
      </div>
    </header>
  );
};
