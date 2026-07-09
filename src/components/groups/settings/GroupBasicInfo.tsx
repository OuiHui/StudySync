import { Type, BookOpen, FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface GroupBasicInfoProps {
  formData: {
    name: string;
    subject: string;
    description: string;
  };
  setFormData: (updater: (prev: any) => any) => void;
  loading: boolean;
}

export const GroupBasicInfo = ({ formData, setFormData, loading }: GroupBasicInfoProps) => {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="settings-name" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Type size={14} className="text-blue-500" />
          Group Name <span className="text-red-400">*</span>
        </Label>
        <Input
          id="settings-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter group name..."
          disabled={loading}
          className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-400/20 transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="settings-course" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <BookOpen size={14} className="text-purple-500" />
          Course
        </Label>
        <Input
          id="settings-course"
          value={formData.subject}
          onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
          placeholder="e.g., CS 1331, MATH 1552..."
          disabled={loading}
          className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 focus:border-purple-400 dark:focus:border-purple-500 focus:ring-purple-400/20 transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="settings-description" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <FileText size={14} className="text-emerald-500" />
          Description
        </Label>
        <Textarea
          id="settings-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe your group's purpose and goals..."
          rows={4}
          disabled={loading}
          className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-emerald-400/20 transition-colors resize-none"
        />
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {formData.description.length}/500 characters
        </p>
      </div>
    </div>
  );
};
