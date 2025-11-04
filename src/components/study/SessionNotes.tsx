
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SessionNotesProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionNotes = ({ isOpen, onClose }: SessionNotesProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 border-0 shadow-xl max-h-[80vh] overflow-y-auto dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="dark:text-white">Shared Study Notes</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="dark:text-gray-300 dark:hover:bg-gray-700"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white mb-2">Integration Techniques Summary</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Key formulas and methods for integration by parts...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
