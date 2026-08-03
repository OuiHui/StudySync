import { BookOpen, Users, Timer } from 'lucide-react';

export const AuthHeader = () => {
  return (
    <>
      <div className="text-center space-y-2">
        <div className="flex justify-center items-center space-x-2.5 mb-3">
          <div className="w-10 h-10 bg-[#2a78d6] rounded-xl flex items-center justify-center shadow-md">
            <BookOpen size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">StudySync</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
          Join thousands of students in collaborative learning
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="space-y-2">
          <Timer className="w-8 h-8 mx-auto text-blue-500" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Study Timer</p>
        </div>
        <div className="space-y-2">
          <Users className="w-8 h-8 mx-auto text-green-500" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Study Groups</p>
        </div>
        <div className="space-y-2">
          <BookOpen className="w-8 h-8 mx-auto text-purple-500" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Shared Notes</p>
        </div>
      </div>
    </>
  );
};
