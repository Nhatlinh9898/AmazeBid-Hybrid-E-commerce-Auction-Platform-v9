
import React, { useState, useEffect } from 'react';
import { 
  Truck, Package, Plus, Trash2, Phone, User, 
  MapPin, FileText, Star 
} from 'lucide-react';
import { Supplier, RawMaterial, PurchaseInvoice } from '../types';
import { supplyChainService } from '../src/services/SupplyChainService';

interface SupplyChainManagementProps {
  ownerId: string;
}

export const SupplyChainManagement: React.FC<SupplyChainManagementProps> = ({ ownerId }) => {
  const [activeSubTab, setActiveSubTab] = useState<'materials' | 'suppliers' | 'invoices'>('materials');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const unsubscribe = supplyChainService.subscribe((data) => {
      setSuppliers(data.suppliers.filter(s => s.ownerId === ownerId));
      setMaterials(data.materials.filter(m => m.ownerId === ownerId));
      setInvoices(data.invoices.filter(i => i.ownerId === ownerId));
    });
    return () => unsubscribe();
  }, [ownerId]);

  // Form states
  const [supplierForm, setSupplierForm] = useState<Omit<Supplier, 'id' | 'ownerId'>>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    rating: 5
  });

  const [materialForm, setMaterialForm] = useState<Omit<RawMaterial, 'id' | 'ownerId'>>({
    name: '',
    unit: 'kg',
    costPrice: 0,
    supplierId: '',
    stock: 0,
    minStockAlert: 5
  });

  const [invoiceForm, setInvoiceForm] = useState<Omit<PurchaseInvoice, 'id' | 'ownerId'>>({
    supplierId: '',
    items: [],
    totalAmount: 0,
    invoiceDate: new Date().toISOString().split('T')[0],
    status: 'PAID'
  });

  const handleAddSupplier = () => {
    supplyChainService.addSupplier({ ...supplierForm, ownerId });
    setIsAdding(false);
    setSupplierForm({ name: '', contactPerson: '', phone: '', email: '', address: '', website: '', rating: 5 });
  };

  const handleAddMaterial = () => {
    supplyChainService.addMaterial({ ...materialForm, ownerId });
    setIsAdding(false);
    setMaterialForm({ name: '', unit: 'kg', costPrice: 0, supplierId: '', stock: 0, minStockAlert: 5 });
  };

  const handleAddInvoice = () => {
    supplyChainService.addInvoice({ ...invoiceForm, ownerId });
    setIsAdding(false);
    setInvoiceForm({ supplierId: '', items: [], totalAmount: 0, invoiceDate: new Date().toISOString().split('T')[0], status: 'PAID' });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Sub-tabs */}
      <div className="flex gap-4 border-b border-gray-200">
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
                    <button onClick={() => supplyChainService.deleteMaterial(mat.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 text-lg mb-1">{mat.name}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tồn kho:</span>
                    <span className={`font-bold ${mat.stock <= mat.minStockAlert ? 'text-red-600' : 'text-gray-900'}`}>{mat.stock} {mat.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Giá thành:</span>
                    <span className="font-bold text-blue-600">{mat.costPrice.toLocaleString()} đ</span>
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
                  <button onClick={() => supplyChainService.deleteSupplier(sup.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Mã HĐ</th>
                  <th className="p-4 font-bold">Ngày nhập</th>
                  <th className="p-4 font-bold">Nhà cung cấp</th>
                  <th className="p-4 font-bold">Tổng tiền</th>
                  <th className="p-4 font-bold text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono text-xs text-blue-600">{inv.id}</td>
                    <td className="p-4 text-sm text-gray-700">{inv.invoiceDate}</td>
                    <td className="p-4 text-sm font-bold text-gray-900">{suppliers.find(s => s.id === inv.supplierId)?.name || 'N/A'}</td>
                    <td className="p-4 text-sm font-black text-gray-900">{inv.totalAmount.toLocaleString()} đ</td>
                    <td className="p-4 text-right">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal (Simplified for brevity) */}
      {isAdding && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAdding(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
            <h3 className="text-xl font-black mb-6">Thêm {activeSubTab === 'materials' ? 'Vật tư' : activeSubTab === 'suppliers' ? 'Nhà cung cấp' : 'Hóa đơn'}</h3>
            
            {activeSubTab === 'materials' && (
              <div className="space-y-4">
                <input type="text" placeholder="Tên vật tư" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={materialForm.name} onChange={e => setMaterialForm({...materialForm, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Giá thành" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={materialForm.costPrice} onChange={e => setMaterialForm({...materialForm, costPrice: Number(e.target.value)})} />
                  <input type="text" placeholder="Đơn vị (kg, m...)" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={materialForm.unit} onChange={e => setMaterialForm({...materialForm, unit: e.target.value})} />
                </div>
                <select className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={materialForm.supplierId} onChange={e => setMaterialForm({...materialForm, supplierId: e.target.value})}>
                  <option value="">Chọn nhà cung cấp</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button onClick={handleAddMaterial} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Lưu vật tư</button>
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
                <select className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={invoiceForm.supplierId} onChange={e => setInvoiceForm({...invoiceForm, supplierId: e.target.value})}>
                  <option value="">Chọn nhà cung cấp</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input type="date" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={invoiceForm.invoiceDate} onChange={e => setInvoiceForm({...invoiceForm, invoiceDate: e.target.value})} />
                <input type="number" placeholder="Tổng tiền" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={invoiceForm.totalAmount} onChange={e => setInvoiceForm({...invoiceForm, totalAmount: Number(e.target.value)})} />
                <button onClick={handleAddInvoice} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Lưu hóa đơn</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
