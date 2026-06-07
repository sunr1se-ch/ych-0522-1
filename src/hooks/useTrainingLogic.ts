import { useEffect, useCallback, useState } from 'react';
import { useTrainingStore } from '@/store/useTrainingStore';
import { useAudioPlayer } from './useAudioPlayer';
import { useKeyPress } from './useKeyPress';
import { sampleMusic } from '@/data/sampleMusic';

export function useTrainingLogic() {
  const {
    musicData,
    isPlaying,
    currentTime,
    stats,
    lastRating,
    lastDeviation,
    bestRecord,
    hitRecords,
    isFinished,
    setMusicData,
    startPlaying,
    stopPlaying,
    resetTraining,
    handleKeyPress,
    updateProgress,
    finishTraining,
    checkMissedPoints,
  } = useTrainingStore();

  useEffect(() => {
    setMusicData(sampleMusic);
  }, [setMusicData]);

  const [playError, setPlayError] = useState<string | null>(null);

  const handleTimeUpdate = useCallback(
    (timeMs: number) => {
      updateProgress(timeMs);
      checkMissedPoints(timeMs);
    },
    [updateProgress, checkMissedPoints]
  );

  const handleEnded = useCallback(() => {
    finishTraining();
  }, [finishTraining]);

  const { play, pause, reset } = useAudioPlayer({
    audioUrl: musicData?.audioUrl || '',
    onTimeUpdate: handleTimeUpdate,
    onEnded: handleEnded,
  });

  const onKeyPress = useCallback(() => {
    if (!isPlaying || !musicData) return;
    const pressTime = currentTime;
    handleKeyPress(pressTime);
  }, [isPlaying, currentTime, musicData, handleKeyPress]);

  useKeyPress({
    onKeyPress,
    enabled: isPlaying,
    debounceMs: 50,
  });

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      pause();
      stopPlaying();
      setPlayError(null);
    } else {
      setPlayError(null);
      if (isFinished) {
        resetTraining();
        reset();
        await new Promise((r) => setTimeout(r, 50));
      }
      const success = await play();
      if (success) {
        startPlaying();
      } else {
        setPlayError('音频播放失败，请检查浏览器权限或音频文件后重试');
      }
    }
  }, [isPlaying, isFinished, play, pause, reset, startPlaying, stopPlaying, resetTraining]);

  const handleReset = useCallback(() => {
    pause();
    resetTraining();
    reset();
    setPlayError(null);
  }, [pause, resetTraining, reset]);

  return {
    musicData,
    isPlaying,
    currentTime,
    stats,
    lastRating,
    lastDeviation,
    bestRecord,
    hitRecords,
    isFinished,
    handlePlayPause,
    handleReset,
    playError,
  };
}
