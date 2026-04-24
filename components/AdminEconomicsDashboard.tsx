import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Zap, 
  Activity, 
  PieChart as PieIcon, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  Info,
  Globe,
  Cpu,
  ShieldCheck
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion } from 'motion/react';

const AdminEconomicsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '1y'>('7d');

  // Mock data for the dashboard
  const revenueData = [
    { name: 'Mon', total: 4200, subscription: 2100, commission: 1500, ai: 600 },
    { name: 'Tue', total: 3800, subscription: 2000, commission: 1200, ai: 600 },
    { name: 'Wed', total: 5100, subscription: 2200, commission: 2000, ai: 900 },
    { name: 'Thu', total: 4800, subscription: 2100, commission: 1800, ai: 900 },
    { name: 'Fri', total: 6200, subscription: 2500, commission: 2500, ai: 1200 },
    { name: 'Sat', total: 7500, subscription: 2800, commission: 3200, ai: 1500 },
    { name: 'Sun', total: 7100, subscription: 2700, commission: 3000, ai: 1400 },
  ];

  const aiPerformance = [
    { name: 'Edge AI (Local)', value: 65, color: '#6366f1' },
    { name: 'Cloud AI (Gemini)', value: 25, color: '#a855f7' },
    { name: 'P2P Workers', value: 10, color: '#f59e0b' },
  ];

  const bandwidthSavings = [
    { day: '01', direct: 100, p2p: 450 },
    { day: '02', direct: 120, p2p: 480 },
    { day: '03', direct: 110, p2p: 520 },
    { day: '04', direct: 130, p2p: 600 },
    { day: '05', direct: 150, p2p: 750 },
    { day: '06', direct: 180, p2p: 900 },
    { day: '07', direct: 170, p2p: 850 },
  ];

  const stats = [
    { 
      label: 'Tổng Doanh thu', 
      value: '$38,700', 
      change: '+14.2%', 
      isPositive: true, 
      icon: <DollarSign size={20} />,
      desc: 'Doanh thu từ phí sàn & AI'
    },
    { 
      label: 'Phí AI thu được', 
      value: '$7,200', 
      change: '+21.5%', 
      isPositive: true, 
      icon: <Zap size={20} />,
      desc: 'Thanh toán theo lượt dùng (Pay-per-use)'
    },
    { 
      label: 'Tiết kiệm Băng thông', 
      value: '4.2 TB', 
      change: '+8.1%', 
      isPositive: true, 
      icon: <Globe size={20} />,
      desc: 'Nhờ cơ chế P2P Mesh'
    },
    { 
      label: 'Chi phí Hạ tầng AI', 
      value: '$1,450', 
      change: '-12.3%', 
      isPositive: true, 
      icon: <Cpu size={20} />,
      desc: 'Tối ưu hóa nhờ Edge AI'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Kinh tế & Hiệu suất AI</h2>
          <p className="text-gray-500 text-sm">Giám sát dòng tiền, doanh thu thầu và chi phí vận hành AI</p>
        </div>
        <div className="flex bg-gray-200 p-1 rounded-xl">
          {['24h', '7d', '30d', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === range 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              {stat.icon}
            </div>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-xl ${stat.isPositive ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'}`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-xs font-black ${stat.isPositive ? 'text-green-600' : 'text-red-500'}`}>
                {stat.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>
            <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
            <p className="text-gray-400 text-[10px] mt-2">{stat.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-gray-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" />
              Xu hướng Doanh thu
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">Sub</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">AI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">Fee</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
                <Area type="monotone" dataKey="subscription" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSub)" />
                <Area type="monotone" dataKey="ai" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorAI)" />
                <Area type="monotone" dataKey="commission" stroke="#f59e0b" strokeWidth={3} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Distribution Pie */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col">
          <h3 className="font-black text-gray-900 flex items-center gap-2 mb-6">
            <PieIcon size={18} className="text-purple-600" />
            Phân bổ Tài nguyên AI
          </h3>
          <div className="flex-1 h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aiPerformance}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {aiPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tối ưu</p>
              <p className="text-xl font-black text-indigo-600">75%</p>
            </div>
          </div>
          <div className="space-y-3 mt-4">
            {aiPerformance.map((item, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-bold text-gray-700">{item.name}</span>
                </div>
                <span className="text-xs font-black text-gray-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bandwidth & Economic Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bandwidth Savings */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-gray-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-orange-600" />
              Lưu lượng P2P Mesh (GB)
            </h3>
            <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
              Tiết kiệm chi phí: $1,240
            </span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bandwidthSavings}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <Tooltip 
                   cursor={{ fill: '#f8fafc' }}
                   contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 'bold' }}
                />
                <Bar dataKey="p2p" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="direct" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Economic Health Indicator */}
        <div className="bg-[#131921] p-8 rounded-[2.5rem] text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Activity size={150} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-2xl flex items-center justify-center">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h4 className="text-xl font-black">Sức khỏe Kinh tế</h4>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">AmazeBid Economic Index</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed max-w-sm mb-8">
              Mô hình P2P đã giúp giảm <span className="text-green-400 font-bold">40% chi phí server</span> truyền thống. 
              Dòng tiền từ các gói AI trả phí của người dùng đóng góp <span className="text-indigo-400 font-bold">28% tổng doanh thu</span>.
              Hệ thống đang vận hành với biên lợi nhuận ròng đạt 62%.
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-gray-500 uppercase">Tự chủ Tài chính</span>
                <span className="text-xs font-black text-green-400">92/100</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: '92%' }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                   className="h-full bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_10px_rgba(34,197,94,0.4)]" 
                />
              </div>
            </div>

            <button className="mt-8 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-indigo-900/40">
              <Info size={18} />
              Xuất Báo cáo Tài chính
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEconomicsDashboard;
