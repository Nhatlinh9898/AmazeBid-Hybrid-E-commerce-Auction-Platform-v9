
import React from 'react';
import { ShieldAlert, ShieldCheck, Activity, Zap, RefreshCw, AlertTriangle, Terminal, Cpu } from 'lucide-react';
import { motion } from 'motion/react';
import { sentinel } from '../services/QuantumSentinel';

const SentinelDashboard: React.FC = () => {
  const [status, setStatus] = React.useState(sentinel.getStatus());
  const [blacklist, setBlacklist] = React.useState(sentinel.getBlacklist());
  const [isHealing, setIsHealing] = React.useState(false);

  const refreshData = () => {
    setStatus(sentinel.getStatus());
    setBlacklist(sentinel.getBlacklist());
  };

  React.useEffect(() => {
    const timer = setInterval(refreshData, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleUnblock = (id: string) => {
    sentinel.unblockNode(id);
    refreshData();
  };

  const runSelfHeal = () => {
    setIsHealing(true);
    // Giả lập quét và vá lỗi
    setTimeout(() => {
      setIsHealing(false);
      alert('Hệ thống đã hoàn tất tự quét và cấu trúc lại các Node dữ liệu bị hỏng.');
    }, 2000);
  };

  return (
    <div className="p-6 bg-slate-950 text-slate-100 rounded-[32px] overflow-hidden border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Quantum Sentinel Firewall</h2>
          </div>
          <p className="text-2xl font-black text-white">Trạng Thái Hệ Thống Bảo Mật</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={runSelfHeal}
            disabled={isHealing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              isHealing ? 'bg-indigo-600 animate-pulse' : 'bg-indigo-500 hover:bg-indigo-600'
            }`}
          >
            <RefreshCw size={14} className={isHealing ? 'animate-spin' : ''} />
            {isHealing ? 'Đang Tự Vá Lỗi...' : 'Tự Vá Hệ Thống'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Ngăn Chặn Tấn Công', value: status.activeThreats, icon: <ShieldAlert className="text-rose-500" />, color: 'bg-rose-500/10' },
          { label: 'Tổng Lượt Tấn Công', value: status.historyCount, icon: <Activity className="text-amber-500" />, color: 'bg-amber-500/10' },
          { label: 'Node Đang Bảo Vệ', value: status.protectedNodes, icon: <ShieldCheck className="text-emerald-500" />, color: 'bg-emerald-500/10' },
          { label: 'Hiệu Năng Firewall', value: '99.9%', icon: <Zap className="text-blue-500" />, color: 'bg-blue-500/10' },
        ].map((stat, idx) => (
          <div key={idx} className={`${stat.color} p-4 rounded-2xl border border-white/5`}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-black/20 rounded-lg">{stat.icon}</div>
              <span className="text-2xl font-black text-white">{stat.value}</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blacklist Panel */}
        <div className="bg-black/20 rounded-3xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Terminal size={14} className="text-rose-400" /> Danh sách Node bị cô lập
            </h3>
            <span className="text-[10px] font-bold bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">
              {blacklist.length} Node
            </span>
          </div>
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
            {blacklist.length === 0 ? (
              <div className="py-12 text-center">
                <ShieldCheck size={32} className="mx-auto mb-2 text-slate-700" />
                <p className="text-xs font-bold text-slate-500 italic">Chưa phát hiện mối đe dọa nào cần cô lập.</p>
              </div>
            ) : (
              blacklist.map(id => (
                <div key={id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-rose-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-rose-500 rounded-full" />
                    <code className="text-[10px] text-slate-400 font-mono">{id.substring(0, 24)}...</code>
                  </div>
                  <button 
                    onClick={() => handleUnblock(id)}
                    className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security Logs / AI Insights */}
        <div className="bg-black/20 rounded-3xl border border-slate-800 p-6">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4">
            <Cpu size={14} className="text-blue-400" /> Phân tích AI & Nhật ký Sentinel
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <p className="text-[11px] font-bold text-blue-300 leading-relaxed mb-2">
                "Hệ thống AmazeBid Shield đang giám sát các Node trong Mesh. 
                Đã kích hoạt lớp bảo vệ tầng PHY để ngăn chặn Local Proxy Attacks."
              </p>
              <div className="flex items-center gap-2">
                <AlertTriangle size={12} className="text-amber-500" />
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-500">Khuyến nghị: Tự quét định kỳ 30 phút.</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] flex items-center justify-between text-slate-500 font-bold">
                <span>Trình quét lượng tử (Quantum Scanner)</span>
                <span>Tất cả Node khỏe mạnh</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-500"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentinelDashboard;
