import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/useAuth';
import { 
  Shield, 
  Ban, 
  Plus, 
  Trash2, 
  Search,
  AlertTriangle,
  Globe,
  Activity,
  RefreshCw,
  Lock
} from 'lucide-react';

const SecuritySettings: React.FC = () => {
  const { user, toggle2FA } = useAuth();
  const [blockedIps, setBlockedIps] = useState<string[]>([]);
  const [newIp, setNewIp] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchBlockedIps = async () => {
    try {
      const response = await api.admin.getBlockedIps();
      setBlockedIps(response.ips);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách IP bị chặn:', error);
    }
  };

  useEffect(() => {
    fetchBlockedIps();
  }, []);

  const handleBlockIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp) return;
    
    setActionLoading('add');
    try {
      await api.admin.blockIp(newIp);
      setNewIp('');
      await fetchBlockedIps();
    } catch (error) {
      console.error('Lỗi khi chặn IP:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblockIp = async (ip: string) => {
    setActionLoading(ip);
    try {
      await api.admin.unblockIp(ip);
      await fetchBlockedIps();
    } catch (error) {
      console.error('Lỗi khi bỏ chặn IP:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggle2FA = async () => {
    setIs2FALoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      await toggle2FA(!user?.twoFactorEnabled);
      setSuccessMessage(`Đã ${!user?.twoFactorEnabled ? 'bật' : 'tắt'} xác thực 2 yếu tố thành công.`);
    } catch (error: any) {
      setErrorMessage(error.message || 'Không thể thay đổi cài đặt 2FA');
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleResetAllSessions = async () => {
    if (!window.confirm('CẢNH BÁO: Hành động này sẽ đăng xuất TẤT CẢ người dùng khỏi hệ thống ngay lập tức. Bạn có chắc chắn muốn tiếp tục?')) {
      return;
    }

    setIsResetLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      await api.admin.resetAllSessions();
      setSuccessMessage('Đã reset tất cả các phiên đăng nhập thành công.');
    } catch (error: any) {
      setErrorMessage(error.message || 'Không thể reset các phiên đăng nhập');
    } finally {
      setIsResetLoading(false);
    }
  };

  const filteredIps = blockedIps.filter(ip => 
    ip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header & Info */}
      <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Cấu hình Bảo mật</h2>
            <p className="text-indigo-100 opacity-80">Quản lý các quy tắc truy cập và bảo vệ hệ thống</p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 text-sm font-bold">
          <ShieldCheck size={18} /> {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm font-bold">
          <AlertTriangle size={18} /> {errorMessage}
        </div>
      )}

      {/* IP Blocking Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Ban className="w-5 h-5 text-rose-600" />
            Quản lý Chặn IP
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Các địa chỉ IP trong danh sách này sẽ bị từ chối truy cập vào tất cả các API của hệ thống.
          </p>
        </div>

        <div className="p-6">
          {/* Add IP Form */}
          <form onSubmit={handleBlockIp} className="flex gap-3 mb-8">
            <div className="relative flex-1">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="Nhập địa chỉ IP (VD: 192.168.1.1)"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <button 
              type="submit"
              disabled={actionLoading === 'add' || !newIp}
              className="px-6 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-rose-200"
            >
              {actionLoading === 'add' ? <Shield className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Chặn IP
            </button>
          </form>

          {/* Search & List */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm IP..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
              />
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-6 py-4">Địa chỉ IP</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIps.map((ip) => (
                    <tr key={ip} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-slate-700">{ip}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          Bị chặn
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleUnblockIp(ip)}
                          disabled={actionLoading === ip}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Bỏ chặn"
                        >
                          {actionLoading === ip ? <Shield className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredIps.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">
                        {searchTerm ? 'Không tìm thấy IP nào khớp' : 'Chưa có IP nào bị chặn'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Security Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 2FA Toggle */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              Xác thực 2 yếu tố (2FA)
            </h4>
            {is2FALoading && <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />}
          </div>
          <p className="text-sm text-slate-500 mb-6">
            Tăng cường bảo mật cho tài khoản Admin của bạn bằng cách yêu cầu mã xác thực khi đăng nhập.
          </p>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái hiện tại</p>
              <p className={`text-sm font-bold ${user?.twoFactorEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                {user?.twoFactorEnabled ? 'Đang hoạt động' : 'Chưa kích hoạt'}
              </p>
            </div>
            <button 
              onClick={handleToggle2FA}
              disabled={is2FALoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                user?.twoFactorEnabled ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                user?.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Reset Sessions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-600" />
              Reset Toàn bộ Phiên
            </h4>
            {isResetLoading && <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />}
          </div>
          <p className="text-sm text-slate-500 mb-6">
            Đăng xuất tất cả người dùng khỏi hệ thống ngay lập tức. Sử dụng trong trường hợp khẩn cấp.
          </p>
          <button 
            onClick={handleResetAllSessions}
            disabled={isResetLoading}
            className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isResetLoading ? 'animate-spin' : ''}`} />
            Reset Tất cả Sessions
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
