# RLS Recursion Issue and Fix

## Problem
The application is experiencing a Supabase RLS (Row Level Security) recursion error when querying the `group_members` table:

```
Error code: 42P17
Message: "infinite recursion detected in policy for relation 'group_members'"
```

## Root Cause
This error occurs when RLS policies create circular dependencies between tables. For example:

- A policy on `group_members` table references the `study_groups` table
- A policy on `study_groups` table references the `group_members` table
- This creates an infinite loop when Supabase tries to evaluate permissions

## Current Workaround
The application has been updated to handle this gracefully:

1. **Error Detection**: The service layer detects RLS recursion errors and logs detailed information
2. **Graceful Fallback**: Instead of crashing, the app returns empty arrays and shows user-friendly messages
3. **Temporary Solution**: 
   - For user groups, only groups created by the user are shown (bypassing the problematic `group_members` query)
   - For public groups, member counts are disabled and default to 0
   - Group member lists are disabled for individual group details
4. **Join/Leave Operations**: Enhanced error handling for RLS recursion in join/leave group operations

## How to Fix the RLS Policies

### Step 1: Identify Problematic Policies
In your Supabase dashboard, check the RLS policies for both tables:

1. Go to **Database** → **study_groups** → **RLS Policies**
2. Go to **Database** → **group_members** → **RLS Policies**

Look for policies that reference each other in a circular manner.

### Step 2: Example of Problematic Policies

```sql
-- PROBLEMATIC: This creates recursion
CREATE POLICY "users_can_see_their_groups" ON study_groups
FOR SELECT USING (
  id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

CREATE POLICY "users_can_see_group_memberships" ON group_members
FOR SELECT USING (
  group_id IN (SELECT id FROM study_groups WHERE created_by = auth.uid() OR is_public = true)
);
```

### Step 3: Fixed Policies

```sql
-- BETTER: Break the circular dependency
CREATE POLICY "users_can_see_public_groups" ON study_groups
FOR SELECT USING (is_public = true);

CREATE POLICY "users_can_see_created_groups" ON study_groups
FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "users_can_see_their_memberships" ON group_members
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "group_creators_can_see_members" ON group_members
FOR SELECT USING (
  group_id IN (SELECT id FROM study_groups WHERE created_by = auth.uid())
);
```

### Step 4: Alternative Approach
If you need more complex access control, consider:

1. **Using Functions**: Create PostgreSQL functions that handle the logic without recursion
2. **Simplifying Policies**: Make policies more specific to avoid circular references
3. **Using Views**: Create database views that pre-compute relationships

## Testing the Fix

Once you update the RLS policies:

1. **Re-enable the full query**: Update `getUserGroups()` in `database.ts` to use the `group_members` table again
2. **Remove the workaround**: Remove the temporary notice in the StudyGroups component
3. **Test thoroughly**: Verify that users can see both created and joined groups

## Code Changes to Revert

When RLS policies are fixed, update these files:

### `src/services/database.ts`
- Restore the original `getUserGroups()` method that queries `group_members`
- Remove the temporary workaround method `getUserGroupsViaMembers()`

### `src/components/groups/StudyGroups.tsx`
- Remove the blue information banner about current limitations
- Update success messages

## Prevention
To prevent this in the future:

1. **Test policies thoroughly** in development before deploying
2. **Use simple, non-recursive policies** when possible
3. **Document policy dependencies** to avoid circular references
4. **Consider using database functions** for complex access control logic

## Current Status
✅ Application is stable and handles errors gracefully
⚠️ Users can only see groups they created (not groups they joined)
⚠️ Member counts are disabled for all groups (shows 0)
⚠️ Group member lists are disabled for group details
✅ Clear error handling and user feedback
✅ Detailed logging for debugging
