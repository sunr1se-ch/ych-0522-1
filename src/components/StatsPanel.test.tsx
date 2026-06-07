import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsPanel } from './StatsPanel';
import { getInitialStats } from '@/utils/scoring';
import { mockBreathPoints, mockMusicData } from '@/test/testData';

describe('StatsPanel', () => {
  const renderComponent = (overrides = {}) => {
    const stats = getInitialStats(mockBreathPoints, mockMusicData.totalRounds);
    const defaultProps = {
      stats,
      totalBreathPoints: mockBreathPoints.length,
      isPracticeMode: false,
      practiceSegment: null,
      ...overrides,
    };
    return render(<StatsPanel {...defaultProps} />);
  };

  it('renders initial stats correctly', () => {
    renderComponent();

    expect(screen.getByText('训练统计')).toBeInTheDocument();
    expect(screen.getByText('总命中率')).toBeInTheDocument();
    expect(screen.getByText('平均偏差')).toBeInTheDocument();
    expect(screen.getByText('Perfect')).toBeInTheDocument();
    expect(screen.getByText('总计')).toBeInTheDocument();
  });

  it('displays hit rate correctly', () => {
    const stats = getInitialStats(mockBreathPoints, mockMusicData.totalRounds);
    stats.totalPerfect = 6;
    stats.totalGood = 3;
    stats.totalMiss = 3;

    renderComponent({ stats });

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('displays average deviation correctly', () => {
    const stats = getInitialStats(mockBreathPoints, mockMusicData.totalRounds);
    stats.averageDeviation = 35;

    renderComponent({ stats });

    expect(screen.getByText('±35')).toBeInTheDocument();
    expect(screen.getByText('ms')).toBeInTheDocument();
  });

  it('displays perfect, good, miss counts correctly', () => {
    const stats = getInitialStats(mockBreathPoints, mockMusicData.totalRounds);
    stats.totalPerfect = 5;
    stats.totalGood = 3;
    stats.totalMiss = 2;

    renderComponent({ stats });

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('G:3')).toBeInTheDocument();
    expect(screen.getByText('M:2')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders all round stats', () => {
    const stats = getInitialStats(mockBreathPoints, mockMusicData.totalRounds);
    stats.roundStats[0].hit = 2;
    stats.roundStats[0].hitRate = (2 / 3) * 100;
    stats.roundStats[1].hit = 3;
    stats.roundStats[1].hitRate = 100;

    const { container } = renderComponent({ stats });

    expect(screen.getByText('第 1 轮')).toBeInTheDocument();
    expect(screen.getByText('第 2 轮')).toBeInTheDocument();
    expect(screen.getByText('第 3 轮')).toBeInTheDocument();
    expect(screen.getByText('第 4 轮')).toBeInTheDocument();

    const allText = container.textContent || '';
    expect(allText).toContain('2/3');
    expect(allText).toContain('3/3');
  });

  it('shows practice mode badge and adjusted labels', () => {
    const practiceSegment = {
      startRound: 2,
      endRound: 3,
      startTime: 9000,
      endTime: 22500,
      breathPointIndices: new Set([3, 4, 5, 6, 7, 8]),
    };

    renderComponent({ isPracticeMode: true, practiceSegment });

    expect(screen.getByText('精练模式')).toBeInTheDocument();
    expect(screen.getByText('段内命中率')).toBeInTheDocument();
    expect(screen.getByText('段内总计')).toBeInTheDocument();
    expect(screen.getByText('精练段各轮命中率')).toBeInTheDocument();
    expect(screen.getByText('⚠️ 精练模式下成绩不计入个人最佳记录')).toBeInTheDocument();
  });

  it('filters round stats to practice segment range', () => {
    const stats = getInitialStats(mockBreathPoints, mockMusicData.totalRounds);
    stats.roundStats[1].hit = 2;
    stats.roundStats[2].hit = 3;

    const practiceSegment = {
      startRound: 2,
      endRound: 3,
      startTime: 9000,
      endTime: 22500,
      breathPointIndices: new Set([3, 4, 5, 6, 7, 8]),
    };

    renderComponent({ stats, isPracticeMode: true, practiceSegment });

    expect(screen.getByText('第 2 轮')).toBeInTheDocument();
    expect(screen.getByText('第 3 轮')).toBeInTheDocument();
    expect(screen.queryByText('第 1 轮')).not.toBeInTheDocument();
    expect(screen.queryByText('第 4 轮')).not.toBeInTheDocument();
  });

  it('calculates practice mode hit rate based on segment total', () => {
    const stats = getInitialStats(mockBreathPoints, mockMusicData.totalRounds);
    stats.totalPerfect = 4;
    stats.totalGood = 2;

    const practiceSegment = {
      startRound: 2,
      endRound: 3,
      startTime: 9000,
      endTime: 22500,
      breathPointIndices: new Set([3, 4, 5, 6, 7, 8]),
    };

    renderComponent({ stats, isPracticeMode: true, practiceSegment });

    const hitRate = Math.round(((4 + 2) / 6) * 100);
    expect(screen.getByText(`${hitRate}%`)).toBeInTheDocument();
  });

  it('applies correct bar color based on hit rate', () => {
    const stats = getInitialStats(mockBreathPoints, mockMusicData.totalRounds);
    stats.roundStats[0].hit = 3;
    stats.roundStats[0].hitRate = 100;

    const { container } = renderComponent({ stats });

    const bar = container.querySelector('.from-amber-400');
    expect(bar).toBeInTheDocument();
  });
});
