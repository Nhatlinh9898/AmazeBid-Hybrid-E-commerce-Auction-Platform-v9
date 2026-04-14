import React, { useState, useEffect } from 'react';
import { 
  Search, Edit2, Trash2, Save, X, 
  Package, DollarSign, Tag, Loader2
} from 'lucide-react';
import { Product, OrderStatus } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/useAuth';

const ProductManagement: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'AVAILABLE' | 'SOLD' | 'PENDING'>('ALL');

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await api.products.getAll();
      // Filter products belonging to the current user
      const myProducts = response.products.filter((p: Product) => p.sellerId === user.id);
      setProducts(myProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSaving(true);
    try {
      // In a real app, we would call an update API
      // For now, we simulate success
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
      setEditingProduct(null);
      alert('Cập nhật sản phẩm thành công!');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Lỗi khi cập nhật sản phẩm');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

    try {
      // Simulate delete
      setProducts(prev => prev.filter(p => p.id !== id));
      alert('Đã xóa sản phẩm');
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'ALL' || 
      (filter === 'AVAILABLE' && p.status === OrderStatus.AVAILABLE) ||
      (filter === 'SOLD' && p.status === OrderStatus.DELIVERED) ||
      (filter === 'PENDING' && p.status === OrderStatus.PENDING_VERIFICATION);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500">Đang tải danh sách sản phẩm...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h2>
          <p className="text-sm text-gray-500">Chỉnh sửa, cập nhật giá và quản lý kho hàng của bạn</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Package size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Tổng sản phẩm</p>
              <p className="text-lg font-bold text-gray-900">{products.length}</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Giá trị kho</p>
              <p className="text-lg font-bold text-gray-900">
                ${products.reduce((sum, p) => sum + (p.price * (p.stock || 1)), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Tìm kiếm sản phẩm theo tên..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(['ALL', 'AVAILABLE', 'SOLD', 'PENDING'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                filter === f 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'ALL' ? 'Tất cả' : f === 'AVAILABLE' ? 'Đang bán' : f === 'SOLD' ? 'Đã bán' : 'Chờ duyệt'}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div key={product.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-4 hover:border-blue-300 transition-all group">
              <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 truncate">{product.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    product.status === OrderStatus.AVAILABLE ? 'bg-emerald-100 text-emerald-700' :
                    product.status === OrderStatus.PENDING_VERIFICATION ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {product.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1 mb-2">{product.description}</p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 text-gray-600">
                    <Tag size={12} /> {product.category}
                  </span>
                  <span className="flex items-center gap-1 text-gray-600">
                    <Package size={12} /> Kho: {product.stock || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Giá bán</p>
                  <p className="text-lg font-bold text-[#b12704]">${product.price.toLocaleString()}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setEditingProduct(product)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white py-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
              <Package size={32} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Không tìm thấy sản phẩm</h3>
            <p className="text-sm text-gray-500 max-w-xs">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để tìm thấy sản phẩm bạn cần.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingProduct(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#131921] p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <Edit2 size={18} className="text-[#febd69]" /> Chỉnh sửa sản phẩm
              </h3>
              <button onClick={() => setEditingProduct(null)} className="hover:bg-gray-800 p-1 rounded-full">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên sản phẩm</label>
                <input 
                  type="text"
                  required
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct({...editingProduct, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giá bán ($)</label>
                  <input 
                    type="number"
                    required
                    className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số lượng kho</label>
                  <input 
                    type="number"
                    required
                    className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingProduct.stock || 0}
                    onChange={(e) => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mô tả</label>
                <textarea 
                  rows={3}
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-[#febd69] hover:bg-[#f3a847] text-black rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
