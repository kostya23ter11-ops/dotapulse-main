import { RANK_TABS, getWinrateColor } from '../lib/constants';

describe('RANK_TABS', () => {
  it('contains expected rank tiers', () => {
    expect(RANK_TABS).toContain('all');
    expect(RANK_TABS).toContain('pro');
    expect(RANK_TABS).toContain(1);
    expect(RANK_TABS).toContain(8);
    expect(RANK_TABS).toHaveLength(10);
  });
});

describe('getWinrateColor', () => {
  it('returns green for winrate >= 53', () => {
    expect(getWinrateColor(53)).toBe('#4caf50');
    expect(getWinrateColor(55)).toBe('#4caf50');
    expect(getWinrateColor(60)).toBe('#4caf50');
  });

  it('returns yellow for winrate >= 50 but < 53', () => {
    expect(getWinrateColor(50)).toBe('#ffc107');
    expect(getWinrateColor(51)).toBe('#ffc107');
    expect(getWinrateColor(52.9)).toBe('#ffc107');
  });

  it('returns red for winrate < 50', () => {
    expect(getWinrateColor(49)).toBe('#ff4c4c');
    expect(getWinrateColor(40)).toBe('#ff4c4c');
    expect(getWinrateColor(0)).toBe('#ff4c4c');
  });

  it('handles edge cases', () => {
    expect(getWinrateColor(52.99)).toBe('#ffc107');
    expect(getWinrateColor(53.0)).toBe('#4caf50');
    expect(getWinrateColor(49.99)).toBe('#ff4c4c');
  });
});
