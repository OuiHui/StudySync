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
  const redirectUrl = `${window.location.origin}/#/auth/callback`;
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
3. Supabase issues session tokens and redirects back to the StudySync app (`redirectTo` URL), which now points to the dedicated `#/auth/callback` route.
4. The callback page (`src/pages/Auth/Callback.tsx`) extracts `access_token` / `refresh_token` (Implicit Flow) or `code` (PKCE Flow) via `parseOAuthCallbackUrl()` across HashRouter query and fragment formats.
5. It invokes `supabase.auth.setSession({ access_token, refresh_token })` or `supabase.auth.exchangeCodeForSession(code)` to persist the session in Supabase client storage, triggering `supabase.auth.onAuthStateChange` across windows.
6. If in a popup, `AuthCallback` closes the popup; if full-page, it redirects to `#/`. A 6-second timeout safeguard prevents hanging screens by surfacing a clear retry button ("Return to Sign In") if authentication stalls.

---

## OAuth Error & Cancellation Handling (`HashRouter` Compatibility)

When using `HashRouter` (`react-router-dom`), OAuth provider cancellation or denial returns error parameters in search/hash fragments (e.g. `?error=access_denied&error_description=#error=access_denied&sb=`). Without intercepting these parameters, `HashRouter` interprets `#error=...` as a path name, causing a fallback to the `NotFound` page (404).

To address this:
- **`src/utils/oauthHandler.ts`**: Helper functions (`checkForOAuthError`, `handleOAuthErrorRedirect`, `getAndClearStoredOAuthError`) parse error params from `window.location.search` and `window.location.hash`.
- **Pre-Router Interception**: `handleOAuthErrorRedirect()` runs at top level in `App.tsx` prior to router mounting. It cleans up the URL hash to `/#/auth` via `window.history.replaceState` and stores a user-friendly error message ("Google sign-in was cancelled or access was denied.") in `sessionStorage`.
- **UI Error Display**: The `Auth` page retrieves the error message on mount and displays a prominent error alert banner.

---

## Stale Refresh Token Recovery

When a user's local session in `localStorage` (`sb-<project-ref>-auth-token`) contains a refresh token that has been invalidated, expired, or deleted on the Supabase backend (e.g. after database resets, user deletions, or session revocation), Supabase Auth returns:
`400 Bad Request - AuthApiError: Invalid Refresh Token: Refresh Token Not Found`

To handle this gracefully:
- **`AuthContext` (`src/contexts/AuthContext.tsx`)**: Inspects errors during `supabase.auth.getSession()` on app startup. If an invalid or revoked refresh token is detected, it automatically executes `supabase.auth.signOut({ scope: 'local' })` to purge the corrupted local storage session.
- **Developer Resolution**: Clearing browser `localStorage` (or DevTools > Application > Storage > Local Storage) removes any residual stale tokens.
