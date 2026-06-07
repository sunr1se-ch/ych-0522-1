import { useEffect, useCallback, useState, useRef } from 'react';
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
    isPracticeMode,
    practiceSegment,
    practiceLoopCount,
    selectedRounds,
    setMusicData,
    startPlaying,
    stopPlaying,
    resetTraining,
    handleKeyPress,
    updateProgress,
    finishTraining,
    checkMissedPoints,
    toggleRoundSelection,
    clearRoundSelection,
    enterPracticeMode,
    exitPracticeMode,
  } = useTrainingStore();

  useEffect(() => {
    setMusicData(sampleMusic);
  }, [setMusicData]);

  const [playError, setPlayError] = useState<string | null>(null);
  const isLoopingRef = useRef(false);

  const handleTimeUpdate = useCallback(
    (timeMs: number, seekFn: (timeMs: number) => void) => {
      const state = useTrainingStore.getState();

      if (state.isPracticeMode && state.practiceSegment) {
        const { startTime, endTime } = state.practiceSegment;

        if (timeMs >= endTime) {
          if (!isLoopingRef.current) {
            isLoopingRef.current = true;
            state.incrementPracticeLoop();
            state.resetSegmentMatchedIndices();
            seekFn(startTime);
            setTimeout(() => {
              isLoopingRef.current = false;
            }, 100);
          }
          return;
        }
      }

      updateProgress(timeMs);
      checkMissedPoints(timeMs);
    },
    [updateProgress, checkMissedPoints]
  );

  const handleEnded = useCallback(() => {
    const state = useTrainingStore.getState();
    if (!state.isPracticeMode) {
      finishTraining();
    }
  }, [finishTraining]);

  const { play, pause, reset, seek } = useAudioPlayer({
    audioUrl: musicData?.audioUrl || '',
    onTimeUpdate: (timeMs: number) => handleTimeUpdate(timeMs, seek),
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
      if (isFinished && !isPracticeMode) {
        resetTraining();
        reset();
        await new Promise((r) => setTimeout(r, 50));
      }

      const state = useTrainingStore.getState();
      if (state.isPracticeMode && state.practiceSegment) {
        const currentT = state.currentTime;
        const { startTime, endTime } = state.practiceSegment;
        if (currentT < startTime || currentT >= endTime) {
          seek(startTime);
          state.resetSegmentMatchedIndices();
          state.resetPracticeLoop();
          await new Promise((r) => setTimeout(r, 50));
        }
      }

      const success = await play();
      if (success) {
        startPlaying();
      } else {
        setPlayError('音频播放失败，请检查浏览器权限或音频文件后重试');
      }
    }
  }, [isPlaying, isFinished, isPracticeMode, play, pause, reset, seek, startPlaying, stopPlaying, resetTraining]);

  const handleReset = useCallback(() => {
    pause();
    resetTraining();
    reset();
    setPlayError(null);
  }, [pause, resetTraining, reset]);

  const handleEnterPracticeMode = useCallback(async () => {
    pause();
    stopPlaying();

    const state = useTrainingStore.getState();
    const rounds = Array.from(state.selectedRounds).sort((a, b) => a - b);
    if (rounds.length === 0) return;

    const startRound = rounds[0];
    const endRound = rounds[rounds.length - 1];
    for (let r = startRound; r <= endRound; r++) {
      if (!state.selectedRounds.has(r)) {
        setPlayError('请选择连续的轮次范围');
        return;
      }
    }

    enterPracticeMode();

    const newState = useTrainingStore.getState();
    if (newState.practiceSegment) {
      seek(newState.practiceSegment.startTime);
    }
  }, [pause, stopPlaying, enterPracticeMode, seek]);

  const handleExitPracticeMode = useCallback(() => {
    pause();
    stopPlaying();
    exitPracticeMode();
    reset();
    setPlayError(null);
  }, [pause, stopPlaying, exitPracticeMode, reset]);

  const handleToggleRoundSelection = useCallback((round: number) => {
    if (isPlaying || isPracticeMode) return;
    toggleRoundSelection(round);
  }, [isPlaying, isPracticeMode, toggleRoundSelection]);

  const canEnterPracticeMode = (): boolean => {
    if (!musicData || selectedRounds.size === 0 || isPlaying) return false;
    const rounds = Array.from(selectedRounds).sort((a, b) => a - b);
    const startRound = rounds[0];
    const endRound = rounds[rounds.length - 1];
    for (let r = startRound; r <= endRound; r++) {
      if (!selectedRounds.has(r)) return false;
    }
    return true;
  };

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
    isPracticeMode,
    practiceSegment,
    practiceLoopCount,
    selectedRounds,
    handlePlayPause,
    handleReset,
    handleToggleRoundSelection,
    clearRoundSelection,
    handleEnterPracticeMode,
    handleExitPracticeMode,
    canEnterPracticeMode,
    playError,
  };
}
