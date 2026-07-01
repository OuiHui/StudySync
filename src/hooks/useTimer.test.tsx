import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from './useTimer';

describe('useTimer hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should initialize with default work duration of 25 minutes', () => {
    const { result } = renderHook(() => useTimer({}));
    expect(result.current.workDuration).toBe(25 * 60);
    expect(result.current.timeLeft).toBe(25 * 60);
    expect(result.current.isActive).toBe(false);
  });

  it('should toggle active state', () => {
    const { result } = renderHook(() => useTimer({}));
    
    act(() => {
      result.current.toggleTimer();
    });
    expect(result.current.isActive).toBe(true);

    act(() => {
      result.current.toggleTimer();
    });
    expect(result.current.isActive).toBe(false);
  });

  it('should count down when active', () => {
    const { result } = renderHook(() => useTimer({}));
    
    act(() => {
      result.current.toggleTimer();
    });
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    expect(result.current.timeLeft).toBe(25 * 60 - 2);
  });

  it('should reset timer to initial work duration', () => {
    const { result } = renderHook(() => useTimer({}));
    
    act(() => {
      result.current.toggleTimer();
    });
    
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    expect(result.current.timeLeft).toBe(25 * 60 - 5);

    act(() => {
      result.current.resetTimer();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.timeLeft).toBe(25 * 60);
  });

  it('should transition from work to short break on completion', () => {
    const { result } = renderHook(() => useTimer({}));

    act(() => {
      result.current.toggleTimer();
    });

    act(() => {
      vi.advanceTimersByTime((25 * 60 - 1) * 1000);
    });
    expect(result.current.timeLeft).toBe(1);
    expect(result.current.mode).toBe('work');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.mode).toBe('break');
    expect(result.current.timeLeft).toBe(5 * 60);
    expect(result.current.isActive).toBe(false);
    expect(result.current.sessions).toBe(1);
  });

  it('should transition to long break after 4 work sessions', () => {
    const { result } = renderHook(() => useTimer({}));

    for (let i = 0; i < 4; i++) {
      act(() => {
        result.current.toggleTimer();
      });
      act(() => {
        vi.advanceTimersByTime(result.current.timeLeft * 1000);
      });
      
      if (i < 3) {
        expect(result.current.mode).toBe('break');
        act(() => {
          result.current.toggleTimer();
        });
        act(() => {
          vi.advanceTimersByTime(result.current.timeLeft * 1000);
        });
        expect(result.current.mode).toBe('work');
      }
    }

    expect(result.current.sessions).toBe(4);
    expect(result.current.mode).toBe('break');
    expect(result.current.timeLeft).toBe(15 * 60);
  });

  it('should transition from break to work on completion', () => {
    const { result } = renderHook(() => useTimer({}));

    act(() => {
      result.current.toggleTimer();
    });
    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000);
    });
    expect(result.current.mode).toBe('break');

    act(() => {
      result.current.toggleTimer();
    });
    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(result.current.mode).toBe('work');
    expect(result.current.timeLeft).toBe(25 * 60);
  });
});
