import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Lock, Unlock, Users, Globe, ShieldCheck } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Public/Private toggle */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Visibility</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, is_public: true }))}
            disabled={loading}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
              formData.is_public
                ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm shadow-emerald-500/10'
                : 'border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/40 hover:border-gray-200 dark:hover:border-gray-600'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              formData.is_public 
                ? 'bg-emerald-100 dark:bg-emerald-800/40' 
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <Globe size={20} className={formData.is_public ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'} />
            </div>
            <div className="text-center">
              <p className={`text-sm font-semibold ${formData.is_public ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'}`}>
                Public
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Anyone can discover & join
              </p>
            </div>
            {formData.is_public && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, is_public: false }))}
            disabled={loading}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
              !formData.is_public
                ? 'border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-sm shadow-amber-500/10'
                : 'border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/40 hover:border-gray-200 dark:hover:border-gray-600'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              !formData.is_public 
                ? 'bg-amber-100 dark:bg-amber-800/40' 
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <ShieldCheck size={20} className={!formData.is_public ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'} />
            </div>
            <div className="text-center">
              <p className={`text-sm font-semibold ${!formData.is_public ? 'text-amber-700 dark:text-amber-300' : 'text-gray-600 dark:text-gray-400'}`}>
                Private
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Invite-only access
              </p>
            </div>
            {!formData.is_public && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        </div>
      </div>

      {/* Member limit */}
      <div className="space-y-3">
        <Label htmlFor="settings-maxMembers" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Users size={14} className="text-blue-500" />
          Member Limit
        </Label>
        <div className="flex items-center gap-4">
          <Input
            id="settings-maxMembers"
            type="number"
            min="1"
            max="1000"
            value={formData.max_members}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              max_members: parseInt(e.target.value) || 50 
            }))}
            disabled={loading}
            className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-400/20 transition-colors w-32"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
              <span>{memberCount} / {formData.max_members} members</span>
              <span>{formData.max_members > 0 ? Math.round((memberCount / formData.max_members) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${formData.max_members > 0 ? Math.min((memberCount / formData.max_members) * 100, 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="flex items-start gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/40">
        {formData.is_public ? (
          <Unlock size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
        ) : (
          <Lock size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          {formData.is_public 
            ? "Your group is visible in the public directory. Anyone can search for it and join without needing an invitation."
            : "Your group is hidden from the public directory. Only members with a direct invitation can access and join the group."
          }
        </p>
      </div>
    </div>
  );
};
