# Real-Time Session Synchronization Design

This document details the architecture, protocol specifications, data flows, and edge-case handling for **Real-Time Group Session Synchronization** in StudySync. It defines how study session timers, group chat messages, and member presence (joining/leaving) are synchronized across multiple concurrent users in a single session lobby.

---

## 1. System Architecture & Context

StudySync utilizes **Supabase Realtime** (Channels, Broadcast, and Presence) combined with a **PostgreSQL Database** backing.

- **Supabase Realtime Broadcast**: Used for low-latency, ephemeral actions such as live cursor sharing and real-time timer countdown updates.
- **Supabase Realtime Presence**: Used for transient client tracking (detecting who is currently active, idle, or has closed their browser tab).
- **PostgreSQL Database (via WebSockets/REST)**: The ultimate source of truth for persistent data, state transitions, message archives, and attendance stats.

```mermaid
graph TD
    %% Clients
    Host["Host Client (Leader)"]
    Participant["Participant Client (Peer)"]

    %% Real-time Middleware
    subgraph Supabase Realtime Engine
        BCChannel["Broadcast Channel (room:session_id)"]
        PresenceChannel["Presence Channel (presence:session_id)"]
        DBChannel["Postgres Changes (messages, study_sessions)"]
    end

    %% Database
    subgraph PostgreSQL Database
        SSTable[("study_sessions")]
        SPTable[("session_participants")]
        MTable[("messages")]
    end

    %% Host interactions
    Host -->|1. Periodic Broadcast Timer| BCChannel
    Host -->|2. Writes State Change| SSTable
    Host -->|3. Tracks Presence| PresenceChannel

    %% Participant interactions
    BCChannel -.->|4. Receives Live Timer| Participant
    PresenceChannel <.->|5. Syncs Roster (Join/Leave)| Participant
    Participant -->|6. Tracks Presence| PresenceChannel

    %% Database replication to clients
    SSTable -->|7. Replicates State| DBChannel
    MTable -->|8. Replicates Chat| DBChannel
    SPTable -->|9. Replicates Attendance| DBChannel
    
    DBChannel -.->|10. Syncs State & Messages| Participant
    DBChannel -.->|10. Syncs State & Messages| Host
```

---

## 2. Shared Timer Synchronization Protocol

One of the key requirements of a collaborative session is a unified timer (Work / Break cycles). Since client-side system clocks frequently suffer from drift and network packets experience latency, StudySync uses a dual-layer synchronization protocol.

### A. Core Architecture

The timer synchronization is **Host-Led** by default, backed by the server time of the PostgreSQL database:

