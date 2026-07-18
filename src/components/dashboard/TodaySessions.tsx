import { Calendar, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { DashboardSession } from '@/hooks/useDashboardData';

export const TodaySessions = ({ sessions, onJoin }: { sessions: DashboardSession[], onJoin: (session: DashboardSession) => void }) => {
  return (
    <Card className="border-0 shadow-md dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-800 dark:text-white">
          <Calendar size={20} className="mr-2 text-blue-600" />
          Today's Sessions ({sessions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => (
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
                  onClick={() => onJoin(session)}
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
  );
};
