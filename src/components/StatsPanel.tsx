import { BarChart3, Target, TrendingUp, Award } from 'lucide-react';
import type { TrainingStats, PracticeSegment } from '@/types';
import { calculateTotalHitRate } from '@/utils/scoring';

interface StatsPanelProps {
  stats: TrainingStats;
  totalBreathPoints: number;
  isPracticeMode: boolean;
  practiceSegment: PracticeSegment | null;
}

export function StatsPanel({ stats, totalBreathPoints, isPracticeMode, practiceSegment }: StatsPanelProps) {
  const effectiveTotal = isPracticeMode && practiceSegment
    ? practiceSegment.breathPointIndices.size
    : totalBreathPoints;
  const totalHitRate = calculateTotalHitRate(stats, effectiveTotal);
  const total = stats.totalPerfect + stats.totalGood + stats.totalMiss;

  const getBarColor = (hitRate: number) => {
    if (hitRate >= 90) return 'from-amber-400 to-amber-500';
    if (hitRate >= 70) return 'from-green-400 to-green-500';
    if (hitRate >= 50) return 'from-yellow-400 to-yellow-500';
    return 'from-red-400 to-red-500';
  };

  const visibleRoundStats = isPracticeMode && practiceSegment
    ? stats.roundStats.filter(
        (r) => r.round >= practiceSegment.startRound && r.round <= practiceSegment.endRound
      )
    : stats.roundStats;

  const adjustedRoundStats = visibleRoundStats.map((round) => {
    if (isPracticeMode && practiceSegment) {
      const segmentTotal = round.total;
      const segmentHit = round.hit;
      return {
        ...round,
        total: segmentTotal,
        hit: segmentHit,
        hitRate: segmentTotal > 0 ? (segmentHit / segmentTotal) * 100 : 0,
      };
    }
    return round;
  });

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-purple-400" />
        训练统计
        {isPracticeMode && (
          <span className="ml-2 px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded-full">
            精练模式
          </span>
        )}
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400">
              {isPracticeMode ? '段内命中率' : '总命中率'}
            </span>
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
          <span className="text-xs text-slate-400 block mb-2">
            {isPracticeMode ? '段内总计' : '总计'}
          </span>
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
        <h4 className="text-sm text-slate-400 mb-4">
          {isPracticeMode ? '精练段各轮命中率' : '各轮命中率'}
        </h4>
        <div className="space-y-3">
          {adjustedRoundStats.map((round) => (
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

      {isPracticeMode && (
        <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <p className="text-xs text-amber-300">
            ⚠️ 精练模式下成绩不计入个人最佳记录
          </p>
        </div>
      )}
    </div>
  );
}
