# Codebase Restructuring Guide

This document tracks the restructuring of the StudySync codebase to adhere to SOLID principles and maintain a maximum file size of 200 lines.

## 1. Directory Structure

The application has been restructured to group code by feature/page:

- `src/pages/Dashboard/`: Dashboard page and subcomponents.
- `src/pages/SoloStudy/`: Solo study session components.
- `src/pages/GroupSessions/`: Group study session components.
- `src/pages/MyGroups/`: User's enrolled groups.
- `src/pages/BrowseGroups/`: Browsing available groups.
- `src/pages/Notes/`: Collaborative notes feature.
- `src/pages/Profile/`: User profile and settings.
- `src/layouts/`: Global layouts, including the `MainLayout` with Sidebar and Timer.
- `src/contexts/`: React Contexts for global state management.

## 2. Extracted Contexts

To adhere to the Single Responsibility Principle, global state previously housed in `Index.tsx` has been moved to separate context providers:

- **GlobalTimerContext**: Manages the global study timer state.
- **GroupEnrollmentContext**: Manages the user's group enrollments.
- **NotificationContext**: Manages notification state.
- **SessionContext**: Manages active session state (e.g., solo vs group sessions, joining/leaving dialogs).

## 3. Large File Refactoring Strategy

Any file exceeding 200 lines should be broken down into smaller components. Common strategies include:
- **Extracting Subcomponents**: Large `render` methods or conditional rendering blocks should be moved to their own files.
- **Custom Hooks**: Complex `useEffect` or state logic should be extracted into custom hooks (e.g., `useTimer.ts`, `useGroupData.ts`).
- **Splitting Sub-features**: If a component handles multiple tabs or distinct sections (like the Profile page or Auth page), split each section into its own component file.

## Ongoing Work

Please keep this document updated if new architectural decisions are made or new contexts are added.
