
import React from 'react';
import { 
  Truck, Package, Plus, Trash2, Phone, User, 
  MapPin, FileText, Star, PieChart as PieChartIcon,
  Edit2
} from 'lucide-react';
import { Supplier, RawMaterial, PurchaseInvoice } from '../types';
import { supplyChainService } from '../src/services/SupplyChainService';

interface SupplyChainManagementProps {
  ownerId: string;
  onTabChange?: (tab: any) => void;
}

export const SupplyChainManagement: React.FC<SupplyChainManagementProps> = ({ ownerId, onTabChange }) => {
  const [activeSubTab, setActiveSubTab] = React.useState<'materials' | 'suppliers' | 'invoices'>('materials');
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [materials, setMaterials] = React.useState<RawMaterial[]>([]);
  const [invoices, setInvoices] = React.useState<PurchaseInvoice[]>([]);
  
  const [isAdding, setIsAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsubscribe = supplyChainService.subscribe((data) => {
      setSuppliers(data.suppliers.filter(s => s.ownerId === ownerId));
      setMaterials(data.materials.filter(m => m.ownerId === ownerId));
      setInvoices(data.invoices.filter(i => i.ownerId === ownerId));
    });
    return () => unsubscribe();
  }, [ownerId]);

  // Form states
  const [supplierForm, setSupplierForm] = React.useState<Omit<Supplier, 'id' | 'ownerId'>>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    rating: 5
  });

  const [materialForm, setMaterialForm] = React.useState<Omit<RawMaterial, 'id' | 'ownerId'>>({
    name: '',
    category: 'Nguyên liệu chính',
    unit: 'kg',
    costPrice: 0,
    currency: 'VND',
    supplierId: '',
    stock: 0,
    minStockAlert: 5
  });

  const [invoiceForm, setInvoiceForm] = React.useState<Omit<PurchaseInvoice, 'id' | 'ownerId'>>({
    supplierId: '',
    items: [],
    totalAmount: 0,
    currency: 'VND',
    invoiceDate: new Date().toISOString().split('T')[0],
    status: 'PAID',
    invoiceType: 'Hóa đơn VAT',
    purpose: 'Nhập hàng tồn kho',
    requesterName: '',
    description: '',
    imageUrl: ''
  });

  const handleAddSupplier = () => {
    if (editingId) {
      supplyChainService.updateSupplier(editingId, supplierForm);
    } else {
      supplyChainService.addSupplier({ ...supplierForm, ownerId });
    }
    closeModal();
  };

  const handleAddMaterial = () => {
    if (editingId) {
      supplyChainService.updateMaterial(editingId, materialForm);
    } else {
      supplyChainService.addMaterial({ ...materialForm, ownerId });
    }
    closeModal();
  };

  const closeModal = () => {
    setIsAdding(false);
    setEditingId(null);
    setSupplierForm({ name: '', contactPerson: '', phone: '', email: '', address: '', website: '', rating: 5 });
    setMaterialForm({ 
      name: '', category: 'Nguyên liệu chính', unit: 'kg', costPrice: 0, 
      currency: 'VND', supplierId: '', stock: 0, minStockAlert: 5 
    });
    setInvoiceForm({ 
      supplierId: '', items: [], totalAmount: 0, currency: 'VND',
      invoiceDate: new Date().toISOString().split('T')[0], status: 'PAID',
      invoiceType: 'Hóa đơn VAT', purpose: 'Nhập hàng tồn kho', requesterName: '',
      description: '', imageUrl: ''
    });
  };

  const startEditMaterial = (mat: RawMaterial) => {
    setEditingId(mat.id);
    setMaterialForm({
      name: mat.name,
      category: mat.category,
      unit: mat.unit,
      costPrice: mat.costPrice,
      currency: mat.currency,
      supplierId: mat.supplierId,
      stock: mat.stock,
      minStockAlert: mat.minStockAlert
    });
    setIsAdding(true);
  };

  const startEditSupplier = (sup: Supplier) => {
    setEditingId(sup.id);
    setSupplierForm({
      name: sup.name,
      contactPerson: sup.contactPerson,
      phone: sup.phone,
      email: sup.email || '',
      address: sup.address,
      website: sup.website || '',
      rating: sup.rating || 5
    });
    setIsAdding(true);
  };

  const handleAddInvoice = () => {
    supplyChainService.addInvoice({ ...invoiceForm, ownerId });
    setIsAdding(false);
    setInvoiceForm({ 
      supplierId: '', 
      items: [], 
      totalAmount: 0, 
      currency: 'VND',
      invoiceDate: new Date().toISOString().split('T')[0], 
      status: 'PAID',
      invoiceType: 'Hóa đơn VAT',
      purpose: 'Nhập hàng tồn kho',
      requesterName: '',
      description: '',
      imageUrl: ''
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Sub-tabs */}
      <div className="flex justify-between items-center border-b border-gray-200">
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveSubTab('materials')}
            className={`pb-2 px-4 font-bold text-sm transition-all ${activeSubTab === 'materials' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <div className="flex items-center gap-2"><Package size={16}/> Nguyên vật liệu</div>
          </button>
          <button 
            onClick={() => setActiveSubTab('suppliers')}
            className={`pb-2 px-4 font-bold text-sm transition-all ${activeSubTab === 'suppliers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <div className="flex items-center gap-2"><Truck size={16}/> Nhà cung cấp</div>
          </button>
          <button 
            onClick={() => setActiveSubTab('invoices')}
            className={`pb-2 px-4 font-bold text-sm transition-all ${activeSubTab === 'invoices' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <div className="flex items-center gap-2"><FileText size={16}/> Hóa đơn nhập hàng</div>
          </button>
        </div>
        <button 
          onClick={() => onTabChange?.('equity')}
          className="pb-2 px-4 text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 transition-colors"
        >
          <PieChartIcon size={14}/> Xem Phân bổ Lợi nhuận & Cổ phần
        </button>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-gray-900 capitalize">
          {activeSubTab === 'materials' ? 'Quản lý Nguyên vật liệu' : activeSubTab === 'suppliers' ? 'Danh sách Nhà cung cấp' : 'Lịch sử Nhập hàng'}
        </h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={18} /> Thêm {activeSubTab === 'materials' ? 'vật tư' : activeSubTab === 'suppliers' ? 'nhà cung cấp' : 'hóa đơn'}
        </button>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 gap-6">
        {activeSubTab === 'materials' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {materials.map(mat => (
              <div key={mat.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Package size={20}/></div>
                  <div className="flex gap-1">
                    <button onClick={() => startEditMaterial(mat)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={14}/></button>
                    <button onClick={() => supplyChainService.deleteMaterial(mat.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 text-lg mb-1">{mat.name}</h4>
                <div className="mb-3">
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                    {mat.category}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tồn kho:</span>
                    <span className={`font-bold ${mat.stock <= mat.minStockAlert ? 'text-red-600' : 'text-gray-900'}`}>{mat.stock} {mat.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Giá thành:</span>
                    <span className="font-bold text-blue-600">{(mat.costPrice || 0).toLocaleString()} {mat.currency || 'VND'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Nhà cung cấp:</span>
                    <span className="text-gray-700 truncate max-w-[150px]">{suppliers.find(s => s.id === mat.supplierId)?.name || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
            {materials.length === 0 && (
              <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Package size={48} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Chưa có nguyên vật liệu nào.</p>
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'suppliers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.map(sup => (
              <div key={sup.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-50 p-2 rounded-lg text-purple-600"><Truck size={24}/></div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{sup.name}</h4>
                      <div className="flex items-center gap-1 text-yellow-500 text-xs">
                        <Star size={12} fill="currentColor"/> {sup.rating}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEditSupplier(sup)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={14}/></button>
                    <button onClick={() => supplyChainService.deleteSupplier(sup.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User size={14}/> {sup.contactPerson}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={14}/> {sup.phone}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 col-span-2">
                    <MapPin size={14}/> {sup.address}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSubTab === 'invoices' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider">
                    <th className="p-4 font-bold">Mã HĐ & Loại</th>
                    <th className="p-4 font-bold">Ngày & Người dùng</th>
                    <th className="p-4 font-bold">Nhà cung cấp & Mục đích</th>
                    <th className="p-4 font-bold">Chi tiết & Chứng từ</th>
                    <th className="p-4 font-bold">Tổng tiền</th>
                    <th className="p-4 font-bold text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-mono text-[10px] text-blue-600 mb-1">{inv.id}</div>
                        <div className="text-xs font-bold text-gray-900">{inv.invoiceType}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-gray-700 mb-1">{inv.invoiceDate}</div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-1">
                          <User size={10}/> {inv.requesterName || 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs font-bold text-gray-900 mb-1">
                          {suppliers.find(s => s.id === inv.supplierId)?.name || 'N/A'}
                        </div>
                        <div className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded inline-block">
                          {inv.purpose}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-[10px] text-gray-500 line-clamp-1 mb-1">{inv.description || 'Không có mô tả'}</p>
                        {inv.imageUrl ? (
                          <a href={inv.imageUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1">
                            <FileText size={10}/> Xem bản scan
                          </a>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">Chưa có ảnh</span>
                        )}
                      </td>
                      <td className="p-4 text-sm font-black text-gray-900">{(inv.totalAmount || 0).toLocaleString()} {inv.currency || 'VND'}</td>
                      <td className="p-4 text-right">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-gray-400 italic">
                        Chưa có hóa đơn nhập hàng nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal (Simplified for brevity) */}
      {isAdding && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
            <h3 className="text-xl font-black mb-6">
              {editingId ? 'Chỉnh sửa' : 'Thêm'} {activeSubTab === 'materials' ? 'Vật tư/Dịch vụ' : activeSubTab === 'suppliers' ? 'Nhà cung cấp' : 'Hóa đơn'}
            </h3>
            
            {activeSubTab === 'materials' && (
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Tên vật tư" 
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm" 
                  value={materialForm.name} 
                  onChange={e => setMaterialForm({...materialForm, name: e.target.value})} 
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <select 
                    className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm" 
                    value={materialForm.category} 
                    onChange={e => setMaterialForm({...materialForm, category: e.target.value})}
                  >
                    <option value="Nguyên liệu chính">Nguyên liệu chính</option>
                    <option value="Linh kiện">Linh kiện</option>
                    <option value="Bao bì">Bao bì</option>
                    <option value="Văn phòng phẩm">Văn phòng phẩm</option>
                    <option value="Điện & Nước">Điện & Nước</option>
                    <option value="Nhiên liệu (Gas/Xăng)">Nhiên liệu (Gas/Xăng)</option>
                    <option value="Hạ tầng (Mạng/Cloud/AI)">Hạ tầng (Mạng/Cloud/AI)</option>
                    <option value="Dịch vụ thuê ngoài">Dịch vụ thuê ngoài</option>
                    <option value="Khác">Khác</option>
                  </select>
                  <select 
                    className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm" 
                    value={materialForm.unit} 
                    onChange={e => setMaterialForm({...materialForm, unit: e.target.value})}
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="g">g (Gram)</option>
                    <option value="m">m (Mét)</option>
                    <option value="cái">cái (Piece)</option>
                    <option value="bộ">bộ (Set)</option>
                    <option value="thùng">thùng (Box)</option>
                    <option value="lít">lít (Liter)</option>
                    <option value="m3">m3 (Khối)</option>
                    <option value="kWh">kWh (Điện)</option>
                    <option value="tháng">tháng (Month)</option>
                    <option value="lần">lần (Time)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" 
                    placeholder="Giá thành" 
                    className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm" 
                    value={materialForm.costPrice || ''} 
                    onChange={e => setMaterialForm({...materialForm, costPrice: Number(e.target.value)})} 
                  />
                  <select 
                    className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm" 
                    value={materialForm.currency} 
                    onChange={e => setMaterialForm({...materialForm, currency: e.target.value})}
                  >
                    <option value="VND">VND (₫)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>

                <select 
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm" 
                  value={materialForm.supplierId} 
                  onChange={e => setMaterialForm({...materialForm, supplierId: e.target.value})}
                >
                  <option value="">Chọn nhà cung cấp</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button onClick={handleAddMaterial} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">Lưu vật tư</button>
              </div>
            )}

            {activeSubTab === 'suppliers' && (
              <div className="space-y-4">
                <input type="text" placeholder="Tên nhà cung cấp" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} />
                <input type="text" placeholder="Người liên hệ" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={supplierForm.contactPerson} onChange={e => setSupplierForm({...supplierForm, contactPerson: e.target.value})} />
                <input type="text" placeholder="Số điện thoại" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} />
                <input type="text" placeholder="Địa chỉ" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} />
                <button onClick={handleAddSupplier} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Lưu nhà cung cấp</button>
              </div>
            )}

            {activeSubTab === 'invoices' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <select 
                    className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm" 
                    value={invoiceForm.supplierId} 
                    onChange={e => setInvoiceForm({...invoiceForm, supplierId: e.target.value})}
                  >
                    <option value="">Chọn nhà cung cấp</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <input 
                    type="date" 
                    className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm" 
                    value={invoiceForm.invoiceDate} 
                    onChange={e => setInvoiceForm({...invoiceForm, invoiceDate: e.target.value})} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select 
                    className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm" 
                    value={invoiceForm.invoiceType} 
                    onChange={e => setInvoiceForm({...invoiceForm, invoiceType: e.target.value})}
                  >
                    <option value="Hóa đơn VAT">Hóa đơn VAT</option>
                    <option value="Hóa đơn bán lẻ">Hóa đơn bán lẻ</option>
                    <option value="Hợp đồng dịch vụ">Hợp đồng dịch vụ</option>
                    <option value="Phiếu thu">Phiếu thu</option>
                    <option value="Khác">Khác</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Người thực hiện / Người dùng" 
                    className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm" 
                    value={invoiceForm.requesterName} 
                    onChange={e => setInvoiceForm({...invoiceForm, requesterName: e.target.value})} 
                  />
                </div>

                <select 
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm" 
                  value={invoiceForm.purpose} 
                  onChange={e => setInvoiceForm({...invoiceForm, purpose: e.target.value})}
                >
                  <option value="Nhập hàng tồn kho">Nhập hàng tồn kho</option>
                  <option value="Thanh toán tiền điện">Thanh toán tiền điện</option>
                  <option value="Thanh toán tiền nước">Thanh toán tiền nước</option>
                  <option value="Cước Internet/Phần mềm">Cước Internet/Phần mềm</option>
                  <option value="Phí AI & Cloud">Phí AI & Cloud</option>
                  <option value="Nhiên liệu & Vận hành">Nhiên liệu & Vận hành</option>
                  <option value="Phí dịch vụ ngoài">Phí dịch vụ ngoài</option>
                  <option value="Khác">Khác</option>
                </select>

                <textarea 
                  placeholder="Mô tả chi tiết hóa đơn (Các mặt hàng chi trả...)" 
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm min-h-[80px]" 
                  value={invoiceForm.description} 
                  onChange={e => setInvoiceForm({...invoiceForm, description: e.target.value})} 
                />

                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" 
                    placeholder="Tổng tiền" 
                    className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm font-bold" 
                    value={invoiceForm.totalAmount || ''} 
                    onChange={e => setInvoiceForm({...invoiceForm, totalAmount: Number(e.target.value)})} 
                  />
                  <select 
                    className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm" 
                    value={invoiceForm.currency} 
                    onChange={e => setInvoiceForm({...invoiceForm, currency: e.target.value})}
                  >
                    <option value="VND">VND (₫)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
                <input 
                  type="text" 
                  placeholder="Link ảnh scan/chụp hóa đơn" 
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none text-sm" 
                  value={invoiceForm.imageUrl} 
                  onChange={e => setInvoiceForm({...invoiceForm, imageUrl: e.target.value})} 
                />

                <button onClick={handleAddInvoice} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
                  Lưu hóa đơn & Minh bạch chi tiêu
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
