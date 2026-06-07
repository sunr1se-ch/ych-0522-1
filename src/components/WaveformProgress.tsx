import type { MusicData, HitRecord, PracticeSegment } from '@/types';

interface WaveformProgressProps {
  musicData: MusicData | null;
  currentTime: number;
  hitRecords: HitRecord[];
  matchedIndices: Set<number>;
  isPracticeMode: boolean;
  practiceSegment: PracticeSegment | null;
  practiceLoopCount: number;
}

export function WaveformProgress({
  musicData,
  currentTime,
  hitRecords,
  matchedIndices,
  isPracticeMode,
  practiceSegment,
  practiceLoopCount,
}: WaveformProgressProps) {
  if (!musicData) return null;

  const displayTime = isPracticeMode && practiceSegment
    ? currentTime - practiceSegment.startTime
    : currentTime;
  const displayDuration = isPracticeMode && practiceSegment
    ? practiceSegment.endTime - practiceSegment.startTime
    : musicData.duration;

  const progress = displayDuration > 0 ? (displayTime / displayDuration) * 100 : 0;
  const barCount = 60;

  const isPointInSegment = (index: number): boolean => {
    if (!isPracticeMode || !practiceSegment) return true;
    return practiceSegment.breathPointIndices.has(index);
  };

  const getDisplayPosition = (time: number): number => {
    if (isPracticeMode && practiceSegment) {
      const adjustedTime = time - practiceSegment.startTime;
      return (adjustedTime / displayDuration) * 100;
    }
    return (time / musicData.duration) * 100;
  };

  const getRatingColor = (index: number, inSegment: boolean) => {
    if (!inSegment) return 'bg-slate-600/30';
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
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">播放进度</h3>
          {isPracticeMode && practiceSegment && (
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <span className="text-purple-300 text-sm">
                循环第 <span className="font-bold text-purple-200">{practiceLoopCount}</span> 次
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-mono text-cyan-400">
            {formatTime(displayTime)}
          </span>
          <span className="text-slate-500">/</span>
          <span className="font-mono text-slate-400">
            {formatTime(displayDuration)}
          </span>
          {isPracticeMode && practiceSegment && (
            <span className="text-xs text-slate-500 ml-2">
              (原始: {formatTime(currentTime)} / {formatTime(musicData.duration)})
            </span>
          )}
        </div>
      </div>

      <div className="relative h-24 bg-white/5 rounded-xl overflow-hidden mb-4">
        {isPracticeMode && practiceSegment && (
          <div
            className="absolute top-0 h-full bg-purple-500/10 border-l-2 border-r-2 border-purple-400/50 pointer-events-none"
            style={{
              left: `${0}%`,
              width: `${100}%`,
            }}
          />
        )}

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
          const position = getDisplayPosition(point.time);
          const matched = matchedIndices.has(index);
          const upcoming = isUpcoming(point.time);
          const passed = isPassed(point.time);
          const inSegment = isPointInSegment(index);

          if (position < 0 || position > 100) return null;

          return (
            <div
              key={index}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
            >
              <div
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  matched
                    ? getRatingColor(index, inSegment)
                    : upcoming && inSegment
                    ? 'bg-cyan-400 animate-pulse scale-125'
                    : passed && inSegment
                    ? 'bg-red-500/50'
                    : inSegment
                    ? 'bg-white/40'
                    : 'bg-slate-600/40'
                } ${!inSegment ? 'opacity-40' : ''}`}
              />
              <div
                className={`w-px h-full ${
                  matched
                    ? getRatingColor(index, inSegment)
                    : inSegment
                    ? 'bg-white/10'
                    : 'bg-slate-700/30'
                } ${!inSegment ? 'opacity-40' : ''}`}
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
          {isPracticeMode && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-slate-600/40" />
              <span className="text-slate-500">段外</span>
            </div>
          )}
        </div>
        <div className="text-slate-500">
          进度: {progress.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const millis = Math.floor((Math.max(0, ms) % 1000) / 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
}
