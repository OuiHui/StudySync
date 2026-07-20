import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StudyGroups } from '@/components/groups/StudyGroups';
import { StudyGroupsBrowse } from '@/components/groups/StudyGroupsBrowse';
import { GroupPage } from '@/components/groups/GroupPage';
import { useGroupEnrollment } from '@/contexts/GroupEnrollmentContext';

type GroupsTab = 'my-groups' | 'browse';

export default function Groups() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGroupId = searchParams.get('groupId');
  const [activeTab, setActiveTab] = useState<GroupsTab>('my-groups');
  const { groupEnrollments, handleUpdateEnrollment } = useGroupEnrollment();

  const handleSelectGroup = (id: string | null) => {
    const nextParams = new URLSearchParams(searchParams);
    if (id) {
      nextParams.set('groupId', id);
      if (!nextParams.has('tab')) {
        nextParams.set('tab', 'sessions');
      }
    } else {
      nextParams.delete('groupId');
      nextParams.delete('tab');
    }
    setSearchParams(nextParams);
  };

  if (selectedGroupId) {
    return (
      <GroupPage
        groupId={selectedGroupId}
        onBack={() => handleSelectGroup(null)}
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
        <StudyGroups onSelectGroup={handleSelectGroup} />
      ) : (
        <StudyGroupsBrowse
          onSelectGroup={handleSelectGroup}
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
          ? 'border-brand text-brand dark:text-brand font-semibold'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
      }`}
    >
      {label}
    </button>
  );
}
