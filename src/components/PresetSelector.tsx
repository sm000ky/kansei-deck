import React from 'react';
import { PRESETS } from '../data/channels';
import { SoundPreset, DeckTheme } from '../types';
import { audioEngine } from '../audio/AudioEngine';

interface PresetSelectorProps {
  activePresetId: string | null;
  theme: DeckTheme;
  onSelectPreset: (preset: SoundPreset) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  activePresetId,
  theme,
  onSelectPreset
}) => {
  return (
    <div className="bg-[#10141e]/90 backdrop-blur border border-[#242d42] rounded-2xl p-4 shadow-xl mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">
            ATMOSPHERIC PRESETS // プリセット
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => {
                audioEngine.playClick();
                onSelectPreset(preset);
              }}
              className={`p-3 rounded-xl border text-left transition-all active:scale-95 flex flex-col justify-between ${
                isActive
                  ? 'bg-[#182136] border-[#3b82f6] shadow-md shadow-blue-500/10 ring-1 ring-blue-500/50'
                  : 'bg-[#121624] border-[#1e2536] hover:bg-[#161c2d] hover:border-[#2d3852]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xl">{preset.icon}</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {preset.jpName}
                  </span>
                </div>
                <div className="font-display font-semibold text-xs md:text-sm text-white tracking-wide">
                  {preset.name}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2 line-clamp-2 leading-tight">
                {preset.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
