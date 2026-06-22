import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Lock, Unlock, Users } from 'lucide-react';

interface GroupPrivacyProps {
  formData: {
    is_public: boolean;
    max_members: number;
  };
  setFormData: (updater: (prev: any) => any) => void;
  loading: boolean;
  memberCount: number;
}

export const GroupPrivacy = ({ formData, setFormData, loading, memberCount }: GroupPrivacyProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Privacy & Limits</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="flex items-center gap-2">
              {formData.is_public ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              Public Group
            </Label>
            <p className="text-sm text-gray-500">
              {formData.is_public 
                ? "Anyone can discover and join this group"
                : "Only people with an invite can join this group"
              }
            </p>
          </div>
          <Switch
            checked={formData.is_public}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxMembers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Maximum Members
          </Label>
          <Input
            id="maxMembers"
            type="number"
            min="1"
            max="1000"
            value={formData.max_members}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              max_members: parseInt(e.target.value) || 50 
            }))}
            disabled={loading}
          />
          <p className="text-sm text-gray-500">
            Current members: {memberCount || 0}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
