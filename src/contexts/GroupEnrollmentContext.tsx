import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface GroupEnrollmentContextType {
  groupEnrollments: Record<string, boolean>;
  handleUpdateEnrollment: (groupId: string, enrolled: boolean) => void;
}

const GroupEnrollmentContext = createContext<GroupEnrollmentContextType | undefined>(undefined);

export const GroupEnrollmentProvider = ({ children }: { children: ReactNode }) => {
  const [groupEnrollments, setGroupEnrollments] = useState<Record<string, boolean>>({
    '1': true,
    '4': true
  });

  const handleUpdateEnrollment = (groupId: string, enrolled: boolean) => {
    setGroupEnrollments(prev => ({
      ...prev,
      [groupId]: enrolled
    }));
  };

  return (
    <GroupEnrollmentContext.Provider value={{ groupEnrollments, handleUpdateEnrollment }}>
      {children}
    </GroupEnrollmentContext.Provider>
  );
};

export const useGroupEnrollment = () => {
  const context = useContext(GroupEnrollmentContext);
  if (context === undefined) {
    throw new Error('useGroupEnrollment must be used within a GroupEnrollmentProvider');
  }
  return context;
};
