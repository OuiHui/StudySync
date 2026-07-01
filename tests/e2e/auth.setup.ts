import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';

const authFile = 'playwright/.auth/user.json';

setup('authenticate as guest', async ({ page }) => {
  // Set setup timeout to 60 seconds to accommodate rate-limit backoff wait
  setup.setTimeout(60000);

  // 1. Check if session is already saved and valid to avoid hitting rate limits
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
        // Supabase stores expires_at at the root level of token JSON
        const expiresAt = tokenData.expires_at || tokenData.expiresAt || tokenData.currentSession?.expires_at || tokenData.currentSession?.expires_in;
        
        // If session is valid for more than 10 minutes, reuse it
        if (expiresAt && expiresAt * 1000 > Date.now() + 10 * 60 * 1000) {
          console.log(`Reusing existing valid Supabase session (expires at ${new Date(expiresAt * 1000).toISOString()}).`);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse existing auth file, will re-authenticate:', e);
    }
  }

  // 2. Perform login with retry logic for rate limits
  let attempt = 0;
  const maxAttempts = 3;
  
  while (attempt < maxAttempts) {
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
    
    try {
      await expect(dashboardHeader).toBeVisible({ timeout: 15000 });
      await page.context().storageState({ path: authFile });
      console.log('Authentication successful. Storage state saved.');
      return;
    } catch (e) {
      // Check if rate limited
      const rateLimitText = page.getByText(/rate limit/i);
      const isRateLimited = await rateLimitText.count() > 0;
      
      if (isRateLimited && attempt < maxAttempts - 1) {
        console.warn(`Supabase rate limit hit. Retrying attempt ${attempt + 1} in 25 seconds...`);
        await page.waitForTimeout(25000);
        attempt++;
      } else {
        throw e;
      }
    }
  }
  
  throw new Error('Failed to authenticate as guest after maximum attempts due to rate limit.');
});
