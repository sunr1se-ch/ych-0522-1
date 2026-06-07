import type { Rating, BreathPoint, TrainingStats, RoundStat, HitRecord } from '@/types';

export function calculateRating(deviation: number): Rating {
  const absDev = Math.abs(deviation);
  if (absDev <= 45) return 'perfect';
  if (absDev <= 100) return 'good';
  return 'miss';
}

export function updateCombo(
  currentCombo: number,
  rating: Rating,
  consecutiveMiss: number
): { newCombo: number; newConsecutiveMiss: number } {
  if (rating === 'miss') {
    const newMiss = consecutiveMiss + 1;
    return {
      newCombo: newMiss >= 3 ? 0 : currentCombo,
      newConsecutiveMiss: newMiss,
    };
  }
  return {
    newCombo: currentCombo + 1,
    newConsecutiveMiss: 0,
  };
}

export function findNearestBreathPoint(
  pressTime: number,
  breathPoints: BreathPoint[],
  matchedIndices: Set<number>
): { index: number; deviation: number } | null {
  const WINDOW = 150;
  let bestIndex = -1;
  let bestDeviation = Infinity;

  for (let i = 0; i < breathPoints.length; i++) {
    if (matchedIndices.has(i)) continue;
    const deviation = pressTime - breathPoints[i].time;
    const absDev = Math.abs(deviation);
    if (absDev <= WINDOW && absDev < bestDeviation) {
      bestDeviation = absDev;
      bestIndex = i;
    }
  }

  if (bestIndex === -1) return null;
  return { index: bestIndex, deviation: pressTime - breathPoints[bestIndex].time };
}

export function calculateRoundStats(
  hitRecords: HitRecord[],
  breathPoints: BreathPoint[],
  totalRounds: number
): RoundStat[] {
  const roundTotals = new Map<number, number>();
  const roundHits = new Map<number, number>();

  for (let i = 1; i <= totalRounds; i++) {
    roundTotals.set(i, 0);
    roundHits.set(i, 0);
  }

  for (const point of breathPoints) {
    roundTotals.set(point.round, (roundTotals.get(point.round) ?? 0) + 1);
  }

  for (const record of hitRecords) {
    if (record.rating !== 'miss') {
      roundHits.set(record.round, (roundHits.get(record.round) ?? 0) + 1);
    }
  }

  const result: RoundStat[] = [];
  for (let i = 1; i <= totalRounds; i++) {
    const total = roundTotals.get(i) ?? 0;
    const hit = roundHits.get(i) ?? 0;
    result.push({
      round: i,
      total,
      hit,
      hitRate: total > 0 ? (hit / total) * 100 : 0,
    });
  }

  return result;
}

export function calculateAverageDeviation(hitRecords: HitRecord[]): number {
  const hits = hitRecords.filter((r) => r.rating !== 'miss');
  if (hits.length === 0) return 0;
  const sum = hits.reduce((acc, r) => acc + Math.abs(r.deviation), 0);
  return Math.round(sum / hits.length);
}

export function getInitialStats(
  breathPoints: BreathPoint[],
  totalRounds: number
): TrainingStats {
  const roundStats = calculateRoundStats([], breathPoints, totalRounds);
  return {
    combo: 0,
    maxCombo: 0,
    consecutiveMiss: 0,
    totalPerfect: 0,
    totalGood: 0,
    totalMiss: 0,
    averageDeviation: 0,
    roundStats,
  };
}

export function calculateTotalHitRate(
  stats: TrainingStats,
  totalBreathPoints: number
): number {
  if (totalBreathPoints === 0) return 0;
  return Math.round(
    ((stats.totalPerfect + stats.totalGood) / totalBreathPoints) * 100
  );
}
