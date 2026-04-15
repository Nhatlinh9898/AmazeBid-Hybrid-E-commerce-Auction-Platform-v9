
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, TrendingUp, ShieldCheck, Plus, Trash2, 
  Calculator, Info, Award, PieChart as PieChartIcon, BarChart3, Download, Settings2,
  Scale, Gavel, Briefcase, Landmark, Coins, ExternalLink, Link2, Truck
} from 'lucide-react';
import { Shareholder, ProfitDistribution } from '../types';
import { equityService } from '../src/services/EquityService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface EquityManagementProps {
  ownerId: string;
  onTabChange?: (tab: any) => void;
  initialRevenue?: number;
  initialLaborCost?: number;
  initialSupplyCost?: number;
}

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4'];

export const EquityManagement: React.FC<EquityManagementProps> = ({ 
  ownerId, 
  onTabChange,
  initialRevenue = 1000000000,
  initialLaborCost = 250000000,
  initialSupplyCost = 150000000
}) => {
  const [revenue, setRevenue] = useState(initialRevenue);
  const [opexItems, setOpexItems] = useState([
    { id: '1', name: 'Thuế thu nhập doanh nghiệp (Ước tính)', amount: 200000000 },
    { id: '2', name: 'Lương cứng nhân viên (Từ Nhân sự)', amount: initialLaborCost },
    { id: '3', name: 'Mặt bằng & Vận hành', amount: 100000000 },
    { id: '4', name: 'Vật tư & NCC (Từ Chuỗi cung ứng)', amount: initialSupplyCost },
  ]);
  const [newOpex, setNewOpex] = useState({ name: '', amount: 0 });

  const totalOpEx = useMemo(() => opexItems.reduce((sum, item) => sum + item.amount, 0), [opexItems]);
  const calculatedProfit = useMemo(() => revenue - totalOpEx, [revenue, totalOpEx]);

  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [distributions, setDistributions] = useState<ProfitDistribution[]>([]);
  const [isAddingShareholder, setIsAddingShareholder] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [distributionForm, setDistributionForm] = useState({
    totalProfit: 0,
    reserveFund: 20, // %
    salaryFund: 15,  // %
    bonusFund: 5,    // %
    devFund: 10,     // %
    distributionRate: 50, // % of remaining
    period: ''
  });

  const shareholdersByGroup = useMemo(() => {
    return {
      founders: shareholders.filter(s => s.role === 'FOUNDER'),
      investors: shareholders.filter(s => s.role === 'INVESTOR' || s.role === 'ADVISOR'),
      employees: shareholders.filter(s => s.role === 'EMPLOYEE')
    };
  }, [shareholders]);

  useEffect(() => {
    const updateData = () => {
      setShareholders(equityService.getShareholdersByOwner(ownerId));
      setDistributions(equityService.getDistributionsByOwner(ownerId));
    };
    updateData();
    const unsubscribe = equityService.subscribe(updateData);
    return () => unsubscribe();
  }, [ownerId]);

  const openDistributionModal = () => {
    setDistributionForm({
      totalProfit: calculatedProfit,
      reserveFund: 20,
      salaryFund: 15,
      bonusFund: 5,
      devFund: 10,
      distributionRate: 50,
      period: `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`
    });
    setIsDistributing(true);
  };

  const [shForm, setShForm] = useState<Omit<Shareholder, 'id' | 'ownerId' | 'sharePercentage'>>({
    name: '',
    capitalContribution: 0,
    laborContributionValue: 0,
    otherContributionValue: 0,
    joinDate: new Date().toISOString().split('T')[0],
    role: 'FOUNDER',
    status: 'ACTIVE'
  });

  const handleAddShareholder = () => {
    equityService.addShareholder({ ...shForm, ownerId });
    setIsAddingShareholder(false);
    setShForm({ 
      name: '', 
      capitalContribution: 0, 
      laborContributionValue: 0, 
      otherContributionValue: 0, 
      joinDate: new Date().toISOString().split('T')[0],
      role: 'FOUNDER',
      status: 'ACTIVE'
    });
  };

  const handleDistribute = () => {
    const totalFundsPercent = distributionForm.reserveFund + distributionForm.salaryFund + distributionForm.bonusFund + distributionForm.devFund;
    const fundsAmount = (distributionForm.totalProfit * totalFundsPercent) / 100;
    const remainingProfit = distributionForm.totalProfit - fundsAmount;
    
    const distributedAmount = (remainingProfit * distributionForm.distributionRate) / 100;
    const retainedAmount = remainingProfit - distributedAmount + fundsAmount; // Retained includes funds for now in this simple model
    
    equityService.distributeProfit(ownerId, distributionForm.totalProfit, distributedAmount, retainedAmount, distributionForm.period);
    setIsDistributing(false);
  };

  const totalCapital = shareholders.reduce((sum, s) => sum + s.capitalContribution, 0);
  const totalLaborValue = shareholders.reduce((sum, s) => sum + s.laborContributionValue, 0);
  const totalOtherValue = shareholders.reduce((sum, s) => sum + s.otherContributionValue, 0);
  const totalEquityValue = totalCapital + totalLaborValue + totalOtherValue;

  const chartData = shareholders.map(s => ({
    name: s.name,
    value: s.sharePercentage
  }));

  const historyData = distributions.map(d => ({
    period: d.period,
    distributed: d.distributedAmount,
    retained: d.retainedAmount
  })).reverse().slice(-6); // Last 6 periods

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><ShieldCheck size={20}/></div>
            <span className="text-xs font-bold text-gray-500 uppercase">Tổng vốn định giá</span>
          </div>
          <h4 className="text-xl font-black">{totalEquityValue.toLocaleString()} đ</h4>
          <p className="text-[10px] text-gray-400 mt-1">Bao gồm Tiền + Công sức + IP</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-50 p-2 rounded-lg text-purple-600"><Award size={20}/></div>
            <span className="text-xs font-bold text-gray-500 uppercase">Giá trị góp sức</span>
          </div>
          <h4 className="text-xl font-black">{totalLaborValue.toLocaleString()} đ</h4>
          <p className="text-[10px] text-gray-400 mt-1">{(totalLaborValue / (totalEquityValue || 1) * 100).toFixed(1)}% tổng giá trị</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-50 p-2 rounded-lg text-green-600"><TrendingUp size={20}/></div>
            <span className="text-xs font-bold text-gray-500 uppercase">Lợi nhuận dự kiến</span>
          </div>
          <h4 className="text-xl font-black text-green-600">{calculatedProfit.toLocaleString()} đ</h4>
          <p className="text-[10px] text-gray-400 mt-1">Dựa trên Doanh thu - OpEx</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2">
          <button 
            onClick={() => setIsAddingShareholder(true)}
            className="w-full bg-indigo-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all text-sm"
          >
            <Plus size={16}/> Thêm cổ đông
          </button>
          <button 
            onClick={openDistributionModal}
            className="w-full bg-green-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all text-sm"
          >
            <Calculator size={16}/> Chia lợi nhuận
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shareholder List & Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Grouped View */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-4 rounded-2xl text-white shadow-lg">
              <div className="flex justify-between items-start mb-2">
                <Landmark size={20} className="opacity-80" />
                <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-full">Nhóm 1</span>
              </div>
              <h4 className="font-bold text-sm">Người Sáng Lập</h4>
              <p className="text-2xl font-black">{shareholdersByGroup.founders.length}</p>
              <p className="text-[10px] opacity-70">Sở hữu: {shareholdersByGroup.founders.reduce((sum, s) => sum + s.sharePercentage, 0).toFixed(1)}%</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-4 rounded-2xl text-white shadow-lg">
              <div className="flex justify-between items-start mb-2">
                <Coins size={20} className="opacity-80" />
                <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-full">Nhóm 2</span>
              </div>
              <h4 className="font-bold text-sm">Cổ Đông / Nhà Đầu Tư</h4>
              <p className="text-2xl font-black">{shareholdersByGroup.investors.length}</p>
              <p className="text-[10px] opacity-70">Sở hữu: {shareholdersByGroup.investors.reduce((sum, s) => sum + s.sharePercentage, 0).toFixed(1)}%</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-4 rounded-2xl text-white shadow-lg">
              <div className="flex justify-between items-start mb-2">
                <Briefcase size={20} className="opacity-80" />
                <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-full">Nhóm 3</span>
              </div>
              <h4 className="font-bold text-sm">Người Lao Động (ESOP)</h4>
              <p className="text-2xl font-black">{shareholdersByGroup.employees.length}</p>
              <p className="text-[10px] opacity-70">Sở hữu: {shareholdersByGroup.employees.reduce((sum, s) => sum + s.sharePercentage, 0).toFixed(1)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PieChartIcon size={18} className="text-indigo-600"/> Cơ cấu sở hữu
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-green-600"/> Lịch sử lợi nhuận
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="period" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                    <Bar dataKey="distributed" name="Đã chia" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="retained" name="Tái đầu tư" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* OpEx Management Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Landmark size={18} className="text-red-600"/> Thiết lập Chi phí vận hành (OpEx)
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Doanh thu:</span>
                  <input 
                    type="number" 
                    value={revenue} 
                    onChange={(e) => setRevenue(Number(e.target.value))}
                    className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold w-32 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button 
                    onClick={() => onTabChange?.('products')}
                    className="text-[10px] text-emerald-600 hover:underline font-bold flex items-center gap-1"
                  >
                    <ExternalLink size={12}/> Từ Sản phẩm
                  </button>
                </div>
                <button 
                  onClick={() => onTabChange?.('tax')}
                  className="text-[10px] text-blue-600 hover:underline font-bold flex items-center gap-1"
                >
                  <ExternalLink size={12}/> Xem Báo cáo Thuế
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex flex-wrap gap-4 items-center justify-between">
                <p className="text-[11px] text-indigo-700 font-medium flex items-center gap-2">
                  <Link2 size={14}/> Kết nối dữ liệu hệ thống:
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setOpexItems(prev => prev.map(item => 
                        item.name.includes('Lương') ? { ...item, amount: initialLaborCost } : item
                      ));
                    }}
                    className="text-[10px] bg-white border border-indigo-200 text-indigo-600 px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-1"
                  >
                    <Briefcase size={12}/> Cập nhật Lương ({initialLaborCost.toLocaleString()} đ)
                  </button>
                  <button 
                    onClick={() => {
                      setOpexItems(prev => prev.map(item => 
                        item.name.includes('Vật tư') ? { ...item, amount: initialSupplyCost } : item
                      ));
                    }}
                    className="text-[10px] bg-white border border-indigo-200 text-indigo-600 px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-1"
                  >
                    <Truck size={12}/> Cập nhật Vật tư ({initialSupplyCost.toLocaleString()} đ)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Tên chi phí (VD: Thuế, Lương...)" 
                      value={newOpex.name}
                      onChange={(e) => setNewOpex({...newOpex, name: e.target.value})}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <input 
                      type="number" 
                      placeholder="Số tiền" 
                      value={newOpex.amount || ''}
                      onChange={(e) => setNewOpex({...newOpex, amount: Number(e.target.value)})}
                      className="w-32 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button 
                      onClick={() => {
                        if (newOpex.name && newOpex.amount > 0) {
                          setOpexItems([...opexItems, { id: Date.now().toString(), ...newOpex }]);
                          setNewOpex({ name: '', amount: 0 });
                        }
                      }}
                      className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-all"
                    >
                      <Plus size={16}/>
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                    {opexItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg group">
                        <span className="text-xs text-gray-600">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-red-600">-{item.amount.toLocaleString()} đ</span>
                          <button 
                            onClick={() => setOpexItems(opexItems.filter(i => i.id !== item.id))}
                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-indigo-50 rounded-2xl p-5 flex flex-col justify-center items-center text-center space-y-2">
                  <p className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider">Lợi nhuận thực tính (P_total)</p>
                  <h3 className="text-3xl font-black text-indigo-900">{calculatedProfit.toLocaleString()} đ</h3>
                  <div className="w-full h-1 bg-indigo-100 rounded-full overflow-hidden mt-2">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-500" 
                      style={{ width: `${Math.max(0, Math.min(100, (calculatedProfit / revenue) * 100))}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-indigo-600 font-medium">Tỉ suất lợi nhuận: {((calculatedProfit / (revenue || 1)) * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rights and Obligations Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Gavel size={18} className="text-indigo-600"/> Quyền lợi & Nghĩa vụ Pháp lý
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-bold text-indigo-700 flex items-center gap-2 text-sm">
                  <Landmark size={14}/> Người Sáng Lập
                </h4>
                <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
                  <li><strong>Quyền:</strong> Quyết định chiến lược, phủ quyết các thay đổi cấu trúc cốt lõi, nhận cổ tức ưu đãi.</li>
                  <li><strong>Nghĩa vụ:</strong> Cam kết đồng hành tối thiểu 3-5 năm (Vesting), bảo mật công nghệ, chịu trách nhiệm pháp lý cao nhất.</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-emerald-700 flex items-center gap-2 text-sm">
                  <Coins size={14}/> Cổ Đông / Nhà Đầu Tư
                </h4>
                <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
                  <li><strong>Quyền:</strong> Kiểm tra báo cáo tài chính, tham gia biểu quyết đại hội cổ đông, ưu tiên mua cổ phần phát hành thêm.</li>
                  <li><strong>Nghĩa vụ:</strong> Góp vốn đúng hạn, không can thiệp trực tiếp vào điều hành hàng ngày trừ khi có thỏa thuận.</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-amber-700 flex items-center gap-2 text-sm">
                  <Briefcase size={14}/> Người Lao Động
                </h4>
                <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
                  <li><strong>Quyền:</strong> Nhận lợi nhuận từ quỹ thưởng ESOP, tham gia đóng góp ý kiến cải tiến sản phẩm.</li>
                  <li><strong>Nghĩa vụ:</strong> Đạt KPI cam kết, tuân thủ văn hóa doanh nghiệp, hoàn trả cổ phần nếu nghỉ việc trước thời hạn (Cliff).</li>
                </ul>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 italic">
              * Các điều khoản trên mang tính chất tham khảo và cần được cụ thể hóa bằng Hợp đồng Cổ đông (SHA).
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Users size={18} className="text-indigo-600"/> Danh sách cổ đông chi tiết
              </h3>
              <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                <Download size={16}/>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-100">
                    <th className="p-4">Cổ đông</th>
                    <th className="p-4">Vai trò</th>
                    <th className="p-4">Vốn góp (đ)</th>
                    <th className="p-4">Góp sức (đ)</th>
                    <th className="p-4">Khác (đ)</th>
                    <th className="p-4">Tỉ lệ</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {shareholders.map(sh => (
                    <tr key={sh.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                            {sh.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{sh.name}</p>
                            <p className="text-[10px] text-gray-400">{sh.status === 'ACTIVE' ? 'Đang hoạt động' : 'Cổ đông thụ động'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sh.role === 'FOUNDER' ? 'bg-indigo-100 text-indigo-700' :
                          sh.role === 'INVESTOR' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {sh.role}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-gray-700">{sh.capitalContribution.toLocaleString()}</td>
                      <td className="p-4 font-medium text-purple-600">{sh.laborContributionValue.toLocaleString()}</td>
                      <td className="p-4 font-medium text-orange-600">{sh.otherContributionValue.toLocaleString()}</td>
                      <td className="p-4">
                        <span className="font-black text-indigo-600">{sh.sharePercentage.toFixed(1)}%</span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => equityService.deleteShareholder(sh.id, ownerId)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                          <Trash2 size={16}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Profit Distribution History List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Calculator size={18} className="text-green-600"/> Lịch sử chi trả chi tiết
              </h3>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {distributions.map(dist => (
                <div key={dist.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-bold text-gray-900">{dist.period}</p>
                      <p className="text-[10px] text-gray-400">Ngày chốt: {new Date(dist.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-green-600">Phân phối: {dist.distributedAmount.toLocaleString()} đ</p>
                      <p className="text-[10px] text-indigo-600 font-bold">Tái đầu tư: {dist.retainedAmount.toLocaleString()} đ</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {dist.distributions.map(d => (
                      <div key={d.shareholderId} className="bg-white p-2 rounded-lg border border-gray-100 text-center">
                        <p className="text-[10px] text-gray-500 truncate">{shareholders.find(s => s.id === d.shareholderId)?.name}</p>
                        <p className="text-xs font-bold text-indigo-600">+{d.amount.toLocaleString()} đ</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {distributions.length === 0 && (
                <div className="p-12 text-center text-gray-400 italic">Chưa có lịch sử phân chia</div>
              )}
            </div>
          </div>
        </div>

        {/* Calculation Logic Info */}
        <div className="space-y-6">
          <div className="bg-indigo-900 text-white rounded-2xl p-6 shadow-xl shadow-indigo-100">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Scale size={20}/> Công thức Phân bổ Lợi nhuận
            </h3>
            <div className="space-y-4 text-xs text-indigo-100">
              {/* Step 1 */}
              <div className="bg-indigo-800/50 p-4 rounded-xl border border-indigo-700">
                <p className="font-bold text-white mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px]">1</span>
                  Trích lập Bộ Quỹ (Σ Funds)
                </p>
                <div className="bg-black/20 p-2 rounded font-mono text-[10px] mb-2 text-green-400">
                  Σ Funds = P_total × (R + S + B + D)%
                </div>
                <ul className="space-y-1 opacity-80">
                  <li>• <strong>R (Reserve):</strong> Dự phòng (20%)</li>
                  <li>• <strong>S (Salary):</strong> Quỹ lương (15%)</li>
                  <li>• <strong>B (Bonus):</strong> Khen thưởng (5%)</li>
                  <li>• <strong>D (Dev):</strong> Phát triển (10%)</li>
                </ul>
              </div>

              {/* Step 2 */}
              <div className="bg-indigo-800/50 p-4 rounded-xl border border-indigo-700">
                <p className="font-bold text-white mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px]">2</span>
                  Lợi nhuận ròng (P_net)
                </p>
                <div className="bg-black/20 p-2 rounded font-mono text-[10px] text-green-400">
                  P_net = P_total - Σ Funds
                </div>
                <p className="mt-2 opacity-80 italic">Đây là phần lợi nhuận thực tế còn lại sau khi đã đảm bảo các nghĩa vụ vận hành và dự phòng.</p>
              </div>

              {/* Step 3 */}
              <div className="bg-indigo-800/50 p-4 rounded-xl border border-indigo-700">
                <p className="font-bold text-white mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px]">3</span>
                  Phân phối Cổ tức (Dividends)
                </p>
                <div className="bg-black/20 p-2 rounded font-mono text-[10px] text-green-400">
                  Dividends = P_net × 50%
                </div>
                <p className="mt-2 font-bold text-white">Chia cho từng cá nhân (i):</p>
                <div className="bg-black/20 p-2 rounded font-mono text-[10px] mt-1 text-amber-400">
                  Share_i = Dividends × Ownership_i%
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-indigo-800/50 p-4 rounded-xl border border-indigo-700">
                <p className="font-bold text-white mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px]">4</span>
                  Tái đầu tư (Retained)
                </p>
                <div className="bg-black/20 p-2 rounded font-mono text-[10px] text-green-400">
                  Retained = P_net × 50%
                </div>
                <p className="mt-2 opacity-80 italic">Dùng để tăng vốn điều lệ, nâng giá trị cổ phần (Valuation) cho tất cả cổ đông.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Info size={18} className="text-blue-600"/> Thuyết minh các Bộ Quỹ
            </h3>
            <div className="space-y-4">
              <div className="overflow-hidden border border-gray-100 rounded-xl">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-gray-50 text-gray-500 uppercase font-bold">
                    <tr>
                      <th className="p-3">Tên Quỹ</th>
                      <th className="p-3">Mục đích sử dụng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <tr>
                      <td className="p-3 font-bold text-indigo-600">Dự phòng (R)</td>
                      <td className="p-3 text-gray-600">Bảo hiểm rủi ro vận hành, bù đắp thua lỗ bất ngờ hoặc xử lý khủng hoảng thị trường.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-emerald-600">Quỹ lương (S)</td>
                      <td className="p-3 text-gray-600">Đảm bảo quỹ lương dự phòng 3-6 tháng cho nhân sự cốt cán, tránh gián đoạn khi dòng tiền biến động.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-amber-600">Khen thưởng (B)</td>
                      <td className="p-3 text-gray-600">Thưởng hiệu quả công việc (KPI), vinh danh cá nhân xuất sắc và tạo động lực cho đội ngũ.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-purple-600">Phát triển (D)</td>
                      <td className="p-3 text-gray-600">Tái đầu tư công nghệ, nâng cấp hệ thống, nghiên cứu sản phẩm mới (R&D) và mở rộng thị trường.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-[10px] text-blue-700 leading-relaxed">
                  <strong>Lưu ý:</strong> Việc trích lập 50% lợi nhuận vào các quỹ này là điều kiện tiên quyết để đảm bảo tính bền vững của doanh nghiệp trước khi thực hiện nghĩa vụ chi trả cổ tức.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-emerald-600"/> Ví dụ Minh họa Dòng tiền (Dựa trên thiết lập)
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">1. Tổng Doanh thu (Revenue)</span>
                  <span className="font-bold text-gray-900">{revenue.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between items-center text-sm text-red-600">
                  <span className="flex items-center gap-1">2. Chi phí vận hành (OpEx) <Info size={12} title="Bao gồm các mục bạn đã thiết lập ở trên"/></span>
                  <span className="font-bold">-{totalOpEx.toLocaleString()} đ</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm">
                  <span className="font-bold text-indigo-600">3. Lợi nhuận trước trích quỹ (P_total)</span>
                  <span className="font-bold text-indigo-600">{calculatedProfit.toLocaleString()} đ</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Phân bổ theo cơ chế Đa tầng (từ {calculatedProfit.toLocaleString()}):</p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100 space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-red-700 font-bold">Trích lập các Bộ Quỹ (50% của P_total)</span>
                      <span className="font-bold text-red-700">-{(calculatedProfit * 0.5).toLocaleString()} đ</span>
                    </div>
                    <p className="text-[9px] text-red-600 opacity-80">Đưa vào các quỹ Dự phòng (20%), Lương dự phòng (15%), Thưởng (5%) và Phát triển (10%).</p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-xl border border-green-100 space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-green-700 font-bold">Chia cổ tức (25% của P_total)</span>
                      <span className="font-bold text-green-700">+{(calculatedProfit * 0.25).toLocaleString()} đ</span>
                    </div>
                    <p className="text-[9px] text-green-600 opacity-80">Được chia trực tiếp cho các cổ đông theo tỉ lệ sở hữu thực tế.</p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-blue-700 font-bold">Tái đầu tư (25% của P_total)</span>
                      <span className="font-bold text-blue-700">+{(calculatedProfit * 0.25).toLocaleString()} đ</span>
                    </div>
                    <p className="text-[9px] text-blue-600 opacity-80">Giữ lại để tăng vốn điều lệ, nâng cao giá trị doanh nghiệp (Valuation).</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-2">
                <p className="text-[11px] font-bold text-amber-900 flex items-center gap-2">
                  <ShieldCheck size={14}/> Điểm nhấn quan trọng:
                </p>
                <ul className="text-[10px] text-amber-800 space-y-1 list-disc pl-4">
                  <li><strong>Tính minh bạch:</strong> Mặc dù doanh thu 1 tỷ, nhưng chỉ 10% (100 triệu) được chia trực tiếp. 90% còn lại dùng để vận hành (60%), dự phòng an toàn (20%) và tái đầu tư (10%).</li>
                  <li><strong>Giải thích thuật ngữ:</strong> OpEx bao gồm các nghĩa vụ bắt buộc (Thuế, Lương, Mặt bằng...) để xác định chính xác P_total.</li>
                  <li><strong>Trực quan hóa:</strong> Phân định rõ luồng tiền bằng mã màu Đỏ (Chi phí/Quỹ), Xanh lá (Cổ tức) và Xanh dương (Tái đầu tư).</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Settings2 size={18} className="text-gray-600"/> Cấu hình phân phối
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tỉ lệ tái đầu tư mặc định</span>
                <span className="font-bold text-indigo-600">20%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Kỳ đối soát</span>
                <span className="font-bold text-gray-900">Hàng tháng</span>
              </div>
              <p className="text-[10px] text-gray-400 italic">Cấu hình này ảnh hưởng đến gợi ý khi thực hiện chia lợi nhuận.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isAddingShareholder && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddingShareholder(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
            <h3 className="text-xl font-black mb-6">Thêm cổ đông / Thành viên góp vốn</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Tên cổ đông" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={shForm.name} onChange={e => setShForm({...shForm, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <select className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm" value={shForm.role} onChange={e => setShForm({...shForm, role: e.target.value as any})}>
                  <option value="FOUNDER">Founder</option>
                  <option value="INVESTOR">Investor</option>
                  <option value="ADVISOR">Advisor</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
                <select className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm" value={shForm.status} onChange={e => setShForm({...shForm, status: e.target.value as any})}>
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="PASSIVE">Thụ động</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Vốn góp bằng tiền / tài sản (đ)</label>
                <input type="number" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={shForm.capitalContribution} onChange={e => setShForm({...shForm, capitalContribution: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Định giá góp sức / trí tuệ (đ)</label>
                <input type="number" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={shForm.laborContributionValue} onChange={e => setShForm({...shForm, laborContributionValue: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Định giá khác (Mối quan hệ, IP...) (đ)</label>
                <input type="number" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={shForm.otherContributionValue} onChange={e => setShForm({...shForm, otherContributionValue: Number(e.target.value)})} />
              </div>
              <button onClick={handleAddShareholder} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Lưu thông tin</button>
            </div>
          </div>
        </div>
      )}

      {isDistributing && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDistributing(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black mb-4">Phân phối lợi nhuận & Trích lập các Quỹ</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Tổng lợi nhuận kỳ này (đ)</label>
                  <input type="number" className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-green-600" value={distributionForm.totalProfit} onChange={e => setDistributionForm({...distributionForm, totalProfit: Number(e.target.value)})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Quỹ dự phòng (%)</label>
                    <input type="number" className="w-full p-2 bg-gray-50 rounded-lg outline-none text-sm" value={distributionForm.reserveFund} onChange={e => setDistributionForm({...distributionForm, reserveFund: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Quỹ lương (%)</label>
                    <input type="number" className="w-full p-2 bg-gray-50 rounded-lg outline-none text-sm" value={distributionForm.salaryFund} onChange={e => setDistributionForm({...distributionForm, salaryFund: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Quỹ thưởng (%)</label>
                    <input type="number" className="w-full p-2 bg-gray-50 rounded-lg outline-none text-sm" value={distributionForm.bonusFund} onChange={e => setDistributionForm({...distributionForm, bonusFund: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Quỹ phát triển (%)</label>
                    <input type="number" className="w-full p-2 bg-gray-50 rounded-lg outline-none text-sm" value={distributionForm.devFund} onChange={e => setDistributionForm({...distributionForm, devFund: Number(e.target.value)})} />
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-2xl p-5 space-y-3">
                <h4 className="font-bold text-indigo-900 text-sm border-b border-indigo-100 pb-2 flex items-center gap-2">
                  <Calculator size={16}/> Bảng tính toán (P_net)
                </h4>
                {(() => {
                  const totalFundsPercent = distributionForm.reserveFund + distributionForm.salaryFund + distributionForm.bonusFund + distributionForm.devFund;
                  const fundsAmount = (distributionForm.totalProfit * totalFundsPercent) / 100;
                  const remainingProfit = distributionForm.totalProfit - fundsAmount;
                  const distributableProfit = (remainingProfit * distributionForm.distributionRate) / 100;
                  const retainedProfit = remainingProfit - distributableProfit;

                  return (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Σ Funds ({totalFundsPercent}%):</span>
                        <span className="font-bold text-red-600">-{fundsAmount.toLocaleString()} đ</span>
                      </div>
                      <div className="flex justify-between border-t border-indigo-100 pt-2">
                        <span className="text-gray-700 font-bold">P_net (Lợi nhuận ròng):</span>
                        <span className="font-bold text-gray-900">{remainingProfit.toLocaleString()} đ</span>
                      </div>
                      <div className="flex justify-between text-indigo-600">
                        <span>Dividends ({distributionForm.distributionRate}%):</span>
                        <span className="font-bold">+{distributableProfit.toLocaleString()} đ</span>
                      </div>
                      <div className="flex justify-between text-indigo-600">
                        <span>Retained ({100 - distributionForm.distributionRate}%):</span>
                        <span className="font-bold">+{retainedProfit.toLocaleString()} đ</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Dự kiến chi trả cho cổ đông (50% của phần còn lại)</p>
              {shareholders.map(s => {
                const totalFundsPercent = distributionForm.reserveFund + distributionForm.salaryFund + distributionForm.bonusFund + distributionForm.devFund;
                const remainingProfit = distributionForm.totalProfit - (distributionForm.totalProfit * totalFundsPercent) / 100;
                const distributableProfit = (remainingProfit * distributionForm.distributionRate) / 100;
                const shareAmount = (distributableProfit * s.sharePercentage) / 100;
                return (
                  <div key={s.id} className="flex justify-between items-center p-2 bg-white border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold">{s.name.charAt(0)}</div>
                      <span className="text-xs font-medium">{s.name} ({s.sharePercentage.toFixed(1)}%)</span>
                    </div>
                    <span className="font-bold text-green-600 text-xs">+{shareAmount.toLocaleString()} đ</span>
                  </div>
                );
              })}
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setIsDistributing(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold">Hủy</button>
              <button onClick={handleDistribute} className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100">Xác nhận & Phân bổ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
