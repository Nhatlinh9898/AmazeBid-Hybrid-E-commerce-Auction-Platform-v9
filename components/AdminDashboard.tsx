import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, ShieldCheck, History, X, AlertCircle, Users, Wallet, LayoutDashboard, ShieldAlert, Loader2, Settings } from 'lucide-react';
import { api } from '../services/api';
import UserManagement from './UserManagement';
import AdminVerification from './AdminVerification';
import SecurityLogs from './SecurityLogs';
import DashboardOverview from './DashboardOverview';
import SecuritySettings from './SecuritySettings';
import SystemConfig from './SystemConfig';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  products?: any[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WALLET' | 'USERS' | 'VERIFICATION' | 'SECURITY' | 'SETTINGS' | 'SYSTEM_CONFIG'>('OVERVIEW');
  const [wallet, setWallet] = useState<any>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Bank Account State
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // 2FA State for Withdrawal
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const fetchWallet = async () => {
    try {
      const data = await api.admin.getWallet();
      setWallet(data);
      if (data.bankAccount) {
        setBankName(data.bankAccount.bankName);
        setAccountNumber(data.bankAccount.accountNumber);
        setAccountName(data.bankAccount.accountName);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWallet();
    }
  }, [isOpen]);

  const handleUpdateBank = async () => {
    if (!bankName || !accountNumber || !accountName) {
      setError('Vui lòng điền đầy đủ thông tin ngân hàng');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await api.admin.updateBank(bankName, accountNumber, accountName);
      setSuccess('Cập nhật thông tin ngân hàng thành công');
      setIsEditingBank(false);
      fetchWallet();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cập nhật ngân hàng');
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(parseFloat(withdrawAmount))) return;
    if (!wallet?.bankAccount) {
      setError('Vui lòng liên kết tài khoản ngân hàng trước khi rút tiền');
      return;
    }
    if (!show2FA) {
      setShow2FA(true);
      return;
    }
    if (!twoFactorCode || twoFactorCode.length < 6) {
      setError('Vui lòng nhập mã xác thực 2 bước hợp lệ');
      return;
    }
    setError('');
    setSuccess('');
    try {
      // In a real app, we would verify the 2FA code here before withdrawing
      await api.admin.withdraw(parseFloat(withdrawAmount));
      setSuccess(`Đã rút thành công $${withdrawAmount} về tài khoản ${wallet.bankAccount.accountNumber}`);
      setWithdrawAmount('');
      setShow2FA(false);
      setTwoFactorCode('');
      fetchWallet();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi rút tiền');
    }
  };

  if (!isOpen) return null;
  
  if (loading) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="font-bold text-gray-800">Đang tải dữ liệu quản trị...</p>
        </div>
      </div>
    );
  }

  const maxWithdrawal = wallet ? wallet.balance * wallet.withdrawalLimitRate : 0;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Expanded Modal Container */}
      <div className="relative bg-white w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col md:flex-row">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-gray-900 text-white p-6 flex flex-col shrink-0">
          <div className="flex items-center gap-2 mb-8">
            <ShieldCheck className="text-indigo-400" size={28} />
            <div>
              <h2 className="text-lg font-bold leading-tight">Admin Portal</h2>
              <p className="text-xs text-gray-400">Quản trị hệ thống</p>
            </div>
          </div>

          <nav className="space-y-2 flex-1">
            <button 
              onClick={() => setActiveTab('OVERVIEW')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'OVERVIEW' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 font-bold' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <LayoutDashboard size={20} />
              Tổng quan Hệ thống
            </button>
            <button 
              onClick={() => setActiveTab('WALLET')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'WALLET' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 font-bold' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Wallet size={20} />
              Ví Sàn & Doanh thu
            </button>
            <button 
              onClick={() => setActiveTab('USERS')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'USERS' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 font-bold' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users size={20} />
              Quản lý Người dùng
            </button>
            <button 
              onClick={() => setActiveTab('VERIFICATION')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'VERIFICATION' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 font-bold' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <ShieldCheck size={20} />
              Kiểm duyệt Tài sản
            </button>
            <button 
              onClick={() => setActiveTab('SECURITY')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'SECURITY' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 font-bold' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <ShieldAlert size={20} />
              Log Bảo mật
            </button>
            <button 
              onClick={() => setActiveTab('SETTINGS')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'SETTINGS' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 font-bold' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <ShieldCheck size={20} />
              Cài đặt Bảo mật
            </button>
            <button 
              onClick={() => setActiveTab('SYSTEM_CONFIG')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'SYSTEM_CONFIG' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 font-bold' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Settings size={20} />
              Cấu hình Hệ thống
            </button>
          </nav>

          <div className="mt-auto pt-6 border-t border-white/10">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold">A</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">Admin User</p>
                <p className="text-xs text-gray-400 truncate">admin@amazebid.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-gray-50 h-full overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shrink-0">
            <h1 className="text-xl font-bold text-gray-800">
              {activeTab === 'OVERVIEW' ? 'Bảng điều khiển Quản trị' :
               activeTab === 'WALLET' ? 'Tổng quan Ví Sàn' : 
               activeTab === 'USERS' ? 'Thống kê & Quản lý Người dùng' : 
               activeTab === 'VERIFICATION' ? 'Kiểm duyệt Tài sản' :
               activeTab === 'SECURITY' ? 'Nhật ký Bảo mật' :
               activeTab === 'SETTINGS' ? 'Cài đặt Bảo mật' :
               'Cấu hình Thuế & AI'}
            </h1>
            <button onClick={onClose} className="hover:bg-gray-100 p-2 rounded-full text-gray-500 transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'OVERVIEW' ? (
              <DashboardOverview />
            ) : activeTab === 'WALLET' ? (
              !wallet ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="text-red-500 w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Lỗi kết nối</h3>
                  <p className="text-gray-500 text-sm mb-4">Không thể tải dữ liệu ví sàn. Vui lòng kiểm tra lại quyền truy cập hoặc kết nối mạng.</p>
                  <button onClick={fetchWallet} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors">Thử lại</button>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Wallet Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200">
                    <p className="text-indigo-100 text-xs uppercase font-bold tracking-wider mb-2">Số dư khả dụng</p>
                    <p className="text-4xl font-black mb-4">${wallet.balance.toFixed(2)}</p>
                    <div className="flex items-center gap-2 text-xs bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                      <ShieldCheck size={12} /> Được bảo vệ bởi AmazeShield
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <LayoutDashboard size={20} />
                      </div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Tổng doanh thu sàn</p>
                    </div>
                    <p className="text-2xl font-black text-gray-800">${wallet.totalRevenue.toFixed(2)}</p>
                    <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                      <ArrowDownCircle size={12} className="rotate-180" /> +12.5% so với tháng trước
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                        <Wallet size={20} />
                      </div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Phí đã thu (5%)</p>
                    </div>
                    <p className="text-2xl font-black text-gray-800">${wallet.totalFeesCollected.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 mt-2">Tự động trích xuất từ các giao dịch</p>
                  </div>
                </div>

                {/* Withdrawal Section */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <ArrowDownCircle className="text-indigo-600" /> Rút tiền về tài khoản
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Bank Account Setup */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-sm text-gray-700 flex items-center gap-2">
                          <Wallet size={16} /> Thông tin tài khoản nhận tiền
                        </h4>
                        {!isEditingBank && (
                          <button 
                            onClick={() => setIsEditingBank(true)}
                            className="text-indigo-600 text-xs font-bold hover:underline"
                          >
                            {wallet?.bankAccount ? 'Chỉnh sửa' : 'Thiết lập ngay'}
                          </button>
                        )}
                      </div>

                      {isEditingBank ? (
                        <div className="space-y-3">
                          <input 
                            type="text" 
                            placeholder="Tên ngân hàng (VD: Vietcombank)" 
                            className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:border-indigo-500 outline-none"
                            value={bankName}
                            onChange={e => setBankName(e.target.value)}
                          />
                          <input 
                            type="text" 
                            placeholder="Số tài khoản" 
                            className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:border-indigo-500 outline-none"
                            value={accountNumber}
                            onChange={e => setAccountNumber(e.target.value)}
                          />
                          <input 
                            type="text" 
                            placeholder="Tên chủ tài khoản" 
                            className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:border-indigo-500 outline-none"
                            value={accountName}
                            onChange={e => setAccountName(e.target.value)}
                          />
                          <div className="flex gap-2 pt-2">
                            <button 
                              onClick={handleUpdateBank}
                              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700"
                            >
                              Lưu thông tin
                            </button>
                            <button 
                              onClick={() => setIsEditingBank(false)}
                              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-300"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : wallet?.bankAccount ? (
                        <div className="text-sm text-gray-600">
                          <p><span className="font-medium">Ngân hàng:</span> {wallet.bankAccount.bankName}</p>
                          <p><span className="font-medium">Số tài khoản:</span> {wallet.bankAccount.accountNumber}</p>
                          <p><span className="font-medium">Chủ tài khoản:</span> {wallet.bankAccount.accountName}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Chưa liên kết tài khoản ngân hàng. Vui lòng thiết lập để có thể rút tiền.</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Số tiền muốn rút (Tối đa 25% số dư)</label>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</div>
                          <input 
                            type="number"
                            className="w-full border-2 border-gray-100 p-3 pl-8 rounded-xl focus:border-indigo-500 outline-none font-bold text-lg transition-colors"
                            placeholder="0.00"
                            value={withdrawAmount}
                            onChange={e => setWithdrawAmount(e.target.value)}
                            disabled={show2FA}
                          />
                        </div>
                        {!show2FA ? (
                          <button 
                            onClick={handleWithdraw}
                            className="bg-indigo-600 text-white px-8 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                          >
                            Rút ngay
                          </button>
                        ) : (
                          <button 
                            onClick={() => setShow2FA(false)}
                            className="bg-gray-100 text-gray-600 px-8 rounded-xl font-bold hover:bg-gray-200 transition-all"
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        Hạn mức khả dụng: <span className="font-bold text-indigo-600">${maxWithdrawal.toFixed(2)}</span>
                      </p>
                    </div>

                    {show2FA && (
                      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-bold text-indigo-800 uppercase mb-2 flex items-center gap-2">
                          <ShieldAlert size={14} /> Xác thực bảo mật 2 lớp (2FA)
                        </label>
                        <p className="text-xs text-indigo-600 mb-3">Vui lòng nhập mã xác thực từ ứng dụng Authenticator để hoàn tất giao dịch rút tiền.</p>
                        <div className="flex gap-3">
                          <input 
                            type="text"
                            className="flex-1 border-2 border-indigo-200 p-3 rounded-xl focus:border-indigo-500 outline-none font-bold tracking-widest text-center text-lg"
                            placeholder="000000"
                            maxLength={6}
                            value={twoFactorCode}
                            onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                          />
                          <button 
                            onClick={handleWithdraw}
                            className="bg-indigo-600 text-white px-8 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                          >
                            Xác nhận
                          </button>
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={18} /> {error}
                      </div>
                    )}

                    {success && (
                      <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                        <ShieldCheck size={18} /> {success}
                      </div>
                    )}
                  </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <History size={18} className="text-gray-500" /> Lịch sử giao dịch gần đây
                    </h3>
                    <span className="text-xs text-gray-500">Lần rút cuối: {wallet.lastWithdrawalDate ? new Date(wallet.lastWithdrawalDate).toLocaleDateString() : 'Chưa có'}</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {[1, 2, 3, 4, 5].map((_, i) => (
                      <div key={i} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i % 2 === 0 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                            {i % 2 === 0 ? <ArrowDownCircle size={14} className="rotate-180" /> : <Wallet size={14} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">{i % 2 === 0 ? `Phí hệ thống từ đơn hàng #${8290 + i}` : `Rút tiền về tài khoản ngân hàng`}</p>
                            <p className="text-xs text-gray-400">2 giờ trước</p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${i % 2 === 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {i % 2 === 0 ? '+' : '-'}${Math.floor(Math.random() * 100)}.00
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
            ) : activeTab === 'USERS' ? (
              <UserManagement />
            ) : activeTab === 'VERIFICATION' ? (
              <AdminVerification />
            ) : activeTab === 'SECURITY' ? (
              <SecurityLogs />
            ) : activeTab === 'SETTINGS' ? (
              <SecuritySettings />
            ) : (
              <SystemConfig />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
