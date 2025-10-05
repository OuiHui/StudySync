-- Enable RLS on group_members table
-- This resolves the "Policy Exists RLS Disabled" issue

-- First, ensure RLS is enabled on the group_members table
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- The policies should already exist from previous migrations:
-- - "Users can join groups"
-- - "Users can leave groups" 
-- - "Users can leave groups or admins can manage members"
-- - "Users can view group members if they're in the group"
-- - "Users can view group members of groups they can see"

-- If the policies don't exist, create simple non-recursive policies
-- Note: These are safe policies that won't cause infinite recursion

-- Policy 1: Users can view their own group memberships
CREATE POLICY IF NOT EXISTS "Users can view their own group memberships"
  ON group_members FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can join groups (insert their own membership)
CREATE POLICY IF NOT EXISTS "Users can join groups"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can leave groups (delete their own membership)
CREATE POLICY IF NOT EXISTS "Users can leave groups"
  ON group_members FOR DELETE
  USING (auth.uid() = user_id);

-- Policy 4: Group admins can manage all memberships in their groups
CREATE POLICY IF NOT EXISTS "Group admins can manage all memberships"
  ON group_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM study_groups
      WHERE study_groups.id = group_members.group_id
      AND study_groups.created_by = auth.uid()
    )
  );

-- Policy 5: Users can view group members of public groups
CREATE POLICY IF NOT EXISTS "Users can view members of public groups"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM study_groups
      WHERE study_groups.id = group_members.group_id
      AND study_groups.is_public = true
    )
  );