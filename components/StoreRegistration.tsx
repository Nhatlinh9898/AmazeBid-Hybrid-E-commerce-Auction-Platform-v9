import React, { useState, useRef } from 'react';
import { Store as LucideStore, MapPin, Clock, Plus, X, Utensils, Coffee, ShoppingBag, CheckCircle2, Sparkles, Loader2, Trash2, Laptop, BookOpen, Wrench, Camera } from 'lucide-react';
import { storeService } from '../services/StoreService';
import { useAuth } from '../context/useAuth';
import { aiStoreService } from '../services/aiStoreService';
import { StoreMenuItem } from '../types';

interface StoreRegistrationProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const StoreRegistration: React.FC<StoreRegistrationProps> = ({ onClose, onSuccess = () => {} }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingMenuFromImage, setIsGeneratingMenuFromImage] = useState(false);
  const menuImageInputRef = useRef<HTMLInputElement>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAiGenerateMenuFromImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsGeneratingMenuFromImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const menuItems = await aiStoreService.generateStoreMenuFromImage(base64Data, file.type);
          const formattedMenu: StoreMenuItem[] = menuItems.map((item: any, idx: number) => ({
            id: `menu-${Date.now()}-${idx}`,
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            image: `https://picsum.photos/seed/${item.name}/400/300`,
            isAvailable: true
          }));
          setFormData(prev => ({ ...prev, menu: [...prev.menu, ...formattedMenu] }));
        } catch (error) {
          console.error(error);
          alert('Không thể tạo menu từ ảnh này. Vui lòng thử lại.');
        } finally {
          setIsGeneratingMenuFromImage(false);
          if (menuImageInputRef.current) {
            menuImageInputRef.current.value = '';
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    category: 'FOOD' as 'FOOD' | 'DRINK' | 'FASHION' | 'ELECTRONICS' | 'BEAUTY' | 'BOOKS' | 'SERVICES' | 'OTHER',
    openingHours: '08:00 - 22:00',
    images: [] as string[],
    menu: [] as StoreMenuItem[]
  });

  const handleAiGenerateInfo = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const info = await aiStoreService.generateStoreInfo(aiPrompt);
      setFormData(prev => ({
        ...prev,
        name: info.name,
        description: info.description,
        category: info.category,
        openingHours: info.openingHours
      }));
      setShowAiInput(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiGenerateMenu = async () => {
    setIsGenerating(true);
    try {
      const menuItems = await aiStoreService.generateStoreMenu(formData.name, formData.category, formData.description);
      const formattedMenu: StoreMenuItem[] = menuItems.map((item: any, idx: number) => ({
        id: `menu-${Date.now()}-${idx}`,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: `https://picsum.photos/seed/${item.name}/400/300`,
        isAvailable: true
      }));
      setFormData(prev => ({ ...prev, menu: [...prev.menu, ...formattedMenu] }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiGenerateDescription = async () => {
    if (!formData.name) {
      alert('Vui lòng nhập tên cửa hàng trước khi tạo mô tả AI');
      return;
    }
    setIsGeneratingDescription(true);
    try {
      const description = await aiStoreService.generateStoreDescription(formData.name, formData.category);
      if (description) {
        setFormData(prev => ({ ...prev, description }));
      }
    } catch (error) {
      console.error(error);
      alert('Không thể tạo mô tả AI. Vui lòng thử lại.');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    storeService.createStore({
      ownerId: user.id,
      name: formData.name,
      description: formData.description,
      address: formData.address,
      category: formData.category,
      images: formData.images.length > 0 ? formData.images : ['https://picsum.photos/seed/store/800/600'],
      openingHours: formData.openingHours,
      latitude: 21.0285, // Default Hanoi
      longitude: 105.8542,
      menu: formData.menu
    });

    setStep(4);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, images: [...prev.images, reader.result as string] }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiGenerateImage = async () => {
    if (!formData.name || !formData.category) {
      alert('Vui lòng nhập tên và chọn loại cửa hàng trước khi tạo ảnh AI');
      return;
    }
    setIsGeneratingImage(true);
    try {
      // Use aiStoreService or a direct call to generate image
      // For now, we simulate AI generation with a specific seed based on store name
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiImageUrl = `https://picsum.photos/seed/${encodeURIComponent(formData.name + Date.now())}/800/600`;
      setFormData(prev => ({ ...prev, images: [...prev.images, aiImageUrl] }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const removeMenuItem = (id: string) => {
    setFormData(prev => ({ ...prev, menu: prev.menu.filter(m => m.id !== id) }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <LucideStore className="w-6 h-6 text-blue-600" /> Đăng Ký Cửa Hàng Vật Lý
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {step < 4 && (
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${
                    step >= s ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {s}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    step >= s ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {s === 1 ? 'Thông tin' : s === 2 ? 'Hình ảnh' : s === 3 ? 'Thực đơn' : 'Hoàn tất'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Thông tin cơ bản</label>
                <button 
                  onClick={() => setShowAiInput(!showAiInput)}
                  className="flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4" /> AI Assistant
                </button>
              </div>

              {showAiInput && (
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
                  <p className="text-xs text-blue-600 font-bold">Mô tả cửa hàng của bạn để AI tự động điền thông tin:</p>
                  <textarea 
                    className="w-full p-3 bg-white border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ví dụ: Tôi muốn mở một quán cà phê phong cách vintage tại Hà Nội, chuyên phục vụ cà phê trứng và bánh ngọt..."
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                  />
                  <button 
                    onClick={handleAiGenerateInfo}
                    disabled={isGenerating || !aiPrompt}
                    className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Tự động tạo thông tin
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tên cửa hàng</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Ví dụ: Tiệm Cà Phê Tháng 10"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Loại hình kinh doanh</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'FOOD', label: 'Đồ ăn', icon: <Utensils className="w-4 h-4" /> },
                      { id: 'DRINK', label: 'Đồ uống', icon: <Coffee className="w-4 h-4" /> },
                      { id: 'FASHION', label: 'Thời trang', icon: <ShoppingBag className="w-4 h-4" /> },
                      { id: 'ELECTRONICS', label: 'Điện tử', icon: <Laptop className="w-4 h-4" /> },
                      { id: 'BEAUTY', label: 'Làm đẹp', icon: <Sparkles className="w-4 h-4" /> },
                      { id: 'BOOKS', label: 'Sách', icon: <BookOpen className="w-4 h-4" /> },
                      { id: 'SERVICES', label: 'Dịch vụ', icon: <Wrench className="w-4 h-4" /> },
                      { id: 'OTHER', label: 'Khác', icon: <LucideStore className="w-4 h-4" /> }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category: cat.id as any }))}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                          formData.category === cat.id 
                            ? 'border-blue-600 bg-blue-50 text-blue-600' 
                            : 'border-gray-100 hover:border-blue-200 text-gray-400'
                        }`}
                      >
                        {cat.icon}
                        <span className="text-[10px] font-black uppercase">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Địa chỉ cửa hàng</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      required
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Số nhà, tên đường, quận/huyện..."
                      value={formData.address}
                      onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Giờ mở cửa</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      required
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Ví dụ: 08:00 - 22:00"
                      value={formData.openingHours}
                      onChange={e => setFormData(prev => ({ ...prev, openingHours: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Mô tả cửa hàng</label>
                    <button 
                      onClick={handleAiGenerateDescription}
                      disabled={isGeneratingDescription || !formData.name}
                      className="flex items-center gap-1 text-[10px] font-black text-purple-600 hover:text-purple-700 transition-colors disabled:opacity-50"
                    >
                      {isGeneratingDescription ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      AI Viết Mô Tả
                    </button>
                  </div>
                  <textarea 
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                    placeholder="Giới thiệu về cửa hàng của bạn..."
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.address}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:shadow-none"
              >
                Tiếp tục
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Hình ảnh cửa hàng</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group">
                      <img src={img} alt="Store" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*,video/*" 
                    capture="environment"
                    className="hidden" 
                  />
                  
                  <button 
                    onClick={addImage}
                    className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-all bg-gray-50 hover:bg-blue-50"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase text-center px-2">Chụp / Tải ảnh lên</span>
                  </button>

                  <button 
                    onClick={handleAiGenerateImage}
                    disabled={isGeneratingImage}
                    className="aspect-square rounded-2xl border-2 border-dashed border-purple-200 flex flex-col items-center justify-center gap-2 text-purple-400 hover:border-purple-500 hover:text-purple-500 transition-all bg-purple-50 hover:bg-purple-100 disabled:opacity-50"
                  >
                    {isGeneratingImage ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                    <span className="text-[10px] font-black uppercase text-center px-2">AI Tạo Ảnh</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all"
                >
                  Quay lại
                </button>
                <button 
                  onClick={() => setStep(3)}
                  className="flex-2 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
                >
                  Tiếp tục
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Thực đơn / Sản phẩm</label>
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    ref={menuImageInputRef} 
                    onChange={handleAiGenerateMenuFromImage} 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                  />
                  <button 
                    onClick={() => menuImageInputRef.current?.click()}
                    disabled={isGeneratingMenuFromImage}
                    className="flex items-center gap-2 text-xs font-black text-purple-600 hover:text-purple-700 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingMenuFromImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    Quét Menu
                  </button>
                  <button 
                    onClick={handleAiGenerateMenu}
                    disabled={isGenerating}
                    className="flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    AI Generate Menu
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {formData.menu.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                    <p className="text-sm text-gray-400 font-bold">Chưa có món nào trong thực đơn</p>
                    <p className="text-xs text-gray-300">Sử dụng AI hoặc thêm thủ công</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {formData.menu.map(item => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl group">
                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-gray-900">{item.name}</h4>
                          <p className="text-xs text-gray-500 font-black text-blue-600">{item.price.toLocaleString()} đ</p>
                        </div>
                        <button 
                          onClick={() => removeMenuItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const name = prompt('Tên món:');
                    if (!name) return;
                    const priceStr = prompt('Giá (VND):');
                    if (!priceStr) return;
                    const price = parseInt(priceStr);
                    if (isNaN(price)) {
                      alert('Giá phải là một số hợp lệ.');
                      return;
                    }
                    setFormData(prev => ({
                      ...prev,
                      menu: [...prev.menu, {
                        id: `menu-${Date.now()}`,
                        name,
                        description: '',
                        price: price,
                        category: 'GENERAL',
                        image: `https://picsum.photos/seed/${name}/400/300`,
                        isAvailable: true
                      }]
                    }));
                  }}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-black text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Thêm món thủ công
                </button>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(2)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all"
                >
                  Quay lại
                </button>
                <button 
                  onClick={handleSubmit}
                  className="flex-2 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
                >
                  Hoàn tất đăng ký
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="py-12 text-center space-y-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-600 animate-bounce" />
              </div>
              <h2 className="text-3xl font-black text-gray-900">Đăng Ký Thành Công!</h2>
              <p className="text-gray-500">Cửa hàng của bạn đã được tạo. Bạn có thể bắt đầu quản lý cửa hàng ngay bây giờ.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
