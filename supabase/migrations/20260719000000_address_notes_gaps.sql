-- Migration: Address Notes Gaps & Legacy Columns
-- 1. Helper function to check if auth.uid() is friends with note creator
CREATE OR REPLACE FUNCTION public.note_shared_with_friends(p_creator_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.friendships f
        WHERE (
            (f.user_id = auth.uid() AND f.friend_id = p_creator_id)
            OR (f.friend_id = auth.uid() AND f.user_id = p_creator_id)
        )
        AND f.status = 'accepted'
    );
$$;

GRANT EXECUTE ON FUNCTION public.note_shared_with_friends(UUID) TO authenticated;

-- 2. Update SELECT RLS policy on notes to enforce 'friends' permission level
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can view notes" ON public.notes;

CREATE POLICY "Users can view notes" ON public.notes
    FOR SELECT TO authenticated
    USING (
        auth.uid() = created_by
        OR public.note_shared_with_user_groups(id)
        OR permission_level = 'public'
        OR (permission_level = 'friends' AND public.note_shared_with_friends(created_by))
    );

-- 3. Migrate legacy group_id entries to note_group_shares, then drop legacy column
INSERT INTO public.note_group_shares (note_id, group_id)
SELECT id, group_id FROM public.notes
WHERE group_id IS NOT NULL
ON CONFLICT (note_id, group_id) DO NOTHING;

ALTER TABLE public.notes DROP COLUMN IF EXISTS group_id;

-- 4. Enforce referential integrity for session_id -> study_sessions(id)
-- Drop policy depending on session_id column before altering type
DROP POLICY IF EXISTS "Users can delete notes they own or host" ON public.notes;

ALTER TABLE public.notes 
  ALTER COLUMN session_id TYPE UUID USING (
    CASE 
      WHEN session_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
      THEN session_id::text::uuid 
      ELSE NULL 
    END
  );

ALTER TABLE public.notes
  DROP CONSTRAINT IF EXISTS notes_session_id_fkey;

ALTER TABLE public.notes
  ADD CONSTRAINT notes_session_id_fkey
  FOREIGN KEY (session_id)
  REFERENCES public.study_sessions(id)
  ON DELETE SET NULL;

-- Re-create delete policy for notes using typed UUID comparison
CREATE POLICY "Users can delete notes they own or host" ON public.notes
    FOR DELETE TO authenticated
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM public.study_sessions
            WHERE study_sessions.id = notes.session_id
            AND study_sessions.created_by = auth.uid()
        )
    );
