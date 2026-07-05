-- Add minutes_studied column to study_sessions table
ALTER TABLE public.study_sessions 
  ADD COLUMN IF NOT EXISTS minutes_studied INTEGER DEFAULT 0 NOT NULL;

-- Add minutes_studied column to session_participants table
ALTER TABLE public.session_participants 
  ADD COLUMN IF NOT EXISTS minutes_studied INTEGER DEFAULT 0 NOT NULL;
