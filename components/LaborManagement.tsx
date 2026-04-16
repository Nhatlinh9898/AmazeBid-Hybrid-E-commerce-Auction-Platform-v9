
import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, DollarSign, Briefcase, 
  Trash2, Plus, Phone, Mail, TrendingDown, PieChart as PieChartIcon
} from 'lucide-react';
import { Employee, LaborCost } from '../types';
import { equityService } from '../src/services/EquityService';

interface LaborManagementProps {
  ownerId: string;
  onTabChange?: (tab: any) => void;
}

export const LaborManagement: React.FC<LaborManagementProps> = ({ ownerId, onTabChange }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [laborCosts, setLaborCosts] = useState<LaborCost[]>([]);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [isAddingCost, setIsAddingCost] = useState(false);

  useEffect(() => {
    const unsubscribe = equityService.subscribe((data) => {
      setEmployees(data.employees.filter(e => e.ownerId === ownerId));
      setLaborCosts(data.laborCosts.filter(lc => lc.ownerId === ownerId));
    });
    return () => unsubscribe();
  }, [ownerId]);

  const [empForm, setEmpForm] = useState<Omit<Employee, 'id' | 'ownerId'>>({
    name: '',
    role: '',
    phone: '',
    email: '',
    salaryBase: 0,
    salaryType: 'MONTHLY',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'ACTIVE'
  });

  const [costForm, setCostForm] = useState<Omit<LaborCost, 'id' | 'ownerId'>>({
    employeeId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    type: 'SALARY',
    note: ''
  });

  const handleAddEmployee = () => {
    equityService.addEmployee({ ...empForm, ownerId });
    setIsAddingEmployee(false);
    setEmpForm({ name: '', role: '', phone: '', email: '', salaryBase: 0, salaryType: 'MONTHLY', joinDate: new Date().toISOString().split('T')[0], status: 'ACTIVE' });
  };

  const handleAddCost = () => {
    equityService.addLaborCost({ ...costForm, ownerId });
    setIsAddingCost(false);
    setCostForm({ employeeId: '', amount: 0, date: new Date().toISOString().split('T')[0], type: 'SALARY', note: '' });
  };

  const totalLaborCost = laborCosts.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Users size={20}/></div>
            <span className="text-xs font-bold text-gray-500 uppercase">Tổng nhân sự</span>
          </div>
          <h4 className="text-2xl font-black">{employees.length} người</h4>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-50 p-2 rounded-lg text-red-600"><TrendingDown size={20}/></div>
            <span className="text-xs font-bold text-gray-500 uppercase">Tổng chi phí nhân công</span>
          </div>
          <h4 className="text-2xl font-black text-red-600">{totalLaborCost.toLocaleString()} đ</h4>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-2">
          <button 
            onClick={() => setIsAddingEmployee(true)}
            className="w-full bg-blue-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all text-sm"
          >
            <UserPlus size={16}/> Thêm nhân sự mới
          </button>
          <button 
            onClick={() => onTabChange?.('equity')}
            className="w-full bg-purple-50 text-purple-700 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-100 transition-all text-sm"
          >
            <PieChartIcon size={16}/> Chốt lương & Chia cổ phần
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Briefcase size={18} className="text-blue-600"/> Danh sách nhân viên
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-100">
                    <th className="p-4">Họ tên / Vai trò</th>
                    <th className="p-4">Liên hệ</th>
                    <th className="p-4">Lương cơ bản</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{emp.name}</p>
                        <p className="text-xs text-gray-500">{emp.role}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 text-xs text-gray-600">
                          <span className="flex items-center gap-1"><Phone size={12}/> {emp.phone}</span>
                          {emp.email && <span className="flex items-center gap-1"><Mail size={12}/> {emp.email}</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{emp.salaryBase.toLocaleString()} đ</p>
                        <p className="text-[10px] text-gray-400">/{emp.salaryType === 'MONTHLY' ? 'Tháng' : emp.salaryType === 'DAILY' ? 'Ngày' : 'Giờ'}</p>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${emp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {emp.status === 'ACTIVE' ? 'Đang làm' : 'Đã nghỉ'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => equityService.deleteEmployee(emp.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                          <Trash2 size={16}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <DollarSign size={18} className="text-red-600"/> Chi phí phát sinh
              </h3>
              <button 
                onClick={() => setIsAddingCost(true)}
                className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
              >
                <Plus size={20}/>
              </button>
            </div>
            <div className="space-y-4">
              {laborCosts.slice(0, 5).map(cost => (
                <div key={cost.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{employees.find(e => e.id === cost.employeeId)?.name || 'Nhân viên ẩn'}</p>
                    <p className="text-[10px] text-gray-500">{cost.date} • {cost.type}</p>
                  </div>
                  <p className="font-bold text-red-600">-{cost.amount.toLocaleString()} đ</p>
                </div>
              ))}
              {laborCosts.length === 0 && <p className="text-center text-gray-400 text-sm italic py-4">Chưa có chi phí ghi nhận</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isAddingEmployee && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddingEmployee(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
            <h3 className="text-xl font-black mb-6">Thêm nhân sự mới</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Họ và tên" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})} />
              <input type="text" placeholder="Vai trò (Vd: Đầu bếp, Phục vụ...)" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={empForm.role} onChange={e => setEmpForm({...empForm, role: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Số điện thoại" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={empForm.phone} onChange={e => setEmpForm({...empForm, phone: e.target.value})} />
                <input type="email" placeholder="Email" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={empForm.email} onChange={e => setEmpForm({...empForm, email: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Lương cơ bản" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={empForm.salaryBase} onChange={e => setEmpForm({...empForm, salaryBase: Number(e.target.value)})} />
                <select className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={empForm.salaryType} onChange={e => setEmpForm({...empForm, salaryType: e.target.value as any})}>
                  <option value="MONTHLY">Theo tháng</option>
                  <option value="DAILY">Theo ngày</option>
                  <option value="HOURLY">Theo giờ</option>
                </select>
              </div>
              <button onClick={handleAddEmployee} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Lưu nhân sự</button>
            </div>
          </div>
        </div>
      )}

      {isAddingCost && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddingCost(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
            <h3 className="text-xl font-black mb-6">Ghi nhận chi phí nhân công</h3>
            <div className="space-y-4">
              <select className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={costForm.employeeId} onChange={e => setCostForm({...costForm, employeeId: e.target.value})}>
                <option value="">Chọn nhân viên</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Số tiền" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={costForm.amount} onChange={e => setCostForm({...costForm, amount: Number(e.target.value)})} />
                <select className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={costForm.type} onChange={e => setCostForm({...costForm, type: e.target.value as any})}>
                  <option value="SALARY">Lương</option>
                  <option value="BONUS">Thưởng</option>
                  <option value="OVERTIME">Làm thêm giờ</option>
                </select>
              </div>
              <input type="date" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={costForm.date} onChange={e => setCostForm({...costForm, date: e.target.value})} />
              <textarea placeholder="Ghi chú..." className="w-full p-3 bg-gray-50 rounded-xl outline-none h-24" value={costForm.note} onChange={e => setCostForm({...costForm, note: e.target.value})} />
              <button onClick={handleAddCost} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold">Ghi nhận chi phí</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
