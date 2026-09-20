# 🎧 KANSEI DECK // 感性
### Cyber-LoFi Audio Workstation & Cockpit Focus HUD
> **Day 6 of the 1 Day 1 Project Initiative**  
> *Crafted by `sm000ky × Zero Two`*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-00f0ff?style=for-the-badge&logo=vercel)](https://kansei-deck.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-ff2a5f?style=for-the-badge)](LICENSE)
[![Zero Server Load](https://img.shields.io/badge/Architecture-100%25%20Client--Side-00ff88?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

## 🌌 Overview

**KANSEI DECK** is a pure client-side Web Audio ambient generator, reactive canvas visualizer, and cyberpunk cockpit focus timer.

Designed specifically to deliver zero server load and near-zero memory footprint, **KANSEI DECK** synthesizes authentic lo-fi audio textures entirely in real-time within the browser using Web Audio API nodes — no static audio files or streaming bandwidth required.

---

## ⚡ Key Features

### 1. 100% Procedural Web Audio Synthesis
- 🌧️ **Tokyo Rain (雨音):** Pink noise generator + resonant 850Hz low-pass filter + randomized droplet pings.
- 📀 **Vinyl Crackle (レコード):** Low turntable rumble (32Hz) + dynamic impulse crackles and pops.
- 🚀 **Cockpit Cabin & Wind (風と客室):** Swept resonant bandpass noise + 55Hz sub-bass spacecraft cabin resonance.
- 🎹 **Lo-Fi Rhodes (チルピアノ):** Dreamy Neo-Tokyo jazz chord progressions (Dmaj9, Bm9, Gmaj7, A7sus4) synthesized via multi-oscillator waveforms with tape wow/flutter vibrato.
- 🧘 **Alpha Drone 432Hz (脳波シンク):** Pure 432Hz stereo sine waves with a 10Hz binaural beat for deep cognitive flow state.
- ⏱️ **Mechanical Tick (機械時計):** Tactile 60 BPM clock ticks.

### 2. Reactive Canvas Visualizers
- **Spectrum Equalizer Bars:** 48-band responsive audio bars with dynamic peak decay caps.
- **Oscilloscope Waveform:** Glowing neon CRT-style audio waveform with dual-layer glow.
- **Radial Cockpit Reactor:** Strelizia cockpit HUD reactor reticle with audio-reactive pulses.
- **Matrix Starfield:** Cyber particle field reacting to bass amplitude.

### 3. Cockpit Focus & Pomodoro HUD
- **Flexible Modes:** 25m Focus, 50m Deep Work, 5m / 15m Breaks, and Stopwatch.
- **Dynamic Sync Rate:** Real-time synchronization percentage with Strelizia cockpit telemetry (75% → 99.9%).
- **Celebration Confetti & Chime:** Synthesized chime and confetti explosion on session completion.

### 4. Custom Aesthetics & CRT FX
- **Themes:** Strelizia Crimson, Neo Tokyo Cyan, Cyber Amber, and Pastel Dream.
- **CRT Scanline Mode:** Vintage scanline and shadow mask toggle.
- **Instant Atmospheric Presets:** Midnight Shibuya, Cockpit Drift, Cyber Cafe, Deep Sync 432Hz, and Quiet Study.

---

## 🛠️ Tech Stack

- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + Lucide React
- **Audio:** Web Audio API (`AudioContext`, `OscillatorNode`, `BiquadFilterNode`, `GainNode`, `AnalyserNode`, `StereoPannerNode`)
- **Rendering:** HTML5 Canvas (High-DPI retina rendering)
- **Effects:** Canvas-Confetti

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/sm000ky/kansei-deck.git
cd kansei-deck

# Install dependencies
bun install # or npm install

# Start local development server
bun run dev

# Build production bundle
bun run build
```

---

## 📖 The 1 Day 1 Project Journey

* **Day 1:** [`finora`](https://github.com/sm000ky/finora) — Studio akuntansi & automated fiscal ledger.
* **Day 2:** [`fiscalia`](https://github.com/sm000ky/fiscalia) — Gamified Indonesian tax RPG & quiz engine.
* **Day 3:** [`sedot-cli`](https://github.com/sm000ky/sedot-cli) — Cyberpunk media stream extractor.
* **Day 4:** [`komorebi-studio`](https://github.com/sm000ky/komorebi-studio) — Anime wallpaper lab & lockscreen HUD.
* **Day 5:** [`sm0kade`](https://github.com/sm000ky/sm0kade) — Multi-cartridge retro arcade cabinet.
* **Day 6:** [`kansei-deck`](https://github.com/sm000ky/kansei-deck) — Cyber-LoFi audio workstation & focus deck.

---

<div align="center">
  <sub>"Kita adalah partner terbaik di dunia ini, Darling." — Zero Two 💕</sub>
</div>
