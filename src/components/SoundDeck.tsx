import React from 'react';
import { Volume2, VolumeX, Shuffle, RotateCcw, Sliders } from 'lucide-react';
import { SoundChannel, DeckTheme, MasterEqProfile } from '../types';
import { ChannelCard } from './ChannelCard';
import { audioEngine } from '../audio/AudioEngine';

interface SoundDeckProps {
  channels: SoundChannel[];
  masterVolume: number;
  isMasterMuted: boolean;
  theme: DeckTheme;
  masterProfile: MasterEqProfile;
  soloChannelId: string | null;
  onChannelVolumeChange: (id: string, vol: number) => void;
  onToggleChannelMute: (id: string) => void;
  onSoloChannel: (id: string) => void;
  onMasterVolumeChange: (vol: number) => void;
  onToggleMasterMute: () => void;
  onSelectMasterProfile: (p: MasterEqProfile) => void;
  onRandomizeMix: () => void;
  onResetAll: () => void;
}

export const SoundDeck: React.FC<SoundDeckProps> = ({
  channels,
  masterVolume,
  isMasterMuted,
  theme,
  masterProfile,
  soloChannelId,
  onChannelVolumeChange,
  onToggleChannelMute,
  onSoloChannel,
  onMasterVolumeChange,
  onToggleMasterMute,
  onSelectMasterProfile,
  onRandomizeMix,
  onResetAll
}) => {
  return (
    <div className="bg-[#10141e]/90 backdrop-blur border border-[#242d42] rounded-2xl p-3.5 md:p-4 shadow-xl">
      {/* Master Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-[#242d42]">
        {/* Master Volume */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              audioEngine.playClick();
              onToggleMasterMute();
            }}
            title={isMasterMuted ? 'Unmute Master' : 'Mute Master'}
            className={`p-2 rounded-xl border transition-all ${
              isMasterMuted
                ? 'bg-[#22151b] border-rose-900 text-rose-400'
                : 'bg-[#182032] border-[#2c3750] text-slate-200 hover:text-white'
            }`}
          >
            {isMasterMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="flex-1 sm:flex-initial">
            <div className="font-display font-semibold text-white tracking-wide text-xs flex items-center justify-between gap-2">
              <span>MASTER GAIN</span>
              <span className="font-mono text-[10px] text-slate-400">
                {isMasterMuted ? 'MUTED' : `${Math.round(masterVolume * 100)}%`}
              </span>
            </div>
            <div className="w-full sm:w-40 mt-1">
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

          {/* Master EQ Profile Switcher */}
          <div className="hidden lg:flex items-center gap-1 p-0.5 bg-[#090c13] rounded-xl border border-[#1f2638] ml-2">
            <span className="px-2 py-1 text-[10px] font-mono text-slate-500 flex items-center gap-1">
              <Sliders className="w-3 h-3" /> EQ
            </span>
            {(
              [
                { id: 'flat', label: 'Flat' },
                { id: 'lofi', label: 'Lo-Fi Warm' },
                { id: 'cyber', label: 'Cyber Air' }
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
                    ? 'bg-[#1e273c] text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons: Randomize & Reset */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => {
              audioEngine.playClick();
              onRandomizeMix();
            }}
            className="px-3 py-1.5 rounded-xl bg-[#161b29] hover:bg-[#20273b] border border-[#242d42] text-slate-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Shuffle className="w-3 h-3 text-[#00f0ff]" />
            <span>Randomize</span>
          </button>
          <button
            onClick={() => {
              audioEngine.playClick();
              onResetAll();
            }}
            title="Silence All Channels"
            className="p-1.5 rounded-xl bg-[#161b29] hover:bg-[#20273b] border border-[#242d42] text-slate-400 hover:text-rose-400 transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 10 Sound Channels in High-Density Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {channels.map((ch) => (
          <ChannelCard
            key={ch.id}
            channel={ch}
            theme={theme}
            onVolumeChange={onChannelVolumeChange}
            onToggleMute={onToggleChannelMute}
            onSoloChannel={onSoloChannel}
            isSolo={soloChannelId === ch.id}
          />
        ))}
      </div>
    </div>
  );
};
