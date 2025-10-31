
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotesService } from '@/services/database';
import { BookOpen, Loader2 } from 'lucide-react';

export const StudyMaterial = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const userNotes = await NotesService.getNotes();
      // Get the most recent note
      if (userNotes.length > 0) {
        setNotes([userNotes[0]]);
      }
    } catch (err) {
      console.error('Error loading notes:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="dark:text-white">Current Study Material</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : notes.length > 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 dark:text-white mb-2">{notes[0].title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {notes[0].content 
                ? notes[0].content.substring(0, 100) + (notes[0].content.length > 100 ? '...' : '')
                : 'No content preview available'}
            </p>
            <div className="mt-3 flex space-x-2">
              {notes[0].subject && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded">
                  {notes[0].subject}
                </span>
              )}
              <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded">
                Recent
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">No study materials yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Create a note to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
