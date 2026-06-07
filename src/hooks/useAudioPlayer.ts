import { useRef, useEffect, useCallback } from 'react';

interface UseAudioPlayerProps {
  audioUrl: string;
  onTimeUpdate: (currentTimeMs: number) => void;
  onEnded: () => void;
  onLoaded?: (durationMs: number) => void;
}

export function useAudioPlayer({
  audioUrl,
  onTimeUpdate,
  onEnded,
  onLoaded,
}: UseAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (onLoaded && audio.duration) {
        onLoaded(Math.round(audio.duration * 1000));
      }
    };

    const handleEnded = () => {
      cancelAnimationFrame(rafRef.current!);
      onEnded();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      cancelAnimationFrame(rafRef.current!);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl, onEnded, onLoaded]);

  const tick = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime !== undefined) {
      const currentMs = Math.round(audioRef.current.currentTime * 1000);
      onTimeUpdate(currentMs);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [onTimeUpdate]);

  const play = useCallback(async (): Promise<boolean> => {
    if (!audioRef.current) return false;
    try {
      await audioRef.current.play();
      startTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
      return true;
    } catch (e) {
      console.error('Audio play failed:', e);
      return false;
    }
  }, [tick]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    cancelAnimationFrame(rafRef.current!);
  }, []);

  const reset = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    cancelAnimationFrame(rafRef.current!);
    onTimeUpdate(0);
  }, [onTimeUpdate]);

  const seek = useCallback((timeMs: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = timeMs / 1000;
    onTimeUpdate(timeMs);
  }, [onTimeUpdate]);

  return { play, pause, reset, seek, audioRef };
}
