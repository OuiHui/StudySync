# Study Group Concepts & Specifications

This document outlines the detailed concepts, states, data models, roles, permissions, and lifecycle management for **Study Groups** in StudySync.

---

## 1. Core Data Models

Study groups and memberships are modeled in the database via two primary tables: `study_groups` and `group_members`.

### A. Study Group (`study_groups`)
A Study Group is a shared space for multiple users to coordinate sessions, chat, and share study materials.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Unique identifier for the group (Primary Key). |
| `name` | `String` | The display name of the study group. |
| `description` | `Text` (Optional) | Description of the group's focus, goals, or guidelines. |
| `subject` | `String` (Optional) | Category or course/subject (e.g., `"Computer Science"`, `"Mathematics"`). |
| `is_public` | `Boolean` | Visibility status: `true` for public, `false` for private/invite-only. |
| `max_members` | `Integer` (Optional)| Maximum size limit of the group. |
| `icon` | `String` | Icon key or data URL used for the group's visual avatar. |
| `color` | `String` | Tailwind-compatible CSS gradient or color class for the group's card styling. |
| `created_by` | `UUID` | Reference to `profiles.user_id` of the group creator. |
| `created_at` | `Timestamp` | Timestamp when the group was created. |

### B. Group Member (`group_members`)
A junction table representing the relationship between users and study groups.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Unique identifier for the membership row (Primary Key). |
| `group_id` | `UUID` | Foreign Key referencing `study_groups.id`. |
| `user_id` | `UUID` | Foreign Key referencing `profiles.user_id`. |
| `role` | `String` | Role of the member: `'admin'` or `'member'`. |
| `joined_at` | `Timestamp` | Timestamp when the user joined the group. |

### C. Group Invitations (`group_invitations`)
Tracks pending, accepted, or declined invitations for private groups.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Unique identifier for the invitation. |
| `group_id` | `UUID` | Foreign Key referencing `study_groups.id`. |
| `invited_user_id` | `UUID` | Foreign Key referencing `profiles.user_id` of the recipient. |
| `invited_by_id` | `UUID` | Foreign Key referencing `profiles.user_id` of the sender. |
| `status` | `String` | Current status of the invitation: `'pending'`, `'accepted'`, or `'declined'`. |
| `created_at` | `Timestamp` | Timestamp when the invitation was sent. |

---

## 2. Visibility & Access Rules

Study Groups support two visibility modes:

1. **Public Groups (`is_public = true`)**:
   - Anyone can discover them in the **Browse Groups** page.
   - Any user can join directly (creating a `group_members` row with role `'member'`).
   - Non-members can view general group details and active sessions, but must join to access chat and edit notes.

2. **Private Groups (`is_public = false`)**:
   - Hidden from general search results for non-members.
   - Joining requires a pending invitation in `group_invitations` with `'pending'` status.
   - Access to pages, chat, notes, and sessions is restricted strictly to members, creators, or users with pending invitations.

---

## 3. Roles and Permissions Matrix

Permissions are structured hierarchically:

| Action | Creator | Admin | Member | Guest / Non-Member |
| :--- | :---: | :---: | :---: | :---: |
| **View Group Details** | Yes | Yes | Yes | Public Groups Only |
| **Join Group** | N/A | N/A | N/A | Public Groups / If Invited |
| **Leave Group** | Yes | Yes | Yes | N/A |
| **Edit Group Settings** | Yes | No | No | No |
| **Delete Group** | Yes | No | No | No |
| **Invite Members** | Yes | Yes | Yes | No |
| **Remove Members** | Yes | Yes | No | No |
| **Promote to Admin** | Yes | No | No | No |

### Member Removal Hierarchy (New Feature)
To prevent admin abuse and maintain authority, member removal follows a strict validation hierarchy:
- **Creators** can remove *anyone* in the group (admins and regular members) except themselves.
- **Admins** can remove regular *members* but cannot remove the creator or other admins.
- **Members** cannot remove anyone (they can only choose to leave the group themselves).

---

## 4. Row Level Security (RLS) Policies

To protect database operations and prevent recursive query loops, Row Level Security is implemented via non-recursive helper functions.

### Helper Functions
- **`public.is_group_creator(user_uuid, group_uuid)`**: Returns `true` if the user is the creator of the specified group.
- **`public.is_group_admin(user_uuid, group_uuid)`**: Returns `true` if the user is the group creator or has an `'admin'` membership role.

### Policies on `group_members`
- **SELECT**: Users can view memberships if they are the member, the creator, or if the group is public.
- **INSERT**: Authenticated users can insert their own membership (joining public groups or accepting invites).
- **DELETE**: 
  - A user can delete their own membership (leaving the group).
  - A group admin or creator can delete memberships of other users (removing a member).
- **UPDATE**: Group creators can update memberships (promoting/demoting).

---

## 5. User Flows

### A. Removing a Member
```mermaid
sequenceDiagram
    actor Admin as Group Admin / Creator
    participant UI as Group Members UI
    participant API as StudyGroupsService
    participant DB as Supabase DB

    Admin->>UI: Click "Remove Member" on a user card
    UI->>UI: Show Confirmation Alert Dialog
    Admin->>UI: Confirm Removal
    UI->>API: removeMember(groupId, memberId)
    API->>DB: DELETE FROM group_members WHERE group_id = groupId AND user_id = memberId
    DB-->>API: Success
    API-->>UI: Success
    UI->>UI: Trigger Query Invalidation
    UI->>UI: Refresh Member List & Show Toast Notification
```

### B. Accepting/Declining Invitations
- When a user accepts an invitation, they are inserted into `group_members` as a `'member'` and the invitation status updates to `'accepted'`.
- When they decline, the invitation status updates to `'declined'`.

---

## 6. Real-Time Synchronization

Study groups support real-time updates for membership changes (joins, leaves, and kicks):
- **Database Replication**: The `group_members` table is enrolled in the `supabase_realtime` publication with `REPLICA IDENTITY FULL` to ensure delete event payloads replicate the `group_id` column to subscribers.
- **Client Subscription**: The `useGroupData` React hook establishes a Supabase Realtime channel subscription listening to changes on the `group_members` table for the active `group_id`.
- **Query Cache Invalidation**: Upon receiving a real-time event (`INSERT`, `UPDATE`, or `DELETE`), the client automatically invalidates the React Query cache key `['group', groupId]`, triggering a background refresh of the members list and instantly updating the user interface.
