import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  checkForOAuthError,
  handleOAuthErrorRedirect,
  getAndClearStoredOAuthError,
} from './oauthHandler';

describe('OAuth Handler Utility', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  function setMockUrl(url: string) {
    const parsed = new URL(url);
    delete (window as any).location;
    window.location = {
      href: parsed.href,
      origin: parsed.origin,
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash,
    } as any;
  }

  it('returns null when URL contains no OAuth error', () => {
    setMockUrl('http://localhost:8080/#/auth');
    expect(checkForOAuthError()).toBeNull();
  });

  it('detects access_denied in query params', () => {
    setMockUrl('http://localhost:8080/?error=access_denied&error_description=User+cancelled#error=access_denied&sb=');
    const result = checkForOAuthError();
    expect(result).not.toBeNull();
    expect(result?.userFriendlyMessage).toBe('Google sign-in was cancelled or access was denied.');
  });

  it('detects OAuth error in hash params', () => {
    setMockUrl('http://localhost:8080/#error=access_denied&error_code=400');
    const result = checkForOAuthError();
    expect(result).not.toBeNull();
    expect(result?.userFriendlyMessage).toBe('Google sign-in was cancelled or access was denied.');
  });

  it('handles custom error descriptions', () => {
    setMockUrl('http://localhost:8080/?error=server_error&error_description=OAuth+provider+unavailable');
    const result = checkForOAuthError();
    expect(result?.userFriendlyMessage).toBe('OAuth provider unavailable');
  });

  it('cleans URL and stores error message in sessionStorage', () => {
    setMockUrl('http://localhost:8080/?error=access_denied&error_description=#error=access_denied&sb=');
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});

    const msg = handleOAuthErrorRedirect();
    expect(msg).toBe('Google sign-in was cancelled or access was denied.');
    expect(replaceStateSpy).toHaveBeenCalledWith(null, '', 'http://localhost:8080/#/auth');
    expect(getAndClearStoredOAuthError()).toBe('Google sign-in was cancelled or access was denied.');
    expect(getAndClearStoredOAuthError()).toBeNull();
  });
});
