# StudySphere - Collaborative Study Platform

A comprehensive study platform that combines Pomodoro timers, study groups, collaborative note-taking, and social features to enhance your learning experience.

## Features

### **Pomodoro Timer System**
- Solo study sessions with customizable work/break intervals
- Group study sessions with synchronized timers
- Global timer indicator that persists across navigation
- Session goals and progress tracking
- Completion effects and notifications

### **Study Groups**
- Create and join study groups with friends
- Browse public groups by subject
- Group management with customizable themes and icons
- Real-time group study sessions
- Group chat and collaboration features

### **Collaborative Notes & Documents**
- Real-time collaborative editor
- Document sharing and commenting system
- Study material upload and organization
- Multiple document types (study notes, lab reports, essays, etc.)
- Version control and activity tracking

### **Customization**
- Dark/light theme support
- Custom color themes and gradients
- Personalized study environment
- Responsive design for all devices

### **Analytics & Progress**
- Study session tracking and statistics
- Progress visualization with charts
- Achievement system and badges
- Study streaks and goals
- Personal dashboard with insights

### **User Management**
- Secure authentication with Supabase
- Profile customization and privacy settings
- Friend system and social features
- Notification center
- Account management

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui components with Radix UI
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Context + TanStack Query
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: Sonner

## Getting Started

### For Users
- Join existing study groups
- Collaborate on shared documents
- Participate in group study sessions
- Connect with other students worldwide

### For Developers

#### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

#### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/OuiHui/study-sphere-pomodoro-flow.git
   cd study-sphere-pomodoro-flow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

#### Deployment
The app automatically deploys to GitHub Pages when changes are pushed to the main branch. The Supabase database is shared across all deployments for global collaboration.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── calendar/       # Study calendar components
│   ├── chat/           # Chat and messaging
│   ├── dashboard/      # Main dashboard
│   ├── docs/           # Collaborative editor
│   ├── friends/        # Friend system
│   ├── groups/         # Study groups
│   ├── layout/         # Layout components
│   ├── notes/          # Note-taking features
│   ├── profile/        # User profile
│   ├── settings/       # App settings
│   ├── study/          # Timer and study features
│   └── ui/             # Base UI components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── pages/              # Page components
├── services/           # API and database services
├── types/              # TypeScript type definitions
└── utils/              # Helper utilities
```

## Key Features in Detail

### Pomodoro Timer
- **Solo Sessions**: Personal study timer with customizable intervals
- **Group Sessions**: Synchronized timers for collaborative studying
- **Smart Navigation**: Warns when switching between solo/group sessions
- **Persistence**: Timer state maintained across page navigation

### Study Groups
- **Discovery**: Browse and search public study groups
- **Management**: Create, configure, and manage study groups
- **Collaboration**: Real-time group study sessions with chat
- **Themes**: Customizable group appearance and branding

### Real-time Features
- **Collaborative Editing**: Multiple users can edit documents simultaneously
- **Live Chat**: Real-time messaging in study groups
- **Synchronized Timers**: Group members see the same timer state
- **Activity Tracking**: Live updates on user activity and presence

## Database Schema

The application uses Supabase with the following key tables:
- `profiles` - User profiles and settings
- `study_groups` - Study group information
- `group_members` - Group membership relationships
- `study_sessions` - Study session records
- `notes` - Collaborative documents and notes
- `messages` - Chat messages and notifications
- `friendships` - User connections

## Deployment to GitHub Pages

This project is configured to automatically deploy to GitHub Pages. To set it up:

1. **Enable GitHub Pages** in your repository settings:
   - Go to Settings → Pages
   - Set Source to "GitHub Actions"

2. **The deployment workflow** will automatically:
   - Build the project when you push to main
   - Deploy to `https://yourusername.github.io/study-sphere-pomodoro-flow`
   - Use the shared Supabase database for global collaboration

3. **All users worldwide** will interact with the same database, enabling true collaboration!

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on GitHub or contact the development team.
