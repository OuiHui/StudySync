import { BookOpen, Users, Timer } from 'lucide-react';

export const AuthHeader = () => {
  return (
    <>
      <div className="text-center space-y-2">
        <div className="flex justify-center items-center space-x-2 mb-4">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <BookOpen size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">StudySync</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Join thousands of students in collaborative learning
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="space-y-2">
          <Timer className="w-8 h-8 mx-auto text-blue-500" />
          <p className="text-sm text-gray-600 dark:text-gray-300">Study Timer</p>
        </div>
        <div className="space-y-2">
          <Users className="w-8 h-8 mx-auto text-green-500" />
          <p className="text-sm text-gray-600 dark:text-gray-300">Study Groups</p>
        </div>
        <div className="space-y-2">
          <BookOpen className="w-8 h-8 mx-auto text-purple-500" />
          <p className="text-sm text-gray-600 dark:text-gray-300">Shared Notes</p>
        </div>
      </div>
    </>
  );
};
