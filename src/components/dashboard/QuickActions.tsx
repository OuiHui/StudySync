import { Play, Users, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const QuickActions = ({ onAction }: { onAction: (action: string) => void }) => {
  return (
    <Card className="border-0 shadow-md dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-800 dark:text-white">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          className="w-full justify-start bg-blue-500 hover:bg-blue-600 text-white"
          onClick={() => onAction('start-session')}
        >
          <Play size={16} className="mr-2" />
          Start Study Session
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          onClick={() => onAction('join-group')}
        >
          <Users size={16} className="mr-2" />
          Join Study Group
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          onClick={() => onAction('browse-notes')}
        >
          <BookOpen size={16} className="mr-2" />
          Browse Notes
        </Button>
      </CardContent>
    </Card>
  );
};
