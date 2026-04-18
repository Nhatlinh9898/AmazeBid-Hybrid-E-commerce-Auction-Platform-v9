import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  ShieldAlert, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      {trend && (
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          +{trend}%
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </motion.div>
);

const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.admin.getAdminStats();
        setStats(response.stats);
      } catch (error: any) {
        console.error('Lỗi khi lấy thống kê:', error);
        setError(error.message || 'Không thể tải dữ liệu thống kê');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">Lỗi tải dữ liệu</h3>
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tổng người dùng" 
          value={stats.totalUsers} 
          icon={Users} 
          color="bg-blue-500" 
          trend={12}
        />
        <StatCard 
          title="Sản phẩm" 
          value={stats.totalProducts} 
          icon={Package} 
          color="bg-indigo-500" 
          trend={8}
        />
        <StatCard 
          title="Đơn hàng" 
          value={stats.totalOrders} 
          icon={ShoppingCart} 
          color="bg-emerald-500" 
          trend={15}
        />
        <StatCard 
          title="Cảnh báo bảo mật" 
          value={stats.securityAlerts} 
          icon={ShieldAlert} 
          color="bg-rose-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Doanh thu & Hoạt động */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Tổng quan tài chính
            </h3>
            <span className="text-sm text-slate-500">Cập nhật: {new Date().toLocaleTimeString()}</span>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-end justify-between border-b border-slate-50 pb-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">Tổng doanh thu (Escrow)</p>
                <p className="text-4xl font-black text-slate-900">
                  {(stats.totalRevenue || 0).toLocaleString()} <span className="text-lg font-normal text-slate-400">VND</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 mb-1">Tăng trưởng tháng</p>
                <p className="text-xl font-bold text-emerald-600">+24.5%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Sản phẩm chờ duyệt</p>
                <p className="text-xl font-bold text-amber-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {stats.pendingProducts}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Người dùng hoạt động</p>
                <p className="text-xl font-bold text-indigo-600 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  {stats.activeUsers}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Log bảo mật gần đây */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-rose-600" />
            Sự kiện bảo mật mới nhất
          </h3>
          <div className="space-y-4">
            {stats.recentLogs.map((log: any) => (
              <div key={log.id} className="flex gap-3 pb-4 border-b border-slate-50 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  ['EMERGENCY_RESET', 'CHANGE_STATUS'].includes(log.action) ? 'bg-rose-500' : 'bg-blue-500'
                }`} />
                <div>
                  <p className="text-sm font-bold text-slate-800">{log.action}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'N/A'} - IP: {log.ip}
                  </p>
                </div>
              </div>
            ))}
            {stats.recentLogs.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8 italic">Chưa có sự kiện nào</p>
            )}
          </div>
          <button className="w-full mt-6 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            Xem tất cả nhật ký
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
