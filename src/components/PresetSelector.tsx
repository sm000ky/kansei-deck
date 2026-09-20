import React, { useState } from 'react';
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
  const [selectedTag, setSelectedTag] = useState<string>('All');

  const filteredPresets =
    selectedTag === 'All'
      ? PRESETS
      : PRESETS.filter((p) => p.tag === selectedTag);

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Focus': return 'bg-cyan-950/60 text-cyan-400 border-cyan-800';
      case 'Chill': return 'bg-amber-950/60 text-amber-400 border-amber-800';
      case 'Sleep': return 'bg-purple-950/60 text-purple-400 border-purple-800';
      case 'Energy': return 'bg-rose-950/60 text-rose-400 border-rose-800';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-[#10141e]/90 backdrop-blur border border-[#242d42] rounded-2xl p-3.5 md:p-4 shadow-xl">
      {/* Category filter tabs */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-300 uppercase tracking-widest font-semibold">
            ATMOSPHERIC PRESETS // 12 PRESETS
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-0.5 bg-[#090c13] rounded-lg border border-[#1f2638]">
          {['All', 'Focus', 'Chill', 'Sleep', 'Energy'].map((t) => (
            <button
              key={t}
              onClick={() => {
                audioEngine.playClick();
                setSelectedTag(t);
              }}
              className={`px-2 py-0.5 rounded font-mono text-[10px] transition-all ${
                selectedTag === t
                  ? 'bg-[#1e273c] text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Chips Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {filteredPresets.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => {
                audioEngine.playClick();
                onSelectPreset(preset);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 flex flex-col justify-between ${
                isActive
                  ? 'bg-[#182238] border-[#3b82f6] shadow-md shadow-blue-500/15 ring-1 ring-blue-500/50'
                  : 'bg-[#121624] border-[#1c2336] hover:bg-[#161c2d] hover:border-[#2b3650]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-base">{preset.icon}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded border font-mono text-[8px] uppercase tracking-wider ${getTagColor(
                      preset.tag
                    )}`}
                  >
                    {preset.tag}
                  </span>
                </div>
                <div className="font-display font-semibold text-xs text-white tracking-wide truncate">
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
    </div>
  );
};
