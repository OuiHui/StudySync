
import { useState } from 'react';
import { Upload, X, File } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface UploadMaterialPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadMaterialPopup = ({ isOpen, onClose }: UploadMaterialPopupProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('notes');
  const [isPrivate, setIsPrivate] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Literature', 'Computer Science'];
  const categories = ['notes', 'flashcards', 'documents', 'study-guide'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would handle the file upload
    console.log({
      title,
      description,
      subject,
      category,
      isPrivate,
      file
    });
    
    // Reset form and close
    setTitle('');
    setDescription('');
    setSubject('');
    setCategory('notes');
    setIsPrivate(false);
    setFile(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Upload size={20} className="mr-2" />
            Upload Study Material
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="subject">Subject</Label>
            <select
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              required
            >
              <option value="">Select a subject</option>
              {subjects.map(subj => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
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
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600">
              Upload
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
