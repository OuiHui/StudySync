# In-Progress & TODO Document - StudySync

This document tracks completed systems, details current gaps, and lists future tasks to bring StudySync to a production-ready state.

---

## 1. Feature Progress

| Feature Area | Status | Notes |
| :--- | :--- | :--- |
| **Authentication** | [/] Partial | Supported via email login and guest login. Working to get O-auth |
| **Dashboard Stats** | [/] Partial | Displays study metrics and progress bars. |
| **Solo Study Goals** |[/] Partial | Checked local storage persistence (JSON under 'solo_study_goals' with id, title, completed fields). |
| **Group Timer Sync** | [/] Partial | Real-time broadcast sync controlled by session host. |
| **Profile - Personal Info** | [x] Partial | Edit bio, display name, and email details. |
| **Profile - Friends List** | [/] Partial | No friends lists are currently rendered on the profile view. |
| **Profile - Privacy Settings** | [/] Partial | UI popup exists, but state is not saved in database. |
| **Profile - Notification Settings**| [/] Partial | UI popup exists, but settings are not saved in database. |
| **Notifications System**          | [/] Partial | UI NotificationCenter modal exists with stubs; lacks DB table and backend connection. |
| **Group Session Layout** | [/] Partial | Workspace wraps poorly and overflows on average monitors. |
| **Group Member Limit Enforce**| [ ] Pending | Maximum members specified in group config is not validated on join. |
| **Editing Goals**| [ ] Pending | Should be able to add end date for goals that show up on calendar. |
| **Account Card Functionality** | [ ] Pending | Determine and implement required features for the bottom-left account card (UserMenu). |
| **Theme Customizer / Color Support** | [/] Partial | Custom themes can be selected, but custom colors only change background gradient; main components still default to blue/standard colors. |
| **Solo Study Note Integration** | [ ] Pending | Define note rendering/editing logic and user interaction in the solo study page. |
| **Study Group Page Redesign** | [ ] Pending | Redesign the study group page layout, usability, and design aesthetics. |
| **Dropdown Transitions** | [ ] Pending | Make all dropdown menus across the app have smooth entry/exit animations. |
| **Code Cleanup / Deduplication** | [ ] Pending | Refactor components and services to reduce duplicated/re-used code. |
| **Simulated User Testing Framework** | [/] Partial | Control stub bots via programmatic function calls and instant toggle login overlay in Dev mode. |



---

## 2. Unfinished Frontend Aspects

### A. Profile Page Integration ([Profile.tsx](src/components/profile/Profile.tsx))
*   **Show Friends list**: The profile page does not import or render the [FriendsSection](src/components/profile/FriendsSection.tsx) component. Needs to be embedded below the settings card.
*   **Notification settings persistence**: Link [NotificationSettingsPopup](src/components/profile/NotificationSettingsPopup.tsx) toggles to database profile configurations.

### B. Group Study Session Layout ([GroupStudySession.tsx](src/components/study/GroupStudySession.tsx))
*   **Height Constraints & Clipping**: The wrapper utilizes `h-[100vh]` and `overflow-hidden`. On laptops (e.g., 1080p screens), the combination of header, large timer circle, progress metrics, settings, goals, shared notes, and inline chat causes vertical clipping.
*   **Sidebar Responsive Scroll**: Need to add custom scroll overlays (`overflow-y-auto`) to individual sections (like Notes and Goals panels) so they scroll independently instead of stretching/clipping the page.
*   **Inline Chat Toggle Transition**: Smooth out the transition of the chat panel sliding in and out from the right sidebar.

### C. Sidebar Account Card ([Sidebar.tsx](src/components/common/layout/Sidebar.tsx))
*   **Define Account Card Functionalities**: Figure out what functionalities the account card in the bottom left will do. This includes specifying drop-down items (e.g., Settings menu connection, status/presence selection, or user details) and handling collapsed vs. expanded layouts.

### D. Color Theme Support / Customizer ([ColorCustomizer.tsx](src/components/common/settings/ColorCustomizer.tsx))
*   **Fully Support Custom Theme Colors**: Modify the app components (e.g., buttons, active sidebar items, progress bars, active icons, etc.) to use CSS custom properties (`--theme-primary`, `--theme-secondary`) or dynamic Tailwind class mapping rather than hardcoded `bg-blue-500`, `text-blue-600`, etc., so that selecting themes like "Forest Green" or "Sunset Orange" updates the entire application's primary/secondary colors.

### E. Heatmap in Dashboard
*   **GitHub Style**
*   **Add functionality to display data**

### F. Solo Study Note Integration ([StudySession.tsx](src/components/study/StudySession.tsx))
*   **Rendering & Editing Logic**: Determine how personal note rendering/editing components are integrated into solo study sessions.
*   **User Note Interaction**: Plan and build the user interaction flow for notes access and editing during solo study.

### G. Study Group Page Redesign ([GroupStudySession.tsx](src/components/study/GroupStudySession.tsx))
*   **Layout & Aesthetics Redesign**: Fully redesign the group study page to prevent overflow, optimize spatial layout of tools, and enhance the visual style.

### H. Global UI/UX Transitions
*   **Dropdown Transitions**: Implement entry/exit transition animations for all dropdown menus globally to ensure design polish.

### I. Code Quality & Refactoring
*   **Reduce Re-used Code**: Identify, consolidate, and eliminate duplicate logic/code patterns across the components and service files.


### K. Simulated User Testing Framework [/] Partial
*   **Missing Actions**: Will add more actions
*   **Dropdowns**: Existing lists don't fully show


---

## 3. Lacking Backend / Supabase Functionalities

1.  **Profiles Schema Additions**:
    *   Need to add JSON columns or structured columns to `public.profiles` for `notification_settings` to persist user choices made in settings popups.
2.  **Slow Query Times**:
    * Something is messed up here. Notes need to be cached.
3.  **Solo Study Sessions in Session History**:
    *  **Fixed**: `get_my_session_history` RPC was never applied to the live DB, so it silently returned `[]`. Replaced with a direct multi-step Supabase query in `getSessionHistory()` that fetches sessions by `created_by` or `session_participants` membership, filtered to ended statuses, then merges/deduplicates/paginates client-side.
4.  **Direct Messaging**: 
    *  Existing bug
