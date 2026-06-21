import React, { useState } from 'react';
import { StudyGroups } from '@/components/groups/StudyGroups';
import { GroupPage } from '@/components/groups/GroupPage';
import { useGroupEnrollment } from '@/contexts/GroupEnrollmentContext';

export default function MyGroups() {
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

  return <StudyGroups onSelectGroup={setSelectedGroupId} />;
}
