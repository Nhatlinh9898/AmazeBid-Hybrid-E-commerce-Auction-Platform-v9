import React, { useState, useEffect } from 'react';
import { 
  Wallet, ArrowDownCircle, ShieldCheck, AlertCircle, Loader2, CheckCircle2, 
  Building2, X, History, Sparkles, BrainCircuit, Clock, ArrowUpRight, 
  ArrowDownLeft, ChevronRight, Info
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '../services/api';
import { useAuth } from '../context/useAuth';

interface UserWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserWalletModal: React.FC<UserWalletModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'escrow' | 'ai'>('overview');

  const fetchWallet = React.useCallback(async () => {
    if (!user) return;
    try {
      const { wallet: data } = await api.wallet.get(user.id);
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
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      fetchWallet();
    }
  }, [isOpen, user, fetchWallet]);

  const handleUpdateBank = async () => {
    if (!user) return;
    if (!bankName || !accountNumber || !accountName) {
      setError('Vui lòng điền đầy đủ thông tin ngân hàng');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await api.wallet.updateBank(user.id, bankName, accountNumber, accountName);
      setSuccess('Cập nhật thông tin ngân hàng thành công');
      setIsEditingBank(false);
      fetchWallet();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cập nhật ngân hàng');
    }
  };

  const handleSubmitKyc = async () => {
    if (!user) return;
    setError('');
    setSuccess('');
    try {
      await api.wallet.submitKyc(user.id);
      setSuccess('Đã gửi yêu cầu xác minh danh tính (KYC)');
      fetchWallet();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi gửi KYC');
    }
  };

  const handleWithdraw = async () => {
    if (!user) return;
    if (!withdrawAmount || isNaN(parseFloat(withdrawAmount))) return;
    
    setError('');
    setSuccess('');
    try {
      await api.wallet.withdraw(user.id, parseFloat(withdrawAmount));
      setSuccess(`Đã tạo lệnh rút $${withdrawAmount} về tài khoản ngân hàng`);
      setWithdrawAmount('');
      fetchWallet();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi rút tiền');
    }
  };

  const handleAiAnalysis = async () => {
    if (!user || !wallet) return;
    setIsAnalyzing(true);
    setAiAnalysis('');
    try {
      const { analysis } = await api.wallet.getAiAnalysis(user.id, wallet);
      setAiAnalysis(analysis);
      setActiveTab('ai');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi phân tích AI');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="font-bold text-gray-800">Đang tải ví...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
              <Wallet className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Ví Tài Chính Thông Minh</h2>
              <p className="text-xs text-gray-500 font-medium">Quản lý số dư, lưu ký & AI Assistant</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-gray-100 bg-gray-50/50">
          {[
            { id: 'overview', label: 'Tổng quan', icon: Wallet },
            { id: 'history', label: 'Lịch sử', icon: History },
            { id: 'escrow', label: 'Lưu ký', icon: ShieldCheck },
            { id: 'ai', label: 'AI Insights', icon: BrainCircuit },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-bold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
          {activeTab === 'overview' && (
            <>
              {/* Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                    <Wallet size={120} />
                  </div>
                  <p className="text-indigo-100 text-xs uppercase font-black tracking-widest mb-2">Số dư khả dụng</p>
                  <p className="text-4xl font-black mb-4 tracking-tighter">${wallet?.balance?.toLocaleString() || '0.00'}</p>
                  <div className="flex items-center gap-2 text-[10px] bg-white/20 w-fit px-3 py-1.5 rounded-full backdrop-blur-md font-bold uppercase tracking-wider">
                    <CheckCircle2 size={12} /> Sẵn sàng rút về ngân hàng
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                        <ShieldCheck size={20} />
                      </div>
                      <p className="text-xs text-gray-400 uppercase font-black tracking-widest">Đang lưu ký (Escrow)</p>
                    </div>
                    <p className="text-3xl font-black text-gray-900 tracking-tighter">${wallet?.pendingBalance?.toLocaleString() || '0.00'}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-orange-600 font-bold bg-orange-50 px-3 py-1.5 rounded-full w-fit">
                    <Clock size={12} /> Đang chờ xác nhận từ người mua
                  </div>
                </div>
              </div>

              {/* Quick AI Action */}
              <button 
                onClick={handleAiAnalysis}
                disabled={isAnalyzing}
                className="w-full bg-white border-2 border-indigo-100 p-4 rounded-2xl flex items-center justify-between group hover:border-indigo-600 transition-all shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {isAnalyzing ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
                  </div>
                  <div className="text-left">
                    <h4 className="font-black text-gray-900 text-sm">Phân tích tài chính bằng AI</h4>
                    <p className="text-xs text-gray-500 font-medium">Nhận lời khuyên thông minh về dòng tiền của bạn</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
              </button>

              {/* KYC Status */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${wallet?.kycStatus === 'verified' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-gray-900">Xác minh danh tính (KYC)</h4>
                    <p className="text-xs text-gray-500 font-medium">Trạng thái: {wallet?.kycStatus === 'verified' ? 'Đã xác minh' : 'Chưa hoàn tất'}</p>
                  </div>
                </div>
                {wallet?.kycStatus !== 'verified' && (
                  <button 
                    onClick={handleSubmitKyc}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all"
                  >
                    Xác minh ngay
                  </button>
                )}
              </div>

              {/* Bank Account Setup */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-gray-900 flex items-center gap-2 uppercase text-xs tracking-widest">
                    <Building2 className="text-indigo-600" size={18} /> Tài khoản ngân hàng
                  </h3>
                  {!isEditingBank && (
                    <button 
                      onClick={() => setIsEditingBank(true)}
                      className="text-indigo-600 text-xs font-black hover:underline uppercase tracking-wider"
                    >
                      {wallet?.bankAccount ? 'Thay đổi' : 'Thiết lập'}
                    </button>
                  )}
                </div>

                {isEditingBank ? (
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Tên ngân hàng (VD: Vietcombank)" 
                      className="w-full border-2 border-gray-50 p-3 rounded-xl text-sm focus:border-indigo-500 outline-none font-bold"
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        placeholder="Số tài khoản" 
                        className="w-full border-2 border-gray-50 p-3 rounded-xl text-sm focus:border-indigo-500 outline-none font-bold"
                        value={accountNumber}
                        onChange={e => setAccountNumber(e.target.value)}
                      />
                      <input 
                        type="text" 
                        placeholder="Tên chủ tài khoản" 
                        className="w-full border-2 border-gray-50 p-3 rounded-xl text-sm focus:border-indigo-500 outline-none font-bold"
                        value={accountName}
                        onChange={e => setAccountName(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={handleUpdateBank}
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-black hover:bg-indigo-700 transition-all"
                      >
                        Lưu thông tin
                      </button>
                      <button 
                        onClick={() => setIsEditingBank(false)}
                        className="px-6 bg-gray-100 text-gray-600 py-3 rounded-xl text-sm font-black hover:bg-gray-200 transition-all"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : wallet?.bankAccount ? (
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-900 font-black">{wallet.bankAccount.bankName}</p>
                      <p className="text-sm text-gray-600 tracking-[0.2em] font-mono mt-1">{wallet.bankAccount.accountNumber}</p>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{wallet.bankAccount.accountName}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <Building2 className="text-gray-300" size={24} />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 font-medium italic">Chưa liên kết tài khoản ngân hàng</p>
                  </div>
                )}
              </div>

              {/* Withdrawal Section */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
                  <ArrowDownCircle className="text-indigo-600" size={18} /> Rút tiền về ngân hàng
                </h3>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">$</div>
                      <input 
                        type="number"
                        className="w-full border-2 border-gray-50 p-4 pl-8 rounded-2xl focus:border-indigo-500 outline-none font-black text-xl transition-all"
                        placeholder="0.00"
                        value={withdrawAmount}
                        onChange={e => setWithdrawAmount(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={handleWithdraw}
                      disabled={wallet?.kycStatus !== 'verified' || !wallet?.bankAccount || !withdrawAmount}
                      className="bg-indigo-600 text-white px-8 rounded-2xl font-black hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 uppercase tracking-wider text-sm"
                    >
                      Rút ngay
                    </button>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                      <CheckCircle2 size={16} /> {success}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Lịch sử giao dịch</h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase">{wallet?.transactions?.length || 0} Giao dịch</span>
              </div>
              
              {wallet?.transactions && wallet.transactions.length > 0 ? (
                <div className="space-y-3">
                  {wallet.transactions.map((tx: any) => (
                    <div key={tx.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                          tx.type === 'DEPOSIT' ? 'bg-green-50 text-green-600' : 
                          tx.type === 'WITHDRAWAL' ? 'bg-red-50 text-red-600' : 
                          'bg-indigo-50 text-indigo-600'
                        }`}>
                          {tx.type === 'DEPOSIT' ? <ArrowDownLeft size={20} /> : 
                           tx.type === 'WITHDRAWAL' ? <ArrowUpRight size={20} /> : 
                           <ShieldCheck size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900">{tx.description}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                            {new Date(tx.timestamp).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${
                          tx.type === 'DEPOSIT' ? 'text-green-600' : 
                          tx.type === 'WITHDRAWAL' ? 'text-red-600' : 
                          'text-indigo-600'
                        }`}>
                          {tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount.toLocaleString()}
                        </p>
                        <span className="text-[9px] font-black uppercase text-gray-300 tracking-widest">{tx.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                  <History className="mx-auto text-gray-200 mb-4" size={48} />
                  <p className="text-sm text-gray-400 font-bold">Chưa có giao dịch nào</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'escrow' && (
            <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex gap-3">
                <Info className="text-orange-600 shrink-0" size={20} />
                <p className="text-xs text-orange-700 font-medium leading-relaxed">
                  Tiền lưu ký (Escrow) là khoản tiền người mua đã thanh toán nhưng đang được hệ thống giữ lại để đảm bảo an toàn. Tiền sẽ được giải ngân vào số dư khả dụng sau khi đơn hàng hoàn tất.
                </p>
              </div>

              <div className="flex items-center justify-between mt-6 mb-2">
                <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Danh sách khoản lưu ký</h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase">{wallet?.escrowItems?.length || 0} Khoản</span>
              </div>

              {wallet?.escrowItems && wallet.escrowItems.length > 0 ? (
                <div className="space-y-3">
                  {wallet.escrowItems.map((item: any) => (
                    <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm group hover:border-orange-100 transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm font-black text-gray-900">{item.productName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Mã đơn: {item.orderId}</p>
                        </div>
                        <p className="text-lg font-black text-indigo-600">${item.amount.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold">
                          <Clock size={12} /> Dự kiến giải ngân: {new Date(item.expectedReleaseDate).toLocaleDateString('vi-VN')}
                        </div>
                        <span className="bg-orange-100 text-orange-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                  <ShieldCheck className="mx-auto text-gray-200 mb-4" size={48} />
                  <p className="text-sm text-gray-400 font-bold">Không có khoản lưu ký nào</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-20">
                  <BrainCircuit size={80} />
                </div>
                <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                  <Sparkles size={20} /> AI Financial Advisor
                </h3>
                <p className="text-xs text-indigo-100 font-medium leading-relaxed max-w-md">
                  Sử dụng trí tuệ nhân tạo để phân tích dòng tiền, dự báo thu nhập và tối ưu hóa kế hoạch tài chính của bạn trên AmazeBid.
                </p>
                <button 
                  onClick={handleAiAnalysis}
                  disabled={isAnalyzing}
                  className="mt-6 bg-white text-indigo-600 px-6 py-3 rounded-2xl text-sm font-black hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Đang phân tích...
                    </>
                  ) : (
                    <>
                      <BrainCircuit size={18} />
                      Bắt đầu phân tích ngay
                    </>
                  )}
                </button>
              </div>

              {aiAnalysis && (
                <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-2 mb-4 text-indigo-600">
                    <BrainCircuit size={20} />
                    <h4 className="font-black text-sm uppercase tracking-widest">Kết quả phân tích</h4>
                  </div>
                  <div className="prose prose-sm max-w-none prose-indigo prose-p:text-gray-600 prose-p:font-medium prose-headings:font-black prose-headings:text-gray-900 prose-strong:text-indigo-600">
                    <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                  </div>
                </div>
              )}

              {!aiAnalysis && !isAnalyzing && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BrainCircuit className="text-gray-300" size={40} />
                  </div>
                  <p className="text-sm text-gray-400 font-bold">Nhấn nút phía trên để nhận phân tích từ AI</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserWalletModal;
