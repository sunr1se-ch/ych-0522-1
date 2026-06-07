import { create } from 'zustand';
import type {
  TrainingState,
  MusicData,
  HitRecord,
  Rating,
  BestRecord,
  PracticeSegment,
} from '@/types';
import {
  calculateRating,
  updateCombo,
  findNearestBreathPoint,
  calculateRoundStats,
  calculateAverageDeviation,
  getInitialStats,
  calculateTotalHitRate,
} from '@/utils/scoring';
import { getBestRecord, saveBestRecord } from '@/utils/storage';

interface TrainingActions {
  setMusicData: (data: MusicData) => void;
  startPlaying: () => void;
  stopPlaying: () => void;
  resetTraining: () => void;
  handleKeyPress: (pressTime: number) => void;
  updateProgress: (time: number) => void;
  finishTraining: () => void;
  checkMissedPoints: (currentTime: number) => void;
  toggleRoundSelection: (round: number) => void;
  clearRoundSelection: () => void;
  enterPracticeMode: () => void;
  exitPracticeMode: () => void;
  incrementPracticeLoop: () => void;
  resetPracticeLoop: () => void;
  resetSegmentMatchedIndices: () => void;
}

export const initialState: TrainingState = {
  isPlaying: false,
  currentTime: 0,
  musicData: null,
  hitRecords: [],
  matchedIndices: new Set<number>(),
  stats: getInitialStats([], 0),
  lastRating: null,
  lastDeviation: null,
  bestRecord: null,
  isFinished: false,
  isPracticeMode: false,
  practiceSegment: null,
  practiceLoopCount: 0,
  selectedRounds: new Set<number>(),
};

function buildPracticeSegment(
  musicData: MusicData,
  startRound: number,
  endRound: number
): PracticeSegment {
  const breathPointIndices = new Set<number>();
  let startTime = Infinity;
  let endTime = -Infinity;

  musicData.breathPoints.forEach((point, index) => {
    if (point.round >= startRound && point.round <= endRound) {
      breathPointIndices.add(index);
      startTime = Math.min(startTime, point.time);
      endTime = Math.max(endTime, point.time);
    }
  });

  if (startTime === Infinity) startTime = 0;
  if (endTime === -Infinity) endTime = musicData.duration;

  startTime = Math.max(0, startTime - 500);
  endTime = Math.min(musicData.duration, endTime + 500);

  return {
    startRound,
    endRound,
    startTime,
    endTime,
    breathPointIndices,
  };
}

