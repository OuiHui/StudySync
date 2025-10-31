
import { useState } from 'react';
import { Plus, Settings, Users, Lock, Unlock, LogOut, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GroupManagementProps {
  onCreateGroup?: (group: any) => void;
  onJoinGroup?: (groupId: string) => void;
  onLeaveGroup?: (groupId: string) => void;
}

export const GroupManagement = ({ onCreateGroup, onJoinGroup, onLeaveGroup }: GroupManagementProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSubject, setNewGroupSubject] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupPrivacy, setNewGroupPrivacy] = useState<'public' | 'private'>('public');

  const availableGroups = [
    {
      id: '4',
      name: 'Data Structures & Algorithms',
      subject: 'Computer Science',
      members: 8,
      isPrivate: false,
      description: 'Weekly coding practice sessions'
    },
    {
      id: '5',
      name: 'Spanish Conversation',
      subject: 'Languages',
      members: 6,
      isPrivate: false,
      description: 'Practice Spanish speaking skills'
    },
    {
      id: '6',
      name: 'Medical Study Group',
      subject: 'Medicine',
      members: 12,
      isPrivate: true,
      description: 'Advanced medical topics discussion'
    }
  ];

  const handleCreateGroup = () => {
    if (newGroupName.trim() && newGroupSubject.trim()) {
      const newGroup = {
        id: Date.now().toString(),
        name: newGroupName,
        subject: newGroupSubject,
        description: newGroupDescription,
        members: 1,
        role: 'admin',
        isPrivate: newGroupPrivacy === 'private',
        color: 'bg-indigo-500'
      };
      
      onCreateGroup?.(newGroup);
      setIsCreating(false);
      setNewGroupName('');
      setNewGroupSubject('');
      setNewGroupDescription('');
      setNewGroupPrivacy('public');
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Group Management</span>
          <Button
            onClick={() => setIsCreating(!isCreating)}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus size={16} className="mr-1" />
            Create Group
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create New Group Form */}
        {isCreating && (
          <div className="p-4 bg-blue-50 rounded-lg space-y-3">
            <h4 className="font-medium text-blue-800">Create New Study Group</h4>
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupSubject">Subject</Label>
              <Input
                id="groupSubject"
                value={newGroupSubject}
                onChange={(e) => setNewGroupSubject(e.target.value)}
                placeholder="Enter subject..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupDescription">Description (Optional)</Label>
              <Input
                id="groupDescription"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Brief description..."
              />
            </div>
            <div className="space-y-2">
              <Label>Privacy Setting</Label>
              <Select value={newGroupPrivacy} onValueChange={(value: 'public' | 'private') => setNewGroupPrivacy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Anyone can join</SelectItem>
                  <SelectItem value="private">Private - Invite only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleCreateGroup} size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                Create Group
              </Button>
              <Button onClick={() => setIsCreating(false)} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Available Groups to Join */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Available Groups</h4>
          {availableGroups.map((group) => (
            <div key={group.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h5 className="font-medium text-sm">{group.name}</h5>
                  {group.isPrivate ? (
                    <Lock size={12} className="text-gray-500" />
                  ) : (
                    <Unlock size={12} className="text-green-500" />
                  )}
                </div>
                <p className="text-xs text-gray-600">{group.subject}</p>
                <p className="text-xs text-gray-500 flex items-center mt-1">
                  <Users size={10} className="mr-1" />
                  {group.members} members
                </p>
              </div>
              <Button
                onClick={() => onJoinGroup?.(group.id)}
                size="sm"
                variant={group.isPrivate ? "outline" : "default"}
                className={!group.isPrivate ? "bg-green-500 hover:bg-green-600 text-white" : ""}
              >
                <UserPlus size={14} className="mr-1" />
                {group.isPrivate ? 'Request' : 'Join'}
              </Button>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <h4 className="font-medium text-gray-700 mb-2">Quick Actions</h4>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
              <LogOut size={14} className="mr-1" />
              Leave Current Session
            </Button>
            <Button variant="outline" size="sm">
              <Settings size={14} className="mr-1" />
              Group Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
