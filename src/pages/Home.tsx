import { Header } from '@/components/Header';
import { MusicInfo } from '@/components/MusicInfo';
import { WaveformProgress } from '@/components/WaveformProgress';
import { RealtimeFeedback } from '@/components/RealtimeFeedback';
import { StatsPanel } from '@/components/StatsPanel';
import { ControlButtons } from '@/components/ControlButtons';
import { BreathSchedule } from '@/components/BreathSchedule';
import { Instructions } from '@/components/Instructions';
import { useTrainingLogic } from '@/hooks/useTrainingLogic';
import { useTrainingStore } from '@/store/useTrainingStore';

export default function Home() {
  const {
    musicData,
    isPlaying,
    currentTime,
    stats,
    lastRating,
    lastDeviation,
    bestRecord,
    hitRecords,
    isFinished,
    isPracticeMode,
    practiceSegment,
    practiceLoopCount,
    selectedRounds,
    handlePlayPause,
    handleReset,
    handleToggleRoundSelection,
    clearRoundSelection,
    handleEnterPracticeMode,
    handleExitPracticeMode,
    canEnterPracticeMode,
    playError,
  } = useTrainingLogic();

  const matchedIndices = useTrainingStore((state) => state.matchedIndices);

  if (!musicData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header bestRecord={bestRecord} />

      <main className="max-w-6xl mx-auto px-4 pb-12">
        <div className="space-y-6">
          <MusicInfo musicData={musicData} />

          <WaveformProgress
            musicData={musicData}
            currentTime={currentTime}
            hitRecords={hitRecords}
            matchedIndices={matchedIndices}
            isPracticeMode={isPracticeMode}
            practiceSegment={practiceSegment}
            practiceLoopCount={practiceLoopCount}
          />

          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <RealtimeFeedback
                stats={stats}
                lastRating={lastRating}
                lastDeviation={lastDeviation}
                isPlaying={isPlaying}
              />
            </div>
            <div className="lg:col-span-3">
              <StatsPanel
                stats={stats}
                totalBreathPoints={musicData.breathPoints.length}
                isPracticeMode={isPracticeMode}
                practiceSegment={practiceSegment}
              />
            </div>
          </div>

          <ControlButtons
            isPlaying={isPlaying}
            isFinished={isFinished}
            isPracticeMode={isPracticeMode}
            practiceSegment={practiceSegment}
            practiceLoopCount={practiceLoopCount}
            playError={playError}
            canEnterPractice={canEnterPracticeMode()}
            onPlayPause={handlePlayPause}
            onReset={handleReset}
            onEnterPractice={handleEnterPracticeMode}
            onExitPractice={handleExitPracticeMode}
          />

          <BreathSchedule
            musicData={musicData}
            hitRecords={hitRecords}
            currentTime={currentTime}
            isPlaying={isPlaying}
            isPracticeMode={isPracticeMode}
            practiceSegment={practiceSegment}
            selectedRounds={selectedRounds}
            onToggleRoundSelection={handleToggleRoundSelection}
            onClearRoundSelection={clearRoundSelection}
          />

          <Instructions />
        </div>
      </main>

      <footer className="text-center py-6 text-slate-500 text-sm">
        <p>轮吹换气时点偏差训练 · Breath Timing Accuracy Trainer</p>
      </footer>
    </div>
  );
}
