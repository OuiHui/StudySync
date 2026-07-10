# In-Progress & TODO Document - StudySync

This document tracks completed systems, details current gaps, and lists future tasks to bring StudySync to a production-ready state.

---

## 1. Feature Progress

| Feature Area | Status | Notes |
| :--- | :--- | :--- |
| **Authentication** | [/] Partial | Supported via email login and guest login. Working to get O-auth |
| **Dashboard Stats** | [/] Partial | Displays study metrics and progress bars. |
| **Solo Timer** | [x] Done | Configurable Pomodoro durations with local state. |
| **Solo Study Goals** |[/] Partial | Checked local storage persistence (JSON under 'solo_study_goals' with id, title, completed fields). |
| **Group Timer Sync** | [/] Partial | Real-time broadcast sync controlled by session host. |
| **Note Shared Editing** | [x] Done | Collaborative editing synced to Supabase database. |
| **Friends List Page** | [x] Done | Standalone friend search and requests. |
| **Profile - Personal Info** | [x] Done | Edit bio, display name, and email details. |
| **Profile - Friends List** | [ ] Pending | No friends lists are currently rendered on the profile view. |
| **Profile - Privacy Settings** | [/] Partial | UI popup exists, but state is not saved in database. |
| **Profile - Notification Settings**| [/] Partial | UI popup exists, but settings are not saved in database. |
| **Notifications System**          | [/] Partial | UI NotificationCenter modal exists with stubs; lacks DB table and backend connection. |
| **Group Session Layout** | [/] Partial | Workspace wraps poorly and overflows on average monitors. |
| **Group Member Limit Enforce**| [ ] Pending | Maximum members specified in group config is not validated on join. |
| **Group Member Moderation** | [ ] Pending | Admin/creator cannot kick members from groups due to RLS limit. |
| **PDF Note Attachments** | [ ] Pending | File/PDF upload capability lacks Supabase storage integration. |
| **Friend's Friends List Lookup**| [ ] Pending | Cannot query or display mutual friends or friends of friends. |
| **Editing Goals**| [ ] Pending | Should be able to add end date for goals that show up on calendar. |
| **Account Card Functionality** | [ ] Pending | Determine and implement required features for the bottom-left account card (UserMenu). |
| **Theme Customizer / Color Support** | [/] Partial | Custom themes can be selected, but custom colors only change background gradient; main components still default to blue/standard colors. |
| **Solo Study Note Integration** | [ ] Pending | Define note rendering/editing logic and user interaction in the solo study page. |
| **Study Group Page Redesign** | [ ] Pending | Redesign the study group page layout, usability, and design aesthetics. |
| **Dropdown Transitions** | [ ] Pending | Make all dropdown menus across the app have smooth entry/exit animations. |
| **Code Cleanup / Deduplication** | [ ] Pending | Refactor components and services to reduce duplicated/re-used code. |
| **Session History** | [ ] Pending | View list of past study sessions with durations and dates. |
| **Simulated User Testing Framework** | [ ] Pending | Scripted fake-user bot system to perform realistic actions (friend requests, session joins, messaging) for testing and seeding. |



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

### C. Sidebar Account Card ([Sidebar.tsx](src/components/common/layout/Sidebar.tsx))
*   **Define Account Card Functionalities**: Figure out what functionalities the account card in the bottom left will do. This includes specifying drop-down items (e.g., Settings menu connection, status/presence selection, or user details) and handling collapsed vs. expanded layouts.

### D. Notifications System ([NotificationCenter.tsx](src/components/common/notifications/NotificationCenter.tsx))
*   **Connect Service to Backend**: Rewrite [notifications.ts](src/services/notifications.ts) functions (`getUserNotifications`, `markAsRead`, `markAllAsRead`) to query and update the database instead of returning static mocked objects.
*   **Actionable Notification Triggers**: Bind UI buttons like "Accept" and "Decline" inside [NotificationCenter.tsx](src/components/common/notifications/NotificationCenter.tsx) to execute corresponding actions (such as accepting/declining friend requests or group invitations) on the server.
*   **Real-time Subscription**: Integrate Supabase Realtime channel subscription in [NotificationContext.tsx](src/contexts/NotificationContext.tsx) to listen for inserts/updates to the user's notifications.

