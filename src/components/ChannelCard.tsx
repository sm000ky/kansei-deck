import React from 'react';
import { CloudRain, Disc, Wind, Music, Activity, Clock, Volume2, VolumeX } from 'lucide-react';
import { SoundChannel, DeckTheme } from '../types';
import { audioEngine } from '../audio/AudioEngine';

interface ChannelCardProps {
  channel: SoundChannel;
  theme: DeckTheme;
  onVolumeChange: (id: string, vol: number) => void;
  onToggleMute: (id: string) => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  theme,
  onVolumeChange,
  onToggleMute
}) => {
  const getIcon = () => {
    switch (channel.icon) {
      case 'CloudRain': return <CloudRain className="w-5 h-5" />;
      case 'Disc': return <Disc className="w-5 h-5" />;
      case 'Wind': return <Wind className="w-5 h-5" />;
      case 'Music': return <Music className="w-5 h-5" />;
      case 'Activity': return <Activity className="w-5 h-5" />;
      case 'Clock': return <Clock className="w-5 h-5" />;
      default: return <Volume2 className="w-5 h-5" />;
    }
  };

  const isActive = !channel.isMuted && channel.volume > 0;

  return (
    <div
      className={`relative p-4 rounded-2xl border transition-all duration-200 bg-[#121624]/90 backdrop-blur ${
        isActive
          ? 'border-[#3b4866] shadow-lg shadow-black/40'
          : 'border-[#1e2536] opacity-75 hover:opacity-100'
      }`}
    >
      {/* Top row: Icon, Name, Mute Toggle */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              audioEngine.playClick();
              onToggleMute(channel.id);
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isActive
                ? 'bg-[#1b2234] text-white shadow-inner border border-[#3b4866]'
                : 'bg-[#151a28] text-slate-500 border border-transparent'
            }`}
            style={{
              color: isActive ? channel.color : undefined,
              boxShadow: isActive ? `0 0 14px ${channel.color}33` : undefined
            }}
          >
            {getIcon()}
          </button>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-semibold text-white tracking-wide text-sm md:text-base">
                {channel.name}
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                {channel.jpName}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1 leading-tight mt-0.5">
              {channel.description}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            audioEngine.playClick();
            onToggleMute(channel.id);
          }}
          title={channel.isMuted ? 'Unmute' : 'Mute'}
          className={`p-2 rounded-lg border transition-all ${
            channel.isMuted
              ? 'bg-[#1a141b] border-rose-950 text-rose-400'
              : 'bg-[#161b29] border-[#242d42] text-slate-300 hover:text-white'
          }`}
        >
          {channel.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Volume slider & percentage */}
      <div className="mt-3 pt-3 border-t border-[#1c2335] flex items-center gap-3">
        <input
          type="range"
          min="0"
          max="100"
          value={channel.isMuted ? 0 : Math.round(channel.volume * 100)}
          onChange={(e) => onVolumeChange(channel.id, Number(e.target.value) / 100)}
          className="w-full h-1.5 bg-[#1a2133] rounded-lg appearance-none cursor-pointer accent-[#ff2a5f]"
          style={{ accentColor: channel.color }}
        />
        <span className="font-mono text-xs w-10 text-right font-medium text-slate-300">
          {channel.isMuted ? 'OFF' : `${Math.round(channel.volume * 100)}%`}
        </span>
      </div>
    </div>
  );
};
