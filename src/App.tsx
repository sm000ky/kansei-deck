import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { VisualizerCanvas } from './components/VisualizerCanvas';
import { FocusHUD } from './components/FocusHUD';
import { PresetSelector } from './components/PresetSelector';
import { SoundDeck } from './components/SoundDeck';
import { Footer } from './components/Footer';
import { ZenMode } from './components/ZenMode';
import { VisualizerMode, DeckTheme, SoundChannel, SoundPreset, MasterEqProfile } from './types';
import { INITIAL_CHANNELS, PRESETS } from './data/channels';
import { audioEngine } from './audio/AudioEngine';

export const App: React.FC = () => {
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');
  const [theme, setTheme] = useState<DeckTheme>('strelizia');
  const [crtEnabled, setCrtEnabled] = useState<boolean>(true);
  const [isCompactVisualizer, setIsCompactVisualizer] = useState<boolean>(false);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);

  // Master Deck Playback State (Controls both Audio & Focus HUD)
  const [isPlaybackActive, setIsPlaybackActive] = useState<boolean>(false);

  // Audio Channels state
  const [channels, setChannels] = useState<SoundChannel[]>(INITIAL_CHANNELS);
  const [masterVolume, setMasterVolume] = useState<number>(0.8);
  const [isMasterMuted, setIsMasterMuted] = useState<boolean>(false);
  const [masterProfile, setMasterProfile] = useState<MasterEqProfile>('flat');
  const [activePresetId, setActivePresetId] = useState<string | null>('midnight-shibuya');
  const [soloChannelId, setSoloChannelId] = useState<string | null>(null);

  // Pre-solo saved state
  const preSoloState = useRef<SoundChannel[] | null>(null);

  // Initialize and engage audio engine
  const ensureAudioStarted = async (forcePlay = false) => {
    await audioEngine.init();
    channels.forEach((ch) => {
      audioEngine.setChannelVolume(ch.id, ch.volume, ch.isMuted);
    });
    audioEngine.setMasterVolume(isMasterMuted ? 0 : masterVolume);
    audioEngine.setMasterProfile(masterProfile);

    if (forcePlay || !isPlaybackActive) {
      await audioEngine.setPlayback(true);
      setIsPlaybackActive(true);
    }
  };

  // Master Playback Toggle (Engage Deck / Pause Deck)
  const handleTogglePlayback = async () => {
    audioEngine.playClick();
    if (isPlaybackActive) {
      await audioEngine.setPlayback(false);
      setIsPlaybackActive(false);
    } else {
      await ensureAudioStarted(true);
    }
  };

  // Channel Volume Change
  const handleChannelVolumeChange = async (id: string, vol: number) => {
    await ensureAudioStarted(true);
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

  // Toggle Channel Mute
  const handleToggleChannelMute = async (id: string) => {
    await ensureAudioStarted(true);
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

  // Solo Channel Handler
  const handleSoloChannel = async (id: string) => {
    await ensureAudioStarted(true);
    setActivePresetId(null);

    if (soloChannelId === id) {
      // Restore pre-solo state
      if (preSoloState.current) {
        setChannels(preSoloState.current);
        preSoloState.current.forEach((ch) => {
          audioEngine.setChannelVolume(ch.id, ch.volume, ch.isMuted);
        });
        preSoloState.current = null;
      }
      setSoloChannelId(null);
    } else {
      // Save current state and solo target channel
      preSoloState.current = [...channels];
      setSoloChannelId(id);
      setChannels((prev) =>
        prev.map((ch) => {
          const isTarget = ch.id === id;
          const isMuted = !isTarget;
          audioEngine.setChannelVolume(ch.id, ch.volume, isMuted);
          return {
            ...ch,
            isMuted
          };
        })
      );
    }
  };

  // Master Volume Change
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

  const handleSelectMasterProfile = async (profile: MasterEqProfile) => {
    await ensureAudioStarted();
    setMasterProfile(profile);
    audioEngine.setMasterProfile(profile);
  };

  // Select Preset
  const handleSelectPreset = async (preset: SoundPreset) => {
    await ensureAudioStarted(true);
    setActivePresetId(preset.id);
    setSoloChannelId(null);
    preSoloState.current = null;

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
    await ensureAudioStarted(true);
    setActivePresetId(null);
    setSoloChannelId(null);
    preSoloState.current = null;

    setChannels((prev) =>
      prev.map((ch) => {
        const active = Math.random() > 0.4;
        const vol = active ? Number((0.25 + Math.random() * 0.65).toFixed(2)) : 0;
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

  // Silence All Channels
  const handleResetAll = async () => {
    await ensureAudioStarted();
    setActivePresetId(null);
    setSoloChannelId(null);
    preSoloState.current = null;

    setChannels((prev) =>
      prev.map((ch) => {
        audioEngine.setChannelVolume(ch.id, ch.volume, true);
        return { ...ch, isMuted: true };
      })
    );
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlayback();
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleMasterMute();
      } else if (e.key === 'z' || e.key === 'Z') {
        setIsZenMode((prev) => !prev);
      } else if (e.key === 'c' || e.key === 'C') {
        setCrtEnabled((prev) => !prev);
      } else if (e.key === '1') {
        setVisualizerMode('bars');
      } else if (e.key === '2') {
        setVisualizerMode('wave');
      } else if (e.key === '3') {
        setVisualizerMode('radial');
      } else if (e.key === '4') {
        setVisualizerMode('matrix');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaybackActive, isMasterMuted, masterVolume]);

  const activePreset = PRESETS.find((p) => p.id === activePresetId);

  return (
    <div className={`min-h-screen bg-[#080a0f] text-slate-100 flex flex-col ${crtEnabled ? 'crt-overlay' : ''}`}>
      <Header
        visualizerMode={visualizerMode}
        theme={theme}
        crtEnabled={crtEnabled}
        isPlaying={isPlaybackActive}
        onSelectVisualizerMode={setVisualizerMode}
        onSelectTheme={setTheme}
        onToggleCrt={() => setCrtEnabled(!crtEnabled)}
        onToggleZen={() => setIsZenMode(true)}
        onTogglePlayback={handleTogglePlayback}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 md:px-4 py-4 flex flex-col gap-3.5">
        {/* Visualizer Canvas */}
        <VisualizerCanvas
          mode={visualizerMode}
          theme={theme}
          isPlaying={isPlaybackActive}
          isCompact={isCompactVisualizer}
          onToggleCompact={() => setIsCompactVisualizer(!isCompactVisualizer)}
        />

        {/* Focus HUD (Engage / Pause Deck) */}
        <FocusHUD
          theme={theme}
          isActive={isPlaybackActive}
          onToggleActive={handleTogglePlayback}
        />

        {/* 12 Atmospheric Presets */}
        <PresetSelector
          activePresetId={activePresetId}
          theme={theme}
          onSelectPreset={handleSelectPreset}
        />

        {/* 10 Sound Channels Deck */}
        <SoundDeck
          channels={channels}
          masterVolume={masterVolume}
          isMasterMuted={isMasterMuted}
          theme={theme}
          masterProfile={masterProfile}
          soloChannelId={soloChannelId}
          onChannelVolumeChange={handleChannelVolumeChange}
          onToggleChannelMute={handleToggleChannelMute}
          onSoloChannel={handleSoloChannel}
          onMasterVolumeChange={handleMasterVolumeChange}
          onToggleMasterMute={handleToggleMasterMute}
          onSelectMasterProfile={handleSelectMasterProfile}
          onRandomizeMix={handleRandomizeMix}
          onResetAll={handleResetAll}
        />
      </main>

      <Footer />

      {/* Fullscreen Zen Mode */}
      {isZenMode && (
        <ZenMode
          theme={theme}
          visualizerMode={visualizerMode}
          isPlaying={isPlaybackActive}
          activePresetName={activePreset ? `${activePreset.name} (${activePreset.jpName})` : 'Custom Mix'}
          onExit={() => setIsZenMode(false)}
        />
      )}
    </div>
  );
};

export default App;
