import { describe, it, expect } from 'vitest';
import {
  PILLAR_WEIGHTS,
  PILLAR_NAMES,
  READINESS_LEVELS,
  getReadinessLevel,
} from '../../../services/jobReadiness/types';

describe('jobReadiness/types', () => {
  it('pillar weights sum to 1.0', () => {
    const sum = Object.values(PILLAR_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('has all 7 pillars defined', () => {
    expect(Object.keys(PILLAR_WEIGHTS)).toHaveLength(7);
  });

  it('all weights are between 0 and 1', () => {
    for (const [, weight] of Object.entries(PILLAR_WEIGHTS)) {
      expect(weight).toBeGreaterThan(0);
      expect(weight).toBeLessThanOrEqual(1);
    }
  });

  it('PILLAR_NAMES matches PILLAR_WEIGHTS keys', () => {
    expect([...PILLAR_NAMES].sort()).toEqual(Object.keys(PILLAR_WEIGHTS).sort());
  });

  it('getReadinessLevel returns correct levels', () => {
    expect(getReadinessLevel(80)).toBe('hot');
    expect(getReadinessLevel(75)).toBe('hot');
    expect(getReadinessLevel(60)).toBe('warm');
    expect(getReadinessLevel(50)).toBe('warm');
    expect(getReadinessLevel(30)).toBe('warming');
    expect(getReadinessLevel(25)).toBe('warming');
    expect(getReadinessLevel(10)).toBe('cold');
    expect(getReadinessLevel(0)).toBe('cold');
  });
});
