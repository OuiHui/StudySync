# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows.spec.ts >> StudySync E2E User Flows >> Flow E: Collaborative & Planned Study Sessions
- Location: tests\e2e\flows.spec.ts:140:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('E2E Session').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('E2E Session').first()

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
  - button "Customize Colors":
    - img
    - text: Customize Colors
  - heading "Study Sessions" [level=1]
  - paragraph: Join or create collaborative study sessions
  - button "Create Session":
    - img
    - text: Create Session
  - heading "Live Sessions (0)" [level=3]:
    - img
    - text: Live Sessions (0)
  - img
  - heading "No Live Sessions" [level=3]
  - paragraph: No active study sessions at the moment
  - heading "Upcoming Sessions (0)" [level=3]:
    - img
    - text: Upcoming Sessions (0)
  - img
  - heading "No Upcoming Sessions" [level=3]
  - paragraph: No scheduled study sessions
```

# Test source

```ts
  68  |   });
  69  | 
  70  |   test('Flow C: Solo Pomodoro Study Session', async ({ page }) => {
  71  |     // Navigate to Solo Study
  72  |     await page.getByRole('button', { name: 'Solo Study' }).click();
  73  |     await expect(page.locator('h1', { hasText: 'Study Session' })).toBeVisible();
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
> 168 |     await expect(page.getByText('E2E Session').first()).toBeVisible({ timeout: 10000 });
      |                                                         ^ Error: expect(locator).toBeVisible() failed
  169 |   });
  170 | 
  171 |   test('Flow F: Study Notes & Shared Documents', async ({ page }) => {
  172 |     // Navigate to Notes
  173 |     await page.getByRole('button', { name: 'Notes' }).click();
  174 |     await expect(page.locator('h1', { hasText: 'Study Materials' })).toBeVisible();
  175 | 
  176 |     // Open Create Note Dialog
  177 |     const createNoteBtn = page.getByRole('button', { name: 'Create Note' });
  178 |     await expect(createNoteBtn).toBeVisible();
  179 |     await createNoteBtn.click();
  180 | 
  181 |     // Fill Create Note Form
  182 |     await page.locator('input').first().fill('E2E Test Note');
  183 |     await page.locator('textarea').fill('This is note content written by E2E test.');
  184 | 
  185 |     // Save note
  186 |     await page.getByRole('button', { name: 'Create Note', exact: true }).click();
  187 | 
  188 |     // Assert note exists in grid
  189 |     await expect(page.getByText('E2E Test Note').first()).toBeVisible({ timeout: 10000 });
  190 | 
  191 |     // Delete Note (click the trash button on the E2E Test Note card)
  192 |     const noteCard = page.locator('.group', { hasText: 'E2E Test Note' }).first();
  193 |     // The trash button is the third button in the note card's action row (nth(2))
  194 |     const deleteBtn = noteCard.locator('button').nth(2);
  195 |     await expect(deleteBtn).toBeVisible({ timeout: 10000 });
  196 |     await deleteBtn.click();
  197 | 
  198 |     // Verify note is deleted
  199 |     await expect(page.getByText('E2E Test Note').first()).not.toBeVisible();
  200 |   });
  201 | 
  202 |   test.afterAll(async () => {
  203 |     const SUPABASE_URL = "https://yysdestjdzdmulgatmpc.supabase.co";
  204 |     const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5c2Rlc3RqZHpkbXVsZ2F0bXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5OTM3ODUsImV4cCI6MjA2NDU2OTc4NX0.SQzWV9Vd72zC8J6sSIPsKSsQp90Jte3e_lCMy7eb9_M";
  205 |     const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  206 | 
  207 |     const authFile = 'playwright/.auth/user.json';
  208 |     if (fs.existsSync(authFile)) {
  209 |       try {
  210 |         const state = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
  211 |         const origin = state.origins?.find((o: any) => 
  212 |           o.localStorage?.some((item: any) => item.name.startsWith('sb-') && item.name.endsWith('-auth-token'))
  213 |         );
  214 |         if (origin) {
  215 |           const tokenItem = origin.localStorage.find((item: any) => 
  216 |             item.name.startsWith('sb-') && item.name.endsWith('-auth-token')
  217 |           );
  218 |           const tokenData = JSON.parse(tokenItem.value);
  219 |           const access_token = tokenData.access_token;
  220 |           const refresh_token = tokenData.refresh_token;
  221 |           if (access_token && refresh_token) {
  222 |             await supabase.auth.setSession({ access_token, refresh_token });
  223 |             console.log('Teardown authenticated successfully using stored session.');
  224 |           }
  225 |         }
  226 |       } catch (e) {
  227 |         console.warn('Teardown failed to authenticate using stored session:', e);
  228 |       }
  229 |     }
  230 | 
  231 |     console.log('Cleaning up E2E Test Group and E2E Session...');
  232 |     
  233 |     // Delete E2E groups
  234 |     const { error: groupError } = await supabase
  235 |       .from('study_groups')
  236 |       .delete()
  237 |       .eq('name', 'E2E Test Group');
  238 |     if (groupError) {
  239 |       console.error('Error cleaning up E2E study groups:', groupError);
  240 |     }
  241 | 
  242 |     // Delete E2E sessions
  243 |     const { error: sessionError } = await supabase
  244 |       .from('study_sessions')
  245 |       .delete()
  246 |       .eq('title', 'E2E Session');
  247 |     if (sessionError) {
  248 |       console.error('Error cleaning up E2E study sessions:', sessionError);
  249 |     }
  250 |   });
  251 | });
  252 | 
```