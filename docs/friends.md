# Friends System Specifications

This document outlines the detailed concepts, states, data models, and RPC functions for the **Friends & Relationships** system in StudySync.

---

## 1. Core Data Models

Relationships between users are stored in the `friendships` table. A single row defines a friendship request or connection between two users.

### A. Friendship Relationship (`friendships`)
The creator of the request is recorded as `user_id`, and the recipient is recorded as `friend_id`.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Unique identifier for the friendship record (Primary Key). |
| `user_id` | `UUID` | Foreign Key referencing the user who initiated the request. |
| `friend_id` | `UUID` | Foreign Key referencing the user receiving the request. |
| `status` | `Text` | Status of the connection: `'pending'`, `'accepted'`, or `'blocked'`. |
| `created_at` | `Timestamp` | Timestamp when the request was created. |
| `updated_at` | `Timestamp` | Timestamp when the request status was last updated. |

### B. Friendship Statuses
- **`pending`**: Represents an active friend request sent by `user_id` to `friend_id`.
- **`accepted`**: Represents a mutual, confirmed friendship.
- **`blocked`**: Represents a restriction where one user blocks the other.

---

## 2. Visibility & Access Rules

User profiles and friends lists are always visible and browsable to all registered users to promote collaboration and study network discovery. Public vs. private visibility constraints are reserved strictly for **Study Groups** and **Study Sessions**.

---

## 3. Database Functions & Queries

To manage queries and calculate relationships, friendships are queried via Database RPC functions:

### A. `search_users(search_term TEXT, current_user_id UUID)`
- Used on the **Find Friends** page to query users by display name, email, or major.
- Calculates friendship status and `mutual_friends` counts with the `current_user_id`.

### B. `get_user_friends(target_user_id UUID, current_user_id UUID)`
- Fetches the full friends list of `target_user_id`.
- Calculates whether each returned friend has a mutual friendship status with the current user.
- Returns columns: `friend_user_id`, `display_name`, `email`, `major`, `gradient_from`, `gradient_to`, `avatar_url`, and `is_mutual`.

### C. `get_mutual_friends(target_user_id UUID, current_user_id UUID)`
- Directly returns the intersection of accepted friends of `target_user_id` and `current_user_id`.
- Returns columns: `friend_user_id`, `display_name`, `email`, `major`, `gradient_from`, `gradient_to`, `avatar_url`, and `is_mutual`.

---

## 4. Frontend Integration

### A. Service Layer (`src/services/friends.ts`)
- **`FriendsService.getUserFriends()`**: Fetches the authenticated user's accepted friends.
- **`FriendsService.getMutualFriends(targetUserId)`**: Invokes the `get_mutual_friends` database RPC.
- **`FriendsService.sendFriendRequest(friendId)`**: Checks for existing friendship status using `.maybeSingle()` to prevent PostgREST 406 (Not Acceptable) errors when no relationship exists, then inserts a new pending request.
- **`FriendsService.getUserProfile(targetUserId, currentUserId)`**: Fetches profile data, friends/groups counts, friendship status, and calculates the mutual friends count.

### B. Component Layer
- **`FriendsPage` (`src/components/friends/FindFriendsPage.tsx`)**:
  - Main Friends view accessible via the `/friends` route.
  - Implements a two-tab format:
    - **`My Friends`**: Displays current friends and pending requests formatted as `PersonCard` cards with search capability.
    - **`Browse`**: Displays search bar, category filters (All People, Friends, Pending), and `PersonCard` grid for discovering and connecting with new students.
- **`PersonCard`**:
  - Displays user profile summary, mutual friends, study hours, and contextual action buttons (Add Friend, Cancel Request, Message, View Profile).
- **`PersonProfileDialog`**:
  - Displays the profile overview (name, bio, major, year, study stats, public groups, public sessions).
  - Shows the target user's friends preview count and list of friends under a general **Friends** tab.
- **Note on Profile Page**:
  - Profile page (`src/components/profile/Profile.tsx`) has been streamlined; friends list and find friends search are housed exclusively within the **Friends** page.
