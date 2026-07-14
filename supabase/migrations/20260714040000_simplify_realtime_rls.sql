-- Simplify SELECT policies to enable Supabase Realtime replication (which does not support joins/subqueries in RLS policies)

-- 1. study_sessions
DROP POLICY IF EXISTS "Users can read sessions they can see" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can read public group sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Realtime study_sessions select policy" ON public.study_sessions;
CREATE POLICY "Realtime study_sessions select policy" ON public.study_sessions
    FOR SELECT TO authenticated USING (true);

-- 2. session_participants
DROP POLICY IF EXISTS "Users can read participants of sessions they can see" ON public.session_participants;
DROP POLICY IF EXISTS "Users can read session participants" ON public.session_participants;
DROP POLICY IF EXISTS "Realtime session_participants select policy" ON public.session_participants;
CREATE POLICY "Realtime session_participants select policy" ON public.session_participants
    FOR SELECT TO authenticated USING (true);

-- 3. session_goals
DROP POLICY IF EXISTS "Users can read goals of sessions they can see" ON public.session_goals;
DROP POLICY IF EXISTS "Users can read session goals" ON public.session_goals;
DROP POLICY IF EXISTS "Realtime session_goals select policy" ON public.session_goals;
CREATE POLICY "Realtime session_goals select policy" ON public.session_goals
    FOR SELECT TO authenticated USING (true);

-- 4. notes
DROP POLICY IF EXISTS "Users can read notes they own or are collaborative" ON public.notes;
DROP POLICY IF EXISTS "Users can read notes" ON public.notes;
DROP POLICY IF EXISTS "Realtime notes select policy" ON public.notes;
CREATE POLICY "Realtime notes select policy" ON public.notes
    FOR SELECT TO authenticated 
    USING (
        auth.uid() = created_by 
        OR permission_level = 'public' 
        OR permission_level = 'group'
    );
