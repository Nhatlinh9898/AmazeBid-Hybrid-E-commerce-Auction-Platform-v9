
import React, { useState, useEffect } from 'react';
import { User, CreditCard, ShieldCheck, MapPin, Eye, EyeOff, Edit2, Plus, LogOut, Lock, X, Share2, Copy, Check, Facebook, Instagram, Chrome, Users, Link, Save, Trash2, AlertTriangle, Phone, FileText, ShoppingBag, Gavel, Calendar, Video, Sparkles, Camera, RefreshCw, Zap, TrendingUp, Info, Clock, Landmark, Wallet, CreditCard as CreditCardIcon, Loader2, Monitor } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { PaymentMethod, Product, ContentPost, ItemType, AISubscriptionTier } from '../types';
import KYCModal from './KYCModal';
import UserWalletModal from './UserWalletModal';
import SystemRequirements from './SystemRequirements';
import ServiceTermsModal from './ServiceTermsModal';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  myProducts?: Product[];
  myPosts?: ContentPost[];
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose, myProducts = [], myPosts = [] }) => {
  const { user, logout, updateProfile, resetToken, setup2FA, confirm2FA, toggle2FA, linkSocialAccount } = useAuth();
  const [activeTab, setActiveTab] = useState<'INFO' | 'PAYMENT' | 'SECURITY' | 'SOCIAL' | 'POSTS' | 'LOYALTY' | 'AI_BILLING' | 'SYSTEM_REQ' | 'GUIDE'>('INFO');
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showCheckoutUI, setShowCheckoutUI] = useState<AISubscriptionTier | null>(null);
  const [isLinkingFriend, setIsLinkingFriend] = useState(false);
  const [socialLoading, setSocialLoading] = useState<Record<string, boolean>>({});

  // Generate referral code if missing
  useEffect(() => {
    if (user && !user.referralCode) {
      const generatedCode = `AMZ-${user.id.slice(0, 4).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
      updateProfile({ referralCode: generatedCode });
    }
  }, [user, updateProfile]);

  const handleSubscribeAIPro = async () => {
    if (!user) return;
    setIsSubscribing(true);
    try {
      const response = await fetch('/api/ai/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId: user.id, tier: AISubscriptionTier.PRO })
      });
      const data = await response.json();
      if (data.status === 'success') {
          // Success!
          alert('Cảm ơn bạn! Đăng ký gói AI Pro thành công.');
          window.location.reload(); // Quick refresh to update state
      } else {
          throw new Error(data.data?.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      if (error.message.includes('Số dư ví không đủ')) {
          if (confirm('Số dư ví AmazeBid không đủ. Bạn có muốn nạp thêm tiền ngay bây giờ?')) {
              setIsWalletModalOpen(true);
          }
      } else {
          alert(error.message);
      }
    } finally {
      setIsSubscribing(false);
      setShowCheckoutUI(null);
    }
  };

  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<{ secret: string, qrCode: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [hasReadServiceTerms, setHasReadServiceTerms] = useState(false);
  const [isServiceTermsModalOpen, setIsServiceTermsModalOpen] = useState(false);

  useEffect(() => {
    // Fetch tasks and vouchers
    fetch('/api/tasks').then(res => res.json()).then(data => setTasks(data.tasks));
    fetch('/api/vouchers').then(res => res.json()).then(data => setVouchers(data.vouchers));

    // Check for tab hint (e.g. from SellModal or BidModal redirection)
    if (isOpen) {
      const hint = localStorage.getItem('user-profile-tab-hint');
      if (hint === 'GUIDE') {
        setActiveTab('GUIDE');
        localStorage.removeItem('user-profile-tab-hint');
      }
    }
  }, [isOpen]);

  const completeTask = async (taskId: string) => {
    const res = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
    });
    if (res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? {...t, isCompleted: true} : t));
    }
  };

  const redeemVoucher = async (voucherId: string) => {
    const res = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucherId })
    });
    if (res.ok) {
        alert('Đổi voucher thành công!');
    } else {
        alert('Không đủ điểm!');
    }
  };

  const handleStart2FASetup = async () => {
    const data = await setup2FA();
    if (data) {
      setTwoFactorSetupData(data);
      setIsSettingUp2FA(true);
    }
  };

  const handleConfirm2FA = async () => {
    if (!twoFactorSetupData) return;
    const success = await confirm2FA(twoFactorCode, twoFactorSetupData.secret);
    if (success) {
      setIsSettingUp2FA(false);
      setTwoFactorSetupData(null);
      setTwoFactorCode('');
      setTwoFactorError('');
    } else {
      setTwoFactorError('Mã xác thực không đúng. Vui lòng thử lại.');
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    if (enabled && !user.twoFactorEnabled) {
      handleStart2FASetup();
    } else {
      await toggle2FA(enabled);
    }
  };
  // 1. Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '', address: '' });

  // 2. Payment CRUD State
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardForm, setCardForm] = useState({ provider: 'Visa', number: '', holder: '' });

  // Init form data when user loads
  useEffect(() => {
    if (user && !isEditingProfile) {
        const timeout = setTimeout(() => {
            setProfileForm({
                fullName: user.fullName || '',
                phone: user.phone || '',
                address: user.address || ''
            });
        }, 0);
        return () => clearTimeout(timeout);
    }
  }, [user, isEditingProfile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateProfile({ avatar: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen || !user) return null;

  const toggleVisibility = (id: string) => {
    setShowSensitive(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskedNumber = (num: string) => {
    if (!num) return '****';
    return `**** **** **** ${num.slice(-4)}`;
  };

  // --- Profile CRUD Functions ---
  const handleSaveProfile = () => {
      updateProfile({
          fullName: profileForm.fullName,
          phone: profileForm.phone,
          address: profileForm.address
      });
      setIsEditingProfile(false);
  };

  const handleCancelEdit = () => {
      setProfileForm({
          fullName: user.fullName,
          phone: user.phone || '',
          address: user.address || ''
      });
      setIsEditingProfile(false);
  };

  // --- Payment CRUD Functions ---
  const handleSaveNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardForm.number.length < 4 || !cardForm.holder) return;

    const newPayment: PaymentMethod = {
        id: `pm_${Date.now()}`,
        type: 'CARD',
        providerName: cardForm.provider,
        accountNumber: cardForm.number,
        holderName: cardForm.holder.toUpperCase(),
        isDefault: (user.paymentMethods || []).length === 0
    };
    
    updateProfile({
        paymentMethods: [...(user.paymentMethods || []), newPayment]
    });
    
    // Reset & Close
    setCardForm({ provider: 'Visa', number: '', holder: '' });
    setIsAddingCard(false);
  };

  const handleDeletePayment = (id: string) => {
      if (confirm('Bạn có chắc chắn muốn xóa phương thức thanh toán này?')) {
          const updatedMethods = (user.paymentMethods || []).filter(pm => pm.id !== id);
          updateProfile({ paymentMethods: updatedMethods });
      }
  };

  // --- Social Logic ---
  const handleLinkFriendCode = async () => {
    if (!friendCodeInput) return;
    setIsLinkingFriend(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert(`Đã liên kết mã giới thiệu: ${friendCodeInput}`);
    setFriendCodeInput('');
    setIsLinkingFriend(false);
    
    // Simulate updating friend count
    updateProfile({ friendCount: (user.friendCount || 0) + 1 });
  };

  const toggleSocialConnection = async (provider: string) => {
      const currentAccounts = user.socialAccounts || [];
      const account = currentAccounts.find(a => a.provider === provider);
      
      if (account && account.connected) {
          // Disconnect logic
          if (confirm(`Bạn có chắc chắn muốn hủy liên kết tài khoản ${provider}?`)) {
              const updated = currentAccounts.map(a => 
                  a.provider === provider ? { ...a, connected: false } : a
              );
              updateProfile({ socialAccounts: updated });
          }
      } else {
          // Real Connect logic
          setSocialLoading(prev => ({ ...prev, [provider]: true }));
          try {
            await linkSocialAccount(provider as any);
          } finally {
            setSocialLoading(prev => ({ ...prev, [provider]: false }));
          }
      }
  };

  const handleCopyCode = () => {
      if (user.referralCode) {
          navigator.clipboard.writeText(user.referralCode);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  const handleDeleteAccount = () => {
      const confirmation = prompt('Hành động này không thể hoàn tác. Nhập "DELETE" để xác nhận xóa tài khoản:');
      if (confirmation === 'DELETE') {
          alert('Tài khoản đã được xóa. Tạm biệt!');
          logout();
          onClose();
      }
  };

  const handleResetSessions = async () => {
      if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi tất cả các thiết bị khác? Phiên đăng nhập hiện tại cũng sẽ kết thúc.')) {
          await resetToken();
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-7xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95">
        
        {/* Global Close Button */}
        <button 
            onClick={onClose} 
            className="absolute top-2 right-2 z-[210] bg-white hover:bg-red-50 hover:text-red-600 p-2 rounded-full shadow-md border border-gray-100 transition-all group"
            title="Đóng"
        >
            <X size={20} className="text-gray-800 group-hover:text-red-600" />
        </button>

        {/* Sidebar */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-6 flex flex-col">
            <div className="text-center mb-6">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
                <div 
                  className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-[#febd69] mb-3 group relative cursor-pointer"
                  onClick={handleAvatarClick}
                >
                    <img src={user.avatar} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                        <Camera className="text-white mb-1" size={20}/>
                        <span className="text-[8px] text-white font-bold uppercase">Thay đổi</span>
                    </div>
                </div>
                <h3 className="font-bold text-lg">{user.fullName}</h3>
                <p className="text-xs text-gray-500">{user.email}</p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">
                    <ShieldCheck size={10} /> Verified
                </div>
            </div>

            <nav className="space-y-2 flex-1">
                <button 
                    onClick={() => setActiveTab('INFO')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-3 ${activeTab === 'INFO' ? 'bg-[#131921] text-white' : 'hover:bg-gray-200 text-gray-600'}`}
                >
                    <User size={16} /> Thông tin cá nhân
                </button>
                <button 
                    onClick={() => setActiveTab('POSTS')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-3 ${activeTab === 'POSTS' ? 'bg-[#131921] text-white' : 'hover:bg-gray-200 text-gray-600'}`}
                >
                    <FileText size={16} /> Bài đăng & Sản phẩm
                </button>
                <button 
                    onClick={() => setActiveTab('PAYMENT')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-3 ${activeTab === 'PAYMENT' ? 'bg-[#131921] text-white' : 'hover:bg-gray-200 text-gray-600'}`}
                >
                    <CreditCard size={16} /> Tài khoản thanh toán
                </button>
                <button 
                    onClick={() => setActiveTab('SOCIAL')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-3 ${activeTab === 'SOCIAL' ? 'bg-[#131921] text-white' : 'hover:bg-gray-200 text-gray-600'}`}
                >
                    <Share2 size={16} /> Mạng xã hội & Bạn bè
                </button>
                <button 
                    onClick={() => setActiveTab('SECURITY')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-3 ${activeTab === 'SECURITY' ? 'bg-[#131921] text-white' : 'hover:bg-gray-200 text-gray-600'}`}
                >
                    <Lock size={16} /> Bảo mật & Riêng tư
                </button>
                <button 
                    onClick={() => setActiveTab('AI_BILLING')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-3 ${activeTab === 'AI_BILLING' ? 'bg-[#131921] text-white' : 'hover:bg-gray-200 text-gray-600'}`}
                >
                    <Zap size={16} /> AI & Gói Dịch Vụ
                </button>
                <button 
                    onClick={() => setActiveTab('LOYALTY')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-3 ${activeTab === 'LOYALTY' ? 'bg-[#131921] text-white' : 'hover:bg-gray-200 text-gray-600'}`}
                >
                    <Sparkles size={16} /> Loyalty & Phần thưởng
                </button>

                {user.role === 'ADMIN' && (
                  <button 
                      onClick={() => setActiveTab('SYSTEM_REQ')}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-3 ${activeTab === 'SYSTEM_REQ' ? 'bg-[#131921] text-white' : 'hover:bg-gray-200 text-gray-600'}`}
                  >
                      <Monitor size={16} /> Cấu hình & Vận hành
                  </button>
                )}
                <button 
                    onClick={() => setActiveTab('GUIDE')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-3 ${activeTab === 'GUIDE' ? 'bg-[#131921] text-white' : 'hover:bg-gray-200 text-gray-600'}`}
                >
                    <FileText size={16} /> Hướng dẫn & Cam kết
                </button>
            </nav>

            <button 
                onClick={() => { logout(); onClose(); }}
                className="mt-auto flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            >
                <LogOut size={16} /> Đăng xuất
            </button>

            <ServiceTermsModal 
              isOpen={isServiceTermsModalOpen} 
              onClose={() => setIsServiceTermsModalOpen(false)} 
              onConfirmRead={() => setHasReadServiceTerms(true)}
            />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-12 relative custom-scrollbar">
            
            {/* TAB: GUIDE & TERMS */}
            {activeTab === 'GUIDE' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 pb-12">
                    <div className="flex justify-between items-center mb-6 pr-12">
                        <h2 className="text-2xl font-bold">Hướng Dẫn Quyền Hạn & Cam Kết Hoạt Động</h2>
                        {user.isTermsConfirmed ? (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                <Check size={14} /> Đã xác nhận điều khoản
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                                <AlertTriangle size={14} /> Chưa xác nhận
                            </div>
                        )}
                    </div>

                    {/* Section 1: Rights & Permissions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-600 text-white rounded-lg">
                                    <Users size={20} />
                                </div>
                                <h3 className="font-bold text-gray-900">Quyền Hạn Nhân Viên (Staff)</h3>
                            </div>
                            <div className="space-y-3 text-sm text-gray-700">
                                <p className="font-medium">Khi làm việc tại các chi nhánh/cửa hàng:</p>
                                <ul className="list-disc pl-5 space-y-1 opacity-80">
                                    <li>Chỉ có quyền thực hiện các tác vụ được cấp phép (Bán hàng, Kho, Quản lý...).</li>
                                    <li>Dữ liệu khách hàng và doanh thu tại chi nhánh thuộc sở hữu của chủ cửa hàng.</li>
                                    <li>Mọi hoạt động được ghi nhật ký bảo mật nghiêm ngặt.</li>
                                </ul>
                                <div className="mt-4 p-3 bg-white rounded-xl border border-blue-200 text-xs text-blue-800 italic">
                                    "Nhân viên là đại diện của chi nhánh trong giờ làm việc và phải tuân thủ nội quy cửa hàng."
                                </div>
                            </div>
                        </div>

                        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-600 text-white rounded-lg">
                                    <ShoppingBag size={20} />
                                </div>
                                <h3 className="font-bold text-gray-900">Quyền Lợi Cá Nhân Độc Lập</h3>
                            </div>
                            <div className="space-y-3 text-sm text-gray-700">
                                <p className="font-medium">Ngoài giờ làm việc hoặc trên tư cách cá nhân:</p>
                                <ul className="list-disc pl-5 space-y-1 opacity-80">
                                    <li>Bạn có đầy đủ quyền lợi của một người dùng AmazeBid thông thường.</li>
                                    <li>Tự do tạo cửa hàng riêng, tự doanh độc lập và sử dụng AI Assistant cá nhân.</li>
                                    <li>Doanh thu và tài sản cá nhân được tách biệt hoàn toàn với cửa hàng đang làm thuê.</li>
                                </ul>
                                <div className="mt-4 p-3 bg-white rounded-xl border border-indigo-200 text-xs text-indigo-800 italic">
                                    "AmazeBid khuyến khích tinh thần khởi nghiệp. Nhân viên vẫn có thể trở thành chủ doanh nghiệp riêng trên nền tảng."
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Commitments */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <ShieldCheck className="text-green-600" size={20} /> Cam Kết Nội Dung & Điều Khoản Hoạt Động
                        </h3>
                        <div className="space-y-4 text-sm text-gray-600">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                                <p className="font-bold text-gray-800">1. Đạo đức kinh doanh & Trung thực</p>
                                <p>Người dùng cam kết cung cấp thông tin sản phẩm chính xác, không gian lận trong đấu giá và chịu trách nhiệm về nguồn gốc hàng hóa.</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                                <p className="font-bold text-gray-800">2. Bảo mật & P2P Networking</p>
                                <p>Cam kết bảo mật thông tin khách hàng. Không sử dụng mạng lưới P2P của AmazeBid để truyền bá nội dung độc hại hoặc tấn công hệ thống.</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                                <p className="font-bold text-gray-800">3. Sử dụng AI có trách nhiệm</p>
                                <p>Sử dụng trợ lý AI (Gemini) một cách văn minh. Tuyệt đối không tạo nội dung lừa đảo hoặc vi phạm thuần phong mỹ tục.</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                                <p className="font-bold text-gray-800">4. Giao dịch qua Escrow</p>
                                <p>Đồng ý sử dụng hệ thống ví ký quỹ (Escrow) để đảm bảo quyền lợi cho cả người mua và người bán. Tiền chỉ được giải ngân khi đơn hàng hoàn tất.</p>
                            </div>
                        </div>

                        {/* Confirmation Interaction */}
                        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center">
                            {!user.isTermsConfirmed ? (
                                <div className="w-full text-center space-y-6">
                                    {/* AmazeBid Service Link */}
                                    <div className="max-w-md mx-auto p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 border-dashed">
                                        <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-2">Tài liệu bắt buộc</p>
                                        <a 
                                          href="#" 
                                          onClick={(e) => {
                                            e.preventDefault();
                                            setIsServiceTermsModalOpen(true);
                                          }}
                                          className="flex items-center justify-center gap-3 p-3 bg-white rounded-xl border border-indigo-200 hover:border-indigo-600 hover:shadow-md transition-all group"
                                        >
                                          <div className="p-2 bg-indigo-600 text-white rounded-lg">
                                            <Chrome size={20} />
                                          </div>
                                          <div className="text-left">
                                            <p className="text-sm font-black text-gray-900 group-hover:text-indigo-600">Xem AmazeBid Service</p>
                                            <p className="text-[10px] text-gray-500">Quy định chi tiết về nền tảng dịch vụ</p>
                                          </div>
                                          {hasReadServiceTerms && <Check size={20} className="text-green-500 ml-auto animate-in zoom-in" />}
                                        </a>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="flex items-center justify-center gap-3 cursor-pointer group">
                                            <div className="p-2 border-2 border-indigo-600 rounded-lg group-hover:bg-indigo-50 transition-colors">
                                                <input type="checkbox" className="w-5 h-5 accent-indigo-600 cursor-pointer" id="confirm-terms-check" />
                                            </div>
                                            <span className="text-gray-700 font-medium">Tôi đã đọc, hiểu rõ quyền hạn và hoàn toàn đồng ý với các cam kết trên.</span>
                                        </label>

                                        {!hasReadServiceTerms && (
                                          <p className="text-xs text-amber-600 font-bold flex items-center justify-center gap-1">
                                            <AlertTriangle size={14} /> Vui lòng click xem AmazeBid Service trước khi xác nhận
                                          </p>
                                        )}

                                        <button 
                                            onClick={() => {
                                                if (!hasReadServiceTerms) {
                                                    alert('Vui lòng click xem "AmazeBid Service" trước.');
                                                    return;
                                                }
                                                const checkbox = document.getElementById('confirm-terms-check') as HTMLInputElement;
                                                if (checkbox && checkbox.checked) {
                                                    updateProfile({ isTermsConfirmed: true });
                                                    alert('Cảm ơn bạn đã xác nhận cam kết hoạt động tại AmazeBid!');
                                                } else {
                                                    alert('Vui lòng chọn ô xác nhận trước khi đồng ý.');
                                                }
                                            }}
                                            disabled={!hasReadServiceTerms}
                                            className={`px-12 py-4 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center gap-3 mx-auto ${
                                              hasReadServiceTerms 
                                              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100' 
                                              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                            }`}
                                        >
                                            <Check size={24} /> XÁC NHẬN & ĐỒNG Ý
                                        </button>
                                        <p className="text-xs text-gray-400">Việc xác nhận là điều kiện bắt buộc để thực hiện các giao dịch và hoạt động chính thức trên hệ thống.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4 bg-green-50 rounded-2xl border border-green-100 px-8">
                                    <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                                        <Check size={32} />
                                    </div>
                                    <h4 className="text-xl font-bold text-green-800">Xác Nhận Thành Công</h4>
                                    <p className="text-green-600 text-sm">Bạn đã cam kết và có đầy đủ quyền hạn thực hiện mọi giao dịch trên AmazeBid.</p>
                                    <p className="text-[10px] text-green-400 mt-2">Ngày xác nhận: {new Date().toLocaleDateString()}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* FAQ Mini */}
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                        <Info className="text-amber-600 shrink-0 mt-1" size={20} />
                        <div className="text-sm text-amber-900">
                            <p className="font-bold mb-1">Mẹo nhỏ cho người mới:</p>
                            <p className="opacity-80 leading-relaxed">
                                Nếu bạn là nhân viên, hãy sử dụng tính năng "Content Studio" để rèn luyện kỹ năng marketing cá nhân. 
                                Những nội dung này sẽ giúp bạn xây dựng uy tín (Reputation) để sau này tự mở cửa hàng riêng hiệu quả hơn.
                            </p>
                        </div>
                    </div>

                    {/* Technical Setup Guide Section (Admin Only) */}
                    {user.role === 'ADMIN' && (
                      <div className="mt-8 pt-8 border-t border-gray-100">
                          <div className="flex items-center gap-3 mb-6">
                              <div className="p-2 bg-indigo-600 text-white rounded-lg">
                                  <Monitor size={20} />
                              </div>
                              <h3 className="font-bold text-xl text-gray-900">Hướng dẫn Thiết lập Kết nối Mạng xã hội</h3>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                      <div className="w-6 h-6 bg-[#febd69] rounded-full flex items-center justify-center text-[10px] text-white">1</div>
                                      Firebase Console
                                  </h4>
                                  <ul className="space-y-3 text-sm text-gray-600">
                                      <li className="flex gap-2">
                                          <div className="text-[#febd69] font-bold">•</div>
                                          <span>Truy cập vào <a href="https://console.firebase.google.com/project/gen-lang-client-0231589160/authentication/providers" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold">Firebase Console (Auth)</a> để kích hoạt Sign-in providers.</span>
                                      </li>
                                      <li className="flex gap-2">
                                          <div className="text-[#febd69] font-bold">•</div>
                                          <span>Nhấn vào <b>Add new provider</b> và kích hoạt các dịch vụ:</span>
                                      </li>
                                      <li className="ml-4 flex flex-col gap-2">
                                          <div className="flex items-center gap-2 text-xs bg-white p-2 rounded-lg border border-gray-100 italic">
                                            <span>* Bạn CẦN kích hoạt Google/Facebook ở link trên thì nút "Kết nối" mới hoạt động.</span>
                                          </div>
                                      </li>
                                  </ul>
                              </div>

                              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                      <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] text-white">2</div>
                                      Quản lý Cơ sở dữ liệu
                                  </h4>
                                  <div className="space-y-4">
                                      <div className="p-4 bg-white rounded-xl border border-gray-100">
                                          <p className="text-xs font-bold text-blue-600 mb-1">Firestore Database:</p>
                                          <p className="text-[11px] text-gray-500 leading-relaxed mb-2">
                                              Dữ liệu của bạn được lưu trữ tại:
                                          </p>
                                          <a href="https://console.firebase.google.com/project/gen-lang-client-0231589160/firestore/databases/ai-studio-31607805-d477-4530-afbd-703aa296f8c4/data" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-gray-100 p-1 px-2 rounded block truncate text-blue-700 hover:bg-blue-50">
                                              Mở Firestore Console
                                          </a>
                                      </div>
                                      <div className="p-4 bg-white rounded-xl border border-gray-100">
                                          <p className="text-xs font-bold text-indigo-600 mb-1">Cơ chế Liên kết (Auth Linking):</p>
                                          <p className="text-[11px] text-gray-500 leading-relaxed">
                                              Hàm <code>linkSocialAccount</code> đã được triển khai thật trong <code>AuthProvider.tsx</code>. Nó sử dụng <code>linkWithPopup</code> để hợp nhất tài khoản mạng xã hội vào tài khoản AmazeBid hiện tại của bạn.
                                          </p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                    )}
                </div>
            )}

            {/* TAB: AI_BILLING */}
            {activeTab === 'AI_BILLING' && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                    <div className="flex justify-between items-center mb-6 pr-12">
                        <h2 className="text-2xl font-bold">AI & Gói Dịch Vụ (Google AI)</h2>
                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                            <Sparkles size={14} /> Gemini 1.5 Pro Enabled
                        </div>
                    </div>

                    {/* Subscription Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1a1c1e] to-[#2d2f31] text-white shadow-xl relative overflow-hidden group">
                           <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/40 transition-all"></div>
                           <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Gói hiện tại</p>
                           <h3 className="text-3xl font-bold mb-1">
                              {user.aiSubscription?.tier === AISubscriptionTier.PRO ? 'AmazeBid AI Pro' : 
                               user.aiSubscription?.tier === AISubscriptionTier.BYOK ? 'Bring Your Own Key' : 'Standard Free'}
                           </h3>
                           <p className="text-sm opacity-70 mb-4">
                              {user.aiSubscription?.tier === AISubscriptionTier.PRO ? 'Mở khóa toàn bộ quyền năng AI' : 'Giới hạn 10 câu hỏi/ngày'}
                           </p>
                           <div className="flex items-center justify-between mt-auto border-t border-white/10 pt-4">
                               <div className="text-xs">
                                   <p className="opacity-50">Ngày hết hạn</p>
                                   <p className="font-bold">{user.aiSubscription?.expiryDate ? new Date(user.aiSubscription.expiryDate).toLocaleDateString() : 'N/A'}</p>
                               </div>
                               <button 
                                 onClick={() => setShowCheckoutUI(AISubscriptionTier.PRO)}
                                 className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold transition-all"
                               >
                                   {user.aiSubscription?.tier === AISubscriptionTier.PRO ? 'Gia hạn gói' : 'Nâng cấp ngay'}
                               </button>
                           </div>
                        </div>

                        {/* Checkout Overlay Modal-like UI */}
                        {showCheckoutUI === AISubscriptionTier.PRO && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                                <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900">Nâng cấp AI Pro</h3>
                                            <p className="text-gray-500 text-sm">Trải nghiệm full quyền năng AI AmazeBid</p>
                                        </div>
                                        <button onClick={() => setShowCheckoutUI(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="bg-indigo-50 p-4 rounded-2xl mb-6 border border-indigo-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-bold text-gray-700">Giá gói (30 ngày)</span>
                                            <span className="text-xl font-black text-indigo-600 underline decoration-indigo-200">500,000đ</span>
                                        </div>
                                        <p className="text-[10px] text-indigo-400">Tương đương $20 USD. Áp dụng giá ưu đãi nội bộ.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Phương thức thuận tiện</p>
                                        
                                        <button 
                                            onClick={handleSubscribeAIPro}
                                            disabled={isSubscribing}
                                            className="w-full p-4 rounded-2xl border-2 border-indigo-600 bg-indigo-600 text-white flex items-center justify-between hover:bg-indigo-700 transition-all group"
                                        >
                                            <div className="flex items-center gap-3 text-left">
                                                <Wallet />
                                                <div>
                                                    <p className="font-bold">Ví AmazeBid (Escrow)</p>
                                                    <p className="text-[10px] opacity-70">Số dư hiện tại: {(user.wallet?.balance || 0).toLocaleString()}đ</p>
                                                </div>
                                            </div>
                                            {isSubscribing ? <Loader2 className="animate-spin" /> : <Check size={20} />}
                                        </button>

                                        <button 
                                            onClick={() => {
                                                setShowCheckoutUI(null);
                                                setActiveTab('PAYMENT');
                                            }}
                                            className="w-full p-4 rounded-2xl border border-gray-200 bg-white flex items-center justify-between hover:border-indigo-600 transition-all group"
                                        >
                                            <div className="flex items-center gap-3 text-left text-gray-600">
                                                <CreditCardIcon />
                                                <div>
                                                    <p className="font-bold text-gray-900">Thẻ Quốc Tế (Stripe)</p>
                                                    <p className="text-[10px]">Visa, Mastercard, Apple Pay...</p>
                                                </div>
                                            </div>
                                            <Share2 size={16} className="text-gray-400 group-hover:text-indigo-600" />
                                        </button>
                                    </div>

                                    <div className="mt-8 flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <ShieldCheck className="text-green-500 shrink-0" size={16} />
                                        <p className="text-[10px] text-gray-500 leading-relaxed">
                                            Giao dịch được bảo mật bởi hệ thống Escrow và Stripe. Bạn có thể hủy gia hạn bất kỳ lúc nào trong cài đặt.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col">
                           <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                               <TrendingUp size={14}/> Thống kê sử dụng AI
                           </p>
                           <div className="space-y-4 flex-1">
                               <div>
                                   <div className="flex justify-between text-xs mb-1">
                                       <span className="font-bold text-gray-600">Tokens đã dùng</span>
                                       <span className="text-gray-400">{(user.aiUsage?.totalTokens || 0).toLocaleString()} / 5,000,000</span>
                                   </div>
                                   <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                       <div 
                                         className="h-full bg-indigo-500 rounded-full" 
                                         style={{ width: `${Math.min(((user.aiUsage?.totalTokens || 0) / 5000000) * 100, 100)}%` }}
                                       ></div>
                                   </div>
                               </div>
                               <div>
                                   <div className="flex justify-between text-xs mb-1">
                                       <span className="font-bold text-gray-600">Số yêu cầu</span>
                                       <span className="text-gray-400">{user.aiUsage?.totalRequests || 0} yêu cầu</span>
                                   </div>
                               </div>
                           </div>
                           <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex items-start gap-2">
                               <Info size={14} className="text-indigo-600 mt-0.5 shrink-0" />
                               <p className="text-[10px] text-indigo-800 leading-relaxed">
                                   Gói **Pro ($20/tháng)** giúp bạn dự tính chi phí chính xác hơn và không bị giới hạn tốc độ xử lý khi livestream hoặc tạo nội dung hàng loạt.
                               </p>
                           </div>
                        </div>
                    </div>

                    {/* All Plans */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Các gói dịch vụ đề xuất</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { 
                                    tier: AISubscriptionTier.FREE, 
                                    name: 'Standard', 
                                    price: 'Miễn phí', 
                                    features: ['10 yêu cầu/ngày', 'Gemini 1.5 Flash', 'Hỗ trợ cơ bản'],
                                    color: 'border-gray-200'
                                },
                                { 
                                    tier: AISubscriptionTier.PRO, 
                                    name: 'AI Pro', 
                                    price: '500,000đ/tháng', 
                                    features: ['Không giới hạn', 'Gemini 1.5 Pro', 'Xử lý video AI', 'Ưu tiên Livestream'],
                                    cta: user.aiSubscription?.tier === AISubscriptionTier.PRO ? 'Đang sử dụng' : 'Chọn Pro',
                                    action: () => setShowCheckoutUI(AISubscriptionTier.PRO),
                                    color: 'border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-500/20 shadow-lg'
                                },
                                { 
                                    tier: AISubscriptionTier.BYOK, 
                                    name: 'Enterprise', 
                                    price: 'Theo API', 
                                    features: ['Sử dụng Key riêng', 'Tự quản lý Quota', 'Full Access API', 'Export Logs'],
                                    cta: 'Config Key',
                                    color: 'border-gray-200'
                                }
                            ].map(plan => (
                                <div key={plan.tier} className={`p-5 rounded-2xl border transition-all hover:scale-[1.02] ${plan.color}`}>
                                    <h4 className="font-bold text-lg">{plan.name}</h4>
                                    <p className="text-indigo-600 font-black text-xl mb-4">{plan.price}</p>
                                    <ul className="space-y-2 mb-6">
                                        {plan.features.map((f, i) => (
                                            <li key={i} className="text-xs text-gray-500 flex items-center gap-2">
                                                <Check size={12} className="text-green-500" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                    {plan.cta && (
                                        <button 
                                            onClick={plan.action}
                                            disabled={plan.tier === user.aiSubscription?.tier}
                                            className="w-full py-2 bg-[#131921] text-white rounded-lg text-sm font-bold hover:bg-black transition-colors disabled:bg-green-600 disabled:cursor-default"
                                        >
                                            {plan.cta}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Trust & Analysis Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-600 text-white rounded-lg">
                                    <ShieldCheck size={20} />
                                </div>
                                <h3 className="font-bold text-gray-900">Tại sao nên tin dùng?</h3>
                            </div>
                            <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                                <p>
                                    <strong className="text-indigo-700">Công nghệ Google Gemini:</strong> Toàn bộ hạ tầng AI của AmazeBid được xây dựng trên nền tảng **Google AI Studio**, sử dụng các mô hình ngôn ngữ lớn mạnh mẽ nhất hiện nay như Gemini 1.5 Pro.
                                </p>
                                <ul className="space-y-2 list-disc pl-4 italic opacity-80">
                                    <li>Độ trễ thấp, phản hồi gần như tức thì.</li>
                                    <li>Khả năng hiểu ngữ cảnh tiếng Việt sâu sắc.</li>
                                    <li>Bảo mật dữ liệu chuẩn doanh nghiệp (Enterprise Grade).</li>
                                </ul>
                                <p className="pt-2 border-t border-indigo-100">
                                    Bằng việc đăng ký gói dịch vụ, bạn không chỉ mua "công cụ", mà bạn đang đầu tư vào một **trợ lý thông minh** có khả năng tự học hỏi theo phong cách kinh doanh của riêng bạn.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <TrendingUp size={20} className="text-green-600" /> Phân tích lợi ích kinh tế
                            </h3>
                            <div className="space-y-4 text-sm">
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="font-bold text-gray-700 mb-1">Gói Standard (Flash)</p>
                                    <p className="text-gray-500 text-xs">
                                        Phù hợp người dùng mới hoặc seller quy mô nhỏ. Bạn trả phí theo từng lượt dùng (Pay-as-you-go). Ưu điểm là linh hoạt nhưng sẽ tốn kém nếu dùng nhiều.
                                    </p>
                                </div>
                                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <p className="font-bold text-indigo-700 mb-1 underline decoration-indigo-200">Gói AI Pro (Upgrade)</p>
                                    <p className="text-gray-600 text-xs">
                                        Dành cho chuyên nghiệp & livestreamer. Với **500,000đ**, bạn tiết kiệm tới **70%** so với việc trả phí lẻ nếu thực hiện trên 50 tác vụ phức tạp/tháng. 
                                    </p>
                                    <div className="mt-2 flex items-center gap-2 text-[10px] text-indigo-500 font-bold">
                                        <Check size={12}/> Xử lý video dung lượng lớn không tốn thêm phí.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FAQ & Data Policy */}
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mt-6 sm:mt-8">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-indigo-600" /> FAQ & Chính sách dữ liệu
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
                            <div className="space-y-4">
                                <div>
                                    <p className="font-bold text-gray-800 flex items-center gap-2">
                                        <Check size={14} className="text-green-500"/> Có phải dịch vụ chính thức từ Google?
                                    </p>
                                    <p className="text-gray-600 mt-1 pl-6">
                                        AmazeBid là đối tác sử dụng hạ tầng **Google AI Studio**. Toàn bộ sức mạnh xử lý ngôn ngữ và hình ảnh đến từ mô hình **Gemini** chính gốc của Google, đảm bảo tính chuẩn xác và tin cậy cao nhất.
                                    </p>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 flex items-center gap-2">
                                        <Check size={14} className="text-green-500"/> Có bao gồm 2TB lưu trữ Cloud không?
                                    </p>
                                    <p className="text-gray-600 mt-1 pl-6">
                                        Gói AI Pro tập trung vào khả năng **xử lý AI thông minh**. Hiện tại gói này **không bao gồm** dung lượng lưu trữ Google One (2TB). Tuy nhiên, mọi dữ liệu nội dung bạn tạo ra (livestream, bài viết) sẽ được AmazeBid lưu trữ an toàn trọn đời.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="font-bold text-gray-800 flex items-center gap-2">
                                        <Clock size={14} className="text-orange-500"/> Data sẽ thế nào nếu ngừng sử dụng?
                                    </p>
                                    <p className="text-gray-600 mt-1 pl-6">
                                        Nếu bạn ngừng gia hạ, bạn vẫn có quyền **xem và tải xuống** toàn bộ dữ liệu cũ. Chúng tôi cam kết **không xóa data** của người dùng kể cả khi gói Pro hết hạn. 
                                    </p>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 flex items-center gap-2">
                                        <ShieldCheck size={14} className="text-blue-500"/> Tính riêng tư của dữ liệu?
                                    </p>
                                    <p className="text-gray-600 mt-1 pl-6">
                                        Dữ liệu của bạn được tách biệt và mã hóa. Google Gemini sử dụng dữ liệu của bạn để phản hồi và **không dùng để train model** công cộng, đảm bảo bí mật kinh doanh.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Usage History */}
                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Clock size={18}/> Lịch sử sử dụng & Chi phí dự tính
                        </h3>
                        <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 border-b">
                                    <tr>
                                        <th className="px-4 py-3 font-bold text-xs uppercase text-gray-500">Ngày</th>
                                        <th className="px-4 py-3 font-bold text-xs uppercase text-gray-500">Loại tác vụ</th>
                                        <th className="px-4 py-3 font-bold text-xs uppercase text-gray-500">Tokens</th>
                                        <th className="px-4 py-3 font-bold text-xs uppercase text-gray-500">Chi phí (Dự tính)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {(user.aiUsage?.usageHistory || [
                                        { date: '2026-04-22 14:30', tokens: 1540, type: 'Bài viết AI', cost: 0.05 },
                                        { date: '2026-04-22 15:45', tokens: 4200, type: 'Phân tích Video', cost: 0.12 },
                                        { date: '2026-04-23 09:10', tokens: 800, type: 'Gợi ý Livestream', cost: 0.02 }
                                    ]).map((h, i) => (
                                        <tr key={i} className="hover:bg-white transition-colors">
                                            <td className="px-4 py-3 text-xs text-gray-400">{h.date}</td>
                                            <td className="px-4 py-3 font-medium">{h.type}</td>
                                            <td className="px-4 py-3 text-xs font-mono">{h.tokens.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-xs font-bold text-indigo-600">
                                                {user.aiSubscription?.tier === AISubscriptionTier.PRO ? '$0 (Incl. Pro)' : `$${h.cost?.toFixed(2)}`}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-4 italic">
                            * Chi phí trên được dự tính dựa trên bảng giá tiêu chuẩn của Google AI Studio. Gói Pro $20 giúp bạn không cần lo lắng về biến động chi phí này.
                        </p>
                    </div>
                </div>
            )}

            {/* TAB: LOYALTY */}
            {activeTab === 'LOYALTY' && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                    <h2 className="text-2xl font-bold mb-6 pr-12">Loyalty & Phần thưởng</h2>
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-2xl text-white shadow-lg">
                        <p className="text-sm opacity-80">Cấp bậc hiện tại</p>
                        <h3 className="text-3xl font-bold mb-2">{user.tier}</h3>
                        <p className="text-xl font-bold">{user.points} Điểm</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-4">Nhiệm vụ hàng ngày</h3>
                        <div className="space-y-3">
                            {(tasks || []).map(task => (
                                <div key={task.id} className="flex justify-between items-center p-4 border rounded-xl">
                                    <div>
                                        <p className="font-bold">{task.title}</p>
                                        <p className="text-sm text-gray-500">+{task.points} điểm</p>
                                    </div>
                                    <button 
                                        onClick={() => completeTask(task.id)}
                                        disabled={task.isCompleted}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold ${task.isCompleted ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 text-white'}`}
                                    >
                                        {task.isCompleted ? 'Đã hoàn thành' : 'Hoàn thành'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-4">Đổi Voucher</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(vouchers || []).map(voucher => (
                                <div key={voucher.id} className="p-4 border rounded-xl space-y-2">
                                    <p className="font-bold text-lg">{voucher.code}</p>
                                    <p className="text-sm text-gray-500">Giảm {voucher.discount}{voucher.type === 'PERCENTAGE' ? '%' : '$'}</p>
                                    <button 
                                        onClick={() => redeemVoucher(voucher.id)}
                                        className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-bold"
                                    >
                                        Đổi với {voucher.pointsRequired} điểm
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'SYSTEM_REQ' && (
                <div className="animate-in slide-in-from-right-4 -m-8 h-[calc(100%+64px)]">
                    <SystemRequirements />
                </div>
            )}

            {/* TAB: INFO (READ & UPDATE) */}
            {activeTab === 'INFO' && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                    <div className="flex justify-between items-center mb-6 pr-12">
                        <h2 className="text-2xl font-bold">Thông tin cá nhân</h2>
                        {!isEditingProfile ? (
                             <button 
                                onClick={() => setIsEditingProfile(true)}
                                className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 flex items-center gap-2"
                             >
                                <Edit2 size={16} /> Chỉnh sửa
                             </button>
                        ) : (
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleCancelEdit}
                                    className="text-sm font-bold text-gray-600 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
                                >
                                    Hủy
                                </button>
                                <button 
                                    onClick={handleSaveProfile}
                                    className="text-sm font-bold text-white bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                                >
                                    <Save size={16} /> Lưu lại
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Họ và tên</label>
                            {isEditingProfile ? (
                                <input 
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#febd69] outline-none"
                                    value={profileForm.fullName}
                                    onChange={e => setProfileForm({...profileForm, fullName: e.target.value})}
                                />
                            ) : (
                                <div className="p-3 bg-gray-50 rounded-lg font-medium border border-gray-200">{user.fullName}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (Không thể thay đổi)</label>
                            <div className="p-3 bg-gray-100 rounded-lg font-medium border border-gray-200 text-gray-500 cursor-not-allowed">
                                {user.email}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số điện thoại</label>
                            {isEditingProfile ? (
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                    <input 
                                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:border-[#febd69] outline-none"
                                        value={profileForm.phone}
                                        placeholder="Thêm số điện thoại"
                                        onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                                    />
                                </div>
                            ) : (
                                <div className="p-3 bg-gray-50 rounded-lg font-medium border border-gray-200">
                                    {user.phone || <span className="text-gray-400 italic">Chưa cập nhật</span>}
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-2">
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Địa chỉ giao hàng</label>
                             {isEditingProfile ? (
                                 <div className="relative">
                                     <MapPin size={18} className="absolute left-3 top-3 text-gray-400"/>
                                     <textarea 
                                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:border-[#febd69] outline-none resize-none"
                                        rows={3}
                                        value={profileForm.address}
                                        placeholder="Nhập địa chỉ đầy đủ..."
                                        onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                                    />
                                 </div>
                             ) : (
                                 <div className="p-3 bg-gray-50 rounded-lg font-medium border border-gray-200 flex items-start gap-2">
                                     <MapPin size={18} className="text-gray-400 mt-0.5 shrink-0"/>
                                     {user.address || <span className="text-gray-400 italic">Chưa cập nhật địa chỉ</span>}
                                 </div>
                             )}
                        </div>

                        {/* KYC Section */}
                        <div className="md:col-span-2 mt-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Xác minh danh tính (KYC)</label>
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={24} />
                                    <div>
                                        <h4 className="font-bold text-blue-900 text-sm">Chưa xác minh danh tính</h4>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Xác minh danh tính (Cá nhân hoặc Doanh nghiệp) để tăng độ uy tín, mở khóa tính năng bán hàng giá trị cao và rút tiền không giới hạn.
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsKYCModalOpen(true)}
                                    className="shrink-0 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    Bắt đầu KYC
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: POSTS & PRODUCTS */}
            {activeTab === 'POSTS' && (
                <div className="space-y-8 animate-in slide-in-from-right-4">
                    <h2 className="text-2xl font-bold mb-4 pr-12">Quản lý Bài đăng & Sản phẩm</h2>
                    
                    {/* Products Section */}
                    <div>
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-b pb-2">
                            <ShoppingBag className="text-[#febd69]"/> Sản phẩm đang bán ({myProducts.length})
                        </h3>
                        {myProducts.length === 0 ? (
                            <p className="text-gray-400 italic text-sm">Bạn chưa đăng bán sản phẩm nào.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(myProducts || []).map(prod => (
                                    <div key={prod.id} className="border border-gray-200 rounded-xl p-3 flex gap-3 hover:shadow-md transition-shadow bg-white">
                                        <img src={prod.image} className="w-16 h-16 rounded object-cover bg-gray-100"/>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate">{prod.title}</p>
                                            <div className="flex items-center gap-2 text-xs mt-1">
                                                <span className="font-bold text-[#b12704]">${prod.price}</span>
                                                {prod.type === ItemType.AUCTION ? (
                                                    <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Gavel size={10}/> Đấu giá</span>
                                                ) : (
                                                    <span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded flex items-center gap-0.5"><ShoppingBag size={10}/> Mua ngay</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">{prod.category}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Posts Section */}
                    <div>
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-b pb-2">
                            <FileText className="text-blue-500"/> Bài viết nội dung (Content Studio) ({myPosts.length})
                        </h3>
                        {myPosts.length === 0 ? (
                            <p className="text-gray-400 italic text-sm">Bạn chưa tạo bài viết nào từ Content Studio.</p>
                        ) : (
                            <div className="space-y-4">
                                {(myPosts || []).map(post => (
                                    <div key={post.id} className="border border-gray-200 rounded-xl p-4 bg-white hover:border-blue-300 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-gray-900">{post.title}</h4>
                                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full uppercase">{post.status}</span>
                                        </div>
                                        
                                        <div className="flex gap-4 mb-3">
                                            {post.generatedImages && post.generatedImages.length > 0 && (
                                                <img src={post.generatedImages[0]} className="w-20 h-20 rounded object-cover border border-gray-100"/>
                                            )}
                                            <p className="text-xs text-gray-500 line-clamp-3 flex-1">{post.content}</p>
                                        </div>
                                        
                                        <div className="flex items-center justify-between text-xs text-gray-400 border-t pt-2">
                                            <div className="flex gap-2">
                                                <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(post.createdAt).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1"><Share2 size={12}/> {post.platform}</span>
                                            </div>
                                            {post.generatedVideo && <span className="text-red-500 flex items-center gap-1 font-bold"><Video size={12}/> Có Video</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: PAYMENT (CREATE, READ, DELETE) */}
            {activeTab === 'PAYMENT' && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                     <h2 className="text-2xl font-bold mb-2 pr-12">Tài khoản & Thanh toán</h2>
                     <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 items-start">
                        <ShieldCheck className="text-blue-600 shrink-0 mt-1" />
                        <div className="text-sm text-blue-800">
                            <p className="font-bold">AmazeBid Secure Vault</p>
                            <p>Thông tin được mã hóa E2EE. Quản lý các thẻ thanh toán của bạn tại đây.</p>
                        </div>
                     </div>

                     <div className="space-y-4 mt-6">
                        {/* List Existing Cards */}
                        {(user.paymentMethods || []).length === 0 && !isAddingCard ? (
                            <p className="text-gray-400 italic text-center py-4">Chưa có phương thức thanh toán nào.</p>
                        ) : (
                            (user.paymentMethods || []).map(pm => (
                                <div key={pm.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow group">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-gray-100 p-2 rounded-lg">
                                                {pm.type === 'BANK' ? <Landmark /> : <CreditCard />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{pm.providerName}</p>
                                                <p className="text-xs text-gray-500 uppercase font-bold">{pm.type} - {pm.holderName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {pm.isDefault && (
                                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-bold">Mặc định</span>
                                            )}
                                            <button 
                                                onClick={() => handleDeletePayment(pm.id)}
                                                className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Xóa thẻ"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <span className="font-mono text-lg tracking-widest text-gray-700">
                                            {showSensitive[pm.id] ? pm.accountNumber : maskedNumber(pm.accountNumber)}
                                        </span>
                                        <button 
                                            onClick={() => toggleVisibility(pm.id)}
                                            className="text-gray-400 hover:text-[#131921] transition-colors"
                                            title={showSensitive[pm.id] ? "Che đi" : "Hiển thị"}
                                        >
                                            {showSensitive[pm.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Add New Card Form */}
                        {isAddingCard ? (
                            <form onSubmit={handleSaveNewCard} className="border-2 border-dashed border-[#febd69] bg-orange-50/30 rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                <h3 className="font-bold text-gray-900">Thêm thẻ mới</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Loại thẻ</label>
                                        <select 
                                            className="w-full p-2 border border-gray-300 rounded bg-white"
                                            value={cardForm.provider}
                                            onChange={e => setCardForm({...cardForm, provider: e.target.value})}
                                        >
                                            <option value="Visa">Visa</option>
                                            <option value="Mastercard">Mastercard</option>
                                            <option value="JCB">JCB</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Tên chủ thẻ</label>
                                        <input 
                                            className="w-full p-2 border border-gray-300 rounded uppercase" 
                                            placeholder="NGUYEN VAN A"
                                            required
                                            value={cardForm.holder}
                                            onChange={e => setCardForm({...cardForm, holder: e.target.value})}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Số thẻ</label>
                                        <input 
                                            className="w-full p-2 border border-gray-300 rounded font-mono" 
                                            placeholder="0000 0000 0000 0000"
                                            required
                                            minLength={12}
                                            maxLength={19}
                                            value={cardForm.number}
                                            onChange={e => setCardForm({...cardForm, number: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsAddingCard(false)}
                                        className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded"
                                    >
                                        Hủy
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-6 py-2 text-sm font-bold text-black bg-[#febd69] hover:bg-[#f3a847] rounded shadow-sm"
                                    >
                                        Thêm thẻ
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button 
                                onClick={() => setIsAddingCard(true)}
                                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-[#febd69] hover:text-[#febd69] hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={20} /> Thêm tài khoản ngân hàng / Thẻ mới
                            </button>
                        )}
                     </div>
                </div>
            )}

            {activeTab === 'SOCIAL' && (
                <div className="space-y-8 animate-in slide-in-from-right-4">
                    <div>
                        <h2 className="text-2xl font-bold mb-4 pr-12">Liên kết Mạng xã hội</h2>
                        <p className="text-sm text-gray-500 mb-4 font-medium">Kết nối tài khoản để đăng nhập nhanh hơn và chia sẻ sản phẩm dễ dàng.</p>
                        
                        <div className="space-y-4">
                            {[
                                { 
                                  id: 'facebook', 
                                  name: 'Facebook', 
                                  icon: () => (
                                    <div className="w-6 h-6 bg-[#1877F2] rounded-full flex items-center justify-center text-white">
                                      <Facebook size={16} fill="currentColor" />
                                    </div>
                                  ), 
                                  color: 'text-[#1877F2]' 
                                },
                                { 
                                  id: 'google', 
                                  name: 'Google', 
                                  icon: () => (
                                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                                      <svg viewBox="0 0 24 24" className="w-4 h-4">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                                      </svg>
                                    </div>
                                  ), 
                                  color: 'text-gray-900' 
                                },
                                { 
                                  id: 'instagram', 
                                  name: 'Instagram', 
                                  icon: () => (
                                    <div className="w-6 h-6 bg-gradient-to-tr from-[#FFB344] via-[#FF0050] to-[#8D00C1] rounded-lg flex items-center justify-center text-white shadow-sm">
                                      <Instagram size={14} />
                                    </div>
                                  ), 
                                  color: 'text-[#E1306C]' 
                                }
                            ].map(platform => {
                                const account = (user.socialAccounts || []).find(a => a.provider === platform.id);
                                const isConnected = account?.connected;
                                const Icon = platform.icon;

                                return (
                                    <div key={platform.id} className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl bg-white hover:border-[#ebf4ff] hover:shadow-sm transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 group-hover:scale-110 transition-transform`}>
                                                <Icon />
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-gray-900">{platform.name}</p>
                                                <p className="text-xs text-gray-400 font-medium">
                                                    {isConnected ? (account?.username || 'Đã liên kết') : 'Chưa kết nối'}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => toggleSocialConnection(platform.id)}
                                            disabled={socialLoading[platform.id]}
                                            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                                                isConnected 
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                                : 'bg-[#ebf4ff] text-[#0066ff] hover:bg-[#d9e9ff] shadow-sm shadow-blue-100'
                                            } disabled:opacity-50`}
                                        >
                                            {socialLoading[platform.id] && <Loader2 size={14} className="animate-spin" />}
                                            {isConnected ? 'Hủy liên kết' : 'Kết nối ngay'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {user.role === 'ADMIN' && (
                           <div className="mt-6 flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                               <Info size={16} className="text-blue-600" />
                               <p className="text-xs text-blue-700">
                                   Gặp sự cố khi kết nối? 
                                   <button onClick={() => setActiveTab('GUIDE')} className="ml-1 font-bold underline hover:text-blue-900 transition-colors">
                                       Xem hướng dẫn thiết lập Firebase tại đây.
                                   </button>
                               </p>
                           </div>
                        )}
                    </div>

                    <div className="border-t border-gray-100 pt-8 mt-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Giới thiệu bạn bè</h2>
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-xs font-black border border-green-100">
                                <Users size={14} /> {user.friendCount || 0} Bạn bè
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-orange-50/50 via-white to-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Users size={120} />
                            </div>
                            <h3 className="font-extrabold text-gray-900 mb-2 relative z-10">Mã giới thiệu của bạn</h3>
                            <p className="text-xs text-gray-400 mb-6 font-medium relative z-10">Chia sẻ mã này để nhận điểm thưởng khi bạn bè đăng ký!</p>
                            
                            <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                                <div className="flex-1 bg-white border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center p-4 font-mono font-black text-xl tracking-[0.2em] text-[#131921] shadow-inner h-14">
                                    {user.referralCode || '----'}
                                </div>
                                <button 
                                    onClick={handleCopyCode}
                                    className="bg-[#131921] h-14 text-white px-8 rounded-2xl font-black hover:bg-black transition-all flex items-center gap-3 min-w-[150px] justify-center shadow-xl shadow-gray-200"
                                >
                                    {copied ? <Check size={18} className="text-green-400"/> : <Copy size={18} />}
                                    {copied ? 'Đã chép' : 'Sao chép'}
                                </button>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest mb-3 px-1">Nhập mã giới thiệu từ bạn bè</h3>
                            <div className="flex gap-3">
                                <input 
                                    value={friendCodeInput}
                                    onChange={(e) => setFriendCodeInput(e.target.value.toUpperCase())}
                                    placeholder="Nhập mã (VD: AMZ-ABCD-123)"
                                    className="flex-1 border border-gray-200 rounded-2xl px-6 py-4 text-sm font-bold uppercase focus:border-indigo-600 bg-gray-50/50 outline-none transition-all shadow-inner"
                                />
                                <button 
                                    onClick={handleLinkFriendCode}
                                    disabled={isLinkingFriend || !friendCodeInput}
                                    className="bg-white border-2 border-gray-100 text-gray-900 font-bold px-8 rounded-2xl text-sm hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                                >
                                    {isLinkingFriend ? <Loader2 size={16} className="animate-spin" /> : <Link size={16} />}
                                    Liên kết
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: SECURITY (DELETE ACCOUNT) */}
            {activeTab === 'SECURITY' && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                    <h2 className="text-2xl font-bold mb-6 pr-12">Bảo mật</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 border rounded-xl">
                            <div>
                                <p className="font-bold">Đổi mật khẩu</p>
                                <p className="text-xs text-gray-500">Lần cuối thay đổi: 3 tháng trước</p>
                            </div>
                            <button className="text-blue-600 font-bold text-sm hover:underline">Cập nhật</button>
                        </div>
                        <div className="flex justify-between items-center p-4 border rounded-xl">
                            <div>
                                <p className="font-bold">Xác thực 2 bước (2FA)</p>
                                <p className="text-xs text-gray-500">Bảo vệ tài khoản bằng mã OTP</p>
                            </div>
                            <div className="flex items-center gap-4">
                                {user.twoFactorEnabled && (
                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Đã bật</span>
                                )}
                                <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                                    <input 
                                        type="checkbox" 
                                        name="toggle" 
                                        id="toggle" 
                                        className={`toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in ${user.twoFactorEnabled ? 'translate-x-5 border-green-500' : 'border-gray-300'}`}
                                        checked={user.twoFactorEnabled}
                                        onChange={(e) => handleToggle2FA(e.target.checked)}
                                    />
                                    <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer transition-colors duration-200 ease-in ${user.twoFactorEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></label>
                                </div>
                            </div>
                        </div>

                        {isSettingUp2FA && twoFactorSetupData && (
                            <div className="p-6 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/30 space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-blue-900">Thiết lập Xác thực 2 bước</h3>
                                    <button onClick={() => setIsSettingUp2FA(false)} className="text-gray-400 hover:text-gray-600">
                                        <X size={20} />
                                    </button>
                                </div>
                                
                                <div className="flex flex-col xl:flex-row gap-10 items-start">
                                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 flex-shrink-0 mx-auto md:mx-0 ring-4 ring-blue-50/50">
                                        <div className="w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center bg-white overflow-hidden rounded-2xl border border-gray-100 shadow-inner">
                                            <img src={twoFactorSetupData.qrCode} alt="2FA QR Code" className="w-full h-full object-contain p-2" />
                                        </div>
                                        <div className="mt-4 text-center">
                                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Mã QR Bảo mật</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-8 w-full">
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                                <p className="text-sm text-blue-800">
                                                    Quét mã QR bằng ứng dụng Authenticator (Google Authenticator, Authy, v.v.)
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                                <p className="text-sm text-blue-800">
                                                    Hoặc nhập mã thủ công: <code className="bg-blue-100 px-3 py-1.5 rounded-lg font-black text-blue-900 border border-blue-200 ml-1">{twoFactorSetupData.secret}</code>
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-4 border-t border-blue-100">
                                            <label className="block text-xs font-black text-blue-700 uppercase tracking-widest mb-3 px-1">Xác nhận bằng mã 6 số</label>
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <input 
                                                    type="text"
                                                    maxLength={6}
                                                    placeholder="000 000"
                                                    className="flex-1 p-4 border-2 border-blue-100 rounded-2xl font-mono text-center text-2xl font-black tracking-[0.5em] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                                    value={twoFactorCode}
                                                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                                                />
                                                <button 
                                                    onClick={handleConfirm2FA}
                                                    disabled={twoFactorCode.length !== 6}
                                                    className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-700 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2"
                                                >
                                                    Kích hoạt <Check size={20} />
                                                </button>
                                            </div>
                                            {twoFactorError && (
                                                <motion.p 
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="text-xs text-red-500 mt-3 font-bold flex items-center gap-1"
                                                >
                                                    <AlertTriangle size={14} /> {twoFactorError}
                                                </motion.p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-between items-center p-4 border rounded-xl bg-orange-50 border-orange-100">
                            <div>
                                <p className="font-bold text-orange-900">Quản lý phiên đăng nhập</p>
                                <p className="text-xs text-orange-700">Đăng xuất khỏi tất cả các thiết bị khác (Reset Token)</p>
                            </div>
                            <button 
                                onClick={handleResetSessions}
                                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-700 transition-colors"
                            >
                                <RefreshCw size={16} /> Reset Sessions
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-red-100 pt-6">
                        <h3 className="text-red-600 font-bold mb-2 flex items-center gap-2">
                            <AlertTriangle size={18}/> Vùng nguy hiểm
                        </h3>
                        <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                            <p className="font-bold text-gray-900 mb-1">Xóa tài khoản</p>
                            <p className="text-sm text-gray-600 mb-4">
                                Một khi bạn xóa tài khoản, tất cả dữ liệu sẽ bị mất vĩnh viễn và không thể khôi phục.
                            </p>
                            <button 
                                onClick={handleDeleteAccount}
                                className="bg-white border border-red-200 text-red-600 font-bold px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors text-sm"
                            >
                                Xóa tài khoản này
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
      <KYCModal isOpen={isKYCModalOpen} onClose={() => setIsKYCModalOpen(false)} user={user} />
      <UserWalletModal 
          isOpen={isWalletModalOpen} 
          onClose={() => setIsWalletModalOpen(false)} 
      />
    </div>
  );
};

export default UserProfile;
