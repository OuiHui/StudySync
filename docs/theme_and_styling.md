# Theme and Styling Architecture

## Overview
StudySync utilizes a centralized full-platform theme system to manage dark/light modes, accent color schemes, canvas background gradients, modal popover colors, card surfaces, focus rings, and sidebar styling across the entire platform.

Theme presets alter the full UI experience (mode, background, modals, buttons, cards, inputs, sidebar). Standard Light and Dark themes are included as default theme presets ("Default Light" and "Default Dark").

## Theme Context & State Management
Theme state is managed globally by `ThemeContext` (`src/contexts/ThemeContext.tsx`):
- **`mode`**: Controls page surface theme (`'light' | 'dark' | 'system'`). Toggles the `.dark` class on `document.documentElement` and persists in `localStorage` (`ui-theme`).
- **`colorTheme`**: Controls full-platform theme preset configuration (`Theme` object with `id`, `name`, `mode`, `primary`, `secondary`, `gradient`, `background`, `card`, `popover`, `border`, `input`, `ring`, `sidebarBackground`, etc.). Persists in `localStorage` (`study-app-color-theme`).
- **CSS Custom Properties**: Upon theme change, `ThemeContext` automatically updates root CSS variables:
  - `--theme-primary`: Primary hex color.
  - `--theme-secondary`: Secondary hex color.
  - `--brand-primary`: HSL value string formatted for Tailwind CSS `bg-brand`, `text-brand`, `border-brand`.
  - `--brand-primary-hover`: Hover state HSL value.
  - `--background`, `--foreground`: Main page canvas colors.
  - `--card`, `--card-foreground`: Card and panel surface colors.
  - `--popover`, `--popover-foreground`: Modal, dialog, select, and popover background and text colors.
  - `--border`, `--input`, `--ring`: Border, input, and focus ring colors.
  - `--sidebar-background`, `--sidebar-foreground`, `--sidebar-border`: Navigation sidebar theme colors.

## Constants & Color Utilities
All theme definitions, presets, and color calculation utilities are centralized in:
`src/constants/theme.ts`

- **`DEFAULT_LIGHT_THEME`**: Default light platform theme (`Default Light`, `#2a78d6`).
- **`DEFAULT_DARK_THEME`**: Default dark platform theme (`Default Dark`, `#2a78d6`).
- **`DEFAULT_THEME`**: Default application theme (`DEFAULT_DARK_THEME`).
- **`COLOR_THEMES`**: Curated full-platform theme presets (Default Light, Default Dark, Ocean Blue, Emerald Green, Royal Purple, Sunset Orange, Rose Pink, Teal Cyan, Crimson Red, Slate Gray, Amber Gold).
- **`hexToHslString(hex)`**: Converts hex color codes (`#rrggbb`) to space-separated HSL strings (`"h s% l%"`) stored in Tailwind CSS CSS variables.
- **`adjustHexBrightness(hex, percent)`**: Adjusts hex color brightness for hover states.

## Color Customizer & Settings UI
- **`ColorCustomizer` (`src/components/common/settings/ColorCustomizer.tsx`)**: Popover available in the header bar providing full platform theme presets with live theme previews.
- **`AppearanceSettingsPopup` (`src/components/profile/AppearanceSettingsPopup.tsx`)**: Account Settings modal in Profile providing full platform theme selection (Default Light, Default Dark, and preset color themes).

## Dynamic Branding & UI Components
- **Tailwind `brand` Utility Classes**: All buttons, active sidebar tabs, dialog icons, focus rings, avatar fallbacks, and badges use dynamic Tailwind classes (`bg-brand`, `hover:bg-brand-hover`, `text-brand`, `border-brand`, `focus-visible:ring-brand`, `bg-brand/10`) linked to `--brand-primary` and `--brand-primary-hover` CSS variables.
- **Navigation Bar (`Sidebar.tsx`)**: Active navigation tab highlights dynamically update using `bg-brand text-white shadow-sm`.
- **Page Header & Action Placement**: Primary page action buttons are consistently placed in the top header bar on the right side opposite the page title (`PAGE_TITLE_CLASS`).
- **Segmented Control Toggles (`tabs.tsx`)**: Unified toggle styling (`bg-gray-100 dark:bg-gray-900/60` track with `border border-gray-200 dark:border-gray-700/60` container border) applied across sign-in/sign-up screen toggles and modal category switchers.

## Application to Pages & Sessions
- **Main Layout (`MainLayout.tsx`)**: Wraps application sub-views with the active theme background gradient and consumes `useTheme()` for unified color theme context.
- **Solo Study (`StudySession.tsx`)**: Uses theme constants to ensure solo study session background styling matches the overall application theme.
- **Group Study (`GroupStudySession.tsx`)**: Uses theme constants to ensure consistency across session views.

## Panel & Card Container Styling
- **Unified Card Fill & Border**: All major content cards and panel boxes strictly use panel card fill (`bg-card text-card-foreground`) paired with `border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl` to maintain visual consistency across all pages.

## Global Dark Mode Scrollbars
- **`color-scheme: dark`**: Explicitly declared on `.dark` in `src/index.css` to force native OS and browser UI scrollable containers to render in dark theme.
- **Custom Webkit & Firefox Scrollbars**:
  - Global `::-webkit-scrollbar` rules for `.dark` set track background to dark surface (`#12151e`) with dark slate thumb (`#334155`, hover `#475569`).
  - `.custom-scrollbar` utility class provides subtle dark trackless scrollbar thumbs (`rgba(100, 116, 139, 0.6)`, hover `rgba(148, 163, 184, 0.9)`) for modals, chat popups, markdown editors, and list scrollables.
  - Firefox support is enforced via `scrollbar-color: #334155 transparent` and `scrollbar-width: thin`.


