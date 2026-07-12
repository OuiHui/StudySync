# Notifications System Design Document - StudySync

## 1. Overview
The Notifications System in StudySync provides real-time and persistent alerts to users regarding platform activities. It supports:
* **Persistent DB-stored notifications** that persist across login sessions.
* **Real-time updates** via Supabase Realtime subscriptions.
* **Actionable elements** (e.g., Accept/Decline button groups for friend requests).
* **Granular user controls** to opt-in or opt-out of specific notification types.

---

## 2. Database Schema

### A. Notifications Table (`public.notifications`)
Stores individual notifications destined for users.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier |
| `user_id` | `UUID` | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Recipient of the notification |
| `sender_id` | `UUID` | `REFERENCES auth.users(id) ON DELETE SET NULL` | User who triggered the notification |
| `type` | `TEXT` | `NOT NULL`, `CHECK (type IN ('session', 'group', 'note', 'friend'))` | Notification category |
| `title` | `TEXT` | `NOT NULL` | Header text |
| `message` | `TEXT` | `NOT NULL` | Body text |
| `read` | `BOOLEAN` | `NOT NULL`, `DEFAULT FALSE` | Unread / read status |
| `actionable` | `BOOLEAN` | `NOT NULL`, `DEFAULT FALSE` | If true, renders interactive buttons |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL`, `DEFAULT now()` | Timestamp of creation |
| `friendship_id`| `UUID` | `REFERENCES public.friendships(id) ON DELETE CASCADE` | Optional link to friendship request |
| `group_id` | `UUID` | `REFERENCES public.study_groups(id) ON DELETE CASCADE` | Optional link to study group |
| `session_id` | `UUID` | `REFERENCES public.study_sessions(id) ON DELETE CASCADE` | Optional link to study session |

### B. Profile Customizations (`public.profiles`)
Two new columns are added to allow users to toggle notifications and privacy settings.

* **`notification_settings` (JSONB)**:
  * Default value:
    ```json
    {
      "emailNotifications": true,
      "pushNotifications": true,
      "studyReminders": true,
      "groupMessages": true,
      "sessionInvites": true,
      "weeklyDigest": false,
      "friendRequests": true,
      "systemUpdates": false
    }
    ```
* **`privacy_settings` (JSONB)**:
  * Default value:
    ```json
    {
      "profileVisibility": "friends",
      "studyStatsVisible": true,
      "onlineStatus": true,
      "allowFriendRequests": true,
      "showStudyGroups": true,
      "showAchievements": true,
      "allowDirectMessages": true,
      "shareStudyActivity": false
    }
    ```

---

## 3. Database Triggers & Automation

### A. Friendships Table Events
To automate notifications when social connections are initiated or altered:
1. **Friend Request Sent (`INSERT` status='pending')**:
   * Creates a notification record for the addressee (`friend_id`), referencing `friendship_id`.
   * Title: `"New Friend Request"`
   * Message: `"[display_name] sent you a friend request."`
   * Actionable: `true`
2. **Friend Request Accepted (`UPDATE` status='accepted')**:
   * Creates a notification record for the initiator (`user_id`).
   * Title: `"Friend Request Accepted"`
   * Message: `"[display_name] accepted your friend request."`
   * Actionable: `false`
   * Deletes or sets `read = true`, `actionable = false` for the recipient's original pending notification.
3. **Friend Request Rejected or Canceled (`DELETE` status='pending')**:
   * Clears any associated notifications matching the `friendship_id`.

---

## 4. Row Level Security (RLS) Policies

To protect user notification privacy:
* **Select**: Users can view only their own notifications.
  ```sql
  CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
  ```
* **Update**: Users can update read statuses for their own notifications.
  ```sql
  CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
  ```
* **Delete**: Users can delete their own notifications.
  ```sql
  CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);
  ```

---

## 5. API Layer (`src/services/notifications.ts`)

Encapsulates all Supabase database transactions for notifications:
* `getUserNotifications()`: Fetches the current user's notifications sorted by `created_at` DESC.
* `markAsRead(id)`: Sets `read = true` for a single notification.
* `markAllAsRead()`: Sets `read = true` for all of the current user's notifications.
* `deleteNotification(id)`: Deletes the notification row.

---

## 6. Frontend State & Realtime Sync

* **`NotificationContext`**:
  * Subscribes to changes on the `public.notifications` table for the current user's `user_id`.
  * Triggers an update of `hasUnreadNotifications` when new records are added or read status changes.
* **`NotificationCenter`**:
  * Renders notifications from the database.
  * Connects actionable buttons (`Accept` / `Decline`) to corresponding service hooks (`FriendsService.acceptFriendRequest` and `FriendsService.rejectFriendRequest`).

---

## 7. Notification Triggers & Events

Below is the list of platform events categorized by notification `type` that should trigger a database notification entry:

### A. Friend System Events (`type = 'friend'`)
1. **Friend Request Received**: 
   * **Trigger**: A new row is inserted into `public.friendships` with `status = 'pending'`.
   * **Action**: Create an actionable notification for the recipient (`friend_id`) with `actionable = true`.
2. **Friend Request Accepted**:
   * **Trigger**: A friendship row's status is updated to `'accepted'`.
   * **Action**: Create an informational notification for the initiator (`user_id`), and automatically mark the receiver's pending request notification as read.

### B. Study Group Events (`type = 'group'`)
1. **Group Invitation Received**:
   * **Trigger**: A user is invited to a private group (inserts into a dedicated invitations table, or inserts into `group_members` with status `'invited'`).
   * **Action**: Create an actionable notification for the invited user (`actionable = true` with Join/Decline options).
2. **New Member Joined (for Group Admins)**:
   * **Trigger**: A user joins a group (inserts into `group_members` with role `'member'`).
   * **Action**: Create an informational notification for the group's admin(s) indicating that a new user joined.
3. **Kicked from Group**:
   * **Trigger**: A user is removed from a study group by an admin (deletion of a `group_members` row).
   * **Action**: Create an informational notification for the removed user.

### C. Study Session Events (`type = 'session'`)
1. **Session Scheduled in Group**:
   * **Trigger**: A new row is inserted in `public.study_sessions` linked to a `group_id`.
   * **Action**: Create an informational notification for all group members (excluding the creator).
2. **Direct Session Invite**:
   * **Trigger**: A user explicitly invites a friend to a study session (inserts into `session_participants` with `status = 'invited'`).
   * **Action**: Create an actionable notification for the invited friend with Join/Ignore buttons.
3. **Session Starting Reminder**:
   * **Trigger**: Checked via scheduled cron jobs/background workers 5-10 minutes prior to a session's `scheduled_start`.
   * **Action**: Create an informational notification with a quick "Join Lobby" button for all active session participants.
4. **Pomodoro Cycle/Session Completed**:
   * **Trigger**: A session status updates to `'completed'` or `'finished'`.
   * **Action**: Create an informational status alert for active participants.

### D. Document Collaboration Events (`type = 'note'`)
1. **Note Shared with Group**:
   * **Trigger**: A note's `group_id` is updated/set, sharing it with a study group.
   * **Action**: Create an informational notification for all group members.
2. **Note Collaboration Invite**:
   * **Trigger**: A user is added to `note_collaborators` for a specific note.
   * **Action**: Create an informational or actionable notification letting them know they have been granted edit permissions.
3. **Comment or Edit on Shared Note**:
   * **Trigger**: A collaborator adds a comment or saves a new version of a note.
   * **Action**: Create an informational notification for the note owner and other active collaborators.

