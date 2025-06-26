-- Temporarily disable RLS on group_members to resolve infinite recursion
-- This is a temporary solution while we debug the RLS policies

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
DROP POLICY IF EXISTS "Own memberships only" ON group_members;
DROP POLICY IF EXISTS "Insert own membership" ON group_members;
DROP POLICY IF EXISTS "Delete own membership" ON group_members;

-- Completely disable RLS on group_members table
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;

-- Note: This temporarily allows all authenticated users to read/write group_members
-- We'll re-enable RLS with proper policies once we've debugged the recursion issue
