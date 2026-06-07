import { Play, Pause, RotateCcw, Target, LogOut } from 'lucide-react';
import type { PracticeSegment } from '@/types';

interface ControlButtonsProps {
  isPlaying: boolean;
  isFinished: boolean;
  isPracticeMode: boolean;
  practiceSegment: PracticeSegment | null;
  practiceLoopCount: number;
  playError: string | null;
  canEnterPractice: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onEnterPractice: () => void;
  onExitPractice: () => void;
}

export function ControlButtons({
  isPlaying,
  isFinished,
  isPracticeMode,
  practiceSegment,
  practiceLoopCount,
  playError,
  canEnterPractice,
  onPlayPause,
  onReset,
  onEnterPractice,
  onExitPractice,
}: ControlButtonsProps) {
  const getButtonLabel = () => {
    if (isFinished) return '重新开始';
    if (isPlaying) return '暂停';
    return '开始播放';
  };

  return (
    <div className="glass rounded-2xl p-6">
      {isPracticeMode && practiceSegment && (
        <div className="mb-4 p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-purple-300 font-medium">分段循环精练模式</div>
                <div className="text-sm text-purple-400/80">
                  精练段：第 {practiceSegment.startRound} - {practiceSegment.endRound} 轮
                  <span className="mx-2">·</span>
                  已循环 <span className="font-bold text-purple-200">{practiceLoopCount}</span> 次
                </div>
              </div>
            </div>
            <button
              onClick={onExitPractice}
              disabled={isPlaying}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isPlaying
                  ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white'
              }`}
            >
              <LogOut className="w-4 h-4" />
              退出精练
            </button>
          </div>
        </div>
      )}

      {!isPracticeMode && canEnterPractice && (
        <div className="mb-4 p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="text-cyan-300 font-medium">已选择精练范围</div>
                <div className="text-sm text-cyan-400/80">
                  点击"开始精练"后将在选中范围内循环播放
                </div>
              </div>
            </div>
            <button
              onClick={onEnterPractice}
              disabled={isPlaying}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                isPlaying
                  ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50'
              }`}
            >
              <Target className="w-4 h-4" />
              开始精练
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onPlayPause}
          className={`group relative flex items-center gap-3 px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            isPlaying
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50'
              : 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50'
          }`}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6" />
          )}
          {getButtonLabel()}
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 border border-white/20 hover:border-white/30"
        >
          <RotateCcw className="w-5 h-5" />
          重置
        </button>
      </div>

      {playError && (
        <p className="mt-4 text-center text-sm text-red-400" role="alert">
          {playError}
        </p>
      )}
    </div>
  );
}
