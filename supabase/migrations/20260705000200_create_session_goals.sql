-- Create session_goals table to store checklist goals for study sessions
CREATE TABLE IF NOT EXISTS public.session_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.study_sessions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    progress INTEGER DEFAULT 0 NOT NULL,
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on session_goals
ALTER TABLE public.session_goals ENABLE ROW LEVEL SECURITY;

-- Select policy: all authenticated users who have access to study sessions can read goals
DROP POLICY IF EXISTS "Users can view goals of sessions they can see" ON public.session_goals;
CREATE POLICY "Users can view goals of sessions they can see" ON public.session_goals
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.study_sessions
            WHERE study_sessions.id = session_goals.session_id
        )
    );

-- Write policies: only the session host (creator of the session) can manage goals
DROP POLICY IF EXISTS "Session hosts can manage goals" ON public.session_goals;
CREATE POLICY "Session hosts can manage goals" ON public.session_goals
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.study_sessions
            WHERE study_sessions.id = session_goals.session_id
            AND study_sessions.created_by = auth.uid()
        )
    );

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_session_goals_session ON public.session_goals(session_id);

-- Add comments for documentation
COMMENT ON TABLE public.session_goals IS 'Checklist goals for collaborative study sessions';
