import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flame, CheckCircle2, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FocusMode, DeckTheme } from '../types';
import { audioEngine } from '../audio/AudioEngine';

interface FocusHUDProps {
  theme: DeckTheme;
}

export const FocusHUD: React.FC<FocusHUDProps> = ({ theme }) => {
  const [mode, setMode] = useState<FocusMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
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
    setIsActive(false);
    totalDuration.current = modeDurations[newMode];
    setTimeLeft(modeDurations[newMode]);
  };

  const toggleTimer = () => {
    audioEngine.playClick();
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    audioEngine.playClick();
    setIsActive(false);
    setTimeLeft(modeDurations[mode]);
  };

  // Timer Tick
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
              setIsActive(false);
              audioEngine.playChime();
              setCompletedSessions((c) => c + 1);
              // Fire celebration confetti!
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

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate Progress and Sync Rate
  let progress = 0;
  let syncRate = 85.0;

  if (mode !== 'free' && totalDuration.current > 0) {
    progress = ((totalDuration.current - timeLeft) / totalDuration.current) * 100;
    syncRate = 75.0 + (progress * 0.249); // Scales smoothly to 99.9%
  } else if (mode === 'free') {
    progress = Math.min(100, (timeLeft / 3600) * 100);
    syncRate = Math.min(99.9, 78.0 + (timeLeft / 60) * 0.5);
  }

  // Accent colors
  const getThemeAccent = () => {
    switch (theme) {
      case 'strelizia': return 'text-[#ff2a5f] border-[#ff2a5f]/40 bg-[#ff2a5f]/10 shadow-glow-crimson';
      case 'neotokyo': return 'text-[#00f0ff] border-[#00f0ff]/40 bg-[#00f0ff]/10 shadow-glow-cyan';
      case 'cyberamber': return 'text-[#ffb703] border-[#ffb703]/40 bg-[#ffb703]/10 shadow-glow-amber';
      case 'pasteldream': return 'text-[#c084fc] border-[#c084fc]/40 bg-[#c084fc]/10 shadow-glow-pink';
    }
  };

  const getThemeButton = () => {
    switch (theme) {
      case 'strelizia': return 'bg-[#ff2a5f] hover:bg-[#e60049] text-white shadow-glow-crimson';
      case 'neotokyo': return 'bg-[#00f0ff] hover:bg-[#00d0df] text-black font-bold shadow-glow-cyan';
      case 'cyberamber': return 'bg-[#ffb703] hover:bg-[#e5a502] text-black font-bold shadow-glow-amber';
      case 'pasteldream': return 'bg-[#c084fc] hover:bg-[#a855f7] text-white shadow-glow-pink';
    }
  };

  return (
    <div className="bg-[#10141e]/90 backdrop-blur border border-[#242d42] rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Cockpit HUD telemetry header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#242d42] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-xs uppercase tracking-widest text-slate-300">
            STRELIZIA LINK // ACTIVE
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
          <span>STAMEN: <strong className="text-white">sm000ky</strong></span>
          <span className="text-slate-600">|</span>
          <span>PISTIL: <strong className="text-[#ff2a5f]">002</strong></span>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#090c13] rounded-xl border border-[#1f2638] mb-5">
        {(['pomodoro', 'deep', 'shortBreak', 'longBreak', 'free'] as FocusMode[]).map((m) => {
          const labels: Record<FocusMode, string> = {
            pomodoro: '25m Focus',
            deep: '50m Deep',
            shortBreak: '5m Rest',
            longBreak: '15m Rest',
            free: 'Stopwatch'
          };
          const isCurrent = mode === m;
          return (
            <button
              key={m}
              onClick={() => handleSelectMode(m)}
              className={`py-1.5 px-1 rounded-lg font-mono text-xs transition-all text-center truncate ${
                isCurrent
                  ? `${getThemeAccent()} font-bold`
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#151b2a]'
              }`}
            >
              {labels[m]}
            </button>
          );
        })}
      </div>

      {/* Timer & Sync Gauge Grid */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2">
        {/* Main Digital Clock */}
        <div className="text-center md:text-left">
          <div className="font-mono text-5xl md:text-6xl font-bold tracking-tight text-white drop-shadow-md">
            {formatTime(timeLeft)}
          </div>
          <div className="font-mono text-xs text-slate-400 mt-1 flex items-center justify-center md:justify-start gap-2">
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span>{isActive ? 'FOCUS SEQUENCE RUNNING' : 'SYSTEM READY'}</span>
          </div>
        </div>

        {/* Sync Rate & Telemetry Gauge */}
        <div className="w-full md:w-56 bg-[#090c13] border border-[#242d42] p-3 rounded-xl">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#ff2a5f]" />
              SYNC RATE
            </span>
            <span className="text-emerald-400 font-bold tracking-wider">
              {syncRate.toFixed(1)}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-[#161b29] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00f0ff] via-[#ffb703] to-[#ff2a5f] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-2">
            <span>SESSIONS: {completedSessions}</span>
            <span className="text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> SYNCED
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTimer}
            className={`px-6 py-3 rounded-xl font-display uppercase tracking-wider text-sm flex items-center gap-2 transition-transform active:scale-95 ${getThemeButton()}`}
          >
            {isActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isActive ? 'Pause' : 'Engage'}
          </button>
          <button
            onClick={resetTimer}
            title="Reset Timer"
            className="p-3 rounded-xl bg-[#161b29] hover:bg-[#20273b] border border-[#242d42] text-slate-300 hover:text-white transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
