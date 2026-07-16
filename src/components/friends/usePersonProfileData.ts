import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FriendEntry } from './types';

export interface SessionEntry {
  id: string;
  title: string;
  description: string;
  scheduled_start: string;
  scheduled_end: string;
  subject: string;
  status: string;
  group_name: string;
}

export const usePersonProfileData = (
  personId: string | undefined,
  open: boolean,
  view: 'profile' | 'friends',
  currentUserId: string
) => {
  const [friendsPreviews, setFriendsPreviews] = useState<FriendEntry[]>([]);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    setFriendsPreviews([]);
    setSessions([]);
  }, [personId, open]);

  useEffect(() => {
    if (!personId || !open || view !== 'profile') return;

    let active = true;

    // Fetch friends preview
    supabase
      .rpc('get_user_friends', {
        target_user_id: personId,
        current_user_id: currentUserId,
      })
      .then(({ data, error }) => {
        if (active && !error && data) {
          setFriendsPreviews(((data as FriendEntry[]) || []).slice(0, 5));
        }
      })
      .catch(() => {});

    // Fetch sessions
    setLoadingSessions(true);
    supabase
      .rpc('get_user_public_sessions', {
        target_user_id: personId,
      })
      .then(({ data, error }) => {
        if (active && !error && data) {
          setSessions(data as SessionEntry[]);
        }
      })
      .catch((err) => console.error('Error fetching public sessions:', err))
      .finally(() => {
        if (active) setLoadingSessions(false);
      });

    return () => {
      active = false;
    };
  }, [personId, open, view, currentUserId]);

  return {
    friendsPreviews,
    sessions,
    loadingSessions,
  };
};
