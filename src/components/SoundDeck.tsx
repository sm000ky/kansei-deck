import React from 'react';
import { Volume2, VolumeX, Shuffle, RotateCcw } from 'lucide-react';
import { SoundChannel, DeckTheme } from '../types';
import { ChannelCard } from './ChannelCard';
import { audioEngine } from '../audio/AudioEngine';

interface SoundDeckProps {
  channels: SoundChannel[];
  masterVolume: number;
  isMasterMuted: boolean;
  theme: DeckTheme;
  onChannelVolumeChange: (id: string, vol: number) => void;
  onToggleChannelMute: (id: string) => void;
  onMasterVolumeChange: (vol: number) => void;
  onToggleMasterMute: () => void;
  onRandomizeMix: () => void;
  onResetAll: () => void;
}

export const SoundDeck: React.FC<SoundDeckProps> = ({
  channels,
  masterVolume,
  isMasterMuted,
  theme,
  onChannelVolumeChange,
  onToggleChannelMute,
  onMasterVolumeChange,
  onToggleMasterMute,
  onRandomizeMix,
  onResetAll
}) => {
  return (
    <div className="bg-[#10141e]/90 backdrop-blur border border-[#242d42] rounded-2xl p-5 shadow-xl">
      {/* Master Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-[#242d42]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              audioEngine.playClick();
              onToggleMasterMute();
            }}
            title={isMasterMuted ? 'Unmute Master' : 'Mute Master'}
            className={`p-2.5 rounded-xl border transition-all ${
              isMasterMuted
                ? 'bg-[#21141b] border-rose-800 text-rose-400'
                : 'bg-[#182032] border-[#2c3750] text-slate-200 hover:text-white'
            }`}
          >
            {isMasterMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <div>
            <div className="font-display font-semibold text-white tracking-wide text-sm flex items-center gap-2">
              <span>MASTER OUTPUT</span>
              <span className="font-mono text-xs text-slate-400">
                {isMasterMuted ? 'MUTED' : `${Math.round(masterVolume * 100)}%`}
              </span>
            </div>
            <div className="w-36 md:w-48 mt-1.5">
              <input
                type="range"
                min="0"
                max="100"
                value={isMasterMuted ? 0 : Math.round(masterVolume * 100)}
                onChange={(e) => onMasterVolumeChange(Number(e.target.value) / 100)}
                className="w-full h-1.5 bg-[#1a2133] rounded-lg appearance-none cursor-pointer accent-[#ff2a5f]"
              />
            </div>
          </div>
        </div>

        {/* Action buttons: Randomize & Reset */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => {
              audioEngine.playClick();
              onRandomizeMix();
            }}
            className="px-3.5 py-2 rounded-xl bg-[#161b29] hover:bg-[#20273b] border border-[#242d42] text-slate-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>Randomize Mix</span>
          </button>
          <button
            onClick={() => {
              audioEngine.playClick();
              onResetAll();
            }}
            title="Silence All"
            className="p-2 rounded-xl bg-[#161b29] hover:bg-[#20273b] border border-[#242d42] text-slate-400 hover:text-rose-400 transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map((ch) => (
          <ChannelCard
            key={ch.id}
            channel={ch}
            theme={theme}
            onVolumeChange={onChannelVolumeChange}
            onToggleMute={onToggleChannelMute}
          />
        ))}
      </div>
    </div>
  );
};
