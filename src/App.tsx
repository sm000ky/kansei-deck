import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { VisualizerCanvas } from './components/VisualizerCanvas';
import { FocusHUD } from './components/FocusHUD';
import { PresetSelector } from './components/PresetSelector';
import { SoundDeck } from './components/SoundDeck';
import { Footer } from './components/Footer';
import { VisualizerMode, DeckTheme, SoundChannel, SoundPreset } from './types';
import { INITIAL_CHANNELS, PRESETS } from './data/channels';
import { audioEngine } from './audio/AudioEngine';

export const App: React.FC = () => {
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');
  const [theme, setTheme] = useState<DeckTheme>('strelizia');
  const [crtEnabled, setCrtEnabled] = useState<boolean>(true);

  // Channels state
  const [channels, setChannels] = useState<SoundChannel[]>(INITIAL_CHANNELS);
  const [masterVolume, setMasterVolume] = useState<number>(0.8);
  const [isMasterMuted, setIsMasterMuted] = useState<boolean>(false);
  const [activePresetId, setActivePresetId] = useState<string | null>('midnight-shibuya');
  const [isAudioStarted, setIsAudioStarted] = useState<boolean>(false);

  // Initialize audio on first user action
  const ensureAudioStarted = async () => {
    if (!isAudioStarted) {
      await audioEngine.init();
      setIsAudioStarted(true);
      // apply current volumes
      channels.forEach((ch) => {
        audioEngine.setChannelVolume(ch.id, ch.volume, ch.isMuted);
      });
      audioEngine.setMasterVolume(isMasterMuted ? 0 : masterVolume);
    }
  };

  // Handle Channel Volume Change
  const handleChannelVolumeChange = async (id: string, vol: number) => {
    await ensureAudioStarted();
    setActivePresetId(null);
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id === id) {
          const updated = { ...ch, volume: vol, isMuted: vol === 0 };
          audioEngine.setChannelVolume(id, vol, updated.isMuted);
          return updated;
        }
        return ch;
      })
    );
  };

  // Handle Channel Mute Toggle
  const handleToggleChannelMute = async (id: string) => {
    await ensureAudioStarted();
    setActivePresetId(null);
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id === id) {
          const newMuted = !ch.isMuted;
          audioEngine.setChannelVolume(id, ch.volume, newMuted);
          return { ...ch, isMuted: newMuted };
        }
        return ch;
      })
    );
  };

  // Handle Master Volume
  const handleMasterVolumeChange = async (vol: number) => {
    await ensureAudioStarted();
    setMasterVolume(vol);
    setIsMasterMuted(false);
    audioEngine.setMasterVolume(vol);
  };

  const handleToggleMasterMute = async () => {
    await ensureAudioStarted();
    const newMuted = !isMasterMuted;
    setIsMasterMuted(newMuted);
    audioEngine.setMasterVolume(newMuted ? 0 : masterVolume);
  };

  // Handle Preset Selection
  const handleSelectPreset = async (preset: SoundPreset) => {
    await ensureAudioStarted();
    setActivePresetId(preset.id);
    setChannels((prev) =>
      prev.map((ch) => {
        const targetVol = preset.volumes[ch.id] ?? 0;
        const isMuted = targetVol === 0;
        audioEngine.setChannelVolume(ch.id, targetVol, isMuted);
        return {
          ...ch,
          volume: targetVol,
          isMuted
        };
      })
    );
  };

  // Randomize Mix
  const handleRandomizeMix = async () => {
    await ensureAudioStarted();
    setActivePresetId(null);
    setChannels((prev) =>
      prev.map((ch) => {
        // Pick random volume or silence
        const active = Math.random() > 0.35;
        const vol = active ? Number((0.2 + Math.random() * 0.7).toFixed(2)) : 0;
        const isMuted = vol === 0;
        audioEngine.setChannelVolume(ch.id, vol, isMuted);
        return {
          ...ch,
          volume: vol,
          isMuted
        };
      })
    );
  };

  // Reset / Silence All
  const handleResetAll = async () => {
    await ensureAudioStarted();
    setActivePresetId(null);
    setChannels((prev) =>
      prev.map((ch) => {
        audioEngine.setChannelVolume(ch.id, ch.volume, true);
        return { ...ch, isMuted: true };
      })
    );
  };

  // Check if any channel is playing
  const isPlaying = isAudioStarted && !isMasterMuted && channels.some((ch) => !ch.isMuted && ch.volume > 0);

  return (
    <div className={`min-h-screen bg-[#080a0f] text-slate-100 flex flex-col ${crtEnabled ? 'crt-overlay' : ''}`}>
      <Header
        visualizerMode={visualizerMode}
        theme={theme}
        crtEnabled={crtEnabled}
        onSelectVisualizerMode={setVisualizerMode}
        onSelectTheme={setTheme}
        onToggleCrt={() => setCrtEnabled(!crtEnabled)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Visualizer Canvas Display */}
        <VisualizerCanvas
          mode={visualizerMode}
          theme={theme}
          isPlaying={isPlaying}
        />

        {/* Focus HUD & Pomodoro Telemetry */}
        <FocusHUD theme={theme} />

        {/* Atmospheric Presets */}
        <PresetSelector
          activePresetId={activePresetId}
          theme={theme}
          onSelectPreset={handleSelectPreset}
        />

        {/* Sound Channel Deck & Master Controls */}
        <SoundDeck
          channels={channels}
          masterVolume={masterVolume}
          isMasterMuted={isMasterMuted}
          theme={theme}
          onChannelVolumeChange={handleChannelVolumeChange}
          onToggleChannelMute={handleToggleChannelMute}
          onMasterVolumeChange={handleMasterVolumeChange}
          onToggleMasterMute={handleToggleMasterMute}
          onRandomizeMix={handleRandomizeMix}
          onResetAll={handleResetAll}
        />
      </main>

      <Footer />
    </div>
  );
};

export default App;
