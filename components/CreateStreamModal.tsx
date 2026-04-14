
import React, { useState } from 'react';
import { X, Video, ShoppingBag, Gavel, CheckCircle2, Plus } from 'lucide-react';
import { Product, LiveStream, ItemType } from '../types';

interface CreateStreamModalProps {
  onClose: () => void;
  onStartStream: (streamData: Partial<LiveStream>) => void;
  onOpenSellModal: () => void; // New prop to open Sell Modal
  myProducts: Product[];
}

const CreateStreamModal: React.FC<CreateStreamModalProps> = ({ onClose, onStartStream, onOpenSellModal, myProducts = [] }) => {
  const [title, setTitle] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleStart = () => {
    if (!title.trim()) {
      setError('Vui lòng nhập tên phiên Live');
      return;
    }
    if (selectedProductIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 sản phẩm để gắn vào Live');
      return;
    }

    onStartStream({
      title,
      featuredProductIds: selectedProductIds,
      // Default mock data for new stream
      id: `stream_${Date.now()}`,
      viewerCount: 0,
      hostName: 'Bạn (Host)',
      hostAvatar: 'https://ui-avatars.com/api/?name=You&background=random',
      thumbnail: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&q=80&w=800',
      isLive: true
    });
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-5">
        
        <div className="bg-[#131921] p-5 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 p-2 rounded-lg">
                <Video size={24} />
            </div>
            <h2 className="text-xl font-bold">Thiết lập Live Stream</h2>
          </div>
          <button onClick={onClose} className="hover:bg-gray-700 p-2 rounded-full"><X size={24}/></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          
          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tiêu đề phiên Live</label>
            <input 
              className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-[#febd69] outline-none font-bold text-lg"
              placeholder="VD: Xả kho giá sốc cuối tuần..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Product Selector */}
          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase">Chọn sản phẩm từ kho của bạn</label>
                <div className="flex gap-2">
                    <button 
                        onClick={onOpenSellModal}
                        className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-full flex items-center gap-1 transition-colors"
                    >
                        <Plus size={12} /> Thêm SP mới
                    </button>
                    <span className="text-xs font-bold text-[#febd69] bg-[#131921] px-2 py-1 rounded-full">
                        Đã chọn: {selectedProductIds.length}
                    </span>
                </div>
            </div>
            
            {myProducts.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center">
                    <ShoppingBag size={32} className="mx-auto text-gray-300 mb-2"/>
                    <p className="text-gray-500 text-sm mb-3">Kho hàng trống. Bạn chưa có sản phẩm nào.</p>
                    <button 
                        onClick={onOpenSellModal}
                        className="bg-[#febd69] text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#f3a847] transition-all"
                    >
                        + Đăng bán ngay
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {myProducts.map(product => {
                        const isSelected = selectedProductIds.includes(product.id);
                        return (
                            <div 
                                key={product.id}
                                onClick={() => toggleProduct(product.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                    isSelected ? 'border-[#febd69] bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                                }`}
                            >
                                <img src={product.image} className="w-12 h-12 rounded bg-gray-100 object-cover" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{product.title}</p>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="font-bold">${product.price}</span>
                                        {product.type === ItemType.AUCTION ? (
                                            <span className="text-red-600 flex items-center gap-0.5"><Gavel size={10}/> Đấu giá</span>
                                        ) : (
                                            <span className="text-green-600 flex items-center gap-0.5"><ShoppingBag size={10}/> Mua ngay</span>
                                        )}
                                    </div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    isSelected ? 'border-[#febd69] bg-[#febd69] text-black' : 'border-gray-300'
                                }`}>
                                    {isSelected && <CheckCircle2 size={14} />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold flex items-center gap-2">
                <X size={14} /> {error}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
            <button onClick={onClose} className="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-200 rounded-lg">
                Hủy bỏ
            </button>
            <button 
                onClick={handleStart}
                className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 transition-all"
            >
                <Video size={18} /> Bắt đầu Live
            </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStreamModal;
