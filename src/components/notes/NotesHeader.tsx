import { Plus, Upload, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NotesHeaderProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedSubject: string;
  setSelectedSubject: (v: string) => void;
  subjects: string[];
  setIsCreateDialogOpen: (v: boolean) => void;
  setIsUploadPopupOpen: (v: boolean) => void;
}

export const NotesHeader = ({
  searchTerm, setSearchTerm, selectedSubject, setSelectedSubject, subjects,
  setIsCreateDialogOpen, setIsUploadPopupOpen
}: NotesHeaderProps) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Study Materials</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Create, share and access notes, flashcards, and documents</p>
      </div>
      <div className="flex items-center space-x-3">
        <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus size={16} className="mr-2" /> Create Note
        </Button>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => setIsUploadPopupOpen(true)}>
          <Upload size={16} className="mr-2" /> Upload Material
        </Button>
      </div>
    </div>
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="relative flex-1">
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input placeholder="Search notes, flashcards, documents..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>
      <div className="flex items-center space-x-2">
        <Filter size={16} className="text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-300">Filter:</span>
        <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="px-3 py-1 border rounded text-sm bg-white dark:bg-gray-700 dark:text-gray-200">
          {subjects.map(subject => (
            <option key={subject} value={subject}>{subject === 'all' ? 'All Subjects' : subject}</option>
          ))}
        </select>
      </div>
    </div>
  </div>
);
