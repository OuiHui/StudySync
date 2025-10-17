-- Fix group_members table RLS policies to prevent infinite recursion
-- The issue is that group_members table itself has recursive policies

-- Temporarily disable RLS on group_members to clean up
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on group_members
DROP POLICY IF EXISTS "Users can view their own group memberships" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Group admins can manage all memberships" ON group_members;
DROP POLICY IF EXISTS "Users can view members of public groups" ON group_members;
DROP POLICY IF EXISTS "Users can read own memberships only" ON group_members;
DROP POLICY IF EXISTS "Users can insert own memberships only" ON group_members;
DROP POLICY IF EXISTS "Users can delete own memberships only" ON group_members;
DROP POLICY IF EXISTS "Users can read group_members for groups they are members of" ON group_members;
DROP POLICY IF EXISTS "Users can manage group_members for groups they admin" ON group_members;
DROP POLICY IF EXISTS "Users can join public groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups they are members of" ON group_members;
DROP POLICY IF EXISTS "Users can read their own group memberships" ON group_members;
DROP POLICY IF EXISTS "Users can read members of public groups" ON group_members;
DROP POLICY IF EXISTS "Group creators can manage group memberships" ON group_members;
DROP POLICY IF EXISTS "Users can view group members of groups they can see" ON group_members;

-- Re-enable RLS
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Create simple, NON-RECURSIVE policies for group_members
-- Policy 1: Users can view their own memberships (no recursion)
CREATE POLICY "Users can view own memberships" ON group_members
    FOR SELECT USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own memberships (no recursion)
CREATE POLICY "Users can insert own memberships" ON group_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can delete their own memberships (no recursion)
CREATE POLICY "Users can delete own memberships" ON group_members
    FOR DELETE USING (auth.uid() = user_id);

-- Policy 4: Users can view members of public groups (no recursion - direct check)
CREATE POLICY "Users can view public group members" ON group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.study_groups 
            WHERE id = group_members.group_id 
            AND is_public = true
        )
    );

-- Policy 5: Group creators can manage memberships (no recursion - direct check)
CREATE POLICY "Group creators can manage memberships" ON group_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.study_groups 
            WHERE id = group_members.group_id 
            AND created_by = auth.uid()
        )
    );