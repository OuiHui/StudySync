-- Enable realtime publication for notifications and collaborative session tables
DO $$ BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sessions;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.session_participants;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.session_goals;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Set replica identity to full so that DELETE events carry all columns for client-side filter matching
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.study_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.session_participants REPLICA IDENTITY FULL;
ALTER TABLE public.session_goals REPLICA IDENTITY FULL;

-- Drop existing SELECT policies to prevent duplicate policy errors
DROP POLICY IF EXISTS "Users can read public group sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can read sessions they can see" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can read participants of sessions they can see" ON public.session_participants;

-- Recreate SELECT policy on study_sessions to allow group members and creators to read
CREATE POLICY "Users can read sessions they can see"
  ON public.study_sessions FOR SELECT
  USING (
    created_by = auth.uid() OR
    group_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.study_groups 
      WHERE study_groups.id = study_sessions.group_id 
      AND (
        study_groups.is_public = true OR
        EXISTS (
          SELECT 1 FROM public.group_members 
          WHERE group_members.group_id = study_groups.id 
          AND group_members.user_id = auth.uid()
        )
      )
    )
  );

-- Recreate SELECT policy on session_participants to allow group members and creators to read
CREATE POLICY "Users can read participants of sessions they can see"
  ON public.session_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.study_sessions 
      WHERE study_sessions.id = session_participants.session_id 
      AND (
        study_sessions.created_by = auth.uid() OR
        study_sessions.group_id IS NULL OR
        EXISTS (
          SELECT 1 FROM public.study_groups 
          WHERE study_groups.id = study_sessions.group_id 
          AND (
            study_groups.is_public = true OR
            EXISTS (
              SELECT 1 FROM public.group_members 
              WHERE group_members.group_id = study_groups.id 
              AND group_members.user_id = auth.uid()
            )
          )
        )
      )
    )
  );
