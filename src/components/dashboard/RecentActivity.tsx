import { Clock, Users, BookOpen, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityItem } from '@/hooks/useDashboardData';

export const RecentActivity = ({ activity }: { activity: ActivityItem[] }) => {
  return (
    <Card className="border border-border/80 bg-card text-card-foreground shadow-lg shadow-black/20 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-foreground font-semibold">Recent Activity</CardTitle>
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
                  case 'note': return 'bg-emerald-500';
                  case 'join':
                  case 'group': return 'bg-brand';
                  case 'study':
                  case 'session': return 'bg-blue-500';
                  default: return 'bg-slate-500';
                }
              };

              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${getActivityColor(item.type)} rounded-full flex items-center justify-center shadow-xs`}>
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-xs">
                  <BookOpen size={14} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Welcome to StudySync!</p>
                  <p className="text-xs text-muted-foreground">Start studying to see activity here</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
