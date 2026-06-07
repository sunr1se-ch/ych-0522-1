import { Trophy, Music2 } from 'lucide-react';
import type { BestRecord } from '@/types';

interface HeaderProps {
  bestRecord: BestRecord | null;
}

export function Header({ bestRecord }: HeaderProps) {
  return (
    <header className="w-full py-6 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Music2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              轮吹换气时点偏差训练
            </h1>
            <p className="text-sm text-slate-400">Breath Timing Accuracy Trainer</p>
          </div>
        </div>

        <div className="glass rounded-2xl px-5 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-slate-400">个人最佳</p>
            {bestRecord ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-amber-400 font-semibold">
                  {bestRecord.totalHitRate}%
                </span>
                <span className="text-slate-500">|</span>
                <span className="font-mono text-cyan-400 text-sm">
                  ±{bestRecord.averageDeviation}ms
                </span>
              </div>
            ) : (
              <p className="text-sm text-slate-500">暂无记录</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