export const useTrainingStore = create<TrainingState & TrainingActions>(
  (set, get) => ({
    ...initialState,

    setMusicData: (data: MusicData) => {
      const best = getBestRecord(data.id);
      set({
        musicData: data,
        stats: getInitialStats(data.breathPoints, data.totalRounds),
        bestRecord: best,
      });
    },

    startPlaying: () => set({ isPlaying: true, isFinished: false }),

    stopPlaying: () => set({ isPlaying: false }),

    resetTraining: () => {
      const { musicData } = get();
      set({
        isPlaying: false,
        currentTime: 0,
        hitRecords: [],
        matchedIndices: new Set<number>(),
        stats: musicData
          ? getInitialStats(musicData.breathPoints, musicData.totalRounds)
          : getInitialStats([], 0),
        lastRating: null,
        lastDeviation: null,
        isFinished: false,
        isPracticeMode: false,
        practiceSegment: null,
        practiceLoopCount: 0,
        selectedRounds: new Set<number>(),
      });
    },

    handleKeyPress: (pressTime: number) => {
      const { musicData, matchedIndices, stats, hitRecords, isPracticeMode, practiceSegment } = get();
      if (!musicData) return;

      const effectiveBreathPoints = musicData.breathPoints;
      let searchWindow = effectiveBreathPoints.map((_, i) => i);

      if (isPracticeMode && practiceSegment) {
        searchWindow = Array.from(practiceSegment.breathPointIndices);
      }

      const tempMatched = new Set<number>();
      matchedIndices.forEach(i => {
        if (isPracticeMode && practiceSegment) {
          if (!searchWindow.includes(i)) {
            tempMatched.add(i);
          }
        } else {
          tempMatched.add(i);
        }
      });

      const result = findNearestBreathPoint(
        pressTime,
        effectiveBreathPoints,
        tempMatched
      );

      if (!result) return;

      const { index, deviation } = result;

      if (isPracticeMode && practiceSegment && !practiceSegment.breathPointIndices.has(index)) {
        return;
      }

      const rating = calculateRating(deviation);
      const breathPoint = musicData.breathPoints[index];

      const { newCombo, newConsecutiveMiss } = updateCombo(
        stats.combo,
        rating,
        stats.consecutiveMiss
      );

      const newRecord: HitRecord = {
        breathPointIndex: index,
        pressTime,
        referenceTime: breathPoint.time,
        deviation,
        rating,
        round: breathPoint.round,
      };

      const newMatched = new Set(matchedIndices);
      newMatched.add(index);

      const newRecords = [...hitRecords, newRecord];
      const newStats = { ...stats };

      if (rating === 'perfect') newStats.totalPerfect++;
      else if (rating === 'good') newStats.totalGood++;
      else newStats.totalMiss++;

      newStats.combo = newCombo;
      newStats.maxCombo = Math.max(newStats.maxCombo, newCombo);
      newStats.consecutiveMiss = newConsecutiveMiss;
      newStats.averageDeviation = calculateAverageDeviation(newRecords);
      newStats.roundStats = calculateRoundStats(
        newRecords,
        musicData.breathPoints,
        musicData.totalRounds
      );

      set({
        hitRecords: newRecords,
        matchedIndices: newMatched,
        stats: newStats,
        lastRating: rating,
        lastDeviation: deviation,
      });
    },

    updateProgress: (time: number) => {
      set({ currentTime: time });
    },

    checkMissedPoints: (currentTime: number) => {
      const { musicData, matchedIndices, stats, hitRecords, isPracticeMode, practiceSegment } = get();
      if (!musicData) return;

      const MISSED_WINDOW = 150;
      const newRecords = [...hitRecords];
      const newMatched = new Set(matchedIndices);
      let statsChanged = false;
      let lastRating: Rating | null = null;
      let lastDeviation: number | null = null;

      musicData.breathPoints.forEach((point, index) => {
        if (newMatched.has(index)) return;

        if (isPracticeMode && practiceSegment && !practiceSegment.breathPointIndices.has(index)) {
          newMatched.add(index);
          return;
        }

        if (currentTime > point.time + MISSED_WINDOW) {
          newMatched.add(index);
          const rating: Rating = 'miss';
          const deviation = MISSED_WINDOW + 1;

          const { newCombo, newConsecutiveMiss } = updateCombo(
            stats.combo,
            rating,
            stats.consecutiveMiss
          );

          newRecords.push({
            breathPointIndex: index,
            pressTime: currentTime,
            referenceTime: point.time,
            deviation,
            rating,
            round: point.round,
          });

          stats.combo = newCombo;
          stats.maxCombo = Math.max(stats.maxCombo, newCombo);
          stats.consecutiveMiss = newConsecutiveMiss;
          stats.totalMiss++;
          statsChanged = true;
          lastRating = rating;
          lastDeviation = deviation;
        }
      });

      if (statsChanged) {
        const newStats = {
          ...stats,
          averageDeviation: calculateAverageDeviation(newRecords),
          roundStats: calculateRoundStats(
            newRecords,
            musicData.breathPoints,
            musicData.totalRounds
          ),
        };
        set({
          hitRecords: newRecords,
          matchedIndices: newMatched,
          stats: newStats,
          lastRating,
          lastDeviation,
        });
      }
    },

    finishTraining: () => {
      const { musicData, stats, bestRecord, isPracticeMode } = get();
      if (!musicData) return;

      const totalHitRate = calculateTotalHitRate(
        stats,
        musicData.breathPoints.length
      );

      let newBest = bestRecord;
      if (!isPracticeMode) {
        const newRecord: BestRecord = {
          musicId: musicData.id,
          maxCombo: stats.maxCombo,
          totalHitRate,
          averageDeviation: stats.averageDeviation,
          date: new Date().toISOString().split('T')[0],
        };

        const isNewBest = saveBestRecord(newRecord);
        if (isNewBest) {
          newBest = newRecord;
        }
      }

      set({
        isPlaying: false,
        isFinished: true,
        bestRecord: newBest,
      });
    },

    toggleRoundSelection: (round: number) => {
      const { selectedRounds } = get();
      const newSelected = new Set(selectedRounds);
      if (newSelected.has(round)) {
        newSelected.delete(round);
      } else {
        newSelected.add(round);
      }
      set({ selectedRounds: newSelected });
    },

    clearRoundSelection: () => {
      set({ selectedRounds: new Set<number>() });
    },

    enterPracticeMode: () => {
      const { musicData, selectedRounds } = get();
      if (!musicData || selectedRounds.size === 0) return;

      const rounds = Array.from(selectedRounds).sort((a, b) => a - b);
      const startRound = rounds[0];
      const endRound = rounds[rounds.length - 1];

      for (let r = startRound; r <= endRound; r++) {
        if (!selectedRounds.has(r)) return;
      }

      const segment = buildPracticeSegment(musicData, startRound, endRound);

      const currentStats = get().stats;
      const newStats = {
        ...currentStats,
        combo: 0,
        consecutiveMiss: 0,
        totalPerfect: 0,
        totalGood: 0,
        totalMiss: 0,
        averageDeviation: 0,
        roundStats: calculateRoundStats([], musicData.breathPoints, musicData.totalRounds),
      };

      set({
        isPracticeMode: true,
        practiceSegment: segment,
        practiceLoopCount: 1,
        hitRecords: [],
        matchedIndices: new Set<number>(),
        stats: newStats,
        lastRating: null,
        lastDeviation: null,
      });
    },

    exitPracticeMode: () => {
      const { musicData } = get();
      set({
        isPracticeMode: false,
        practiceSegment: null,
        practiceLoopCount: 0,
        selectedRounds: new Set<number>(),
        hitRecords: [],
        matchedIndices: new Set<number>(),
        stats: musicData
          ? getInitialStats(musicData.breathPoints, musicData.totalRounds)
          : getInitialStats([], 0),
        lastRating: null,
        lastDeviation: null,
        isFinished: false,
      });
    },

    incrementPracticeLoop: () => {
      const { practiceLoopCount } = get();
      set({ practiceLoopCount: practiceLoopCount + 1 });
    },

    resetPracticeLoop: () => {
      set({ practiceLoopCount: 1 });
    },

    resetSegmentMatchedIndices: () => {
      const { practiceSegment, matchedIndices, hitRecords, stats, musicData } = get();
      if (!practiceSegment || !musicData) return;

      const newMatched = new Set<number>();
      matchedIndices.forEach(index => {
        if (!practiceSegment.breathPointIndices.has(index)) {
          newMatched.add(index);
        }
      });

      const newRecords = hitRecords.filter(
        r => !practiceSegment.breathPointIndices.has(r.breathPointIndex)
      );

      const newStats = {
        ...stats,
        combo: 0,
        consecutiveMiss: 0,
        totalPerfect: 0,
        totalGood: 0,
        totalMiss: 0,
        averageDeviation: calculateAverageDeviation(newRecords),
        roundStats: calculateRoundStats(newRecords, musicData.breathPoints, musicData.totalRounds),
      };

      set({
        matchedIndices: newMatched,
        hitRecords: newRecords,
        stats: newStats,
        lastRating: null,
        lastDeviation: null,
      });
    },
  })
);
