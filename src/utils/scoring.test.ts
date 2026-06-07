import { describe, it, expect } from 'vitest';
import {
  calculateRating,
  updateCombo,
  findNearestBreathPoint,
  calculateRoundStats,
  calculateAverageDeviation,
  getInitialStats,
  calculateTotalHitRate,
} from './scoring';
import { mockBreathPoints, mockMusicData, createHitRecord } from '@/test/testData';
import type { TrainingStats } from '@/types';

describe('scoring utils', () => {
  describe('calculateRating', () => {
    it('returns perfect when deviation is within 45ms', () => {
      expect(calculateRating(0)).toBe('perfect');
      expect(calculateRating(45)).toBe('perfect');
      expect(calculateRating(-45)).toBe('perfect');
    });

    it('returns good when deviation is between 46ms and 100ms', () => {
      expect(calculateRating(46)).toBe('good');
      expect(calculateRating(100)).toBe('good');
      expect(calculateRating(-46)).toBe('good');
      expect(calculateRating(-100)).toBe('good');
    });

    it('returns miss when deviation exceeds 100ms', () => {
      expect(calculateRating(101)).toBe('miss');
      expect(calculateRating(-101)).toBe('miss');
      expect(calculateRating(150)).toBe('miss');
    });

    it('handles boundary values correctly', () => {
      expect(calculateRating(45)).toBe('perfect');
      expect(calculateRating(45.1)).toBe('good');
      expect(calculateRating(100)).toBe('good');
      expect(calculateRating(100.1)).toBe('miss');
    });
  });

  describe('updateCombo', () => {
    it('increments combo and resets consecutiveMiss on hit', () => {
      const result = updateCombo(5, 'perfect', 1);
      expect(result.newCombo).toBe(6);
      expect(result.newConsecutiveMiss).toBe(0);
    });

    it('increments combo on good hit', () => {
      const result = updateCombo(3, 'good', 0);
      expect(result.newCombo).toBe(4);
      expect(result.newConsecutiveMiss).toBe(0);
    });

    it('does not break combo on first miss', () => {
      const result = updateCombo(5, 'miss', 0);
      expect(result.newCombo).toBe(5);
      expect(result.newConsecutiveMiss).toBe(1);
    });

    it('does not break combo on second consecutive miss', () => {
      const result = updateCombo(5, 'miss', 1);
      expect(result.newCombo).toBe(5);
      expect(result.newConsecutiveMiss).toBe(2);
    });

    it('breaks combo on third consecutive miss', () => {
      const result = updateCombo(5, 'miss', 2);
      expect(result.newCombo).toBe(0);
      expect(result.newConsecutiveMiss).toBe(3);
    });

    it('resets combo after miss streak continues', () => {
      const result = updateCombo(0, 'miss', 3);
      expect(result.newCombo).toBe(0);
      expect(result.newConsecutiveMiss).toBe(4);
    });

    it('resumes combo after hit following misses', () => {
      const result = updateCombo(0, 'perfect', 3);
      expect(result.newCombo).toBe(1);
      expect(result.newConsecutiveMiss).toBe(0);
    });
  });

  describe('findNearestBreathPoint', () => {
    it('finds the nearest point within 150ms window', () => {
      const result = findNearestBreathPoint(2050, mockBreathPoints, new Set());
      expect(result).not.toBeNull();
      expect(result?.index).toBe(0);
      expect(result?.deviation).toBe(50);
    });

    it('returns null when no point is within window', () => {
      const result = findNearestBreathPoint(3000, mockBreathPoints, new Set());
      expect(result).toBeNull();
    });

    it('returns null when all points are already matched', () => {
      const matched = new Set([0]);
      const result = findNearestBreathPoint(2050, mockBreathPoints, matched);
      expect(result).toBeNull();
    });

    it('selects closer point when multiple are in window', () => {
      const breathPoints = [
        { time: 1000, round: 1 },
        { time: 1200, round: 1 },
      ];
      const result = findNearestBreathPoint(1080, breathPoints, new Set());
      expect(result?.index).toBe(0);
      expect(result?.deviation).toBe(80);
    });

    it('handles negative deviation (press before point)', () => {
      const result = findNearestBreathPoint(1950, mockBreathPoints, new Set());
      expect(result?.index).toBe(0);
      expect(result?.deviation).toBe(-50);
    });

    it('respects 150ms window boundary', () => {
      const result1 = findNearestBreathPoint(2150, mockBreathPoints, new Set());
      expect(result1?.index).toBe(0);
      expect(result1?.deviation).toBe(150);

      const result2 = findNearestBreathPoint(2151, mockBreathPoints, new Set());
      expect(result2).toBeNull();
    });
  });

  describe('calculateRoundStats', () => {
    it('returns zero stats for empty records', () => {
      const stats = calculateRoundStats([], mockBreathPoints, 4);
      expect(stats).toHaveLength(4);
      stats.forEach((s) => {
        expect(s.hit).toBe(0);
        expect(s.hitRate).toBe(0);
      });
      expect(stats[0].total).toBe(3);
      expect(stats[1].total).toBe(3);
    });

    it('calculates hit rates correctly per round', () => {
      const records = [
        createHitRecord(0, 20, 'perfect', 1),
        createHitRecord(1, 50, 'good', 1),
        createHitRecord(3, 10, 'perfect', 2),
        createHitRecord(6, 150, 'miss', 3),
      ];
      const stats = calculateRoundStats(records, mockBreathPoints, 4);

      expect(stats[0]).toEqual(expect.objectContaining({ round: 1, total: 3, hit: 2, hitRate: (2 / 3) * 100 }));
      expect(stats[1]).toEqual(expect.objectContaining({ round: 2, total: 3, hit: 1, hitRate: (1 / 3) * 100 }));
      expect(stats[2]).toEqual(expect.objectContaining({ round: 3, total: 3, hit: 0, hitRate: 0 }));
      expect(stats[3]).toEqual(expect.objectContaining({ round: 4, total: 3, hit: 0, hitRate: 0 }));
    });

    it('excludes miss records from hit count', () => {
      const records = [
        createHitRecord(0, 150, 'miss', 1),
        createHitRecord(1, 150, 'miss', 1),
        createHitRecord(2, 20, 'perfect', 1),
      ];
      const stats = calculateRoundStats(records, mockBreathPoints, 4);
      expect(stats[0].hit).toBe(1);
      expect(stats[0].hitRate).toBe((1 / 3) * 100);
    });
  });

  describe('calculateAverageDeviation', () => {
    it('returns 0 for empty records', () => {
      expect(calculateAverageDeviation([])).toBe(0);
    });

    it('returns 0 when all records are miss', () => {
      const records = [
        createHitRecord(0, 150, 'miss', 1),
        createHitRecord(1, 200, 'miss', 1),
      ];
      expect(calculateAverageDeviation(records)).toBe(0);
    });

    it('calculates average of absolute deviations for hits only', () => {
      const records = [
        createHitRecord(0, 20, 'perfect', 1),
        createHitRecord(1, -40, 'perfect', 1),
        createHitRecord(2, 80, 'good', 1),
        createHitRecord(3, 150, 'miss', 2),
      ];
      expect(calculateAverageDeviation(records)).toBe(Math.round((20 + 40 + 80) / 3));
    });

    it('rounds to nearest integer', () => {
      const records = [
        createHitRecord(0, 1, 'perfect', 1),
        createHitRecord(1, 2, 'perfect', 1),
      ];
      expect(calculateAverageDeviation(records)).toBe(2);
    });
  });

  describe('getInitialStats', () => {
    it('returns properly initialized stats', () => {
      const stats = getInitialStats(mockBreathPoints, 4);
      expect(stats).toEqual<TrainingStats>({
        combo: 0,
        maxCombo: 0,
        consecutiveMiss: 0,
        totalPerfect: 0,
        totalGood: 0,
        totalMiss: 0,
        averageDeviation: 0,
        roundStats: calculateRoundStats([], mockBreathPoints, 4),
      });
    });

    it('handles empty breath points', () => {
      const stats = getInitialStats([], 0);
      expect(stats.roundStats).toEqual([]);
    });
  });

  describe('calculateTotalHitRate', () => {
    it('returns 0 when there are no breath points', () => {
      const stats = getInitialStats(mockBreathPoints, 4);
      expect(calculateTotalHitRate(stats, 0)).toBe(0);
    });

    it('calculates total hit rate correctly', () => {
      const stats = getInitialStats(mockBreathPoints, 4);
      stats.totalPerfect = 5;
      stats.totalGood = 3;
      stats.totalMiss = 4;
      expect(calculateTotalHitRate(stats, 12)).toBe(Math.round(((5 + 3) / 12) * 100));
    });

    it('returns 100 for perfect score', () => {
      const stats = getInitialStats(mockBreathPoints, 4);
      stats.totalPerfect = 12;
      stats.totalGood = 0;
      expect(calculateTotalHitRate(stats, 12)).toBe(100);
    });

    it('returns 0 when all are miss', () => {
      const stats = getInitialStats(mockBreathPoints, 4);
      stats.totalMiss = 12;
      expect(calculateTotalHitRate(stats, 12)).toBe(0);
    });
  });
});
