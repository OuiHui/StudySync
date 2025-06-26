-- Fix RLS recursion in group_members with ultra-simple policies
-- This completely removes any circular dependencies

-- Drop ALL existing policies on group_members
DROP POLICY IF EXISTS "Users can read group_members for groups they are members of" ON group_members;
DROP POLICY IF EXISTS "Users can manage group_members for groups they admin" ON group_members;
DROP POLICY IF EXISTS "Users can join public groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups they are members of" ON group_members;
DROP POLICY IF EXISTS "Users can read their own group memberships" ON group_members;
DROP POLICY IF EXISTS "Users can read members of public groups" ON group_members;
DROP POLICY IF EXISTS "Group creators can manage group memberships" ON group_members;
DROP POLICY IF EXISTS "Users can read own memberships only" ON group_members;
DROP POLICY IF EXISTS "Users can insert own memberships only" ON group_members;
DROP POLICY IF EXISTS "Users can delete own memberships only" ON group_members;

-- Create ultra-simple policies that cannot cause recursion

-- 1. Users can only see their own memberships
CREATE POLICY "Own memberships only"
  ON group_members FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Users can only insert their own memberships
CREATE POLICY "Insert own membership"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Users can only delete their own memberships
CREATE POLICY "Delete own membership"
  ON group_members FOR DELETE
  USING (auth.uid() = user_id);

-- 4. No update policy - memberships are insert/delete only
-- (This prevents any potential update-based recursion)
