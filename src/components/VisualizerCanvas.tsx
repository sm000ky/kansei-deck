import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { VisualizerMode, DeckTheme } from '../types';
import { audioEngine } from '../audio/AudioEngine';

interface VisualizerCanvasProps {
  mode: VisualizerMode;
  theme: DeckTheme;
  isPlaying: boolean;
  isCompact?: boolean;
  onToggleCompact?: () => void;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  mode,
  theme,
  isPlaying,
  isCompact = false,
  onToggleCompact
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  const peaksRef = useRef<number[]>(new Array(64).fill(0));
  const particlesRef = useRef<Array<{ x: number; y: number; size: number; speed: number; char: string; opacity: number }>>([]);

  const getThemeColors = () => {
    switch (theme) {
      case 'strelizia':
        return {
          primary: '#ff2a5f',
          secondary: '#ffb703',
          glow: 'rgba(255, 42, 95, 0.65)',
          bgGradient: ['rgba(255, 42, 95, 0.08)', 'rgba(0, 0, 0, 0.5)']
        };
      case 'neotokyo':
        return {
          primary: '#00f0ff',
          secondary: '#ff007f',
          glow: 'rgba(0, 240, 255, 0.65)',
          bgGradient: ['rgba(0, 240, 255, 0.08)', 'rgba(0, 0, 0, 0.5)']
        };
      case 'cyberamber':
        return {
          primary: '#ffb703',
          secondary: '#00ff88',
          glow: 'rgba(255, 183, 3, 0.65)',
          bgGradient: ['rgba(255, 183, 3, 0.08)', 'rgba(0, 0, 0, 0.5)']
        };
      case 'pasteldream':
        return {
          primary: '#c084fc',
          secondary: '#38bdf8',
          glow: 'rgba(192, 132, 252, 0.65)',
          bgGradient: ['rgba(192, 132, 252, 0.08)', 'rgba(0, 0, 0, 0.5)']
        };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (particlesRef.current.length === 0) {
      const chars = '0123456789ABCDEF002JIAN';
      particlesRef.current = Array.from({ length: 60 }, () => ({
        x: Math.random() * 800,
        y: Math.random() * 300,
        size: 9 + Math.random() * 7,
        speed: 0.5 + Math.random() * 1.5,
        char: chars[Math.floor(Math.random() * chars.length)],
        opacity: 0.2 + Math.random() * 0.7
      }));
    }

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const analyser = audioEngine.getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    let angleOffset = 0;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);
      const colors = getThemeColors();

      let hasSignal = false;
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);
        const sum = freqData.reduce((a, b) => a + b, 0);
        hasSignal = sum > 50;
      }

      // Background subtle cyber grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Idle wave if no audio signal
      if (!hasSignal) {
        const time = Date.now() * 0.002;
        for (let i = 0; i < bufferLength; i++) {
          freqData[i] = Math.max(8, Math.sin(time + i * 0.1) * 16 + 20);
          timeData[i] = 128 + Math.sin(time + i * 0.08) * 10;
        }
      }

      // MODE 1: SPECTRUM BARS
      if (mode === 'bars') {
        const barCount = 48;
        const barWidth = (width / barCount) - 2.5;
        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          const val = freqData[i * step] || 0;
          const percent = val / 255;
          const barHeight = Math.max(3, percent * (height - 24));

          const x = i * (barWidth + 2.5) + 1.5;
          const y = height - barHeight - 6;

          const grad = ctx.createLinearGradient(0, height, 0, y);
          grad.addColorStop(0, colors.secondary);
          grad.addColorStop(1, colors.primary);

          ctx.fillStyle = grad;
          ctx.shadowColor = colors.glow;
          ctx.shadowBlur = hasSignal ? 8 : 2;

          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();

          const peaks = peaksRef.current;
          if (y < peaks[i] || peaks[i] === 0) {
            peaks[i] = y;
          } else {
            peaks[i] = Math.min(height - 8, peaks[i] + 1.2);
          }

          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 3;
          ctx.fillRect(x, peaks[i] - 2, barWidth, 2);
        }
        ctx.shadowBlur = 0;
      }

      // MODE 2: OSCILLOSCOPE WAVEFORM
      else if (mode === 'wave') {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = colors.primary;
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = hasSignal ? 16 : 4;

        ctx.beginPath();
        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Secondary glow wave
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = colors.secondary;
        ctx.beginPath();
        x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = (timeData[i] - 128) * 0.5 + 128;
          const y = ((v / 128.0) * height) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // MODE 3: RADIAL COCKPIT REACTOR
      else if (mode === 'radial') {
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.28;

        angleOffset += hasSignal ? 0.015 : 0.004;

        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = colors.bgGradient[0];
        ctx.fill();
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 2;
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 12;
        ctx.stroke();

        const numPoints = 56;
        ctx.beginPath();
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2 + angleOffset;
          const freqVal = freqData[i % bufferLength] || 0;
          const spike = (freqVal / 255) * (baseRadius * 0.75);
          const r = baseRadius + spike;

          const px = centerX + Math.cos(angle) * r;
          const py = centerY + Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = colors.secondary;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Crosshairs
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - baseRadius * 1.25, centerY);
        ctx.lineTo(centerX + baseRadius * 1.25, centerY);
        ctx.moveTo(centerX, centerY - baseRadius * 1.25);
        ctx.lineTo(centerX, centerY + baseRadius * 1.25);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // MODE 4: MATRIX / STARFIELD
      else if (mode === 'matrix') {
        const bassVal = (freqData[2] || 0) / 255;
        ctx.font = '10px "JetBrains Mono", monospace';

        particlesRef.current.forEach((p) => {
          p.y += p.speed * (1 + bassVal * 2.2);
          if (p.y > height) {
            p.y = -8;
            p.x = Math.random() * width;
          }

          ctx.fillStyle = colors.primary;
          ctx.globalAlpha = p.opacity * (0.35 + bassVal * 0.65);
          ctx.fillText(p.char, p.x, p.y);
        });
        ctx.globalAlpha = 1.0;
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [mode, theme, isPlaying, isCompact]);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-[#080b12] border border-[#242d42] shadow-xl transition-all duration-300 ${
        isCompact ? 'h-28 md:h-36' : 'h-40 md:h-52'
      }`}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Top HUD Telemetry */}
      <div className="absolute top-2.5 left-3.5 flex items-center gap-2 pointer-events-none">
        <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
        <span className="font-mono text-[9px] tracking-widest text-slate-400 uppercase">
          {isPlaying ? 'AUDIO ENGINE // ACTIVE' : 'AUDIO ENGINE // STANDBY'}
        </span>
      </div>

      <div className="absolute top-2.5 right-3.5 flex items-center gap-2">
        <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest pointer-events-none">
          {mode.toUpperCase()}
        </span>
        {onToggleCompact && (
          <button
            onClick={() => {
              audioEngine.playClick();
              onToggleCompact();
            }}
            title={isCompact ? 'Expand Visualizer' : 'Compact Visualizer'}
            className="p-1 rounded bg-[#161b29]/80 hover:bg-[#20273b] text-slate-400 hover:text-white border border-[#242d42] transition-all"
          >
            {isCompact ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>
        )}
      </div>
    </div>
  );
};
