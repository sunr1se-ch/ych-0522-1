import type { MusicData, HitRecord } from '@/types';

interface WaveformProgressProps {
  musicData: MusicData | null;
  currentTime: number;
  hitRecords: HitRecord[];
  matchedIndices: Set<number>;
}

export function WaveformProgress({
  musicData,
  currentTime,
  hitRecords,
  matchedIndices,
}: WaveformProgressProps) {
  if (!musicData) return null;

  const progress = (currentTime / musicData.duration) * 100;
  const barCount = 60;

  const getRatingColor = (index: number) => {
    const record = hitRecords.find((r) => r.breathPointIndex === index);
    if (!record) return 'bg-white/40';
    if (record.rating === 'perfect') return 'bg-amber-400 shadow-lg shadow-amber-400/50';
    if (record.rating === 'good') return 'bg-green-400 shadow-lg shadow-green-400/50';
    return 'bg-red-400 shadow-lg shadow-red-400/50';
  };

  const isPassed = (time: number) => currentTime >= time;
  const isUpcoming = (time: number) => time > currentTime && time - currentTime <= 1500;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">播放进度</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-mono text-cyan-400">
            {formatTime(currentTime)}
          </span>
          <span className="text-slate-500">/</span>
          <span className="font-mono text-slate-400">
            {formatTime(musicData.duration)}
          </span>
        </div>
      </div>

      <div className="relative h-24 bg-white/5 rounded-xl overflow-hidden mb-4">
        <div className="absolute inset-0 flex items-center justify-around px-4">
          {Array.from({ length: barCount }).map((_, i) => {
            const height = 20 + Math.sin(i * 0.5) * 30 + Math.random() * 20;
            const barProgress = (i / barCount) * 100;
            const isActive = barProgress <= progress;
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-100 ${
                  isActive
                    ? 'bg-gradient-to-t from-cyan-500 to-purple-500'
                    : 'bg-white/10'
                }`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>

        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 pointer-events-none"
          style={{ width: `${progress}%` }}
        />

        <div
          className="absolute top-0 h-full w-0.5 bg-white shadow-lg shadow-white/50 pointer-events-none"
          style={{ left: `${progress}%` }}
        />

        {musicData.breathPoints.map((point, index) => {
          const position = (point.time / musicData.duration) * 100;
          const matched = matchedIndices.has(index);
          const upcoming = isUpcoming(point.time);
          const passed = isPassed(point.time);

          return (
            <div
              key={index}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
            >
              <div
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  matched
                    ? getRatingColor(index)
                    : upcoming
                    ? 'bg-cyan-400 animate-pulse scale-125'
                    : passed
                    ? 'bg-red-500/50'
                    : 'bg-white/40'
                }`}
              />
              <div
                className={`w-px h-full ${
                  matched ? getRatingColor(index) : 'bg-white/10'
                }`}
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-slate-400">Perfect</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-slate-400">Good</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <span className="text-slate-400">Miss</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-white/40" />
            <span className="text-slate-400">待命中</span>
          </div>
        </div>
        <div className="text-slate-500">
          进度: {progress.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const millis = Math.floor((ms % 1000) / 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
}
