
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own memberships" ON group_members;
DROP POLICY IF EXISTS "Users can insert own memberships" ON group_members;
DROP POLICY IF EXISTS "Users can delete own memberships" ON group_members;
DROP POLICY IF EXISTS "Users can view public group members" ON group_members;
DROP POLICY IF EXISTS "Group creators can manage memberships" ON group_members;
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

