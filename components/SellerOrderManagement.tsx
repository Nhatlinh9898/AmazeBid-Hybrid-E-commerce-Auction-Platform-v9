
import React, { useState, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Printer, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Package, 
  CheckCircle, 
  Truck, 
  FileText,
  Download,
  DollarSign,
  ShieldCheck
} from 'lucide-react';
import { Product, OrderStatus, GlobalConfig, User as UserType } from '../types';
import { MOCK_ALL_USERS } from '../data';

interface SellerOrderManagementProps {
  products: Product[];
  currentUserId: string;
  globalConfig: GlobalConfig;
}

const SellerOrderManagement: React.FC<SellerOrderManagementProps> = ({ products, currentUserId, globalConfig }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Product | null>(null);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);

  // Filter sold products for this seller
  const orders = products.filter(p => 
    p.sellerId === currentUserId && 
    p.status !== OrderStatus.AVAILABLE && 
    p.status !== OrderStatus.PENDING_VERIFICATION
  );

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.title.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Deterministically find a mock buyer based on order ID
  const getBuyerForOrder = (orderId: string): UserType => {
    const index = orderId.length % (MOCK_ALL_USERS.length - 1); // Avoid picking admin
    const buyer = MOCK_ALL_USERS[index];
    // Add missing info for the demo if it's not in the mock
    const pseudoRandomNumber = (orderId.length * index) % 9000000 + 1000000;
    return {
      ...buyer,
      phone: buyer.phone || '098' + pseudoRandomNumber,
      address: buyer.address || '123 Đường ' + ['Lê Lợi', 'Nguyễn Huệ', 'Trần Hưng Đạo', 'Lê Duẩn'][index % 4] + ', TP. Hồ Chí Minh',
      email: buyer.email || `${buyer.fullName.replace(/\s+/g, '.').toLowerCase()}@example.com`
    };
  };

  const currentBuyer = selectedOrder ? getBuyerForOrder(selectedOrder.id) : null;

  const getSellerInfo = (sellerId: string) => {
    // Mimic fetching seller profile info
    return {
      shopName: `Store của ${sellerId.slice(0, 5).toUpperCase()}`,
      address: "Số 45, Đường Công Nghệ, Khu Công Viên Phần Mềm, TP. Thủ Đức",
      phone: "1900 8198 - Ext: " + sellerId.slice(0, 3)
    };
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PAID_ESCROW: return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">ĐÃ THANH TOÁN (KÝ QUỸ)</span>;
      case OrderStatus.PENDING_SHIPMENT: return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-bold">CHỜ GIAO HÀNG</span>;
      case OrderStatus.SHIPPED: return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">ĐANG GIAO</span>;
      case OrderStatus.DELIVERED: return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold">ĐÃ GIAO</span>;
      case OrderStatus.COMPLETED: return <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-bold">HOÀN TẤT</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-[10px] font-bold">{status}</span>;
    }
  };

  const handlePrint = useCallback((order: Product) => {
    const buyer = getBuyerForOrder(order.id);
    const seller = getSellerInfo(currentUserId);
    const vatRate = order.vatRate !== undefined ? order.vatRate : globalConfig.defaultVatRate;
    const shippingFee = 35000; // Mock 35k VNĐ shipping
    
    // Reverse calculation: Price is Gross Price (includes VAT and Special Tax if applicable)
    const subtotal = order.price;
    const vatAmount = subtotal * vatRate;
    const total = subtotal + vatAmount + shippingFee;

    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${order.id.slice(0, 12).toUpperCase()}&scale=2&rotate=N&includetext`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Hóa đơn AmazeBid - ${order.id}</title>
            <style>
              @page { size: 80mm auto; margin: 0; }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                width: 80mm; 
                padding: 10px; 
                margin: 0;
                font-size: 10px;
                color: #000;
                line-height: 1.4;
              }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .header { margin-bottom: 8px; border-bottom: 2px solid #000; padding-bottom: 5px; }
              .seller-info { margin-bottom: 10px; font-size: 9px; line-height: 1.2; }
              .info { margin-bottom: 10px; }
              .table { width: 100%; border-collapse: collapse; margin: 5px 0; }
              .table td { padding: 4px 0; vertical-align: top; }
              .border-top { border-top: 1px dashed #000; margin-top: 5px; padding-top: 5px; }
              .footer { margin-top: 15px; text-align: center; font-size: 8px; line-height: 1.2; }
              .qr { width: 70px; height: 70px; margin: 5px auto; display: block; }
              .barcode { width: 100%; height: 40px; margin: 5px auto; display: block; }
              .price { text-align: right; }
              .logo { font-size: 16px; font-weight: 900; letter-spacing: -1px; margin-bottom: 2px; }
              .uppercase { text-transform: uppercase; }
            </style>
          </head>
          <body>
            <div class="header center">
              <div class="logo">AMAZEBID</div>
              <div style="font-size: 8px; text-transform: uppercase; letter-spacing: 1px;">Hybrid Marketplace & Auction</div>
            </div>

            <div class="seller-info center">
              <div class="bold uppercase">${seller.shopName}</div>
              <div>Đ/c: ${seller.address}</div>
              <div class="bold">Hotline: ${seller.phone}</div>
            </div>

            <div class="info">
              <div class="bold center" style="font-size: 12px; margin: 5px 0; border-top: 1px solid #eee; pt-2;">BIÊN LAI BÁN HÀNG</div>
              <div class="center">Mã đơn: <span class="bold">#${order.id.slice(0,12).toUpperCase()}</span></div>
              <div class="center">Ngày in: ${new Date().toLocaleString('vi-VN')}</div>
            </div>

            <img src="${barcodeUrl}" class="barcode" alt="barcode"/>

            <div class="border-top">
              <div class="bold uppercase" style="font-size: 9px; color: #444; margin-bottom: 3px;">Thông tin khách hàng</div>
              <div class="bold">${buyer.fullName}</div>
              <div>SĐT: ${buyer.phone}</div>
              <div>Email: ${buyer.email}</div>
              <div style="font-style: italic;">Đ/c: ${buyer.address}</div>
            </div>

            <div class="border-top">
              <div class="bold uppercase" style="font-size: 9px; color: #444; margin-bottom: 3px;">Chi tiết đơn hàng</div>
              <table class="table">
                <tr class="bold" style="border-bottom: 1px solid #eee;">
                  <td>Tên sản phẩm</td>
                  <td class="price">Thành tiền</td>
                </tr>
                <tr>
                  <td>${order.title}<br/><small style="color: #666;">Số lượng: 1</small></td>
                  <td class="price">${subtotal.toLocaleString()}<sup>${globalConfig.currencySymbol}</sup></td>
                </tr>
              </table>
            </div>

            <div class="border-top">
              <table class="table">
                <tr>
                  <td>Tạm tính:</td>
                  <td class="price">${subtotal.toLocaleString()}<sup>${globalConfig.currencySymbol}</sup></td>
                </tr>
                ${vatAmount > 0 ? `
                <tr>
                  <td>Thuế GTGT (${(vatRate * 100).toFixed(0)}%):</td>
                  <td class="price">${vatAmount.toLocaleString()}<sup>${globalConfig.currencySymbol}</sup></td>
                </tr>
                ` : ''}
                ${specialTaxAmount > 0 ? `
                <tr>
                  <td>Thuế Tiêu thụ ĐB (${(specialTaxRate * 100).toFixed(0)}%):</td>
                  <td class="price">${specialTaxAmount.toLocaleString()}<sup>${globalConfig.currencySymbol}</sup></td>
                </tr>
                ` : ''}
                <tr>
                  <td>Phí vận chuyển:</td>
                  <td class="price">${shippingFee.toLocaleString()}<sup>${globalConfig.currencySymbol}</sup></td>
                </tr>
                <tr class="bold" style="font-size: 14px;">
                  <td style="padding-top: 8px;">TỔNG CỘNG:</td>
                  <td class="price" style="padding-top: 8px;">${total.toLocaleString()}<sup>${globalConfig.currencySymbol}</sup></td>
                </tr>
              </table>
            </div>

            <div class="footer">
              <div class="bold">TRÂN TRỌNG CẢM ƠN QUÝ KHÁCH!</div>
              <p>Vui lòng quét mã QR để tra cứu bảo hành và lịch sử vận chuyển điện tử.</p>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://amazebid.com/order/${order.id}" class="qr"/>
              <div style="font-size: 7px; color: #666; margin-top: 5px;">Powered by AmazeBid AI Infrastructure</div>
            </div>
            
            <script>
              window.onload = () => {
                window.print();
                setTimeout(() => window.close(), 1000);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }, [currentUserId, globalConfig.currencySymbol, globalConfig.defaultVatRate]);

  // Auto-print effect
  React.useEffect(() => {
    if (autoPrintEnabled && selectedOrder) {
      handlePrint(selectedOrder);
    }
  }, [selectedOrder, autoPrintEnabled, handlePrint]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo tên sản phẩm hoặc mã đơn..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-200 rounded-lg shadow-sm">
            <Filter size={16} className="text-gray-400" />
            <select 
              className="text-sm font-bold bg-transparent outline-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value={OrderStatus.PAID_ESCROW}>Đã thanh toán (Ký quỹ)</option>
              <option value={OrderStatus.PENDING_SHIPMENT}>Chờ giao hàng</option>
              <option value={OrderStatus.SHIPPED}>Đang giao</option>
              <option value={OrderStatus.DELIVERED}>Đã nhận hàng</option>
              <option value={OrderStatus.COMPLETED}>Hoàn tất</option>
            </select>
          </div>
          
          <button className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-bold">
            <Download size={16} /> Xuất Excel
          </button>
          
          <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50">
            <div className={`w-8 h-4 rounded-full transition-colors relative ${autoPrintEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
               <input 
                 type="checkbox" 
                 className="hidden" 
                 checked={autoPrintEnabled}
                 onChange={() => setAutoPrintEnabled(!autoPrintEnabled)}
               />
               <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${autoPrintEnabled ? 'translate-x-4.5' : 'translate-x-0.5'}`}></div>
            </div>
            <span className="text-[10px] font-black text-gray-700 uppercase tracking-tight">Tự động in</span>
          </label>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Order List */}
        <div className="w-full md:w-1/3 border-r border-gray-100 overflow-y-auto custom-scrollbar bg-white">
          {filteredOrders.length === 0 ? (
            <div className="p-10 text-center text-gray-400 flex flex-col items-center">
              <Package size={48} className="opacity-10 mb-2" />
              <p className="text-sm">Không tìm thấy đơn hàng nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredOrders.map(order => (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className={`p-4 cursor-pointer transition-all hover:bg-blue-50/30 ${selectedOrder?.id === order.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">#{order.id.slice(0, 8).toUpperCase()}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 truncate mb-1">{order.title}</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-blue-600">
                      {order.price.toLocaleString()}<sup>{globalConfig.currencySymbol}</sup>
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                       <Truck size={10}/> {order.shippingInfo?.carrier || 'Dự kiến 3 ngày'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Detail View */}
        <div className="hidden md:flex flex-1 flex-col bg-gray-50/30">
          {selectedOrder && currentBuyer ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4">
              {/* Header */}
              <div className="p-6 bg-white border-b border-gray-100 flex justify-between items-start sticky top-0 z-10 shadow-sm shadow-black/5">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-black text-gray-900">Đơn hàng #{selectedOrder.id.slice(0, 12).toUpperCase()}</h2>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <User size={14}/> Khách hàng: <span className="font-bold text-gray-900">{currentBuyer.fullName}</span> 
                    <span className="text-gray-300">|</span> 
                    <Phone size={14}/> {currentBuyer.phone}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handlePrint(selectedOrder)}
                    className="flex items-center gap-2 bg-[#131921] text-[#febd69] px-6 py-3 rounded-xl font-black text-sm hover:bg-black transition-all shadow-lg shadow-black/10"
                  >
                    <Printer size={18} /> IN HÓA ĐƠN
                  </button>
                  <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">
                    <FileText size={18} /> LOG AI
                  </button>
                </div>
              </div>

              {/* Content Panels */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Buyer Info */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4 uppercase tracking-wider text-xs">
                      <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600"><User size={14} /></div>
                      Thông tin người mua
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <img src={currentBuyer.avatar} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-gray-50" />
                        <div>
                          <p className="text-sm font-black text-gray-900">{currentBuyer.fullName}</p>
                          <div className="flex gap-1 mt-1">
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{currentBuyer.tier}</span>
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{currentBuyer.reputation}% Uy tín</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Số điện thoại</label>
                          <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                             <Phone size={14} className="text-blue-500" /> {currentBuyer.phone}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email</label>
                          <p className="text-sm font-bold text-gray-900 truncate flex items-center gap-2">
                             <Mail size={14} className="text-indigo-500" /> {currentBuyer.email}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-2xl border-l-4 border-blue-500">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Địa chỉ giao hàng</label>
                        <p className="text-sm font-bold text-gray-800 leading-relaxed flex items-start gap-2">
                           <MapPin size={16} className="text-red-500 mt-0.5 shrink-0" />
                           {currentBuyer.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4 uppercase tracking-wider text-xs">
                      <div className="p-1.5 bg-green-100 rounded-lg text-green-600"><DollarSign size={14} /></div>
                      Tổng kết thanh toán
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                         <span className="text-sm text-gray-500 font-medium">Giá sản phẩm</span>
                         <span className="text-sm font-black">{selectedOrder.price.toLocaleString()}<sup>{globalConfig.currencySymbol}</sup></span>
                      </div>
                      <div className="flex justify-between items-center px-3">
                         <span className="text-sm text-gray-500 font-medium">Thuế VAT ({( (selectedOrder.vatRate !== undefined ? selectedOrder.vatRate : globalConfig.defaultVatRate) * 100).toFixed(0)}%)</span>
                         <span className="text-sm font-bold">+{(selectedOrder.price * (selectedOrder.vatRate !== undefined ? selectedOrder.vatRate : globalConfig.defaultVatRate)).toLocaleString()}<sup>{globalConfig.currencySymbol}</sup></span>
                      </div>
                      {selectedOrder.specialTaxRate ? (
                        <div className="flex justify-between items-center px-3">
                           <span className="text-sm text-gray-500 font-medium">Thuế TTĐB ({(selectedOrder.specialTaxRate * 100).toFixed(0)}%)</span>
                           <span className="text-sm font-bold">+{(selectedOrder.price * selectedOrder.specialTaxRate).toLocaleString()}<sup>{globalConfig.currencySymbol}</sup></span>
                        </div>
                      ) : null}
                      <div className="flex justify-between items-center px-3">
                         <span className="text-sm text-gray-500 font-medium">Phí vận chuyển</span>
                         <span className="text-sm font-bold">+35.000<sup>{globalConfig.currencySymbol}</sup></span>
                      </div>
                      
                      <div className="pt-4 border-t-2 border-dashed border-gray-100 mt-4">
                         <div className="flex justify-between items-end">
                            <div>
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tổng tiền khách trả</p>
                               <span className="text-3xl font-black text-blue-600">
                                 {(selectedOrder.price * (1 + (selectedOrder.vatRate !== undefined ? selectedOrder.vatRate : globalConfig.defaultVatRate) + (selectedOrder.specialTaxRate || 0)) + 35000).toLocaleString()}<sup>{globalConfig.currencySymbol}</sup>
                               </span>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Dự tính doanh thu</p>
                               <span className="text-sm font-black text-emerald-600">
                                 +{(selectedOrder.price * (1 - globalConfig.platformFeeRate)).toLocaleString()}<sup>{globalConfig.currencySymbol}</sup>
                               </span>
                            </div>
                         </div>
                      </div>

                      <div className="mt-6 flex gap-2">
                        <div className="flex-1 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
                           <ShieldCheck size={20} className="text-indigo-600 shrink-0" />
                           <div>
                              <p className="text-[10px] font-black text-indigo-700 uppercase">Escrow Locked</p>
                              <p className="text-[9px] text-indigo-500 leading-tight">Tiền đang được AmazeBid giữ an toàn. Giải ngân sau khi giao hàng thành công.</p>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4 uppercase tracking-wider text-xs">
                      <div className="p-1.5 bg-orange-100 rounded-lg text-orange-600"><Package size={14} /></div>
                      Danh sách mặt hàng
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-2xl transition-all hover:bg-white hover:ring-2 hover:ring-blue-100 group">
                        <div className="w-24 h-24 rounded-xl overflow-hidden shadow-sm">
                          <img src={selectedOrder.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                             <div>
                                <h4 className="font-black text-lg text-gray-900">{selectedOrder.title}</h4>
                                <p className="text-xs text-gray-500 font-bold bg-white inline-block px-2 py-1 rounded-lg mt-1">{selectedOrder.category}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đơn giá</p>
                                <p className="text-xl font-black text-gray-900">{selectedOrder.price.toLocaleString()}<sup>{globalConfig.currencySymbol}</sup></p>
                             </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                             <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                                <span>Màu sắc: Mặc định</span>
                                <span>Size: One Size</span>
                                <span>Số lượng: <span className="text-blue-600 font-black">01</span></span>
                             </div>
                             <div className="bg-white px-3 py-1 rounded-lg text-[10px] font-black text-gray-400 border border-gray-100">
                                SKU: {selectedOrder.id.slice(0,8).toUpperCase()}
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Timeline / Status Update */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                     <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4 uppercase tracking-wider text-xs">
                      <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600"><Truck size={14} /></div>
                      Vận chuyển & Trạng thái
                    </h3>
                    <div className="flex flex-col md:flex-row gap-8">
                       <div className="flex-1 space-y-4">
                          <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                             <div className="relative">
                                <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white ring-4 ring-white z-10"><CheckCircle size={14}/></div>
                                <p className="text-xs font-black text-gray-900 uppercase">Đơn hàng đã thanh toán</p>
                                <p className="text-xs text-gray-400 font-medium">Hệ thống đã xác nhận thanh toán ký quỹ.</p>
                                <p className="text-[10px] text-gray-300 mt- 1">24/04/2026 10:05</p>
                             </div>
                             <div className="relative">
                                <div className={`absolute -left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center text-white ring-4 ring-white z-10 ${['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(selectedOrder.status) ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}>
                                   <Truck size={14}/>
                                </div>
                                <p className="text-xs font-black text-gray-900 uppercase">Đang chuẩn bị hàng</p>
                                <p className="text-xs text-gray-400 font-medium">Người bán đang đóng gói sản phẩm.</p>
                             </div>
                             <div className="relative opacity-40">
                                <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-white ring-4 ring-white z-10"><MapPin size={14}/></div>
                                <p className="text-xs font-black text-gray-900 uppercase">Giao hàng thành công</p>
                                <p className="text-xs text-gray-400 font-medium">Dự kiến giao hàng trong 2-3 ngày tới.</p>
                             </div>
                          </div>
                       </div>
                       
                       <div className="md:w-72 space-y-4">
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                             <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Cập nhật nhanh trạng thái</label>
                             <div className="grid grid-cols-1 gap-2">
                                <button className="w-full py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all">XÁC NHẬN ĐÃ GỬI HÀNG</button>
                                <button className="w-full py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all">YÊU CẦU HỦY ĐƠN</button>
                             </div>
                          </div>
                          <div className="p-4 bg-[#131921] rounded-2xl">
                             <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 bg-amber-500 rounded flex items-center justify-center text-black font-black text-[10px]">AI</div>
                                <p className="text-[10px] text-white font-black uppercase tracking-widest">Phân tích rủi ro</p>
                             </div>
                             <p className="text-[10px] text-gray-400 italic">"Giao dịch được AI đánh giá là An toàn (98%). Khách hàng này có lịch sử lấy hàng tốt và không có khiếu nại gần đây."</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
               <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl shadow-black/5 flex items-center justify-center mb-6">
                 <Package size={48} className="opacity-20 text-indigo-600" />
               </div>
               <h3 className="text-xl font-black text-gray-900 mb-2">Quản lý Đơn hàng của bạn</h3>
               <p className="text-sm text-gray-500 max-w-xs text-center">Chọn một đơn hàng từ danh sách bên trái để xem chi tiết, in hóa đơn và cập nhật vận chuyển.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerOrderManagement;
