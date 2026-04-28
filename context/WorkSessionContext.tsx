import React from 'react';
import { PhysicalStore, StoreStaff } from '../types';
import { workforceService } from '../services/WorkforceService';
import { useAuth } from './useAuth';

interface WorkSession {
  isWorkMode: boolean;
  activeWorkplace: PhysicalStore | null;
  staffInfo: StoreStaff | null;
  organizationPath: string[]; // [Corp, Company, Dept]
}

interface WorkSessionContextType {
  session: WorkSession;
  enterWorkMode: (storeId: string) => void;
  exitWorkMode: () => void;
  availableWorkplaces: PhysicalStore[];
}

const WorkSessionContext = React.createContext<WorkSessionContextType | undefined>(undefined);

export const WorkSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [session, setSession] = React.useState<WorkSession>({
    isWorkMode: false,
    activeWorkplace: null,
    staffInfo: null,
    organizationPath: []
  });

  const enterWorkMode = (storeId: string) => {
    if (!user) return;
    
    const staffInfo = workforceService.getStaffInfo(user.id, storeId);
    if (!staffInfo) return;

    // Build hierarchy
    const path = workforceService.getOrganizationPath(user.id, storeId);

    setSession({
      isWorkMode: true,
      activeWorkplace: null, // Should fetch real store object
      staffInfo,
      organizationPath: path
    });
  };

  const exitWorkMode = () => {
    setSession({
      isWorkMode: false,
      activeWorkplace: null,
      staffInfo: null,
      organizationPath: []
    });
  };

  return (
    <WorkSessionContext.Provider value={{ session, enterWorkMode, exitWorkMode, availableWorkplaces: [] }}>
      {children}
    </WorkSessionContext.Provider>
  );
};

export const useWorkSession = () => {
  const context = React.useContext(WorkSessionContext);
  if (context === undefined) {
    throw new Error('useWorkSession must be used within a WorkSessionProvider');
  }
  return context;
};
