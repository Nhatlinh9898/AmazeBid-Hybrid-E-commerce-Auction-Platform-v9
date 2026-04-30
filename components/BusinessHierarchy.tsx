import React, { useState, useEffect } from 'react';
import { Building2, Network, Users, ChevronRight, ChevronDown, Plus, Briefcase, Zap, Globe, Shield, MapPin, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { hierarchyService } from '../services/HierarchyService';
import { workforceService } from '../services/WorkforceService';
import { Corporation, Branch, StoreStaff, UserZone } from '../types';
import { useAuth } from '../context/useAuth';

const BusinessHierarchy: React.FC = () => {
  const { user } = useAuth();
  const [corps, setCorps] = useState<Corporation[]>([]);
  const [branches, setBranches] = useState<Record<string, Branch[]>>({});
  const [staffByBranch, setStaffByBranch] = useState<Record<string, StoreStaff[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAddCorp, setShowAddCorp] = useState(false);
  const [newCorpName, setNewCorpName] = useState('');

  const loadHierarchy = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const myCorps = await hierarchyService.getCorporations(user.id);
      setCorps(myCorps);
      
      // Load branches for each corp
      for (const corp of myCorps) {
        const myBranches = await hierarchyService.getBranches(corp.id);
        setBranches(prev => ({ ...prev, [corp.id]: myBranches }));
        
        // Load staff for corp level
        const corpStaff = workforceService.getStaffByStore(corp.id); 
        setStaffByBranch(prev => ({ ...prev, [corp.id]: corpStaff }));

        for (const branch of myBranches) {
           const branchStaff = workforceService.getStaffByStore(branch.id);
           setStaffByBranch(prev => ({ ...prev, [branch.id]: branchStaff }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHierarchy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCreateCorp = async () => {
    if (!newCorpName || !user) return;
    try {
      await hierarchyService.createCorporation({
        name: newCorpName,
        ownerId: user.id,
        address: 'Chưa cập nhật'
      });
      setNewCorpName('');
      setShowAddCorp(false);
      loadHierarchy();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-indigo-900 flex items-center gap-2">
            <Network className="text-indigo-600" /> AmazeNode Quantum
          </h1>
          <p className="text-sm text-gray-500 font-medium tracking-tight">Hệ thống quản trị noron doanh nghiệp đa tầng</p>
        </div>
        <button 
          onClick={() => setShowAddCorp(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
        >
          <Plus size={16} /> THIẾT LẬP TỔ CHỨC
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Zap className="animate-spin text-indigo-400" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Lớp 1: Corporations (Admins/Owners) */}
          {corps.map(corp => (
            <motion.div 
              key={corp.id}
              layout
              className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col"
            >
              <div className="p-5 bg-gradient-to-br from-indigo-50 to-white border-b border-indigo-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-indigo-950 uppercase tracking-tight">{corp.name}</h3>
                      <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-bold">
                        <Globe size={12} /> GLOBAL NODE • {corp.id}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleExpand(corp.id)}
                    className="p-2 hover:bg-white rounded-full transition-colors"
                  >
                    {expanded[corp.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                </div>
              </div>

              <div className="p-5 flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                    <span className="text-[10px] font-black text-blue-600 uppercase">Branches</span>
                    <p className="text-xl font-black text-blue-900">{branches[corp.id]?.length || 0}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                    <span className="text-[10px] font-black text-purple-600 uppercase">Tỷ lệ Noron</span>
                    <p className="text-xl font-black text-purple-900">89%</p>
                  </div>
                </div>

                <AnimatePresence>
                  {expanded[corp.id] && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      {/* Lớp 2: Branches (Store Managers) */}
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Active Branches</h4>
                      {(branches[corp.id] || []).map(branch => (
                        <div key={branch.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-indigo-400" />
                              <span className="text-sm font-bold text-gray-800">{branch.name}</span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-600 rounded-full font-black">SYNCED</span>
                          </div>
                          
                          {/* Lớp 3: Workforce (Staff/Employees) */}
                          <div className="flex -space-x-2 overflow-hidden">
                            {(staffByBranch[branch.id] || []).map(s => (
                              <div key={s.id} className="w-6 h-6 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center">
                                <Users size={10} className="text-indigo-600" />
                              </div>
                            ))}
                            <button 
                              className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"
                              title="Thêm nhân sư"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-5 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <Database size={14} /> {UserZone.BUSINESS} ZONE
                </div>
                <button className="text-indigo-600 text-xs font-black uppercase tracking-wider hover:underline">
                  Quản lý sâu
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Corp Modal Placeholder */}
      {showAddCorp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
           >
              <div>
                <h2 className="text-2xl font-black text-indigo-900 uppercase">Khởi tạo Doanh nghiệp</h2>
                <p className="text-xs text-gray-500 font-medium">Thiết lập tầng cao nhất của hệ thần kinh kinh doanh.</p>
              </div>

              <input 
                 type="text" 
                 placeholder="Tên tập đoàn/Tổ chức" 
                 value={newCorpName}
                 onChange={(e) => setNewCorpName(e.target.value)}
                 className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold placeholder:text-gray-300 transition-all"
              />

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAddCorp(false)}
                  className="flex-1 py-4 text-gray-400 font-black text-sm uppercase hover:bg-gray-50 rounded-2xl transition-all"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleCreateCorp}
                  className="flex-1 py-4 bg-indigo-600 text-white font-black text-sm uppercase rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                >
                  Xác nhận
                </button>
              </div>
           </motion.div>
        </div>
      )}

      {/* Neural Link Overlay Legend */}
      <div className="mt-12 p-6 bg-indigo-950 rounded-[40px] text-white shadow-2xl border-4 border-indigo-900">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="text-blue-400" />
              <h4 className="font-black uppercase tracking-tighter">Vùng 1: Người dùng</h4>
            </div>
            <p className="text-[10px] text-indigo-300 font-bold leading-relaxed opacity-80">
              Phân lập dữ liệu cá nhân, ví điện tử, lịch sử mua hàng và tương tác xã hội. Hoạt động độc lập không can thiệp hệ thống quản trị.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="text-amber-400" />
              <h4 className="font-black uppercase tracking-tighter">Vùng 2: Chủ sở hữu</h4>
            </div>
            <p className="text-[10px] text-indigo-300 font-bold leading-relaxed opacity-80">
              Cấp Admin Doanh nghiệp. Quản lý tài chính chuỗi, thiết lập KPI, và ra quyết định tối cao cho các chi nhánh noron cấp dưới.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="text-green-400" />
              <h4 className="font-black uppercase tracking-tighter">Vùng 3: Lực lượng thực thi</h4>
            </div>
            <p className="text-[10px] text-indigo-300 font-bold leading-relaxed opacity-80">
              Các node nhân sự hoạt động trong chi nhánh. Có quyền hạn cụ thể theo mô tả công việc, vận hành linh hoạt theo sự phân công của quản lý.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessHierarchy;
