-- Migration: Add Indexes for Notes, Group Shares, and Custom Subjects Data Access Optimization
-- Accelerates list queries, group shares lookups, and RLS evaluation performance.

-- 1. Index on notes for sorting and session lookups
CREATE INDEX IF NOT EXISTS idx_notes_updated_at 
ON public.notes (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_notes_session_id 
ON public.notes (session_id) 
WHERE session_id IS NOT NULL;

-- 2. Composite indexes on note_group_shares for bidirectional lookups
CREATE INDEX IF NOT EXISTS idx_note_group_shares_note_group 
ON public.note_group_shares (note_id, group_id);

CREATE INDEX IF NOT EXISTS idx_note_group_shares_group_note 
ON public.note_group_shares (group_id, note_id);

-- 3. Index on custom_subjects for user subject lookups
CREATE INDEX IF NOT EXISTS idx_custom_subjects_creator_name 
ON public.custom_subjects (created_by, name);
