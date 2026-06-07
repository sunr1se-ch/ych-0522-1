import { Clock, RotateCcw, Target } from 'lucide-react';
import type { MusicData } from '@/types';

interface MusicInfoProps {
  musicData: MusicData | null;
}

export function MusicInfo({ musicData }: MusicInfoProps) {
  if (!musicData) return null;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-cyan-400" />
        乐段信息
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">乐段名称</p>
          <p className="font-medium text-white truncate">{musicData.name}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> 总时长
          </p>
          <p className="font-mono font-medium text-cyan-400">
            {formatTime(musicData.duration)}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> 轮次数
          </p>
          <p className="font-mono font-medium text-purple-400">
            {musicData.totalRounds} 轮
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">换气点总数</p>
          <p className="font-mono font-medium text-pink-400">
            {musicData.breathPoints.length} 个
          </p>
        </div>
      </div>
    </div>
  );
}
