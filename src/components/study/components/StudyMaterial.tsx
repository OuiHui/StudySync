
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const StudyMaterial = () => {
  return (
    <Card className="border-0 shadow-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="dark:text-white">Current Study Material</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="font-medium text-gray-800 dark:text-white mb-2">Advanced Calculus - Chapter 7</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Integration techniques and applications</p>
          <div className="mt-3 flex space-x-2">
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded">Mathematics</span>
            <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded">Calculus</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
