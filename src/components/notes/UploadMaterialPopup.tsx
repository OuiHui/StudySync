
import { useState, useEffect } from 'react';
import { Upload, X, File, Loader2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NotesService, StudyGroupsService } from '@/services/database';
import { Checkbox } from '@/components/ui/checkbox';

interface UploadMaterialPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

export const UploadMaterialPopup = ({ isOpen, onClose, onUploadSuccess }: UploadMaterialPopupProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('notes');
  const [isPrivate, setIsPrivate] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customSubjects, setCustomSubjects] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  const categories = ['notes', 'flashcards', 'documents', 'study-guide'];

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [subjects, groups] = await Promise.all([
        NotesService.getUserSubjects(),
        StudyGroupsService.getUserGroups()
      ]);
      setCustomSubjects(subjects);
      setUserGroups(groups);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) {
      setError('Subject name is required');
      return;
    }

    try {
      const newSubject = await NotesService.createSubject(newSubjectName);
      setCustomSubjects(prev => [...prev, newSubject]);
      setSubject((newSubject as any)?.name || newSubjectName);
      setNewSubjectName('');
      setShowNewSubject(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subject');
    }
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!subject) {
      setError('Subject is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let fileUrl = null;
      let fileName = null;

      // If a file is selected, upload it to Supabase Storage
      if (file) {
        const uploadResult = await NotesService.uploadFile(file);
        if (uploadResult) {
          fileUrl = uploadResult.url;
          fileName = uploadResult.fileName;
        }
      }

      // Create note with the form data and file URL if available
      const note = await NotesService.createNote({
        title: title.trim(),
        content: description || '',
        subject: subject,
        permission_level: isPrivate ? 'private' : 'public',
        file_url: fileUrl,
        file_name: fileName
      });

      // Share with selected groups if any
      if (note && selectedGroups.length > 0) {
        await NotesService.shareNoteWithGroups(note.id, selectedGroups);
      }

      // Reset form
      setTitle('');
      setDescription('');
      setSubject('');
      setCategory('notes');
      setIsPrivate(false);
      setFile(null);
      setSelectedGroups([]);
      
      // Call success callback and close
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Error creating note:', err);
      setError(err instanceof Error ? err.message : 'Failed to create note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Upload size={20} className="mr-2" />
            Upload Study Material
          </DialogTitle>
          <DialogDescription>
            Upload your study materials, notes, or documents to share with your study groups or keep private.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
          {/* File Upload */}
          <div>
            <Label htmlFor="file">File</Label>
            <div className="mt-1">
              <input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
              />
              {file && (
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <File size={16} className="mr-1" />
                  {file.name}
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter material title..."
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the material..."
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              rows={3}
            />
          </div>

          {/* Subject */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="subject">Subject</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowNewSubject(!showNewSubject)}
                className="h-auto p-1 text-xs"
              >
                <Plus size={14} className="mr-1" />
                New Subject
              </Button>
            </div>
            
            {showNewSubject ? (
              <div className="flex gap-2 mb-2">
                <Input
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Enter new subject name..."
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateSubject}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Add
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowNewSubject(false);
                    setNewSubjectName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : null}
            
            <select
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              required
            >
              <option value="">Select a subject</option>
              {customSubjects.length === 0 ? (
                <option value="" disabled>Create a subject first using + New Subject</option>
              ) : (
                customSubjects.map(subj => (
                  <option key={subj.id} value={subj.name}>{subj.name}</option>
                ))
              )}
            </select>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option value="notes">Notes</option>
              <option value="flashcards">Flashcards</option>
              <option value="documents">Documents</option>
              <option value="study-guide">Study Guide</option>
            </select>
          </div>

          {/* Share with Groups */}
          {!isPrivate && userGroups.length > 0 && (
            <div>
              <Label>Share with Study Groups (optional)</Label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-2 dark:border-gray-600">
                {userGroups.map(group => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`group-${group.id}`}
                      checked={selectedGroups.includes(group.id)}
                      onCheckedChange={() => toggleGroupSelection(group.id)}
                    />
                    <label
                      htmlFor={`group-${group.id}`}
                      className="text-sm cursor-pointer dark:text-white"
                    >
                      {group.name}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Selected groups: {selectedGroups.length}
              </p>
            </div>
          )}

          {/* Privacy */}
          <div className="flex items-center space-x-2">
            <input
              id="privacy"
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="privacy" className="text-sm">
              Make this material private (only visible to you)
            </Label>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Note'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
