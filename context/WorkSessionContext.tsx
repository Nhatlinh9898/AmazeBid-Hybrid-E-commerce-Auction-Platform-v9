import React from 'react';
import { PhysicalStore, StoreStaff } from '../types';
import { workforceService } from '../services/WorkforceService';
import { storeService } from '../services/StoreService';
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
    
    // Check both id, email, and custom userId for staff info
    const staffInfo = workforceService.getStaffInfo(user.id, storeId) || 
                      (user.email ? workforceService.getStaffInfo(user.email, storeId) : null) ||
                      (user.userId ? workforceService.getStaffInfo(user.userId, storeId) : null);
    
    if (!staffInfo) {
      console.warn('[WorkSession] No staff info found for user:', { id: user.id, email: user.email, userId: user.userId }, 'at store:', storeId);
      return;
    }

    // Fetch real store object
    const workplace = storeService.getStoreById(storeId);

    // Build hierarchy
    const path = workforceService.getOrganizationPath(staffInfo.userId || staffInfo.email, storeId);

    setSession({
      isWorkMode: true,
      activeWorkplace: workplace || null,
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

  const availableWorkplaces = React.useMemo(() => {
    if (!user) return [];
    const ids = Array.from(new Set([
      ...workforceService.getStoresByStaff(user.id),
      ...(user.email ? workforceService.getStoresByStaff(user.email) : []),
      ...(user.userId ? workforceService.getStoresByStaff(user.userId) : [])
    ]));
    return storeService.getStores().filter(s => ids.includes(s.id));
  }, [user]);

  return (
    <WorkSessionContext.Provider value={{ session, enterWorkMode, exitWorkMode, availableWorkplaces }}>
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
