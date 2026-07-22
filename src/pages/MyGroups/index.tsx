import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { StudyGroups } from '@/components/groups/StudyGroups';
import { StudyGroupsBrowse } from '@/components/groups/StudyGroupsBrowse';
import { GroupPage } from '@/components/groups/GroupPage';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { PageTabs } from '@/components/common/navigation/PageTabs';
import { useGroupEnrollment } from '@/contexts/GroupEnrollmentContext';
import { PAGE_TITLE_CLASS } from '@/constants/theme';
import { useTabQueryState } from '@/hooks/useTabQueryState';

type GroupsTab = 'my-groups' | 'browse';

export default function Groups() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGroupId = searchParams.get('groupId');
  const [activeTab, setActiveTab] = useTabQueryState<GroupsTab>('my-groups', ['my-groups', 'browse']);
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
      const groupDetailTabs = ['sessions', 'members', 'notes'];
      const currentTabParam = searchParams.get('tab');
      if (currentTabParam && groupDetailTabs.includes(currentTabParam)) {
        nextParams.set('tab', activeTab);
      }
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

  const tabs = [
    { id: 'my-groups' as GroupsTab, label: 'My Groups' },
    { id: 'browse' as GroupsTab, label: 'Browse Groups' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className={PAGE_TITLE_CLASS}>Study Groups</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Collaborate, share resources, and study with peers
        </p>
      </div>

      {/* Shared Tabs below title with Create Group button on the same line */}
      <PageTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
        action={<CreateGroupDialog onGroupCreated={() => window.location.reload()} />}
      />

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
