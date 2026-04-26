
import React from 'react';
import { Search, ShoppingCart, User as UserIcon, MapPin, Gavel, LayoutGrid, PlusCircle, Package, Video, Sparkles, Zap, BarChart3, Shield, Bot, Camera, Users, Wand2, Mic, Mail, Store as LucideStore, PlusSquare, Utensils } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { emailService } from '../services/EmailService';

interface NavbarProps {
  cartCount: number;
  searchTerm?: string;
  onSearch: (term: string) => void;
  onImageSearch?: (base64: string, mimeType: string) => void;
  isVisualSearching?: boolean;
  openCart: () => void;
  openSellModal: () => void;
  openOrders: () => void;
  onOpenLiveStudio: () => void;
  onViewLiveStreams: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenCustomerService: () => void;
  onOpenContentStudio: () => void;
  onOpenSuperDeals: () => void;
  onOpenSellerDashboard: () => void;
  onOpenAdminDashboard: () => void;
  onOpenAdminAITasks: () => void;
  onOpenAvatarStudio: () => void;
  onOpenCommunity: () => void;
  onGoHome: () => void;
  onOpenKOLStudio: () => void;
  onOpenEmailInbox: () => void;
  onOpenStoreDiscovery: () => void;
  onOpenStoreRegistration: () => void;
  onOpenWallet: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  cartCount, searchTerm, onSearch, onImageSearch, isVisualSearching, openCart, openSellModal, openOrders, 
  onOpenLiveStudio, onViewLiveStreams, onOpenAuth, onOpenProfile, onOpenCustomerService, onOpenContentStudio, onOpenSuperDeals, onOpenSellerDashboard, onOpenAdminDashboard, onOpenAdminAITasks, onOpenAvatarStudio, onOpenCommunity,
  onGoHome, onOpenKOLStudio, onOpenEmailInbox, onOpenStoreDiscovery, onOpenStoreRegistration, onOpenWallet
}) => {
  const { user } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = React.useState(false);
  const [unreadEmails, setUnreadEmails] = React.useState(0);

  React.useEffect(() => {
    const unsubscribe = emailService.subscribe((emails) => {
      setUnreadEmails(emails.filter(e => !e.isRead).length);
    });
    return () => unsubscribe();
  }, []);

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ tìm kiếm bằng giọng nói.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onSearch(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageSearch) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Extract base64 data and mime type
      const mimeType = file.type;
      const base64Data = base64String.split(',')[1];
      onImageSearch(base64Data, mimeType);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header className="bg-[#131921] text-white sticky top-0 z-50">
      {/* Top Bar */}
      <div className="max-w-[1500px] mx-auto flex items-center p-2 gap-4">
        {/* Logo */}
        <div className="flex items-center cursor-pointer p-2 border border-transparent hover:border-white rounded" onClick={onGoHome}>
          <span className="text-2xl font-bold italic flex items-center gap-1">
            <Gavel className="text-[#febd69]" /> Amaze<span className="text-[#febd69]">Bid</span>
          </span>
        </div>

        {/* Deliver to */}
        <div className="hidden md:flex items-center gap-1 p-2 cursor-pointer border border-transparent hover:border-white rounded">
          <MapPin size={18} />
          <div className="text-xs">
            <p className="text-gray-400">Giao đến</p>
            <p className="font-bold">{user?.address ? 'Nhà riêng' : 'Việt Nam'}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 flex h-10 items-stretch relative">
          <select className="bg-gray-100 text-black text-sm px-3 rounded-l border-r border-gray-300 outline-none focus:ring-2 focus:ring-[#febd69] hidden sm:block max-w-[150px]">
            <option>Tất cả</option>
            <option>Đấu giá</option>
            <option>Mua ngay</option>
            <option>Điện tử (Electronics)</option>
            <option>Thời trang (Fashion)</option>
            <option>Đồ cổ (Collectibles)</option>
            <option>Máy tính (Computers)</option>
            <option>Nhà cửa (Home & Office)</option>
            <option>Làm đẹp (Beauty)</option>
            <option>Âm nhạc (Music)</option>
            <option>Điện thoại & Phụ kiện (Phones & Accessories)</option>
            <option>Mẹ & Bé (Mother & Baby)</option>
            <option>Sức khỏe & Y tế (Health & Medical)</option>
            <option>Thể thao & Dã ngoại (Sports & Outdoors)</option>
            <option>Sách & Văn phòng phẩm (Books & Stationery)</option>
            <option>Ô tô & Xe máy (Cars & Motorcycles)</option>
            <option>Đồ chơi & Trò chơi (Toys & Games)</option>
            <option>Bất động sản (Real Estate)</option>
            <option>Thực phẩm & Đồ uống (Food & Beverages)</option>
          </select>
          <div className="flex-1 relative flex items-center bg-white sm:rounded-none rounded-l">
            <input 
              type="text" 
              placeholder="Tìm kiếm sản phẩm hoặc phiên đấu giá..."
              className="w-full h-full px-4 pr-20 text-black outline-none bg-transparent"
              value={searchTerm || ''}
              onChange={(e) => onSearch(e.target.value)}
            />
            
            <div className="absolute right-2 flex items-center gap-1">
              {/* Voice Search Button */}
              <button 
                onClick={startVoiceSearch}
                className={`text-gray-500 hover:text-[#febd69] p-1.5 transition-colors rounded-full hover:bg-gray-100 ${isListening ? 'text-red-500 animate-pulse bg-red-50' : ''}`}
                title="Tìm kiếm bằng giọng nói"
              >
                <Mic size={18} />
              </button>

              {/* Visual Search Button */}
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isVisualSearching}
                className="text-gray-500 hover:text-[#febd69] p-1.5 transition-colors rounded-full hover:bg-gray-100 disabled:opacity-50"
                title="Tìm kiếm bằng hình ảnh"
              >
                {isVisualSearching ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-[#febd69] rounded-full animate-spin" />
                ) : (
                  <Camera size={18} />
                )}
              </button>
            </div>
          </div>

          <button className="bg-[#febd69] hover:bg-[#f3a847] px-5 rounded-r text-black flex items-center justify-center transition-colors">
            <Search size={20} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
            {/* Go Live Button */}
            <button 
            onClick={onOpenLiveStudio}
            className="hidden md:flex items-center gap-2 p-2 border border-gray-600 rounded hover:border-[#febd69] hover:text-[#febd69] transition-all"
            title="AmazeLive Studio"
            >
            <Video size={20} />
            <span className="font-bold text-sm">Live Studio</span>
            </button>

            {/* Sell Button */}
            <button 
            onClick={user ? openSellModal : onOpenAuth}
            className="hidden md:flex items-center gap-2 p-2 border-2 border-[#febd69] rounded hover:bg-[#febd69] hover:text-black transition-all group"
            >
            <PlusCircle size={20} className="text-[#febd69] group-hover:text-black" />
            <span className="font-bold text-sm">Đăng bán</span>
            </button>
        </div>

        {/* User Account / Login */}
        <div 
            onClick={user ? onOpenProfile : onOpenAuth}
            className="hidden lg:flex items-center gap-2 p-2 cursor-pointer border border-transparent hover:border-white rounded"
        >
            {user ? (
                <>
                    <img src={user.avatar} className="w-8 h-8 rounded-full border border-gray-500" />
                    <div className="text-xs">
                        <p className="text-gray-400">Xin chào,</p>
                        <p className="font-bold truncate max-w-[80px]">{user.fullName.split(' ').pop()}</p>
                    </div>
                </>
            ) : (
                <>
                    <UserIcon size={24} />
                    <div className="text-xs">
                        <p className="text-gray-400">Xin chào, khách</p>
                        <p className="font-bold">Đăng nhập</p>
                    </div>
                </>
            )}
        </div>

        {/* Wallet Button */}
        {user && (
          <div 
            onClick={onOpenWallet}
            className="hidden lg:flex items-center gap-2 p-2 cursor-pointer border border-transparent hover:border-white rounded"
          >
            <div className="flex flex-col items-end">
              <p className="text-xs text-gray-400">Ví của tôi</p>
              <p className="text-sm font-bold text-[#febd69]">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.wallet?.balance || user.balance || 0)}
              </p>
            </div>
          </div>
        )}

        {/* Orders & Dashboard (Restored for all users) */}
        <div 
            onClick={user ? openOrders : onOpenAuth}
            className="hidden lg:block p-2 cursor-pointer border border-transparent hover:border-white rounded"
        >
            <p className="text-xs">Trả hàng &</p>
            <p className="text-sm font-bold flex items-center">Đơn hàng <Package size={14} className="ml-1" /></p>
        </div>

        {/* Cart */}
        <div 
          onClick={openCart}
          className="flex items-end gap-1 p-2 cursor-pointer border border-transparent hover:border-white rounded relative"
        >
          <div className="relative">
            <span className="absolute -top-2 left-3 bg-[#febd69] text-black text-xs font-bold px-1.5 rounded-full">
              {cartCount}
            </span>
            <ShoppingCart size={28} />
          </div>
          <span className="font-bold hidden sm:inline">Giỏ hàng</span>
        </div>
      </div>

      {/* Sub-Nav */}
      <div className="bg-[#232f3e] px-4 py-1 flex items-center gap-4 text-sm font-medium overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 cursor-pointer hover:border-white border border-transparent p-1 rounded" onClick={onGoHome}>
          <LayoutGrid size={18} />
          <span>Tất cả</span>
        </div>
        
        {/* Admin Dashboard - Demo Access */}
        {user?.role === 'ADMIN' && (
          <span 
              onClick={onOpenAdminDashboard}
              className="hover:border-white border border-transparent p-1 rounded cursor-pointer font-bold text-red-400 flex items-center gap-1"
              title="Dành cho Quản trị viên"
          >
              <Shield size={14} /> Admin
          </span>
        )}

        {/* Admin AI Tasks */}
        {user?.role === 'ADMIN' && (
          <span 
              onClick={onOpenAdminAITasks}
              className="hover:border-white border border-transparent p-1 rounded cursor-pointer font-bold text-purple-400 flex items-center gap-1"
              title="Quản lý AI Tasks"
          >
              <Sparkles size={14} /> AI Tasks
          </span>
        )}

        {/* Seller Channel Button */}
        <span 
            onClick={user ? onOpenSellerDashboard : onOpenAuth}
            className="hover:border-white border border-transparent p-1 rounded cursor-pointer font-bold text-white flex items-center gap-1"
        >
            <BarChart3 size={14} className="text-[#febd69]" /> Kênh Người Bán
        </span>

        {/* Avatar Studio - New */}
        <span 
            onClick={user ? onOpenAvatarStudio : onOpenAuth}
            className="hover:border-white border border-transparent p-1 rounded cursor-pointer font-bold text-purple-400 flex items-center gap-1"
        >
            <Bot size={14} /> Avatar Studio
        </span>

        {/* Community - New */}
        <span 
            onClick={onOpenCommunity}
            className="hover:border-white border border-transparent p-1 rounded cursor-pointer font-bold text-blue-400 flex items-center gap-1"
        >
            <Users size={14} /> Cộng đồng
        </span>

        {/* Store Discovery - New */}
        <span 
            onClick={onOpenStoreDiscovery}
            className="hover:border-white border border-transparent p-1 rounded cursor-pointer font-bold text-orange-400 flex items-center gap-1"
        >
            <LucideStore size={14} /> Tìm cửa hàng
        </span>

        {/* Menu Discovery - New */}
        <span 
            onClick={() => (window as any).onOpenMenuDiscovery?.()}
            className="hover:border-white border border-transparent p-1 rounded cursor-pointer font-bold text-blue-400 flex items-center gap-1"
        >
            <Utensils size={14} /> Thực đơn
        </span>

        {/* Store Registration - New */}
        <span 
            onClick={user ? onOpenStoreRegistration : onOpenAuth}
            className="hover:border-white border border-transparent p-1 rounded cursor-pointer font-bold text-emerald-400 flex items-center gap-1"
        >
            <PlusSquare size={14} /> Đăng ký cửa hàng
        </span>

        {/* Email Inbox - New */}
        <span 
            onClick={onOpenEmailInbox}
            className="hover:border-white border border-transparent p-1 rounded cursor-pointer font-bold text-green-400 flex items-center gap-1 relative"
        >
            <div className="relative">
              <Mail size={14} />
              {unreadEmails > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center border border-[#131921]">
                  {unreadEmails > 9 ? '9+' : unreadEmails}
                </span>
              )}
            </div>
            Hộp thư
        </span>

        <span 
            onClick={onViewLiveStreams}
            className="hover:border-white border border-transparent p-1 rounded cursor-pointer font-bold text-[#febd69] flex items-center gap-1"
        >
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Live Auctions
        </span>
        <span 
            onClick={user ? onOpenContentStudio : onOpenAuth}
            className="hover:border-white border border-transparent p-1 rounded cursor-pointer flex items-center gap-1 text-blue-300 font-bold"
        >
            <Sparkles size={14} /> Studio Sáng tạo (AI)
        </span>
        <span 
            onClick={user ? onOpenKOLStudio : onOpenAuth}
            className="hover:border-white border border-transparent p-1 rounded cursor-pointer flex items-center gap-1 text-purple-300 font-bold"
        >
            <Wand2 size={14} /> KOL Studio
        </span>
        <span 
            onClick={onOpenSuperDeals}
            className="hover:border-white border border-transparent p-1 rounded cursor-pointer text-red-400 font-bold flex items-center gap-1"
        >
            <Zap size={14} className="animate-pulse" /> Siêu Ưu Đãi
        </span>
        <span 
            onClick={onOpenCustomerService}
            className="hover:border-white border border-transparent p-1 rounded cursor-pointer"
        >
            Dịch vụ khách hàng
        </span>
      </div>
    </header>
  );
};

export default Navbar;