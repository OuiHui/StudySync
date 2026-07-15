import { useState, useEffect } from 'react';
import { NotesService } from '@/services/database';

export function useResolvedFileUrl(fileUrl: string | null | undefined) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fileUrl) {
      setResolvedUrl(null);
      return;
    }

    // Check if the URL contains 'study_materials'
    if (fileUrl.includes('study_materials')) {
      let isMounted = true;
      setLoading(true);
      
      NotesService.getSignedUrl(fileUrl)
        .then(url => {
          if (isMounted) {
            setResolvedUrl(url);
          }
        })
        .catch(err => {
          console.error('Failed to resolve signed URL:', err);
          if (isMounted) {
            setResolvedUrl(fileUrl); // fallback
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
