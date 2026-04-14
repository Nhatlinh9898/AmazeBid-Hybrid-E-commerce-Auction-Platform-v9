
import React, { useState, useEffect } from 'react';
import { Star, Clock, Gavel, ShoppingCart, ExternalLink, Link2, Smartphone, MessageSquare, ShieldAlert, X } from 'lucide-react';
import { Product, ItemType } from '../types';
import ARTryOnModal from './ARTryOnModal';
import { AISalesAssistant } from './AISalesAssistant';

interface ProductCardProps {
  product: Product;
  onAddToCart: (p: Product) => void;
  onPlaceBid: (p: Product) => void;
  onChatWithSeller?: (sellerId: string, sellerName: string, sellerAvatar: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onPlaceBid, onChatWithSeller }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isARModalOpen, setIsARModalOpen] = useState(false);
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);

  useEffect(() => {
    if (product.type === ItemType.AUCTION && product.endTime) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const end = new Date(product.endTime!).getTime();
        const diff = end - now;

        if (diff <= 0) {
          setTimeLeft('Ended');
          clearInterval(timer);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${hours}h ${mins}m ${secs}s`);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [product]);

  const handleAction = () => {
    if (product.isAffiliate && product.affiliateLink) {
        window.open(product.affiliateLink, '_blank');
    } else if (product.type === ItemType.FIXED_PRICE) {
        onAddToCart(product);
    } else {
        onPlaceBid(product);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded p-4 hover:shadow-lg transition-shadow flex flex-col group h-full">
      <div className="relative overflow-hidden aspect-square mb-3 bg-gray-50 rounded">
        <img 
          src={product.image} 
          alt={product.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.type === ItemType.AUCTION && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
            <Clock size={10} /> ĐANG ĐẤU GIÁ
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {product.isAffiliate && (
            <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
              <Link2 size={10} /> {product.platformName || 'Affiliate'}
            </div>
          )}
          {product.privacyMode && (
            <div className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
              <ShieldAlert size={10} /> Bảo mật
            </div>
          )}
        </div>
        
        {/* AR Try-on Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); setIsARModalOpen(true); }}
          className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm text-gray-800 text-[10px] font-bold px-2 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 translate-y-2 group-hover:translate-y-0"
        >
          <Smartphone size={12} /> Thử AR
        </button>
      </div>

      <h3 className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-orange-600 cursor-pointer mb-1 h-10 leading-tight">
        {product.title}
      </h3>

      <div className="flex items-center mb-1">
        <div className="flex items-center text-[#febd69]">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={14} fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'} />
          ))}
        </div>
        <span className="text-xs text-blue-600 ml-1 hover:text-orange-600 cursor-pointer">
          {product.reviewCount.toLocaleString()}
        </span>
      </div>

      <div className="mt-auto">
        {/* Chat with Seller Button */}
        {!product.isAffiliate && onChatWithSeller && (
          <button 
            onClick={(e) => { e.stopPropagation(); onChatWithSeller(product.sellerId, product.sellerName || 'Người bán', product.sellerAvatar || ''); }}
            className="w-full mb-2 flex items-center justify-center gap-2 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors py-1 border border-blue-100 rounded-lg hover:bg-blue-50"
          >
            <MessageSquare size={12} /> Chat với người bán
          </button>
        )}

        {product.type === ItemType.FIXED_PRICE ? (
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold self-start mt-1">$</span>
              <span className="text-xl font-bold">{Math.floor(product.price)}</span>
              <span className="text-xs font-bold">{(product.price % 1).toFixed(2).substring(2)}</span>
            </div>
            
            {product.isAffiliate ? (
                // Affiliate Action
                <>
                    <p className="text-xs text-blue-500 mb-4 truncate">
                        Được bán bởi {product.platformName}
                    </p>
                    <button 
                        onClick={handleAction}
                        className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs py-2 rounded-full font-medium flex items-center justify-center gap-2 shadow-sm transition-colors"
                    >
                        <ExternalLink size={14} /> Mua tại {product.platformName || 'Shop'}
                    </button>
                </>
            ) : (
                // Normal Buy Action
                <>
                    <p className="text-xs text-gray-500 mb-4">Giao hàng miễn phí</p>
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={handleAction}
                            className="w-full bg-[#ffd814] hover:bg-[#f7ca00] text-black text-xs py-2 rounded-full font-medium flex items-center justify-center gap-2 shadow-sm"
                        >
                            <ShoppingCart size={14} /> Thêm vào giỏ
                        </button>
                        {product.isNegotiable && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsNegotiationOpen(true); }}
                                className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs py-2 rounded-full font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                            >
                                <Sparkles size={14} /> Mặc cả với AI
                            </button>
                        )}
                    </div>
                </>
            )}
          </div>
        ) : (
            // Auction Action
          <div className="bg-gray-50 p-2 rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-gray-500 uppercase font-bold">Giá hiện tại</span>
              <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                <Clock size={12} /> {timeLeft}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-lg font-bold text-red-600">${product.currentBid?.toFixed(2)}</span>
              <span className="text-[10px] text-gray-500">({product.bidCount} lượt trả)</span>
            </div>
            <button 
              onClick={handleAction}
              className="w-full bg-[#131921] hover:bg-black text-white text-xs py-2 rounded-full font-medium flex items-center justify-center gap-2"
            >
              <Gavel size={14} /> Trả giá ngay
            </button>
          </div>
        )}
      </div>

      {/* AR Try-on Modal */}
      <ARTryOnModal 
        isOpen={isARModalOpen} 
        onClose={() => setIsARModalOpen(false)} 
        product={product} 
      />

      {/* AI Sales Assistant (Negotiation) */}
      {isNegotiationOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsNegotiationOpen(false)} />
            <div className="relative w-full max-w-md">
                <AISalesAssistant 
                    product={product} 
                    onNegotiationSuccess={(finalPrice) => {
                        // In a real app, we'd update the cart or product price for this user
                        console.log('Negotiated price:', finalPrice);
                    }}
                />
                <button 
                    onClick={() => setIsNegotiationOpen(false)}
                    className="absolute -top-12 right-0 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors"
                >
                    <X size={24} />
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