### E. Color Theme Support / Customizer ([ColorCustomizer.tsx](src/components/common/settings/ColorCustomizer.tsx))
*   **Fully Support Custom Theme Colors**: Modify the app components (e.g., buttons, active sidebar items, progress bars, active icons, etc.) to use CSS custom properties (`--theme-primary`, `--theme-secondary`) or dynamic Tailwind class mapping rather than hardcoded `bg-blue-500`, `text-blue-600`, etc., so that selecting themes like "Forest Green" or "Sunset Orange" updates the entire application's primary/secondary colors.

### F. Solo Study Note Integration ([StudySession.tsx](src/components/study/StudySession.tsx))
*   **Rendering & Editing Logic**: Determine how personal note rendering/editing components are integrated into solo study sessions.
*   **User Note Interaction**: Plan and build the user interaction flow for notes access and editing during solo study.

### G. Study Group Page Redesign ([GroupStudySession.tsx](src/components/study/GroupStudySession.tsx))
*   **Layout & Aesthetics Redesign**: Fully redesign the group study page to prevent overflow, optimize spatial layout of tools, and enhance the visual style.

### H. Global UI/UX Transitions
*   **Dropdown Transitions**: Implement entry/exit transition animations for all dropdown menus globally to ensure design polish.

### I. Code Quality & Refactoring
*   **Reduce Re-used Code**: Identify, consolidate, and eliminate duplicate logic/code patterns across the components and service files.

### J. Session History
*   **Session History UI**: Design and build a page, modal, or section (e.g., extending the Dashboard or Profile) that allows users to view a list of all their past study sessions with details like title, duration, type (solo/group), and date/time.

### K. Simulated User Testing Framework
*   **Bot Action Runner**: Build a script or admin tool (e.g., `scripts/simulate-users.ts`) that can authenticate as any seeded fake user and programmatically invoke service methods to perform realistic actions.
*   **Supported Actions**: At minimum the framework should support: sending and accepting friend requests, creating and joining group sessions, sending direct messages and group chat messages, and creating/sharing notes.
*   **Scenario Scripting**: Allow composing multi-step interaction scenarios (e.g., "User A sends friend request → User B accepts → User A messages User B → both join the same session") to validate end-to-end data flows and real-time sync.
*   **Seeded User Pool**: Define a set of persistent fake profiles in the database (separate from production users) that the framework authenticates against, so tests can be reproduced consistently.


---

## 3. Lacking Backend / Supabase Functionalities

1.  **Profiles Schema Additions**:
    *   Need to add JSON columns or structured columns to `public.profiles` for `privacy_settings` and `notification_settings` to persist user choices made in settings popups.
2.  **Real User Notifications Table**:
    *   Currently, the notifications list is empty because no table exists to track reminders, invites, or requests. A `notifications` table (storing `sender_id`, `receiver_id`, `type`, `content`, `read_status`) is required.
    *   **Database Triggers/Functions**: Need DB triggers/functions to automatically create notification entries when specific actions occur (e.g., when a friendship row is created/modified, or when a group session invite is sent).
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
7.  **Session History Database & API**:
    *   Ensure all finished/completed study sessions (both solo and group) are correctly stored in the database (e.g., `study_sessions` or `session_participants` with finished status and actual duration).
    *   Expose helper functions in services (e.g., in `StudySessionsService` or `ProfileService`) to fetch the paginated history of a user's completed study sessions.

## 4. Bugs
- Clicking on a friend in the friend list does not show their profile page.
- When looking at someone's friends list, peopel that are still pending still have the 'add friend' symbol