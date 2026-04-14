import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Save, ShoppingBag, Store as LucideStore, Loader2, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';
import { PhysicalStore, StoreMenuItem } from '../types';
import { storeService } from '../services/StoreService';

interface StoreManagementProps {
  ownerId: string;
}

export const StoreManagement: React.FC<StoreManagementProps> = ({ ownerId }) => {
  const [stores, setStores] = useState<PhysicalStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<PhysicalStore | null>(null);
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [isEditingStore, setIsEditingStore] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreMenuItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state for new/edit item
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '',
    isAvailable: true
  });

  const [storeForm, setStoreForm] = useState({
    name: '',
    description: '',
    address: '',
    openingHours: '',
    category: '' as any
  });

  useEffect(() => {
    const unsubscribe = storeService.subscribe((allStores) => {
      const myStores = allStores.filter(s => s.ownerId === ownerId);
      setStores(myStores);
      if (myStores.length > 0 && !selectedStore) {
        setSelectedStore(myStores[0]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  const handleUpdateStore = () => {
    if (!selectedStore) return;
    storeService.updateStore(selectedStore.id, storeForm);
    setIsEditingStore(false);
  };

  const startEditStore = () => {
    if (!selectedStore) return;
    setStoreForm({
      name: selectedStore.name,
      description: selectedStore.description,
      address: selectedStore.address,
      openingHours: selectedStore.openingHours,
      category: selectedStore.category
    });
    setIsEditingStore(true);
    setIsEditingMenu(false);
    setIsAddingItem(false);
  };

  const handleUpdateItem = () => {
    if (!selectedStore || !editingItem) return;
    
    const updatedMenu = selectedStore.menu.map(item => 
      item.id === editingItem.id ? { ...item, ...itemForm } : item
    );
    
    storeService.updateStore(selectedStore.id, { menu: updatedMenu });
    setEditingItem(null);
    setIsEditingMenu(false);
  };

  const handleAddItem = () => {
    if (!selectedStore) return;
    
    const newItem: StoreMenuItem = {
      id: `menu-${Math.random().toString(36).substring(2, 9)}`,
      ...itemForm
    };
    
    const updatedMenu = [...selectedStore.menu, newItem];
    storeService.updateStore(selectedStore.id, { menu: updatedMenu });
    setIsAddingItem(false);
    resetForm();
  };

  const handleDeleteItem = (itemId: string) => {
    if (!selectedStore || !window.confirm('Bạn có chắc muốn xóa món này?')) return;
    
    const updatedMenu = selectedStore.menu.filter(item => item.id !== itemId);
    storeService.updateStore(selectedStore.id, { menu: updatedMenu });
  };

  const resetForm = () => {
    setItemForm({
      name: '',
      description: '',
      price: 0,
      category: '',
      image: `https://picsum.photos/seed/${Date.now()}/400/300`,
      isAvailable: true
    });
  };

  const startEdit = (item: StoreMenuItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category || '',
      image: item.image,
      isAvailable: item.isAvailable
    });
    setIsEditingMenu(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
        <LucideStore className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h3 className="text-xl font-black text-gray-900 mb-2">Bạn chưa có cửa hàng nào</h3>
        <p className="text-gray-500 mb-6">Hãy đăng ký cửa hàng vật lý để bắt đầu kinh doanh và quản lý thực đơn.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Store Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {stores.map(store => (
          <button
            key={store.id}
            onClick={() => setSelectedStore(store)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              selectedStore?.id === store.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {store.name}
          </button>
        ))}
      </div>

      {selectedStore && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Store Info & Menu Management */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-gray-900">Quản lý Thực đơn</h3>
                  <p className="text-sm text-gray-500">{selectedStore.menu.length} món trong danh sách</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={startEditStore}
                    className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-50 transition-all"
                  >
                    <Edit2 size={18} /> Sửa thông tin CH
                  </button>
                  <button 
                    onClick={() => {
                      resetForm();
                      setIsAddingItem(true);
                      setIsEditingStore(false);
                      setIsEditingMenu(false);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    <Plus size={18} /> Thêm món mới
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {selectedStore.menu.map(item => (
                  <div key={item.id} className="bg-gray-50 rounded-2xl p-4 flex gap-4 group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-200">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14}/></button>
                          <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1 mb-2">{item.description || 'Không có mô tả'}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-black text-blue-600">{item.price.toLocaleString()} đ</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.isAvailable ? 'Sẵn sàng' : 'Hết hàng'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Edit/Add Form Sidebar */}
          <div className="space-y-6">
            {isEditingStore ? (
              <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-xl shadow-blue-50 animate-in slide-in-from-right-4 sticky top-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-gray-900 flex items-center gap-2">
                    <LucideStore size={18} className="text-blue-600"/>
                    Sửa thông tin CH
                  </h3>
                  <button onClick={() => setIsEditingStore(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tên cửa hàng</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={storeForm.name}
                      onChange={e => setStoreForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Địa chỉ</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={storeForm.address}
                      onChange={e => setStoreForm(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Giờ mở cửa</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={storeForm.openingHours}
                      onChange={e => setStoreForm(prev => ({ ...prev, openingHours: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mô tả</label>
                    <textarea 
                      className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      value={storeForm.description}
                      onChange={e => setStoreForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <button 
                    onClick={handleUpdateStore}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 mt-4"
                  >
                    <Save size={18} /> Lưu thông tin
                  </button>
                </div>
              </div>
            ) : (isEditingMenu || isAddingItem) ? (
              <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-xl shadow-blue-50 animate-in slide-in-from-right-4 sticky top-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-gray-900 flex items-center gap-2">
                    {isEditingMenu ? <Edit2 size={18} className="text-blue-600"/> : <Plus size={18} className="text-blue-600"/>}
                    {isEditingMenu ? 'Chỉnh sửa món' : 'Thêm món mới'}
                  </h3>
                  <button onClick={() => { setIsEditingMenu(false); setIsAddingItem(false); }} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tên món</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={itemForm.name}
                      onChange={e => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Giá (VND)</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={itemForm.price}
                      onChange={e => setItemForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mô tả</label>
                    <textarea 
                      className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      value={itemForm.description}
                      onChange={e => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ảnh (URL)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="flex-1 px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={itemForm.image}
                        onChange={e => setItemForm(prev => ({ ...prev, image: e.target.value }))}
                      />
                      <button 
                        onClick={() => setItemForm(prev => ({ ...prev, image: `https://picsum.photos/seed/${Date.now()}/400/300` }))}
                        className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200"
                      >
                        <ImageIcon size={18}/>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="isAvailable"
                      checked={itemForm.isAvailable}
                      onChange={e => setItemForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <label htmlFor="isAvailable" className="text-sm font-bold text-gray-700">Còn hàng</label>
                  </div>

                  <button 
                    onClick={isEditingMenu ? handleUpdateItem : handleAddItem}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 mt-4"
                  >
                    <Save size={18} /> {isEditingMenu ? 'Lưu thay đổi' : 'Thêm vào thực đơn'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
                <ShoppingBag className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="text-lg font-black mb-2">Quản lý hiệu quả</h3>
                <p className="text-sm text-blue-100 mb-6">Cập nhật giá và thực đơn thường xuyên để thu hút khách hàng. Sử dụng AI để tối ưu hóa hình ảnh và mô tả.</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold bg-white/10 p-2 rounded-lg">
                    <Check size={14} className="text-green-400" /> Cập nhật giá tức thì
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold bg-white/10 p-2 rounded-lg">
                    <Check size={14} className="text-green-400" /> Thêm món mới linh hoạt
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold bg-white/10 p-2 rounded-lg">
                    <AlertCircle size={14} className="text-yellow-400" /> Quản lý tình trạng còn hàng
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
