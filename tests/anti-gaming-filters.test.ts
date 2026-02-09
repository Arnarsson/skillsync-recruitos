import { describe, it, expect } from 'vitest';
import {
  isTutorialRepository,
  detectCommitBursts,
  applyQualityAdjustment,
  type QualitySignals,
} from '../lib/anti-gaming-filters';

describe('Anti-Gaming Filters', () => {
  describe('isTutorialRepository', () => {
    it('should detect tutorial repos by name', () => {
      expect(isTutorialRepository({
        name: 'react-tutorial',
        description: 'A simple app',
      })).toBe(true);

      expect(isTutorialRepository({
        name: 'learning-typescript',
        description: null,
      })).toBe(true);

      expect(isTutorialRepository({
        name: 'udemy-course-project',
        description: null,
      })).toBe(true);
    });

    it('should detect tutorial repos by description', () => {
      expect(isTutorialRepository({
        name: 'my-app',
        description: 'Following a tutorial from FreeCodeCamp',
      })).toBe(true);

      expect(isTutorialRepository({
        name: 'project-1',
        description: 'Practice exercises for bootcamp',
      })).toBe(true);
    });

    it('should detect boilerplate project names', () => {
      expect(isTutorialRepository({
        name: 'hello-world',
        description: null,
      })).toBe(true);

      expect(isTutorialRepository({
        name: 'test-repo',
        description: null,
      })).toBe(true);

      expect(isTutorialRepository({
        name: 'my-first-repo',
        description: null,
      })).toBe(true);
    });

    it('should detect test repos by size and stars', () => {
      expect(isTutorialRepository({
        name: 'test-deployment',
        description: null,
        size: 50,
        stargazers_count: 0,
      })).toBe(true);

      expect(isTutorialRepository({
        name: 'temp-project',
        description: null,
        size: 80,
        stargazers_count: 0,
      })).toBe(true);
    });

    it('should NOT flag legitimate projects', () => {
      expect(isTutorialRepository({
        name: 'awesome-framework',
        description: 'A production-ready framework',
        size: 5000,
        stargazers_count: 150,
      })).toBe(false);

      expect(isTutorialRepository({
        name: 'api-gateway',
        description: 'Enterprise API gateway',
        size: 10000,
        stargazers_count: 50,
      })).toBe(false);
    });

    it('should detect tutorial topics', () => {
      expect(isTutorialRepository({
        name: 'my-project',
        description: 'A web app',
        topics: ['tutorial', 'learning'],
      })).toBe(true);

      expect(isTutorialRepository({
        name: 'calculator',
        description: 'Simple calculator',
        topics: ['practice', 'education'],
      })).toBe(true);
    });
  });

  describe('detectCommitBursts', () => {
    it('should detect suspicious commit bursts', async () => {
      // Create events with many normal days (1-3 commits each) plus burst days
      // We need burst days to exceed 5x average AND >20 commits
      // With 20 normal days (~2 commits each = 40) + 2 burst days (200 each = 400)
      // Total = 440, days = 22, avg = 20. 5x avg = 100. 200 > 100 ✓ and > 20 ✓
      const events: Array<{ type: string; created_at: string; payload: { commits: object[] } }> = [];

      // 20 normal days with 1-3 commits each
      for (let day = 1; day <= 20; day++) {
        const dd = String(day).padStart(2, '0');
        events.push({
          type: 'PushEvent',
          created_at: `2024-01-${dd}T10:00:00Z`,
          payload: { commits: new Array(2).fill({}) },
        });
      }

      // 2 burst days with 200 commits each
      events.push({
        type: 'PushEvent',
        created_at: '2024-01-25T10:00:00Z',
        payload: { commits: new Array(200).fill({}) },
      });
      events.push({
        type: 'PushEvent',
        created_at: '2024-01-26T10:00:00Z',
        payload: { commits: new Array(200).fill({}) },
      });

      const result = await detectCommitBursts(events);
      expect(result.hasBursts).toBe(true);
      expect(result.burstDays).toBeGreaterThan(0);
      expect(result.details.length).toBeGreaterThan(0);
    });

    it('should NOT flag normal commit patterns', async () => {
      const events = [
        {
          type: 'PushEvent',
          created_at: '2024-01-15T10:00:00Z',
          payload: { commits: [{}, {}, {}] }, // 3 commits
        },
        {
          type: 'PushEvent',
          created_at: '2024-01-16T10:00:00Z',
          payload: { commits: [{}, {}] }, // 2 commits
        },
        {
          type: 'PushEvent',
          created_at: '2024-01-17T10:00:00Z',
          payload: { commits: [{}] }, // 1 commit
        },
      ];

      const result = await detectCommitBursts(events);
      expect(result.hasBursts).toBe(false);
    });

    it('should handle empty events', async () => {
      const result = await detectCommitBursts([]);
      expect(result.hasBursts).toBe(false);
      expect(result.burstDays).toBe(0);
      expect(result.details).toEqual([]);
    });
  });

  describe('applyQualityAdjustment', () => {
    it('should reduce score for low-quality profiles', () => {
      const lowQualitySignals: QualitySignals = {
        isTutorialRepo: true,
        forkRatio: 0.9,
        hasSustantiveContributions: false,
        hasCommitBursts: true,
        substantiveDiffScore: 20,
        reviewParticipation: 0,
        maintenanceScore: 10,
        issueDiscussionScore: 0,
        overallQualityScore: 25, // Low quality
        flags: ['Fork-heavy profile', 'Tutorial repos in top 10'],
      };

      const result = applyQualityAdjustment(80, lowQualitySignals);
      expect(result.adjustedScore).toBeLessThan(80);
      expect(result.adjustment).toBeLessThan(0);
    });

    it('should boost score for high-quality profiles', () => {
      const highQualitySignals: QualitySignals = {
        isTutorialRepo: false,
        forkRatio: 0.2,
        hasSustantiveContributions: true,
        hasCommitBursts: false,
        substantiveDiffScore: 90,
        reviewParticipation: 80,
        maintenanceScore: 85,
        issueDiscussionScore: 70,
        overallQualityScore: 95, // High quality
        flags: ['✓ High-quality profile', 'Active code reviewer'],
      };

      const result = applyQualityAdjustment(60, highQualitySignals);
      expect(result.adjustedScore).toBeGreaterThan(60);
      expect(result.adjustment).toBeGreaterThan(0);
    });

    it('should keep moderate quality profiles stable', () => {
      const moderateQualitySignals: QualitySignals = {
        isTutorialRepo: false,
        forkRatio: 0.4,
        hasSustantiveContributions: true,
        hasCommitBursts: false,
        substantiveDiffScore: 60,
        reviewParticipation: 40,
        maintenanceScore: 55,
        issueDiscussionScore: 35,
        overallQualityScore: 65, // Moderate quality
        flags: ['⚠ Moderate quality profile'],
      };

      const result = applyQualityAdjustment(70, moderateQualitySignals);
      expect(result.adjustedScore).toBeGreaterThanOrEqual(60);
      expect(result.adjustedScore).toBeLessThanOrEqual(80);
    });

    it('should not exceed score bounds', () => {
      const perfectSignals: QualitySignals = {
        isTutorialRepo: false,
        forkRatio: 0.0,
        hasSustantiveContributions: true,
        hasCommitBursts: false,
        substantiveDiffScore: 100,
        reviewParticipation: 100,
        maintenanceScore: 100,
        issueDiscussionScore: 100,
        overallQualityScore: 100,
        flags: ['✓ High-quality profile'],
      };

      const result = applyQualityAdjustment(95, perfectSignals);
      expect(result.adjustedScore).toBeLessThanOrEqual(99);
    });
  });
});
