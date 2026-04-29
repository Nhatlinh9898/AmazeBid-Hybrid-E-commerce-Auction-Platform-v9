import React from 'react';
import { X, Briefcase, User, ChevronRight } from 'lucide-react';
import { useWorkSession } from '../context/WorkSessionContext';
import { workforceService } from '../services/WorkforceService';
import { storeService } from '../services/StoreService';

interface WorkLoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail?: string;
  loginId?: string; // The custom userId field from the User object
  userName: string;
  userAvatar: string;
}

const WorkLoginDialog: React.FC<WorkLoginDialogProps> = ({ isOpen, onClose, userId, userEmail, loginId, userName, userAvatar }) => {
  const { enterWorkMode, exitWorkMode } = useWorkSession();
  const [workplaces, setWorkplaces] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (isOpen && (userId || userEmail || loginId)) {
      const storeIds = Array.from(new Set([
        ...workforceService.getStoresByStaff(userId),
        ...(userEmail ? workforceService.getStoresByStaff(userEmail) : []),
        ...(loginId ? workforceService.getStoresByStaff(loginId) : [])
      ]));
      
      const allStores = storeService.getStores();
      
      const mockWorkplaces = storeIds.map(id => {
          const info = workforceService.getStaffInfo(userId, id) || 
                       (userEmail ? workforceService.getStaffInfo(userEmail, id) : null) ||
                       (loginId ? workforceService.getStaffInfo(loginId, id) : null);
          const store = allStores.find(s => s.id === id);
          return {
              id,
              name: store ? store.name : (id === 'HQ-001' ? 'AmazeCorp HQ' : id),
              role: info?.role || 'Nhân viên',
              position: info?.position || 'Nhân viên',
              corp: info?.corporationId || (store?.parentId ? 'Hệ thống Quản lý' : 'Doanh nghiệp độc lập'),
              dept: info?.departmentId || 'Vận Hành'
          };
      });
      setWorkplaces(mockWorkplaces);
    }
  }, [isOpen, userId, userEmail, loginId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 p-8 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 hover:bg-white/20 p-2 rounded-xl transition-colors">
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-2xl border-2 border-white/30 overflow-hidden shadow-lg bg-white/10 backdrop-blur-sm">
                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
            </div>
            <div>
                <h2 className="text-2xl font-black tracking-tight">Chào mừng trở lại,</h2>
                <p className="text-blue-100 font-medium opacity-80">{userName}</p>
            </div>
          </div>
          
          <p className="text-sm font-bold text-blue-100/60 uppercase tracking-widest">Bạn muốn truy cập vào đâu?</p>
        </div>

        <div className="p-8 space-y-4 bg-gray-50">
          {/* PERSONAL MODE */}
          <button 
            onClick={() => { exitWorkMode(); onClose(); }}
            className="w-full group bg-white p-5 rounded-2xl border-2 border-transparent hover:border-blue-500 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg leading-tight">Trang cá nhân</h3>
                <p className="text-sm text-slate-500 font-medium">Mua sắm, đấu giá và quản lý tài khoản</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
          </button>

          <div className="relative py-2 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <span className="relative bg-gray-50 px-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Hoặc Workspace công việc</span>
          </div>

          {/* WORK MODES */}
          {workplaces.map(wp => (
              <button 
                key={wp.id}
                onClick={() => { enterWorkMode(wp.id); onClose(); }}
                className="w-full group bg-white p-5 rounded-2xl border-2 border-transparent hover:border-indigo-500 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded leading-none border border-indigo-100">{wp.corp}</span>
                        <span className="text-[10px] font-black text-slate-400">/ {wp.dept}</span>
                    </div>
                    <h3 className="font-black text-slate-800 text-lg leading-tight">{wp.name}</h3>
                    <p className="text-sm text-slate-500 font-bold">{wp.position}</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </button>
          ))}

          {workplaces.length === 0 && (
              <div className="text-center py-6 text-gray-400 italic text-sm">
                  Bạn hiện không có lời mời làm việc nào.
              </div>
          )}
        </div>

        <div className="px-8 pb-8 pt-0 bg-gray-50 text-center">
            <p className="text-[10px] text-gray-400 font-medium">Lưu ý: Luồng dữ liệu công việc sẽ được tách biệt hoàn toàn để bảo mật.</p>
        </div>
      </div>
    </div>
  );
};

export default WorkLoginDialog;
