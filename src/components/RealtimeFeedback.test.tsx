import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RealtimeFeedback } from './RealtimeFeedback';
import { getInitialStats } from '@/utils/scoring';
import { mockBreathPoints, mockMusicData } from '@/test/testData';

describe('RealtimeFeedback', () => {
  const renderComponent = (overrides = {}) => {
    const stats = getInitialStats(mockBreathPoints, mockMusicData.totalRounds);
    const defaultProps = {
      stats,
      lastRating: null,
      lastDeviation: null,
      isPlaying: false,
      ...overrides,
    };
    return render(<RealtimeFeedback {...defaultProps} />);
  };

  it('renders initial state correctly', () => {
    renderComponent();

    expect(screen.getByText('Combo')).toBeInTheDocument();
    expect(screen.getByText('准备就绪')).toBeInTheDocument();
    expect(screen.getByText('最高连击:')).toBeInTheDocument();
  });

  it('displays combo count correctly', () => {
    const stats = getInitialStats(mockBreathPoints, mockMusicData.totalRounds);
    stats.combo = 5;
    stats.maxCombo = 10;

    renderComponent({ stats });

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('applies golden color for combo >= 10', () => {
    const stats = getInitialStats(mockBreathPoints, mockMusicData.totalRounds);
    stats.combo = 10;

    const { container } = renderComponent({ stats });

    const comboText = container.querySelector('.text-amber-400.text-8xl');
    expect(comboText).toBeInTheDocument();
  });

  it('applies cyan color for combo >= 5 and < 10', () => {
    const stats = getInitialStats(mockBreathPoints, mockMusicData.totalRounds);
    stats.combo = 7;

    const { container } = renderComponent({ stats });

    const comboText = container.querySelector('.text-cyan-400.text-8xl');
    expect(comboText).toBeInTheDocument();
  });

  it('displays PERFECT rating with golden color', () => {
    const stats = getInitialStats(mockBreathPoints, mockMusicData.totalRounds);
    stats.combo = 1;

    const { container } = renderComponent({ stats, lastRating: 'perfect', lastDeviation: 20 });

    expect(screen.getByText('PERFECT')).toBeInTheDocument();
    expect(screen.getByText('+20ms')).toBeInTheDocument();
    const ratingText = container.querySelector('.text-amber-400.text-5xl');
    expect(ratingText).toBeInTheDocument();
  });

  it('displays GOOD rating with green color', () => {
    const stats = getInitialStats(mockBreathPoints, mockMusicData.totalRounds);
    stats.combo = 2;

    const { container } = renderComponent({ stats, lastRating: 'good', lastDeviation: 70 });

    expect(screen.getByText('GOOD')).toBeInTheDocument();
    expect(screen.getByText('+70ms')).toBeInTheDocument();
    const ratingText = container.querySelector('.text-green-400.text-5xl');
    expect(ratingText).toBeInTheDocument();
  });

  it('displays MISS rating with red color and no deviation', () => {
    const stats = getInitialStats(mockBreathPoints, mockMusicData.totalRounds);

    const { container } = renderComponent({ stats, lastRating: 'miss', lastDeviation: 151 });

    expect(screen.getByText('MISS')).toBeInTheDocument();
    expect(screen.queryByText('+151ms')).not.toBeInTheDocument();
    const ratingText = container.querySelector('.text-red-400.text-5xl');
    expect(ratingText).toBeInTheDocument();
  });

  it('displays negative deviation correctly', () => {
    const stats = getInitialStats(mockBreathPoints, mockMusicData.totalRounds);
    stats.combo = 1;

    renderComponent({ stats, lastRating: 'perfect', lastDeviation: -30 });

    expect(screen.getByText('-30ms')).toBeInTheDocument();
  });

  it('shows playing hint when isPlaying is true', () => {
    renderComponent({ isPlaying: true });

    expect(screen.getByText('按 空格键 进行换气')).toBeInTheDocument();
  });

  it('hides playing hint when isPlaying is false', () => {
    renderComponent({ isPlaying: false });

    expect(screen.queryByText('按 空格键 进行换气')).not.toBeInTheDocument();
  });
});
