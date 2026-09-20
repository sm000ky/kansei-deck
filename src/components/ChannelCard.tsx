import React from 'react';
import {
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
  VolumeX,
  Headphones
} from 'lucide-react';
import { SoundChannel, DeckTheme } from '../types';
import { audioEngine } from '../audio/AudioEngine';

interface ChannelCardProps {
  channel: SoundChannel;
  theme: DeckTheme;
  onVolumeChange: (id: string, vol: number) => void;
  onToggleMute: (id: string) => void;
  onSoloChannel: (id: string) => void;
  isSolo?: boolean;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  theme,
  onVolumeChange,
  onToggleMute,
  onSoloChannel,
  isSolo = false
}) => {
  const getIcon = () => {
    switch (channel.icon) {
      case 'CloudRain': return <CloudRain className="w-4 h-4" />;
      case 'Disc': return <Disc className="w-4 h-4" />;
      case 'Wind': return <Wind className="w-4 h-4" />;
      case 'Music': return <Music className="w-4 h-4" />;
      case 'Activity': return <Activity className="w-4 h-4" />;
      case 'Clock': return <Clock className="w-4 h-4" />;
      case 'Waves': return <Waves className="w-4 h-4" />;
      case 'Flame': return <Flame className="w-4 h-4" />;
      case 'Coffee': return <Coffee className="w-4 h-4" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4" />;
      default: return <Volume2 className="w-4 h-4" />;
    }
  };

  const isActive = !channel.isMuted && channel.volume > 0;

  return (
    <div
      className={`relative p-3 rounded-xl border transition-all duration-200 bg-[#121624]/90 backdrop-blur flex flex-col justify-between ${
        isActive
          ? 'border-[#33405c] shadow-md shadow-black/30 ring-1'
          : 'border-[#1b2234] opacity-70 hover:opacity-100'
      }`}
      style={{
        borderColor: isActive ? `${channel.color}40` : undefined,
        boxShadow: isActive ? `0 0 16px ${channel.color}15` : undefined
      }}
    >
      {/* Top row: Icon, Name, Controls */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => {
              audioEngine.playClick();
              onToggleMute(channel.id);
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${
              isActive
                ? 'bg-[#1a2236] text-white shadow-inner border border-[#33405c]'
                : 'bg-[#131726] text-slate-500 border border-transparent hover:text-slate-300'
            }`}
            style={{
              color: isActive ? channel.color : undefined
            }}
            title={channel.isMuted ? 'Unmute' : 'Mute'}
          >
            {getIcon()}
          </button>

          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 truncate">
              <span className="font-display font-semibold text-white tracking-wide text-xs md:text-sm truncate">
                {channel.name}
              </span>
              <span className="font-mono text-[9px] text-slate-500 shrink-0">
                {channel.jpName}
              </span>
            </div>
          </div>
        </div>

        {/* Solo Button & Mute Toggle */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              audioEngine.playClick();
              onSoloChannel(channel.id);
            }}
            title="Solo this channel"
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-all ${
              isSolo
                ? 'bg-amber-400 text-black font-bold shadow-glow-amber'
                : 'bg-[#161b29] text-slate-500 hover:text-slate-300 border border-[#242d42]'
            }`}
          >
            S
          </button>
          <button
            onClick={() => {
              audioEngine.playClick();
              onToggleMute(channel.id);
            }}
            title={channel.isMuted ? 'Unmute' : 'Mute'}
            className={`p-1.5 rounded-lg border transition-all ${
              channel.isMuted
                ? 'bg-[#22151b] border-rose-950 text-rose-400'
                : 'bg-[#161b29] border-[#242d42] text-slate-400 hover:text-white'
            }`}
          >
            {channel.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Bottom row: Volume Slider & Percentage */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="range"
          min="0"
          max="100"
          value={channel.isMuted ? 0 : Math.round(channel.volume * 100)}
          onChange={(e) => onVolumeChange(channel.id, Number(e.target.value) / 100)}
          className="w-full h-1.5 bg-[#182033] rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: channel.color }}
        />
        <span className="font-mono text-[10px] w-8 text-right font-medium text-slate-300 shrink-0">
          {channel.isMuted ? '0%' : `${Math.round(channel.volume * 100)}%`}
        </span>
      </div>
    </div>
  );
};
