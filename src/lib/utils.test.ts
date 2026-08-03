import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatSidebarTimestamp } from './utils';

describe('formatSidebarTimestamp', () => {
  beforeEach(() => {
    // Mock system time to 2026-08-03 (Monday) 12:00 PM
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 3, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty string for null, undefined, or invalid dates', () => {
    expect(formatSidebarTimestamp(null)).toBe('');
    expect(formatSidebarTimestamp(undefined)).toBe('');
    expect(formatSidebarTimestamp('invalid-date')).toBe('');
  });

  it('formats today timestamps as time (e.g. 10:45 AM)', () => {
    const todayMorning = new Date(2026, 7, 3, 10, 45, 0);
    expect(formatSidebarTimestamp(todayMorning)).toBe('10:45 AM');
  });

  it('formats yesterday timestamps as "Yesterday"', () => {
    const yesterdayEvening = new Date(2026, 7, 2, 20, 15, 0);
    expect(formatSidebarTimestamp(yesterdayEvening)).toBe('Yesterday');
  });

  it('formats timestamps from 2 to 6 days ago as day of week', () => {
    // Friday Jul 31, 2026 (3 days ago from Monday Aug 3)
    const Friday = new Date(2026, 6, 31, 14, 0, 0);
    expect(formatSidebarTimestamp(Friday)).toBe('Friday');
  });

  it('formats timestamps older than 6 days as short date', () => {
    // July 20, 2026 (14 days ago)
    const oldDate = new Date(2026, 6, 20, 9, 30, 0);
    expect(formatSidebarTimestamp(oldDate)).toBe('7/20/26');
  });
});
