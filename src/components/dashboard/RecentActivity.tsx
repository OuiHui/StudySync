import { Clock, Users, BookOpen, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityItem } from '@/hooks/useDashboardData';

export const RecentActivity = ({ activity }: { activity: ActivityItem[] }) => {
  return (
    <Card className="border-0 shadow-md dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-800 dark:text-white">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activity.length > 0 ? (
            activity.map((item, index) => {
              const getActivityIcon = (type: string) => {
                switch (type) {
                  case 'share':
                  case 'note': return <BookOpen size={14} className="text-white" />;
                  case 'join':
                  case 'group': return <Users size={14} className="text-white" />;
                  case 'study':
                  case 'session': return <Play size={14} className="text-white" />;
                  default: return <Clock size={14} className="text-white" />;
                }
              };

              const getActivityColor = (type: string) => {
                switch (type) {
                  case 'share':
                  case 'note': return 'bg-green-500';
                  case 'join':
                  case 'group': return 'bg-purple-500';
                  case 'study':
                  case 'session': return 'bg-blue-500';
                  default: return 'bg-gray-500';
                }
              };

              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${getActivityColor(item.type)} rounded-full flex items-center justify-center`}>
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{item.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.timestamp}</p>
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
  );
};
