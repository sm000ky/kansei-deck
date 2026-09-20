import React, { useState, useEffect, useRef } from 'react';
import { ConsoleHeader } from './components/ConsoleHeader';
import { MonitorDisplay } from './components/MonitorDisplay';
import { MixerRack } from './components/MixerRack';
import { MobileDeck } from './components/MobileDeck';
import { ZenMode } from './components/ZenMode';
import { VisualizerMode, DeckTheme, SoundChannel, SoundPreset, MasterEqProfile } from './types';
import { INITIAL_CHANNELS, PRESETS } from './data/channels';
import { audioEngine } from './audio/AudioEngine';

export const App: React.FC = () => {
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');
  const [theme, setTheme] = useState<DeckTheme>('strelizia');
  const [crtEnabled, setCrtEnabled] = useState<boolean>(true);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);

  // Master Playback State
  const [isPlaybackActive, setIsPlaybackActive] = useState<boolean>(false);

  // Channels state
  const [channels, setChannels] = useState<SoundChannel[]>(INITIAL_CHANNELS);
  const [masterVolume, setMasterVolume] = useState<number>(0.8);
  const [isMasterMuted, setIsMasterMuted] = useState<boolean>(false);
  const [masterProfile, setMasterProfile] = useState<MasterEqProfile>('flat');
  const [activePresetId, setActivePresetId] = useState<string | null>('midnight-shibuya');
  const [soloChannelId, setSoloChannelId] = useState<string | null>(null);

  const preSoloState = useRef<SoundChannel[] | null>(null);

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

  const handleTogglePlayback = async () => {
    audioEngine.playClick();
    if (isPlaybackActive) {
      await audioEngine.setPlayback(false);
      setIsPlaybackActive(false);
    } else {
      await ensureAudioStarted(true);
    }
  };

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

  const handleSoloChannel = async (id: string) => {
    await ensureAudioStarted(true);
    setActivePresetId(null);

    if (soloChannelId === id) {
      if (preSoloState.current) {
        setChannels(preSoloState.current);
        preSoloState.current.forEach((ch) => {
          audioEngine.setChannelVolume(ch.id, ch.volume, ch.isMuted);
        });
        preSoloState.current = null;
      }
      setSoloChannelId(null);
    } else {
      preSoloState.current = [...channels];
      setSoloChannelId(id);
      setChannels((prev) =>
        prev.map((ch) => {
          const isTarget = ch.id === id;
          const isMuted = !isTarget;
          audioEngine.setChannelVolume(ch.id, ch.volume, isMuted);
          return { ...ch, isMuted };
        })
      );
    }
  };

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

  // Keyboard Shortcuts
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
    <div
      className={`h-[100dvh] w-screen overflow-hidden bg-[#07090e] text-slate-100 flex flex-col select-none ${
        crtEnabled ? 'crt-overlay' : ''
      }`}
    >
      {/* Top Console Navigation Bar */}
      <ConsoleHeader
        theme={theme}
        isPlaying={isPlaybackActive}
        masterVolume={masterVolume}
        isMasterMuted={isMasterMuted}
        masterProfile={masterProfile}
        crtEnabled={crtEnabled}
        onTogglePlayback={handleTogglePlayback}
        onMasterVolumeChange={handleMasterVolumeChange}
        onToggleMasterMute={handleToggleMasterMute}
        onSelectMasterProfile={handleSelectMasterProfile}
        onSelectTheme={setTheme}
        onToggleCrt={() => setCrtEnabled(!crtEnabled)}
        onToggleZen={() => setIsZenMode(true)}
      />

      {/* Main Workstation Body (Zero page scroll, fits 100vh) */}
      <main className="flex-1 min-h-0 p-2 md:p-3 flex flex-col md:flex-row gap-2.5 md:gap-3 overflow-hidden">
        {/* Desktop View: Left Monitor + Right Mixer */}
        <div className="hidden md:flex flex-1 min-h-0 gap-3 overflow-hidden">
          <MonitorDisplay
            visualizerMode={visualizerMode}
            theme={theme}
            isPlaying={isPlaybackActive}
            activePresetId={activePresetId}
            onSelectVisualizerMode={setVisualizerMode}
            onSelectPreset={handleSelectPreset}
          />
          <MixerRack
            channels={channels}
            theme={theme}
            soloChannelId={soloChannelId}
            masterProfile={masterProfile}
            onChannelVolumeChange={handleChannelVolumeChange}
            onToggleChannelMute={handleToggleChannelMute}
            onSoloChannel={handleSoloChannel}
            onSelectMasterProfile={handleSelectMasterProfile}
            onRandomizeMix={handleRandomizeMix}
            onResetAll={handleResetAll}
          />
        </div>

        {/* Mobile View: Upper Monitor + Lower Tabbed Deck */}
        <div className="flex md:hidden flex-1 min-h-0 flex-col gap-2 overflow-hidden">
          <div className="h-[46%] shrink-0 flex flex-col overflow-hidden">
            <MonitorDisplay
              visualizerMode={visualizerMode}
              theme={theme}
              isPlaying={isPlaybackActive}
              activePresetId={activePresetId}
              onSelectVisualizerMode={setVisualizerMode}
              onSelectPreset={handleSelectPreset}
            />
          </div>
          <div className="h-[54%] min-h-0 flex flex-col overflow-hidden">
            <MobileDeck
              channels={channels}
              theme={theme}
              activePresetId={activePresetId}
              soloChannelId={soloChannelId}
              masterProfile={masterProfile}
              onChannelVolumeChange={handleChannelVolumeChange}
              onToggleChannelMute={handleToggleChannelMute}
              onSoloChannel={handleSoloChannel}
              onSelectMasterProfile={handleSelectMasterProfile}
              onSelectPreset={handleSelectPreset}
              onRandomizeMix={handleRandomizeMix}
              onResetAll={handleResetAll}
            />
          </div>
        </div>
      </main>

      {/* Fullscreen Zen Mode Overlay */}
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
