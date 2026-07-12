# High-Level Design (HLD) - StudySync

## 1. System Architecture

StudySync follows a client-server architecture combining React on the frontend and Supabase (Postgres, Auth, Storage, and Real-time Engines) on the backend.

```
                      +-----------------------------+
                      |    React Frontend / Vite    |
                      +--------------+--------------+
                                     |
         +-----------------+---------+---------+-----------------+
         |                 |                   |                 |
         v                 v                   v                 v
+-----------------+ +--------------+ +-------------------+ +-------------------+
|  Supabase Auth  | | Supabase DB  | | Supabase Storage  | | Supabase Realtime |
| (Auth Requests) | | (Queries/RPC)| |  (PDFs & Uploads) | | (Live Timer/Chat) |
+-----------------+ +--------------+ +-------------------+ +-------------------+
```

### Components Summary
1. **Frontend**: React 18 SPA built with Vite, utilizing React Router for navigation, Tailwind CSS for custom colors, and Lucide React icons.
2. **State Management**: React Context providers govern global states ([GlobalTimerContext](src/contexts/GlobalTimerContext.tsx), [SessionContext](src/contexts/SessionContext.tsx), [AuthContext](src/contexts/AuthContext.tsx)), while TanStack Query manages caching and server states.
3. **Backend Service Layer**: Defined in `src/services/` wrapping Supabase queries:
   - [ProfileService](src/services/profile/index.ts): Handles user details.
   - [StudyGroupsService](src/services/studyGroups/index.ts): Handles study groups.
   - [StudySessionsService](src/services/studySessions/index.ts): Manages solo/group timers and details.
   - [FriendsService](src/services/friends.ts): Manages friends and invitations.
   - [ChatService](src/services/chat.ts): Orchestrates chat storage.

---

## 2. Database Schema & Entity Relationships

The PostgreSQL database contains the following tables and relationships:

```
======================================================================
                         DATABASE SCHEMA RELATIONSHIPS
======================================================================

  [profiles] (1) <--------------------------- (N) [friendships]
      │                                                ▲
      ├─(1) <─────── (N) [group_members]               │
      │                                                │
      ├─(1) <─────── (N) [session_participants]        │
      │                                                │
      ├─(1) <─────── (N) [group_invitations]           │ (invited_user_id / invited_by_id)
      │                                                │
      └─(1) <─────── (N) [notes]                       │ (friend_id / user_id)
                                                       │
  [study_groups] (1) ───< (N) [group_members]          │
      │                                                │
      ├─(1) <─────── (N) [group_invitations]           │
      ├─(1) <─────── (N) [study_sessions]              │
      │                                                │
      ├─(1) <─────── (N) [notes]                       │
      │                                                │
      └─(1) <─────── (N) [messages]                    │
                                                       │
  [study_sessions] (1) ───< (N) [session_participants] ─┘
      │
      └─(1) <─────── (N) [notes]


======================================================================
                         ENTITY SPECIFICATIONS
======================================================================

1. profiles
   - id (UUID, PK)
   - user_id (UUID, FK -> auth.users)
   - email (TEXT)
   - display_name (TEXT)
   - avatar_url (TEXT)
   - bio (TEXT)
   - major (TEXT)
   - year (TEXT)
   - top_subjects (TEXT[])
   - study_hours (INT)

2. study_groups
   - id (UUID, PK)
   - name (TEXT)
   - description (TEXT)
   - subject (TEXT)
   - is_public (BOOLEAN)
   - max_members (INT)
   - created_by (UUID, FK -> profiles.id)

3. group_members
   - id (UUID, PK)
   - group_id (UUID, FK -> study_groups.id)
   - user_id (UUID, FK -> profiles.id)
   - role (TEXT)

4. study_sessions
   - id (UUID, PK)
   - group_id (UUID, FK -> study_groups.id)
   - created_by (UUID, FK -> profiles.id)
   - title (TEXT)
   - subject (TEXT)
   - description (TEXT)
   - actual_start (TIMESTAMP)
   - actual_end (TIMESTAMP)
   - status (TEXT)

5. session_participants
   - id (UUID, PK)
   - session_id (UUID, FK -> study_sessions.id)
   - user_id (UUID, FK -> profiles.id)
   - role (TEXT)
   - status (TEXT)
   - minutes_studied (INT)

6. notes
   - id (UUID, PK)
   - session_id (UUID, FK -> study_sessions.id)
   - group_id (UUID, FK -> study_groups.id)
   - created_by (UUID, FK -> profiles.id)
   - title (TEXT)
   - content (TEXT)
   - permission_level (TEXT)

7. friendships
   - id (UUID, PK)
   - user_id (UUID, FK -> profiles.id)
   - friend_id (UUID, FK -> profiles.id)
   - status (TEXT)

8. messages
   - id (UUID, PK)
   - group_id (UUID, FK -> study_groups.id)
   - user_id (UUID, FK -> profiles.id)
   - content (TEXT)

9. group_invitations
   - id (UUID, PK)
   - group_id (UUID, FK -> study_groups.id)
   - invited_user_id (UUID, FK -> auth.users.id)
   - invited_by_id (UUID, FK -> auth.users.id)
   - status (TEXT)
   - created_at (TIMESTAMP)
```

