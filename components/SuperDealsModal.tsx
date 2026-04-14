
import React, { useState, useEffect } from 'react';
import { X, Clock, Zap, Flame, ShoppingCart, Percent, Tag, ArrowRight } from 'lucide-react';
import { Product } from '../types';

interface SuperDealsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCart: (p: Product) => void;
}

const SuperDealsModal: React.FC<SuperDealsModalProps> = ({ isOpen, onClose, products, onAddToCart }) => {
  const [timeLeft, setTimeLeft] = useState(10800); // 3 hours in seconds

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateDiscount = (original: number, current: number) => {
    return Math.round(((original - current) / original) * 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-[#f3f4f6] w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 border-4 border-[#febd69]">
        
        {/* Header - Flash Sale Banner */}
        <div className="bg-gradient-to-r from-red-600 to-orange-500 p-6 text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
                <Zap size={120} fill="currentColor" />
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 hover:bg-white/20 p-2 rounded-full transition-colors z-10">
                <X size={24} />
            </button>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-2 animate-pulse">
                        <Flame className="text-yellow-300" fill="currentColor"/>
                        <span className="font-black text-yellow-300 tracking-widest text-sm uppercase">Siêu ưu đãi độc quyền</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter">
                        FLASH <span className="text-[#131921] bg-[#febd69] px-2 skew-x-[-10deg] inline-block">SALE</span>
                    </h2>
                    <p className="text-red-100 mt-2 font-medium">Giảm giá lên đến 50%. Săn ngay kẻo lỡ!</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl flex items-center gap-4 shadow-lg">
                    <div className="text-right">
                        <p className="text-xs text-red-100 font-bold uppercase tracking-wider">Kết thúc sau</p>
                        <p className="text-3xl font-black font-mono tracking-widest">{formatTime(timeLeft)}</p>
                    </div>
                    <Clock size={32} className="text-white animate-spin-slow" />
                </div>
            </div>
        </div>

        {/* Content - Grid */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Tag size={48} className="mb-2 opacity-50"/>
                    <p>Hiện không có sản phẩm nào đang giảm giá.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map(product => {
                        const originalPrice = product.originalPrice || product.price * 1.2;
                        const discount = calculateDiscount(originalPrice, product.price);
                        const savedAmount = originalPrice - product.price;

                        return (
                            <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all hover:-translate-y-1">
                                <div className="relative aspect-square overflow-hidden bg-gray-100">
                                    <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    
                                    {/* Discount Badge */}
                                    <div className="absolute top-0 right-0 bg-red-600 text-white font-black text-lg px-3 py-2 rounded-bl-2xl shadow-md z-10 flex flex-col items-center leading-none">
                                        <span>{discount}%</span>
                                        <span className="text-[10px] font-medium uppercase">OFF</span>
                                    </div>

                                    {/* Stock Bar Mockup */}
                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                                        <div className="w-full bg-gray-600 rounded-full h-1.5 mb-1 overflow-hidden">
                                            <div className="bg-[#febd69] h-full rounded-full w-[85%]"></div>
                                        </div>
                                        <p className="text-[10px] text-gray-300 font-bold flex justify-between">
                                            <span>Đã bán 85%</span>
                                            <span className="text-[#febd69]">Sắp hết!</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 flex flex-col h-[180px]">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">{product.title}</h3>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
                                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Tiết kiệm ${savedAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm font-bold text-red-600">$</span>
                                            <span className="text-3xl font-black text-red-600">{Math.floor(product.price)}</span>
                                            <span className="text-sm font-bold text-red-600">.{ (product.price % 1).toFixed(2).substring(2) }</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => {
                                            onAddToCart(product);
                                            // Optional: Close modal after add or show toast
                                        }}
                                        className="w-full bg-[#131921] text-white font-bold py-3 rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        <ShoppingCart size={18} className="text-[#febd69]" /> Thêm vào giỏ
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-100 p-4 flex justify-between items-center text-xs text-gray-500 shrink-0">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><Zap size={14} className="text-[#febd69]"/> Giao hàng nhanh 2h</span>
                <span className="flex items-center gap-1"><Percent size={14} className="text-[#febd69]"/> Cam kết giá rẻ nhất</span>
            </div>
            <button onClick={onClose} className="font-bold hover:text-black flex items-center gap-1">
                Đóng cửa sổ <ArrowRight size={14}/>
            </button>
        </div>
      </div>
    </div>
  );
};

export default SuperDealsModal;
