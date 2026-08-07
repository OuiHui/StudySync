import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getAndClearStoredOAuthError } from '@/utils/oauthHandler';

function getOAuthCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  const searchParams = new URLSearchParams(window.location.search);
  const searchCode = searchParams.get('code');
  if (searchCode) return searchCode;

  const hash = window.location.hash;
  if (!hash || !hash.includes('?')) return null;

  const hashQuery = hash.slice(hash.indexOf('?') + 1);
  const hashParams = new URLSearchParams(hashQuery);
  return hashParams.get('code');
}

export function AuthCallback() {
  const [message, setMessage] = useState('Completing Google sign-in...');

  useEffect(() => {
    let timeoutId: number | undefined;
    let closed = false;
    let intervalId: number | undefined;

    const finalize = async () => {
      const oauthError = getAndClearStoredOAuthError();
      if (oauthError) {
        setMessage(oauthError);
        return;
      }

      const code = getOAuthCodeFromUrl();
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          throw error;
        }

        if (data.session) {
          setMessage('Google sign-in completed. You can close this window.');
          timeoutId = window.setTimeout(() => {
            if (closed) return;
            window.close();
          }, 200);
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setMessage('Google sign-in completed. You can close this window.');
        timeoutId = window.setTimeout(() => {
          if (closed) return;
          window.close();
        }, 200);
        return;
      }

      setMessage('Finishing sign-in...');
    };

    finalize().catch((err) => {
      console.error('Failed to finalize Google sign-in:', err);
      setMessage('Google sign-in could not be completed.');
    });

    intervalId = window.setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        if (intervalId) window.clearInterval(intervalId);
        if (timeoutId) window.clearTimeout(timeoutId);
        closed = true;
        try {
          window.close();
        } catch (err) {
          console.warn('Failed to close Google OAuth callback window:', err);
        }
      }
    }, 300);

    return () => {
      closed = true;
      if (intervalId) window.clearInterval(intervalId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 text-center">
      <div className="max-w-sm space-y-3 rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <h1 className="text-lg font-semibold text-foreground">Google sign-in</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export default AuthCallback;