import { useState, useEffect } from 'react';
import { BookOpen, Users, Calendar, Bell, BellDot, Play, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { StudySessionsService, ProfileService, StudyGroupsService, NotesService, NotificationsService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, parseISO } from 'date-fns';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
  hasUnreadNotifications?: boolean;
  onMarkAllNotificationsRead?: () => void;
}

export const Dashboard = ({ onNavigate, onMarkAllNotificationsRead }: DashboardProps) => {
  const { user } = useAuth();
  const [attendingSessions, setAttendingSessions] = useState<Array<{id: string, title: string, groupName: string, scheduled_start?: string}>>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [userStats, setUserStats] = useState({
    studyHoursToday: '0h',
    activeGroups: '0',
    notesShared: '0',
    sessionsThisWeek: '0'
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notifications and check for unread ones
  const loadNotifications = async () => {
    if (!user) return;

    try {
      const notifications = await NotificationsService.getUserNotifications();
      const unreadCount = notifications.filter(n => !n.read).length;
      setHasUnreadNotifications(unreadCount > 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setHasUnreadNotifications(false);
    }
  };

  // Load real data from database
  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load user's sessions for today
      const sessions = await StudySessionsService.getSessions();
      const todaySessions = sessions.filter(session => 
        isToday(parseISO(session.scheduled_start))
      );
      
      const formattedSessions = todaySessions.map(session => ({
        id: session.id,
        title: session.title,
        groupName: session.study_groups?.name || 'Solo Session',
        scheduled_start: session.scheduled_start
      }));
      setAttendingSessions(formattedSessions);

      // Calculate this week's sessions
      const today = new Date();
      const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
      weekStart.setHours(0, 0, 0, 0);
      const thisWeekSessions = sessions.filter(session => {
        const sessionDate = new Date(session.scheduled_start);
        return sessionDate >= weekStart && session.status === 'completed';
      });

      // Load user stats for groups and notes
      try {
        const statsData = await ProfileService.getUserStats();
        const todayHours = await ProfileService.getStudyHoursToday();
        
        setUserStats({
          studyHoursToday: `${todayHours}h`,
          activeGroups: String(statsData.groupsJoined || 0),
          notesShared: String(statsData.notesShared || 0),
          sessionsThisWeek: String(thisWeekSessions.length)
        });
      } catch (statsError) {
        console.log('Error loading stats:', statsError);
        // Set fallback values
        setUserStats({
          studyHoursToday: '0h',
          activeGroups: '0',
          notesShared: '0',
          sessionsThisWeek: String(thisWeekSessions.length)
        });
      }

      // Load recent activity
      try {
        const activity = await ProfileService.getRecentActivity();
        // Format activity data for the Dashboard display
        const formattedActivity = activity.slice(0, 2).map(item => ({
          type: item.type || 'session',
          description: item.description || item.action || 'Activity completed',
          timestamp: item.time || format(parseISO(item.created_at), 'h:mm a')
        }));
        setRecentActivity(formattedActivity);
      } catch (activityError) {
        console.log('Error loading recent activity:', activityError);
        // Set fallback activity
        setRecentActivity([]);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    loadNotifications();

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
  }, [user]);

  const stats = [
    { label: 'Study Hours Today', value: userStats.studyHoursToday, icon: Clock, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Active Groups', value: userStats.activeGroups, icon: Users, color: 'text-green-600 dark:text-green-400' },
    { label: 'Notes Shared', value: userStats.notesShared, icon: BookOpen, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Sessions This Week', value: userStats.sessionsThisWeek, icon: Calendar, color: 'text-orange-600 dark:text-orange-400' }
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

  const handleMarkAllRead = async () => {
    try {
      await NotificationsService.markAllAsRead();
      setHasUnreadNotifications(false);
      if (onMarkAllNotificationsRead) {
        onMarkAllNotificationsRead();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
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

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Clock className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
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
                          {session.scheduled_start && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {format(parseISO(session.scheduled_start), 'h:mm a')}
                            </p>
                          )}
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
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => {
                      const getActivityIcon = (type: string) => {
                        switch (type) {
                          case 'share':
                          case 'note':
                            return <BookOpen size={14} className="text-white" />;
                          case 'join':
                          case 'group':
                            return <Users size={14} className="text-white" />;
                          case 'study':
                          case 'session':
                            return <Play size={14} className="text-white" />;
                          default:
                            return <Clock size={14} className="text-white" />;
                        }
                      };

                      const getActivityColor = (type: string) => {
                        switch (type) {
                          case 'share':
                          case 'note':
                            return 'bg-green-500';
                          case 'join':
                          case 'group':
                            return 'bg-purple-500';
                          case 'study':
                          case 'session':
                            return 'bg-blue-500';
                          default:
                            return 'bg-gray-500';
                        }
                      };

                      return (
                        <div key={index} className="flex items-center space-x-3">
                          <div className={`w-8 h-8 ${getActivityColor(activity.type)} rounded-full flex items-center justify-center`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 dark:text-white">{activity.description}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{activity.timestamp}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <BookOpen size={14} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-white">Welcome to StudySync!</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Start studying to see activity here</p>
                        </div>
                      </div>
                    </div>
                  )}
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
                    <span className="text-gray-800 dark:text-white">{userStats.studyHoursToday}/8 hours</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${Math.min((parseFloat(userStats.studyHoursToday.replace('h', '')) / 8) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-300">Sessions Completed</span>
                    <span className="text-gray-800 dark:text-white">{userStats.sessionsThisWeek}/10 sessions</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${Math.min((parseInt(userStats.sessionsThisWeek) / 10) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <NotificationCenter
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        hasUnread={hasUnreadNotifications}
        onMarkAllRead={handleMarkAllRead}
      />
    </div>
  );
};
