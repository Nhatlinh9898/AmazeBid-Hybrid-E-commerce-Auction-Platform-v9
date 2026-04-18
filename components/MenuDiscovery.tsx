import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Utensils, ShoppingBag, ChevronRight, ChevronLeft, ChevronDown, Loader2, Coffee, Smartphone, Sparkles, BookOpen, Briefcase, LayoutGrid, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { storeService } from '../services/StoreService';
import { PhysicalStore, StoreMenuItem } from '../types';

const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('food') || cat.includes('ăn') || cat.includes('uống') || cat.includes('drink') || cat.includes('coffee')) {
    return cat.includes('uống') || cat.includes('drink') || cat.includes('coffee') ? Coffee : Utensils;
  }
  if (cat.includes('fashion') || cat.includes('thời trang') || cat.includes('phụ kiện') || cat.includes('quần áo')) {
    return ShoppingBag;
  }
  if (cat.includes('electronics') || cat.includes('điện tử') || cat.includes('thiết bị')) {
    return Smartphone;
  }
  if (cat.includes('beauty') || cat.includes('làm đẹp') || cat.includes('mỹ phẩm')) {
    return Sparkles;
  }
  if (cat.includes('book') || cat.includes('sách')) {
    return BookOpen;
  }
  if (cat.includes('service') || cat.includes('dịch vụ')) {
    return Briefcase;
  }
  return LayoutGrid;
};

interface MenuDiscoveryProps {
  onSelectStore: (store: PhysicalStore) => void;
  onClose: () => void;
}

export const MenuDiscovery: React.FC<MenuDiscoveryProps> = ({ onSelectStore }) => {
  const [stores, setStores] = useState<PhysicalStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showDropdown, setShowDropdown] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const allMenuItems = useMemo(() => {
    const items: (StoreMenuItem & { storeName: string, storeId: string, storeCategory: string })[] = [];
    stores.forEach(store => {
      store.menu.forEach(item => {
        items.push({
          ...item,
          storeName: store.name,
          storeId: store.id,
          storeCategory: store.category
        });
      });
    });
    return items;
  }, [stores]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    allMenuItems.forEach(item => cats.add(item.category));
    return ['All', ...Array.from(cats)];
  }, [allMenuItems]);

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
  }, [categories]);

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
    const unsubscribe = storeService.subscribe((data) => {
      setStores(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredItems = useMemo(() => {
    return allMenuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.storeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allMenuItems, searchTerm, activeCategory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  const pageTitle = activeCategory === 'All' ? 'Khám phá Thực đơn' : `Khám phá ${activeCategory}`;
  const searchPlaceholder = activeCategory === 'All' 
    ? "Tìm món ăn, đồ uống hoặc tên quán..." 
    : `Tìm kiếm trong ${activeCategory}...`;

  const renderIcon = () => {
    const Icon = activeCategory === 'All' ? Utensils : getCategoryIcon(activeCategory);
    return <Icon className="text-blue-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                {renderIcon()} {pageTitle}
              </h1>
              <p className="text-gray-500 mt-1 font-medium">
                {activeCategory === 'All' 
                  ? 'Tìm kiếm món ăn và đồ uống từ tất cả các cửa hàng' 
                  : `Xem tất cả sản phẩm thuộc danh mục ${activeCategory}`}
              </p>
            </div>
            
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text"
                placeholder={searchPlaceholder}
                className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Categories with Navigation Arrows and Dropdown */}
          <div className="relative mt-6 flex items-center gap-2">
            {/* Left Arrow */}
            {canScrollLeft && (
              <button 
                onClick={() => scroll('left')}
                className="absolute left-0 z-10 p-2 bg-white/80 backdrop-blur-md border border-gray-100 rounded-full shadow-sm text-gray-600 hover:text-blue-600 transition-all -ml-4"
              >
                <ChevronLeft size={16} />
              </button>
            )}

            {/* Scrollable Tabs */}
            <div 
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex-1 flex gap-3 overflow-x-auto no-scrollbar pb-2 scroll-smooth"
            >
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    activeCategory === cat 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'All' ? 'Tất cả món' : cat}
                </button>
              ))}
            </div>

            {/* Right Arrow */}
            {canScrollRight && (
              <button 
                onClick={() => scroll('right')}
                className="absolute right-12 z-10 p-2 bg-white/80 backdrop-blur-md border border-gray-100 rounded-full shadow-sm text-gray-600 hover:text-blue-600 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            )}

            {/* Dropdown Selector */}
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className={`p-2 rounded-xl border transition-all flex items-center gap-2 ${
                  showDropdown ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter size={18} />
                <ChevronDown size={14} className={`transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
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
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-40 max-h-[300px] overflow-y-auto no-scrollbar"
                    >
                      <div className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                        Chọn danh mục
                      </div>
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => {
                            setActiveCategory(cat);
                            setShowDropdown(false);
                            // Scroll to the selected tab
                            const index = categories.indexOf(cat);
                            if (scrollContainerRef.current) {
                              const buttons = scrollContainerRef.current.querySelectorAll('button');
                              buttons[index]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                            }
                          }}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${
                            activeCategory === cat 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {cat === 'All' ? 'Tất cả món' : cat}
                          {activeCategory === cat && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
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

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-gray-400 w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Không tìm thấy món nào</h3>
            <p className="text-gray-500 mt-2">Thử tìm kiếm với từ khóa khác nhé!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <div 
                key={`${item.storeId}-${item.id}`}
                className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-wider shadow-sm">
                    {item.category}
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                      {item.name}
                    </h3>
                    <span className="font-black text-blue-600 whitespace-nowrap ml-2">
                      {(item.price || 0).toLocaleString()}đ
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4 min-h-[2rem]">
                    {item.description}
                  </p>

                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        const store = stores.find(s => s.id === item.storeId);
                        if (store) onSelectStore(store);
                      }}
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                        <ShoppingBag className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate max-w-[120px]">
                        {item.storeName}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => {
                        const store = stores.find(s => s.id === item.storeId);
                        if (store) onSelectStore(store);
                      }}
                      className="flex items-center gap-1 text-xs font-black text-blue-600 hover:gap-2 transition-all"
                    >
                      Xem quán <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
