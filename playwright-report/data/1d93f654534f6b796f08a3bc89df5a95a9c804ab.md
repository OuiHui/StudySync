# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows.spec.ts >> StudySync E2E User Flows >> Flow C: Solo Pomodoro Study Session
- Location: tests\e2e\flows.spec.ts:70:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1').filter({ hasText: 'Study Session' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h1').filter({ hasText: 'Study Session' })

```

```yaml
- region "Notifications (F8)":
  - list
- heading "StudySync" [level=1]
- paragraph: Collaborative Learning
- button:
  - img
- navigation:
  - list:
    - listitem:
      - button "Dashboard":
        - img
        - text: Dashboard
    - listitem:
      - button "Solo Study":
        - img
        - text: Solo Study
    - listitem:
      - button "Group Sessions":
        - img
        - text: Group Sessions
    - listitem:
      - button "My Groups":
        - img
        - text: My Groups
    - listitem:
      - button "Browse Groups":
        - img
        - text: Browse Groups
    - listitem:
      - button "Notes":
        - img
        - text: Notes
    - listitem:
      - button "Find Friends":
        - img
        - text: Find Friends
    - listitem:
      - button "Profile":
        - img
        - text: Profile
- text: Account
- button "U"
- main:
  - heading "Solo Study Session" [level=2]
  - text: "Subject: Solo Study Start: 07:43 PM Est. End: 11:43 PM"
  - heading "Work Session" [level=3]
  - img
  - text: 25:00 work time
  - button "start":
    - img
    - text: start
  - button "Reset timer":
    - img
  - heading "Today's Progress" [level=3]
  - text: "0 Sessions Completed Goal: 8 sessions"
  - button:
    - img
  - heading "Timer Configuration" [level=3]
  - button:
    - img
  - text: Work Duration 25 min Break Duration 5 min Long Break 15 min
  - heading "Today's Study Goals" [level=3]:
    - img
    - text: Today's Study Goals
  - checkbox "Review lecture notes"
  - text: Review lecture notes
  - button:
    - img
  - checkbox "Solve practice problems"
  - text: Solve practice problems
  - button:
    - img
  - textbox "Add a new goal..."
  - button [disabled]:
    - img
  - heading "Study Materials" [level=3]
  - button "New Note":
    - img
    - text: New Note
  - button "CS 1332 1 note":
    - text: CS 1332 1 note
    - img
  - button "Operating Systems 2 notes":
    - text: Operating Systems 2 notes
    - img
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { createClient } from '@supabase/supabase-js';
  3   | import * as fs from 'fs';
  4   | 
  5   | test.describe('StudySync E2E User Flows', () => {
  6   |   test.beforeEach(async ({ page }) => {
  7   |     await page.goto('/');
  8   |     
  9   |     // Wait for either dashboard to load or auth page/guest button to be visible
  10  |     const guestBtn = page.getByRole('button', { name: 'Continue as Guest' });
  11  |     const dashboardHeader = page.locator('h1', { hasText: 'Dashboard' });
  12  |     
  13  |     await Promise.race([
  14  |       guestBtn.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
  15  |       dashboardHeader.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
  16  |     ]);
  17  |     
  18  |     if (await guestBtn.isVisible()) {
  19  |       await guestBtn.click();
  20  |     }
  21  | 
  22  |     // Assert we land on the dashboard
  23  |     await expect(dashboardHeader).toBeVisible({ timeout: 15000 });
  24  |   });
  25  | 
  26  |   test('Flow A: Authentication & Sign Out', async ({ page }) => {
  27  |     // We are already authenticated as Guest from beforeEach.
  28  |     // Let's test signing out.
  29  |     // Click on the user profile button (avatar in sidebar footer)
  30  |     const profileBtn = page.locator('button.relative.h-8.w-8.rounded-full');
  31  |     await expect(profileBtn).toBeVisible();
  32  |     await profileBtn.click();
  33  | 
  34  |     // Click Log out button
  35  |     const logoutBtn = page.getByRole('menuitem', { name: 'Log out' });
  36  |     await expect(logoutBtn).toBeVisible();
  37  |     await logoutBtn.click();
  38  | 
  39  |     // Verify redirected back to the auth page
  40  |     await expect(page).toHaveURL(/.*#\/auth/);
  41  |   });
  42  | 
  43  |   test('Flow B: Dashboard Overview & Notification Management', async ({ page }) => {
  44  |     // Check dashboard statistic cards
  45  |     await expect(page.getByText('Study Hours This Week')).toBeVisible();
  46  |     await expect(page.getByText('Sessions Completed')).toBeVisible();
  47  |     
  48  |     // Open notifications popover
  49  |     const notifBtn = page.getByRole('button', { name: /Notifications/i });
  50  |     await expect(notifBtn).toBeVisible();
  51  |     await notifBtn.click();
  52  | 
  53  |     // Check if dialog/popover is visible
  54  |     await expect(page.locator('h3', { hasText: 'Notifications' })).toBeVisible();
  55  | 
  56  |     // If there is a Mark all read button, click it
  57  |     const markAllReadBtn = page.getByRole('button', { name: 'Mark all read' });
  58  |     if (await markAllReadBtn.isVisible()) {
  59  |       await markAllReadBtn.click();
  60  |     }
  61  | 
  62  |     // Close notifications popover
  63  |     const closeBtn = page.locator('button:has(svg.lucide-x)');
  64  |     await closeBtn.click();
  65  | 
  66  |     // Popover should be hidden
  67  |     await expect(page.locator('h3', { hasText: 'Notifications' })).not.toBeVisible();
  68  |   });
  69  | 
  70  |   test('Flow C: Solo Pomodoro Study Session', async ({ page }) => {
  71  |     // Navigate to Solo Study
  72  |     await page.getByRole('button', { name: 'Solo Study' }).click();
> 73  |     await expect(page.locator('h1', { hasText: 'Study Session' })).toBeVisible();
      |                                                                    ^ Error: expect(locator).toBeVisible() failed
  74  | 
  75  |     // Timer defaults to 25:00
  76  |     await expect(page.getByText('25:00')).toBeVisible();
  77  | 
  78  |     // Click settings edit button
  79  |     const settingsBtn = page.getByRole('button', { name: 'Settings', exact: true });
  80  |     if (await settingsBtn.isVisible()) {
  81  |       await settingsBtn.click();
  82  |       
  83  |       // Update durations
  84  |       const workInput = page.locator('input#work-duration');
  85  |       if (await workInput.isVisible()) {
  86  |         await workInput.fill('30');
  87  |         await page.getByRole('button', { name: 'Save Settings', exact: true }).click();
  88  |         await expect(page.getByText('30:00')).toBeVisible();
  89  |       }
  90  |     }
  91  | 
  92  |     // Click Start
  93  |     const startBtn = page.getByRole('button', { name: 'Start' });
  94  |     await expect(startBtn).toBeVisible();
  95  |     await startBtn.click();
  96  | 
  97  |     // Verify button changes to Pause
  98  |     await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  99  | 
  100 |     // Click Reset
  101 |     const resetBtn = page.getByRole('button', { name: 'Reset' });
  102 |     await expect(resetBtn).toBeVisible();
  103 |     await resetBtn.click();
  104 | 
  105 |     // Timer returns to initial paused state
  106 |     await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  107 |   });
  108 | 
  109 |   test('Flow D: Study Group Directory & Membership', async ({ page }) => {
  110 |     // Navigate to Browse Groups
  111 |     await page.getByRole('button', { name: 'Browse Groups' }).click();
  112 |     await expect(page.locator('h1', { hasText: 'Browse Study Groups' })).toBeVisible();
  113 | 
  114 |     // Perform a search query
  115 |     const searchInput = page.getByPlaceholder('Search groups by name or description...');
  116 |     await expect(searchInput).toBeVisible();
  117 |     await searchInput.fill('Calculus');
  118 | 
  119 |     // Create a group
  120 |     const createGroupBtn = page.getByRole('button', { name: 'Create Group' });
  121 |     await expect(createGroupBtn).toBeVisible();
  122 |     await createGroupBtn.click();
  123 | 
  124 |     // Fill Create Group form
  125 |     await page.locator('input#name').fill('E2E Test Group');
  126 |     await page.locator('input#subject').fill('Computer Science');
  127 |     await page.locator('textarea#description').fill('A temporary group created by Playwright E2E tests.');
  128 |     
  129 |     // Submit Create Group
  130 |     await page.getByRole('button', { name: 'Create Group', exact: true }).click();
  131 | 
  132 |     // Wait for dialog to close
  133 |     await expect(page.getByText('Create Study Group')).not.toBeVisible();
  134 | 
  135 |     // Search for our newly created group
  136 |     await searchInput.fill('E2E Test Group');
  137 |     await expect(page.getByText('E2E Test Group').first()).toBeVisible({ timeout: 10000 });
  138 |   });
  139 | 
  140 |   test('Flow E: Collaborative & Planned Study Sessions', async ({ page }) => {
  141 |     // Navigate to Group Sessions
  142 |     await page.getByRole('button', { name: 'Group Sessions' }).click();
  143 |     await expect(page.locator('h1', { hasText: 'Study Sessions' })).toBeVisible();
  144 | 
  145 |     // Open Create Session Dialog
  146 |     const createSessionBtn = page.getByRole('button', { name: 'Create Session' });
  147 |     await expect(createSessionBtn).toBeVisible();
  148 |     await createSessionBtn.click();
  149 | 
  150 |     // Fill out form
  151 |     await page.locator('input#title').fill('E2E Session');
  152 |     await page.locator('textarea#description').fill('Let\'s study together!');
  153 |     
  154 |     // Select dates (tomorrow)
  155 |     const tomorrow = new Date();
  156 |     tomorrow.setDate(tomorrow.getDate() + 1);
  157 |     const startStr = tomorrow.toISOString().slice(0, 16);
  158 |     tomorrow.setHours(tomorrow.getHours() + 2);
  159 |     const endStr = tomorrow.toISOString().slice(0, 16);
  160 | 
  161 |     await page.locator('input#scheduledStart').fill(startStr);
  162 |     await page.locator('input#scheduledEnd').fill(endStr);
  163 | 
  164 |     // Submit Create Session
  165 |     await page.getByRole('button', { name: 'Create Session', exact: true }).click();
  166 | 
  167 |     // Verify session card appears under upcoming/available sessions
  168 |     await expect(page.getByText('E2E Session').first()).toBeVisible({ timeout: 10000 });
  169 |   });
  170 | 
  171 |   test('Flow F: Study Notes & Shared Documents', async ({ page }) => {
  172 |     // Navigate to Notes
  173 |     await page.getByRole('button', { name: 'Notes' }).click();
```