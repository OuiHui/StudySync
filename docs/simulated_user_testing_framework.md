# Simulated User Testing Framework

This document outlines the architecture, capabilities, and usage of the Simulated User Testing Framework in StudySync.

---

## 1. Overview
The Simulated User Testing Framework provides:
1. **Programmatic Control**: Developers can control seeded mock users ("stub people") via simple function calls (e.g., in the browser dev console or automated scripts).
2. **Instant Login**: Developers can log in as any of the seeded mock users with a single click, facilitating manual testing of user flows, notifications, and real-time state synchronization.
3. **Simultaneous Bot Sessions**: Multiple mock users can be authenticated simultaneously *in the background* by using independent Supabase client instances. These bots do not interfere with the active user session in the main application.
4. **Developer UI Panel**: A premium, collapsible overlay panel ("Simulation Console") built into the app for triggering actions, running scripts, swapping active logins, and viewing execution logs.

---

## 2. Seeded User Pool
The system leverages the following persistent mock profiles already seeded in the database. All accounts use the standard password `password123`.

| Seed ID | Name | Email | Default Major / Role |
| :--- | :--- | :--- | :--- |
| `u1` | **Sarah Chen** | `sarah.chen@gatech.edu` | Computer Science (ML Focus) |
| `u2` | **Marcus Johnson** | `marcus.j@gatech.edu` | Electrical Engineering |
| `u3` | **Priya Patel** | `priya.patel@gatech.edu` | Biomedical Engineering |
| `u4` | **Alex Rivera** | `alex.rivera@gatech.edu` | Industrial Engineering |
| `u5` | **Emily Nakamura** | `emily.n@gatech.edu` | Computer Science (Freshman) |
| `u6` | **David Kim** | `david.kim@gatech.edu` | Aerospace Engineering |
| `u7` | **Jordan Williams** | `jordan.w@gatech.edu` | Mathematics |
| `u8` | **Olivia Thompson** | `olivia.t@gatech.edu` | Computer Science (Web Dev) |
| `u9` | **Ethan Morales** | `ethan.m@gatech.edu` | Mechanical Engineering |
| `u10` | **Aisha Rahman** | `aisha.r@gatech.edu` | Chemical Engineering |

---

## 3. Bot Client Architecture

To allow multiple bots to run concurrent database operations without conflicting with the active user's session in local storage, auxiliary Supabase clients are initialized with `persistSession: false`.

```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

const botSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
```

---

## 4. Programmatic API (`window.simulation`)

In development mode (`import.meta.env.DEV`), a global `simulation` object is bound to `window` so developers can run command-line scenarios:

### Core Methods

- **`window.simulation.loginAs(nameOrEmail)`**: Signs the main browser tab session into the specified mock user.
- **`window.simulation.bot(nameOrEmail)`**: Returns or initializes a `SimulatedUserBot` instance.
- **`window.simulation.runScenario(scenarioName)`**: Executes a predefined scenario script.

### Bot Class (`SimulatedUserBot`)

Each bot exposes the following chainable/async methods:

- **`sendFriendRequest(targetNameOrEmailOrId)`**: Send a friend request to another user.
- **`acceptFriendRequest(senderNameOrEmailOrId)`**: Accept a pending friend request from another user.
- **`rejectFriendRequest(senderNameOrEmailOrId)`**: Decline/delete a pending request.
- **`createGroup(name, description, subject, maxMembers?)`**: Create a new study group.
- **`joinGroup(groupIdOrName)`**: Join a study group as a member.
- **`leaveGroup(groupIdOrName)`**: Leave a study group.
- **`sendMessage(targetNameOrEmailOrId, content)`**: Send a direct message to a user (automatically creating a conversation if needed).
- **`sendGroupMessage(groupIdOrName, content)`**: Send a message to a group chat conversation.
- **`createNote(title, content, subject, groupId?, permissionLevel?)`**: Create and share a study note.
- **`joinSession(sessionIdOrName)`**: Join a scheduled or active study session.
- **`leaveSession(sessionIdOrName)`**: Leave a study session.

---

## 5. Developer UI Console

The console is a toggleable, floating widget that renders:
1. **User List**: Shows all 10 mock users, their active statuses, and simple buttons to:
   - **Login**: Instantly switch the main application view to this user.
   - **Show Bot Actions**: Expand action controls to command this specific bot.
2. **Action Controls**: Forms/buttons to execute individual bot actions:
   - Sending friend requests.
   - Accepting friend requests.
   - Sending messages to groups/friends.
3. **Preset Scenarios**: One-click scripts to run complex, multi-user flows:
   - *Friendship Sync Flow*: User A requests User B -> User B accepts -> User A direct-messages User B.
   - *Group Study Sync Flow*: User A creates group -> User B joins -> User A sends group message -> User B joins study session.
4. **Log Console**: Displays real-time diagnostic output of all simulated events (e.g., logins, database insertions, triggers).
