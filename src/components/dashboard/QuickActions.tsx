import { Play, Users, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const QuickActions = ({ onAction }: { onAction: (action: string) => void }) => {
  return (
    <Card className="border border-border/80 bg-card text-card-foreground shadow-lg shadow-black/20 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-foreground font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          className="w-full justify-start bg-brand hover:bg-brand-hover text-primary-foreground shadow-sm font-semibold transition-all"
          onClick={() => onAction('study-session')}
        >
          <Play size={16} className="mr-2" />
          Start Study Session
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start border border-border bg-card/60 hover:bg-muted text-foreground hover:border-brand/40 transition-colors"
          onClick={() => onAction('browse-groups')}
        >
          <Users size={16} className="mr-2 text-brand" />
          Join Study Group
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start border border-border bg-card/60 hover:bg-muted text-foreground hover:border-brand/40 transition-colors"
          onClick={() => onAction('notes')}
        >
          <BookOpen size={16} className="mr-2 text-brand" />
          Browse Notes
        </Button>
      </CardContent>
    </Card>
  );
};
