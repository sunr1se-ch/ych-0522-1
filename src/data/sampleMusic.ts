import type { MusicData } from '@/types';

export const sampleMusic: MusicData = {
  id: 'sample-001',
  name: '示范练习曲 - C大调',
  duration: 32000,
  audioUrl: '/audio/sample.wav',
  totalRounds: 4,
  breathPoints: [
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
  ],
};
