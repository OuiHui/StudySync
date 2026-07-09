# In-Progress & TODO Document - StudySync

This document tracks completed systems, details current gaps, and lists future tasks to bring StudySync to a production-ready state.

---

## 1. Feature Progress Matrix

| Feature Area | Status | Notes |
| :--- | :--- | :--- |
| **Authentication** | [x] Done | Supported via email login and guest login. |
| **Dashboard Stats** | [x] Done | Displays study metrics and progress bars. |
| **Solo Timer** | [x] Done | Configurable Pomodoro durations with local state. |
| **Group Timer Sync** | [x] Done | Real-time broadcast sync controlled by session host. |
| **Note Shared Editing** | [x] Done | Collaborative editing synced to Supabase database. |
| **Friends List Page** | [x] Done | Standalone friend search and requests. |
| **Profile - Personal Info** | [x] Done | Edit bio, display name, and email details. |
| **Profile - Friends List** | [ ] Pending | No friends lists are currently rendered on the profile view. |
| **Profile - Privacy Settings** | [/] Partial | UI popup exists, but state is not saved in database. |
| **Profile - Notification Settings**| [/] Partial | UI popup exists, but settings are not saved in database. |
| **Group Session Layout** | [/] Partial | Workspace wraps poorly and overflows on average monitors. |
| **Group Member Limit Enforce**| [ ] Pending | Maximum members specified in group config is not validated on join. |
| **Group Member Moderation** | [ ] Pending | Admin/creator cannot kick members from groups due to RLS limit. |
| **PDF Note Attachments** | [ ] Pending | File/PDF upload capability lacks Supabase storage integration. |
| **Friend's Friends List Lookup**| [ ] Pending | Cannot query or display mutual friends or friends of friends. |

---

## 2. Unfinished Frontend Aspects

### A. Profile Page Integration ([Profile.tsx](src/components/profile/Profile.tsx))
*   **Show Friends list**: The profile page does not import or render the [FriendsSection](src/components/profile/FriendsSection.tsx) component. Needs to be embedded below the settings card.
*   **Privacy settings persistence**: Connect [PrivacySettingsPopup](src/components/profile/PrivacySettingsPopup.tsx) toggles to backend profile updates instead of local mock states.
*   **Notification settings persistence**: Link [NotificationSettingsPopup](src/components/profile/NotificationSettingsPopup.tsx) toggles to database profile configurations.

### B. Group Study Session Layout ([GroupStudySession.tsx](src/components/study/GroupStudySession.tsx))
*   **Height Constraints & Clipping**: The wrapper utilizes `h-[100vh]` and `overflow-hidden`. On laptops (e.g., 1080p screens), the combination of header, large timer circle, progress metrics, settings, goals, shared notes, and inline chat causes vertical clipping.
*   **Sidebar Responsive Scroll**: Need to add custom scroll overlays (`overflow-y-auto`) to individual sections (like Notes and Goals panels) so they scroll independently instead of stretching/clipping the page.
*   **Inline Chat Toggle Transition**: Smooth out the transition of the chat panel sliding in and out from the right sidebar.

---

## 3. Lacking Backend / Supabase Functionalities

1.  **Profiles Schema Additions**:
    *   Need to add JSON columns or structured columns to `public.profiles` for `privacy_settings` and `notification_settings` to persist user choices made in settings popups.
2.  **Real User Notifications Table**:
    *   Currently, the notifications list is empty because no table exists to track reminders, invites, or requests. A `notifications` table (storing `sender_id`, `receiver_id`, `type`, `content`, `read_status`) is required.
3.  **Group Creator / Admin Moderation RLS**:
    *   The `group_members` delete policy restricts deletes:
        `CREATE POLICY "Users can delete own memberships" ON public.group_members FOR DELETE USING (auth.uid() = user_id);`
    *   An additional policy is required to allow group admins to eject members:
        `USING (public.is_group_creator(auth.uid(), group_id))` or checking member role.
    *   Need to implement a group kick RPC or backend utility method in services.
4.  **Backend Join Verification (Member Limits)**:
    *   The join group endpoint needs database triggers or checking functions to verify that the group's current size is strictly less than its `max_members` limit before allowing insert.
5.  **PDF/Storage Buckets Configuration**:
    *   Supabase Storage bucket for `study_materials` needs to be defined, along with security policies allowing member-only reads and upload constraints for notes sharing.
6.  **Friends of Friends Database Queries**:
    *   Implement database functions/RPC to safely fetch and display accepted friends lists of a friend, adhering to user profile privacy constraints.
