import React, { useState, useEffect } from 'react';
import { Zap, Clock } from 'lucide-react';
import { Product } from '../types';
import ProductCard from './ProductCard';

interface FlashSaleBannerProps {
  products: Product[];
  onAddToCart: (p: Product) => void;
  onPlaceBid: (p: Product) => void;
}

const FlashSaleBanner: React.FC<FlashSaleBannerProps> = ({ products, onAddToCart, onPlaceBid }) => {
  const flashSaleProducts = products.filter(p => p.isFlashSale);
  const [timeLeft, setTimeLeft] = useState<{ hours: number, minutes: number, seconds: number }>({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (flashSaleProducts.length === 0) return;
    
    // Use the first flash sale product's end time for the banner timer
    const endTime = new Date(flashSaleProducts[0].flashSaleEndTime || Date.now()).getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = endTime - now;

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [flashSaleProducts]);

  if (flashSaleProducts.length === 0) return null;

  return (
    <div className="mb-10 bg-white rounded-2xl overflow-hidden shadow-sm border border-orange-100">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 flex flex-col sm:flex-row justify-between items-center text-white">
        <div className="flex items-center gap-3 mb-3 sm:mb-0">
          <div className="bg-white/20 p-2 rounded-full animate-pulse">
            <Zap size={24} className="text-yellow-300 fill-yellow-300" />
          </div>
          <div>
            <h2 className="text-2xl font-black italic tracking-wider">FLASH SALE</h2>
            <p className="text-sm text-orange-100 font-medium">Giá sốc chớp nhoáng - Số lượng có hạn</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-orange-200" />
            <span className="text-sm font-medium text-orange-100 uppercase">Kết thúc trong</span>
          </div>
          <div className="flex gap-2 text-xl font-bold">
            <div className="bg-black/30 px-3 py-1.5 rounded-lg min-w-[48px] text-center backdrop-blur-sm">
              {timeLeft.hours.toString().padStart(2, '0')}
            </div>
            <span className="text-orange-200 py-1.5">:</span>
            <div className="bg-black/30 px-3 py-1.5 rounded-lg min-w-[48px] text-center backdrop-blur-sm">
              {timeLeft.minutes.toString().padStart(2, '0')}
            </div>
            <span className="text-orange-200 py-1.5">:</span>
            <div className="bg-black/30 px-3 py-1.5 rounded-lg min-w-[48px] text-center backdrop-blur-sm text-yellow-300">
              {timeLeft.seconds.toString().padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-orange-50/30">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {flashSaleProducts.map(product => (
            <div key={`flash-${product.id}`} className="relative group">
              {/* Flash Sale Badge */}
              <div className="absolute top-0 left-0 z-10 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-br-xl rounded-tl-xl shadow-md">
                -{Math.round((1 - (product.flashSalePrice || 0) / product.price) * 100)}%
              </div>
              
              <ProductCard 
                product={{
                  ...product,
                  price: product.flashSalePrice || product.price, // Override price for display
                  originalPrice: product.price
                }} 
                onAddToCart={onAddToCart}
                onPlaceBid={onPlaceBid} 
              />

              {/* Stock Progress Bar */}
              <div className="mt-3 px-1">
                <div className="flex justify-between text-[10px] text-gray-500 font-medium mb-1">
                  <span>Đã bán {product.sold}</span>
                  <span>Còn {product.stock}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-orange-400 to-red-500 h-1.5 rounded-full" 
                    style={{ width: `${((product.sold || 0) / ((product.sold || 0) + (product.stock || 1))) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlashSaleBanner;
