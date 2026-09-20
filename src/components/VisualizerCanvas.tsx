import React, { useEffect, useRef } from 'react';
import { VisualizerMode, DeckTheme } from '../types';
import { audioEngine } from '../audio/AudioEngine';

interface VisualizerCanvasProps {
  mode: VisualizerMode;
  theme: DeckTheme;
  isPlaying: boolean;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({ mode, theme, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Peak caps array for bars mode
  const peaksRef = useRef<number[]>(new Array(64).fill(0));
  // Particles for matrix mode
  const particlesRef = useRef<Array<{ x: number; y: number; size: number; speed: number; char: string; opacity: number }>>([]);

  // Get color palette based on theme
  const getThemeColors = () => {
    switch (theme) {
      case 'strelizia':
        return {
          primary: '#ff2a5f',
          secondary: '#ffb703',
          glow: 'rgba(255, 42, 95, 0.6)',
          bgGradient: ['rgba(255, 42, 95, 0.08)', 'rgba(0, 0, 0, 0.4)']
        };
      case 'neotokyo':
        return {
          primary: '#00f0ff',
          secondary: '#ff007f',
          glow: 'rgba(0, 240, 255, 0.6)',
          bgGradient: ['rgba(0, 240, 255, 0.08)', 'rgba(0, 0, 0, 0.4)']
        };
      case 'cyberamber':
        return {
          primary: '#ffb703',
          secondary: '#00ff88',
          glow: 'rgba(255, 183, 3, 0.6)',
          bgGradient: ['rgba(255, 183, 3, 0.08)', 'rgba(0, 0, 0, 0.4)']
        };
      case 'pasteldream':
        return {
          primary: '#c084fc',
          secondary: '#38bdf8',
          glow: 'rgba(192, 132, 252, 0.6)',
          bgGradient: ['rgba(192, 132, 252, 0.08)', 'rgba(0, 0, 0, 0.4)']
        };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize particles for matrix/particle mode
    if (particlesRef.current.length === 0) {
      const chars = '0123456789ABCDEF002JIAN';
      particlesRef.current = Array.from({ length: 70 }, () => ({
        x: Math.random() * 800,
        y: Math.random() * 300,
        size: 9 + Math.random() * 8,
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

    // Buffer arrays
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

      // Read audio data if available
      let hasSignal = false;
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);
        // Check if there is genuine audio activity
        const sum = freqData.reduce((a, b) => a + b, 0);
        hasSignal = sum > 50;
      }

      // Draw subtle background grid/scanline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 24;
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

      // If idle/no signal, generate subtle breathing wave
      if (!hasSignal) {
        const time = Date.now() * 0.002;
        for (let i = 0; i < bufferLength; i++) {
          freqData[i] = Math.max(10, Math.sin(time + i * 0.1) * 20 + 25);
          timeData[i] = 128 + Math.sin(time + i * 0.08) * 12;
        }
      }

      // MODE 1: EQUALIZER BARS
      if (mode === 'bars') {
        const barCount = 48;
        const barWidth = (width / barCount) - 3;
        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          const val = freqData[i * step] || 0;
          const percent = val / 255;
          const barHeight = Math.max(4, percent * (height - 30));

          const x = i * (barWidth + 3) + 2;
          const y = height - barHeight - 10;

          // Gradient fill
          const grad = ctx.createLinearGradient(0, height, 0, y);
          grad.addColorStop(0, colors.secondary);
          grad.addColorStop(1, colors.primary);

          ctx.fillStyle = grad;
          ctx.shadowColor = colors.glow;
          ctx.shadowBlur = hasSignal ? 10 : 2;

          // Rounded bar top
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
          ctx.fill();

          // Peak cap decay
          const peaks = peaksRef.current;
          if (y < peaks[i] || peaks[i] === 0) {
            peaks[i] = y;
          } else {
            peaks[i] = Math.min(height - 12, peaks[i] + 1.2);
          }

          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 4;
          ctx.fillRect(x, peaks[i] - 2, barWidth, 2);
        }
        ctx.shadowBlur = 0;
      }

      // MODE 2: OSCILLOSCOPE WAVEFORM
      else if (mode === 'wave') {
        ctx.lineWidth = 3;
        ctx.strokeStyle = colors.primary;
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = hasSignal ? 18 : 6;

        ctx.beginPath();
        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Secondary echoing wave for depth
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = colors.secondary;
        ctx.beginPath();
        x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = (timeData[i] - 128) * 0.6 + 128;
          const y = ((v / 128.0) * height) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // MODE 3: RADIAL COCKPIT REACTOR PULSE
      else if (mode === 'radial') {
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.25;

        angleOffset += hasSignal ? 0.015 : 0.005;

        // Inner glowing core
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = colors.bgGradient[0];
        ctx.fill();
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 2;
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 15;
        ctx.stroke();

        // Radial spikes around the ring
        const numPoints = 64;
        ctx.beginPath();
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2 + angleOffset;
          const freqVal = freqData[i % bufferLength] || 0;
          const spike = (freqVal / 255) * (baseRadius * 0.9);
          const r = baseRadius + spike;

          const px = centerX + Math.cos(angle) * r;
          const py = centerY + Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = colors.secondary;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Strelizia reticle marks
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - baseRadius * 1.3, centerY);
        ctx.lineTo(centerX + baseRadius * 1.3, centerY);
        ctx.moveTo(centerX, centerY - baseRadius * 1.3);
        ctx.lineTo(centerX, centerY + baseRadius * 1.3);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // MODE 4: MATRIX / CYBER STARFIELD
      else if (mode === 'matrix') {
        const bassVal = (freqData[2] || 0) / 255;
        ctx.font = '11px "JetBrains Mono", monospace';

        particlesRef.current.forEach((p) => {
          p.y += p.speed * (1 + bassVal * 2.5);
          if (p.y > height) {
            p.y = -10;
            p.x = Math.random() * width;
          }

          ctx.fillStyle = colors.primary;
          ctx.globalAlpha = p.opacity * (0.4 + bassVal * 0.6);
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
  }, [mode, theme, isPlaying]);

  return (
    <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden bg-[#080b12] border border-[#242d42] shadow-2xl flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full block" />
      
      {/* Top HUD overlay status */}
      <div className="absolute top-3 left-4 flex items-center gap-2 pointer-events-none">
        <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
        <span className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">
          {isPlaying ? 'AUDIO SPECTRUM // ACTIVE' : 'AUDIO SPECTRUM // STANDBY'}
        </span>
      </div>

      <div className="absolute top-3 right-4 pointer-events-none">
        <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
          MODE: {mode.toUpperCase()}
        </span>
      </div>
    </div>
  );
};
