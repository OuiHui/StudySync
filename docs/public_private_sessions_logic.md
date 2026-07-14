# Study Sessions: Public vs Private Logic

This document details the design, database schema, and visibility rules for public versus private study sessions in StudySync.

---

## 1. Overview
Study sessions in StudySync can be configured as either **Public** or **Private** to control visibility and accessibility:
*   **Public Sessions**: Open to all users on the platform. They appear on the "Available Sessions" dashboard, allowing any authenticated user to see details and join them.
*   **Private Sessions**: Restricted. They are only visible and accessible to the creator (host) and users who have been explicitly invited or added as participants.

---

## 2. Database Schema
Session privacy is governed by the `is_public` column in the `study_sessions` table:

```sql
-- Represents the privacy status of a study session
-- TRUE: Public (visible to everyone)
-- FALSE: Private (visible only to host and participants/invitees)
-- NULL: Defaults to Public visibility behavior in queries
ALTER TABLE public.study_sessions ADD COLUMN is_public BOOLEAN DEFAULT TRUE;
```

In TypeScript, this maps to the `StudySession` row type definition:
```typescript
is_public: boolean | null;
```

---

## 3. Visibility and Filtering Logic

### A. Frontend Available Sessions List
The filtering for private sessions is applied at the query level in `StudySessionsQueries.getAvailableSessions()`. 

When fetching the list of all available active or planned sessions:
1. All scheduled, active, running, or paused sessions are retrieved from the database.
2. The user's ID is retrieved via authentication.
3. The user's enrolled group memberships are fetched.
4. Sessions are filtered according to the following logic:
   *   If `session.is_public === false` (Private session):
       *   Visible if the current user is the creator (`created_by === current_user_id`).
       *   Visible if the current user is an active participant or invitee (`session_participants` includes the user's ID).
       *   Visible if the session belongs to a group that the current user is a member of (`session.group_id` is in the user's joined groups).
   *   Otherwise (Public session):
       *   Visible to all authenticated users.

```typescript
// Fetch user's group memberships to check if they belong to the session's group
let userGroupIds: string[] = [];
if (userId) {
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);
  if (memberships) {
    userGroupIds = memberships.map(m => m.group_id);
  }
}

// Filter out private study sessions if user is not invited, is not the creator,
// and does not belong to the study group associated with the session.
return enriched.filter(studySession => {
  if (studySession.is_public === false) {
    const isCreator = userId && studySession.created_by === userId;
    const isParticipant = userId && studySession.session_participants?.some(
      (p: any) => p.user_id === userId
    );
    const isGroupMember = userId && studySession.group_id && userGroupIds.includes(studySession.group_id);
    return isCreator || isParticipant || isGroupMember;
  }
  return true;
});
```

---

## 4. Group-Level Public vs. Private Logic
Yes, public vs. private visibility is also implemented for **Study Groups**:
1. **Schema Column**: `study_groups.is_public` (BOOLEAN).
2. **Behavior**:
   *   **Public Groups** (`is_public = true`): Discoverable via search/browse in `BrowseGroups` (retrieved in `StudyGroupsQueries.getPublicGroups()`).
   *   **Private Groups** (`is_public = false`): Hidden from search/browse lists, accessible only by direct invite or member links.
   *   **RLS Policies**: Restrict non-members from reading private group data or joining without invitation.


### B. Row Level Security (RLS) Policies
Database-level RLS policies on the `study_sessions` table verify permissions. To allow users to interact with sessions, the SELECT policy on `study_sessions` allows reading a session if:
*   The current user created the session (`created_by = auth.uid()`).
*   The session is solo / has no group (`group_id IS NULL`).
*   The user is a member of the group that the study session belongs to (`group_id` matching a row in `group_members` for the user).

---

## 4. Lifecycle Operations

### A. Creation
*   During session creation (`CreateSessionDialog`), the host can toggle a switch to determine session privacy.
*   The toggle sets the `isPublic` value (`formData.isPublic`) which is passed to the database insertion payload as `is_public`.
*   Default: **Private** (`isPublic = false`) in the UI form, but defaults to **Public** (`DEFAULT TRUE`) on database schema insertion if unspecified.

### B. Editing Privacy as Host
*   Only the host (`created_by === current_user_id`) has permission to edit the session.
*   The host can change the session's privacy from public to private, or vice versa, at any time through the `EditSessionDialog`.
*   Changes are committed via `StudySessionsService.updateSession(sessionId, { is_public: newValue })`.

---

## 5. UI Presentation and Badge Indicators
To distinguish public and private sessions:
1. **Badges/Symbols**:
   *   **Public Sessions**: Displayed with a Globe icon (`Globe`) and a sky-blue themed outline badge: `Public`.
   *   **Private Sessions**: Displayed with a Lock icon (`Lock`) and an amber/gold themed outline badge: `Private`.
2. **Badge Locations**:
   *   **Study Sessions / Available Sessions Page**: Exhibited on both Live and Upcoming session cards next to the Live or Scheduled status.
   *   **Session Details Dialog**: Displayed next to the status header (LIVE / SCHEDULED).
   *   **Group Sessions Tab**: Displayed in the planned/past list items.
