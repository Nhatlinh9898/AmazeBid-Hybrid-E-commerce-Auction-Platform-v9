
import React, { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, ShieldCheck, Plus, Trash2, 
  Calculator, Info, Award, PieChart as PieChartIcon, BarChart3, Download, Settings2
} from 'lucide-react';
import { Shareholder, ProfitDistribution } from '../types';
import { equityService } from '../src/services/EquityService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface EquityManagementProps {
  ownerId: string;
  currentProfit: number;
}

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4'];

export const EquityManagement: React.FC<EquityManagementProps> = ({ ownerId, currentProfit }) => {
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [distributions, setDistributions] = useState<ProfitDistribution[]>([]);
  const [isAddingShareholder, setIsAddingShareholder] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [distributionForm, setDistributionForm] = useState({
    totalProfit: 0,
    retainedPercent: 20,
    period: ''
  });

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
      totalProfit: currentProfit,
      retainedPercent: 20,
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
    const retainedAmount = (distributionForm.totalProfit * distributionForm.retainedPercent) / 100;
    const distributedAmount = distributionForm.totalProfit - retainedAmount;
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
            <span className="text-xs font-bold text-gray-500 uppercase">Lợi nhuận kỳ này</span>
          </div>
          <h4 className="text-xl font-black text-green-600">{currentProfit.toLocaleString()} đ</h4>
          <p className="text-[10px] text-gray-400 mt-1">Sẵn sàng phân phối</p>
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
              <Info size={20}/> Cơ chế phân chia
            </h3>
            <div className="space-y-4 text-sm text-indigo-100">
              <div className="bg-indigo-800/50 p-3 rounded-xl border border-indigo-700">
                <p className="font-bold text-white mb-1">1. Vốn góp (Capital)</p>
                <p>Tiền mặt, máy móc, mặt bằng được định giá tại thời điểm góp.</p>
              </div>
              <div className="bg-indigo-800/50 p-3 rounded-xl border border-indigo-700">
                <p className="font-bold text-white mb-1">2. Góp sức (Sweat Equity)</p>
                <p>Giá trị chất xám, thời gian vận hành không lương của Founder/Co-founder.</p>
              </div>
              <div className="bg-indigo-800/50 p-3 rounded-xl border border-indigo-700">
                <p className="font-bold text-white mb-1">3. Lợi nhuận giữ lại</p>
                <p>Phần lợi nhuận không chia mà giữ lại để tái đầu tư, tăng giá trị công ty.</p>
              </div>
              <div className="mt-6 pt-6 border-t border-indigo-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs opacity-70">Tổng giá trị doanh nghiệp</span>
                  <span className="font-bold text-white">{totalEquityValue.toLocaleString()} đ</span>
                </div>
                <div className="w-full h-1.5 bg-indigo-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400" style={{ width: '100%' }} />
                </div>
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
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
            <h3 className="text-xl font-black mb-4">Phân phối lợi nhuận chi tiết</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Tổng lợi nhuận (đ)</label>
                <input type="number" className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-green-600" value={distributionForm.totalProfit} onChange={e => setDistributionForm({...distributionForm, totalProfit: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Tỉ lệ giữ lại (%)</label>
                <input type="number" className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-indigo-600" value={distributionForm.retainedPercent} onChange={e => setDistributionForm({...distributionForm, retainedPercent: Number(e.target.value)})} />
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Lợi nhuận giữ lại (Tái đầu tư):</span>
                <span className="font-bold text-indigo-600">{((distributionForm.totalProfit * distributionForm.retainedPercent) / 100).toLocaleString()} đ</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Lợi nhuận phân phối:</span>
                <span className="font-bold text-green-600">{(distributionForm.totalProfit - (distributionForm.totalProfit * distributionForm.retainedPercent) / 100).toLocaleString()} đ</span>
              </div>
            </div>

            <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Dự kiến chi trả cho cổ đông</p>
              {shareholders.map(s => {
                const distributedAmount = distributionForm.totalProfit - (distributionForm.totalProfit * distributionForm.retainedPercent) / 100;
                const shareAmount = (distributedAmount * s.sharePercentage) / 100;
                return (
                  <div key={s.id} className="flex justify-between items-center p-2 bg-white border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold">{s.name.charAt(0)}</div>
                      <span className="text-xs font-medium">{s.name} ({s.sharePercentage.toFixed(1)}%)</span>
                    </div>
                    <span className="font-bold text-indigo-600 text-xs">+{shareAmount.toLocaleString()} đ</span>
                  </div>
                );
              })}
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setIsDistributing(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold">Hủy</button>
              <button onClick={handleDistribute} className="flex-[2] bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-100">Xác nhận & Chốt sổ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
