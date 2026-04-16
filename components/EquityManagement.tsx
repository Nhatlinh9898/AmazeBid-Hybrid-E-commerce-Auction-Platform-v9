import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, PieChart, TrendingUp, Plus, Trash2, Edit2, Save, X, 
  DollarSign, Briefcase, Award, Calculator, History, 
  Gavel, Scale, Landmark, ShieldCheck, ChevronRight, LogOut
} from 'lucide-react';
import { Shareholder, ProfitDistribution } from '../types';
import { equityService } from '../src/services/EquityService';
import { motion, AnimatePresence } from 'motion/react';

interface EquityManagementProps {
  ownerId: string;
  onTabChange?: (tab: any) => void;
  initialRevenue?: number;
  initialLaborCost?: number;
  initialSupplyCost?: number;
}

export const EquityManagement: React.FC<EquityManagementProps> = ({ 
  ownerId, 
  initialRevenue = 0,
  initialLaborCost = 0,
  initialSupplyCost = 0
}) => {
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [distributions, setDistributions] = useState<ProfitDistribution[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [exitingShareholder, setExitingShareholder] = useState<Shareholder | null>(null);
  const [exitPercentage, setExitPercentage] = useState(100);
  const [exitNote, setExitNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    capitalContribution: 0,
    assetContributionValue: 0,
    assetDetails: '',
    assetValueAtAddition: 0,
    assetUsefulLife: 5,
    laborContributionValue: 0,
    laborDetails: '',
    laborMarketSalary: 0,
    laborMonths: 0,
    laborMultiplier: 1,
    coreValueContributionValue: 0,
    coreValueDetails: '',
    coreValueBrand: 0,
    coreValueIP: 0,
    coreValueNetwork: 0,
    role: 'INVESTOR' as Shareholder['role'],
    group: 'INVESTOR' as Shareholder['group'],
    status: 'ACTIVE' as Shareholder['status'],
    joinDate: new Date().toISOString().split('T')[0]
  });

  const [distForm, setDistForm] = useState({
    revenue: initialRevenue,
    supplyCost: initialSupplyCost,
    laborCost: initialLaborCost,
    otherExpenses: 0,
    taxRate: 20, // Default corporate tax in VN is 20%
    period: `${new Date().getMonth() + 1}/${new Date().getFullYear()}`
  });

  const calculatedProfit = useMemo(() => {
    const ebit = distForm.revenue - distForm.supplyCost - distForm.laborCost - distForm.otherExpenses;
    const taxAmount = ebit > 0 ? (ebit * distForm.taxRate) / 100 : 0;
    const netProfitAfterTax = ebit - taxAmount;
    return {
      ebit,
      taxAmount,
      netProfitAfterTax: Math.max(0, netProfitAfterTax)
    };
  }, [distForm.revenue, distForm.supplyCost, distForm.laborCost, distForm.otherExpenses, distForm.taxRate]);

  const groupStats = useMemo(() => {
    const stats = {
      FOUNDER: { count: 0, percentage: 0 },
      INVESTOR: { count: 0, percentage: 0 },
      ESOP: { count: 0, percentage: 0 }
    };
    shareholders.forEach(sh => {
      if (stats[sh.group]) {
        stats[sh.group].count++;
        stats[sh.group].percentage += sh.sharePercentage;
      }
    });
    return stats;
  }, [shareholders]);

  useEffect(() => {
    const unsubscribe = equityService.subscribe((data) => {
      setShareholders(data.shareholders.filter(sh => sh.ownerId === ownerId));
      setDistributions(data.distributions.filter(d => d.ownerId === ownerId));
    });
    
    return () => unsubscribe();
  }, [ownerId]);

  const totalReinvested = useMemo(() => {
    return distributions.reduce((sum, d) => sum + (d.retainedAmount || 0), 0);
  }, [distributions]);

  const totalValuation = useMemo(() => {
    const initialContributions = shareholders.reduce((sum, sh) => 
      sum + sh.capitalContribution + sh.assetContributionValue + sh.laborContributionValue + sh.coreValueContributionValue, 0
    );
    return initialContributions + totalReinvested;
  }, [shareholders, totalReinvested]);

  const fairExitValue = useMemo(() => {
    if (!exitingShareholder) return 0;
    const fullValue = (totalValuation * exitingShareholder.sharePercentage) / 100;
    return (fullValue * exitPercentage) / 100;
  }, [exitingShareholder, totalValuation, exitPercentage]);

  const handleAdd = () => {
    if (!form.name) return;
    equityService.addShareholder({ ...form, ownerId });
    setIsAdding(false);
    resetForm();
  };

  const handleUpdate = (id: string) => {
    equityService.updateShareholder(id, form);
    setEditingId(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    equityService.deleteShareholder(id);
  };

  const handleExit = () => {
    if (exitingShareholder) {
      equityService.exitShareholder(exitingShareholder.id, exitPercentage, fairExitValue, exitNote);
      setExitingShareholder(null);
      setExitPercentage(100);
      setExitNote('');
    }
  };

  const handleDistribute = () => {
    if (calculatedProfit.netProfitAfterTax <= 0) return;
    equityService.distributeProfit(ownerId, calculatedProfit.netProfitAfterTax, distForm.period);
    setIsDistributing(false);
  };

  const resetForm = () => {
    setForm({
      name: '',
      capitalContribution: 0,
      assetContributionValue: 0,
      assetDetails: '',
      assetValueAtAddition: 0,
      assetUsefulLife: 5,
      laborContributionValue: 0,
      laborDetails: '',
      coreValueContributionValue: 0,
      coreValueDetails: '',
      role: 'INVESTOR',
      group: 'INVESTOR',
      status: 'ACTIVE',
      joinDate: new Date().toISOString().split('T')[0]
    });
  };

  const startEdit = (sh: Shareholder) => {
    setForm({
      name: sh.name,
      capitalContribution: sh.capitalContribution,
      assetContributionValue: sh.assetContributionValue,
      assetDetails: sh.assetDetails || '',
      assetValueAtAddition: sh.assetValueAtAddition || 0,
      assetUsefulLife: sh.assetUsefulLife || 5,
      laborContributionValue: sh.laborContributionValue,
      laborDetails: sh.laborDetails || '',
      laborMarketSalary: sh.laborMarketSalary || 0,
      laborMonths: sh.laborMonths || 0,
      laborMultiplier: sh.laborMultiplier || 1,
      coreValueContributionValue: sh.coreValueContributionValue,
      coreValueDetails: sh.coreValueDetails || '',
      coreValueBrand: sh.coreValueBrand || 0,
      coreValueIP: sh.coreValueIP || 0,
      coreValueNetwork: sh.coreValueNetwork || 0,
      role: sh.role,
      group: sh.group,
      status: sh.status,
      joinDate: sh.joinDate
    });
    setEditingId(sh.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Group Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-5 text-white shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <div className="p-2 bg-white/10 rounded-xl"><Landmark size={20}/></div>
            <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-full uppercase">Founders</span>
          </div>
          <h4 className="text-2xl font-black">{groupStats.FOUNDER.percentage.toFixed(1)}%</h4>
          <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest mt-1">{groupStats.FOUNDER.count} thành viên sáng lập</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl p-5 text-white shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <div className="p-2 bg-white/10 rounded-xl"><Scale size={20}/></div>
            <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-full uppercase">Investors</span>
          </div>
          <h4 className="text-2xl font-black">{groupStats.INVESTOR.percentage.toFixed(1)}%</h4>
          <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest mt-1">{groupStats.INVESTOR.count} nhà đầu tư chiến lược</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-3xl p-5 text-white shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <div className="p-2 bg-white/10 rounded-xl"><Gavel size={20}/></div>
            <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-full uppercase">ESOP</span>
          </div>
          <h4 className="text-2xl font-black">{groupStats.ESOP.percentage.toFixed(1)}%</h4>
          <p className="text-[10px] text-amber-100 font-bold uppercase tracking-widest mt-1">{groupStats.ESOP.count} nhân sự nòng cốt</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/10 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-full uppercase tracking-widest">Giá trị Doanh nghiệp</span>
          </div>
          <h3 className="text-3xl font-black mb-1">{totalValuation.toLocaleString()} đ</h3>
          <div className="flex flex-col gap-1">
            <p className="text-blue-100 text-[10px] font-medium">Vốn góp: {(totalValuation - totalReinvested).toLocaleString()} đ</p>
            <p className="text-green-300 text-[10px] font-bold">Tích lũy tái đầu tư: +{totalReinvested.toLocaleString()} đ</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
              <Users size={24} />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cổ đông</span>
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-1">{shareholders.length}</h3>
          <p className="text-gray-500 text-xs font-medium">Thành viên tham gia góp vốn</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <PieChart size={24} />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lợi nhuận chia</span>
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-1">
            {distributions.reduce((sum, d) => sum + d.distributedAmount, 0).toLocaleString()} đ
          </h3>
          <p className="text-gray-500 text-xs font-medium">Tổng lợi nhuận đã phân phối</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/10 rounded-2xl">
              <Calculator size={24} />
            </div>
            <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-full uppercase tracking-widest">Có thể chia dự kiến</span>
          </div>
          <h3 className="text-3xl font-black mb-1">
            {(calculatedProfit.netProfitAfterTax * 0.25).toLocaleString()} đ
          </h3>
          <p className="text-emerald-100 text-xs font-medium">Dựa trên hiệu suất kinh doanh hiện tại (Div = P * 25%)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-gray-900">Danh sách Cổ đông</h3>
                <p className="text-sm text-gray-500">Quản lý tỷ lệ sở hữu và vốn góp</p>
              </div>
              <button 
                onClick={() => { resetForm(); setEditingId(null); setIsAdding(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                <Plus size={18} /> Thêm cổ đông
              </button>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-50">
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cổ đông</th>
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vốn góp (Tổng)</th>
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tỷ lệ (%)</th>
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vai trò</th>
                    <th className="pb-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {shareholders.map(sh => (
                    <tr key={sh.id} className="group hover:bg-gray-50/50 transition-all">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black">
                            {sh.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{sh.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium">Tham gia: {sh.joinDate}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="font-black text-gray-900">
                          {(sh.capitalContribution + sh.assetContributionValue + sh.laborContributionValue + sh.coreValueContributionValue).toLocaleString()} đ
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sh.capitalContribution > 0 && <span className="text-[7px] font-bold bg-green-50 text-green-600 px-1 py-0.5 rounded uppercase">Tiền</span>}
                          {sh.assetContributionValue > 0 && <span className="text-[7px] font-bold bg-blue-50 text-blue-600 px-1 py-0.5 rounded uppercase">Vật chất</span>}
                          {sh.laborContributionValue > 0 && <span className="text-[7px] font-bold bg-orange-50 text-orange-600 px-1 py-0.5 rounded uppercase">Công</span>}
                          {sh.coreValueContributionValue > 0 && <span className="text-[7px] font-bold bg-purple-50 text-purple-600 px-1 py-0.5 rounded uppercase">Cốt lõi</span>}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-20">
                            <div 
                              className="h-full bg-blue-600 rounded-full" 
                              style={{ width: `${sh.sharePercentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-black text-blue-600">{sh.sharePercentage.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${
                          sh.group === 'FOUNDER' ? 'bg-indigo-50 text-indigo-600' : 
                          sh.group === 'INVESTOR' ? 'bg-emerald-50 text-emerald-600' : 
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {sh.group}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {sh.status !== 'EXITED' && (
                            <>
                              <button onClick={() => setExitingShareholder(sh)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-xl transition-all" title="Thoái vốn"><LogOut size={16}/></button>
                              <button onClick={() => startEdit(sh)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={16}/></button>
                            </>
                          )}
                          <button onClick={() => handleDelete(sh.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Exited Shareholders Section */}
          {shareholders.some(s => (s.exitValue || 0) > 0) && (
            <div className="mt-8 bg-gray-50 rounded-3xl p-6 border border-gray-200">
              <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <History size={20} className="text-gray-400" /> Lịch sử Thoái vốn
              </h3>
              <div className="space-y-3">
                {shareholders.filter(s => (s.exitValue || 0) > 0).map(sh => (
                  <div key={sh.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-900">{sh.name} {sh.status === 'EXITED' ? '(Đã rời đi)' : '(Thoái một phần)'}</p>
                      <p className="text-[10px] text-gray-400">Ngày cập nhật: {sh.exitDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-orange-600">{sh.exitValue?.toLocaleString()} đ</p>
                      <p className="text-[10px] text-gray-400 italic">{sh.exitNote}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legal Rights & Obligations Section */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <ShieldCheck size={20} className="text-emerald-600" /> Quyền lợi & Nghĩa vụ Pháp lý
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-2 mb-3">
                  <Landmark size={16} className="text-indigo-600" />
                  <h4 className="text-xs font-black text-indigo-900 uppercase">Founders</h4>
                </div>
                <ul className="text-[10px] text-indigo-800 space-y-2">
                  <li className="flex gap-2"><ChevronRight size={10} className="shrink-0 mt-0.5"/> Quyền quyết định chiến lược & nhân sự cấp cao.</li>
                  <li className="flex gap-2"><ChevronRight size={10} className="shrink-0 mt-0.5"/> Nghĩa vụ cam kết đồng hành (Vesting 4 năm).</li>
                  <li className="flex gap-2"><ChevronRight size={10} className="shrink-0 mt-0.5"/> Bảo vệ giá trị cốt lõi & văn hóa DN.</li>
                </ul>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-2 mb-3">
                  <Scale size={16} className="text-emerald-600" />
                  <h4 className="text-xs font-black text-emerald-900 uppercase">Investors</h4>
                </div>
                <ul className="text-[10px] text-emerald-800 space-y-2">
                  <li className="flex gap-2"><ChevronRight size={10} className="shrink-0 mt-0.5"/> Quyền kiểm tra báo cáo tài chính định kỳ.</li>
                  <li className="flex gap-2"><ChevronRight size={10} className="shrink-0 mt-0.5"/> Nghĩa vụ góp vốn đúng hạn theo cam kết.</li>
                  <li className="flex gap-2"><ChevronRight size={10} className="shrink-0 mt-0.5"/> Hỗ trợ kết nối mạng lưới & nguồn lực.</li>
                </ul>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="flex items-center gap-2 mb-3">
                  <Gavel size={16} className="text-amber-600" />
                  <h4 className="text-xs font-black text-amber-900 uppercase">ESOP</h4>
                </div>
                <ul className="text-[10px] text-amber-800 space-y-2">
                  <li className="flex gap-2"><ChevronRight size={10} className="shrink-0 mt-0.5"/> Quyền nhận thưởng cổ tức & thặng dư vốn.</li>
                  <li className="flex gap-2"><ChevronRight size={10} className="shrink-0 mt-0.5"/> Nghĩa vụ đạt KPI & hiệu suất nòng cốt.</li>
                  <li className="flex gap-2"><ChevronRight size={10} className="shrink-0 mt-0.5"/> Tuân thủ bảo mật & chống cạnh tranh.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Transparency & Calculation Guide */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <Calculator size={20} className="text-blue-600" /> Hướng dẫn Tính toán & Minh bạch
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <h4 className="text-sm font-black text-blue-900 mb-2">1. Công thức Định giá (Valuation)</h4>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Tổng giá trị doanh nghiệp = <span className="font-bold">Tiền mặt</span> + <span className="font-bold">Cơ sở vật chất</span> + <span className="font-bold">Công sức</span> + <span className="font-bold">Giá trị cốt lõi</span>.
                  </p>
                  <p className="text-[10px] text-blue-600 mt-2 italic">
                    * Giúp minh bạch hóa các đóng góp không bằng tiền nhưng có giá trị sống còn.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                  <h4 className="text-sm font-black text-green-900 mb-2">2. Tỷ lệ sở hữu (%)</h4>
                  <p className="text-xs text-green-800 leading-relaxed">
                    % Sở hữu = (Tổng đóng góp cá nhân / Tổng định giá doanh nghiệp) x 100.
                  </p>
                  <p className="text-[10px] text-green-600 mt-2 italic">
                    * Tỷ lệ này tự động cập nhật mỗi khi có thành viên mới hoặc góp vốn thêm.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                  <h4 className="text-sm font-black text-purple-900 mb-2">3. Phân bổ Lợi nhuận</h4>
                  <p className="text-xs text-purple-800 leading-relaxed">
                    Lợi nhuận chia = (Tổng lợi nhuận - Quỹ tái đầu tư) x % Sở hữu.
                  </p>
                  <p className="text-[10px] text-purple-600 mt-2 italic">
                    * Đảm bảo mọi cổ đông đều nhận được phần thưởng xứng đáng với tỷ lệ rủi ro và đóng góp.
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                  <h4 className="text-sm font-black text-orange-900 mb-2">4. Minh bạch Dòng tiền</h4>
                  <p className="text-xs text-orange-800 leading-relaxed">
                    Mọi giao dịch chia cổ tức đều được lưu vết lịch sử, không thể sửa đổi sau khi đã xác nhận.
                  </p>
                  <p className="text-[10px] text-orange-600 mt-2 italic">
                    * Giúp xây dựng niềm tin tuyệt đối giữa các cộng sự.
                  </p>
                </div>
              </div>
            </div>

            {/* Valuation Breakdown & Ratios */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Tiền mặt (Cash)', val: shareholders.reduce((s, h) => s + h.capitalContribution, 0), color: 'bg-green-500' },
                { label: 'Vật chất (Assets)', val: shareholders.reduce((s, h) => s + h.assetContributionValue, 0), color: 'bg-blue-500' },
                { label: 'Công sức (Labor)', val: shareholders.reduce((s, h) => s + h.laborContributionValue, 0), color: 'bg-orange-500' },
                { label: 'Cốt lõi (Core)', val: shareholders.reduce((s, h) => s + h.coreValueContributionValue, 0), color: 'bg-purple-500' },
              ].map((item, idx) => (
                <div key={idx} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                  <div className="flex items-end justify-between">
                    <p className="text-sm font-black text-gray-900">{item.val.toLocaleString()} đ</p>
                    <p className="text-xs font-black text-gray-400">{totalValuation > 0 ? ((item.val / totalValuation) * 100).toFixed(1) : 0}%</p>
                  </div>
                  <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: `${totalValuation > 0 ? (item.val / totalValuation) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Contribution Valuation Formulas */}
            <div className="mt-8 p-6 bg-blue-50 rounded-3xl border border-blue-100">
              <h4 className="text-sm font-black text-blue-900 mb-4 flex items-center gap-2">
                <Scale size={18} /> Công thức Định giá Đóng góp (Valuation Formulas)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h5 className="text-[10px] font-black text-blue-700 uppercase">1. Cơ sở Vật chất (Assets)</h5>
                  <code className="text-[10px] block bg-white p-2 rounded border border-blue-200 font-bold text-blue-600">
                    V_asset = V_init * (Life_rem / Life_total)
                  </code>
                  <p className="text-[9px] text-blue-800 leading-relaxed">
                    Giá trị được tính dựa trên giá thị trường tại thời điểm góp và khấu hao theo thời gian sử dụng dự kiến.
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="text-[10px] font-black text-orange-700 uppercase">2. Giá trị Công sức (Labor)</h5>
                  <code className="text-[10px] block bg-white p-2 rounded border border-orange-200 font-bold text-orange-600">
                    V_labor = (Salary_m * Months) * Multiplier
                  </code>
                  <p className="text-[9px] text-orange-800 leading-relaxed">
                    Quy đổi từ mức lương thị trường tương đương nhân với thời gian cam kết và hệ số kinh nghiệm (1.5x - 3x).
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="text-[10px] font-black text-purple-700 uppercase">3. Giá trị Cốt lõi (Core)</h5>
                  <code className="text-[10px] block bg-white p-2 rounded border border-purple-200 font-bold text-purple-600">
                    V_core = Brand + IP + Network
                  </code>
                  <p className="text-[9px] text-purple-800 leading-relaxed">
                    Định giá dựa trên giá trị thương hiệu, sở hữu trí tuệ, bí quyết kinh doanh và mạng lưới quan hệ sẵn có.
                  </p>
                </div>
              </div>

              {/* Concrete Contribution Examples */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/50 p-4 rounded-2xl border border-blue-100">
                  <p className="text-[9px] font-black text-blue-500 uppercase mb-2">Ví dụ Vật chất</p>
                  <div className="space-y-1 text-[10px]">
                    <p className="text-gray-600 italic">"Góp 1 Máy pha cà phê mới"</p>
                    <p className="font-bold text-gray-900">• V_init: 100.000.000 đ</p>
                    <p className="font-bold text-gray-900">• Life: 5 năm (Mới 100%)</p>
                    <div className="pt-1 border-t border-blue-100 mt-1">
                      <p className="font-black text-blue-600">Định giá: 100.000.000 đ</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/50 p-4 rounded-2xl border border-orange-100">
                  <p className="text-[9px] font-black text-orange-500 uppercase mb-2">Ví dụ Công sức</p>
                  <div className="space-y-1 text-[10px]">
                    <p className="text-gray-600 italic">"Quản lý vận hành 12 tháng"</p>
                    <p className="font-bold text-gray-900">• Lương TT: 20.000.000 đ/tháng</p>
                    <p className="font-bold text-gray-900">• Hệ số (Exp): 1.5x</p>
                    <div className="pt-1 border-t border-orange-100 mt-1">
                      <p className="font-black text-orange-600">Định giá: 360.000.000 đ</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/50 p-4 rounded-2xl border border-purple-100">
                  <p className="text-[9px] font-black text-purple-500 uppercase mb-2">Ví dụ Cốt lõi</p>
                  <div className="space-y-1 text-[10px]">
                    <p className="text-gray-600 italic">"Bí quyết & Mạng lưới khách hàng"</p>
                    <p className="font-bold text-gray-900">• Thương hiệu/IP: 150.000.000 đ</p>
                    <p className="font-bold text-gray-900">• Network: 50.000.000 đ</p>
                    <div className="pt-1 border-t border-purple-100 mt-1">
                      <p className="font-black text-purple-600">Định giá: 200.000.000 đ</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reinvestment Impact Explanation */}
            <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <h5 className="text-[10px] font-black text-indigo-900 uppercase mb-2 flex items-center gap-2">
                <TrendingUp size={14} /> Tác động của Lợi nhuận đến Định giá & Tỷ lệ sở hữu
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] leading-relaxed">
                <div className="space-y-2">
                  <p className="font-bold text-indigo-700">1. Định giá tổng (Total Valuation):</p>
                  <p className="text-gray-600">
                    Khi có lãi, 25% lợi nhuận (Phần Tái đầu tư - Re) được cộng trực tiếp vào vốn chủ sở hữu. Điều này làm **tăng giá trị thực tế** của doanh nghiệp mà không cần gọi thêm vốn ngoài.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-indigo-700">2. Tỷ lệ sở hữu (Share %):</p>
                  <p className="text-gray-600">
                    Vì lợi nhuận được tích lũy **tỷ lệ thuận** với cổ phần hiện tại, nên **tỷ lệ % sở hữu của các cổ đông không thay đổi**. Tuy nhiên, giá trị bằng tiền của số cổ phần đó sẽ tăng lên tương ứng với phần vốn tích lũy mới.
                  </p>
                </div>
              </div>
            </div>

            {/* Projected Distributable Profit Section */}
            <div className="mt-8 p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-sm font-black text-emerald-900 flex items-center gap-2">
                  <Calculator size={18} /> Mô phỏng Lợi nhuận có thể chia (Distributable Simulation)
                </h4>
                <div className="px-3 py-1 bg-emerald-100 rounded-full text-[10px] font-black text-emerald-700 uppercase">
                  Hiệu suất hiện tại
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">1. Lợi nhuận sau thuế (P)</p>
                  <div className="bg-white p-4 rounded-2xl border border-emerald-100">
                    <p className="text-2xl font-black text-gray-900">{calculatedProfit.netProfitAfterTax.toLocaleString()} đ</p>
                    <p className="text-[9px] text-gray-500 mt-1 italic">Lợi nhuận thực tế sau khi trừ mọi chi phí & thuế.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">2. Lợi nhuận Ròng (P_net)</p>
                  <div className="bg-white p-4 rounded-2xl border border-emerald-100">
                    <p className="text-2xl font-black text-blue-600">{(calculatedProfit.netProfitAfterTax * 0.5).toLocaleString()} đ</p>
                    <p className="text-[9px] text-gray-500 mt-1 italic">Phần còn lại sau khi trích lập 50% vào các quỹ (R, S, B, D).</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">3. Cổ tức có thể chia (Div)</p>
                  <div className="bg-emerald-600 p-4 rounded-2xl shadow-lg shadow-emerald-100">
                    <p className="text-2xl font-black text-white">{(calculatedProfit.netProfitAfterTax * 0.25).toLocaleString()} đ</p>
                    <p className="text-[9px] text-emerald-100 mt-1 italic">Số tiền mặt tối đa có thể chi trả cho cổ đông (50% của P_net).</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-white/50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-800 mb-3 uppercase tracking-widest">Dự kiến nhận theo tỷ lệ sở hữu:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {shareholders.map(sh => (
                    <div key={sh.id} className="p-3 bg-white rounded-xl border border-emerald-50">
                      <p className="text-[9px] font-bold text-gray-500 truncate">{sh.name}</p>
                      <p className="text-xs font-black text-emerald-600">
                        {(calculatedProfit.netProfitAfterTax * 0.25 * (sh.sharePercentage / 100)).toLocaleString()} đ
                      </p>
                      <p className="text-[8px] text-gray-400">{sh.sharePercentage.toFixed(1)}% cổ phần</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pre-Profit Calculation Guide (Tier 0) */}
            <div className="mt-8 p-6 bg-gray-50 rounded-3xl border border-gray-200">
              <h4 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                <Calculator size={18} className="text-blue-600" /> Tier 0: Xác định Lợi nhuận Trước thuế (EBIT)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Tổng Doanh thu (Revenue)</span>
                    <span className="font-bold text-gray-900">100%</span>
                  </div>
                  <div className="pl-4 space-y-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-400">- Chi phí Nguyên vật liệu (COGS)</span>
                      <span className="text-red-500 font-medium">Khấu trừ trực tiếp</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-400">- Chi phí Nhân sự vận hành (OPEX)</span>
                      <span className="text-red-500 font-medium">Lương, BHXH, Thưởng</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-400">- Chi phí Quản lý & Khác</span>
                      <span className="text-red-500 font-medium">Mặt bằng, Điện nước...</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between text-xs font-black">
                    <span>Lợi nhuận Trước thuế (EBIT)</span>
                    <span className="text-blue-600">Kết quả (A)</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3">
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nghĩa vụ Thuế (Tax)</h5>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Thuế TNDN (Mặc định 20%)</span>
                    <span className="font-bold text-orange-600">A * 20%</span>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-[10px] text-orange-800 leading-relaxed italic">
                      "Lợi nhuận dùng để chia cổ phần (P) là lợi nhuận sau khi đã hoàn thành mọi nghĩa vụ thuế với nhà nước."
                    </p>
                  </div>
                  <div className="flex justify-between text-xs font-black pt-2 border-t border-gray-100">
                    <span>Lợi nhuận Sau thuế (P)</span>
                    <span className="text-green-600">P = EBIT - Tax</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fund Explanation Table */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ký hiệu</th>
                    <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tên Quỹ (Tier 1)</th>
                    <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Công thức & Ví dụ</th>
                    <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr>
                    <td className="p-3 font-black text-red-600 text-xs">R</td>
                    <td className="p-3">
                      <p className="font-bold text-gray-900 text-xs">Dự phòng (Reserve)</p>
                      <p className="text-[9px] text-gray-400">Bảo hiểm rủi ro vận hành.</p>
                    </td>
                    <td className="p-3">
                      <code className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-red-600 font-bold">R = P * 10%</code>
                      <p className="text-[9px] text-gray-400 mt-1">VD: Lợi nhuận 1 tỷ → Trích 100tr</p>
                    </td>
                    <td className="p-3 font-black text-gray-900 text-xs">10%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-blue-600 text-xs">S</td>
                    <td className="p-3">
                      <p className="font-bold text-gray-900 text-xs">Quỹ lương (Salary)</p>
                      <p className="text-[9px] text-gray-400">Dự phòng lương 3-6 tháng.</p>
                    </td>
                    <td className="p-3">
                      <code className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-blue-600 font-bold">S = P * 20%</code>
                      <p className="text-[9px] text-gray-400 mt-1">VD: Lợi nhuận 1 tỷ → Trích 200tr</p>
                    </td>
                    <td className="p-3 font-black text-gray-900 text-xs">20%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-amber-600 text-xs">B</td>
                    <td className="p-3">
                      <p className="font-bold text-gray-900 text-xs">Khen thưởng (Bonus)</p>
                      <p className="text-[9px] text-gray-400">Thưởng KPI & động lực.</p>
                    </td>
                    <td className="p-3">
                      <code className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-amber-600 font-bold">B = P * 5%</code>
                      <p className="text-[9px] text-gray-400 mt-1">VD: Lợi nhuận 1 tỷ → Trích 50tr</p>
                    </td>
                    <td className="p-3 font-black text-gray-900 text-xs">5%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-purple-600 text-xs">D</td>
                    <td className="p-3">
                      <p className="font-bold text-gray-900 text-xs">Phát triển (Dev)</p>
                      <p className="text-[9px] text-gray-400">R&D & Mở rộng quy mô.</p>
                    </td>
                    <td className="p-3">
                      <code className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-purple-600 font-bold">D = P * 15%</code>
                      <p className="text-[9px] text-gray-400 mt-1">VD: Lợi nhuận 1 tỷ → Trích 150tr</p>
                    </td>
                    <td className="p-3 font-black text-gray-900 text-xs">15%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tier 2 & 3 Explanation */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tier 2: Lợi nhuận Ròng (Net)</h4>
                <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 font-bold text-gray-900">P_net = P - (R + S + B + D)</code>
                <p className="text-[10px] text-gray-500 mt-2">Lợi nhuận thực tế còn lại sau khi đã đảm bảo các quỹ vận hành (thường là 50% P).</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tier 3: Phân phối & Tái đầu tư</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] bg-white px-2 py-1 rounded border border-gray-200 font-bold text-green-600">Div = P_net * 50%</code>
                    <span className="text-[9px] text-gray-500">Chia cổ tức trực tiếp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] bg-white px-2 py-1 rounded border border-gray-200 font-bold text-blue-600">Re = P_net * 50%</code>
                    <span className="text-[9px] text-gray-500">Giữ lại tăng vốn điều lệ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Concrete Example Walkthrough */}
            <div className="mt-8 p-6 bg-gradient-to-br from-gray-900 to-blue-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Landmark size={120} />
              </div>
              <h4 className="text-lg font-black mb-6 flex items-center gap-2 relative z-10">
                <Calculator size={20} className="text-blue-400" /> Ví dụ Minh họa Cụ thể (P = 1.000.000.000 đ)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center text-[8px]">1</span>
                    Trích lập Quỹ (Tier 1)
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dự phòng (R)</span>
                      <span className="font-bold text-red-400">-100.000.000 đ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Quỹ lương (S)</span>
                      <span className="font-bold text-red-400">-200.000.000 đ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Khen thưởng (B)</span>
                      <span className="font-bold text-red-400">-50.000.000 đ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phát triển (D)</span>
                      <span className="font-bold text-red-400">-150.000.000 đ</span>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex justify-between font-black">
                      <span>Tổng quỹ (50%)</span>
                      <span className="text-red-400">-500.000.000 đ</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 md:border-l md:border-white/10 md:pl-8">
                  <p className="text-[10px] font-black text-green-300 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center text-[8px]">2</span>
                    Lợi nhuận Ròng (Tier 2)
                  </p>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-3xl font-black text-green-400">500.000.000 đ</p>
                    <p className="text-[9px] text-gray-400 mt-2 leading-relaxed">
                      Đây là số tiền (P_net) thực tế dùng để chia cổ tức và tái đầu tư sau khi đã đảm bảo an toàn vận hành.
                    </p>
                  </div>
                </div>
                <div className="space-y-4 md:border-l md:border-white/10 md:pl-8">
                  <p className="text-[10px] font-black text-purple-300 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center text-[8px]">3</span>
                    Phân phối (Tier 3)
                  </p>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-blue-300">Cổ tức (Div)</span>
                        <span className="text-sm font-black text-blue-400">250.000.000 đ</span>
                      </div>
                      <p className="text-[8px] text-blue-200/60 italic">Chia trực tiếp cho các cổ đông theo tỷ lệ %</p>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-purple-300">Tái đầu tư (Re)</span>
                        <span className="text-sm font-black text-purple-400">250.000.000 đ</span>
                      </div>
                      <p className="text-[8px] text-purple-200/60 italic">Giữ lại để tăng vốn và định giá DN</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100">
              <p className="text-[10px] text-red-700 font-bold flex items-center gap-2">
                <ShieldCheck size={14}/> LƯU Ý: Việc trích lập 50% lợi nhuận vào các quỹ là "điều kiện tiên quyết" để đảm bảo tính bền vững trước khi chia cổ tức.
              </p>
            </div>
          </div>

          {/* Distribution History */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <History size={20} className="text-purple-600" /> Lịch sử Chia lợi nhuận
                </h3>
              </div>
              <button 
                onClick={() => setIsDistributing(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-100"
              >
                <Calculator size={18} /> Chia lợi nhuận mới
              </button>
            </div>

            <div className="space-y-4">
              {distributions.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-400 text-sm font-medium">Chưa có đợt chia lợi nhuận nào</p>
                </div>
              ) : (
                distributions.map(dist => (
                  <div key={dist.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kỳ: {dist.period}</p>
                        <h4 className="font-black text-gray-900">Tổng lợi nhuận: {dist.totalProfit.toLocaleString()} đ</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Đã chia</p>
                        <p className="font-black text-green-600">{dist.distributedAmount.toLocaleString()} đ</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {dist.distributions.map(d => {
                        const sh = shareholders.find(s => s.id === d.shareholderId);
                        return (
                          <div key={d.shareholderId} className="bg-white px-3 py-1.5 rounded-xl border border-gray-100 flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-600">{sh?.name}:</span>
                            <span className="text-xs font-black text-blue-600">{d.amount.toLocaleString()} đ</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Forms */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {exitingShareholder ? (
              <motion.div 
                key="exit-modal"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-3xl p-6 border border-orange-100 shadow-xl shadow-orange-50 sticky top-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-gray-900 flex items-center gap-2">
                    <LogOut size={18} className="text-orange-600"/> Thoái vốn cổ đông
                  </h3>
                  <button onClick={() => setExitingShareholder(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Cổ đông thoái vốn</p>
                    <p className="font-black text-gray-900 text-lg">{exitingShareholder.name}</p>
                    <p className="text-xs text-gray-500">Sở hữu: {exitingShareholder.sharePercentage.toFixed(1)}% cổ phần</p>
                  </div>

                  <div className="p-4 bg-gray-900 rounded-2xl text-white">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tỷ lệ thoái vốn (%)</p>
                        <input 
                          type="number" 
                          min="1" 
                          max="100"
                          className="w-20 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-lg font-black outline-none focus:border-orange-400"
                          value={exitPercentage}
                          onChange={e => setExitPercentage(Math.min(100, Math.max(1, Number(e.target.value))))}
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Giá trị nhận về (Fair Value)</p>
                        <p className="text-2xl font-black text-orange-400">{fairExitValue.toLocaleString()} đ</p>
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-400 italic">
                      * Tính toán: (Giá trị Doanh nghiệp) x (% Sở hữu) x (% Thoái vốn)
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ghi chú thoái vốn</label>
                    <textarea 
                      className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 h-24"
                      placeholder="Lý do thoái vốn, hình thức thanh toán..."
                      value={exitNote}
                      onChange={e => setExitNote(e.target.value)}
                    />
                  </div>

                  <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[9px] text-blue-800 leading-relaxed">
                      <strong>Lưu ý:</strong> Sau khi xác nhận, phần cổ phần thoái vốn của {exitingShareholder.name} sẽ được thu hồi. Tỷ lệ sở hữu của các cổ đông còn lại sẽ tăng lên tương ứng.
                    </p>
                  </div>

                  <button 
                    onClick={handleExit}
                    className="w-full py-3 bg-orange-600 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-100"
                  >
                    <LogOut size={18} /> Xác nhận Thoái vốn
                  </button>
                </div>
              </motion.div>
            ) : isAdding ? (
              <motion.div 
                key="add-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-3xl p-6 border border-blue-100 shadow-xl shadow-blue-50 sticky top-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-gray-900 flex items-center gap-2">
                    {editingId ? <Edit2 size={18} className="text-blue-600"/> : <Plus size={18} className="text-blue-600"/>}
                    {editingId ? 'Sửa cổ đông' : 'Thêm cổ đông'}
                  </h3>
                  <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tên cổ đông</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <DollarSign size={10}/> Vốn tiền mặt (VND)
                      </label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.capitalContribution || ''}
                        onChange={e => setForm({ ...form, capitalContribution: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Briefcase size={10}/> Cơ sở vật chất (VND)
                      </label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.assetContributionValue || ''}
                        onChange={e => setForm({ ...form, assetContributionValue: Number(e.target.value) })}
                        placeholder="Máy móc, mặt bằng, trang thiết bị..."
                      />
                    </div>
                    
                    {form.assetContributionValue > 0 && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Chi tiết Vật chất</p>
                        <input 
                          type="text" 
                          placeholder="Tên tài sản (VD: Máy pha cà phê, Mặt bằng...)"
                          className="w-full px-3 py-1.5 bg-white rounded-lg text-xs outline-none border border-blue-100"
                          value={form.assetDetails}
                          onChange={e => setForm({ ...form, assetDetails: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] text-blue-400 mb-1">Giá trị lúc thêm</label>
                            <input 
                              type="number" 
                              className="w-full px-3 py-1.5 bg-white rounded-lg text-xs outline-none border border-blue-100"
                              value={form.assetValueAtAddition || ''}
                              onChange={e => setForm({ ...form, assetValueAtAddition: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-blue-400 mb-1">Năm sử dụng dự kiến</label>
                            <input 
                              type="number" 
                              className="w-full px-3 py-1.5 bg-white rounded-lg text-xs outline-none border border-blue-100"
                              value={form.assetUsefulLife || ''}
                              onChange={e => setForm({ ...form, assetUsefulLife: Number(e.target.value) })}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <TrendingUp size={10}/> Giá trị công sức (VND)
                      </label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.laborContributionValue || ''}
                        onChange={e => setForm({ ...form, laborContributionValue: Number(e.target.value) })}
                        placeholder="Kỹ năng, thời gian, quản lý..."
                      />
                    </div>
                    
                    {form.laborContributionValue > 0 && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-orange-50 rounded-2xl border border-orange-100 space-y-3">
                        <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Máy tính Giá trị Công sức</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] text-orange-400 mb-1">Lương thị trường/tháng</label>
                            <input 
                              type="number" 
                              className="w-full px-3 py-1.5 bg-white rounded-lg text-xs outline-none border border-orange-100"
                              value={form.laborMarketSalary || ''}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setForm(prev => ({ 
                                  ...prev, 
                                  laborMarketSalary: val,
                                  laborContributionValue: val * prev.laborMonths * prev.laborMultiplier
                                }));
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-orange-400 mb-1">Số tháng cam kết</label>
                            <input 
                              type="number" 
                              className="w-full px-3 py-1.5 bg-white rounded-lg text-xs outline-none border border-orange-100"
                              value={form.laborMonths || ''}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setForm(prev => ({ 
                                  ...prev, 
                                  laborMonths: val,
                                  laborContributionValue: prev.laborMarketSalary * val * prev.laborMultiplier
                                }));
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[8px] text-orange-400 mb-1">Hệ số kinh nghiệm (1.0 - 3.0)</label>
                          <input 
                            type="number" 
                            step="0.1"
                            className="w-full px-3 py-1.5 bg-white rounded-lg text-xs outline-none border border-orange-100"
                            value={form.laborMultiplier || ''}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setForm(prev => ({ 
                                ...prev, 
                                laborMultiplier: val,
                                laborContributionValue: prev.laborMarketSalary * prev.laborMonths * val
                              }));
                            }}
                          />
                        </div>
                        <textarea 
                          placeholder="Mô tả công việc cụ thể..."
                          className="w-full px-3 py-1.5 bg-white rounded-lg text-xs outline-none border border-orange-100 h-12"
                          value={form.laborDetails}
                          onChange={e => setForm({ ...form, laborDetails: e.target.value })}
                        />
                      </motion.div>
                    )}

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Award size={10}/> Giá trị cốt lõi (VND)
                      </label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.coreValueContributionValue || ''}
                        onChange={e => setForm({ ...form, coreValueContributionValue: Number(e.target.value) })}
                        placeholder="Thương hiệu, IP, Network, Bí quyết..."
                      />
                    </div>

                    {form.coreValueContributionValue > 0 && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-purple-50 rounded-2xl border border-purple-100 space-y-3">
                        <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Máy tính Giá trị Cốt lõi</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[8px] text-purple-400 mb-1">Thương hiệu</label>
                            <input 
                              type="number" 
                              className="w-full px-2 py-1.5 bg-white rounded-lg text-[10px] outline-none border border-purple-100"
                              value={form.coreValueBrand || ''}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setForm(prev => ({ 
                                  ...prev, 
                                  coreValueBrand: val,
                                  coreValueContributionValue: val + prev.coreValueIP + prev.coreValueNetwork
                                }));
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-purple-400 mb-1">IP/Bí quyết</label>
                            <input 
                              type="number" 
                              className="w-full px-2 py-1.5 bg-white rounded-lg text-[10px] outline-none border border-purple-100"
                              value={form.coreValueIP || ''}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setForm(prev => ({ 
                                  ...prev, 
                                  coreValueIP: val,
                                  coreValueContributionValue: prev.coreValueBrand + val + prev.coreValueNetwork
                                }));
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-purple-400 mb-1">Mạng lưới</label>
                            <input 
                              type="number" 
                              className="w-full px-2 py-1.5 bg-white rounded-lg text-[10px] outline-none border border-purple-100"
                              value={form.coreValueNetwork || ''}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setForm(prev => ({ 
                                  ...prev, 
                                  coreValueNetwork: val,
                                  coreValueContributionValue: prev.coreValueBrand + prev.coreValueIP + val
                                }));
                              }}
                            />
                          </div>
                        </div>
                        <textarea 
                          placeholder="Chi tiết về giá trị cốt lõi..."
                          className="w-full px-3 py-1.5 bg-white rounded-lg text-xs outline-none border border-purple-100 h-12"
                          value={form.coreValueDetails}
                          onChange={e => setForm({ ...form, coreValueDetails: e.target.value })}
                        />
                      </motion.div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Vai trò</label>
                      <select 
                        className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.role}
                        onChange={e => setForm({ ...form, role: e.target.value as any })}
                      >
                        <option value="FOUNDER">Sáng lập</option>
                        <option value="INVESTOR">Nhà đầu tư</option>
                        <option value="ADVISOR">Cố vấn</option>
                        <option value="EMPLOYEE">Nhân viên</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nhóm đối tượng</label>
                      <select 
                        className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.group}
                        onChange={e => setForm({ ...form, group: e.target.value as any })}
                      >
                        <option value="FOUNDER">Founders</option>
                        <option value="INVESTOR">Investors</option>
                        <option value="ESOP">ESOP (Nhân sự)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ngày tham gia</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.joinDate}
                      onChange={e => setForm({ ...form, joinDate: e.target.value })}
                    />
                  </div>

                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Tổng vốn định giá</span>
                      <span className="text-lg font-black text-blue-600">
                        {(form.capitalContribution + form.assetContributionValue + form.laborContributionValue + form.coreValueContributionValue).toLocaleString()} đ
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => editingId ? handleUpdate(editingId) : handleAdd()}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 mt-4"
                  >
                    <Save size={18} /> {editingId ? 'Lưu thay đổi' : 'Xác nhận góp vốn'}
                  </button>
                </div>
              </motion.div>
            ) : isDistributing ? (
              <motion.div 
                key="dist-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-3xl p-6 border border-purple-100 shadow-xl shadow-purple-50 sticky top-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-gray-900 flex items-center gap-2">
                    <Calculator size={18} className="text-purple-600"/>
                    Chia lợi nhuận
                  </h3>
                  <button onClick={() => setIsDistributing(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Doanh thu (VND)</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                        value={distForm.revenue || ''}
                        onChange={e => setDistForm({ ...distForm, revenue: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Thuế suất (%)</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                        value={distForm.taxRate || ''}
                        onChange={e => setDistForm({ ...distForm, taxRate: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Vật tư (COGS)</label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs outline-none"
                        value={distForm.supplyCost || ''}
                        onChange={e => setDistForm({ ...distForm, supplyCost: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Nhân sự (OPEX)</label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs outline-none"
                        value={distForm.laborCost || ''}
                        onChange={e => setDistForm({ ...distForm, laborCost: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Chi phí khác</label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs outline-none"
                        value={distForm.otherExpenses || ''}
                        onChange={e => setDistForm({ ...distForm, otherExpenses: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-900 rounded-2xl text-white space-y-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-400">Lợi nhuận Trước thuế (EBIT)</span>
                      <span className="font-bold">{calculatedProfit.ebit.toLocaleString()} đ</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-400">Thuế TNDN ({distForm.taxRate}%)</span>
                      <span className="font-bold text-orange-400">-{calculatedProfit.taxAmount.toLocaleString()} đ</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-xs font-black text-blue-400">LỢI NHUẬN SAU THUẾ (P)</span>
                      <span className="text-lg font-black text-green-400">{calculatedProfit.netProfitAfterTax.toLocaleString()} đ</span>
                    </div>
                  </div>

                  {/* Multi-tier Allocation Table */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bảng tính toán Phân bổ Đa tầng</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">1. Trích lập các Bộ Quỹ (50%)</span>
                        <span className="font-black text-red-500">-{ (calculatedProfit.netProfitAfterTax * 0.5).toLocaleString() } đ</span>
                      </div>
                      <div className="pl-4 space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-400">• Dự phòng (R - 10%)</span>
                          <span className="text-gray-600">{ (calculatedProfit.netProfitAfterTax * 0.1).toLocaleString() } đ</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-400">• Quỹ lương (S - 20%)</span>
                          <span className="text-gray-600">{ (calculatedProfit.netProfitAfterTax * 0.2).toLocaleString() } đ</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-400">• Khen thưởng (B - 5%)</span>
                          <span className="text-gray-600">{ (calculatedProfit.netProfitAfterTax * 0.05).toLocaleString() } đ</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-400">• Phát triển (D - 15%)</span>
                          <span className="text-gray-600">{ (calculatedProfit.netProfitAfterTax * 0.15).toLocaleString() } đ</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs pt-2 border-t border-gray-200">
                      <span className="text-gray-900 font-bold">2. Lợi nhuận Ròng (P_net)</span>
                      <span className="font-black text-gray-900">{ (calculatedProfit.netProfitAfterTax * 0.5).toLocaleString() } đ</span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">3. Chia cổ tức (Div - 25%)</span>
                      <span className="font-black text-green-600">+{ (calculatedProfit.netProfitAfterTax * 0.25).toLocaleString() } đ</span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">4. Tái đầu tư (Re - 25%)</span>
                      <span className="font-black text-blue-600">+{ (calculatedProfit.netProfitAfterTax * 0.25).toLocaleString() } đ</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Kỳ phân phối</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      value={distForm.period}
                      onChange={e => setDistForm({ ...distForm, period: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 max-h-[150px] overflow-y-auto no-scrollbar pr-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dự kiến nhận (Cổ tức):</p>
                    {shareholders.map(sh => (
                      <div key={sh.id} className="flex justify-between items-center text-[10px] p-2 bg-white rounded-lg border border-gray-100">
                        <span className="font-bold text-gray-600">{sh.name} ({sh.sharePercentage.toFixed(1)}%)</span>
                        <span className="font-black text-green-600">
                          {(calculatedProfit.netProfitAfterTax * 0.25 * (sh.sharePercentage/100)).toLocaleString()} đ
                        </span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handleDistribute}
                    className="w-full py-3 bg-purple-600 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 mt-4"
                  >
                    <Calculator size={18} /> Xác nhận chia lợi nhuận
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="info-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl"
              >
                <PieChart size={48} className="mb-4 opacity-50" />
                <h3 className="text-xl font-black mb-2">Quản trị Cổ phần</h3>
                <p className="text-sm text-indigo-100 mb-6">
                  Hệ thống tự động tính toán tỷ lệ sở hữu dựa trên tổng giá trị đóng góp (Tiền mặt + Công sức + Tài sản trí tuệ).
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <Check size={14} />
                    </div>
                    <p className="text-xs font-medium">Tự động cập nhật % sở hữu khi có vốn mới</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <Check size={14} />
                    </div>
                    <p className="text-xs font-medium">Tính toán chia lợi nhuận theo tỷ lệ thực tế</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <Check size={14} />
                    </div>
                    <p className="text-xs font-medium">Minh bạch hóa đóng góp công sức (Sweat Equity)</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const Check = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
