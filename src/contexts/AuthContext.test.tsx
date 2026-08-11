import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInAnonymously: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides signInWithGoogle function that calls supabase.auth.signInWithOAuth', async () => {
    const mockSignInWithOAuth = vi.mocked(supabase.auth.signInWithOAuth);
    mockSignInWithOAuth.mockResolvedValueOnce({ data: { provider: 'google', url: 'https://accounts.google.com' }, error: null });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    let res: any;
    await act(async () => {
      res = await result.current.signInWithGoogle();
    });

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: `${window.location.href.split('#')[0].replace(/\/$/, '')}/#/auth/callback`,
        skipBrowserRedirect: true,
      },
    });
    expect(res.data?.url).toBe('https://accounts.google.com');
    expect(res.error).toBeNull();
  });

  it('handles signInWithGoogle error gracefully', async () => {
    const mockError = { message: 'OAuth configuration error' };
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
      data: { provider: 'google', url: null },
      error: mockError,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    let res: any;
    await act(async () => {
      res = await result.current.signInWithGoogle();
    });

    expect(res.error).toEqual(mockError);
  });

  it('clears local session if getSession returns an invalid refresh token error on init', async () => {
    const mockSignOut = vi.mocked(supabase.auth.signOut);
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: { name: 'AuthApiError', message: 'Invalid Refresh Token: Refresh Token Not Found', status: 400 },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
  });
});