---

## 3. System States & Transitions

### A. Authentication State
*   **States**: `UNAUTHENTICATED` $\rightarrow$ `AUTHENTICATED` (Email/Password or Guest Session).
*   **Actions**:
    *   `login()` / `signUp()`: Transition user to `AUTHENTICATED`.
    *   `loginAsGuest()`: Creates anonymous credential.
    *   `logout()`: Deletes access tokens, returning state to `UNAUTHENTICATED`.

### B. Pomodoro Timer State
Governed by [useTimer](src/hooks/useTimer.tsx) hook.

*   **States**:
    *   `IDLE`: Timer has not started.
    *   `WORK_RUNNING`: Active study timer decrementing.
    *   `WORK_PAUSED`: Active study timer suspended.
    *   `BREAK_RUNNING`: Break timer decrementing.
    *   `BREAK_PAUSED`: Break timer suspended.
*   **Actions & Transitions**:
    *   `start()`: Transitions `IDLE` or `PAUSED` $\rightarrow$ `RUNNING`.
    *   `pause()`: Transitions `RUNNING` $\rightarrow$ `PAUSED`.
    *   `reset()`: Restores timer value, sets state back to `IDLE`.
    *   `tick()`: Decrements seconds left. When seconds hit 0, triggers `switchMode()` to toggle between Work and Break.

### C. Friendship Status State
Governed by [friendships](src/services/friends.ts) table rows.
*   **States**: `NONE` $\rightarrow$ `PENDING` $\rightarrow$ `ACCEPTED` / `REJECTED` $\rightarrow$ `BLOCKED` / `DELETED`.
*   **Actions**:
    *   `sendFriendRequest()`: Inserts row with status `'pending'`.
    *   `acceptFriendRequest()`: Updates row status to `'accepted'`.
    *   `rejectFriendRequest()`: Deletes the row.
    *   `removeFriend()`: Deletes the friendship row.

### D. Group & Session Invitation State
Governed by [group_invitations](src/services/studyGroups/mutations.ts) and [session_participants](src/services/studySessions/mutations.ts) rows.
*   **Group Invitation States**: `NONE` -> `PENDING` -> `ACCEPTED` / `DECLINED`.
*   **Session Invitation States**: `NONE` -> `INVITED` -> `ACTIVE` (Attending).
*   **Actions**:
    *   `inviteUserToGroup()`: Inserts row in `group_invitations` with status `'pending'`.
    *   `acceptGroupInvitation()`: Updates status to `'accepted'`, adds user to `group_members`.
    *   `declineGroupInvitation()`: Updates status to `'declined'`.
    *   `inviteUserToSession()`: Inserts row in `session_participants` with status `'invited'`.
    *   `acceptSessionInvitation()`: Updates status to `'active'`, setting `is_attending` to `true`.
    *   `declineSessionInvitation()`: Deletes participant row in `session_participants`.

---

## 4. Key Data Flows & Real-time Synchronization

### A. Real-time Study Session Timer Sync
Group session hosts control and synchronize the timer.
1. The Host clicks **Start** on [GroupStudySession](src/components/study/GroupStudySession.tsx).
2. The Host's browser broadcasts the state (e.g. `{ isActive: true, timeLeft: 1500, mode: 'work' }`) via a Supabase Realtime Broadcast Channel.
3. Participants' clients subscribe to the channel, intercepting the Host's broadcast.
4. Participants' local [useTimer](src/hooks/useTimer.tsx) state is updated to match the Host's broadcasted coordinates.

### B. Collaborative Notes Sync
1. Multiple users open the same shared document.
2. Changes to document fields trigger database updates in the `notes` table.
3. Supabase Postgres changes listeners (`on('postgres_changes', ...)`) alert other connected peers.
4. React Query cache invalidates or updates local state, reflecting the edits in real-time.
