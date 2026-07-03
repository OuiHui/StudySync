-- Alter the session_status enum to add running, paused, and finished if they don't exist
ALTER TYPE session_status ADD VALUE IF NOT EXISTS 'running';
ALTER TYPE session_status ADD VALUE IF NOT EXISTS 'paused';
ALTER TYPE session_status ADD VALUE IF NOT EXISTS 'finished';

-- Add timer features and metadata to study_sessions table
ALTER TABLE public.study_sessions 
  ADD COLUMN IF NOT EXISTS subject VARCHAR(100),
  ADD COLUMN IF NOT EXISTS target_duration INTEGER,
  ADD COLUMN IF NOT EXISTS pause_logs JSONB DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS timer_mode VARCHAR(20) DEFAULT 'work' NOT NULL,
  ADD COLUMN IF NOT EXISTS current_cycle INTEGER DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS reflection_rating INTEGER CHECK (reflection_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS reflection_notes TEXT;

-- Add role and status to session_participants table
ALTER TABLE public.session_participants
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'participant' NOT NULL,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' NOT NULL;
