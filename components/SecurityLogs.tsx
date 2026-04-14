import React, { useState, useEffect } from 'react';
import { Clock, User, Activity, Search } from 'lucide-react';
import { api } from '../services/api';

interface SecurityLog {
  id: string;
  userId: string | null;
  action: string;
  details: any;
  timestamp: string;
  ip: string;
}

const SecurityLogs: React.FC = () => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const fetchLogs = async () => {
    try {
      const data = await api.admin.getSecurityLogs();
      setLogs(data.logs);
    } catch (err) {
      console.error('Lỗi khi tải log bảo mật:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = (log.userId || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'REGISTER': return 'text-green-600 bg-green-50 border-green-100';
      case 'EMERGENCY_RESET': return 'text-red-600 bg-red-50 border-red-100';
      case 'ADMIN_RESET_TOKEN': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'CHANGE_ROLE': return 'text-purple-600 bg-purple-50 border-purple-100';
      case 'CHANGE_STATUS': return 'text-pink-600 bg-pink-50 border-pink-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm log..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="ALL">Tất cả hành động</option>
            <option value="LOGIN">Đăng nhập</option>
            <option value="REGISTER">Đăng ký</option>
            <option value="EMERGENCY_RESET">Khôi phục khẩn cấp</option>
            <option value="ADMIN_RESET_TOKEN">Admin Reset Token</option>
            <option value="CHANGE_ROLE">Thay đổi vai trò</option>
            <option value="CHANGE_STATUS">Thay đổi trạng thái</option>
          </select>
          
          <button 
            onClick={fetchLogs}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title="Tải lại"
          >
            <Activity size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thời gian</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Hành động</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Người dùng</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Chi tiết</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Không có dữ liệu log bảo mật</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock size={14} />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <User size={14} className="text-gray-400" />
                        {log.userId || 'Hệ thống'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-gray-500 max-w-xs truncate" title={JSON.stringify(log.details)}>
                        {Object.entries(log.details).map(([key, value]) => `${key}: ${value}`).join(', ')}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-mono text-gray-400">{log.ip}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SecurityLogs;
