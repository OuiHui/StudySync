import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SessionContextType {
  isInGroupSession: boolean;
  setIsInGroupSession: React.Dispatch<React.SetStateAction<boolean>>;
  showLeaveSessionDialog: boolean;
  setShowLeaveSessionDialog: React.Dispatch<React.SetStateAction<boolean>>;
  pendingNavigation: string | null;
  setPendingNavigation: React.Dispatch<React.SetStateAction<string | null>>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [isInGroupSession, setIsInGroupSession] = useState(false);
  const [showLeaveSessionDialog, setShowLeaveSessionDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  return (
    <SessionContext.Provider 
      value={{ 
        isInGroupSession, 
        setIsInGroupSession, 
        showLeaveSessionDialog, 
        setShowLeaveSessionDialog, 
        pendingNavigation, 
        setPendingNavigation 
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
