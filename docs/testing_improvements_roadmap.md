# StudySync Testing Framework Improvement Roadmap

This document outlines the current state of the StudySync testing framework, identifies existing gaps, and details strategic improvements for unit, integration, E2E, and multi-user simulated testing.

---

## 1. Executive Summary & Current Architecture

StudySync currently uses a multi-tier testing setup:
1. **Unit & Component Integration Testing**: Built with **Vitest**, **Happy DOM**, and **React Testing Library**. Covers 25 test files across hooks (`useTimer`, `useTabQueryState`), components (`CreateSessionDialog`, `StudyTimer`, `MarkdownEditor`), and core services (`profile`, `notes`, `friends`).
2. **End-to-End (E2E) Browser Testing**: Built with **Playwright** (`playwright.config.ts`), running across Chromium, Firefox, and Webkit against a dev server. Uses `auth.setup.ts` for authenticated storage state and `scripts/cleanup-e2e.js` for database teardown.
3. **Simulated User Testing Framework**: Accessible in development mode (`window.simulation`), allowing programmatic and bot-driven multi-user interactions (using 10 seeded database accounts with `persistSession: false` auxiliary Supabase clients).

---

## 2. Key Gaps & Optimization Opportunities

### Priority 1: Automated E2E Multi-User Realtime Testing
* **Current State**: Realtime features (collaborative session sync, live chat, notifications) are tested manually or using the developer UI console (`window.simulation`). Playwright tests execute within a single user browser context.
* **Proposed Enhancement**: Bridge Playwright with `window.simulation`. In Playwright E2E tests, invoke bot actions programmatically via page evaluation (`await page.evaluate(() => window.simulation.bot('u2').sendGroupMessage(...))`). Assert that the primary user UI updates automatically via Supabase Realtime subscriptions.

### Priority 2: Standardization of Network Mocks with MSW (Mock Service Worker)
* **Current State**: Vitest component tests rely on ad-hoc `vi.fn()` Supabase client mocks or local fallback data arrays (`mockNotes`, `MOCK_PEOPLE`), resulting in `act(...)` warning noise and duplication across test files.
* **Proposed Enhancement**: Implement **MSW (Mock Service Worker)** for Node and browser test environments. MSW will intercept Supabase REST endpoints (`/rest/v1/*`) and Realtime WebSockets at the network level, providing clean, reusable handlers across component tests.

### Priority 3: Custom Playwright Fixtures & Isolated Teardown
* **Current State**: Playwright configuration uses sequential execution (`workers: 1`) and relies on global cleanup scripts (`scripts/cleanup-e2e.js`) searching for hardcoded entity prefixes (`E2E Test Group`).
* **Proposed Enhancement**: Implement custom Playwright fixtures:
  ```typescript
  export const test = base.extend<{ testGroup: Group; testSession: Session }>({
    testGroup: async ({ page }, use) => {
      const group = await createTestGroup();
      await use(group);
      await deleteTestGroup(group.id);
    }
  });
  ```
  This guarantees test isolation, enables parallel test execution (`fullyParallel: true`), and prevents orphaned database records upon test failures.

### Priority 4: Code Coverage Metrics & CI Quality Gates
* **Current State**: No test coverage provider configured in `vitest.config.ts`.
* **Proposed Enhancement**: Integrate `@vitest/coverage-v8`:
  - Add script: `"test:coverage": "vitest run --coverage"`
  - Set baseline threshold (e.g. 80% coverage for `src/services/` and `src/hooks/`).

### Priority 5: Visual Regression Testing
* **Current State**: CSS themes, dark mode toggles, and dynamic glassmorphism UI are tested only by checking DOM element presence, not visual layout accuracy.
* **Proposed Enhancement**: Leverage Playwright snapshot testing (`expect(page).toHaveScreenshot()`) for key components:
  - Dashboard overview & widgets
  - Pomodoro Timer ring & active session controls
  - Theme customizer & color palettes

### Priority 6: React `act(...)` & Accessibility Warning Remediation
* **Current State**: Unit test runs emit React state update warnings (`act(...)`) in `SessionNotes`, `CreateSessionDialog`, and `StudyProgress`, along with missing Radix UI dialog accessible descriptions.
* **Proposed Enhancement**: Update async component tests to use React Testing Library's `waitFor()` and `userEvent`, and add `<DialogDescription>` to Radix UI dialog contents.

---

## 3. Implementation Roadmap

| Phase | Milestone | Key Deliverables |
| :--- | :--- | :--- |
| **Phase 1** | **Coverage & Warning Cleanup** | Enable `@vitest/coverage-v8`, fix `act(...)` warnings in existing Vitest suite, add accessible dialog descriptions. |
| **Phase 2** | **MSW Network Layer Mocks** | Setup MSW server in `src/test/setup.ts`, replace custom Supabase inline mocks with MSW request handlers. |
| **Phase 3** | **Playwright Fixtures & Isolation** | Refactor `tests/e2e/flows.spec.ts` to use scoped Playwright fixtures and enable multi-worker parallel E2E runs. |
| **Phase 4** | **E2E + Simulation Integration** | Create automated multi-user E2E tests driving background bots via `window.simulation` to test real-time chat and notifications. |
| **Phase 5** | **Visual Regression Suite** | Add snapshot baselines for major UI pages (Dashboard, Solo Study, Group Session) in dark and light themes. |
