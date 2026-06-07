import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import type { Rating, TrainingStats } from '@/types';

interface RealtimeFeedbackProps {
  stats: TrainingStats;
  lastRating: Rating | null;
  lastDeviation: number | null;
  isPlaying: boolean;
}

export function RealtimeFeedback({
  stats,
  lastRating,
  lastDeviation,
  isPlaying,
}: RealtimeFeedbackProps) {
  const [comboAnimKey, setComboAnimKey] = useState(0);
  const [ratingAnimKey, setRatingAnimKey] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    if (stats.combo > 0) {
      setComboAnimKey((k) => k + 1);
    }
  }, [stats.combo]);

  useEffect(() => {
    if (lastRating) {
      setRatingAnimKey((k) => k + 1);
      if (lastRating === 'miss') {
        setShakeKey((k) => k + 1);
      }
    }
  }, [lastRating]);

  const getRatingStyle = (rating: Rating | null) => {
    switch (rating) {
      case 'perfect':
        return 'text-amber-400';
      case 'good':
        return 'text-green-400';
      case 'miss':
        return 'text-red-400';
      default:
        return 'text-slate-500';
    }
  };

  const getRatingLabel = (rating: Rating | null) => {
    switch (rating) {
      case 'perfect':
        return 'PERFECT';
      case 'good':
        return 'GOOD';
      case 'miss':
        return 'MISS';
      default:
        return '准备就绪';
    }
  };

  const getDeviationLabel = (deviation: number | null) => {
    if (deviation === null) return '';
    const sign = deviation > 0 ? '+' : '';
    return `${sign}${deviation}ms`;
  };

  return (
    <div className="glass rounded-2xl p-8 text-center" key={shakeKey}>
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span className="text-sm text-slate-400 uppercase tracking-wider">
            Combo
          </span>
        </div>
        <div
          key={comboAnimKey}
          className={`${stats.combo > 0 ? 'animate-combo-bump' : ''}`}
        >
          <span
            className={`text-8xl font-bold font-mono ${
              stats.combo >= 10
                ? 'text-amber-400 text-shadow-glow'
                : stats.combo >= 5
                ? 'text-cyan-400'
                : 'text-white'
            }`}
          >
            {stats.combo}
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          最高连击: <span className="text-purple-400 font-mono">{stats.maxCombo}</span>
        </p>
      </div>

      <div
        key={ratingAnimKey}
        className={`h-24 flex flex-col items-center justify-center ${
          lastRating ? 'animate-rating-pop' : ''
        } ${lastRating === 'miss' ? 'animate-shake' : ''}`}
      >
        <div
          className={`text-5xl font-bold tracking-wider ${getRatingStyle(
            lastRating
          )} ${lastRating === 'perfect' ? 'text-shadow-glow' : ''}`}
        >
          {getRatingLabel(lastRating)}
        </div>
        {lastDeviation !== null && lastRating !== 'miss' && (
          <div
            className={`text-2xl font-mono mt-2 ${getRatingStyle(lastRating)}`}
          >
            {getDeviationLabel(lastDeviation)}
          </div>
        )}
      </div>

      {isPlaying && (
        <div className="mt-6 animate-pulse-glow">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-400 text-sm">按 空格键 进行换气</span>
          </div>
        </div>
      )}
    </div>
  );
}
