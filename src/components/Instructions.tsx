import { Info, Keyboard } from 'lucide-react';

export function Instructions() {
  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Info className="w-5 h-5 text-cyan-400" />
        操作说明
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            操作方式
          </h4>
          <div className="space-y-2 text-sm text-slate-400">
            <div className="flex items-center gap-3">
              <kbd className="px-3 py-1.5 bg-white/10 rounded-lg border border-white/20 font-mono text-white text-xs">
                空格
              </kbd>
              <span>在换气点处按下，记录换气时机</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 bg-cyan-500/20 rounded-lg border border-cyan-500/30 text-cyan-400 text-xs font-medium">
                开始/暂停
              </span>
              <span>控制乐段播放</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 bg-white/10 rounded-lg border border-white/20 text-slate-300 text-xs font-medium">
                重置
              </span>
              <span>重新开始训练</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3">评分规则</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 rounded-lg bg-amber-400/10">
              <span className="text-amber-400 font-medium">Perfect</span>
              <span className="text-slate-400 font-mono">偏差 &le; 45ms</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-green-400/10">
              <span className="text-green-400 font-medium">Good</span>
              <span className="text-slate-400 font-mono">45ms &lt; 偏差 &le; 100ms</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-red-400/10">
              <span className="text-red-400 font-medium">Miss</span>
              <span className="text-slate-400 font-mono">偏差 &gt; 100ms 或 未按键</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
        <p className="text-sm text-slate-300">
          <span className="text-purple-400 font-medium">Combo 规则：</span>
          每次 Perfect 或 Good 累计 Combo +1，连续 3 次 Miss 则 Combo 清零。
          争取更高的连击数和命中率吧！
        </p>
      </div>
    </div>
  );
}
