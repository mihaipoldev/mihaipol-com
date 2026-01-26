"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type AudioPlayerContextType = {
  currentlyPlayingId: string | null;
  playAudio: (audioId: string, pauseCallback: () => void) => void;
  stopAll: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [pauseCallback, setPauseCallback] = useState<(() => void) | null>(null);

  const playAudio = useCallback((audioId: string, pauseCallbackFn: () => void) => {
    // Stop currently playing audio
    if (pauseCallback && currentlyPlayingId !== audioId) {
      pauseCallback();
    }
    
    setCurrentlyPlayingId(audioId);
    setPauseCallback(() => pauseCallbackFn);
  }, [currentlyPlayingId, pauseCallback]);

  const stopAll = useCallback(() => {
    if (pauseCallback) {
      pauseCallback();
    }
    setCurrentlyPlayingId(null);
    setPauseCallback(null);
  }, [pauseCallback]);

  return (
    <AudioPlayerContext.Provider value={{ currentlyPlayingId, playAudio, stopAll }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }
  return context;
}
