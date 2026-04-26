
import React from 'react';
import { 
  Users, UserPlus, Briefcase, 
  Edit2, Shield, Store as StoreIcon, CheckCircle2, HelpCircle, Info, BookOpen, Plus
} from 'lucide-react';
import { PhysicalStore, StaffRole, StaffPermission, StoreStaff } from '../types';
import { storeService } from '../services/StoreService';
import { workforceService } from '../services/WorkforceService';

interface LaborManagementProps {
  ownerId: string;
  onTabChange?: (tab: any) => void;
}

export const LaborManagement: React.FC<LaborManagementProps> = ({ ownerId }) => {
  const [stores, setStores] = React.useState<PhysicalStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = React.useState<string | null>(null);
  const [staff, setStaff] = React.useState<StoreStaff[]>([]);
  
  const [isAddingStaff, setIsAddingStaff] = React.useState(false);
  const [editingStaffId, setEditingStaffId] = React.useState<string | null>(null);
  const [showGuide, setShowGuide] = React.useState(false);

  React.useEffect(() => {
    const fetchStores = async () => {
      const allStores = await storeService.getStores();
      const ownerStores = allStores.filter(s => s.ownerId === ownerId);
      setStores(ownerStores);
      if (ownerStores.length > 0 && !selectedStoreId) {
        setSelectedStoreId(ownerStores[0].id);
      }
    };
    fetchStores();
    
    const unsubWorkforce = workforceService.subscribe((allStaff) => {
      if (selectedStoreId) {
        setStaff(allStaff.filter(s => s.storeId === selectedStoreId));
      }
    });

    return () => {
      unsubWorkforce();
    };
  }, [ownerId, selectedStoreId]);

  const [staffForm, setStaffForm] = React.useState<Omit<StoreStaff, 'id' | 'joinDate' | 'status' | 'storeId'>>({
    userId: '',
    password: '',
    name: '',
    email: '',
    role: StaffRole.SALES_EXECUTIVE,
    permissions: []
  });

  const handleRoleChange = (role: StaffRole) => {
    setStaffForm({
      ...staffForm,
      role,
      permissions: workforceService.getDefaultPermissions(role)
    });
  };

  const togglePermission = (perm: StaffPermission) => {
    const current = [...staffForm.permissions];
    if (current.includes(perm)) {
      setStaffForm({ ...staffForm, permissions: current.filter(p => p !== perm) });
    } else {
      setStaffForm({ ...staffForm, permissions: [...current, perm] });
    }
  };

  const handleSaveStaff = () => {
    console.log('Attempting to save staff...', { selectedStoreId, staffForm, editingStaffId });
    if (!selectedStoreId) {
      alert('Vui lòng chọn hoặc tạo chi nhánh trước khi thêm nhân sự.');
      return;
    }

    if (!staffForm.name || !staffForm.userId) {
      alert('Vui lòng điền đầy đủ Họ tên và Tên đăng nhập.');
      return;
    }
    
    try {
      if (editingStaffId) {
        workforceService.updateStaff(editingStaffId, staffForm);
      } else {
        workforceService.addStaff({ ...staffForm, storeId: selectedStoreId });
      }
      console.log('Staff saved successfully');
      closeStaffModal();
    } catch (error) {
      console.error('Failed to save staff:', error);
      alert('Có lỗi xảy ra khi lưu thông tin nhân sự.');
    }
  };

  const closeStaffModal = () => {
    setIsAddingStaff(false);
    setEditingStaffId(null);
    setStaffForm({
      userId: '',
      password: '',
      name: '',
      email: '',
      role: StaffRole.SALES_EXECUTIVE,
      permissions: workforceService.getDefaultPermissions(StaffRole.SALES_EXECUTIVE)
    });
  };

  const startEditStaff = (member: StoreStaff) => {
    setEditingStaffId(member.id);
    setStaffForm({
      userId: member.userId,
      password: member.password || '',
      name: member.name,
      email: member.email,
      role: member.role,
      permissions: member.permissions
    });
    setIsAddingStaff(true);
  };

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Cấu trúc đa cửa hàng/chi nhánh */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-4 min-w-max">
          <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
            <StoreIcon size={20}/>
          </div>
          <div className="flex gap-2">
            {stores.map(store => (
              <button
                key={store.id}
                onClick={() => setSelectedStoreId(store.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  selectedStoreId === store.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {store.isBranch ? `Chi nhánh: ${store.branchName || store.name}` : `Cửa hàng: ${store.name}`}
              </button>
            ))}
            {stores.length === 0 && (
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-400 italic">Bạn chưa khởi tạo cửa hàng/chi nhánh nào.</p>
                <button 
                  onClick={() => {
                    // Logic để chuyển sang tab chuyển đổi/tạo cửa hàng
                    alert('Vui lòng vào tab "Cửa hàng" để tạo cơ sở kinh doanh đầu tiên trước khi thiết lập nhân sự.');
                  }}
                  className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-1"
                >
                  <Plus size={14}/> Tạo ngay
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {stores.length === 0 && (
        <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Shield size={32}/>
          </div>
          <h3 className="text-xl font-black text-blue-900">Thiết lập Super Admin đầu tiên</h3>
          <p className="text-sm text-blue-700 max-w-md mx-auto leading-relaxed">
            Hệ thống nhận diện bạn là chủ sở hữu chuỗi. Sau khi tạo cửa hàng đầu tiên, bạn sẽ mặc định là <strong>Super Admin</strong> với toàn quyền quản trị tất cả chi nhánh.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-white/50 px-3 py-1.5 rounded-full">
              <CheckCircle2 size={12}/> Toàn quyền chuỗi
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-white/50 px-3 py-1.5 rounded-full">
              <CheckCircle2 size={12}/> Quản trị chi phí
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Users size={20}/></div>
            <span className="text-xs font-bold text-gray-500 uppercase">Nhân sự tại chi nhánh</span>
          </div>
          <h4 className="text-2xl font-black">{staff.length} nhân viên</h4>
          <p className="text-[10px] text-gray-400 mt-1">{selectedStore?.address}</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-2">
          <button 
            onClick={() => setIsAddingStaff(true)}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all text-sm"
          >
            <UserPlus size={16}/> Tuyển dụng & Phân vai
          </button>
          <button 
            onClick={() => setShowGuide(true)}
            className="w-full bg-gray-50 text-gray-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all text-sm border border-gray-100"
          >
            <BookOpen size={16}/> Hướng dẫn sử dụng
          </button>
        </div>

        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex flex-col justify-center">
          <h5 className="text-blue-800 font-bold text-sm flex items-center gap-2">
            <Shield size={16}/> Bảo mật Chuyên môn hóa
          </h5>
          <p className="text-[10px] text-blue-600 mt-1 leading-relaxed">
            Hệ thống tự động hạn chế quyền truy cập dựa trên vai trò. Nhân viên chỉ thấy những gì thuộc phạm vi công việc của họ tại chi nhánh này.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Briefcase size={18} className="text-blue-600"/> Quản lý Nhân sự & Phân quyền
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-100">
                <th className="p-4">Nhân viên / Vai trò</th>
                <th className="p-4">Phạm vi Quyền hạn</th>
                <th className="p-4">Ngày gia nhập</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staff.map(member => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                        {member.name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{member.name}</p>
                        <p className="text-xs text-blue-600 font-medium">{member.role.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {member.permissions.slice(0, 3).map(p => (
                        <span key={p} className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full">
                          {p.replace('MANAGE_', '')}
                        </span>
                      ))}
                      {member.permissions.length > 3 && (
                        <span className="text-[10px] text-gray-400">+{member.permissions.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-gray-500 text-xs">
                    {new Date(member.joinDate).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${member.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {member.status === 'ACTIVE' ? 'Đang làm' : 'Đã nghỉ'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => startEditStaff(member)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                        <Edit2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                    Chưa có nhân viên nào tại chi nhánh này. Bấm "Tuyển dụng" để bắt đầu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Modal */}
      {isAddingStaff && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeStaffModal} />
          <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black">{editingStaffId ? 'Điều chỉnh nhân sự' : 'Tuyển dụng nhân sự mới'}</h3>
                <p className="text-xs text-gray-500">Cửa hàng: {selectedStore?.name}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Họ và tên</label>
                  <input 
                    type="text" 
                    placeholder="Nguyễn Văn A" 
                    className="w-full p-3 bg-gray-50 rounded-xl outline-none" 
                    value={staffForm.name} 
                    onChange={e => setStaffForm({...staffForm, name: e.target.value})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Email</label>
                  <input 
                    type="email" 
                    placeholder="email@example.com" 
                    className="w-full p-3 bg-gray-50 rounded-xl outline-none" 
                    value={staffForm.email} 
                    onChange={e => setStaffForm({...staffForm, email: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Tên đăng nhập (ID)</label>
                  <input 
                    type="text" 
                    placeholder="user_123" 
                    className="w-full p-3 bg-gray-50 rounded-xl outline-none" 
                    value={staffForm.userId} 
                    onChange={e => setStaffForm({...staffForm, userId: e.target.value})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Mật khẩu</label>
                  <input 
                    type="password" 
                    placeholder="********" 
                    className="w-full p-3 bg-gray-50 rounded-xl outline-none font-mono" 
                    value={staffForm.password} 
                    onChange={e => setStaffForm({...staffForm, password: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Vị trí công việc (Vai trò)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.values(StaffRole).map(role => (
                    <button
                      key={role}
                      onClick={() => handleRoleChange(role)}
                      className={`text-left p-3 rounded-xl border text-[10px] font-bold transition-all ${
                        staffForm.role === role 
                          ? 'bg-blue-50 border-blue-200 text-blue-600' 
                          : 'border-gray-100 hover:border-gray-200 text-gray-500'
                      }`}
                    >
                      {role.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-1 uppercase flex justify-between">
                  <span>Quyền hạn cụ thể</span>
                  <span className="text-blue-600 text-[10px]">Tùy chỉnh dựa trên vai trò chọn ở trên</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-50 p-4 rounded-xl">
                  {Object.values(StaffPermission).map(perm => (
                    <button
                      key={perm}
                      onClick={() => togglePermission(perm)}
                      className="flex items-center gap-2 text-[10px] font-medium text-gray-600 hover:text-blue-600 group"
                    >
                      {staffForm.permissions.includes(perm) ? (
                        <CheckCircle2 size={14} className="text-blue-500" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded border border-gray-300 group-hover:border-blue-400" />
                      )}
                      {perm.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={closeStaffModal}
                  className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleSaveStaff} 
                  className="flex-2 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                >
                  {editingStaffId ? 'Cập nhật tài khoản' : 'Kích hoạt nhân viên'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowGuide(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-8 animate-in slide-in-from-top-10 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200">
                  <BookOpen size={24}/>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Hướng dẫn Quản trị Nhân sự & Chi phí</h3>
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">Hệ thống Đa chi nhánh AmazeBid</p>
                </div>
              </div>
              <button onClick={() => setShowGuide(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <Shield size={24}/>
              </button>
            </div>

            <div className="space-y-8">
              {/* Phần 0: Hệ thống Phân quyền AmazeBid */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-blue-800 font-black text-sm uppercase">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">0</span>
                  Cấu trúc phân quyền & Bảo mật
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-2">
                    <h5 className="font-bold text-indigo-900 text-xs flex items-center gap-2">
                      <Shield size={14} className="text-indigo-600"/> Platform Admin
                    </h5>
                    <p className="text-[10px] text-indigo-700 leading-relaxed">
                      Là quản trị viên của toàn bộ hệ thống AmazeBid. Họ quản lý hạ tầng, phí sàn và hỗ trợ tất cả Người bán nhưng <strong>không can thiệp</strong> vào dữ liệu nội bộ của từng chuỗi.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-2">
                    <h5 className="font-bold text-blue-900 text-xs flex items-center gap-2">
                      <Users size={14} className="text-blue-600"/> Super Admin (Bạn)
                    </h5>
                    <p className="text-[10px] text-blue-700 leading-relaxed">
                      Là chủ sở hữu chuỗi cửa hàng. Bạn có toàn quyền trong "Vương quốc" của mình, quản lý mọi chi nhánh và đội ngũ nhân sự riêng mà không ai khác thấy được.
                    </p>
                  </div>
                </div>
              </section>

              {/* Phần 0.1: Quyền Riêng tư Đa người dùng */}
              <section className="space-y-4">
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 space-y-2">
                  <div className="font-bold text-emerald-900 flex items-center gap-2 text-xs">
                    <CheckCircle2 size={16} className="text-emerald-600"/> Cô lập dữ liệu tuyệt đối (Multi-tenancy)
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Hệ thống AmazeBid được thiết kế theo mô hình <strong>Đa người thuê</strong>. Điều này có nghĩa là mỗi Người bán có một "không gian ảo" riêng:
                  </p>
                  <ul className="text-[10px] text-emerald-700 space-y-1 pl-4 list-disc">
                    <li>Nhân sự của bạn chỉ thấy được cửa hàng thuộc sở hữu của bạn.</li>
                    <li>Chi phí và doanh thu của bạn được mã hóa và tách biệt hoàn toàn với các nhà bán hàng khác trên sàn.</li>
                    <li>Sẽ không bao giờ có sự nhầm lẫn dữ liệu giữa các chuỗi cửa hàng khác nhau.</li>
                  </ul>
                </div>
              </section>

              {/* Phần 1: Quản lý Chi nhánh */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-blue-800 font-black text-sm uppercase">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">1</span>
                  Cấu trúc Đa cửa hàng & Chi nhánh
                </div>
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50 text-sm text-blue-900 space-y-3 leading-relaxed">
                  <p>• Dùng thanh chọn chi nhánh ở trên cùng để chuyển đổi giữa các địa điểm.</p>
                  <p>• <strong>Bảo mật chi nhánh:</strong> Dữ liệu bán hàng, kho bãi và khách hàng được tách biệt hoàn toàn giữa các chi nhánh.</p>
                  <p>• Tài khoản chi nhánh này không thể truy cập dữ liệu của chi nhánh khác trừ khi được cấp quyền Super Admin.</p>
                </div>
              </section>

              {/* Phần 2: Tuyển dụng & Phân vai */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-blue-800 font-black text-sm uppercase">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">2</span>
                  Tuyển dụng & Phân vai chuyên môn
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                    <h5 className="font-bold text-gray-900 text-xs flex items-center gap-2">
                      <HelpCircle size={14} className="text-blue-500"/> Thiết lập Tài khoản
                    </h5>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      Mỗi nhân viên cần một <strong>Tên đăng nhập (ID)</strong> và <strong>Mật khẩu</strong> riêng biệt để thực hiện công việc trên thiết bị cầm tay hoặc máy POS.
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                    <h5 className="font-bold text-gray-900 text-xs flex items-center gap-2">
                      <Shield size={14} className="text-green-500"/> Chuyên môn hóa Quyền
                    </h5>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      Khi chọn vai trò (Thu ngân, Bếp, Sales...), hệ thống tự động gán các quyền cơ bản. Bạn có thể tùy chỉnh thêm để giới hạn quyền xem báo cáo hoặc quản lý kho.
                    </p>
                  </div>
                </div>
              </section>

              {/* Phần 3: Quản lý Chi phí */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-blue-800 font-black text-sm uppercase">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">3</span>
                  Hướng dẫn Nhân viên Đăng nhập
                </div>
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 text-sm text-gray-900 space-y-3 leading-relaxed">
                  <p>• <strong>Cổng đăng nhập:</strong> Nhân viên sử dụng chung nút "Đăng nhập" trên trang chủ hệ thống.</p>
                  <p>• <strong>Thông tin đăng nhập:</strong> Nhân viên có thể sử dụng <strong>Tên đăng nhập (ID)</strong> hoặc <strong>Email</strong> mà bạn đã cấp phát kèm theo mật khẩu tương ứng.</p>
                  <p>• <strong>Phân quyền tự động:</strong> Ngay sau khi đăng nhập, hệ thống sẽ tự động chuyển hướng nhân viên về giao diện làm việc (POS, Bếp, hoặc Kho) dựa trên vai trò bạn đã thiết lập.</p>
                </div>
              </section>

              {/* Phần 4: Kiểm soát Chi phí */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-blue-800 font-black text-sm uppercase">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">4</span>
                  Kiểm soát Chi phí Nhân công
                </div>
                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 text-sm text-amber-900 space-y-2">
                  <div className="font-bold flex items-center gap-2 mb-1">
                    <Info size={16} className="text-amber-600"/> Lưu ý quan trọng
                  </div>
                  <p>• Chi phí nhân viên được tính toán dựa trên mức lương cơ bản và phụ cấp thiết lập trong profile.</p>
                  <p>• Các khoản thưởng KPI hoặc phạt lỗi cần được ghi nhận trong phần "Chi phí phát sinh" (Yêu cầu quyền Quản lý tài chính).</p>
                </div>
              </section>

              <button 
                onClick={() => setShowGuide(false)}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-xl"
              >
                Đã hiểu, bắt đầu quản trị
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workforce Security Info Footer */}
      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 italic text-gray-500 text-[10px] text-center leading-relaxed">
        * Lưu ý: Hệ thống quản lý đa chi nhánh AmazeBid hỗ trợ phân tách dữ liệu tuyệt đối giữa các cửa hàng. 
        Mỗi tài khoản nhân viên được cấp mật khẩu riêng và chỉ được phép đăng nhập/thao tác tại chi nhánh được chỉ định. 
        Mọi thay đổi về quyền hạn sẽ có hiệu lực ngay lập tức.
      </div>
    </div>
  );
};

