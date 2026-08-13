import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

test.describe('StudySync E2E User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for either dashboard to load or auth page/guest button to be visible
    const guestBtn = page.getByRole('button', { name: 'Continue as Guest' });
    const dashboardHeader = page.locator('h1', { hasText: 'Dashboard' });
    
    await Promise.race([
      guestBtn.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
      dashboardHeader.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
    ]);
    
    if (await guestBtn.isVisible()) {
      await guestBtn.click();
    }

    // Assert we land on the dashboard
    await expect(dashboardHeader).toBeVisible({ timeout: 15000 });
  });

  test('Flow A: Authentication & Sign Out', async ({ page }) => {
    // We are already authenticated as Guest from beforeEach.
    // Let's test signing out.
    // Click on the user profile button (avatar in sidebar footer)
    const profileBtn = page.locator('button.relative.h-8.w-8.rounded-full');
    await expect(profileBtn).toBeVisible();
    await profileBtn.click();

    // Click Log out button
    const logoutBtn = page.getByRole('menuitem', { name: 'Log out' });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Verify redirected back to the auth page
    await expect(page).toHaveURL(/.*#\/auth/);
  });

  test('Flow B: Dashboard Overview & Notification Management', async ({ page }) => {
    // Check dashboard statistic cards
    await expect(page.getByText('Study Hours This Week')).toBeVisible();
    await expect(page.getByText('Sessions Completed')).toBeVisible();
    
    // Open notifications popover
    const notifBtn = page.getByRole('button', { name: /Notifications/i });
    await expect(notifBtn).toBeVisible();
    await notifBtn.click();

    // Check if dialog/popover is visible
    await expect(page.locator('h3', { hasText: 'Notifications' })).toBeVisible();

    // If there is a Mark all read button, click it
    const markAllReadBtn = page.getByRole('button', { name: 'Mark all read' });
    if (await markAllReadBtn.isVisible()) {
      await markAllReadBtn.click();
    }

    // Close notifications popover
    const closeBtn = page.getByRole('button', { name: 'Close notifications' });
    await closeBtn.click();

    // Popover should be hidden
    await expect(page.locator('h3', { hasText: 'Notifications' })).not.toBeVisible();
  });

  test('Flow C: Solo Pomodoro Study Session', async ({ page }) => {
    // Navigate to Solo Study
    await page.getByRole('button', { name: 'Solo Study' }).click();
    await expect(page.locator('h1', { hasText: 'Study Session' })).toBeVisible();

    // Timer defaults to 25:00
    await expect(page.getByText('25:00')).toBeVisible();

    // Click settings edit button
    const settingsBtn = page.getByRole('button', { name: 'Settings', exact: true });
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      
      // Update durations
      const workInput = page.locator('input#work-duration');
      if (await workInput.isVisible()) {
        await workInput.fill('30');
        await page.getByRole('button', { name: 'Save Settings', exact: true }).click();
        await expect(page.getByText('30:00')).toBeVisible();
      }
    }

    // Click Start
    const startBtn = page.getByRole('button', { name: 'Start' });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Verify button changes to Pause
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

    // Click Reset
    const resetBtn = page.getByRole('button', { name: 'Reset' });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // Timer returns to initial paused state
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  });

  test('Flow D: Study Group Directory & Membership', async ({ page }) => {
    // Navigate to the Groups page via sidebar, then switch to the Browse Groups tab
    await page.getByRole('button', { name: 'Study Groups' }).click();
    await page.getByRole('button', { name: 'Browse Groups' }).click();
    await expect(page.locator('h1', { hasText: 'Study Groups' })).toBeVisible();

    // Perform a search query
    const searchInput = page.getByPlaceholder(/Search groups by name/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Calculus');

    // Create a group
    const createGroupBtn = page.getByRole('button', { name: 'Create Group' });
    await expect(createGroupBtn).toBeVisible();
    await createGroupBtn.click();

    // Fill Create Group form
    await page.locator('input#name').fill('E2E Test Group');
    await page.locator('input#course').fill('Computer Science');
    await page.locator('textarea#description').fill('A temporary group created by Playwright E2E tests.');
    
    // Submit Create Group
    await page.locator('div[role="dialog"]').getByRole('button', { name: 'Create Group', exact: true }).click();

    // Wait for dialog to close and page reload if triggered
    await expect(page.getByRole('heading', { name: 'Create Study Group' })).not.toBeVisible();
    await page.waitForLoadState('domcontentloaded');

    // Switch to "My Groups" tab where created group resides
    await page.getByRole('button', { name: 'My Groups' }).click();
    const myGroupsSearchInput = page.getByPlaceholder(/Search.*by name/i);
    await expect(myGroupsSearchInput).toBeVisible();
    await myGroupsSearchInput.fill('E2E Test Group');
    await expect(page.getByText('E2E Test Group').first()).toBeVisible({ timeout: 15000 });
  });

  test('Flow E: Collaborative & Planned Study Sessions', async ({ page }) => {
    // Navigate to Group Sessions
    await page.getByRole('button', { name: 'Group Sessions' }).click();
    await expect(page.locator('h1', { hasText: 'Study Sessions' })).toBeVisible();

    // Open Create Session Dialog
    const createSessionBtn = page.getByRole('button', { name: 'Create Session' });
    await expect(createSessionBtn).toBeVisible();
    await createSessionBtn.click();

    const testSessionTitle = `E2E Session ${Date.now()}`;

    // Fill out form
    await page.locator('input#title').fill(testSessionTitle);
    await page.locator('textarea#description').fill('Let\'s study together!');
    
    // Select dates (tomorrow in local time)
    const now = new Date();
    const start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    const pad = (n: number) => String(n).padStart(2, '0');
    const startStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T${pad(start.getHours())}:${pad(start.getMinutes())}`;
    const endStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`;

    await page.locator('input#scheduledStart').fill(startStr);
    await page.locator('input#scheduledEnd').fill(endStr);

    // Make public so session is visible in available sessions list
    const publicSwitch = page.locator('button#isPublic');
    await expect(publicSwitch).toBeVisible();
    if (await publicSwitch.getAttribute('data-state') === 'unchecked') {
      await publicSwitch.click();
      await expect(publicSwitch).toHaveAttribute('data-state', 'checked');
    }

    // Submit Create Session
    const submitBtn = page.locator('div[role="dialog"]').getByRole('button', { name: 'Create Session', exact: true });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify success toast notification and wait for dialog to close
    await expect(page.getByText('Study session created successfully!', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h2, h3', { hasText: 'Create Study Session' })).not.toBeVisible();
    await page.waitForTimeout(500);

    // Verify session card appears under upcoming/available sessions
    const sessionCardText = page.getByText(testSessionTitle).first();
    await sessionCardText.scrollIntoViewIfNeeded();
    await expect(sessionCardText).toBeVisible({ timeout: 15000 });
  });

  test('Flow F: Study Notes & Shared Documents', async ({ page }) => {
    const testNoteTitle = `E2E Test Note ${Date.now()}`;

    // Navigate to Notes
    await page.getByRole('button', { name: 'Notes', exact: true }).click();
    await expect(page.locator('h1', { hasText: /Notes|Study Materials/i })).toBeVisible();

    // Open Create Note Dialog
    const createNoteBtn = page.getByRole('button', { name: 'Create New Note' }).or(page.getByRole('button', { name: 'Create Note' })).first();
    await expect(createNoteBtn).toBeVisible();
    await createNoteBtn.click();

    // Fill Create Note Form
    await page.locator('input#note-title').fill(testNoteTitle);
    await page.locator('[contenteditable]').fill('This is note content written by E2E test.');

    // Save note inside modal
    await page.getByRole('button', { name: 'Create Note', exact: true }).click();

    // Wait for Create Note dialog to close and data refetch to settle
    await expect(page.locator('h2, h3', { hasText: 'Create New Note' })).not.toBeVisible();
    await page.waitForTimeout(500);

    // Filter search for created note to handle pagination
    const searchNotesInput = page.getByPlaceholder('Search notes by name, subject, or creator...');
    await expect(searchNotesInput).toBeVisible();
    await searchNotesInput.fill(testNoteTitle);

    // Assert note row exists in table
    const noteRow = page.locator('tr', { hasText: testNoteTitle }).first();
    await expect(noteRow).toBeVisible({ timeout: 15000 });

    // Delete Note via row actions dropdown
    const actionsBtn = noteRow.locator('button').last();
    await actionsBtn.click();

    // Click Delete in dropdown menu
    const deleteMenuItem = page.getByRole('menuitem', { name: 'Delete' }).first();
    await expect(deleteMenuItem).toBeVisible({ timeout: 10000 });
    await deleteMenuItem.click();

    // Verify note is deleted
    await expect(page.getByText(testNoteTitle).first()).not.toBeVisible({ timeout: 15000 });
  });

  test.afterAll(async () => {
    const SUPABASE_URL = "https://yysdestjdzdmulgatmpc.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5c2Rlc3RqZHpkbXVsZ2F0bXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5OTM3ODUsImV4cCI6MjA2NDU2OTc4NX0.SQzWV9Vd72zC8J6sSIPsKSsQp90Jte3e_lCMy7eb9_M";
    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

    const authFile = 'playwright/.auth/user.json';
    if (fs.existsSync(authFile)) {
      try {
        const state = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
        const origin = state.origins?.find((o: any) => 
          o.localStorage?.some((item: any) => item.name.startsWith('sb-') && item.name.endsWith('-auth-token'))
        );
        if (origin) {
          const tokenItem = origin.localStorage.find((item: any) => 
            item.name.startsWith('sb-') && item.name.endsWith('-auth-token')
          );
          const tokenData = JSON.parse(tokenItem.value);
          const access_token = tokenData.access_token;
          const refresh_token = tokenData.refresh_token;
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
            console.log('Teardown authenticated successfully using stored session.');
          }
        }
      } catch (e) {
        console.warn('Teardown failed to authenticate using stored session:', e);
      }
    }

    console.log('Cleaning up E2E Test Group, E2E Session, and E2E Notes via RPC...');
    const { error: rpcError } = await supabase.rpc('cleanup_e2e_data');
    if (rpcError) {
      console.warn('RPC cleanup failed or not found, using fallback deletes:', rpcError.message);
      
      // Delete E2E groups
      await supabase.from('study_groups').delete().eq('name', 'E2E Test Group');
      // Delete E2E sessions
      await supabase.from('study_sessions').delete().ilike('title', 'E2E Session%');
      // Delete E2E notes
      await supabase.from('notes').delete().ilike('title', 'E2E Test Note%');
    } else {
      console.log('RPC cleanup completed successfully in test teardown.');
    }
  });
});
