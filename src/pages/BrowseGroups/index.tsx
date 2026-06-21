import React, { useState } from 'react';
import { StudyGroupsBrowse } from '@/components/groups/StudyGroupsBrowse';
import { GroupPage } from '@/components/groups/GroupPage';
import { useGroupEnrollment } from '@/contexts/GroupEnrollmentContext';

export default function BrowseGroups() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { groupEnrollments, handleUpdateEnrollment } = useGroupEnrollment();

  if (selectedGroupId) {
    return (
      <GroupPage 
        groupId={selectedGroupId} 
        onBack={() => setSelectedGroupId(null)}
        isEnlisted={groupEnrollments[selectedGroupId] || false}
        onUpdateEnrollment={handleUpdateEnrollment}
      />
    );
  }

  return (
    <StudyGroupsBrowse 
      onSelectGroup={setSelectedGroupId} 
      groupEnrollments={groupEnrollments}
      onUpdateEnrollment={handleUpdateEnrollment}
    />
  );
}