1. **Host-Led Control**: The user who created the session acts as the controller. Only the Host can trigger play, pause, resume, and skip operations.
2. **Database-Backed Truth**: Whenever the Host alters the timer state, the change is written to `study_sessions` table in PostgreSQL. Because PostgreSQL assigns timestamps using server-side clocks (`now()`), this acts as a shared clock reference.
3. **Realtime Broadcast Pipeline**: To ensure instantaneous UI responses, the Host broadcasts tick events to the channel every 3 seconds during an active countdown. See the core data attributes in [study_sessions_concept.md](docs/study_sessions_concept.md#L27-L46).

### B. State Updates and Payloads

When the Host starts, pauses, or resumes the timer, it sends updates via two channels:

#### 1. Realtime Broadcast Payload (Ephemeral Sync)
Broadcast events use the channel name `room:session_id` and the event name `timer_sync`.
```json
{
  "event": "timer_sync",
  "payload": {
    "status": "running" | "paused" | "completed",
    "mode": "work" | "break",
    "time_left": 1497,
    "target_duration": 1800,
    "host_local_timestamp": "2026-07-09T04:14:15.123Z"
  }
}
```

#### 2. Database State Update (Persistent Backup)
The database state in `study_sessions` is updated with structural fields:
- `status`: `'running' | 'paused' | 'finished' | 'cancelled'`
- `actual_start`: Timestamp of when the session first started.
- `pause_logs`: A JSONB array tracking pause intervals:
  ```json
  [
    { "paused_at": "2026-07-09T04:20:00.000Z", "resumed_at": "2026-07-09T04:21:00.000Z" }
  ]
  ```

### C. Clock Drift and Latency Correction Protocol

When a client receives a broadcast tick, the local UI timer is corrected using the following math:

$$\text{Estimated Network Latency} = \frac{\text{Client Current Time} - \text{Host Local Timestamp}}{2}$$

$$\text{Effective Time Left} = \text{Broadcast Time Left} - \text{Estimated Network Latency}$$

#### Resiliency to Browser Throttling & Disconnections
Modern browsers aggressively throttle JavaScript timer execution (e.g. `setInterval`) when tabs are backgrounded. To prevent a backgrounded client from falling behind, we execute a resynchronization check:
1. **Focus Event Listener**: When the user re-focuses the page or tab, the browser triggers `document.addEventListener('visibilitychange', ...)`.
2. **Server Re-computation**: Instead of relying on the last cached tick, the client fetches the latest row from the database and recalculates the elapsed time using server-side timestamps:
   
   $$\text{Total Paused Seconds} = \sum (\text{resumed\_at} - \text{paused\_at})$$
   
   $$\text{Elapsed Study Time} = \text{Server Time Now} - \text{actual\_start} - \text{Total Paused Seconds}$$
   
   $$\text{Time Remaining} = \text{target\_duration} - \text{Elapsed Study Time}$$

---

## 3. Real-Time Chat & Messaging Sync

Real-time chat enables communication inside active session lobbies. It utilizes a durable messaging strategy to ensure no messages are lost during momentary drops in network connection.

### A. Message Delivery Sequence

```
[Sender Client]               [Postgres DB]             [Supabase Realtime]         [Receiver Client]
      |                             |                           |                            |
      |-- 1. sendMessage() -------->|                           |                            |
      |   (Insert Row)              |                           |                            |
      |                             |-- 2. Notify Trigger ----->|                            |
      |                             |                           |-- 3. Broadcast Event ----->|
      |<-- 4. Message Confirmed ----|                           |      (postgres_changes)    |
      |                                                                                      |-- 4. Append Msg
```

1. **Write-Path**: When a user types a message and clicks send, the request goes directly to the `messages` table in the database via [ChatService](src/components/study/SessionChat.tsx#L94-L112).
2. **PostgreSQL Event Trigger**: Supabase's built-in replication engine intercepts the database insert and forwards the row data through the active WebSocket connection to all clients subscribed to the `messages:conversation_id` channel.
3. **Sender Optimization (Optimistic Updates)**: The sender's client immediately adds the message to their local state with a `pending` status. Once the database insertion confirms successfully, the message status is updated to `sent`. If the insertion fails, the client is alerted.
4. **Sender Profile Resolution**: To keep messages compact, only `sender_id` is stored on the messages table. Subscribed clients fetch the sender's details from `profiles` asynchronously or resolve them from the active participant cache inside [RealtimeService.subscribeToMessages](src/services/realtime.ts#L45-L132).

---

## 4. Join/Leave & Presence Management

Session attendance requires distinct handling for **Transient Presence** (who is currently online and viewing the workspace) and **Persistent Attendance** (who has attended and contributed study hours to the session).

### A. Roster State Comparison

| Property | Transient Presence | Persistent Attendance |
| :--- | :--- | :--- |
| **Technology** | Supabase Presence (WebSockets) | PostgreSQL Database Tables |
| **Storage Location** | In-memory cluster state (No DB writes) | `session_participants` table |
| **Lifecycle** | Destroyed on socket disconnect/tab close | Retained indefinitely for history & metrics |
| **Accuracy** | Real-time connection-level awareness | Logical transaction-level logs |

### B. User Flow Scenarios

#### 1. Joining a Session
- **Database Entry**: When a user navigates to the group session, the client checks if a record in `session_participants` exists. If not, it executes `StudySessionsService.joinSession()` to insert a new attendee.
- **WebSocket Connection**: The client connects to `presence:session_id` and registers the user's details:
  ```typescript
  RealtimeService.trackPresence(sessionId, {
    id: user.id,
    name: user.display_name,
    avatar: user.avatar_url,
    status: 'active'
  });
  ```
- **Roster Update**: Supabase broadcasts a `join` event to all connected clients, causing the UI roster to refresh with the new member's presence indicator set to green (online).

#### 2. Graceful Departure (Leaving Session)
- **Clicking "Leave Session"**:
  - The client updates their status to `left` in the `session_participants` database table using [leaveSession](src/services/studySessions/mutations.ts#L91-L113).
  - The client calls `RealtimeService.untrackPresence(sessionId)` and terminates their subscription.
  - The server fires a `leave` presence event, updating the UI roster for all remaining peers.

#### 3. Ungraceful Departure (Tab Closed, Connection Lost, Crash)
- **Automatic Socket Termination**: The WebSocket connection is dropped.
- **Presence Broadcast**: Within a 10-second timeout window, Supabase detects the absence of the client's socket heartbeat and fires a `leave` presence event to remaining clients.
- **Attendance Update**: A PostgreSQL background database trigger or periodic worker sweeps the `session_participants` table, verifying if any user marked as `active` has been disconnected from Presence for over 15 minutes. If so, their persistent status is moved to `away` or `left` to keep session metrics clean.

---

## 5. Edge Case Resiliency Matrix

| Edge Case | Problem | Mitigation Strategy |
| :--- | :--- | :--- |
| **Host Disconnects / Departure** | The active session timer is orphaned, leaving participants with no one to send updates. | **Host Re-election Process**:<br>If the presence tracker detects the host has left, the remaining user with the longest-active session connection is elected as the "Temporary Host". The new host assumes the duty of writing timer ticks to the broadcast channel. |
| **Client Internet Outage** | The client disconnects from the socket and misses broadcast ticks. | **State Recovery on Reconnect**:<br>When the WebSocket reconnects, the client does not request missed ticks. Instead, it queries the `study_sessions` database table to fetch the true state and recalculates the timer offset against the database clock. |
| **Local Time Tampering** | A user changes their operating system clock to bypass study logs. | **Database Clock Anchor**:<br>All session timing is verified on completion by calculating the difference between `actual_end` and `actual_start` minus `total_paused_duration` from `pause_logs`. These timestamps are generated strictly using `DEFAULT CURRENT_TIMESTAMP` or `NOW()` on the PostgreSQL server, rendering local client-side clock tampering ineffective. |
| **High Network Jitter** | Jitter can cause the UI countdown to look unstable (skipping or jumping seconds). | **Jitter Smoothing**:<br>The client UI keeps a local ticking decrement loop running at 1-second intervals. When a sync packet arrives, the client compares the local timer against the sync value. If the difference is $\le 1$ second, it is ignored; if it is $> 1$ second, the local timer smoothly interpolates to the corrected time over 200ms. |

---

## 6. Implementation Checklist

To roll out the complete real-time sync mechanism, follow these code updates:

1. [ ] **Update Database Schema**: Extend `study_sessions` with `pause_logs` (JSONB) and `timer_state` columns if they are not already active.
2. [ ] **Enhance `RealtimeService`**:
   - Add broadcast subscription helper for timer sync: `RealtimeService.subscribeToTimerSync(sessionId, callback)`.
   - Add broadcast helper to publish ticks: `RealtimeService.broadcastTimerSync(sessionId, state)`.
3. [ ] **Refine `useGroupStudySessionData`**:
   - Integrate Host-detection logic (`isHost`).
   - If Host: Set up interval broadcasting to publish ticks every 3 seconds.
   - If Participant: Subscribe to `timer_sync` broadcast channel and apply drift/latency correction.
   - Attach window visibility/focus listeners to trigger server-side re-sync from database timestamps.
4. [ ] **Configure Presence Heartbeats**: Ensure `trackPresence` and `untrackPresence` are correctly mounted in the session hooks layout.

---

## 7. Supabase Real-Time Database Configuration

For Supabase Realtime to successfully capture PostgreSQL database changes and push them to client subscriptions (e.g., `postgres_changes` events), two configuration steps must be performed on the database level:

### A. Real-Time Publication Enrollment
The database uses a publication named `supabase_realtime` to control which tables broadcast changes. Tables must be explicitly added to this publication:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_goals;
```

### B. PostgreSQL Replica Identity (`REPLICA IDENTITY FULL`)
By default, PostgreSQL's Write-Ahead Log (WAL) only includes primary key values for `DELETE` and `UPDATE` operations. If a client's realtime subscription uses a filter on a non-primary key column (for example, listening to participant changes filtered by `session_id=eq.SESSION_ID`), a `DELETE` event payload will omit the `session_id` column, and the event will fail to match the filter.

To ensure client filters match on deleted records, set `REPLICA IDENTITY FULL` on these tables:
```sql
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.study_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.session_participants REPLICA IDENTITY FULL;
ALTER TABLE public.session_goals REPLICA IDENTITY FULL;
```

### C. Row-Level Security (RLS) Policy Compatibility
Supabase Realtime respects PostgreSQL RLS policies. If a user is not permitted to `SELECT` a row under the table's RLS policies, the realtime engine will filter out the corresponding database change events (e.g., `INSERT`, `UPDATE`, `DELETE`) and will not push them to that user's client socket.

To ensure realtime updates broadcast successfully for group sessions:
1. **`study_sessions` SELECT Policy**: Must permit members of the session's group to read the session row (even if the group is private).
2. **`session_participants` SELECT Policy**: Must permit members of the session's group to read participant rows.

Ensure the RLS policies include checking group membership:
```sql
EXISTS (
  SELECT 1 FROM public.study_groups 
  WHERE study_groups.id = study_sessions.group_id 
  AND (
    study_groups.is_public = true OR
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_members.group_id = study_groups.id 
      AND group_members.user_id = auth.uid()
    )
  )
)
```
