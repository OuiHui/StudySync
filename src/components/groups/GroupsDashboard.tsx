import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StudyCalendar } from '@/components/calendar/StudyCalendar';
import { Calendar } from 'lucide-react';

export const GroupsDashboard = () => {
  return (
    <Card className="border border-gray-100 dark:border-gray-700/60 shadow-none bg-white dark:bg-gray-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
          <Calendar size={16} className="text-gray-400" />
          Group Study Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StudyCalendar compact={true} />
      </CardContent>
    </Card>
  );
};
