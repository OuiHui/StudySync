# Data Access Performance & Scaling Architecture

## Problem Statement

Currently, data loading in StudySync (e.g., fetching notes, group data, and messaging) takes **~500ms (0.5s)**. For the app to feel instantaneous (<50ms) and scale to thousands of concurrent users, we need to eliminate performance bottlenecks in the data layer.

---

## Identified Bottlenecks

### 1. Sequential Network Waterfalls (N+1 Round-trips)
In `src/services/notes/queries.ts`, loading notes requires **3 sequential HTTP requests**:
1. `supabase.from('notes').select('*')` (~150ms)
2. `populateNoteProfiles()` → `supabase.from('profiles').select(...).in(...)` (~150ms)
3. `populateNoteGroupShares()` → `supabase.from('note_group_shares').select(...).in(...)` (~150ms)

Total latency is the **sum** of 3 round-trips: **~450ms–500ms**.

### 2. Unindexed Row-Level Security (RLS) Subqueries
The `notes` SELECT policy calls `public.note_shared_with_user_groups(id)`, which executes a sub-JOIN across `note_group_shares` and `group_members` for every row scanned. Without composite B-Tree indexes, Postgres runs sequential scans for each item.

### 3. Full-Payload Over-fetching & Client-Side Pagination
- `getNotes()` returns complete markdown text (`content`) for every note in the system.
- `useNotes.ts` fetches **all** user notes and paginates in-memory (`sortedNotes.slice(start, end)`), transferring unnecessary data over the wire.

### 4. Cold-Start Cache Misses
Initial page loads hit the network because cached query states are stored only in React Query in-memory memory state, not persisted across sessions or cold reloads.

---

## Action Plan for Sub-50ms Data Access & High Scalability

```mermaid
graph TD
    A[Client Request] --> B{Persisted Query Cache (IndexedDB)}
    B -- Cache Hit (<10ms) --> C[Instant UI Render]
    B -- Background Stale Refetch --> D[Single FK Join Query]
    D --> E[PostgreSQL via Supavisor Pooler]
    E --> F[Indexed RLS Evaluation]
    F --> G[Return Slim Projected Payload]
```

### Phase 1: Collapse Network Waterfalls & Parallelize Requests (Completed)
- **Single-Query & Parallel Joins**: Consolidated `getSessions()` from 5 sequential round-trips into 2 parallel waves using `Promise.all` and `.or()` filters.
- **Init Waterfalls**: Parallelized initialization waterfalls in `useGroupStudySessionData` with `Promise.all`.
- **Polling Elimination**: Removed 8s periodic `setInterval` participant polling in favor of WebSocket Supabase Realtime channel changes and focus events.

---

### Phase 2: Database & RLS Indexing (Completed)
Applied targeted PostgreSQL B-tree indexes across core tables (`study_sessions`, `messages`, `friendships`, `conversation_participants`, `notes`, `group_members`, `custom_subjects`):
```sql
-- Session lookup & sorting indexes
CREATE INDEX IF NOT EXISTS idx_study_sessions_scheduled_start ON public.study_sessions (scheduled_start ASC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_status ON public.study_sessions (status);
CREATE INDEX IF NOT EXISTS idx_study_sessions_group_id ON public.study_sessions (group_id) WHERE group_id IS NOT NULL;

-- Messaging history sorting index
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages (conversation_id, created_at DESC);

-- Friendship status lookup indexes
CREATE INDEX IF NOT EXISTS idx_friendships_user_status ON public.friendships (user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_status ON public.friendships (friend_id, status);

-- Conversation participants composite index
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv_user ON public.conversation_participants (conversation_id, user_id);
```

---

### Phase 3: Field Projection & Server-Side Pagination (Completed)
- **Field Projection:** Defined `NOTE_LIST_SELECT` omitting heavy markdown `content` bodies from list views (`getNotes`, `getGroupSharedNotes`, `getSessionNotes`), fetching full content only for single-note detail views (`getNote`).
- **Instant Tab Navigation (Eager Route Imports):** Converted top-level page routes in `App.tsx` from `React.lazy` dynamic imports to eager imports. This eliminates the dynamic JS bundle fetch delay and `<Suspense>` loading fallback (`PageFallback`) flash when navigating between tabs for the first time, ensuring sub-50ms instant tab rendering.

---

### Phase 4: Persistence & Optimistic UI (Completed)
- **IndexedDB Persistence:** Configured `@tanstack/react-query-persist-client` with `@tanstack/query-async-storage-persister` & `idb-keyval` in `src/contexts/AppProviders.tsx` and `src/lib/persister.ts`, enabling instant cached data rendering on page load (<10ms) with a 7-day max cache TTL.
- **Optimistic Updates:** Implemented immediate local cache updates and error rollback state handling across note creation/editing/sharing/deletion (`useNotes.ts`), messaging sending/editing/deletion, and friend request actions (`useFriends.ts`).

---

### Phase 5: Infrastructure & Connection Scaling (Planned)
- **Transaction Connection Pooling:** Route database traffic through Supabase Supavisor pooler (port `6543`).
- **Realtime Subscriptions:** Use Supabase Realtime WebSocket changes instead of polling or aggressive invalidations.
