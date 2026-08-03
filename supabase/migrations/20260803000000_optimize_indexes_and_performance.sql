-- Migration: Optimize Database Indexes for RLS Functions and High-Volume Queries
-- Adds composite indexes on group_members and notes created_by to accelerate RLS evaluation and lookup queries.

-- 1. Composite indexes on group_members for RLS check functions (note_shared_with_user_groups, is_group_member)
CREATE INDEX IF NOT EXISTS idx_group_members_group_user 
ON public.group_members (group_id, user_id);

CREATE INDEX IF NOT EXISTS idx_group_members_user_group 
ON public.group_members (user_id, group_id);

-- 2. Single column index on notes created_by for fast author lookups
CREATE INDEX IF NOT EXISTS idx_notes_created_by 
ON public.notes (created_by);

-- 3. Composite index on session_participants for active session presence lookups
CREATE INDEX IF NOT EXISTS idx_session_participants_session_user 
ON public.session_participants (session_id, user_id);
