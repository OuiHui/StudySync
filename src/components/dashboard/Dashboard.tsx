
import { useState, useEffect } from 'react';
import { BookOpen, Users, Calendar, Bell, BellDot, Play, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
  hasUnreadNotifications?: boolean;
  onMarkAllNotificationsRead?: () => void;
}

export const Dashboard = ({ onNavigate, hasUnreadNotifications = true, onMarkAllNotificationsRead }: DashboardProps) => {
  const [attendingSessions, setAttendingSessions] = useState<Array<{id: string, title: string, groupName: string}>>([
    { id: '1', title: 'Integration Techniques', groupName: 'Advanced Mathematics' }
  ]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const handleSessionAttendance = (event: CustomEvent) => {
      const { sessionId, groupName, attending } = event.detail;
      
      if (attending) {
        setAttendingSessions(prev => [...prev, {
          id: sessionId,
          title: 'Study Session',
          groupName
        }]);
      } else {
        setAttendingSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    };

    window.addEventListener('sessionAttendanceChanged', handleSessionAttendance as EventListener);
    
    return () => {
      window.removeEventListener('sessionAttendanceChanged', handleSessionAttendance as EventListener);
    };
  }, []);

  const stats = [
    { label: 'Study Hours Today', value: '4.5h', icon: Clock, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Active Groups', value: '3', icon: Users, color: 'text-green-600 dark:text-green-400' },
    { label: 'Notes Shared', value: '12', icon: BookOpen, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Sessions This Week', value: '8', icon: Calendar, color: 'text-orange-600 dark:text-orange-400' }
  ];

  const handleQuickAction = (action: string) => {
    if (onNavigate) {
      switch (action) {
        case 'start-session':
          onNavigate('study-session');
          break;
        case 'join-group':
          onNavigate('browse-groups');
          break;
        case 'browse-notes':
          onNavigate('notes');
          break;
        default:
          break;
      }
    }
  };

  const handleMarkAllRead = () => {
    if (onMarkAllNotificationsRead) {
      onMarkAllNotificationsRead();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Welcome back! Here's your study overview.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="relative dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          onClick={() => setNotificationsOpen(true)}
        >
          {hasUnreadNotifications ? <BellDot size={16} /> : <Bell size={16} />}
          <span className="ml-2">Notifications</span>
          {hasUnreadNotifications && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          )}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-md dark:bg-gray-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">{stat.value}</p>
                </div>
                <stat.icon size={20} className={stat.color} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-800 dark:text-white">
            <Calendar size={20} className="mr-2 text-blue-600" />
            Today's Sessions ({attendingSessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendingSessions.length > 0 ? (
            <div className="space-y-3">
              {attendingSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Play size={16} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white">{session.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{session.groupName}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => handleQuickAction('start-session')}
                  >
                    Join
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400">No sessions scheduled for today</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Join a group session to see it here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => handleQuickAction('start-session')}
            >
              <Play size={16} className="mr-2" />
              Start Study Session
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={() => handleQuickAction('join-group')}
            >
              <Users size={16} className="mr-2" />
              Join Study Group
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={() => handleQuickAction('browse-notes')}
            >
              <BookOpen size={16} className="mr-2" />
              Browse Notes
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <BookOpen size={14} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">Completed calculus notes</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Users size={14} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">Joined Physics Study Group</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">5 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-white">Study Progress This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Study Hours</span>
                <span className="text-gray-800 dark:text-white">32/40 hours</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full w-4/5"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Sessions Completed</span>
                <span className="text-gray-800 dark:text-white">8/10 sessions</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full w-4/5"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <NotificationCenter
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        hasUnread={hasUnreadNotifications}
        onMarkAllRead={handleMarkAllRead}
      />
    </div>
  );
};
