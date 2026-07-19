# Messaging & Chat System Architecture

## Overview
StudySync provides realtime messaging capabilities for study group members and direct chat conversations. The system consists of backend database tables with Row Level Security (RLS) policies and frontend service handlers (`ChatService`, `RealtimeService`).

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

## Row Level Security (RLS) Policies

### `conversations` Policies
- **SELECT**: Users can view conversations if:
  1. `auth.uid() = created_by`
  2. `group_id IS NOT NULL` and the user is a group member (`public.is_group_member(auth.uid(), group_id)`) or group creator (`public.is_group_creator(auth.uid(), group_id)`).
- **INSERT**: Users can create conversations where `auth.uid() = created_by`.

### `messages` Policies
- **SELECT**: Users can view messages belonging to conversations they have access to.
- **INSERT**: Authenticated users can insert messages where `auth.uid() = sender_id` and the target `conversation_id` is accessible.

## Known Gotcha & RLS Restoration
When `public.is_group_member(uuid, uuid)` was replaced with `DROP FUNCTION ... CASCADE` in prior migrations, PostgreSQL CASCADE-dropped dependent RLS policies on `conversations` and `messages`. This caused `403 Forbidden` / `42501` RLS errors during group chat initialization and `406 Not Acceptable` on PostgREST `.single()` lookup.

Migration `20260719010000_fix_conversations_and_messages_rls.sql` restores these RLS policies and `ChatService.getOrCreateGroupConversation` utilizes `.maybeSingle()` to handle missing conversations without throwing HTTP 406.
