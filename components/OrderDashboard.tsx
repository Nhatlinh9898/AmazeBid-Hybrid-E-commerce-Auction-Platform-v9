
import React, { useState } from 'react';
import { Package, Truck, CheckCircle, AlertTriangle, X, RefreshCw, Box, Gavel, ShoppingBag, Trash2, MapPin, History, ExternalLink, Wand2 } from 'lucide-react';
import { Product, OrderStatus, ItemType, ShippingInfo } from '../types';
import { shippingService } from '../services/shippingService';
import { analyzeOrder } from '../src/services/aiOrderService';
import { detectFraud } from '../src/services/fraudDetectionService';

interface OrderDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentUserId: string; // "currentUser"
  onUpdateStatus: (productId: string, newStatus: OrderStatus, shippingInfo?: ShippingInfo) => void;
}

const OrderDashboard: React.FC<OrderDashboardProps> = ({ 
  isOpen, onClose, products, currentUserId, onUpdateStatus 
}) => {
  const [selectedTracking, setSelectedTracking] = useState<Product | null>(null);
  const [analyzedOrders, setAnalyzedOrders] = useState<Record<string, { priority: string, tags: string[] }>>({});
  const [fraudAlerts, setFraudAlerts] = useState<Record<string, { isFraudulent: boolean, fraudReason: string }>>({});
  const [isAnalyzing, setIsAnalyzing] = useState<Record<string, boolean>>({});
  const [isCheckingFraud, setIsCheckingFraud] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleAnalyzeOrder = async (product: Product) => {
    setIsAnalyzing(prev => ({ ...prev, [product.id]: true }));
    try {
      const result = await analyzeOrder(product);
      setAnalyzedOrders(prev => ({ ...prev, [product.id]: result }));
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setIsAnalyzing(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const handleDetectFraud = async (product: Product) => {
    setIsCheckingFraud(prev => ({ ...prev, [product.id]: true }));
    try {
      // Filter history for this user
      const history = products.filter(p => p.sellerId === product.sellerId && p.id !== product.id);
      // We need to cast Product to Order for the service
      const result = await detectFraud(product as unknown as Order, history as unknown as Order[]);
      setFraudAlerts(prev => ({ ...prev, [product.id]: result }));
    } catch (error) {
      console.error("Fraud detection failed:", error);
    } finally {
      setIsCheckingFraud(prev => ({ ...prev, [product.id]: false }));
    }
  };

  // Filter products
  const mySales = products.filter(p => p.sellerId === currentUserId && p.status !== OrderStatus.AVAILABLE && p.status !== OrderStatus.PENDING_VERIFICATION);
  const myPurchases = products.filter(p => p.sellerId !== currentUserId && p.status !== OrderStatus.AVAILABLE && p.status !== OrderStatus.PENDING_VERIFICATION);
  const myInventory = products.filter(p => p.sellerId === currentUserId && (p.status === OrderStatus.AVAILABLE || p.status === OrderStatus.PENDING_VERIFICATION));

  const handleConfirmShipment = (productId: string) => {
    // Simulate selecting a carrier and generating tracking
    const info = shippingService.generateTrackingInfo('GHTK');
    onUpdateStatus(productId, OrderStatus.SHIPPED, info);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING_VERIFICATION:
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-bold flex items-center gap-1"><AlertTriangle size={12}/> Chờ duyệt</span>;
      case OrderStatus.PENDING_PAYMENT:
        return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded font-bold flex items-center gap-1"><AlertTriangle size={12}/> Chờ thanh toán</span>;
      case OrderStatus.PAID_ESCROW:
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold flex items-center gap-1"><CheckCircle size={12}/> Đã thanh toán (Ký quỹ)</span>;
      case OrderStatus.PENDING_SHIPMENT:
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-bold flex items-center gap-1"><AlertTriangle size={12}/> Chờ gửi hàng</span>;
      case OrderStatus.SHIPPED:
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold flex items-center gap-1"><Truck size={12}/> Đang giao</span>;
      case OrderStatus.DELIVERED:
        return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-bold flex items-center gap-1"><Package size={12}/> Đã nhận</span>;
      case OrderStatus.COMPLETED:
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold flex items-center gap-1"><CheckCircle size={12}/> Hoàn tất</span>;
      case OrderStatus.RETURNED:
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-bold flex items-center gap-1"><RefreshCw size={12}/> Trả hàng</span>;
      default:
        return null;
    }
  };

  const OrderTimeline = ({ product }: { product: Product }) => {
    const status = product.status;
    const steps = [
      { id: OrderStatus.PAID_ESCROW, label: 'Đã thanh toán', icon: CheckCircle },
      { id: OrderStatus.SHIPPED, label: 'Đang giao', icon: Truck },
      { id: OrderStatus.COMPLETED, label: 'Hoàn tất', icon: CheckCircle },
    ];

    let currentStepIndex = 0;
    if (status === OrderStatus.SHIPPED) currentStepIndex = 1;
    if (status === OrderStatus.DELIVERED || status === OrderStatus.COMPLETED) currentStepIndex = 2;
    if (status === OrderStatus.RETURNED) return <div className="text-red-500 text-sm font-bold flex items-center gap-1 mt-3"><RefreshCw size={16}/> Đơn hàng đã bị hoàn trả</div>;

    return (
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex items-center w-full mb-2">
          {steps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isLast = index === steps.length - 1;
            const Icon = step.icon;
            
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted ? 'bg-[#febd69] border-[#febd69] text-black' : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    <Icon size={14} />
                  </div>
                  <span className={`text-[10px] font-bold mt-1 absolute top-9 w-20 text-center ${
                    isCompleted ? 'text-gray-800' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                
                {!isLast && (
                  <div className={`flex-1 h-1 mx-2 rounded transition-colors ${
                    index < currentStepIndex ? 'bg-[#febd69]' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {product.shippingInfo && (
          <div className="mt-6 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Truck size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Mã vận đơn: {product.shippingInfo.trackingNumber}</p>
                <p className="text-xs font-medium text-gray-700">Đơn vị: {product.shippingInfo.carrier}</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedTracking(product)}
              className="text-xs font-bold text-blue-700 flex items-center gap-1 hover:underline"
            >
              <History size={14} /> Chi tiết lộ trình
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-[#131921] p-4 text-white flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Package className="text-[#febd69]" /> Quản lý Đơn hàng & Kho hàng
          </h2>
          <button onClick={onClose} className="hover:bg-gray-700 p-1 rounded"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
          
          {/* Inventory Section */}
          <div className="mb-8">
             <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2 border-gray-200 text-gray-800">
              <span className="bg-purple-100 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center text-xs border border-purple-200">
                <Box size={14}/>
              </span>
              Kho hàng của tôi ({myInventory.length})
            </h3>
            {myInventory.length === 0 ? (
                 <div className="bg-white p-6 rounded-xl border border-dashed border-gray-300 text-center text-gray-400">
                    <p>Kho hàng trống. Hãy đăng bán sản phẩm để thấy ở đây.</p>
                 </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myInventory.map(item => (
                        <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex items-center gap-3">
                            <img src={item.image} className="w-12 h-12 object-cover rounded bg-gray-100" />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm truncate">{item.title}</h4>
                                <div className="flex items-center gap-2 text-xs mt-1">
                                    <span className="font-bold text-[#b12704]">${item.price}</span>
                                    {item.type === ItemType.AUCTION ? (
                                        <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Gavel size={10}/> Đấu giá</span>
                                    ) : (
                                        <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-0.5"><ShoppingBag size={10}/> Mua ngay</span>
                                    )}
                                </div>
                            </div>
                            <button className="text-gray-400 hover:text-red-500 p-2" title="Xóa">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
          </div>

          {/* Sales Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2 border-gray-200 text-gray-800">
              <span className="bg-[#febd69] text-black w-6 h-6 rounded-full flex items-center justify-center text-xs">S</span>
              Đơn bán hàng (Doanh thu tạm giữ: ${mySales.reduce((sum, p) => p.status !== OrderStatus.COMPLETED ? sum + p.price : sum, 0).toFixed(2)})
            </h3>
            
            {mySales.length === 0 ? (
              <p className="text-gray-400 text-sm italic ml-2">Chưa có đơn hàng nào cần xử lý.</p>
            ) : (
              <div className="space-y-4">
                {mySales.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <img src={item.image} className="w-16 h-16 object-cover rounded bg-gray-100" />
                      <div className="flex-1 w-full">
                        <div className="flex justify-between mb-1">
                          <h4 className="font-bold text-sm">{item.title}</h4>
                          <span className="font-bold text-green-600">+${item.price}</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">Thanh toán qua: {item.payoutMethod || 'Bank Transfer'}</div>
                        <div className="flex items-center gap-2">
                           {getStatusBadge(item.status)}
                           <span className="text-[10px] text-gray-400">ID: {item.id}</span>
                        </div>
                      </div>
                      
                      {/* Seller Actions */}
                      <div className="flex flex-col gap-2 min-w-[140px] w-full md:w-auto mt-2 md:mt-0">
                        {(item.status === OrderStatus.PENDING_SHIPMENT || item.status === OrderStatus.PAID_ESCROW) && (
                          <button 
                            onClick={() => handleConfirmShipment(item.id)}
                            className="bg-[#131921] text-white text-xs py-2 px-3 rounded font-bold hover:bg-black transition-all"
                          >
                            Xác nhận đã gửi
                          </button>
                        )}
                        {item.status === OrderStatus.SHIPPED && (
                          <span className="text-xs text-center text-gray-500 italic">Đợi người mua nhận...</span>
                        )}
                        {item.status === OrderStatus.COMPLETED && (
                          <span className="text-xs text-center text-green-600 font-bold">Tiền đã về ví</span>
                        )}
                        
                        <button 
                          onClick={() => {
                            const data = JSON.stringify(item, null, 2);
                            const blob = new Blob([data], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `order_${item.id}.json`;
                            a.click();
                          }}
                          className="bg-gray-200 text-gray-800 text-xs py-2 px-3 rounded font-bold hover:bg-gray-300 transition-all"
                        >
                          Xuất đơn hàng
                        </button>
                        
                        <button 
                          onClick={() => {
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              printWindow.document.write(`
                                <html>
                                  <head>
                                    <title>Đơn hàng ${item.id}</title>
                                    <style>
                                      body { font-family: sans-serif; padding: 20px; }
                                      h1 { font-size: 18px; }
                                      .details { margin-top: 20px; }
                                    </style>
                                  </head>
                                  <body>
                                    <h1>Chi tiết đơn hàng: ${item.title}</h1>
                                    <div class="details">
                                      <p>ID: ${item.id}</p>
                                      <p>Giá: ${item.price}</p>
                                      <p>Trạng thái: ${item.status}</p>
                                    </div>
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                              printWindow.print();
                            }
                          }}
                          className="bg-gray-200 text-gray-800 text-xs py-2 px-3 rounded font-bold hover:bg-gray-300 transition-all"
                        >
                          In đơn hàng
                        </button>
                      </div>
                    </div>
                    
                    {/* Timeline */}
                    <div className="px-2 pb-4 pt-2 border-t border-gray-50 mt-2">
                       <OrderTimeline product={item} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Purchases Section */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2 border-gray-200 text-gray-800">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">B</span>
              Đơn mua hàng của tôi
            </h3>
             {myPurchases.length === 0 ? (
              <p className="text-gray-400 text-sm italic ml-2">Bạn chưa mua đơn hàng nào.</p>
            ) : (
              <div className="space-y-4">
                {myPurchases.map(item => (
                   <div key={item.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <img src={item.image} className="w-16 h-16 object-cover rounded bg-gray-100" />
                      <div className="flex-1 w-full">
                        <div className="flex justify-between mb-1">
                          <h4 className="font-bold text-sm">{item.title}</h4>
                          <span className="font-bold text-red-600">-${item.price}</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">Hệ thống đang giữ tiền bảo đảm</div>
                        <div className="flex items-center gap-2">
                           {getStatusBadge(item.status)}
                           <span className="text-[10px] text-gray-400">ID: {item.id}</span>
                           <button 
                            onClick={() => handleAnalyzeOrder(item)}
                            disabled={isAnalyzing[item.id]}
                            className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-indigo-100"
                          >
                            <Wand2 size={10}/> {isAnalyzing[item.id] ? '...' : 'AI'}
                          </button>
                          <button 
                            onClick={() => handleDetectFraud(item)}
                            disabled={isCheckingFraud[item.id]}
                            className={`text-[10px] px-2 py-1 rounded flex items-center gap-1 ${fraudAlerts[item.id]?.isFraudulent ? 'bg-red-100 text-red-700' : 'bg-gray-50 text-gray-700'} hover:bg-gray-100`}
                          >
                            <AlertTriangle size={10}/> {isCheckingFraud[item.id] ? '...' : 'Fraud'}
                          </button>
                        </div>
                        {analyzedOrders[item.id] && (
                          <div className="flex gap-2 mt-2">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded ${analyzedOrders[item.id].priority === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                              {analyzedOrders[item.id].priority}
                            </span>
                            {analyzedOrders[item.id].tags.map(tag => (
                              <span key={tag} className="text-[10px] bg-gray-100 px-2 py-1 rounded">{tag}</span>
                            ))}
                          </div>
                        )}
                        {fraudAlerts[item.id] && fraudAlerts[item.id].isFraudulent && (
                          <div className="text-[10px] text-red-600 font-bold mt-2 bg-red-50 p-2 rounded">
                            Cảnh báo gian lận: {fraudAlerts[item.id].fraudReason}
                          </div>
                        )}
                      </div>

                      {/* Buyer Actions */}
                      <div className="flex flex-col gap-2 min-w-[140px] w-full md:w-auto mt-2 md:mt-0">
                        {(item.status === OrderStatus.PENDING_SHIPMENT || item.status === OrderStatus.PAID_ESCROW) && (
                          <span className="text-xs text-center text-gray-500 italic">Người bán đang chuẩn bị...</span>
                        )}
                        {item.status === OrderStatus.SHIPPED && (
                          <button 
                            onClick={() => onUpdateStatus(item.id, OrderStatus.COMPLETED)}
                            className="bg-[#febd69] text-black text-xs py-2 px-3 rounded font-bold hover:bg-[#f3a847] transition-all"
                          >
                            Đã nhận & Hài lòng
                          </button>
                        )}
                        {item.status === OrderStatus.SHIPPED && (
                           <button 
                            onClick={() => onUpdateStatus(item.id, OrderStatus.RETURNED)}
                            className="border border-red-200 text-red-600 text-xs py-2 px-3 rounded font-bold hover:bg-red-50 transition-all"
                          >
                            Yêu cầu trả hàng
                          </button>
                        )}
                         {item.status === OrderStatus.COMPLETED && (
                          <span className="text-xs text-center text-green-600 font-bold">Giao dịch thành công</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Timeline */}
                    <div className="px-2 pb-4 pt-2 border-t border-gray-50 mt-2">
                       <OrderTimeline product={item} />
                    </div>
                   </div>
                ))}
              </div>
             )}
          </div>

        </div>
        
        <div className="bg-gray-100 p-4 text-xs text-gray-500 text-center border-t border-gray-200">
          AmazeBid SafePay™ đảm bảo an toàn cho giao dịch. Tiền chỉ được chuyển khi người mua xác nhận. <br/>
          Nếu trả hàng, phí vận chuyển sẽ được tính cho người mua theo chính sách.
        </div>
      </div>

      {/* Tracking Modal Overlay */}
      {selectedTracking && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTracking(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><Truck size={20}/> Chi tiết lộ trình vận chuyển</h3>
              <button onClick={() => setSelectedTracking(null)}><X size={20}/></button>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Mã vận đơn</p>
                  <p className="text-lg font-black text-gray-900">{selectedTracking.shippingInfo?.trackingNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-bold uppercase">Đơn vị vận chuyển</p>
                  <p className="text-lg font-black text-blue-600">{selectedTracking.shippingInfo?.carrier}</p>
                </div>
              </div>

              <div className="space-y-6 relative">
                {/* Vertical Line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />
                
                {selectedTracking.shippingInfo?.events.map((event, idx) => (
                  <div key={event.id} className="flex gap-4 relative z-10">
                    <div className={`w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shrink-0 ${idx === 0 ? 'bg-blue-600' : 'bg-gray-300'}`}>
                      {idx === 0 && <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${idx === 0 ? 'text-gray-900' : 'text-gray-500'}`}>{event.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 flex items-center gap-1">
                          <MapPin size={10}/> {event.location}
                        </span>
                        <span className="text-[10px] text-gray-400">{new Date(event.timestamp).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-4 border-t flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <AlertTriangle size={14}/>
                  <span className="text-[10px]">Cập nhật mới nhất: Vừa xong</span>
                </div>
                <button className="text-xs font-bold text-blue-600 flex items-center gap-1">
                  Website đơn vị <ExternalLink size={12}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDashboard;
