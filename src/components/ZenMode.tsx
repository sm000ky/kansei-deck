import React, { useEffect } from 'react';
import { Minimize2, Play, Pause, RotateCcw, Flame } from 'lucide-react';
import { VisualizerCanvas } from './VisualizerCanvas';
import { VisualizerMode, DeckTheme } from '../types';
import { audioEngine } from '../audio/AudioEngine';

interface ZenModeProps {
  theme: DeckTheme;
  visualizerMode: VisualizerMode;
  isPlaying: boolean;
  activePresetName: string;
  onExit: () => void;
}

export const ZenMode: React.FC<ZenModeProps> = ({
  theme,
  visualizerMode,
  isPlaying,
  activePresetName,
  onExit
}) => {
  // Listen for Esc key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  return (
    <div className="fixed inset-0 z-50 bg-[#06080d] flex flex-col justify-between p-6 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ff2a5f] flex items-center justify-center font-mono font-bold text-white text-xs">
            02
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm tracking-wider">
              KANSEI DECK // ZEN COCKPIT
            </div>
            <div className="font-mono text-[10px] text-slate-500">
              PRESET: {activePresetName} • ESC TO RETURN
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            audioEngine.playClick();
            onExit();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161b29] hover:bg-[#20273b] border border-[#242d42] text-slate-300 hover:text-white font-mono text-xs transition-all"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Exit Zen</span>
        </button>
      </div>

      {/* Main Center Visualizer */}
      <div className="flex-1 my-6 flex items-center justify-center">
        <div className="w-full max-w-4xl h-72 md:h-96">
          <VisualizerCanvas
            mode={visualizerMode}
            theme={theme}
            isPlaying={isPlaying}
          />
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="flex items-center justify-between text-slate-500 font-mono text-xs border-t border-[#1a2133] pt-4">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
          <span>STRELIZIA LINK // CONTINUOUS SYNC</span>
        </div>
        <div className="text-slate-400">
          sm000ky × Zero Two
        </div>
      </div>
    </div>
  );
};
