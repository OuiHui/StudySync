import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthCallback, parseOAuthCallbackUrl } from './Callback';

const { mockExchangeCodeForSession, mockSetSession, mockGetSession, mockGetAndClearStoredOAuthError } = vi.hoisted(() => ({
  mockExchangeCodeForSession: vi.fn(),
  mockSetSession: vi.fn(),
  mockGetSession: vi.fn(),
  mockGetAndClearStoredOAuthError: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
      setSession: mockSetSession,
      getSession: mockGetSession,
    },
  },
}));

vi.mock('@/utils/oauthHandler', () => ({
  getAndClearStoredOAuthError: mockGetAndClearStoredOAuthError,
}));

describe('AuthCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAndClearStoredOAuthError.mockReturnValue(null);
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        },
      },
      error: null,
    });
    mockExchangeCodeForSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        },
      },
      error: null,
    });

    window.history.pushState({}, '', '/#/auth/callback?code=test-code');
    vi.spyOn(window, 'close').mockImplementation(() => undefined);
  });

  it('exchanges the oauth code and closes the popup', async () => {
    render(<AuthCallback />);

    await waitFor(() => {
      expect(mockExchangeCodeForSession).toHaveBeenCalledWith('test-code');
    });

    expect(screen.getByText(/Google sign-in completed/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(window.close).toHaveBeenCalled();
    });
  });

  it('handles implicit access_token and refresh_token in url', async () => {
    window.history.pushState({}, '', '/#/auth/callback#access_token=token-123&refresh_token=refresh-123');
    render(<AuthCallback />);

    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalledWith({
        access_token: 'token-123',
        refresh_token: 'refresh-123',
      });
    });

    expect(screen.getByText(/Google sign-in completed/i)).toBeInTheDocument();
  });

  it('parses oauth callback url with various parameter formats correctly', () => {
    window.history.pushState({}, '', '/#/auth/callback#access_token=abc&refresh_token=xyz');
    const parsed = parseOAuthCallbackUrl();
    expect(parsed.accessToken).toBe('abc');
    expect(parsed.refreshToken).toBe('xyz');
  });
});
