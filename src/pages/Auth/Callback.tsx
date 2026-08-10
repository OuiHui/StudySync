import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getAndClearStoredOAuthError } from '@/utils/oauthHandler';
import { Button } from '@/components/ui/button';

export interface ParsedOAuthCallback {
  accessToken: string | null;
  refreshToken: string | null;
  code: string | null;
  error: string | null;
  errorDescription: string | null;
}

export function parseOAuthCallbackUrl(): ParsedOAuthCallback {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null, code: null, error: null, errorDescription: null };
  }

  const href = window.location.href;
  const searchParams = new URLSearchParams(window.location.search);

  let hashStr = window.location.hash || '';
  if (hashStr.startsWith('#/auth/callback')) {
    hashStr = hashStr.substring('#/auth/callback'.length);
  }
  if (hashStr.startsWith('#')) {
    hashStr = hashStr.substring(1);
  }
  if (hashStr.startsWith('?')) {
    hashStr = hashStr.substring(1);
  }

  const hashParams = new URLSearchParams(hashStr);

  const getParam = (key: string): string | null => {
    const fromSearch = searchParams.get(key);
    if (fromSearch) return fromSearch;

    const fromHash = hashParams.get(key);
    if (fromHash) return fromHash;

    const regex = new RegExp(`[?&#]${key}=([^&#]*)`, 'i');
    const match = href.match(regex);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }

    return null;
  };

  return {
    accessToken: getParam('access_token'),
    refreshToken: getParam('refresh_token'),
    code: getParam('code'),
    error: getParam('error') || getParam('error_code'),
    errorDescription: getParam('error_description'),
  };
}

export function AuthCallback() {
  const [message, setMessage] = useState('Completing Google sign-in...');
  const [isError, setIsError] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const handledRef = useRef(false);

  const handleReturnToAuth = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = '#/auth';
    }
  };

  useEffect(() => {
    let timeoutId: number | undefined;
    let intervalId: number | undefined;
    let maxTimeoutId: number | undefined;
    let closed = false;

    const completeAuth = (successMsg: string) => {
      if (closed) return;
      setMessage(successMsg);
      setIsDone(true);
      setIsError(false);

      if (intervalId) window.clearInterval(intervalId);
      if (maxTimeoutId) window.clearTimeout(maxTimeoutId);

      timeoutId = window.setTimeout(() => {
        if (window.opener && !window.opener.closed) {
          try {
            window.close();
          } catch (e) {
            console.warn('Failed to close OAuth popup:', e);
          }
        } else if (typeof window !== 'undefined') {
          window.location.hash = '#/';
        }
      }, 300);
    };

    const finalize = async () => {
      if (handledRef.current) return;

      const storedOAuthError = getAndClearStoredOAuthError();
      if (storedOAuthError) {
        setMessage(storedOAuthError);
        setIsError(true);
        return;
      }

      const { accessToken, refreshToken, code, error, errorDescription } = parseOAuthCallbackUrl();

      if (error || errorDescription) {
        const errorMsg = errorDescription
          ? errorDescription.replace(/\+/g, ' ')
          : `Authentication error: ${error}`;
        setMessage(errorMsg);
        setIsError(true);
        return;
      }

      if (accessToken && refreshToken) {
        handledRef.current = true;
        try {
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!setSessionError && data.session) {
            completeAuth('Google sign-in completed. Redirecting...');
            return;
          }
        } catch (err) {
          console.error('Failed to set session from OAuth tokens:', err);
        }
      }

      if (code) {
        handledRef.current = true;
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (!exchangeError && data.session) {
            completeAuth('Google sign-in completed. Redirecting...');
            return;
          }
        } catch (err) {
          console.error('Failed to exchange code for session:', err);
        }
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          completeAuth('Google sign-in completed. Redirecting...');
          return;
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      }
    };

    finalize();

    intervalId = window.setInterval(async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          completeAuth('Google sign-in completed. Redirecting...');
        }
      } catch (e) {
        // ignore polling errors
      }
    }, 300);

    maxTimeoutId = window.setTimeout(() => {
      if (intervalId) window.clearInterval(intervalId);
      if (!isDone) {
        setIsError(true);
        setMessage('Sign-in took longer than expected or could not be completed.');
      }
    }, 6000);

    return () => {
      closed = true;
      if (intervalId) window.clearInterval(intervalId);
      if (timeoutId) window.clearTimeout(timeoutId);
      if (maxTimeoutId) window.clearTimeout(maxTimeoutId);
    };
  }, [isDone]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 text-center">
      <div className="max-w-sm space-y-4 rounded-xl border border-border bg-card p-6 shadow-lg">
        {!isError && !isDone && (
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        )}
        <h1 className="text-lg font-semibold text-foreground">Google sign-in</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        {isError && (
          <Button onClick={handleReturnToAuth} className="w-full mt-2" variant="outline">
            Return to Sign In
          </Button>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;