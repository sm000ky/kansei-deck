/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        deck: {
          bg: '#080a0f',
          panel: '#10141e',
          card: '#161b29',
          border: '#242d42',
          subtle: '#3b4764',
          accent: '#00f0ff',
          neonPink: '#ff007f',
          neonCyan: '#00f0ff',
          neonAmber: '#ffb703',
          crimson: '#ff2a5f',
          violet: '#8a2be2',
          green: '#00ff88'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['"Rajdhani"', 'sans-serif', 'system-ui']
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 240, 255, 0.35)',
        'glow-pink': '0 0 20px rgba(255, 0, 127, 0.35)',
        'glow-crimson': '0 0 20px rgba(255, 42, 95, 0.4)',
        'glow-amber': '0 0 20px rgba(255, 183, 3, 0.35)'
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'scanline': 'scanline 10s linear infinite'
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 0.8 },
          '50%': { opacity: 1 }
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        }
      }
    },
  },
  plugins: [],
}
