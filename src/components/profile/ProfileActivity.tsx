import { Clock, BookOpen, Users, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ProfileActivity = ({ activity }: { activity: any[] }) => {
  return (
    <Card className="border-0 shadow-md dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-800 dark:text-white">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activity.map((item) => (
            <div key={item.id} className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                item.type === 'study' ? 'bg-blue-100 dark:bg-blue-800' :
                item.type === 'share' ? 'bg-green-100 dark:bg-green-800' :
                item.type === 'join' ? 'bg-purple-100 dark:bg-purple-800' :
                'bg-orange-100 dark:bg-orange-800'
              }`}>
                {item.type === 'study' && <Clock size={16} className="text-blue-600 dark:text-blue-300" />}
                {item.type === 'share' && <BookOpen size={16} className="text-green-600 dark:text-green-300" />}
                {item.type === 'join' && <Users size={16} className="text-purple-600 dark:text-purple-300" />}
                {item.type === 'create' && <Target size={16} className="text-orange-600 dark:text-orange-300" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white">{item.action}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
