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
- **`COLOR_THEMES`**: List of all selectable light and dark theme presets used by `ColorCustomizer`.
- **`DEFAULT_PAGE_BACKGROUND`**: Default background gradient class applied across standard page layouts (`from-background to-muted dark:from-background dark:to-muted`).
- **`WORK_TIMER_BACKGROUND`**: Dynamic background gradient activated during active work timer sessions.
- **`BREAK_TIMER_BACKGROUND`**: Dynamic background gradient activated during active break timer sessions.
- **`getPageBackgroundGradient(globalTimer)`**: Utility function calculating the appropriate background gradient based on timer status and selected theme.

## Application to Buttons & Navigation
- **Navigation Bar (`Sidebar.tsx`)**: Uses `#2a78d6` (`bg-[#2a78d6] text-white shadow-sm`) for active navigation tab highlights.
- **Create Action Buttons**: All 'Create' and 'New' action buttons (`Create Group`, `Create Session`, `Create New Note`, `New Chat`, etc.) consistently use the `#2a78d6` (`bg-[#2a78d6] hover:bg-[#2268bc]`) brand styling.

## Application to Pages & Sessions
- **Main Layout (`MainLayout.tsx`)**: Wraps application sub-views with the active theme background gradient.
- **Solo Study (`StudySession.tsx`)**: Uses theme constants to ensure solo study session background styling matches the overall application theme.
- **Group Study (`GroupStudySession.tsx`)**: Uses theme constants to ensure consistency across session views.
