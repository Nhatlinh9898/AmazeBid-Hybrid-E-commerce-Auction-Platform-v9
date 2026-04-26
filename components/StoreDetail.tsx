import React from 'react';
import { MapPin, Star, Clock, ChevronLeft, ShoppingBag, Plus, Minus, QrCode, CreditCard, CheckCircle2, Info, Loader2, X, Utensils, Printer } from 'lucide-react';
import { PhysicalStore, StoreMenuItem } from '../types';
import { storeService } from '../services/StoreService';

interface StoreDetailProps {
  storeId: string;
  onClose: () => void;
}

const StoreDetail: React.FC<StoreDetailProps> = ({ storeId, onClose }) => {
  const [store, setStore] = React.useState<PhysicalStore | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [cart, setCart] = React.useState<{item: StoreMenuItem, quantity: number}[]>([]);
  const [showPayment, setShowPayment] = React.useState(false);
  const [paymentSuccess, setPaymentSuccess] = React.useState(false);
  const [lastOrder, setLastOrder] = React.useState<{items: {item: StoreMenuItem, quantity: number}[], total: number} | null>(null);

  const transactionId = React.useMemo(() => Math.random().toString(36).substring(2, 10).toUpperCase(), []);

  React.useEffect(() => {
    const fetchStore = async () => {
      setLoading(true);
      try {
        const data = await storeService.getStoreById(storeId);
        setStore(data);
      } catch (error) {
        console.error('Error fetching store:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [storeId]);

  const [activeTab, setActiveTab] = React.useState<'menu' | 'reviews' | 'info'>('menu');

  const categories = React.useMemo(() => {
    if (!store) return [];
    return Array.from(new Set(store.menu.map(item => item.category)));
  }, [store]);

  const addToCart = (item: StoreMenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.item.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.item.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.item.id !== itemId);
    });
  };

  const totalAmount = cart.reduce((sum, i) => sum + (i.item.price * i.quantity), 0);

  const handlePayment = () => {
    // Save order for printing
    setLastOrder({
      items: [...cart],
      total: totalAmount
    });
    
    // Simulate payment
    setTimeout(() => {
      setPaymentSuccess(true);
      setCart([]);
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[300] bg-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="fixed inset-0 z-[300] bg-white flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold mb-4">Không tìm thấy cửa hàng</h2>
        <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-xl">Quay lại</button>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="fixed inset-0 z-[300] bg-white overflow-y-auto">
        <div className="max-w-2xl mx-auto p-8 text-center pt-20 print:hidden">
          <div className="bg-white rounded-3xl p-12 shadow-2xl border border-green-50">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">Thanh Toán Thành Công!</h2>
            <p className="text-gray-500 mb-8">Cảm ơn bạn đã mua hàng tại <strong>{store.name}</strong>. Vui lòng đưa màn hình này cho nhân viên để nhận hàng.</p>
            
            <div className="bg-gray-50 p-6 rounded-2xl mb-8 text-left">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400 text-sm">Mã giao dịch:</span>
                <span className="font-mono font-bold">#TXN-{transactionId}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-gray-400 text-sm">Thời gian:</span>
                <span className="font-bold text-sm">{new Date().toLocaleString('vi-VN')}</span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Tổng thanh toán:</span>
                  <span className="text-xl font-black text-blue-600">{(lastOrder?.total || 0).toLocaleString()} đ</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handlePrint}
                className="py-4 bg-gray-100 text-gray-900 rounded-2xl font-black hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" /> In hóa đơn
              </button>
              <button 
                onClick={onClose}
                className="py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                Xong
              </button>
            </div>
          </div>
        </div>

        {/* Printable Invoice (Hidden by default, shown only during print) */}
        <div className="hidden print:block p-8 text-black bg-white min-h-screen font-sans">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black uppercase mb-1">{store.name}</h1>
            <p className="text-sm">{store.address}</p>
            <p className="text-sm">SĐT: {store.phone || 'N/A'}</p>
            <div className="my-4 border-b-2 border-black border-dashed" />
            <h2 className="text-xl font-bold uppercase">HÓA ĐƠN THANH TOÁN</h2>
            <p className="text-xs mt-1">Mã: #TXN-{transactionId}</p>
            <p className="text-xs">Ngày: {new Date().toLocaleString('vi-VN')}</p>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-xs font-bold border-b border-black pb-1">
              <span className="w-1/2">Tên món</span>
              <span className="w-1/6 text-center">SL</span>
              <span className="w-1/3 text-right">Thành tiền</span>
            </div>
            {lastOrder?.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="w-1/2">{item.item.name}</span>
                <span className="w-1/6 text-center">{item.quantity}</span>
                <span className="w-1/3 text-right">{((item.item.price || 0) * (item.quantity || 0)).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-black border-dashed pt-4 space-y-1">
            <div className="flex justify-between font-bold">
              <span>TỔNG CỘNG:</span>
              <span>{(lastOrder?.total || 0).toLocaleString()} đ</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Hình thức:</span>
              <span>Thanh toán trực tuyến</span>
            </div>
          </div>

          <div className="mt-12 text-center text-xs italic">
            <p>Cảm ơn quý khách. Hẹn gặp lại!</p>
            <p className="mt-2 font-bold">Powered by AmazeBid</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] bg-white overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4 pt-20 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-bold transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Quay lại
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Store Info & Menu */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div className="relative h-80 rounded-3xl overflow-hidden shadow-xl">
              <img src={store.images[0]} alt={store.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {store.category}
                  </span>
                  <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {store.rating} ({store.reviewCount} đánh giá)
                  </div>
                </div>
                <h1 className="text-4xl font-black text-white mb-2">{store.name}</h1>
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-red-400" /> {store.address}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-green-400" /> {store.openingHours}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-gray-100 mb-8">
              {(['menu', 'reviews', 'info'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${
                    activeTab === tab ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab === 'menu' ? 'Thực đơn' : tab === 'reviews' ? 'Đánh giá' : 'Thông tin'}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'menu' && (
              <div className="space-y-12">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                    <ShoppingBag className="w-6 h-6 text-blue-600" /> Thực đơn / Sản phẩm
                  </h2>
                  <button 
                    onClick={() => (window as any).onOpenDigitalMenu?.(store.id)}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors flex items-center gap-2"
                  >
                    <Utensils className="w-4 h-4" /> Xem menu đầy đủ
                  </button>
                </div>

                {categories.map(cat => (
                  <div key={cat} className="space-y-6">
                    <h3 className="text-lg font-black text-gray-900 border-l-4 border-blue-600 pl-4">
                      {cat}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {store.menu.filter(i => i.category === cat).map(item => (
                        <div key={item.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all flex gap-4">
                          <img src={item.image} alt={item.name} className="w-24 h-24 rounded-xl object-cover shrink-0" />
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-gray-900">{item.name}</h4>
                              <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-black text-blue-600">{(item.price || 0).toLocaleString()} đ</span>
                              <button 
                                onClick={() => addToCart(item)}
                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'info' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-500" /> Giới thiệu
                  </h2>
                  <p className="text-gray-600 leading-relaxed">{store.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h4 className="font-bold text-gray-900 mb-2">Địa chỉ</h4>
                    <p className="text-sm text-gray-600">{store.address}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h4 className="font-bold text-gray-900 mb-2">Giờ mở cửa</h4>
                    <p className="text-sm text-gray-600">{store.openingHours}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="text-4xl font-black text-gray-900">{store.rating}</div>
                    <div className="flex items-center gap-1 text-yellow-400 my-1">
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                      {store.reviewCount} Đánh giá
                    </div>
                  </div>
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100">
                    Viết đánh giá
                  </button>
                </div>

                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100" />
                          <div>
                            <div className="font-bold text-gray-900">Người dùng {i}</div>
                            <div className="text-xs text-gray-400">2 ngày trước</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-xs font-bold">5.0</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Sản phẩm tuyệt vời, dịch vụ rất tốt. Tôi sẽ quay lại ủng hộ cửa hàng lần sau!
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cart & Payment */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sticky top-24">
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" /> Đơn hàng của bạn
              </h3>

              {cart.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <p className="text-sm">Chưa có món nào trong giỏ hàng</p>
                  <p className="text-xs mt-1">Chọn món từ menu để bắt đầu</p>
                </div>
              ) : (
                <div className="space-y-4 mb-8">
                  {cart.map(item => (
                    <div key={item.item.id} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="text-sm font-bold text-gray-800 truncate">{item.item.name}</h4>
                        <p className="text-xs text-gray-400">{(item.item.price || 0).toLocaleString()} đ</p>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50 px-3 py-1 rounded-full">
                        <button onClick={() => removeFromCart(item.item.id)} className="text-gray-400 hover:text-red-500">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                        <button onClick={() => addToCart(item.item)} className="text-gray-400 hover:text-blue-500">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-gray-500 font-bold">Tổng cộng</span>
                      <span className="text-2xl font-black text-blue-600">{(totalAmount || 0).toLocaleString()} đ</span>
                    </div>

                    {!showPayment ? (
                      <button 
                        onClick={() => setShowPayment(true)}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                      >
                        Tiến hành thanh toán
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                          <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <QrCode className="w-4 h-4" /> Quét mã tại quầy
                          </h4>
                          <div className="bg-white p-4 rounded-xl flex justify-center mb-3">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PAYMENT:${store.id}:${totalAmount}`} 
                              alt="Payment QR"
                              className="w-32 h-32"
                            />
                          </div>
                          <p className="text-[10px] text-blue-600 text-center font-medium">
                            Vui lòng quét mã này tại quầy thu ngân hoặc nhấn nút bên dưới để thanh toán trực tuyến
                          </p>
                        </div>
                        
                        <button 
                          onClick={handlePayment}
                          className="w-full py-4 bg-green-600 text-white rounded-2xl font-black shadow-xl shadow-green-200 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-5 h-5" /> Thanh toán trực tuyến
                        </button>
                        
                        <button 
                          onClick={() => setShowPayment(false)}
                          className="w-full py-2 text-gray-400 text-xs font-bold hover:text-gray-600"
                        >
                          Thay đổi đơn hàng
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreDetail;
