# Authentication & OAuth Architecture

## Overview

StudySync handles user authentication using [Supabase Auth](https://supabase.com/docs/guides/auth). The application state and authentication methods are exposed globally via `AuthContext` (`src/contexts/AuthContext.tsx`).

## Supported Authentication Methods

1. **Email & Password**: Standard registration and sign-in.
2. **Anonymous Guest**: Temporary guest sessions (`signInAnonymously`).
3. **Google OAuth**: Third-party OAuth 2.0 single sign-on with Google (`signInWithGoogle`).

---

## Google OAuth Architecture

Google OAuth is initiated via Supabase's `signInWithOAuth` client function:

```typescript
const signInWithGoogle = async () => {
  const redirectUrl = `${window.location.origin}/`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });
  return { error };
};
```

When a user clicks "Continue with Google":
1. `supabase.auth.signInWithOAuth` redirects the browser to Google's OAuth 2.0 authorization screen.
2. After successful authentication, Google redirects back to Supabase's OAuth callback handler (`https://<project-ref>.supabase.co/auth/v1/callback`).
3. Supabase issues session tokens and redirects back to the StudySync app (`redirectTo` URL).
4. `supabase.auth.onAuthStateChange` in `AuthContext` detects the signed-in session and updates the user state across the app.
