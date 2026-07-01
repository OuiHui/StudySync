import { test, expect } from '@playwright/test';

test.describe('StudySync E2E Dashboard & Auth Flow', () => {
  test('should load the authentication page on first visit', async ({ page }) => {
    // Navigate to root
    await page.goto('/');

    // Wait for redirect to /auth
    await expect(page).toHaveURL(/.*#\/auth/);

    // Verify main app title "StudySync"
    const appTitle = page.locator('h1:has-text("StudySync")');
    await expect(appTitle).toBeVisible();

    // Verify card welcome title "Welcome to Study App"
    const welcomeTitle = page.locator('h3:has-text("Welcome to Study App")');
    await expect(welcomeTitle).toBeVisible();

    // Verify presence of guest sign-in button
    const guestBtn = page.getByRole('button', { name: 'Continue as Guest' });
    await expect(guestBtn).toBeVisible();
  });
});
