import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, OAuthResponse } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<OAuthResponse>;
  signInAnonymously: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Initial auth session check error:', error);
          // If the stored refresh token is invalid or revoked, clear the stale local session
          if (error.message?.includes('Refresh Token') || error.message?.includes('invalid_grant')) {
            try {
              await supabase.auth.signOut({ scope: 'local' });
            } catch (_) {}
          }
        } else if (session) {
          setSession(session);
          setUser(session.user);
        }
      } catch (err) {
        console.error('Error checking initial session:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || typeof window === 'undefined') return;

    if (window.opener && !window.opener.closed) {
      try {
        window.close();
      } catch (err) {
        console.warn('Failed to close Google OAuth popup:', err);
      }
    }
  }, [session]);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0].replace(/\/$/, '') : '';
    const redirectUrl = `${baseUrl}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signInAnonymously = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    return { error };
  };

  const signInWithGoogle = async () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0].replace(/\/$/, '') : '';
    const redirectUrl = `${baseUrl}/#/auth/callback`;
    const response = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });
    return response;
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('SignOut failed, clearing local session:', error);
    } finally {
      setSession(null);
      setUser(null);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInAnonymously,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}