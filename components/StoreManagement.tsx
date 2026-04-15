import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Save, ShoppingBag, Store as LucideStore, Loader2, Image as ImageIcon, Check, AlertCircle, Calculator, ChevronRight, Scale } from 'lucide-react';
import { PhysicalStore, StoreMenuItem, RawMaterial, ProductRecipe, ProductIngredient } from '../types';
import { storeService } from '../services/StoreService';
import { supplyChainService } from '../src/services/SupplyChainService';

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
  const [availableMaterials, setAvailableMaterials] = useState<RawMaterial[]>([]);
  const [showRecipeEditor, setShowRecipeEditor] = useState(false);

  // Form state for new/edit item
  const [itemForm, setItemForm] = useState<{
    name: string;
    description: string;
    price: number;
    category: string;
    image: string;
    isAvailable: boolean;
    recipe: ProductRecipe;
  }>({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '',
    isAvailable: true,
    recipe: {
      ingredients: [],
      laborCostEstimate: 0,
      packagingCost: 0,
      overheadCost: 0,
      otherExpenses: 0,
      yieldPortions: 1,
      totalCost: 0,
      costPerPortion: 0
    }
  });

  const [storeForm, setStoreForm] = useState({
    name: '',
    description: '',
    address: '',
    openingHours: '',
    category: '' as any
  });

  useEffect(() => {
    const unsubscribeStore = storeService.subscribe((allStores) => {
      const myStores = allStores.filter(s => s.ownerId === ownerId);
      setStores(myStores);
      if (myStores.length > 0 && !selectedStore) {
        setSelectedStore(myStores[0]);
      }
      setIsLoading(false);
    });

    const unsubscribeSupply = supplyChainService.subscribe((data) => {
      setAvailableMaterials(data.materials.filter(m => m.ownerId === ownerId));
    });

    return () => {
      unsubscribeStore();
      unsubscribeSupply();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  // Calculate total cost whenever recipe changes
  useEffect(() => {
    const ingredientsCost = itemForm.recipe.ingredients.reduce((sum, ing) => {
      const baseCost = ing.quantity * ing.costPerUnit;
      const wastageFactor = 1 + (ing.wastagePercentage / 100);
      return sum + (baseCost * wastageFactor);
    }, 0);
    
    const total = ingredientsCost + 
                  itemForm.recipe.laborCostEstimate + 
                  itemForm.recipe.packagingCost + 
                  itemForm.recipe.overheadCost + 
                  itemForm.recipe.otherExpenses;
    
    const perPortion = itemForm.recipe.yieldPortions > 0 ? total / itemForm.recipe.yieldPortions : total;
    
    if (total !== itemForm.recipe.totalCost || perPortion !== itemForm.recipe.costPerPortion) {
      setItemForm(prev => ({
        ...prev,
        recipe: { 
          ...prev.recipe, 
          totalCost: total,
          costPerPortion: perPortion
        }
      }));
    }
  }, [
    itemForm.recipe.ingredients, 
    itemForm.recipe.laborCostEstimate, 
    itemForm.recipe.packagingCost,
    itemForm.recipe.overheadCost,
    itemForm.recipe.otherExpenses, 
    itemForm.recipe.yieldPortions,
    itemForm.recipe.totalCost,
    itemForm.recipe.costPerPortion
  ]);

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
      isAvailable: true,
      recipe: {
        ingredients: [],
        laborCostEstimate: 0,
        packagingCost: 0,
        overheadCost: 0,
        otherExpenses: 0,
        yieldPortions: 1,
        totalCost: 0,
        costPerPortion: 0
      }
    });
    setShowRecipeEditor(false);
  };

  const startEdit = (item: StoreMenuItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category || '',
      image: item.image,
      isAvailable: item.isAvailable,
      recipe: item.recipe || {
        ingredients: [],
        laborCostEstimate: 0,
        packagingCost: 0,
        overheadCost: 0,
        otherExpenses: 0,
        yieldPortions: 1,
        totalCost: 0,
        costPerPortion: 0
      }
    });
    setIsEditingMenu(true);
    setShowRecipeEditor(!!item.recipe);
  };

  const addIngredient = (material: RawMaterial) => {
    const newIngredient: ProductIngredient = {
      materialId: material.id,
      materialName: material.name,
      quantity: 1,
      unit: material.unit,
      costPerUnit: material.costPrice,
      wastagePercentage: 0
    };
    
    setItemForm(prev => ({
      ...prev,
      recipe: {
        ...prev.recipe,
        ingredients: [...prev.recipe.ingredients, newIngredient]
      }
    }));
  };

  const removeIngredient = (index: number) => {
    setItemForm(prev => ({
      ...prev,
      recipe: {
        ...prev.recipe,
        ingredients: prev.recipe.ingredients.filter((_, i) => i !== index)
      }
    }));
  };

  const updateIngredientQty = (index: number, qty: number) => {
    setItemForm(prev => {
      const newIngredients = [...prev.recipe.ingredients];
      newIngredients[index].quantity = qty;
      return {
        ...prev,
        recipe: { ...prev.recipe, ingredients: newIngredients }
      };
    });
  };

  const updateIngredientWastage = (index: number, wastage: number) => {
    setItemForm(prev => {
      const newIngredients = [...prev.recipe.ingredients];
      newIngredients[index].wastagePercentage = wastage;
      return {
        ...prev,
        recipe: { ...prev.recipe, ingredients: newIngredients }
      };
    });
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

                  {/* Recipe & Costing Toggle */}
                  <div className="pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => setShowRecipeEditor(!showRecipeEditor)}
                      className={`w-full py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                        showRecipeEditor ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Calculator size={14}/> Định lượng & Tính giá vốn
                      </div>
                      <ChevronRight size={14} className={`transition-transform ${showRecipeEditor ? 'rotate-90' : ''}`}/>
                    </button>

                    {showRecipeEditor && (
                      <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Thành phần nguyên liệu</label>
                          <div className="space-y-2">
                            {itemForm.recipe.ingredients.map((ing, idx) => (
                              <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-gray-900 truncate">{ing.materialName}</p>
                                    <p className="text-[9px] text-gray-500">{(ing.costPerUnit * ing.quantity * (1 + ing.wastagePercentage/100)).toLocaleString()} đ</p>
                                  </div>
                                  <button onClick={() => removeIngredient(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={12}/></button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] text-gray-400 w-12">Định mức:</span>
                                    <input 
                                      type="number" 
                                      className="flex-1 p-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-center"
                                      value={ing.quantity}
                                      onChange={(e) => updateIngredientQty(idx, Number(e.target.value))}
                                    />
                                    <span className="text-[9px] text-gray-400">{ing.unit}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] text-gray-400 w-12">Hao hụt:</span>
                                    <input 
                                      type="number" 
                                      className="flex-1 p-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-center"
                                      value={ing.wastagePercentage}
                                      onChange={(e) => updateIngredientWastage(idx, Number(e.target.value))}
                                    />
                                    <span className="text-[9px] text-gray-400">%</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <select 
                            className="w-full p-2 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-[10px] font-bold text-gray-500 outline-none"
                            onChange={(e) => {
                              const mat = availableMaterials.find(m => m.id === e.target.value);
                              if (mat) addIngredient(mat);
                              e.target.value = '';
                            }}
                            value=""
                          >
                            <option value="">+ Thêm nguyên liệu từ kho</option>
                            {availableMaterials.filter(m => !itemForm.recipe.ingredients.find(ing => ing.materialId === m.id)).map(m => (
                              <option key={m.id} value={m.id}>{m.name} ({m.costPrice.toLocaleString()} / {m.unit})</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nhân công</label>
                            <input 
                              type="number" 
                              className="w-full px-3 py-1.5 bg-gray-50 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                              value={itemForm.recipe.laborCostEstimate || ''}
                              onChange={e => setItemForm(prev => ({ ...prev, recipe: { ...prev.recipe, laborCostEstimate: Number(e.target.value) } }))}
                              placeholder="0 đ"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bao bì</label>
                            <input 
                              type="number" 
                              className="w-full px-3 py-1.5 bg-gray-50 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                              value={itemForm.recipe.packagingCost || ''}
                              onChange={e => setItemForm(prev => ({ ...prev, recipe: { ...prev.recipe, packagingCost: Number(e.target.value) } }))}
                              placeholder="0 đ"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Vận hành (Điện/Nước)</label>
                            <input 
                              type="number" 
                              className="w-full px-3 py-1.5 bg-gray-50 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                              value={itemForm.recipe.overheadCost || ''}
                              onChange={e => setItemForm(prev => ({ ...prev, recipe: { ...prev.recipe, overheadCost: Number(e.target.value) } }))}
                              placeholder="0 đ"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Định lượng (Suất)</label>
                            <input 
                              type="number" 
                              className="w-full px-3 py-1.5 bg-gray-50 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600"
                              value={itemForm.recipe.yieldPortions}
                              onChange={e => setItemForm(prev => ({ ...prev, recipe: { ...prev.recipe, yieldPortions: Math.max(1, Number(e.target.value)) } }))}
                            />
                          </div>
                        </div>

                        <div className="bg-indigo-600 rounded-xl p-4 text-white space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Tổng chi phí mẻ</span>
                            <span className="text-sm font-black">{itemForm.recipe.totalCost.toLocaleString()} đ</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-white/10">
                            <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Giá vốn / Suất (COGS)</span>
                            <span className="text-lg font-black text-yellow-300">{itemForm.recipe.costPerPortion.toLocaleString()} đ</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Lợi nhuận / Suất</span>
                            <span className={`text-xs font-black ${itemForm.price - itemForm.recipe.costPerPortion > 0 ? 'text-green-300' : 'text-red-300'}`}>
                              {(itemForm.price - itemForm.recipe.costPerPortion).toLocaleString()} đ ({itemForm.price > 0 ? Math.round(((itemForm.price - itemForm.recipe.costPerPortion) / itemForm.price) * 100) : 0}%)
                            </span>
                          </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                          <p className="text-[10px] text-amber-800 font-bold flex items-center gap-1 mb-2">
                            <Scale size={12}/> Chiến lược giá gợi ý (Margin 40%):
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-black text-amber-900">
                              {Math.ceil((itemForm.recipe.costPerPortion / 0.6) / 1000) * 1000} đ
                            </span>
                            <button 
                              onClick={() => setItemForm(prev => ({ ...prev, price: Math.ceil((prev.recipe.costPerPortion / 0.6) / 1000) * 1000 }))}
                              className="text-[10px] bg-amber-600 text-white px-2 py-1 rounded-lg font-bold hover:bg-amber-700"
                            >
                              Áp dụng
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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
