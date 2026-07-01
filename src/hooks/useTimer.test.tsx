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
});
