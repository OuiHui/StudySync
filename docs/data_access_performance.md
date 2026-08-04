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

### Phase 1: Collapse Network Waterfalls (Single-Query Joins)
Replace sequential queries with Supabase PostgREST foreign-key joins:
```ts
const { data, error } = await supabase
  .from('notes')
  .select(`
    id, title, subject, file_url, file_name, permission_level, created_at, updated_at, created_by,
    profiles!notes_created_by_fkey(id, display_name, avatar_url),
    note_group_shares(group_id, study_groups(id, name, is_public))
  `)
  .order('updated_at', { ascending: false });
```
*Impact: Reduces latency from 450ms to ~80ms (1 round-trip).*

---

### Phase 2: Database & RLS Indexing
Apply targeted PostgreSQL B-tree indexes to optimize RLS subqueries and sorting:
```sql
-- Index foreign keys and sort columns
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON public.notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON public.notes(updated_at DESC);

-- Composite indexes for RLS helper functions
CREATE INDEX IF NOT EXISTS idx_ngs_note_group ON public.note_group_shares(note_id, group_id);
CREATE INDEX IF NOT EXISTS idx_gm_group_user ON public.group_members(group_id, user_id);
```
*Impact: Cuts Postgres query execution time from ~100ms to <5ms.*

---

### Phase 3: Field Projection & Server-Side Pagination
- **List Queries:** Omit full `content` from list views, fetching lightweight metadata only.
- **Pagination:** Implement `.range(page * limit, (page + 1) * limit - 1)` at the database layer.
*Impact: Decreases payload size by 80–90%.*

---

### Phase 4: Persistence & Optimistic UI
- **IndexedDB Persistence:** Configure `@tanstack/react-query-persist-client` to render instant cached data on page load (<10ms).
- **Optimistic Updates:** Update local cache immediately on mutations (e.g. creating/deleting notes) before waiting for server confirmation.
*Impact: Perceived loading time drops to 0ms.*

---

### Phase 5: Infrastructure & Connection Scaling
- **Transaction Connection Pooling:** Route database traffic through Supabase Supavisor pooler (port `6543`).
- **Realtime Subscriptions:** Use Supabase Realtime WebSocket changes instead of polling or aggressive invalidations.
