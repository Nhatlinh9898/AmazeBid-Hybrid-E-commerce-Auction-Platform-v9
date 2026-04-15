import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Star, Clock, ChevronRight, ChevronLeft, ChevronDown, Store as LucideStore, Utensils, Coffee, ShoppingBag, Laptop, Sparkles, BookOpen, Wrench, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { storeService } from '../services/StoreService';
import { PhysicalStore } from '../types';

interface StoreDiscoveryProps {
  onSelectStore: (store: PhysicalStore) => void;
  onViewMenu?: (store: PhysicalStore) => void;
}

export const StoreDiscovery: React.FC<StoreDiscoveryProps> = ({ onSelectStore, onViewMenu }) => {
  const [stores, setStores] = useState<PhysicalStore[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showDropdown, setShowDropdown] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const categories = ['ALL', 'FOOD', 'DRINK', 'FASHION', 'ELECTRONICS', 'BEAUTY', 'BOOKS', 'SERVICES', 'OTHER'];

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 300);
    }
  };

  useEffect(() => {
    const unsubscribe = storeService.subscribe(setStores);
    return () => unsubscribe();
  }, []);

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         store.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || store.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'FOOD': return <Utensils className="w-4 h-4" />;
      case 'DRINK': return <Coffee className="w-4 h-4" />;
      case 'FASHION': return <ShoppingBag className="w-4 h-4" />;
      case 'ELECTRONICS': return <Laptop className="w-4 h-4" />;
      case 'BEAUTY': return <Sparkles className="w-4 h-4" />;
      case 'BOOKS': return <BookOpen className="w-4 h-4" />;
      case 'SERVICES': return <Wrench className="w-4 h-4" />;
      default: return <LucideStore className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'ALL': return 'Tất cả';
      case 'FOOD': return 'Đồ ăn';
      case 'DRINK': return 'Đồ uống';
      case 'FASHION': return 'Thời trang';
      case 'ELECTRONICS': return 'Điện tử';
      case 'BEAUTY': return 'Làm đẹp';
      case 'BOOKS': return 'Sách';
      case 'SERVICES': return 'Dịch vụ';
      case 'OTHER': return 'Khác';
      default: return category;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Khám Phá Cửa Hàng</h1>
          <p className="text-gray-500">Tìm kiếm quán ăn, quán nước, shop thời trang, điện tử và nhiều hơn nữa</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tên quán, địa chỉ..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative flex items-center gap-2 w-full md:w-auto">
            {/* Left Arrow */}
            {canScrollLeft && (
              <button 
                onClick={() => scroll('left')}
                className="absolute left-0 z-10 p-1.5 bg-white/80 backdrop-blur-md border border-gray-100 rounded-full shadow-sm text-gray-600 hover:text-blue-600 transition-all -ml-3"
              >
                <ChevronLeft size={14} />
              </button>
            )}

            {/* Scrollable Tabs */}
            <div 
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex-1 flex gap-2 overflow-x-auto no-scrollbar pb-1 scroll-smooth"
            >
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    categoryFilter === cat 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'bg-white text-gray-600 border border-gray-100 hover:border-blue-200'
                  }`}
                >
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>

            {/* Right Arrow */}
            {canScrollRight && (
              <button 
                onClick={() => scroll('right')}
                className="absolute right-10 z-10 p-1.5 bg-white/80 backdrop-blur-md border border-gray-100 rounded-full shadow-sm text-gray-600 hover:text-blue-600 transition-all"
              >
                <ChevronRight size={14} />
              </button>
            )}

            {/* Dropdown Selector */}
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className={`p-2 rounded-xl border transition-all flex items-center gap-1 ${
                  showDropdown ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter size={16} />
                <ChevronDown size={12} className={`transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setShowDropdown(false)} 
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-40 max-h-[300px] overflow-y-auto no-scrollbar"
                    >
                      <div className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                        Danh mục
                      </div>
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => {
                            setCategoryFilter(cat);
                            setShowDropdown(false);
                            // Scroll to the selected tab
                            const index = categories.indexOf(cat);
                            if (scrollContainerRef.current) {
                              const buttons = scrollContainerRef.current.querySelectorAll('button');
                              buttons[index]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                            }
                          }}
                          className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                            categoryFilter === cat 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {getCategoryLabel(cat)}
                          {categoryFilter === cat && <div className="w-1 h-1 rounded-full bg-blue-600" />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStores.map(store => (
          <div 
            key={store.id}
            onClick={() => onSelectStore(store)}
            className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="relative h-48 overflow-hidden">
              <img 
                src={store.images[0]} 
                alt={store.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 shadow-sm">
                <span className="text-blue-600">{getCategoryIcon(store.category)}</span>
                <span className="text-[10px] font-black uppercase tracking-wider">{getCategoryLabel(store.category)}</span>
              </div>
              <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-xs font-bold">{store.rating}</span>
              </div>
            </div>
            
            <div className="p-5">
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{store.name}</h3>
              
              <div className="flex items-start gap-2 text-gray-500 text-sm mb-4">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                <span className="line-clamp-1">{store.address}</span>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {store.openingHours}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onViewMenu) {
                      onViewMenu(store);
                    } else {
                      onSelectStore(store);
                    }
                  }}
                  className="flex items-center gap-1 text-blue-600 font-bold text-sm hover:text-blue-700 transition-colors"
                >
                  Xem menu <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredStores.length === 0 && (
        <div className="py-20 text-center">
          <LucideStore className="w-20 h-20 mx-auto mb-4 text-gray-200" />
          <h3 className="text-xl font-bold text-gray-400">Không tìm thấy cửa hàng nào</h3>
          <p className="text-gray-400">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
        </div>
      )}
    </div>
  );
};
