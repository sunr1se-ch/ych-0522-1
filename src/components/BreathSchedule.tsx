import React from 'react';
import { CalendarClock } from 'lucide-react';
import type { MusicData, HitRecord, Rating } from '@/types';

interface BreathScheduleProps {
  musicData: MusicData | null;
  hitRecords: HitRecord[];
  currentTime: number;
}

export function BreathSchedule({
  musicData,
  hitRecords,
  currentTime,
}: BreathScheduleProps) {
  if (!musicData) return null;

  const getRatingForPoint = (index: number): Rating | null => {
    const record = hitRecords.find((r) => r.breathPointIndex === index);
    return record ? record.rating : null;
  };

  const getDeviationForPoint = (index: number): number | null => {
    const record = hitRecords.find((r) => r.breathPointIndex === index);
    return record ? record.deviation : null;
  };

  const getRatingColor = (rating: Rating | null) => {
    switch (rating) {
      case 'perfect':
        return 'bg-amber-400/20 text-amber-400 border-amber-400/30';
      case 'good':
        return 'bg-green-400/20 text-green-400 border-green-400/30';
      case 'miss':
        return 'bg-red-400/20 text-red-400 border-red-400/30';
      default:
        return 'bg-white/5 text-slate-400 border-white/10';
    }
  };

  const getRatingBadge = (rating: Rating | null) => {
    switch (rating) {
      case 'perfect':
        return 'P';
      case 'good':
        return 'G';
      case 'miss':
        return 'M';
      default:
        return '-';
    }
  };

  const isUpcoming = (time: number) => time > currentTime && time - currentTime <= 2000;
  const isPassed = (time: number) => currentTime >= time;

  const roundGroups = new Map<number, Array<{ index: number; time: number; round: number }>>();
  musicData.breathPoints.forEach((point, index) => {
    if (!roundGroups.has(point.round)) {
      roundGroups.set(point.round, []);
    }
    roundGroups.get(point.round)!.push({ index, ...point });
  });

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <CalendarClock className="w-5 h-5 text-pink-400" />
        换气时刻表
      </h3>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs uppercase tracking-wider">
              <th className="text-left py-2 px-3 font-medium">轮次</th>
              <th className="text-left py-2 px-3 font-medium">序号</th>
              <th className="text-left py-2 px-3 font-medium">参考时刻</th>
              <th className="text-left py-2 px-3 font-medium">状态</th>
              <th className="text-left py-2 px-3 font-medium">偏差</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(roundGroups.entries()).map(([round, points]) => (
              <React.Fragment key={round}>
                {points.map((point, idx) => {
                  const rating = getRatingForPoint(point.index);
                  const deviation = getDeviationForPoint(point.index);
                  const upcoming = isUpcoming(point.time);
                  const passed = isPassed(point.time);

                  return (
                    <tr
                      key={point.index}
                      className={`border-t border-white/5 transition-all ${
                        upcoming ? 'bg-cyan-500/10' : ''
                      } ${passed && !rating ? 'bg-red-500/5' : ''}`}
                    >
                      {idx === 0 && (
                        <td
                          rowSpan={points.length}
                          className="py-3 px-3 font-medium text-slate-300 align-top"
                        >
                          第 {round} 轮
                        </td>
                      )}
                      <td className="py-3 px-3 text-slate-400 font-mono">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono text-white">
                        {formatTime(point.time)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex w-8 h-8 items-center justify-center rounded-full text-xs font-bold border ${
                            getRatingColor(rating)
                          } ${upcoming ? 'animate-pulse ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : ''}`}
                        >
                          {getRatingBadge(rating)}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {deviation !== null ? (
                          <span
                            className={
                              rating === 'perfect'
                                ? 'text-amber-400'
                                : rating === 'good'
                                ? 'text-green-400'
                                : 'text-red-400'
                            }
                          >
                            {deviation > 0 ? '+' : ''}
                            {deviation}ms
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
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
