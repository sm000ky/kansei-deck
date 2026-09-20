import React, { useState } from 'react';
import { Sliders, Sparkles, Clock } from 'lucide-react';
import { SoundChannel, DeckTheme, SoundPreset, MasterEqProfile } from '../types';
import { MixerRack } from './MixerRack';
import { PRESETS } from '../data/channels';
import { audioEngine } from '../audio/AudioEngine';

interface MobileDeckProps {
  channels: SoundChannel[];
  theme: DeckTheme;
  activePresetId: string | null;
  soloChannelId: string | null;
  masterProfile: MasterEqProfile;
  onChannelVolumeChange: (id: string, vol: number) => void;
  onToggleChannelMute: (id: string) => void;
  onSoloChannel: (id: string) => void;
  onSelectMasterProfile: (p: MasterEqProfile) => void;
  onSelectPreset: (preset: SoundPreset) => void;
  onRandomizeMix: () => void;
  onResetAll: () => void;
}

export const MobileDeck: React.FC<MobileDeckProps> = ({
  channels,
  theme,
  activePresetId,
  soloChannelId,
  masterProfile,
  onChannelVolumeChange,
  onToggleChannelMute,
  onSoloChannel,
  onSelectMasterProfile,
  onSelectPreset,
  onRandomizeMix,
  onResetAll
}) => {
  const [activeTab, setActiveTab] = useState<'mixer' | 'scenes'>('mixer');

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0b0e18] border border-[#20273b] rounded-2xl overflow-hidden shadow-2xl">
      {/* Mobile Tab Switcher */}
      <div className="flex items-center border-b border-[#1d253a] bg-[#090c14] shrink-0">
        <button
          onClick={() => {
            audioEngine.playClick();
            setActiveTab('mixer');
          }}
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 font-mono text-xs transition-all border-b-2 ${
            activeTab === 'mixer'
              ? 'border-cyan-400 text-white font-bold bg-[#101624]'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>MIXER (10 CH)</span>
        </button>

        <button
          onClick={() => {
            audioEngine.playClick();
            setActiveTab('scenes');
          }}
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 font-mono text-xs transition-all border-b-2 ${
            activeTab === 'scenes'
              ? 'border-[#ff2a5f] text-white font-bold bg-[#101624]'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#ff2a5f]" />
          <span>SCENES (12)</span>
        </button>
      </div>

      {/* Tab 1: Mixer */}
      {activeTab === 'mixer' && (
        <div className="flex-1 overflow-hidden p-2 flex flex-col">
          <MixerRack
            channels={channels}
            theme={theme}
            soloChannelId={soloChannelId}
            masterProfile={masterProfile}
            onChannelVolumeChange={onChannelVolumeChange}
            onToggleChannelMute={onToggleChannelMute}
            onSoloChannel={onSoloChannel}
            onSelectMasterProfile={onSelectMasterProfile}
            onRandomizeMix={onRandomizeMix}
            onResetAll={onResetAll}
          />
        </div>
      )}

      {/* Tab 2: Scenes / Presets */}
      {activeTab === 'scenes' && (
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 scrollbar-thin">
          {PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  audioEngine.playClick();
                  onSelectPreset(preset);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 flex items-center gap-2.5 ${
                  isActive
                    ? 'bg-[#1a2338] border-cyan-400 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-[#101422] border-[#1c2438] text-slate-300'
                }`}
              >
                <span className="text-xl">{preset.icon}</span>
                <div className="min-w-0">
                  <div className="font-display font-semibold text-xs text-white truncate">
                    {preset.name}
                  </div>
                  <div className="font-mono text-[9px] text-slate-500 truncate">
                    {preset.jpName}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
