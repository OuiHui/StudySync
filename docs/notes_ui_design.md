# Notes Page UI Design & Architecture

## Overview

The Notes page provides a central hub for users to view, organize, search, filter, upload, and create study materials. The UI is designed as a structured data table with category pill filters, per-column filter popovers, sorting, and pagination controls.

---

## Component Architecture

```
src/components/notes/
├── Notes.tsx              — Main container component
├── NotesHeader.tsx        — Title, Upload/Create buttons, Search bar, Clear Filters, Sort dropdown
├── NotesFilterTabs.tsx    — Category tabs with live item count badges (All, My, Shared, Public, Group)
├── NotesTable.tsx         — Data table with header column filter popovers & row items
├── NotesPagination.tsx    — Footer pagination (< 1 2 3 >), range summary, and page size dropdown
├── NoteDialogs.tsx        — Edit, Create, Share, View modal dialogs
├── useNotes.ts            — State management hook for filtering, sorting, pagination, and API actions
└── UploadMaterialPopup.tsx— Modal popup for file upload to storage buckets
```

---

## Column Filtering & Control Systems

### 1. Shared Page Tabs & Query Parameter Persistence
The Notes page incorporates the shared `PageTabs` component directly below the page title with URL query parameter persistence (`?tab=...`) via `useTabQueryState`:
- **`My Notes`** (`tab=my-notes`): Notes created by the current user (`created_by === userId`). Default tab.
- **`Group Notes`** (`tab=group-notes`): Notes attached to or shared with study groups (`linkedGroup !== '—'`).

Each tab displays a live count badge representing matching notes. Reloading the page maintains the active tab selection.


### 2. Per-Column Filter Popovers
Each table column header contains a column filter button that opens a filter popover:
- **`Note Name`**: Text query filter for note titles and file names.
- **`Subject / Course`**: Select filter for subjects/course codes.
- **`Created By`**: Filter by creator ("You" vs specific creators).
- **`Linked Group`**: Filter by linked study group or personal notes.
- **`Visibility`**: Filter by permission level (`Private`, `Public`, `Group`).
- **`Date Created`**: Date sort & filter options.

### 3. Clear Filters Action
A dedicated **"Clear Filters"** button in `NotesHeader.tsx` activates whenever any column filter, category filter, or search term is applied. Clicking it resets all filter states to default with a single click.

### 4. Pagination & Sorting
- **Sorting**: Order by Newest, Oldest, Title (A-Z), Title (Z-A).
- **Pagination**: Configurable page size (5, 8, 10, 20 items per page) with page navigation buttons and a summary string (`Showing 1–8 of 56 notes`).

---

## Shared Note Modal State Management

`SharedNoteModal` (`src/components/notes/SharedNoteModal.tsx`) manages viewing and editing notes across Notes, Solo Study, and Group Study Sessions:

1. **Save Flow**:
   - `handleSave` executes `onSave(note.id, form)`.
   - On success, `note.title`, `note.content`, `note.subject`, and `note.permission_level` are directly updated on the note reference in addition to updating parent component `activeNote` state and calling `onNotesChange` / `loadNotes`.
   - This ensures view mode reflects the updated note content immediately without requiring a page refresh.

2. **Cancel Flow**:
   - `handleCancel` explicitly resets the form state (`setForm`) back to the original `note` properties (`title`, `subject`, `content`, `permission_level`) before setting `isEditing` to `false`.
   - `handleStartEdit` re-synchronizes the form state with current `note` properties when re-entering edit mode, preventing discarded changes from re-appearing.
