-- Ensure notes table has replica identity full for real-time DELETE matching
ALTER TABLE public.notes REPLICA IDENTITY FULL;

-- Adjust session_goals write policy to allow all session participants
DROP POLICY IF EXISTS "Session hosts can manage goals" ON public.session_goals;

CREATE POLICY "Session participants can manage goals" ON public.session_goals
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.study_sessions
            WHERE study_sessions.id = session_goals.session_id
            AND (
                study_sessions.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.session_participants
                    WHERE session_participants.session_id = study_sessions.id
                    AND session_participants.user_id = auth.uid()
                    AND session_participants.status = 'active'
                )
            )
        )
    );

-- Add delete policy on notes table to allow owners and hosts to delete notes
DROP POLICY IF EXISTS "Users can delete notes they own or host" ON public.notes;
CREATE POLICY "Users can delete notes they own or host" ON public.notes
    FOR DELETE TO authenticated
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM public.study_sessions
            WHERE study_sessions.id::text = notes.session_id::text
            AND study_sessions.created_by = auth.uid()
        )
    );
