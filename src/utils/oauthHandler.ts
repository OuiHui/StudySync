export interface OAuthErrorResult {
  error: string;
  description: string | null;
  userFriendlyMessage: string;
}

const OAUTH_ERROR_STORAGE_KEY = 'studysync_oauth_error';

export function checkForOAuthError(): OAuthErrorResult | null {
  if (typeof window === 'undefined') return null;

  const searchParams = new URLSearchParams(window.location.search);
  let errorCode = searchParams.get('error') || searchParams.get('error_code');
  let errorDesc = searchParams.get('error_description');

  if (!errorCode && !errorDesc && window.location.hash) {
    const hashStr = window.location.hash.replace(/^#\/?/, '');
    if (hashStr.includes('error=')) {
      const queryPart = hashStr.includes('?') ? hashStr.split('?')[1] : hashStr;
      const hashParams = new URLSearchParams(queryPart);
      errorCode = hashParams.get('error') || hashParams.get('error_code');
      errorDesc = hashParams.get('error_description');
    }
  }

  if (!errorCode && !errorDesc) {
    return null;
  }

  let userFriendlyMessage = 'Authentication failed. Please try again.';
  if (
    errorCode === 'access_denied' ||
    errorDesc?.toLowerCase().includes('denied') ||
    errorDesc?.toLowerCase().includes('cancel')
  ) {
    userFriendlyMessage = 'Google sign-in was cancelled or access was denied.';
  } else if (errorDesc) {
    userFriendlyMessage = errorDesc.replace(/\+/g, ' ');
  } else if (errorCode) {
    userFriendlyMessage = `Authentication error: ${errorCode}`;
  }

  return {
    error: errorCode || 'unknown_error',
    description: errorDesc,
    userFriendlyMessage,
  };
}

export function handleOAuthErrorRedirect(): string | null {
  const oauthError = checkForOAuthError();
  if (!oauthError) return null;

  try {
    sessionStorage.setItem(OAUTH_ERROR_STORAGE_KEY, oauthError.userFriendlyMessage);
  } catch (e) {
    console.warn('Failed to store OAuth error in sessionStorage:', e);
  }

  if (typeof window !== 'undefined') {
    const cleanUrl = `${window.location.origin}${window.location.pathname}#/auth`;
    window.history.replaceState(null, '', cleanUrl);
  }

  return oauthError.userFriendlyMessage;
}

export function getAndClearStoredOAuthError(): string | null {
  try {
    const stored = sessionStorage.getItem(OAUTH_ERROR_STORAGE_KEY);
    if (stored) {
      sessionStorage.removeItem(OAUTH_ERROR_STORAGE_KEY);
      return stored;
    }
  } catch (e) {
    console.warn('Failed to read OAuth error from sessionStorage:', e);
  }

  return null;
}
