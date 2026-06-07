import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useTrainingStore, initialState } from './useTrainingStore';
import { mockMusicData, mockBreathPoints } from '@/test/testData';
import { clearAllRecords, saveBestRecord } from '@/utils/storage';
import type { BestRecord } from '@/types';

describe('useTrainingStore', () => {
  const resetStore = () => {
    const currentState = useTrainingStore.getState();
    const newState = { ...initialState };
    for (const key of Object.keys(currentState)) {
      if (typeof currentState[key as keyof typeof currentState] !== 'function') {
        (newState as any)[key] = initialState[key as keyof typeof initialState];
      }
    }
    useTrainingStore.setState(newState);
  };

  beforeEach(() => {
    clearAllRecords();
    resetStore();
    useTrainingStore.getState().setMusicData(mockMusicData);
  });

  afterEach(() => {
    resetStore();
    clearAllRecords();
  });

  const s = () => useTrainingStore.getState();

  describe('initialization', () => {
    it('initializes with music data correctly', () => {
      expect(s().musicData).toEqual(mockMusicData);
      expect(s().stats.roundStats).toHaveLength(4);
      expect(s().stats.roundStats[0].total).toBe(3);
    });

    it('loads existing best record when setting music data', () => {
      const existingRecord: BestRecord = {
        musicId: mockMusicData.id,
        maxCombo: 10,
        totalHitRate: 85,
        averageDeviation: 30,
        date: '2026-06-01',
      };
      saveBestRecord(existingRecord);

      resetStore();
      s().setMusicData(mockMusicData);

      expect(s().bestRecord).toEqual(existingRecord);
    });
  });

  describe('full training flow - key press handling', () => {
    it('records perfect hit correctly', () => {
      s().handleKeyPress(2020);

      expect(s().stats.totalPerfect).toBe(1);
      expect(s().stats.combo).toBe(1);
      expect(s().stats.maxCombo).toBe(1);
      expect(s().lastRating).toBe('perfect');
      expect(s().lastDeviation).toBe(20);
      expect(s().matchedIndices.has(0)).toBe(true);
      expect(s().hitRecords).toHaveLength(1);
      expect(s().hitRecords[0].rating).toBe('perfect');
    });

    it('records good hit correctly', () => {
      s().handleKeyPress(2070);

      expect(s().stats.totalGood).toBe(1);
      expect(s().stats.combo).toBe(1);
      expect(s().lastRating).toBe('good');
      expect(s().lastDeviation).toBe(70);
    });

    it('increments combo on consecutive hits', () => {
      s().handleKeyPress(2020);
      s().handleKeyPress(4530);
      s().handleKeyPress(7010);

      expect(s().stats.combo).toBe(3);
      expect(s().stats.maxCombo).toBe(3);
      expect(s().stats.totalPerfect).toBe(3);
    });

    it('breaks combo after 3 consecutive misses', () => {
      s().handleKeyPress(2020);
      expect(s().stats.combo).toBe(1);

      s().checkMissedPoints(4651);
      expect(s().stats.combo).toBe(1);
      expect(s().stats.consecutiveMiss).toBe(1);

      s().checkMissedPoints(7151);
      expect(s().stats.combo).toBe(1);
      expect(s().stats.consecutiveMiss).toBe(2);

      s().checkMissedPoints(9651);
      expect(s().stats.combo).toBe(0);
      expect(s().stats.consecutiveMiss).toBe(3);
    });

    it('does not match same point twice', () => {
      s().handleKeyPress(2020);
      s().handleKeyPress(2030);

      expect(s().hitRecords).toHaveLength(1);
      expect(s().matchedIndices.size).toBe(1);
    });

    it('ignores key press when no point is in window', () => {
      s().handleKeyPress(3000);

      expect(s().hitRecords).toHaveLength(0);
      expect(s().stats.combo).toBe(0);
    });

    it('updates round stats correctly', () => {
      s().handleKeyPress(2020);
      s().handleKeyPress(4570);
      s().handleKeyPress(9510);

      expect(s().stats.roundStats[0].hit).toBe(2);
      expect(s().stats.roundStats[0].hitRate).toBe((2 / 3) * 100);
      expect(s().stats.roundStats[1].hit).toBe(1);
      expect(s().stats.roundStats[1].hitRate).toBe((1 / 3) * 100);
    });

    it('calculates average deviation correctly', () => {
      s().handleKeyPress(2020);
      s().handleKeyPress(4550);
      s().handleKeyPress(7080);

      expect(s().stats.averageDeviation).toBe(Math.round((20 + 50 + 80) / 3));
    });
  });

  describe('full training flow - auto miss detection', () => {
    it('automatically marks point as miss after 150ms window', () => {
      s().checkMissedPoints(2151);

      expect(s().stats.totalMiss).toBe(1);
      expect(s().matchedIndices.has(0)).toBe(true);
      expect(s().hitRecords[0].rating).toBe('miss');
      expect(s().lastRating).toBe('miss');
    });

    it('does not mark already matched points as miss', () => {
      s().handleKeyPress(2020);
      s().checkMissedPoints(2151);

      expect(s().stats.totalMiss).toBe(0);
      expect(s().stats.totalPerfect).toBe(1);
      expect(s().hitRecords).toHaveLength(1);
    });

    it('processes multiple missed points in one check', () => {
      s().checkMissedPoints(7151);

      expect(s().stats.totalMiss).toBe(3);
      expect(s().matchedIndices.size).toBe(3);
    });

    it('updates consecutiveMiss and combo correctly on auto miss', () => {
      s().handleKeyPress(2020);
      expect(s().stats.combo).toBe(1);

      s().checkMissedPoints(4651);
      expect(s().stats.consecutiveMiss).toBe(1);
      expect(s().stats.combo).toBe(1);

      s().checkMissedPoints(7151);
      expect(s().stats.consecutiveMiss).toBe(2);
      expect(s().stats.combo).toBe(1);

      s().checkMissedPoints(9651);
      expect(s().stats.consecutiveMiss).toBe(3);
      expect(s().stats.combo).toBe(0);
    });
  });

  describe('full training flow - finish training and best record', () => {
    it('saves best record on first completion', () => {
      mockBreathPoints.forEach((point) => {
        s().handleKeyPress(point.time + 20);
      });

      s().finishTraining();

      expect(s().isFinished).toBe(true);
      expect(s().isPlaying).toBe(false);
      expect(s().bestRecord).not.toBeNull();
      expect(s().bestRecord?.totalHitRate).toBe(100);
      expect(s().bestRecord?.maxCombo).toBe(12);
    });

    it('updates best record when performance improves', () => {
      const oldRecord: BestRecord = {
        musicId: mockMusicData.id,
        maxCombo: 5,
        totalHitRate: 50,
        averageDeviation: 50,
        date: '2026-06-01',
      };
      saveBestRecord(oldRecord);
      s().setMusicData(mockMusicData);

      mockBreathPoints.forEach((point) => {
        s().handleKeyPress(point.time + 20);
      });

      s().finishTraining();

      expect(s().bestRecord?.totalHitRate).toBe(100);
      expect(s().bestRecord?.maxCombo).toBe(12);
    });

    it('does not update best record when performance is worse', () => {
      const oldRecord: BestRecord = {
        musicId: mockMusicData.id,
        maxCombo: 12,
        totalHitRate: 100,
        averageDeviation: 20,
        date: '2026-06-01',
      };
      saveBestRecord(oldRecord);
      s().setMusicData(mockMusicData);

      s().checkMissedPoints(30000);

      s().finishTraining();

      expect(s().bestRecord).toEqual(oldRecord);
    });

    it('calculates total hit rate correctly on finish', () => {
      for (let i = 0; i < 9; i++) {
        s().handleKeyPress(mockBreathPoints[i].time + 20);
      }

      s().finishTraining();

      expect(s().bestRecord?.totalHitRate).toBe(Math.round((9 / 12) * 100));
    });
  });

  describe('practice mode - segment setup', () => {
    it('enters practice mode with valid segment selection', () => {
      s().toggleRoundSelection(2);
      s().toggleRoundSelection(3);
      s().enterPracticeMode();

      expect(s().isPracticeMode).toBe(true);
      expect(s().practiceSegment).not.toBeNull();
      expect(s().practiceSegment?.startRound).toBe(2);
      expect(s().practiceSegment?.endRound).toBe(3);
      expect(s().practiceSegment?.breathPointIndices.has(3)).toBe(true);
      expect(s().practiceSegment?.breathPointIndices.has(4)).toBe(true);
      expect(s().practiceSegment?.breathPointIndices.has(5)).toBe(true);
      expect(s().practiceSegment?.breathPointIndices.has(6)).toBe(true);
      expect(s().practiceSegment?.breathPointIndices.has(7)).toBe(true);
      expect(s().practiceSegment?.breathPointIndices.has(8)).toBe(true);
      expect(s().practiceSegment?.breathPointIndices.size).toBe(6);
      expect(s().practiceLoopCount).toBe(1);
    });

    it('does not enter practice mode without selection', () => {
      s().enterPracticeMode();

      expect(s().isPracticeMode).toBe(false);
      expect(s().practiceSegment).toBeNull();
    });

    it('does not enter practice mode with non-consecutive rounds', () => {
      s().toggleRoundSelection(1);
      s().toggleRoundSelection(3);
      s().enterPracticeMode();

      expect(s().isPracticeMode).toBe(false);
    });

    it('resets stats when entering practice mode', () => {
      s().handleKeyPress(2020);
      s().handleKeyPress(4530);

      expect(s().stats.combo).toBe(2);
      expect(s().stats.totalPerfect).toBe(2);

      s().toggleRoundSelection(2);
      s().enterPracticeMode();

      expect(s().stats.combo).toBe(0);
      expect(s().stats.totalPerfect).toBe(0);
      expect(s().hitRecords).toHaveLength(0);
      expect(s().matchedIndices.size).toBe(0);
    });
  });

  describe('practice mode - key press handling within segment', () => {
    beforeEach(() => {
      s().toggleRoundSelection(2);
      s().enterPracticeMode();
    });

    it('only matches points within practice segment', () => {
      s().handleKeyPress(9520);
      expect(s().hitRecords).toHaveLength(1);
      expect(s().stats.combo).toBe(1);

      s().handleKeyPress(2020);
      expect(s().hitRecords).toHaveLength(1);
    });

    it('does not count out-of-segment points in stats', () => {
      s().handleKeyPress(9520);
      s().handleKeyPress(12030);

      expect(s().stats.roundStats[1].hit).toBe(2);
      expect(s().stats.roundStats[1].total).toBe(3);
      expect(s().stats.roundStats[0].hit).toBe(0);
    });

    it('updates combo only for segment hits', () => {
      s().handleKeyPress(9520);
      expect(s().stats.combo).toBe(1);

      s().handleKeyPress(2020);
      expect(s().stats.combo).toBe(1);

      s().handleKeyPress(12030);
      expect(s().stats.combo).toBe(2);
    });
  });

  describe('practice mode - auto miss within segment', () => {
    beforeEach(() => {
      s().toggleRoundSelection(2);
      s().enterPracticeMode();
    });

    it('only auto-misses points within practice segment', () => {
      s().checkMissedPoints(9651);

      expect(s().stats.totalMiss).toBe(1);
      expect(s().matchedIndices.has(3)).toBe(true);
    });

    it('does not auto-miss points outside practice segment', () => {
      s().checkMissedPoints(2151);

      expect(s().stats.totalMiss).toBe(0);
      expect(s().matchedIndices.size).toBe(0);
    });

    it('updates consecutiveMiss only for segment misses', () => {
      s().handleKeyPress(9520);
      expect(s().stats.combo).toBe(1);

      s().checkMissedPoints(12151);
      expect(s().stats.consecutiveMiss).toBe(1);
      expect(s().stats.combo).toBe(1);

      s().checkMissedPoints(14651);
      expect(s().stats.consecutiveMiss).toBe(2);
      expect(s().stats.combo).toBe(1);

      s().checkMissedPoints(30000);
      expect(s().stats.consecutiveMiss).toBe(2);
    });
  });

  describe('practice mode - segment loop and reset', () => {
    beforeEach(() => {
      s().toggleRoundSelection(2);
      s().enterPracticeMode();
    });

    it('clears segment hit records on loop reset, preserves out-of-segment', () => {
      s().handleKeyPress(9520);
      s().handleKeyPress(12030);
      expect(s().hitRecords).toHaveLength(2);
      expect(s().stats.combo).toBe(2);
      expect(s().stats.totalPerfect).toBe(2);

      s().resetSegmentMatchedIndices();

      expect(s().hitRecords).toHaveLength(0);
      expect(s().matchedIndices.size).toBe(0);
      expect(s().stats.combo).toBe(0);
      expect(s().stats.totalPerfect).toBe(0);
      expect(s().stats.roundStats[1].hit).toBe(0);
    });

    it('preserves out-of-segment matched indices on reset', () => {
      const originalMatched = new Set(s().matchedIndices);
      originalMatched.add(0);
      originalMatched.add(1);
      useTrainingStore.setState({ matchedIndices: originalMatched });

      s().handleKeyPress(9520);
      s().handleKeyPress(12030);

      expect(s().matchedIndices.has(0)).toBe(true);
      expect(s().matchedIndices.has(1)).toBe(true);
      expect(s().matchedIndices.has(3)).toBe(true);
      expect(s().matchedIndices.has(4)).toBe(true);

      s().resetSegmentMatchedIndices();

      expect(s().matchedIndices.has(0)).toBe(true);
      expect(s().matchedIndices.has(1)).toBe(true);
      expect(s().matchedIndices.has(3)).toBe(false);
      expect(s().matchedIndices.has(4)).toBe(false);
    });

    it('increments practice loop count', () => {
      expect(s().practiceLoopCount).toBe(1);

      s().incrementPracticeLoop();
      expect(s().practiceLoopCount).toBe(2);

      s().incrementPracticeLoop();
      expect(s().practiceLoopCount).toBe(3);
    });

    it('resets practice loop count to 1', () => {
      s().incrementPracticeLoop();
      s().incrementPracticeLoop();
      expect(s().practiceLoopCount).toBe(3);

      s().resetPracticeLoop();
      expect(s().practiceLoopCount).toBe(1);
    });

    it('can continue hitting after segment reset', () => {
      s().handleKeyPress(9520);
      s().resetSegmentMatchedIndices();

      s().handleKeyPress(9520);
      expect(s().hitRecords).toHaveLength(1);
      expect(s().stats.combo).toBe(1);
    });
  });

  describe('practice mode - best record isolation', () => {
    it('does not save practice mode results to best record', () => {
      s().toggleRoundSelection(2);
      s().enterPracticeMode();

      s().handleKeyPress(9520);
      s().handleKeyPress(12030);
      s().handleKeyPress(14510);

      s().finishTraining();

      expect(s().bestRecord).toBeNull();
    });

    it('preserves existing best record after practice mode', () => {
      const existingRecord: BestRecord = {
        musicId: mockMusicData.id,
        maxCombo: 10,
        totalHitRate: 85,
        averageDeviation: 30,
        date: '2026-06-01',
      };
      saveBestRecord(existingRecord);

      resetStore();
      s().setMusicData(mockMusicData);

      s().toggleRoundSelection(2);
      s().enterPracticeMode();

      s().checkMissedPoints(30000);

      s().finishTraining();

      expect(s().bestRecord).toEqual(existingRecord);
    });
  });

  describe('practice mode - exit and cleanup', () => {
    beforeEach(() => {
      s().toggleRoundSelection(2);
      s().enterPracticeMode();
    });

    it('exits practice mode and resets state', () => {
      s().handleKeyPress(9520);

      s().exitPracticeMode();

      expect(s().isPracticeMode).toBe(false);
      expect(s().practiceSegment).toBeNull();
      expect(s().practiceLoopCount).toBe(0);
      expect(s().selectedRounds.size).toBe(0);
      expect(s().hitRecords).toHaveLength(0);
      expect(s().stats.combo).toBe(0);
    });

    it('can return to full training after practice mode', () => {
      s().exitPracticeMode();

      s().handleKeyPress(2020);
      expect(s().hitRecords).toHaveLength(1);
      expect(s().hitRecords[0].breathPointIndex).toBe(0);
    });
  });

  describe('reset training', () => {
    it('resets all training state', () => {
      s().handleKeyPress(2020);
      s().handleKeyPress(4530);
      s().startPlaying();

      expect(s().isPlaying).toBe(true);
      expect(s().hitRecords).toHaveLength(2);
      expect(s().stats.combo).toBe(2);

      s().resetTraining();

      expect(s().isPlaying).toBe(false);
      expect(s().currentTime).toBe(0);
      expect(s().hitRecords).toHaveLength(0);
      expect(s().matchedIndices.size).toBe(0);
      expect(s().stats.combo).toBe(0);
      expect(s().lastRating).toBeNull();
      expect(s().isPracticeMode).toBe(false);
      expect(s().selectedRounds.size).toBe(0);
    });
  });

  describe('round selection', () => {
    it('toggles round selection', () => {
      s().toggleRoundSelection(1);
      expect(s().selectedRounds.has(1)).toBe(true);

      s().toggleRoundSelection(1);
      expect(s().selectedRounds.has(1)).toBe(false);
    });

    it('clears all round selections', () => {
      s().toggleRoundSelection(1);
      s().toggleRoundSelection(2);

      s().clearRoundSelection();

      expect(s().selectedRounds.size).toBe(0);
    });
  });

  describe('integration - full training with mixed hits and misses', () => {
    it('completes a full training session with realistic scenario', () => {
      s().startPlaying();

      s().handleKeyPress(2020);
      s().handleKeyPress(4580);
      s().checkMissedPoints(7151);

      s().handleKeyPress(9510);
      s().handleKeyPress(12151);
      s().handleKeyPress(14520);

      s().handleKeyPress(17100);
      s().checkMissedPoints(19651);
      s().checkMissedPoints(22151);

      s().checkMissedPoints(30000);

      s().finishTraining();

      expect(s().stats.totalPerfect).toBe(3);
      expect(s().stats.totalGood).toBe(2);
      expect(s().stats.totalMiss).toBe(7);
      expect(s().stats.maxCombo).toBe(5);
      expect(s().isFinished).toBe(true);
      expect(s().bestRecord).not.toBeNull();
      expect(s().bestRecord?.totalHitRate).toBe(Math.round((5 / 12) * 100));
    });
  });

  describe('integration - practice mode with multiple loops', () => {
    it('completes practice mode with multiple segment loops', () => {
      s().toggleRoundSelection(2);
      s().enterPracticeMode();

      s().handleKeyPress(9520);
      s().handleKeyPress(12030);
      s().handleKeyPress(14510);

      expect(s().stats.combo).toBe(3);
      expect(s().stats.totalPerfect).toBe(3);

      s().incrementPracticeLoop();
      s().resetSegmentMatchedIndices();

      expect(s().stats.combo).toBe(0);
      expect(s().stats.totalPerfect).toBe(0);
      expect(s().practiceLoopCount).toBe(2);

      s().handleKeyPress(9510);
      s().checkMissedPoints(12151);
      s().handleKeyPress(14520);

      expect(s().stats.combo).toBe(2);
      expect(s().stats.totalPerfect).toBe(2);
      expect(s().stats.totalMiss).toBe(1);

      s().finishTraining();

      expect(s().bestRecord).toBeNull();
      expect(s().isFinished).toBe(true);
    });
  });
});
