# Profile Management System - StudySync

## Overview
The Profile module provides user profile management, profile stats display, session history, and account settings for logged-in users.

## Components & Structure
- **`src/components/profile/Profile.tsx`**: Main container component handling modals, profile data loading, and save mutations.
- **`src/components/profile/ProfileOverview.tsx`**: Display header showing avatar, display name, email, major, academic year, join date, and bio.
- **`src/components/profile/ProfileEditPopup.tsx`**: Modal popup for editing display name, email, major, academic year, bio, and avatar. Includes automatic client-side image compression (300x300 thumbnail).
- **`src/hooks/useProfileData.ts`**: TanStack Query hook managing fetching user profile data, stats, and recent activity.
- **`src/services/profile/`**: Service methods (`ProfileQueries`, `ProfileMutations`) interfacing with the Supabase `profiles` database table.

## Data Model (`profiles` table)
| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Profile record ID |
| `user_id` | UUID | Foreign key referencing `auth.users` |
| `display_name` | TEXT | User's preferred display name |
| `email` | TEXT | Email address |
| `major` | TEXT | Academic major (e.g., Computer Science) |
| `year` | TEXT | Academic year (e.g., 3rd Year) |
| `bio` | TEXT | Short biography text |
| `avatar_url` | TEXT | URL or Base64 Data URL to profile avatar image |
| `top_subjects` | TEXT[] | Selected study subjects |
| `study_hours` | INT | Total calculated study hours |

## Study Stats Architecture (Dashboard vs. Profile)

StudySync strictly separates short-term actionable goals from historical profile metrics. Gamified achievements and badges are **excluded** across the application in favor of clean numerical logs.

### 🏠 Dashboard Stats (Short-Term & Actionable)
- **Weekly Goal Progress Bars**: Hours & sessions completed this week vs. target.
- **Today's Focus Snapshot**: Today's focus hours & Pomodoro sessions count.
- **Current Active Streak**: Current consecutive daily study streak (e.g., `🔥 5 Days`).
- **30-Day Activity Heatmap**: Interactive activity grid showing recent daily study minutes.

### 👤 Profile Stats (Long-Term & Historical)
- **Lifetime Summary Counters**: Total cumulative hours, total lifetime sessions completed, and personal best streak record.
- **Subject Distribution Breakdown**: Time distribution across study subjects/courses (e.g., 40% CS, 30% Math).
- **Chronological Session History Log**: Detailed log of all past sessions (solo & group) with attached notes, dates, and durations.

## Workflow & Operations
1. **Fetching Profile**: `useProfileData` executes `ProfileService.getCurrentUser()`, fetching profile details including `major`, `year`, and `avatar_url`.
2. **Editing Profile**: Clicking "Edit" opens `ProfileEditPopup`, pre-filling fields for Name, Email, Major, Academic Year, Bio, and Avatar.
3. **Avatar Upload**: When selecting an image file, `compressImage` resizes and converts it to an optimized Data URL.
4. **Saving Changes**: Saving calls `ProfileService.updateProfile()`, persisting changes (including `avatar_url`) in Supabase and updating local React Query state.
