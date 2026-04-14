
import React, { useState, useEffect } from 'react';
import { User, CreditCard, ShieldCheck, MapPin, Eye, EyeOff, Edit2, Plus, LogOut, Lock, X, Share2, Copy, Check, Facebook, Instagram, Chrome, Users, Link, Save, Trash2, AlertTriangle, Phone, FileText, ShoppingBag, Gavel, Calendar, Video, Sparkles, Camera, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { PaymentMethod, SocialAccount, Product, ContentPost, ItemType } from '../types';
import KYCModal from './KYCModal';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  myProducts?: Product[];
  myPosts?: ContentPost[];
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose, myProducts = [], myPosts = [] }) => {
  const { user, logout, updateProfile, resetToken, setup2FA, confirm2FA, toggle2FA } = useAuth();
  const [activeTab, setActiveTab] = useState<'INFO' | 'PAYMENT' | 'SECURITY' | 'SOCIAL' | 'POSTS' | 'LOYALTY'>('INFO');
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<{ secret: string, qrCode: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch tasks and vouchers
    fetch('/api/tasks').then(res => res.json()).then(data => setTasks(data.tasks));
    fetch('/api/vouchers').then(res => res.json()).then(data => setVouchers(data.vouchers));
  }, []);

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
  const toggleSocialConnection = (provider: string) => {
      const currentAccounts = user.socialAccounts || [];
      const exists = currentAccounts.find(a => a.provider === provider);
      
      let newAccounts: SocialAccount[];
      
      if (exists) {
          newAccounts = currentAccounts.map(a => 
              a.provider === provider ? { ...a, connected: !a.connected } : a
          );
      } else {
          newAccounts = [...currentAccounts, { provider: provider as any, connected: true, username: 'user_connected' }];
      }
      
      updateProfile({ socialAccounts: newAccounts });
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
      <div className="relative bg-white w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95">
        
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
                    onClick={() => setActiveTab('LOYALTY')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-3 ${activeTab === 'LOYALTY' ? 'bg-[#131921] text-white' : 'hover:bg-gray-200 text-gray-600'}`}
                >
                    <Sparkles size={16} /> Loyalty & Phần thưởng
                </button>
            </nav>

            <button 
                onClick={() => { logout(); onClose(); }}
                className="mt-auto flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            >
                <LogOut size={16} /> Đăng xuất
            </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-12 relative custom-scrollbar">
            
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
                                                {pm.type === 'BANK' ? <LandmarkIcon /> : <CreditCard />}
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

            {/* TAB: SOCIAL (UNCHANGED LOGIC) */}
            {activeTab === 'SOCIAL' && (
                <div className="space-y-8 animate-in slide-in-from-right-4">
                    <div>
                        <h2 className="text-2xl font-bold mb-4 pr-12">Liên kết Mạng xã hội</h2>
                        <p className="text-sm text-gray-500 mb-4">Kết nối tài khoản để đăng nhập nhanh hơn và chia sẻ sản phẩm dễ dàng.</p>
                        
                        <div className="space-y-3">
                            {[
                                { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
                                { id: 'google', name: 'Google', icon: Chrome, color: 'text-red-500' },
                                { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600' }
                            ].map(platform => {
                                const account = (user.socialAccounts || []).find(a => a.provider === platform.id);
                                const isConnected = account?.connected;

                                return (
                                    <div key={platform.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full bg-gray-100 ${platform.color}`}>
                                                <platform.icon size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{platform.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {isConnected ? (account?.username || 'Đã kết nối') : 'Chưa kết nối'}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => toggleSocialConnection(platform.id)}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                                isConnected 
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                            }`}
                                        >
                                            {isConnected ? 'Hủy liên kết' : 'Kết nối ngay'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold">Giới thiệu bạn bè</h2>
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                <Users size={14} /> {user.friendCount || 0} Bạn bè
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-orange-50 to-white p-6 rounded-2xl border border-orange-100 mb-6">
                            <h3 className="font-bold text-gray-900 mb-2">Mã giới thiệu của bạn</h3>
                            <p className="text-sm text-gray-500 mb-4">Chia sẻ mã này để nhận điểm thưởng khi bạn bè đăng ký!</p>
                            
                            <div className="flex gap-2">
                                <div className="flex-1 bg-white border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center p-3 font-mono font-bold text-lg tracking-widest text-[#131921]">
                                    {user.referralCode || '----'}
                                </div>
                                <button 
                                    onClick={handleCopyCode}
                                    className="bg-[#131921] text-white px-6 rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2 min-w-[120px] justify-center"
                                >
                                    {copied ? <Check size={18} className="text-green-400"/> : <Copy size={18} />}
                                    {copied ? 'Đã chép' : 'Sao chép'}
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-sm text-gray-700 mb-2">Nhập mã giới thiệu từ bạn bè</h3>
                            <div className="flex gap-2">
                                <input 
                                    value={friendCodeInput}
                                    onChange={(e) => setFriendCodeInput(e.target.value.toUpperCase())}
                                    placeholder="Nhập mã (VD: AMAZE-X-999)"
                                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm uppercase focus:border-[#febd69] outline-none"
                                />
                                <button className="bg-gray-200 text-gray-700 font-bold px-4 rounded-lg text-sm hover:bg-gray-300 flex items-center gap-1">
                                    <Link size={14} /> Liên kết
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
                                
                                <div className="flex flex-col md:flex-row gap-6 items-center">
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                                        <img src={twoFactorSetupData.qrCode} alt="2FA QR Code" className="w-40 h-40" />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <p className="text-sm text-blue-800">
                                            1. Quét mã QR bằng ứng dụng Authenticator (Google Authenticator, Authy, v.v.)
                                        </p>
                                        <p className="text-sm text-blue-800">
                                            2. Hoặc nhập mã thủ công: <code className="bg-blue-100 px-2 py-1 rounded font-bold text-blue-900">{twoFactorSetupData.secret}</code>
                                        </p>
                                        <div className="pt-2">
                                            <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Nhập mã 6 số để xác nhận</label>
                                            <input 
                                                type="text"
                                                maxLength={6}
                                                placeholder="000000"
                                                className="w-full p-3 border border-blue-200 rounded-lg font-mono text-center text-xl tracking-widest focus:border-blue-500 outline-none"
                                                value={twoFactorCode}
                                                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                                            />
                                            {twoFactorError && <p className="text-xs text-red-500 mt-1 font-medium">{twoFactorError}</p>}
                                        </div>
                                        <button 
                                            onClick={handleConfirm2FA}
                                            disabled={twoFactorCode.length !== 6}
                                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                        >
                                            Xác nhận & Kích hoạt
                                        </button>
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
    </div>
  );
};

const LandmarkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>
)

export default UserProfile;
