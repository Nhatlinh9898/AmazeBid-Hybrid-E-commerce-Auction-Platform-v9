import React, { useState, useEffect } from 'react';
import { Search, DollarSign, TrendingUp, Ban, CheckCircle, Download, RefreshCw, User as UserIcon } from 'lucide-react';
import { api } from '../services/api';

interface UserStat {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  salesRevenue?: number;
  affiliateRevenue?: number;
  totalProfit?: number;
  status: 'ACTIVE' | 'BANNED';
  createdAt: string;
  role: 'USER' | 'SELLER' | 'ADMIN';
  aiSubscription?: {
    tier: string;
    expiryDate: string;
  };
  aiUsage?: {
    totalRequests: number;
    estimatedCost: number;
  };
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'SELLER' | 'USER' | 'ADMIN'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await api.admin.getUsers();
      // Map backend fields to frontend interface if needed
      const mappedUsers = data.users.map((u: any) => ({
        ...u,
        fullName: u.fullName || u.name || 'N/A',
        salesRevenue: u.salesRevenue || 0,
        affiliateRevenue: u.affiliateRevenue || 0,
        totalProfit: u.totalProfit || 0,
        status: u.status || 'ACTIVE',
        role: u.role || 'USER'
      }));
      setUsers(mappedUsers);
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
    setActionLoading(userId);
    try {
      await api.admin.updateUserStatus(userId, newStatus);
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus as any } : u));
    } catch {
      alert('Lỗi khi cập nhật trạng thái');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      await api.admin.updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
    } catch {
      alert('Lỗi khi cập nhật vai trò');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetToken = async (userId: string) => {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất người dùng này khỏi tất cả thiết bị?')) return;
    setActionLoading(userId);
    try {
      await api.admin.resetUserToken(userId);
      alert('Đã vô hiệu hóa tất cả phiên đăng nhập của người dùng');
    } catch {
      alert('Lỗi khi reset token');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportReport = () => {
    const headers = ['ID', 'Tên', 'Email', 'Doanh thu bán hàng', 'Doanh thu Affiliate', 'Lợi nhuận', 'Trạng thái', 'Ngày tham gia', 'Vai trò'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(user => [
        user.id,
        `"${user.fullName}"`,
        user.email,
        user.salesRevenue,
        user.affiliateRevenue,
        user.totalProfit,
        user.status,
        user.createdAt,
        user.role
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bao_cao_nguoi_dung_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'ALL' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const totalSalesRevenue = users.reduce((acc, user) => acc + (user.salesRevenue || 0), 0);
  const totalAffiliateRevenue = users.reduce((acc, user) => acc + (user.affiliateRevenue || 0), 0);
  const totalProfit = users.reduce((acc, user) => acc + (user.totalProfit || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <DollarSign size={20} />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase">Tổng doanh thu bán hàng</span>
          </div>
          <p className="text-2xl font-black text-gray-800">${(totalSalesRevenue || 0).toLocaleString()}</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase">Tổng doanh thu Affiliate</span>
          </div>
          <p className="text-2xl font-black text-gray-800">${(totalAffiliateRevenue || 0).toLocaleString()}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              <DollarSign size={20} />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase">Tổng lợi nhuận người dùng</span>
          </div>
          <p className="text-2xl font-black text-gray-800">${(totalProfit || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm người dùng..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="SELLER">Người bán</option>
            <option value="USER">Người mua</option>
          </select>
          
          <button 
            onClick={handleExportReport}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={16} /> <span className="hidden sm:inline">Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="flex-1 overflow-auto border border-gray-200 rounded-xl bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Người dùng</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Gói AI</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Sử dụng AI</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Doanh thu</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Trạng thái</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">Không tìm thấy người dùng nào</td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{user.fullName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <div className="flex gap-1 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            user.role === 'ADMIN' ? 'bg-red-50 text-red-600 border-red-100' :
                            user.role === 'SELLER' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                            'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {user.aiSubscription?.tier === 'PRO' ? (
                       <div className="flex flex-col items-center">
                         <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black border border-indigo-200 shadow-sm">AI PRO</span>
                         <span className="text-[9px] text-gray-400 mt-0.5 italic">Hết hạn: {new Date(user.aiSubscription.expiryDate).toLocaleDateString()}</span>
                       </div>
                    ) : (
                       <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] border border-gray-200">STANDARD</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex flex-col items-end">
                      <p className="text-xs font-bold text-gray-700">{user.aiUsage?.totalRequests || 0} reqs</p>
                      <p className="text-[9px] text-gray-400">Tốn phí: {user.aiUsage?.estimatedCost?.toLocaleString() || 0}đ</p>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <p className="text-sm font-bold text-gray-900">${(user.salesRevenue || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">Lợi nhuận: ${(user.totalProfit || 0).toLocaleString()}</p>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${
                      user.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {user.status === 'ACTIVE' ? <CheckCircle size={10} /> : <Ban size={10} />}
                      {user.status === 'ACTIVE' ? 'Hoạt động' : 'Đã chặn'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {actionLoading === user.id ? (
                        <RefreshCw size={16} className="animate-spin text-gray-400" />
                      ) : (
                        <>
                          <button 
                            onClick={() => handleResetToken(user.id)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Reset Token (Đăng xuất từ xa)"
                          >
                            <RefreshCw size={16} />
                          </button>
                          
                          <select 
                            className="text-[10px] border border-gray-200 rounded p-1 outline-none"
                            value={user.role}
                            onChange={(e) => handleChangeRole(user.id, e.target.value)}
                          >
                            <option value="USER">USER</option>
                            <option value="SELLER">SELLER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>

                          <button 
                            onClick={() => handleToggleStatus(user.id, user.status)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.status === 'ACTIVE' 
                                ? 'text-red-600 hover:bg-red-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={user.status === 'ACTIVE' ? 'Chặn người dùng' : 'Bỏ chặn'}
                          >
                            {user.status === 'ACTIVE' ? <Ban size={16} /> : <CheckCircle size={16} />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
