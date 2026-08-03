import { useState, useEffect } from 'react';
import { NotesService } from '@/services/database';

interface CachedUrl {
  url: string;
  expiresAt: number;
}

// In-memory cache for resolved signed URLs (50-minute TTL)
const signedUrlCache = new Map<string, CachedUrl>();
const CACHE_TTL_MS = 50 * 60 * 1000;

export function useResolvedFileUrl(fileUrl: string | null | undefined) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fileUrl) {
      setResolvedUrl(null);
      return;
    }

    if (fileUrl.includes('study_materials')) {
      const cached = signedUrlCache.get(fileUrl);
      if (cached && Date.now() < cached.expiresAt) {
        setResolvedUrl(cached.url);
        return;
      }

      let isMounted = true;
      setLoading(true);

      NotesService.getSignedUrl(fileUrl)
        .then(url => {
          if (url) {
            signedUrlCache.set(fileUrl, {
              url,
              expiresAt: Date.now() + CACHE_TTL_MS
            });
          }
          if (isMounted) {
            setResolvedUrl(url);
          }
        })
        .catch(err => {
          console.error('Failed to resolve signed URL:', err);
          if (isMounted) {
            setResolvedUrl(fileUrl);
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });

      return () => {
        isMounted = false;
      };
    } else {
      setResolvedUrl(fileUrl);
    }
  }, [fileUrl]);

  return { resolvedUrl, loading };
}
