import { Lock, Bell, Trash2, ChevronRight } from 'lucide-react';

interface ProfileSettingsProps {
  onChangePassword: () => void;
  onNotificationSettings: () => void;
  onDeleteAccount: () => void;
}

export const ProfileSettings = ({ onChangePassword, onNotificationSettings, onDeleteAccount }: ProfileSettingsProps) => {
  const settingsItems = [
    {
      icon: Lock,
      label: 'Change Password',
      description: 'Update your login credentials',
      onClick: onChangePassword,
      danger: false,
    },
    {
      icon: Bell,
      label: 'Notifications',
      description: 'Manage email and push alerts',
      onClick: onNotificationSettings,
      danger: false,
    },
  ];

  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Account Settings</h3>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-800">
        {settingsItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.onClick}
              className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                <Icon size={15} className="text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 dark:text-white">{item.label}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">{item.description}</div>
              </div>
              <ChevronRight size={15} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors shrink-0" />
            </button>
          );
        })}

        {/* Danger zone */}
        <button
          onClick={onDeleteAccount}
          className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
            <Trash2 size={15} className="text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-red-600 dark:text-red-400">Delete Account</div>
            <div className="text-xs text-red-400/70 dark:text-red-500/60">Permanently remove your account</div>
          </div>
          <ChevronRight size={15} className="text-red-300 dark:text-red-700 shrink-0" />
        </button>
      </div>
    </div>
  );
};
