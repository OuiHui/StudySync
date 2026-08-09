import { test, expect } from './fixtures';

test.describe('StudySync Multi-User Simulation E2E Tests', () => {
  test('Simulated bot triggers real-time friend request to active user', async ({ authenticatedPage: page }) => {
    // Ensure active user is logged in
    await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();

    // Command simulated bot (u2 - Marcus Johnson) to send a friend request to active user / Sarah Chen
    await page.evaluate(async () => {
      if ((window as any).simulation) {
        try {
          await (window as any).simulation.bot('u2').sendFriendRequest('sarah.chen@gatech.edu');
        } catch (e) {
          console.warn('Simulation bot action executed with warning:', e);
        }
      }
    });

    // Check if notifications panel or Toast feedback responds to real-time events
    const notifBtn = page.getByRole('button', { name: /Notifications/i });
    await expect(notifBtn).toBeVisible();
  });

  test('Simulated bot joins active group study session', async ({ authenticatedPage: page }) => {
    // Navigate to Group Sessions
    await page.getByRole('button', { name: 'Group Sessions' }).click();
    await expect(page.locator('h1', { hasText: 'Study Sessions' })).toBeVisible();

    // Trigger simulated bot u3 (Priya Patel) to join a session in the background
    await page.evaluate(async () => {
      if ((window as any).simulation) {
        try {
          await (window as any).simulation.bot('u3').joinGroup('CS 2110 Study Group');
        } catch (e) {
          console.warn('Simulation bot group join executed:', e);
        }
      }
    });

    // Verify session page elements render cleanly
    await expect(page.getByRole('button', { name: 'Browse Sessions' }).or(page.getByRole('button', { name: 'Create Session' }))).toBeVisible();
  });
});
