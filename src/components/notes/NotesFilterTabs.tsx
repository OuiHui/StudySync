import { NoteTab } from './useNotes';

interface NotesFilterTabsProps {
  activeTab: NoteTab;
  setActiveTab: (tab: NoteTab) => void;
  counts: {
    all: number;
    mine: number;
    shared: number;
    public: number;
    group: number;
  };
}

interface TabItem {
  id: NoteTab;
  label: string;
  count: number;
}

export const NotesFilterTabs = ({ activeTab, setActiveTab, counts }: NotesFilterTabsProps) => {
  const tabs: TabItem[] = [
    { id: 'all', label: 'All Notes', count: counts.all },
    { id: 'mine', label: 'My Notes', count: counts.mine },
    { id: 'shared', label: 'Shared with Me', count: counts.shared },
    { id: 'public', label: 'Public Notes', count: counts.public },
    { id: 'group', label: 'Group Notes', count: counts.group }
  ];

  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm transition-all whitespace-nowrap border ${
              isActive
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300 font-semibold shadow-xs'
                : 'bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-semibold transition-colors ${
                isActive
                  ? 'bg-indigo-200/70 text-indigo-800 dark:bg-indigo-900/80 dark:text-indigo-200'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
