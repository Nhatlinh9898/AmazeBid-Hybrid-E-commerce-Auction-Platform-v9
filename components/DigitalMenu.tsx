import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Loader2, Utensils, Coffee, ShoppingBag, Star, MapPin, Plus, Smartphone, Sparkles, BookOpen, Briefcase, LayoutGrid } from 'lucide-react';
import { storeService } from '../services/StoreService';
import { PhysicalStore, StoreMenuItem } from '../types';

const getCategoryConfig = (category: string) => {
  switch (category) {
    case 'FOOD':
      return { title: 'Thực đơn món ăn', icon: Utensils };
    case 'DRINK':
      return { title: 'Menu đồ uống', icon: Coffee };
    case 'FASHION':
      return { title: 'Bộ sưu tập thời trang', icon: ShoppingBag };
    case 'ELECTRONICS':
      return { title: 'Danh mục thiết bị', icon: Smartphone };
    case 'BEAUTY':
      return { title: 'Dịch vụ làm đẹp', icon: Sparkles };
    case 'BOOKS':
      return { title: 'Danh mục sách', icon: BookOpen };
    case 'SERVICES':
      return { title: 'Danh mục dịch vụ', icon: Briefcase };
    default:
      return { title: 'Danh mục sản phẩm', icon: LayoutGrid };
  }
};

interface DigitalMenuProps {
  storeId: string;
  onClose: () => void;
  onAddToCart: (item: StoreMenuItem) => void;
}

export const DigitalMenu: React.FC<DigitalMenuProps> = ({ storeId, onClose, onAddToCart }) => {
  const [store, setStore] = useState<PhysicalStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    const fetchStore = async () => {
      setLoading(true);
      try {
        const data = await storeService.getStoreById(storeId);
        setStore(data);
      } catch (error) {
        console.error('Error fetching store menu:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [storeId]);

  const categories = useMemo(() => {
    if (!store) return ['All'];
    return ['All', ...Array.from(new Set(store.menu.map(item => item.category)))];
  }, [store]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[400] bg-[#fdfcf8] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#5A5A40] animate-spin mx-auto mb-4" />
          <p className="font-serif italic text-[#5A5A40]">Đang chuẩn bị thực đơn...</p>
        </div>
      </div>
    );
  }

  if (!store) return null;

  const config = getCategoryConfig(store.category);
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[400] bg-[#fdfcf8] overflow-y-auto font-sans text-[#1a1a1a]">
      {/* Hero Section */}
      <div className="relative h-[40vh] w-full">
        <img src={store.images[0]} alt={store.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="absolute bottom-10 left-8 right-8 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-[#5A5A40] rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Icon size={12} />
              {config.title}
            </span>
            <div className="flex items-center gap-1 text-xs font-bold">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {store.rating}
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif italic mb-2">{store.name}</h1>
          <div className="flex items-center gap-2 text-sm opacity-80">
            <MapPin className="w-4 h-4" /> {store.address}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-10">
        <div className="bg-white rounded-t-[40px] p-8 shadow-2xl border-x border-t border-[#eee]">
          {/* Category Filter */}
          <div className="flex gap-4 overflow-x-auto pb-6 mb-8 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat 
                    ? 'bg-[#5A5A40] text-white shadow-lg' 
                    : 'bg-[#f5f5f0] text-[#5A5A40] hover:bg-[#e5e5df]'
                }`}
              >
                {cat === 'All' ? 'Tất cả' : cat}
              </button>
            ))}
          </div>

          {/* Menu Items */}
          <div className="space-y-12">
            {categories.filter(c => c !== 'All').map(cat => {
              const items = store.menu.filter(i => i.category === cat);
              if (items.length === 0 && activeCategory !== 'All') return null;
              if (activeCategory !== 'All' && activeCategory !== cat) return null;

              return (
                <div key={cat} className="space-y-6">
                  <h2 className="text-2xl font-serif italic text-[#5A5A40] border-b border-[#eee] pb-2">
                    {cat}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {items.map(item => (
                      <div key={item.id} className="flex gap-4 group">
                        <div className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden shadow-md">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="font-bold text-lg group-hover:text-[#5A5A40] transition-colors">{item.name}</h3>
                              <span className="font-serif italic font-bold text-[#5A5A40]">{item.price.toLocaleString()}đ</span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.description}</p>
                          </div>
                          <button 
                            onClick={() => onAddToCart(item)}
                            className="mt-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#5A5A40] hover:text-[#3d3d2b] transition-colors"
                          >
                            <Plus className="w-3 h-3" /> Thêm vào đơn
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-20 pt-10 border-t border-[#eee] text-center">
            <p className="font-serif italic text-gray-400 text-sm">
              Cảm ơn quý khách đã ghé thăm {store.name}
            </p>
            <div className="flex justify-center gap-4 mt-4 opacity-30">
              <Utensils className="w-4 h-4" />
              <Coffee className="w-4 h-4" />
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
