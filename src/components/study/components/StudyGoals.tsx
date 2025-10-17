
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  completed: boolean;
}

interface StudyGoalsProps {
  goals: Goal[];
}

export const StudyGoals = ({ goals }: StudyGoalsProps) => {
  return (
    <Card className="border-0 shadow-md dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="dark:text-white">Today's Study Goals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <div key={goal.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800 dark:text-white">{goal.title}</h4>
                <span className={`w-4 h-4 rounded-full ${goal.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{goal.description}</p>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
