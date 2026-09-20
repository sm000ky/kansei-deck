import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flame, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FocusMode, DeckTheme } from '../types';
import { audioEngine } from '../audio/AudioEngine';

interface FocusHUDProps {
  theme: DeckTheme;
  isActive: boolean;
  onToggleActive: () => void;
}

export const FocusHUD: React.FC<FocusHUDProps> = ({ theme, isActive, onToggleActive }) => {
  const [mode, setMode] = useState<FocusMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [completedSessions, setCompletedSessions] = useState<number>(0);

  const totalDuration = useRef<number>(25 * 60);

  const modeDurations: Record<FocusMode, number> = {
    pomodoro: 25 * 60,
    deep: 50 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
    free: 0
  };

  const handleSelectMode = (newMode: FocusMode) => {
    audioEngine.playClick();
    setMode(newMode);
    totalDuration.current = modeDurations[newMode];
    setTimeLeft(modeDurations[newMode]);
  };

  const resetTimer = () => {
    audioEngine.playClick();
    setTimeLeft(modeDurations[mode]);
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        if (mode === 'free') {
          setTimeLeft((prev) => prev + 1);
        } else {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              audioEngine.playChime();
              setCompletedSessions((c) => c + 1);
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
              });
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, mode]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  let progress = 0;
  let syncRate = 85.0;

  if (mode !== 'free' && totalDuration.current > 0) {
    progress = ((totalDuration.current - timeLeft) / totalDuration.current) * 100;
    syncRate = 75.0 + (progress * 0.249);
  } else if (mode === 'free') {
    progress = Math.min(100, (timeLeft / 3600) * 100);
    syncRate = Math.min(99.9, 78.0 + (timeLeft / 60) * 0.5);
  }

  const getThemeButton = () => {
    if (isActive) {
      return 'bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-lg shadow-amber-500/20';
    }
    switch (theme) {
      case 'strelizia': return 'bg-[#ff2a5f] hover:bg-[#e60049] text-white shadow-glow-crimson';
      case 'neotokyo': return 'bg-[#00f0ff] hover:bg-[#00d0df] text-black font-bold shadow-glow-cyan';
      case 'cyberamber': return 'bg-[#ffb703] hover:bg-[#e5a502] text-black font-bold shadow-glow-amber';
      case 'pasteldream': return 'bg-[#c084fc] hover:bg-[#a855f7] text-white shadow-glow-pink';
    }
  };

  const getThemePill = (active: boolean) => {
    if (!active) return 'text-slate-400 hover:text-slate-200 hover:bg-[#151b2a]';
    switch (theme) {
      case 'strelizia': return 'text-[#ff2a5f] bg-[#ff2a5f]/15 border-[#ff2a5f]/40 font-bold';
      case 'neotokyo': return 'text-[#00f0ff] bg-[#00f0ff]/15 border-[#00f0ff]/40 font-bold';
      case 'cyberamber': return 'text-[#ffb703] bg-[#ffb703]/15 border-[#ffb703]/40 font-bold';
      case 'pasteldream': return 'text-[#c084fc] bg-[#c084fc]/15 border-[#c084fc]/40 font-bold';
    }
  };

  return (
    <div className="bg-[#10141e]/90 backdrop-blur border border-[#242d42] rounded-2xl p-3 md:p-3.5 shadow-xl">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Mode chips */}
        <div className="flex items-center gap-1 p-1 bg-[#090c13] rounded-xl border border-[#1f2638] w-full md:w-auto justify-between md:justify-start">
          {(
            [
              { id: 'pomodoro', label: '25m Focus' },
              { id: 'deep', label: '50m Deep' },
              { id: 'shortBreak', label: '5m Rest' },
              { id: 'longBreak', label: '15m Rest' },
              { id: 'free', label: 'Stopwatch' }
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleSelectMode(id)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] border border-transparent transition-all ${getThemePill(
                mode === id
              )}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Center: Clock & Sync Rate */}
        <div className="flex items-center gap-4">
          <div className="font-mono text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow">
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center gap-2 bg-[#090c13] border border-[#242d42] px-3 py-1 rounded-xl">
            <Flame className="w-3.5 h-3.5 text-[#ff2a5f]" />
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1 font-mono text-[9px] text-slate-400">
                <span>SYNC</span>
                <span className="text-emerald-400 font-bold text-xs">{syncRate.toFixed(1)}%</span>
              </div>
              <div className="w-16 h-1 bg-[#161b29] rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#00f0ff] via-[#ffb703] to-[#ff2a5f]"
                  style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Master Engage/Pause Button + Reset */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={onToggleActive}
            className={`flex-1 md:flex-initial px-6 py-2 rounded-xl font-display uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 ${getThemeButton()}`}
          >
            {isActive ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isActive ? 'Pause Deck' : 'Engage Deck'}</span>
          </button>
          <button
            onClick={resetTimer}
            title="Reset Timer"
            className="p-2 rounded-xl bg-[#161b29] hover:bg-[#20273b] border border-[#242d42] text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
