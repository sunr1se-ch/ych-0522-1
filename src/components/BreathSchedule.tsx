import React from 'react';
import { CalendarClock, Target, X } from 'lucide-react';
import type { MusicData, HitRecord, Rating, PracticeSegment } from '@/types';

interface BreathScheduleProps {
  musicData: MusicData | null;
  hitRecords: HitRecord[];
  currentTime: number;
  isPlaying: boolean;
  isPracticeMode: boolean;
  practiceSegment: PracticeSegment | null;
  selectedRounds: Set<number>;
  onToggleRoundSelection: (round: number) => void;
  onClearRoundSelection: () => void;
}

export function BreathSchedule({
  musicData,
  hitRecords,
  currentTime,
  isPlaying,
  isPracticeMode,
  practiceSegment,
  selectedRounds,
  onToggleRoundSelection,
  onClearRoundSelection,
}: BreathScheduleProps) {
  if (!musicData) return null;

  const isPointInSegment = (index: number): boolean => {
    if (!isPracticeMode || !practiceSegment) return true;
    return practiceSegment.breathPointIndices.has(index);
  };

  const getRatingForPoint = (index: number): Rating | null => {
    const record = hitRecords.find((r) => r.breathPointIndex === index);
    return record ? record.rating : null;
  };

  const getDeviationForPoint = (index: number): number | null => {
    const record = hitRecords.find((r) => r.breathPointIndex === index);
    return record ? record.deviation : null;
  };

  const getRatingColor = (rating: Rating | null, inSegment: boolean) => {
    if (!inSegment) return 'bg-slate-700/30 text-slate-600 border-slate-700/30';
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

  const getRatingBadge = (rating: Rating | null, inSegment: boolean) => {
    if (!inSegment) return '·';
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

  const rounds = Array.from(roundGroups.keys()).sort((a, b) => a - b);

  const getSelectedRangeText = () => {
    if (selectedRounds.size === 0) return null;
    const sorted = Array.from(selectedRounds).sort((a, b) => a - b);
    if (sorted.length === 1) return `第 ${sorted[0]} 轮`;
    return `第 ${sorted[0]} - ${sorted[sorted.length - 1]} 轮`;
  };

  const isRoundSelected = (round: number) => selectedRounds.has(round);

  const canSelect = !isPlaying && !isPracticeMode;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-pink-400" />
          换气时刻表
        </h3>

        {!isPracticeMode && (
          <div className="flex items-center gap-3">
            {selectedRounds.size > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                <Target className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-cyan-300">已选：{getSelectedRangeText()}</span>
                <button
                  onClick={onClearRoundSelection}
                  className="ml-1 p-0.5 hover:bg-cyan-500/20 rounded transition-colors"
                  title="清除选择"
                >
                  <X className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>
            )}
            {canSelect && (
              <div className="text-xs text-slate-400">
                点击轮次可选择精练范围
              </div>
            )}
          </div>
        )}

        {isPracticeMode && practiceSegment && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 rounded-lg border border-purple-500/30">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">
              精练段：第 {practiceSegment.startRound} - {practiceSegment.endRound} 轮
            </span>
          </div>
        )}
      </div>

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
            {rounds.map((round) => {
              const points = roundGroups.get(round)!;
              const roundInSegment = !isPracticeMode || !practiceSegment
                ? true
                : round >= practiceSegment.startRound && round <= practiceSegment.endRound;

              return (
                <React.Fragment key={round}>
                  {points.map((point, idx) => {
                    const rating = getRatingForPoint(point.index);
                    const deviation = getDeviationForPoint(point.index);
                    const upcoming = isUpcoming(point.time);
                    const passed = isPassed(point.time);
                    const inSegment = isPointInSegment(point.index);

                    return (
                      <tr
                        key={point.index}
                        className={`border-t border-white/5 transition-all ${
                          upcoming && inSegment ? 'bg-cyan-500/10' : ''
                        } ${passed && !rating && inSegment ? 'bg-red-500/5' : ''} ${
                          !inSegment ? 'opacity-40' : ''
                        }`}
                      >
                        {idx === 0 && (
                          <td
                            rowSpan={points.length}
                            className={`py-3 px-3 font-medium align-top ${
                              canSelect
                                ? 'cursor-pointer hover:bg-cyan-500/10 transition-colors'
                                : ''
                            } ${
                              isRoundSelected(round)
                                ? 'bg-cyan-500/15 text-cyan-300'
                                : roundInSegment
                                ? 'text-slate-300'
                                : 'text-slate-600'
                            }`}
                            onClick={() => canSelect && onToggleRoundSelection(round)}
                          >
                            <div className="flex items-center gap-2">
                              {canSelect && (
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                    isRoundSelected(round)
                                      ? 'bg-cyan-500 border-cyan-400'
                                      : 'border-slate-600'
                                  }`}
                                >
                                  {isRoundSelected(round) && (
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                  )}
                                </div>
                              )}
                              第 {round} 轮
                            </div>
                          </td>
                        )}
                        <td className={`py-3 px-3 font-mono ${inSegment ? 'text-slate-400' : 'text-slate-600'}`}>
                          #{idx + 1}
                        </td>
                        <td className={`py-3 px-3 font-mono ${inSegment ? 'text-white' : 'text-slate-600'}`}>
                          {formatTime(point.time)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex w-8 h-8 items-center justify-center rounded-full text-xs font-bold border transition-all ${
                              getRatingColor(rating, inSegment)
                            } ${
                              upcoming && inSegment
                                ? 'animate-pulse ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900'
                                : ''
                            }`}
                          >
                            {getRatingBadge(rating, inSegment)}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {deviation !== null && inSegment ? (
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
              );
            })}
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
