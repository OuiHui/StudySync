# Messaging & Chat System Architecture

## Overview
StudySync provides realtime messaging capabilities for study group members and direct chat conversations. The system consists of backend database tables with Row Level Security (RLS) policies, frontend service handlers (`ChatService`, `RealtimeService`), and a dedicated Messages Workspace page (`/messages`).

---

## Workspace & UI Features (`/messages`)

### 1. Conversation Separation & Deep Linking
Conversations in the Messaging Tab are strictly separated into two distinct categories:
- **Study Groups**: Group chat channels automatically linked to study groups the user belongs to (`group_id IS NOT NULL`, `is_group_chat = true`). Study Groups that do not have any messages in them do not appear in the sidebar conversation list until someone initiates a chat and says something (via "New Chat" or the Study Groups page).
- **Direct Messages**: 1-on-1 private conversations between friends / individual people (`is_group_chat = false`).
- **Deep Linking / Direct Navigation**: Navigating to `/messages?userId=<target_user_id>` (such as when clicking "Message" on a friend card or profile dialog on the Friends page) automatically switches to the Direct Messages tab, retrieves or creates the 1-on-1 conversation with `<target_user_id>`, and selects it in the chat workspace.

### 2. Active Group Study Session Indicators & Banner
- **Active Indicator on Group Icon**: When a study group has a live group study session in progress (`study_sessions.status IN ('active', 'running', 'scheduled')`), a pulsing green status dot is rendered on the group avatar in the left-hand conversation sidebar.
- **Top Join Popup / Banner**: Inside the active chat area for a study group with an ongoing live session, `ActiveSessionBanner` appears at the top. It displays the session title, host details, participant count, and a direct "Join Session" CTA button navigating to `/group-study-session?id=<session_id>`.

---

## Data Model & Schema

### `public.conversations`
- `id` (UUID, PK)
- `created_by` (UUID, FK -> `auth.users`)
- `group_id` (UUID, optional FK -> `public.study_groups`)
- `name` (TEXT, optional)
- `is_group_chat` (BOOLEAN, default `false`)
- `created_at` / `updated_at` (TIMESTAMP)

### `public.messages`
- `id` (UUID, PK)
- `conversation_id` (UUID, FK -> `public.conversations`)
- `sender_id` (UUID, FK -> `auth.users`)
- `content` (TEXT)
- `message_type` (TEXT, default `'text'`)
- `reply_to_id` (UUID, optional FK -> `public.messages`)
- `file_url` (TEXT, optional)
- `created_at` / `updated_at` (TIMESTAMP)

---

## Service & Hook Layer

### `ChatService` (`src/services/chat.ts`)
- `getConversations()`: Queries active conversation participations for the user, returning latest messages and profile details.
- `getOrCreateGroupConversation(groupId)`: Retrieves or inserts the group conversation record without failing RLS checks.
- `getOrCreateDirectConversation(targetUserId)`: Retrieves existing 1-on-1 conversation with `targetUserId` or creates a new direct chat conversation.
- `sendMessage(conversationId, content)`: Inserts a new message and returns sender profile metadata for UI optimistic updates.

### `useMessagingData` (`src/hooks/useMessagingData.ts`)
- Custom hook managing conversation lists, real-time message subscriptions, and active group session mapping.
- Leverages `@tanstack/react-query` (`['messaging-data', userId]`) with 5-minute staleTime caching so navigation back to `/messages` loads instantly without re-fetching or showing loading spinners.
- Subscribes via Supabase Realtime to `messages`, `study_sessions`, and `conversations` table changes to invalidate and revalidate data automatically.

### 3. Recent Message Ordering & Dynamic Scrollbar Management
- **Most Recent Message Ordering**: Group chats and Direct Messages are dynamically ordered by the timestamp of their latest message (`latestMessage.createdAt` descending). Conversations with recent activity move to the top of the sidebar. If no messages exist yet, sorting falls back to conversation creation/update timestamps.
- **Empty Chat Scrollbar Prevention**: When a conversation or list has no messages or items (`displayMessages.length === 0` or `currentConversations.length === 0`), scrollbars and scrollbar tracks are suppressed (`overflow-hidden`) to ensure clean empty state visuals without blank scrollbar gutters.

### Conversation Message Caching (`src/pages/Messages/index.tsx`)
- Uses React Query (`['chat-messages', activeConvId]`) to cache message histories for each conversation thread.
- Switching between conversations or tabs renders messages immediately from in-memory cache without clearing the view.
- Realtime incoming, edited, or deleted messages optimistically update the query cache via `queryClient.setQueryData`.
- Non-empty message threads are styled with `.custom-scrollbar` (`scrollbar-gutter: stable`) to prevent scrollbar layout flashing during message expansion.

---

## Row Level Security (RLS) Policies

### `conversations` Policies
- **SELECT**: Users can view conversations if:
  1. `auth.uid() = created_by`
  2. `group_id IS NOT NULL` and the user is a group member (`public.is_group_member(auth.uid(), group_id)`) or group creator (`public.is_group_creator(auth.uid(), group_id)`).
- **INSERT**: Users can create conversations where `auth.uid() = created_by`.

### `messages` Policies
- **SELECT**: Users can view messages belonging to conversations they have access to.
- **INSERT**: Authenticated users can insert messages where `auth.uid() = sender_id` and the target `conversation_id` is accessible.

---

## Known Gotchas & RLS Restoration
When `public.is_group_member(uuid, uuid)` was replaced with `DROP FUNCTION ... CASCADE` in prior migrations, PostgreSQL CASCADE-dropped dependent RLS policies on `conversations` and `messages`. This caused `403 Forbidden` / `42501` RLS errors during group chat initialization and `406 Not Acceptable` on PostgREST `.single()` lookup.

Migration `20260719010000_fix_conversations_and_messages_rls.sql` restores these RLS policies and `ChatService.getOrCreateGroupConversation` utilizes `.maybeSingle()` to handle missing conversations safely.
