-- Fix RLS recursion issues in group_members and related tables
-- This migration addresses infinite recursion errors in Row Level Security policies

-- First, drop ALL existing policies on group_members to start fresh
DROP POLICY IF EXISTS "Users can read group_members for groups they are members of" ON group_members;
DROP POLICY IF EXISTS "Users can manage group_members for groups they admin" ON group_members;
DROP POLICY IF EXISTS "Users can join public groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups they are members of" ON group_members;
DROP POLICY IF EXISTS "Users can read their own group memberships" ON group_members;
DROP POLICY IF EXISTS "Users can read members of public groups" ON group_members;
DROP POLICY IF EXISTS "Group creators can manage group memberships" ON group_members;

-- Disable RLS temporarily to avoid issues during policy creation
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;

-- Create completely non-recursive policies for group_members

-- 1. Simple policy: Users can read their own memberships only
CREATE POLICY "Users can read own memberships only"
  ON group_members FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Simple policy: Users can insert their own memberships only  
CREATE POLICY "Users can insert own memberships only"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Simple policy: Users can delete their own memberships only
CREATE POLICY "Users can delete own memberships only"
  ON group_members FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Simple policy: No updates allowed (memberships are insert/delete only)
-- (We'll handle role changes through delete + insert)

-- Re-enable RLS with the new simple policies
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Fix study_sessions policies to prevent recursion in session management

-- Drop existing problematic session policies
DROP POLICY IF EXISTS "Users can read sessions they participate in" ON study_sessions;
DROP POLICY IF EXISTS "Users can manage sessions they created" ON study_sessions;

-- Create improved session policies
CREATE POLICY "Users can read sessions they created"
  ON study_sessions FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can read public group sessions"
  ON study_sessions FOR SELECT
  USING (
    group_id IS NULL OR
    EXISTS (
      SELECT 1 FROM study_groups 
      WHERE study_groups.id = study_sessions.group_id 
      AND study_groups.is_public = true
    )
  );

CREATE POLICY "Users can manage sessions they created"
  ON study_sessions FOR ALL
  USING (auth.uid() = created_by);

-- Fix session_participants policies to prevent recursion

-- Drop existing problematic participant policies
DROP POLICY IF EXISTS "Users can read session participants" ON session_participants;
DROP POLICY IF EXISTS "Users can manage their own participation" ON session_participants;

-- Create improved participant policies
CREATE POLICY "Users can read participants of sessions they can see"
  ON session_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM study_sessions 
      WHERE study_sessions.id = session_participants.session_id 
      AND (
        study_sessions.created_by = auth.uid() OR
        study_sessions.group_id IS NULL OR
        EXISTS (
          SELECT 1 FROM study_groups 
          WHERE study_groups.id = study_sessions.group_id 
          AND study_groups.is_public = true
        )
      )
    )
  );

CREATE POLICY "Users can manage their own session participation"
  ON session_participants FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Session creators can manage all participants"
  ON session_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM study_sessions 
      WHERE study_sessions.id = session_participants.session_id 
      AND study_sessions.created_by = auth.uid()
    )
  );

-- Ensure profiles table has proper policies
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Ensure study_groups table has proper policies
DROP POLICY IF EXISTS "Anyone can read public groups" ON study_groups;
CREATE POLICY "Anyone can read public groups"
  ON study_groups FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "Users can read groups they created" ON study_groups;
CREATE POLICY "Users can read groups they created"
  ON study_groups FOR SELECT
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can manage groups they created" ON study_groups;
CREATE POLICY "Users can manage groups they created"
  ON study_groups FOR ALL
  USING (auth.uid() = created_by);

-- Add helpful indexes to improve performance
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_group_members_user_id') THEN
        CREATE INDEX idx_group_members_user_id ON group_members(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_group_members_group_id') THEN
        CREATE INDEX idx_group_members_group_id ON group_members(group_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_study_sessions_created_by') THEN
        CREATE INDEX idx_study_sessions_created_by ON study_sessions(created_by);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_study_sessions_group_id') THEN
        CREATE INDEX idx_study_sessions_group_id ON study_sessions(group_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_session_participants_user_id') THEN
        CREATE INDEX idx_session_participants_user_id ON session_participants(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_session_participants_session_id') THEN
        CREATE INDEX idx_session_participants_session_id ON session_participants(session_id);
    END IF;
END $$;
