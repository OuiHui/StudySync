# Business Requirements Document (BRD) - StudySync

## 1. Project Vision & Goals

StudySync is a collaborative study platform designed to help students maximize focus and academic collaboration. The app integrates Pomodoro timers, study groups, real-time messaging, note sharing, and social systems.

The core objective is to create a frictionless, engaging digital environment where students can study solo or in groups, set academic goals, share resources, and build a supportive learning community.

---

## 2. Target Audience & User Personas

*   **The Solo Student**: Focuses on individual productivity, customizing Pomodoro intervals, logging study hours, and tracking academic streaks.
*   **The Collaborator**: Joins study groups, participates in synchronized group Pomodoro sessions, uses live chat, and shares notes.
*   **The Study Group Admin**: Manages group settings, establishes member limits, configures group visibility (public/private), and regulates membership (removing inactive users).
*   **The Social Peer**: Connects with friends, views their active study status, and explores friends' friends lists to expand their study circle.

---

## 3. Scope of Core Features

### A. Pomodoro Timer System
*   **Solo Mode**: Customizable work, short break, and long break intervals.
*   **Group Mode**: Real-time synchronized Pomodoro timer governed by the session host.
*   **Global Persistence**: The active timer state must persist visually in the sidebar/layout across all page navigations.
*   **Study Goals & Milestones**: Setting target Pomodoro cycles and displaying alerts upon session completion.

### B. Study Groups
*   **Group Creation & Settings**: Customizable name, description, subject category, theme colors, and icons.
*   **Group Visibility**: Public (browsable and open to join) vs. Private (requires invitation).
*   **Admin Controls**: Restrict membership limits (`max_members`) and allow group creators to moderate membership lists (including member removal).
*   **Collaboration Hub**: Act as the anchor for group study sessions, document sharing, and real-time chat.

### C. Notes & Material Collaboration
*   **Document Editor**: Create and edit markdown/rich text notes.
*   **Material Attachment**: Upload external learning materials, such as PDFs and slide decks.
*   **Granular Sharing**: Configure note permissions to Private (only owner), Public (everyone), or Shared (with a specific study group).

### D. Social & Friend System
*   **Friending Cycle**: Send, cancel, accept, reject, or delete friend connections.
*   **Friends List Visibility**: Users can view the friends list of their accepted friends, enabling study network discovery.
*   **Presence Indicator**: Display online, away, or offline status to friends.

### E. User Profiles & Dashboard
*   **Profile Metadata**: Display name, email, bio, major, school year, join date, custom gradient avatar, and cumulative study hours.
*   **Dashboard Widgets**: Display summaries of study hours today/this week, active groups, notes shared, and recent study activities.
*   **Privacy Management**: Control visibility of study stats, online presence, study group listings, and direct message permissions.
*   **Notification Settings**: Toggle preferences for email alerts, push notifications, study session reminders, group messages, and friend requests.

### F. Real-time Messaging System
*   **Direct Messages (DMs)**: Initiate and maintain private one-on-one text conversations with accepted friends.
*   **Group Chat**: Auto-created conversation channels for study groups, enabling collaboration among all group members.
*   **Session Lobby Chat**: Integrated live chat within active study sessions to coordinate Pomodoro intervals or resource sharing.
*   **Durable History & Synchronization**: Message records are stored in PostgreSQL database tables for complete history retrieval and synced in real-time across users using Supabase Realtime channels.
*   **Optimistic UI Updates**: Messages are rendered immediately with pending status and updated to sent upon database insertion confirmation.

---

## 4. Key Constraints & Out-of-Scope Items

*   **Offline Mode**: Real-time collaboration features (chat, synchronized timers, collaborative notes) require an active internet connection. Offline editing is currently out-of-scope.
*   **Video/Audio Call Integration**: The platform relies on text messaging and collaborative note-taking. Direct audio or video calls are out-of-scope for the initial release.
