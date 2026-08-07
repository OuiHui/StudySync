import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthCallback } from './Callback';

const { mockExchangeCodeForSession, mockGetSession, mockGetAndClearStoredOAuthError } = vi.hoisted(() => ({
  mockExchangeCodeForSession: vi.fn(),
  mockGetSession: vi.fn(),
  mockGetAndClearStoredOAuthError: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
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
});
