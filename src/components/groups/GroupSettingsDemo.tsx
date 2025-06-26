import { useState } from 'react';
import { GroupSettingsDialog } from '@/components/groups/GroupSettingsDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Users, Crown } from 'lucide-react';

const GroupSettingsDemo = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Mock group data for demonstration
  const mockGroup = {
    id: 'demo-group-1',
    name: 'Advanced Mathematics Study Group',
    description: 'A comprehensive study group focused on advanced mathematical concepts including multivariable calculus, linear algebra, and differential equations. Join us for collaborative learning and problem-solving sessions.',
    subject: 'Mathematics',
    is_public: true,
    max_members: 25,
    member_count: 12,
    created_at: '2024-01-10T00:00:00Z'
  };

  const handleGroupUpdated = (updatedGroup: any) => {
    console.log('Group updated successfully:', updatedGroup);
    // In a real app, you would update the group data in your state/store
  };

  const handleGroupDeleted = (groupId: string) => {
    console.log('Group deleted successfully:', groupId);
    // In a real app, you would navigate away or update the UI
    alert('Group has been deleted successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Group Settings Demo
          </h1>
          <p className="text-gray-600 text-lg">
            Demonstration of the Group Settings functionality for admin users
          </p>
        </div>

        {/* Demo Group Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Users size={24} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-gray-800">{mockGroup.name}</CardTitle>
                  <p className="text-gray-600">{mockGroup.subject}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-yellow-400 p-2 rounded-full">
                  <Crown size={16} className="text-yellow-800" />
                </div>
                <span className="text-sm text-gray-600">You are the admin</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-700 leading-relaxed">
              {mockGroup.description}
            </p>
            
            {/* Group Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{mockGroup.member_count}</div>
                <div className="text-sm text-blue-800">Current Members</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{mockGroup.max_members}</div>
                <div className="text-sm text-green-800">Max Members</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {mockGroup.is_public ? 'Public' : 'Private'}
                </div>
                <div className="text-sm text-purple-800">Visibility</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center">
              <Button
                onClick={() => setSettingsOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
                size="lg"
              >
                <Settings className="mr-2" size={20} />
                Open Group Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-0 shadow-lg bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">Demo Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-yellow-700">
              <p>🔧 <strong>Edit Group:</strong> Click "Open Group Settings" to modify group name, description, subject, privacy settings, and member limits.</p>
              <p>🗑️ <strong>Delete Group:</strong> Use the delete option in the settings dialog. You'll need to type the group name to confirm deletion.</p>
              <p>🔒 <strong>Privacy Toggle:</strong> Switch between public (anyone can join) and private (invite-only) modes.</p>
              <p>👥 <strong>Member Limits:</strong> Adjust the maximum number of members allowed in the group.</p>
              <p>💾 <strong>Auto-save:</strong> All changes are saved automatically to the database when you click "Save Changes".</p>
            </div>
          </CardContent>
        </Card>

        {/* Group Settings Dialog */}
        <GroupSettingsDialog
          group={mockGroup}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          onGroupUpdated={handleGroupUpdated}
          onGroupDeleted={handleGroupDeleted}
        />
      </div>
    </div>
  );
};

export default GroupSettingsDemo;
