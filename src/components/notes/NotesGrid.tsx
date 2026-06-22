import { BookOpen, Share, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface NotesGridProps {
  filteredNotes: any[];
  handleViewNote: (note: any) => void;
  handleShareNote: (note: any) => void;
  handleEditNote: (note: any) => void;
  handleDeleteNote: (note: any) => void;
}

export const NotesGrid = ({ filteredNotes, handleViewNote, handleShareNote, handleEditNote, handleDeleteNote }: NotesGridProps) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {filteredNotes.map((note) => (
        <Card key={note.id} className="border-0 shadow-md hover:shadow-xl transition-all duration-200 dark:bg-gray-800 cursor-pointer group" onClick={() => handleViewNote(note)}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 flex-1">
                <div className="flex-1">
                  <CardTitle className="text-lg dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{note.title}</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{note.subject}</p>
                </div>
              </div>
              {note.isMine && (
                <span className={`px-2 py-1 rounded text-xs font-medium ${note.isPrivate ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'}`}>
                  {note.isPrivate ? 'Private' : 'Public'}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">{note.preview}</p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">By {note.author}</span>
                <span className="text-gray-600 dark:text-gray-400">{note.date}</span>
              </div>
            </div>
            {note.isMine && (
              <div className="mt-4 flex space-x-2">
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleShareNote(note); }} className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"><Share size={16} /></Button>
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEditNote(note); }} className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"><Edit size={16} /></Button>
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteNote(note); }} className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={16} /></Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
    {filteredNotes.length === 0 && (
      <div className="text-center py-12">
        <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">No materials found</h3>
        <p className="text-gray-600 dark:text-gray-300">Try adjusting your search or filter criteria</p>
      </div>
    )}
  </>
);
