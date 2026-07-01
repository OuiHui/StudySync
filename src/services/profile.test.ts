import { describe, it, expect } from 'vitest';
import { ProfileService } from './profile';

describe('ProfileService', () => {
  describe('calculateStudyHours', () => {
    it('should return 0 for empty session list', () => {
      expect(ProfileService.calculateStudyHours([])).toBe(0);
    });

    it('should calculate hours from actual start and end times', () => {
      const sessions = [
        {
          actual_start: '2026-07-01T10:00:00.000Z',
          actual_end: '2026-07-01T12:30:00.000Z', // 2.5 hours
        },
        {
          actual_start: '2026-07-02T14:00:00.000Z',
          actual_end: '2026-07-02T15:15:00.000Z', // 1.25 hours
        }
      ];
      // Total minutes = 150 + 75 = 225. 225 / 60 = 3.75 hours -> Math.floor = 3
      expect(ProfileService.calculateStudyHours(sessions)).toBe(3);
    });

    it('should fallback to scheduled times if actual times are missing', () => {
      const sessions = [
        {
          scheduled_start: '2026-07-01T10:00:00.000Z',
          scheduled_end: '2026-07-01T12:00:00.000Z', // 2 hours
        }
      ];
      expect(ProfileService.calculateStudyHours(sessions)).toBe(2);
    });

    it('should handle zero or negative duration sessions gracefully', () => {
      const sessions = [
        {
          actual_start: '2026-07-01T12:00:00.000Z',
          actual_end: '2026-07-01T11:00:00.000Z', // Negative 1 hour
        }
      ];
      expect(ProfileService.calculateStudyHours(sessions)).toBe(0);
    });
  });

  describe('calculateStudyStreak', () => {
    it('should return 0 for empty session list', () => {
      expect(ProfileService.calculateStudyStreak([])).toBe(0);
    });

    it('should calculate correct streak when user studied today and yesterday', () => {
      const today = new Date().toISOString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      
      const sessions = [
        { created_at: today },
        { created_at: yesterday },
        { created_at: twoDaysAgo }
      ];

      expect(ProfileService.calculateStudyStreak(sessions)).toBe(3);
    });

    it('should calculate correct streak starting from yesterday if user did not study today', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      
      const sessions = [
        { created_at: yesterday },
        { created_at: twoDaysAgo },
        { created_at: threeDaysAgo }
      ];

      expect(ProfileService.calculateStudyStreak(sessions)).toBe(3);
    });

    it('should return 0 if user has not studied today or yesterday', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      
      const sessions = [
        { created_at: threeDaysAgo }
      ];

      expect(ProfileService.calculateStudyStreak(sessions)).toBe(0);
    });

    it('should handle multiple sessions on the same day as a single streak count', () => {
      const today = new Date().toISOString();
      const todayLater = new Date(Date.now() + 1000).toISOString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const sessions = [
        { created_at: today },
        { created_at: todayLater },
        { created_at: yesterday }
      ];

      expect(ProfileService.calculateStudyStreak(sessions)).toBe(2);
    });
  });

  describe('formatTimeAgo and parseTimeAgo', () => {
    it('should format and parse "Just now" correctly', () => {
      const nowStr = new Date().toISOString();
      const formatted = ProfileService.formatTimeAgo(nowStr);
      expect(formatted).toBe('Just now');
      expect(ProfileService.parseTimeAgo(formatted)).toBe(0);
    });

    it('should format minutes ago correctly', () => {
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const formatted = ProfileService.formatTimeAgo(tenMinsAgo);
      expect(formatted).toBe('10 minutes ago');
      expect(ProfileService.parseTimeAgo(formatted)).toBe(10 * 60);
    });

    it('should format hours ago correctly', () => {
      const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
      const formatted = ProfileService.formatTimeAgo(fiveHoursAgo);
      expect(formatted).toBe('5 hours ago');
      expect(ProfileService.parseTimeAgo(formatted)).toBe(5 * 3600);
    });

    it('should format days ago correctly', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const formatted = ProfileService.formatTimeAgo(threeDaysAgo);
      expect(formatted).toBe('3 days ago');
      expect(ProfileService.parseTimeAgo(formatted)).toBe(3 * 86400);
    });
  });
});
