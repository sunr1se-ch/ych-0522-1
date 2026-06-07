export interface BreathPoint {
  time: number;
  round: number;
}

export interface MusicData {
  id: string;
  name: string;
  duration: number;
  audioUrl: string;
  totalRounds: number;
  breathPoints: BreathPoint[];
}

export type Rating = 'perfect' | 'good' | 'miss';

export interface HitRecord {
  breathPointIndex: number;
  pressTime: number;
  referenceTime: number;
  deviation: number;
  rating: Rating;
  round: number;
}

export interface RoundStat {
  round: number;
  total: number;
  hit: number;
  hitRate: number;
}

export interface TrainingStats {
  combo: number;
  maxCombo: number;
  consecutiveMiss: number;
  totalPerfect: number;
  totalGood: number;
  totalMiss: number;
  averageDeviation: number;
  roundStats: RoundStat[];
}

export interface BestRecord {
  musicId: string;
  maxCombo: number;
  totalHitRate: number;
  averageDeviation: number;
  date: string;
}

export interface TrainingState {
  isPlaying: boolean;
  currentTime: number;
  musicData: MusicData | null;
  hitRecords: HitRecord[];
  matchedIndices: Set<number>;
  stats: TrainingStats;
  lastRating: Rating | null;
  lastDeviation: number | null;
  bestRecord: BestRecord | null;
  isFinished: boolean;
}
