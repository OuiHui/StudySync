import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Auth } from './index';

const mockSignInWithGoogle = vi.fn();
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignInAnonymously = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    signIn: mockSignIn,
    signUp: mockSignUp,
    signInWithGoogle: mockSignInWithGoogle,
    signInAnonymously: mockSignInAnonymously,
    signOut: vi.fn(),
  }),
}));

describe('Auth Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Google sign-in button and triggers signInWithGoogle on click', async () => {
    mockSignInWithGoogle.mockResolvedValueOnce({ error: null });

    render(<Auth />);

    const googleBtn = screen.getByRole('button', { name: /continue with google/i });
    expect(googleBtn).toBeInTheDocument();

    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    });
  });

  it('displays error message if signInWithGoogle fails', async () => {
    mockSignInWithGoogle.mockResolvedValueOnce({ error: { message: 'Google OAuth error' } });

    render(<Auth />);

    const googleBtn = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(screen.getByText('Google OAuth error')).toBeInTheDocument();
    });
  });
});
