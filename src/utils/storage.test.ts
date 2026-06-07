import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getBestRecord, saveBestRecord, clearAllRecords } from './storage';
import type { BestRecord } from '@/types';

describe('storage utils', () => {
  beforeEach(() => {
    clearAllRecords();
  });

  const createRecord = (overrides: Partial<BestRecord> = {}): BestRecord => ({
    musicId: 'test-music-001',
    maxCombo: 10,
    totalHitRate: 85,
    averageDeviation: 30,
    date: '2026-06-07',
    ...overrides,
  });

  describe('getBestRecord', () => {
    it('returns null when no record exists', () => {
      expect(getBestRecord('test-music-001')).toBeNull();
    });

    it('returns null for non-existent musicId', () => {
      saveBestRecord(createRecord());
      expect(getBestRecord('non-existent')).toBeNull();
    });

    it('returns the saved record', () => {
      const record = createRecord();
      saveBestRecord(record);
      expect(getBestRecord('test-music-001')).toEqual(record);
    });

    it('handles localStorage errors gracefully', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('storage error');
      });
      expect(getBestRecord('test-music-001')).toBeNull();
      getItemSpy.mockRestore();
    });
  });

  describe('saveBestRecord', () => {
    it('saves first record and returns true', () => {
      const record = createRecord();
      const result = saveBestRecord(record);
      expect(result).toBe(true);
      expect(getBestRecord('test-music-001')).toEqual(record);
    });

    it('updates record when hit rate is higher', () => {
      const oldRecord = createRecord({ totalHitRate: 80 });
      saveBestRecord(oldRecord);

      const newRecord = createRecord({ totalHitRate: 90 });
      const result = saveBestRecord(newRecord);

      expect(result).toBe(true);
      expect(getBestRecord('test-music-001')).toEqual(newRecord);
    });

    it('does not update when hit rate is lower', () => {
      const oldRecord = createRecord({ totalHitRate: 90 });
      saveBestRecord(oldRecord);

      const newRecord = createRecord({ totalHitRate: 80 });
      const result = saveBestRecord(newRecord);

      expect(result).toBe(false);
      expect(getBestRecord('test-music-001')).toEqual(oldRecord);
    });

    it('updates when hit rate is same but maxCombo is higher', () => {
      const oldRecord = createRecord({ totalHitRate: 85, maxCombo: 5 });
      saveBestRecord(oldRecord);

      const newRecord = createRecord({ totalHitRate: 85, maxCombo: 10 });
      const result = saveBestRecord(newRecord);

      expect(result).toBe(true);
      expect(getBestRecord('test-music-001')).toEqual(newRecord);
    });

    it('does not update when hit rate same but maxCombo lower', () => {
      const oldRecord = createRecord({ totalHitRate: 85, maxCombo: 10 });
      saveBestRecord(oldRecord);

      const newRecord = createRecord({ totalHitRate: 85, maxCombo: 5 });
      const result = saveBestRecord(newRecord);

      expect(result).toBe(false);
      expect(getBestRecord('test-music-001')).toEqual(oldRecord);
    });

    it('updates when hit rate and maxCombo same but averageDeviation is lower', () => {
      const oldRecord = createRecord({ totalHitRate: 85, maxCombo: 10, averageDeviation: 40 });
      saveBestRecord(oldRecord);

      const newRecord = createRecord({ totalHitRate: 85, maxCombo: 10, averageDeviation: 30 });
      const result = saveBestRecord(newRecord);

      expect(result).toBe(true);
      expect(getBestRecord('test-music-001')).toEqual(newRecord);
    });

    it('does not update when all same but averageDeviation higher', () => {
      const oldRecord = createRecord({ totalHitRate: 85, maxCombo: 10, averageDeviation: 30 });
      saveBestRecord(oldRecord);

      const newRecord = createRecord({ totalHitRate: 85, maxCombo: 10, averageDeviation: 40 });
      const result = saveBestRecord(newRecord);

      expect(result).toBe(false);
      expect(getBestRecord('test-music-001')).toEqual(oldRecord);
    });

    it('handles multiple music records independently', () => {
      const record1 = createRecord({ musicId: 'music-1', totalHitRate: 80 });
      const record2 = createRecord({ musicId: 'music-2', totalHitRate: 90 });

      saveBestRecord(record1);
      saveBestRecord(record2);

      expect(getBestRecord('music-1')).toEqual(record1);
      expect(getBestRecord('music-2')).toEqual(record2);
    });

    it('handles localStorage errors gracefully', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('storage error');
      });
      const result = saveBestRecord(createRecord());
      expect(result).toBe(false);
      setItemSpy.mockRestore();
    });
  });

  describe('clearAllRecords', () => {
    it('clears all saved records', () => {
      saveBestRecord(createRecord({ musicId: 'music-1' }));
      saveBestRecord(createRecord({ musicId: 'music-2' }));

      clearAllRecords();

      expect(getBestRecord('music-1')).toBeNull();
      expect(getBestRecord('music-2')).toBeNull();
    });
  });

  describe('isBetterRecord (indirect via saveBestRecord)', () => {
    it('prioritizes hit rate above all else', () => {
      const base = createRecord({ totalHitRate: 80, maxCombo: 20, averageDeviation: 20 });
      saveBestRecord(base);

      const betterHitRate = createRecord({ totalHitRate: 81, maxCombo: 1, averageDeviation: 100 });
      expect(saveBestRecord(betterHitRate)).toBe(true);
    });

    it('prioritizes maxCombo when hit rates are equal', () => {
      const base = createRecord({ totalHitRate: 85, maxCombo: 5, averageDeviation: 20 });
      saveBestRecord(base);

      const betterCombo = createRecord({ totalHitRate: 85, maxCombo: 10, averageDeviation: 100 });
      expect(saveBestRecord(betterCombo)).toBe(true);
    });

    it('uses averageDeviation as tiebreaker', () => {
      const base = createRecord({ totalHitRate: 85, maxCombo: 10, averageDeviation: 30 });
      saveBestRecord(base);

      const betterDeviation = createRecord({ totalHitRate: 85, maxCombo: 10, averageDeviation: 25 });
      expect(saveBestRecord(betterDeviation)).toBe(true);
    });

    it('rejects equal records (not better)', () => {
      const record = createRecord();
      saveBestRecord(record);
      expect(saveBestRecord({ ...record })).toBe(false);
    });
  });
});
