import React from 'react';
import {
  Shuffle,
  RotateCcw,
  Sliders,
  CloudRain,
  Disc,
  Wind,
  Music,
  Activity,
  Clock,
  Waves,
  Flame,
  Coffee,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import { SoundChannel, DeckTheme, MasterEqProfile } from '../types';
import { audioEngine } from '../audio/AudioEngine';

interface MixerRackProps {
  channels: SoundChannel[];
  theme: DeckTheme;
  soloChannelId: string | null;
  masterProfile: MasterEqProfile;
  onChannelVolumeChange: (id: string, vol: number) => void;
  onToggleChannelMute: (id: string) => void;
  onSoloChannel: (id: string) => void;
  onSelectMasterProfile: (p: MasterEqProfile) => void;
  onRandomizeMix: () => void;
  onResetAll: () => void;
}

export const MixerRack: React.FC<MixerRackProps> = ({
  channels,
  theme,
  soloChannelId,
  masterProfile,
  onChannelVolumeChange,
  onToggleChannelMute,
  onSoloChannel,
  onSelectMasterProfile,
  onRandomizeMix,
  onResetAll
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'CloudRain': return <CloudRain className="w-3.5 h-3.5" />;
      case 'Disc': return <Disc className="w-3.5 h-3.5" />;
      case 'Wind': return <Wind className="w-3.5 h-3.5" />;
      case 'Music': return <Music className="w-3.5 h-3.5" />;
      case 'Activity': return <Activity className="w-3.5 h-3.5" />;
      case 'Clock': return <Clock className="w-3.5 h-3.5" />;
      case 'Waves': return <Waves className="w-3.5 h-3.5" />;
      case 'Flame': return <Flame className="w-3.5 h-3.5" />;
      case 'Coffee': return <Coffee className="w-3.5 h-3.5" />;
      case 'Sparkles': return <Sparkles className="w-3.5 h-3.5" />;
      default: return <Volume2 className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="w-full md:w-[380px] lg:w-[420px] bg-[#0b0e18] border border-[#20273b] rounded-2xl flex flex-col overflow-hidden shadow-2xl p-3 md:p-3.5 shrink-0">
      {/* Mixer Top Toolbar */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#1d253a] shrink-0">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-xs font-semibold text-white tracking-wider">
            MIXER RACK
          </span>
          <span className="font-mono text-[9px] text-slate-500">10 CH</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              audioEngine.playClick();
              onRandomizeMix();
            }}
            className="px-2 py-1 rounded-lg bg-[#141b2a] hover:bg-[#1d273d] border border-[#202b40] text-slate-300 hover:text-white font-mono text-[10px] flex items-center gap-1 transition-all active:scale-95"
          >
            <Shuffle className="w-2.5 h-2.5 text-cyan-400" />
            <span>Random</span>
          </button>
          <button
            onClick={() => {
              audioEngine.playClick();
              onResetAll();
            }}
            title="Silence All"
            className="p-1 rounded-lg bg-[#141b2a] hover:bg-[#1d273d] border border-[#202b40] text-slate-400 hover:text-rose-400 transition-all"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Channel Strips Container (High density, custom scrollable) */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
        {channels.map((ch) => {
          const isActive = !ch.isMuted && ch.volume > 0;
          const isSolo = soloChannelId === ch.id;

          return (
            <div
              key={ch.id}
              className={`px-2.5 py-1.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                isActive
                  ? 'bg-[#121726] border-[#29354d] shadow-sm'
                  : 'bg-[#0e121e] border-[#182032] opacity-65 hover:opacity-100'
              }`}
              style={{
                borderColor: isActive ? `${ch.color}40` : undefined
              }}
            >
              {/* Left: Icon & Channel Name */}
              <div className="flex items-center gap-2 min-w-0 w-28 shrink-0">
                <button
                  onClick={() => {
                    audioEngine.playClick();
                    onToggleChannelMute(ch.id);
                  }}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-all shrink-0 ${
                    isActive
                      ? 'bg-[#1c2438] text-white shadow-inner'
                      : 'bg-[#121624] text-slate-500 hover:text-slate-300'
                  }`}
                  style={{
                    color: isActive ? ch.color : undefined
                  }}
                >
                  {getIcon(ch.icon)}
                </button>

                <div className="min-w-0">
                  <div className="font-display font-semibold text-white text-xs truncate leading-tight">
                    {ch.name}
                  </div>
                  <div className="font-mono text-[8px] text-slate-500 truncate leading-none">
                    {ch.jpName}
                  </div>
                </div>
              </div>

              {/* Middle: Volume Slider with dynamic track color */}
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ch.isMuted ? 0 : Math.round(ch.volume * 100)}
                  onChange={(e) => onChannelVolumeChange(ch.id, Number(e.target.value) / 100)}
                  className="w-full h-1 bg-[#182033] rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: ch.color }}
                />
                <span className="font-mono text-[9px] w-6 text-right font-medium text-slate-300 shrink-0">
                  {ch.isMuted ? '0%' : `${Math.round(ch.volume * 100)}%`}
                </span>
              </div>

              {/* Right: Solo & Mute Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    audioEngine.playClick();
                    onSoloChannel(ch.id);
                  }}
                  title="Solo Channel"
                  className={`w-5 h-5 rounded font-mono text-[9px] flex items-center justify-center transition-all ${
                    isSolo
                      ? 'bg-amber-400 text-black font-bold shadow-sm shadow-amber-400/50'
                      : 'bg-[#141b2a] text-slate-500 hover:text-slate-300 border border-[#1f293d]'
                  }`}
                >
                  S
                </button>
                <button
                  onClick={() => {
                    audioEngine.playClick();
                    onToggleChannelMute(ch.id);
                  }}
                  title={ch.isMuted ? 'Unmute' : 'Mute'}
                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                    ch.isMuted
                      ? 'bg-[#25151d] text-rose-400 border border-rose-900/50'
                      : 'bg-[#141b2a] text-slate-400 hover:text-white border border-[#1f293d]'
                  }`}
                >
                  {ch.isMuted ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
