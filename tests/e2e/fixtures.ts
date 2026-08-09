import { test as base, expect, Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = "https://yysdestjdzdmulgatmpc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5c2Rlc3RqZHpkbXVsZ2F0bXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5OTM3ODUsImV4cCI6MjA2NDU2OTc4NX0.SQzWV9Vd72zC8J6sSIPsKSsQp90Jte3e_lCMy7eb9_M";

export interface TestEntity {
  id?: string;
  name?: string;
  title?: string;
}

export type CustomFixtures = {
  authenticatedPage: Page;
  testGroup: TestEntity;
  testSession: TestEntity;
  testNote: TestEntity;
};

export const test = base.extend<CustomFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/');
    
    const guestBtn = page.getByRole('button', { name: 'Continue as Guest' });
    const dashboardHeader = page.locator('h1', { hasText: 'Dashboard' });
    
    await Promise.race([
      guestBtn.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
      dashboardHeader.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
    ]);
    
    if (await guestBtn.isVisible()) {
      await guestBtn.click();
    }

    await expect(dashboardHeader).toBeVisible({ timeout: 15000 });
    await use(page);
  },

  testGroup: async ({ authenticatedPage: page }, use) => {
    const groupName = `Fixture Group ${Date.now()}`;
    const group: TestEntity = { name: groupName };

    // Navigate to Study Groups & create group
    await page.getByRole('button', { name: 'Study Groups' }).click();
    await page.getByRole('button', { name: 'Browse Groups' }).click();
    await expect(page.locator('h1', { hasText: 'Study Groups' })).toBeVisible();

    const createGroupBtn = page.getByRole('button', { name: 'Create Group' });
    if (await createGroupBtn.isVisible()) {
      await createGroupBtn.click();
      await page.locator('input#name').fill(groupName);
      await page.locator('input#course').fill('Fixture Subject');
      await page.locator('textarea#description').fill('Fixture test group description');
      await page.getByRole('button', { name: 'Create Group', exact: true }).click();
      await page.waitForTimeout(1000);
    }

    try {
      await use(group);
    } finally {
      // Scoped teardown: Delete group from Supabase database
      const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
      await supabase.from('study_groups').delete().eq('name', groupName);
    }
  },

  testSession: async ({ authenticatedPage: page }, use) => {
    const sessionTitle = `Fixture Session ${Date.now()}`;
    const session: TestEntity = { title: sessionTitle };

    try {
      await use(session);
    } finally {
      // Scoped teardown: Delete session from Supabase database
      const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
      await supabase.from('study_sessions').delete().ilike('title', sessionTitle);
    }
  },

  testNote: async ({ authenticatedPage: page }, use) => {
    const noteTitle = `Fixture Note ${Date.now()}`;
    const note: TestEntity = { title: noteTitle };

    try {
      await use(note);
    } finally {
      // Scoped teardown: Delete note from Supabase database
      const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
      await supabase.from('notes').delete().ilike('title', noteTitle);
    }
  },
});

export { expect };
