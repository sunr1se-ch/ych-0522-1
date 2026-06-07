import { BarChart3, Target, TrendingUp, Award } from 'lucide-react';
import type { TrainingStats } from '@/types';
import { calculateTotalHitRate } from '@/utils/scoring';

interface StatsPanelProps {
  stats: TrainingStats;
  totalBreathPoints: number;
}

export function StatsPanel({ stats, totalBreathPoints }: StatsPanelProps) {
  const totalHitRate = calculateTotalHitRate(stats, totalBreathPoints);
  const total = stats.totalPerfect + stats.totalGood + stats.totalMiss;

  const getBarColor = (hitRate: number) => {
    if (hitRate >= 90) return 'from-amber-400 to-amber-500';
    if (hitRate >= 70) return 'from-green-400 to-green-500';
    if (hitRate >= 50) return 'from-yellow-400 to-yellow-500';
    return 'from-red-400 to-red-500';
  };

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-purple-400" />
        训练统计
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400">总命中率</span>
          </div>
          <p className="text-3xl font-bold font-mono text-cyan-400">
            {totalHitRate}%
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400">平均偏差</span>
          </div>
          <p className="text-3xl font-bold font-mono text-purple-400">
            ±{stats.averageDeviation}
            <span className="text-lg">ms</span>
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400">Perfect</span>
          </div>
          <p className="text-3xl font-bold font-mono text-amber-400">
            {stats.totalPerfect}
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 text-center">
          <span className="text-xs text-slate-400 block mb-2">总计</span>
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-green-400 font-mono">G:{stats.totalGood}</span>
            <span className="text-slate-600">|</span>
            <span className="text-red-400 font-mono">M:{stats.totalMiss}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono">{total}</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm text-slate-400 mb-4">各轮命中率</h4>
        <div className="space-y-3">
          {stats.roundStats.map((round) => (
            <div key={round.round} className="flex items-center gap-3">
              <span className="w-16 text-sm font-medium text-slate-300">
                第 {round.round} 轮
              </span>
              <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${getBarColor(
                    round.hitRate
                  )} transition-all duration-500`}
                  style={{ width: `${round.hitRate}%` }}
                />
              </div>
              <span className="w-20 text-right font-mono text-sm">
                <span className="text-white">{round.hit}</span>
                <span className="text-slate-500">/{round.total}</span>
                <span className="text-slate-400 ml-1">
                  ({round.hitRate.toFixed(0)}%)
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
