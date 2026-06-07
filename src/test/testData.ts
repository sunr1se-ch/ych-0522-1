import type { MusicData, HitRecord, BreathPoint } from '@/types';

export const mockBreathPoints: BreathPoint[] = [
  { time: 2000, round: 1 },
  { time: 4500, round: 1 },
  { time: 7000, round: 1 },
  { time: 9500, round: 2 },
  { time: 12000, round: 2 },
  { time: 14500, round: 2 },
  { time: 17000, round: 3 },
  { time: 19500, round: 3 },
  { time: 22000, round: 3 },
  { time: 24500, round: 4 },
  { time: 27000, round: 4 },
  { time: 29500, round: 4 },
];

export const mockMusicData: MusicData = {
  id: 'test-music-001',
  name: 'Test Music',
  duration: 32000,
  audioUrl: '/audio/test.wav',
  totalRounds: 4,
  breathPoints: mockBreathPoints,
};

export function createHitRecord(
  breathPointIndex: number,
  deviation: number,
  rating: 'perfect' | 'good' | 'miss',
  round: number
): HitRecord {
  const point = mockBreathPoints[breathPointIndex];
  return {
    breathPointIndex,
    pressTime: point.time + deviation,
    referenceTime: point.time,
    deviation,
    rating,
    round,
  };
}
