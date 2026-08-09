# In-Progress & TODO Document - StudySync

This document tracks completed systems, details current gaps, and lists future tasks to bring StudySync to a production-ready state.

---

## 1. Feature Progress

| Feature Area | Status | Notes |
| :--- | :--- | :--- |
| **Authentication** | [x] Complete | Email login, guest login, and Google OAuth enabled and functional. |
| **Dashboard Stats** | [/] Partial | Weekly goal progress bars and focus time snapshot implemented; pending 30-day activity heatmap & social presence. |
| **Profile Stats** | [/] Partial | Lifetime study hours & session history implemented; pending subject breakdown chart & personal best streak record. Achievements/Badges intentionally excluded. |
| **Solo Study Goals** | [/] Partial | Persisted in `localStorage` (`solo_study_goals`). Needs DB persistence & target date editing. |
| **Group Timer Sync** | [x] Complete | Real-time broadcast sync controlled by session host with database integration. |
| **Profile - Personal Info** | [x] Complete | Edit bio, display name, major, year, and avatar image. |
| **Profile - Friends List** | [/] Partial | `FriendsSection` component built, but not yet embedded on `Profile.tsx`. |
| **Profile - Privacy Settings** | [/] Partial | UI popup exists, but settings are not persisted in Supabase database. |
| **Profile - Notification Settings**| [/] Partial | UI popup exists, but toggles are not saved to database column/table. |
| **Notifications System** | [x] Complete | Database table, migration scripts, real-time channels, and NotificationCenter UI implemented. |
| **Group Session Layout** | [x] Complete | Resolved viewport vertical clipping on laptops/1080p screens with responsive flex container and inner scroll. |
| **Group Member Limit Enforce**| [x] Complete | Enforced via PostgreSQL database trigger (`tr_check_group_member_limit`). |
| **Editing Goals & Calendar** | [ ] Pending | Ability to set goal end/target dates and visualize on a calendar view. |
| **Account Card Functionality** | [/] Partial | `UserMenu` handles profile link, settings trigger, and logout; needs avatar URL binding. |
| **Theme Customizer / Color Support** | [/] Partial | Themes update background gradient; primary component colors still use hardcoded blue/indigo classes. |
| **Solo Study Note Integration** | [x] Complete | Integrated via `StudyMaterial` component allowing note viewing, creation, and modal editing. |
| **Study Group Page Redesign** | [/] Partial | Usability improved; workspace layout requires inner overflow-y scroll optimization. |
| **Dropdown Transitions** | [x] Complete | Shared dropdown transition wrapper implemented across select components. |
| **Notes Backend & Scalability** | [x] Complete | Base query service, query keys, optimistic updates, and response caching implemented. |
| **Simulated User Testing Framework** | [/] Partial | Dev bot control console active; dropdown lists and additional bot actions need expansion. |
| **Active Friends & Social Presence** | [ ] Pending | Dashboard widget showing online friends, active Pomodoro state (focus/break), and quick-join buttons. |

---

## 2. Unfinished Frontend & UX Aspects

### A. Profile Page Integration ([Profile.tsx](file:///c:/Users/Huy%20Nguyen/OneDrive%20-%20Georgia%20Institute%20of%20Technology/StudySync/src/components/profile/Profile.tsx))
* **Friends List Integration**: Import and render the [FriendsSection](file:///c:/Users/Huy%20Nguyen/OneDrive%20-%20Georgia%20Institute%20of%20Technology/StudySync/src/components/profile/FriendsSection.tsx) component directly on the profile view.
* **Notification Settings Persistence**: Wire up toggles in [NotificationSettingsPopup](file:///c:/Users/Huy%20Nguyen/OneDrive%20-%20Georgia%20Institute%20of%20Technology/StudySync/src/components/profile/NotificationSettingsPopup.tsx) to save user preferences in database profile configurations.
* **Avatar Image Binding in UserMenu**: Pass `userProfile.avatar_url` to the Avatar component in [UserMenu.tsx](file:///c:/Users/Huy%20Nguyen/OneDrive%20-%20Georgia%20Institute%20of%20Technology/StudySync/src/components/common/layout/UserMenu.tsx).

### B. Group Study Session Layout ([GroupStudySession.tsx](file:///c:/Users/Huy%20Nguyen/OneDrive%20-%20Georgia%20Institute%20of%20Technology/StudySync/src/components/study/GroupStudySession.tsx))
* **Height Constraints & Clipping**: The outer container utilizes `h-[100vh]` and `overflow-hidden`, causing header, timer, goals, notes, and inline chat to clip on 1080p/laptop displays.
* **Independent Inner Scroll**: Add custom scroll containers (`overflow-y-auto`) to individual sub-panels (notes, goals, sidebars) so components fit responsively without cutting off text.

### C. Theme Customizer / CSS Variables ([ColorCustomizer.tsx](file:///c:/Users/Huy%20Nguyen/OneDrive%20-%20Georgia%20Institute%20of%20Technology/StudySync/src/components/common/settings/ColorCustomizer.tsx))
* **CSS Custom Property Propagation**: Replace hardcoded Tailwind color utilities (e.g., `bg-blue-500`, `text-indigo-600`) in buttons, badges, and progress bars with `--theme-primary` / `--theme-secondary` CSS variables so selected color schemes update the entire application UI.

### D. Activity Heatmap in Dashboard ([Dashboard.tsx](file:///c:/Users/Huy%20Nguyen/OneDrive%20-%20Georgia%20Institute%20of%20Technology/StudySync/src/components/dashboard/Dashboard.tsx))
* **GitHub-Style Contribution Grid**: Build and render an interactive activity heatmap visualizing daily study minutes and completed sessions over time.

### E. Simulated User Testing Framework ([simulation.ts](file:///c:/Users/Huy%20Nguyen/OneDrive%20-%20Georgia%20Institute%20of%20Technology/StudySync/src/components/simulation/SimConsole.tsx))
* **Action Menu & Dropdown Expansion**: Expand bot action options and fix truncated dropdown options in the Dev Sim Console overlay.

### F. Active Friends & Social Presence Widget ([Dashboard.tsx](file:///c:/Users/Huy%20Nguyen/OneDrive%20-%20Georgia%20Institute%20of%20Technology/StudySync/src/components/dashboard/Dashboard.tsx))
* **Dashboard Presence Widget**: Display online friends, their real-time study/Pomodoro status (e.g. Focus / Break / In Group Session), and quick-join action buttons to enter public study sessions.

---

## 3. Lacking Backend / Database Functionalities

1. **Profiles Schema Settings Persistence**:
   * Add JSON or dedicated columns to `public.profiles` for `notification_settings` and `privacy_settings` to persist user choices made in settings popups.
2. **Solo Goals Table Migration**:
   * Migrate solo goals from browser `localStorage` (`solo_study_goals`) to a dedicated Supabase database table with user ID foreign keys and target end dates.
3. **Direct Messaging Edge Cases**:
   * Refine realtime DM unread tracking and conversation creation policies for edge-case friend status updates.
