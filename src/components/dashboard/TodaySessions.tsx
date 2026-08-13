import { Calendar, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { DashboardSession } from '@/hooks/useDashboardData';

export const TodaySessions = ({ sessions, onJoin }: { sessions: DashboardSession[], onJoin: (session: DashboardSession) => void }) => {
  return (
    <Card className="border border-border/80 bg-card text-card-foreground shadow-lg shadow-black/20 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <Calendar size={20} className="mr-2 text-brand" />
          Today's Sessions ({sessions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-brand/10 border border-brand/20 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-brand rounded-lg flex items-center justify-center shadow-sm text-primary-foreground">
                    <Play size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{session.title}</h4>
                    <p className="text-sm text-muted-foreground">{session.groupName}</p>
                    {session.scheduled_start && (
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(session.scheduled_start), 'h:mm a')}
                      </p>
                    )}
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="bg-brand hover:bg-brand-hover text-primary-foreground shadow-sm font-semibold"
                  onClick={() => onJoin(session)}
                >
                  Join
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No sessions scheduled for today</p>
            <p className="text-sm text-muted-foreground/80 mt-1">
              Join a group session to see it here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
