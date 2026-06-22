import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteGroupModalProps {
  show: boolean;
  onClose: () => void;
  groupName: string;
  deleteConfirm: string;
  setDeleteConfirm: (val: string) => void;
  onDelete: () => void;
  loading: boolean;
}

export const DeleteGroupModal = ({
  show,
  onClose,
  groupName,
  deleteConfirm,
  setDeleteConfirm,
  onDelete,
  loading
}: DeleteGroupModalProps) => {
  if (!show) return null;

  const canDelete = deleteConfirm === groupName;

  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="border-red-200 bg-red-50 dark:bg-red-900 dark:border-red-800 max-w-md w-full shadow-xl">
        <CardHeader>
          <CardTitle className="text-red-800 dark:text-red-300 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Delete Group
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-red-700 dark:text-red-300">
            This action cannot be undone. This will permanently delete the group and all associated data including:
          </p>
          <ul className="list-disc list-inside text-red-700 dark:text-red-300 space-y-1">
            <li>All group sessions and study materials</li>
            <li>All member data and progress</li>
            <li>Group chat history</li>
            <li>Group notes and documents</li>
          </ul>
          
          <div className="space-y-2">
            <Label htmlFor="deleteConfirm" className="text-red-800 dark:text-red-300">
              Type the group name <strong>{groupName}</strong> to confirm:
            </Label>
            <Input
              id="deleteConfirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={groupName}
              disabled={loading}
              className="border-red-300 focus:border-red-500 dark:border-red-700 dark:focus:border-red-500"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onDelete}
              disabled={loading || !canDelete}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {loading ? 'Deleting...' : 'Delete Group Permanently'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
