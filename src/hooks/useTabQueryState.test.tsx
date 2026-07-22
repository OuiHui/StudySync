import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReactNode } from 'react';
import { useTabQueryState } from './useTabQueryState';

const createWrapper = (initialEntries = ['/']) => {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  );
};

describe('useTabQueryState', () => {
  it('returns defaultTab when query parameter is missing', () => {
    const { result } = renderHook(
      () => useTabQueryState<'my-groups' | 'browse'>('my-groups', ['my-groups', 'browse']),
      { wrapper: createWrapper(['/groups']) }
    );

    expect(result.current[0]).toBe('my-groups');
  });

  it('returns tab from query parameter if valid', () => {
    const { result } = renderHook(
      () => useTabQueryState<'my-groups' | 'browse'>('my-groups', ['my-groups', 'browse']),
      { wrapper: createWrapper(['/groups?tab=browse']) }
    );

    expect(result.current[0]).toBe('browse');
  });

  it('falls back to defaultTab if query parameter is invalid', () => {
    const { result } = renderHook(
      () => useTabQueryState<'my-groups' | 'browse'>('my-groups', ['my-groups', 'browse']),
      { wrapper: createWrapper(['/groups?tab=invalid-tab']) }
    );

    expect(result.current[0]).toBe('my-groups');
  });

  it('updates tab state when setActiveTab is invoked', () => {
    const { result } = renderHook(
      () => useTabQueryState<'my-groups' | 'browse'>('my-groups', ['my-groups', 'browse']),
      { wrapper: createWrapper(['/groups']) }
    );

    expect(result.current[0]).toBe('my-groups');

    act(() => {
      result.current[1]('browse');
    });

    expect(result.current[0]).toBe('browse');
  });
});
