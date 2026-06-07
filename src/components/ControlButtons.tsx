import { Play, Pause, RotateCcw } from 'lucide-react';

interface ControlButtonsProps {
  isPlaying: boolean;
  isFinished: boolean;
  playError: string | null;
  onPlayPause: () => void;
  onReset: () => void;
}

export function ControlButtons({
  isPlaying,
  isFinished,
  playError,
  onPlayPause,
  onReset,
}: ControlButtonsProps) {
  const getButtonLabel = () => {
    if (isFinished) return '重新开始';
    if (isPlaying) return '暂停';
    return '开始播放';
  };

  return (
    <div className="glass rounded-2xl p-6">
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
