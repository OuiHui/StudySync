# Testing Document - StudySync

## 1. Testing Stack & Setup

StudySync implements a multi-tiered testing strategy:
*   **End-to-End (E2E) Testing**: Powered by **Playwright**, simulating user interactions directly in Chrome/Firefox/Webkit browsers, testing routes, database transactions, and interface state changes.
*   **Unit & Integration Testing**: Powered by **Vitest** and **Happy DOM**, testing logical methods, React hooks, utility classes, and rendering isolated components.

---

## 2. Core User Flows

### Flow A: Authentication & Session Initialization
*   **Goal**: Ensure users can sign up, sign in, log in anonymously as a Guest, and sign out, resulting in correct routing and database token cleanup.
*   **Path**: `/auth`

### Flow B: Dashboard Overview & Notifications
*   **Goal**: Check statistics widgets (study hours today/week, active groups, shared notes), and test notification panel visibility and the "Mark all read" action.
*   **Path**: `/`

### Flow C: Solo Pomodoro Timer
*   **Goal**: Verify timer starts, pauses, resets, and updates work/break periods correctly upon editing settings.
*   **Path**: `/solo-study`

### Flow D: Study Group Directory & Creation
*   **Goal**: Search and filter groups by subject or name, join/leave public groups, and submit new group configurations.
*   **Path**: `/browse-groups` & `/my-groups`

### Flow E: Collaborative Sessions
*   **Goal**: Allow hosts to create and edit study session goals, schedule dates, choose parent groups, and join live rooms.
*   **Path**: `/group-study-session` & `/available-sessions`

### Flow F: Notes Collaboration
*   **Goal**: Create notes, edit body/title, assign subjects, share with specific groups, and delete files.
*   **Path**: `/notes`

---

## 3. Implemented Tests

### A. E2E Tests (Playwright)
*   **[dashboard.spec.ts](tests/e2e/dashboard.spec.ts)**:
    *   Verifies redirection of unauthenticated users to `/auth`.
    *   Asserts welcome text and Guest login button existence.
*   **[flows.spec.ts](tests/e2e/flows.spec.ts)**:
    *   **Flow A Test**: Logs out a Guest user and verifies they return to `/auth`.
    *   **Flow B Test**: Checks dashboard statistic layout cards and verifies the notifications popup toggles.
    *   **Flow C Test**: Simulates solo study, updates the work timer to 30 minutes, starts it, pauses, and resets it.
    *   **Flow D Test**: Creates a test group named `'E2E Test Group'`, searches for it, and confirms it displays.
    *   **Flow E Test**: Creates an upcoming group study session named `'E2E Session'` scheduled for tomorrow.
    *   **Flow F Test**: Creates a note named `'E2E Test Note'`, asserts its presence in the notes grid, clicks delete, and verifies its removal.
    *   *Includes database teardown in `afterAll()` to remove E2E test data.*

### B. Unit & Integration Tests (Vitest)
*   **[profile.test.ts](src/services/profile.test.ts)**:
    *   Tests mathematical calculation of cumulative study hours.
    *   Validates streak calculation algorithms (consecutive days, double session days, days missed).
    *   Tests time formatting utility methods (`formatTimeAgo`, `parseTimeAgo`).
*   **[useTimer.test.tsx](src/hooks/useTimer.test.tsx)**:
    *   Tests local timer state changes and transitions.
*   **[CreateSessionDialog.test.tsx](src/components/study/CreateSessionDialog.test.tsx)**:
    *   Validates input forms and error indicators for scheduled group study sessions.

---

## 4. Components Using Mock/Local Data (Do Not Integration Test)

The following areas contain hard-coded values that are not integrated with the database. Tests should not expect remote synchronization from these components:

1.  **[FindFriendsPage.tsx](src/components/friends/FindFriendsPage.tsx)**: Friend request buttons only mutate React states in memory (`MOCK_PEOPLE`). They do not submit updates to the database.
2.  **[useNotes.ts](src/components/notes/useNotes.ts)**: Uses `mockNotes` array as fallback when user database return is empty. E2E tests should populate the database rather than testing static cards.
3.  **[GroupStudySession.tsx](src/components/study/GroupStudySession.tsx)**: Active session checklists (timer configurations, default topic values) contain fallback strings initialized locally.
