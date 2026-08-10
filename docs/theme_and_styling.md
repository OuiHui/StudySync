# Theme and Styling Architecture

## Overview
StudySync utilizes a centralized theme system to manage color schemes, background gradients, and page container styling across the application.

## Constants Location
All theme definitions, color options, and default page background styles are centralized in:
`src/constants/theme.ts`

## Key Constants & Functions
- **`DEFAULT_THEME`**: Default application color theme (`Default Blue`).
- **`BRAND_PRIMARY`**: Standard brand blue color (`#2a78d6`) used for create buttons, active navbar indicators, and primary action triggers.
- **`BRAND_PRIMARY_HOVER`**: Standard brand blue hover state (`#2268bc`).
- **`BRAND_BUTTON_CLASS`**: Utility class string (`bg-[#2a78d6] hover:bg-[#2268bc] text-white`) applied consistently across action buttons.
- **`PAGE_TITLE_CLASS`**: Standardized page header title class string (`text-3xl font-bold text-gray-800 dark:text-white`) matching the Group Sessions header styling applied across all main application pages.
- **`COLOR_THEMES`**: List of all selectable light and dark theme presets used by `ColorCustomizer`.
- **`DEFAULT_PAGE_BACKGROUND`**: Default background gradient class applied across standard page layouts (`from-background to-muted dark:from-background dark:to-muted`).
- **`WORK_TIMER_BACKGROUND`**: Dynamic background gradient activated during active work timer sessions.
- **`BREAK_TIMER_BACKGROUND`**: Dynamic background gradient activated during active break timer sessions.
- **`getPageBackgroundGradient(globalTimer)`**: Utility function calculating the appropriate background gradient based on timer status and selected theme.

## Application to Buttons & Navigation
- **Navigation Bar (`Sidebar.tsx`)**: Uses `#2a78d6` (`bg-[#2a78d6] text-white shadow-sm`) for active navigation tab highlights.
- **Page Header & Action Placement**: Primary page action buttons (e.g. `Create Group`, `Upload Note`, `Create New Note`) are consistently placed in the top header bar on the right side opposite the page title (`PAGE_TITLE_CLASS`). Top-level sub-navigation tabs use `PageTabs.tsx` (`src/components/common/navigation/PageTabs.tsx`) positioned below the header row.
- **Segmented Control Toggles (`tabs.tsx`)**: Unified toggle styling (`bg-gray-100 dark:bg-gray-900/60` track with `border border-gray-200 dark:border-gray-700/60` container border, active tab `bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-semibold shadow-sm`) applied across sign-in/sign-up screen toggles and modal category switchers for a consistent visual identity.

## Application to Pages & Sessions
- **Main Layout (`MainLayout.tsx`)**: Wraps application sub-views with the active theme background gradient.
- **Solo Study (`StudySession.tsx`)**: Uses theme constants to ensure solo study session background styling matches the overall application theme.
- **Group Study (`GroupStudySession.tsx`)**: Uses theme constants to ensure consistency across session views.

## Panel & Card Container Styling
- **Unified Card Fill & Border**: All major content cards and panel boxes (including Profile Overview, Session History, Account Settings, Friends lists, Dashboard cards, and Group cards) strictly use the panel card fill (`bg-card text-card-foreground`) paired with `border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl` to maintain visual consistency across all pages.

## Page & Tab Transitions
- **Tab/Page Entrance Animations**: Page container components utilize `.animate-fade-in` (`src/App.css`). Entrance animations are set to `animation: none` to ensure instant tab switching without transition delay or motion effect.

## Global Dark Mode Scrollbars
- **`color-scheme: dark`**: Explicitly declared on `.dark` in `src/index.css` to force native OS and browser UI scrollable containers to render in dark theme.
- **Custom Webkit & Firefox Scrollbars**:
  - Global `::-webkit-scrollbar` rules for `.dark` set track background to dark surface (`#12151e`) with dark slate thumb (`#334155`, hover `#475569`).
  - `.custom-scrollbar` utility class provides subtle dark trackless scrollbar thumbs (`rgba(100, 116, 139, 0.6)`, hover `rgba(148, 163, 184, 0.9)`) for modals, chat popups, markdown editors, and list scrollables.
  - Firefox support is enforced via `scrollbar-color: #334155 transparent` and `scrollbar-width: thin`.

