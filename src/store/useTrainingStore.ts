import { create } from 'zustand';
import type {
  TrainingState,
  MusicData,
  HitRecord,
  Rating,
  BestRecord,
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
}

const initialState: TrainingState = {
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
};

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
      });
    },

    handleKeyPress: (pressTime: number) => {
      const { musicData, matchedIndices, stats, hitRecords } = get();
      if (!musicData) return;

      const result = findNearestBreathPoint(
        pressTime,
        musicData.breathPoints,
        matchedIndices
      );

      if (!result) return;

      const { index, deviation } = result;
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
      const { musicData, matchedIndices, stats, hitRecords } = get();
      if (!musicData) return;

      const MISSED_WINDOW = 150;
      const newRecords = [...hitRecords];
      const newMatched = new Set(matchedIndices);
      let statsChanged = false;
      let lastRating: Rating | null = null;
      let lastDeviation: number | null = null;

      musicData.breathPoints.forEach((point, index) => {
        if (newMatched.has(index)) return;
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
      const { musicData, stats, bestRecord } = get();
      if (!musicData) return;

      const totalHitRate = calculateTotalHitRate(
        stats,
        musicData.breathPoints.length
      );

      const newRecord: BestRecord = {
        musicId: musicData.id,
        maxCombo: stats.maxCombo,
        totalHitRate,
        averageDeviation: stats.averageDeviation,
        date: new Date().toISOString().split('T')[0],
      };

      const isNewBest = saveBestRecord(newRecord);

      set({
        isPlaying: false,
        isFinished: true,
        bestRecord: isNewBest ? newRecord : bestRecord,
      });
    },
  })
);
