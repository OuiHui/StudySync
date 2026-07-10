import React, { useState } from 'react';
import { StudyGroups } from '@/components/groups/StudyGroups';
import { StudyGroupsBrowse } from '@/components/groups/StudyGroupsBrowse';
import { GroupPage } from '@/components/groups/GroupPage';
import { useGroupEnrollment } from '@/contexts/GroupEnrollmentContext';

type GroupsTab = 'my-groups' | 'browse';

export default function Groups() {
  const [activeTab, setActiveTab] = useState<GroupsTab>('my-groups');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { groupEnrollments, handleUpdateEnrollment } = useGroupEnrollment();

  if (selectedGroupId) {
    return (
      <GroupPage
        groupId={selectedGroupId}
        onBack={() => setSelectedGroupId(null)}
        onUpdateEnrollment={handleUpdateEnrollment}
      />
    );
  }

  return (
    <div>
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
        <TabButton
          label="My Groups"
          isActive={activeTab === 'my-groups'}
          onClick={() => setActiveTab('my-groups')}
        />
        <TabButton
          label="Browse Groups"
          isActive={activeTab === 'browse'}
          onClick={() => setActiveTab('browse')}
        />
      </div>

      {activeTab === 'my-groups' ? (
        <StudyGroups onSelectGroup={setSelectedGroupId} />
      ) : (
        <StudyGroupsBrowse
          onSelectGroup={setSelectedGroupId}
          onUpdateEnrollment={handleUpdateEnrollment}
        />
      )}
    </div>
  );
}

function TabButton({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
        isActive
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
      }`}
    >
      {label}
    </button>
  );
}
