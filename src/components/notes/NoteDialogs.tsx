import { Plus, Edit, Share, BookOpen, Download, Save, X, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { UploadMaterialPopup } from './UploadMaterialPopup';
import { MarkdownEditor } from './MarkdownEditor';
import { MarkdownRenderer } from './MarkdownRenderer';

export const NoteDialogs = (props: any) => {
  const {
    isCreateDialogOpen, setIsCreateDialogOpen, newNoteData, setNewNoteData, handleCreateNote, groups,
    editingNote, setEditingNote, editFormData, setEditFormData, handleSaveEdit, toggleGroupSelection,
    viewDialogOpen, setViewDialogOpen, viewingNote,
    shareDialogOpen, setShareDialogOpen, sharingNote, shareSelectedGroups, toggleShareGroupSelection, handleSaveShare,
    isUploadPopupOpen, setIsUploadPopupOpen, loadNotes
  } = props;

  return (
    <>
      <UploadMaterialPopup isOpen={isUploadPopupOpen} onClose={() => { setIsUploadPopupOpen(false); loadNotes(); }} />
      
      {/* Create Note */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Create New Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={newNoteData.title} onChange={(e) => setNewNoteData((prev: any) => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Study Group (Subject)</Label>
                <select value={newNoteData.group_id} onChange={(e) => {
                  const selectedGroup = groups.find((g: any) => g.id === e.target.value);
                  setNewNoteData((prev: any) => ({ ...prev, group_id: e.target.value, subject: selectedGroup?.subject || prev.subject }));
                }} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                  <option value="">Personal Note (No Group)</option>
                  {groups.map((group: any) => <option key={group.id} value={group.id}>{group.name} - {group.subject}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <MarkdownEditor value={newNoteData.content || ''} onChange={(val) => setNewNoteData((prev: any) => ({ ...prev, content: val }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); setNewNoteData({ title: '', content: '', subject: '', group_id: '' }); }}><X className="h-4 w-4 mr-2" /> Cancel</Button>
            <Button onClick={handleCreateNote} disabled={!newNoteData.title.trim()} className="bg-green-500 hover:bg-green-600 text-white"><Save className="h-4 w-4 mr-2" /> Create Note</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Note */}
      <Dialog open={!!editingNote} onOpenChange={(open) => !open && setEditingNote(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit className="h-5 w-5" /> Edit Note</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={editFormData.title} onChange={(e) => setEditFormData((prev: any) => ({ ...prev, title: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Subject</Label><Input value={editFormData.subject} onChange={(e) => setEditFormData((prev: any) => ({ ...prev, subject: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Content</Label><MarkdownEditor value={editFormData.content || ''} onChange={(val) => setEditFormData((prev: any) => ({ ...prev, content: val }))} /></div>
            <div className="space-y-2"><Label>Privacy</Label><select value={editFormData.permission_level} onChange={(e) => setEditFormData((prev: any) => ({ ...prev, permission_level: e.target.value }))} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-200">
              <option value="private">Private</option><option value="friends">Friends</option><option value="group">Group</option><option value="public">Public</option>
            </select></div>
            {editFormData.permission_level === 'group' && groups.length > 0 && (
              <div className="space-y-2"><Label>Share with Study Groups</Label><div className="border rounded-md p-4 space-y-3 max-h-48 overflow-y-auto">
                {groups.map((group: any) => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <Checkbox checked={editFormData.selectedGroups.includes(group.id)} onCheckedChange={() => toggleGroupSelection(group.id)} />
                    <label className="text-sm font-medium">{group.name}</label>
                  </div>
                ))}
              </div></div>
            )}
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditingNote(null)}>Cancel</Button><Button onClick={handleSaveEdit} disabled={!editFormData.title.trim()}>Save Changes</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Note */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => !open && setViewDialogOpen(false)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> {viewingNote?.title}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {viewingNote?.file_url && (
              <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
                {viewingNote.file_url.endsWith('.pdf') ? <iframe src={viewingNote.file_url} className="w-full h-[600px]" /> :
                  viewingNote.file_url.match(/.(jpg|jpeg|png|gif|webp)$/i) ? <img src={viewingNote.file_url} className="w-full h-auto" /> :
                  <div className="p-4 text-center"><Button onClick={() => window.open(viewingNote.file_url, '_blank')}><Download size={16} className="mr-2" /> Download</Button></div>}
              </div>
            )}
            {viewingNote?.content && <MarkdownRenderer content={viewingNote.content} className="p-4 bg-white dark:bg-gray-800 rounded-lg border" />}
            {!viewingNote?.content && viewingNote?.preview && <MarkdownRenderer content={viewingNote.preview} className="p-4 bg-white dark:bg-gray-800 rounded-lg border" />}
          </div>
          <div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button></div>
        </DialogContent>
      </Dialog>

      {/* Share Note */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Share className="h-5 w-5" /> Share Note</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {groups.length === 0 ? <div className="text-center py-8"><Users className="h-12 w-12 mx-auto mb-2 text-gray-400" /><p>No groups</p></div> : (
              <div className="space-y-2"><Label>Select Groups</Label><div className="border rounded-md p-4 space-y-3 max-h-64 overflow-y-auto">
                {groups.map((group: any) => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <Checkbox checked={shareSelectedGroups.includes(group.id)} onCheckedChange={() => toggleShareGroupSelection(group.id)} />
                    <label className="text-sm font-medium">{group.name}</label>
                  </div>
                ))}
              </div></div>
            )}
            <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => { setShareDialogOpen(false); setSharingNote(null); }}>Cancel</Button><Button onClick={handleSaveShare}>Save Sharing</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
