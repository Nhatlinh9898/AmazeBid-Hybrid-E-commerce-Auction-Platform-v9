import React, { useMemo, useState, useRef } from 'react';
import { X, TrendingUp, DollarSign, Package, BarChart3, PieChart as PieChartIcon, ArrowUpRight, Link2, ExternalLink, FileText, Network, Calculator, Download, Users, MousePointer2, ShoppingCart, Star, AlertTriangle, Check, Wand2, Store as LucideStore, Truck, Briefcase, PieChart, ChevronLeft, ChevronRight } from 'lucide-react';
import { SmartComboGenerator } from './SmartComboGenerator';
import { StoreManagement } from './StoreManagement';
import { SupplyChainManagement } from './SupplyChainManagement';
import { LaborManagement } from './LaborManagement';
import { EquityManagement } from './EquityManagement';
import ProductManagement from './ProductManagement';
import InventoryDashboard from '../src/components/InventoryDashboard';
import PackagingSuggestionComponent from '../src/components/PackagingSuggestion';
import { Product, OrderStatus, ItemType } from '../types';
import { supplyChainService } from '../src/services/SupplyChainService';
import { equityService } from '../src/services/EquityService';

interface SellerDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentUserId: string;
}

type TabType = 'overview' | 'analytics' | 'network' | 'tax' | 'products' | 'alerts' | 'inventory' | 'store' | 'product-mgmt' | 'supply-chain' | 'labor' | 'equity';

const SellerDashboard: React.FC<SellerDashboardProps> = ({ isOpen, onClose, products, currentUserId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedProductForCombo, setSelectedProductForCombo] = useState<Product | null>(null);
  const [now] = useState(() => Date.now());
  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Logic tính toán thống kê
  const stats = useMemo(() => {
    const oneDayFromNow = new Date(now + 24 * 60 * 60 * 1000);
    // 1. Lọc sản phẩm của người bán hiện tại
    const myProducts = products.filter(p => p.sellerId === currentUserId);
    
    // 2. Phân loại theo trạng thái
    const activeListings = myProducts.filter(p => p.status === OrderStatus.AVAILABLE);
    const pendingListings = myProducts.filter(p => p.status === OrderStatus.PENDING_VERIFICATION);
    const soldOrders = myProducts.filter(p => 
        p.status !== OrderStatus.AVAILABLE && 
        p.status !== OrderStatus.PENDING_VERIFICATION &&
        p.status !== OrderStatus.CANCELLED &&
        p.status !== OrderStatus.RETURNED
    );
    
    // 3. Tính tổng doanh thu (Gross Revenue) & Affiliate Commission
    let totalRevenue = 0;
    let affiliateRevenue = 0;
    let physicalRevenue = 0;
    const affiliateOrders: any[] = [];

    soldOrders.forEach(order => {
        if (order.isAffiliate) {
            const commission = (order.price * (order.commissionRate || 0)) / 100;
            affiliateRevenue += commission;
            affiliateOrders.push({ ...order, commissionEarned: commission });
        } else {
            physicalRevenue += order.price;
        }
    });
    totalRevenue = physicalRevenue + affiliateRevenue;

    // 4. Thống kê theo danh mục (Category Breakdown)
    const categoryStats: Record<string, { count: number; revenue: number }> = {};
    
    soldOrders.forEach(order => {
        if (!categoryStats[order.category]) {
            categoryStats[order.category] = { count: 0, revenue: 0 };
        }
        categoryStats[order.category].count += 1;
        categoryStats[order.category].revenue += order.isAffiliate 
            ? (order.price * (order.commissionRate || 0)) / 100 
            : order.price;
    });

    // Chuyển object thành array để render
    const categoryList = Object.keys(categoryStats).map(cat => ({
        name: cat,
        count: categoryStats[cat].count,
        revenue: categoryStats[cat].revenue,
        percentage: (categoryStats[cat].revenue / (totalRevenue || 1)) * 100
    })).sort((a, b) => b.revenue - a.revenue);

    // 5. Tính toán Thuế (Giả định)
    const platformFeeRate = 0.05; // Phí sàn 5%
    const platformFee = totalRevenue * platformFeeRate;
    const taxableIncome = totalRevenue - platformFee;
    const vatTax = taxableIncome * 0.08; // VAT 8% (giả định)
    const personalIncomeTax = taxableIncome * 0.015; // Thuế TNCN 1.5% (giả định cho hộ kinh doanh)
    const netIncome = taxableIncome - vatTax - personalIncomeTax;

    // 6. Analytics Data (Mocked for charts)
    const salesData = [
      { name: 'T2', revenue: totalRevenue * 0.1, orders: 2 },
      { name: 'T3', revenue: totalRevenue * 0.15, orders: 3 },
      { name: 'T4', revenue: totalRevenue * 0.08, orders: 1 },
      { name: 'T5', revenue: totalRevenue * 0.22, orders: 5 },
      { name: 'T6', revenue: totalRevenue * 0.18, orders: 4 },
      { name: 'T7', revenue: totalRevenue * 0.25, orders: 6 },
      { name: 'CN', revenue: totalRevenue * 0.02, orders: 1 },
    ];

    const conversionData = {
      views: (soldOrders.length + activeListings.length) * 45,
      clicks: (soldOrders.length + activeListings.length) * 12,
      orders: soldOrders.length,
      rate: soldOrders.length > 0 ? (soldOrders.length / ((soldOrders.length + activeListings.length) * 45) * 100).toFixed(2) : '0.00'
    };

    // 7. Top Products Data (Stable random for demo)
    const topProductsData = myProducts.slice(0, 5).map(p => ({
      ...p,
      views: Math.floor((p.id?.length || 10) * 45.5) % 500 + 100,
      trend: Math.floor((p.title?.length || 10) * 1.2) % 20 + 5
    }));

    // 8. Inventory Alerts
    const lowStockAlerts = myProducts.filter(p => p.status === OrderStatus.AVAILABLE && (p.stock || 0) < 5);
    const expiringAuctionAlerts = myProducts.filter(p => {
        return (
            p.status === OrderStatus.AVAILABLE && 
            p.type === ItemType.AUCTION && 
            p.endTime && new Date(p.endTime) < oneDayFromNow && 
            (p.bidCount || 0) === 0
        );
    });

    // 9. Supply Chain Data (for Tax Report)
    const myInvoices = supplyChainService.getInvoicesByOwner(currentUserId);
    const myLaborCosts = equityService.getLaborCostsByOwner(currentUserId);
    const totalLaborCost = myLaborCosts.reduce((sum, c) => sum + c.amount, 0);

    // 10. Customer segments (Mocked)
    return {
        myProducts,
        totalProducts: myProducts.length,
        activeCount: activeListings.length,
        pendingCount: pendingListings.length,
        soldCount: soldOrders.length,
        totalRevenue,
        affiliateRevenue,
        physicalRevenue,
        categoryList,
        recentOrders: soldOrders.slice(0, 10), // Lấy 10 đơn gần nhất cho báo cáo thuế
        affiliateOrders,
        tax: {
            platformFee,
            taxableIncome,
            vatTax,
            personalIncomeTax,
            netIncome: netIncome - totalLaborCost // Subtract labor costs
        },
        myProductsList: myProducts,
        salesData,
        conversionData,
        topProductsData,
        lowStockAlerts,
        expiringAuctionAlerts,
        myInvoices,
        soldOrders,
        totalLaborCost
    };
  }, [products, currentUserId, now]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="relative bg-[#f3f4f6] w-full max-w-[99vw] lg:max-w-[2200px] h-[98vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-[#131921] p-5 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#febd69] p-2 rounded-lg text-black">
                <BarChart3 size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold">Kênh Người Bán & Thống Kê</h2>
                <p className="text-xs text-gray-400">Quản lý hiệu suất, mạng lưới và thuế</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-gray-700 p-2 rounded-full transition-colors"><X size={24}/></button>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white border-b border-gray-200 px-2 flex items-center relative shrink-0">
            <button 
                onClick={() => scrollTabs('left')}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors z-10 bg-white/80 backdrop-blur-sm shadow-sm"
                title="Cuộn trái"
            >
                <ChevronLeft size={20} />
            </button>

            <div 
                ref={tabsRef}
                className="flex-1 flex gap-6 px-4 overflow-x-auto no-scrollbar scroll-smooth"
            >
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-[#febd69] text-[#131921]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    <BarChart3 size={16} /> Tổng quan
                </button>
                <button 
                    onClick={() => setActiveTab('analytics')}
                    className={`py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'analytics' ? 'border-orange-500 text-orange-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    <TrendingUp size={16} /> Phân tích chuyên sâu
                </button>
                <button 
                    onClick={() => setActiveTab('network')}
                    className={`py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'network' ? 'border-purple-500 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    <Network size={16} /> Mạng lưới Affiliate
                </button>
                <button 
                    onClick={() => setActiveTab('tax')}
                    className={`py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'tax' ? 'border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    <Calculator size={16} /> Báo cáo Thuế
                </button>
                <button 
                    onClick={() => setActiveTab('products')}
                    className={`py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'products' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    <Package size={16} /> Sản phẩm & Lợi nhuận
                </button>
                <button 
                    onClick={() => setActiveTab('alerts')}
                    className={`py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'alerts' ? 'border-red-500 text-red-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    <AlertTriangle size={16} /> Cảnh báo kho
                </button>
                <button 
                    onClick={() => setActiveTab('supply-chain')}
                    className={`py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'supply-chain' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    <Truck size={16} /> Quản lý Vật tư & NCC
                </button>
                <button 
                    onClick={() => setActiveTab('labor')}
                    className={`py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'labor' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    <Briefcase size={16} /> Nhân sự & Chi phí
                </button>
                <button 
                    onClick={() => setActiveTab('equity')}
                    className={`py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'equity' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    <PieChart size={16} /> Cổ phần & Lợi nhuận
                </button>
                <button 
                    onClick={() => setActiveTab('inventory')}
                    className={`py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'inventory' ? 'border-indigo-500 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    <Package size={16} /> Dự báo & Kho
                </button>
                <button 
                    onClick={() => setActiveTab('product-mgmt')}
                    className={`py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'product-mgmt' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    <Package size={16} /> Quản lý sản phẩm
                </button>
                <button 
                    onClick={() => setActiveTab('store')}
                    className={`py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'store' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    <LucideStore size={16} /> Quản lý Cửa hàng
                </button>
            </div>

            <button 
                onClick={() => scrollTabs('right')}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors z-10 bg-white/80 backdrop-blur-sm shadow-sm"
                title="Cuộn phải"
            >
                <ChevronRight size={20} />
            </button>
        </div>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {activeTab === 'inventory' && <InventoryDashboard products={products} />}
            {activeTab === 'product-mgmt' && <ProductManagement />}
            {activeTab === 'store' && <StoreManagement ownerId={currentUserId} />}
            {activeTab === 'supply-chain' && <SupplyChainManagement ownerId={currentUserId} onTabChange={setActiveTab} />}
            {activeTab === 'labor' && <LaborManagement ownerId={currentUserId} onTabChange={setActiveTab} />}
            {activeTab === 'equity' && (
              <EquityManagement 
                ownerId={currentUserId} 
                onTabChange={setActiveTab}
                initialRevenue={stats.totalRevenue}
                initialLaborCost={stats.totalLaborCost}
                initialSupplyCost={stats.myInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)}
              />
            )}
            
            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* 1. Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {/* Total Income */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2">
                                <div className="bg-green-100 p-2 rounded-lg text-green-700">
                                    <DollarSign size={20} />
                                </div>
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12.5%</span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Tổng thu nhập</p>
                                <h3 className="text-2xl font-black text-gray-900">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                            </div>
                        </div>

                        {/* Sales Count */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2">
                                <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                                    <Package size={20} />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Đơn hàng đã bán</p>
                                <h3 className="text-2xl font-black text-gray-900">{stats.soldCount} <span className="text-sm text-gray-400 font-normal">đơn</span></h3>
                            </div>
                        </div>

                        {/* Affiliate Income */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-16 h-16 bg-gradient-to-bl from-purple-100 to-transparent rounded-bl-full -mr-2 -mt-2"></div>
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <div className="bg-purple-100 p-2 rounded-lg text-purple-700">
                                    <Link2 size={20} />
                                </div>
                                <span className="text-[10px] font-bold text-purple-600 border border-purple-200 px-2 py-1 rounded-full">Affiliate</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-sm text-gray-500 font-medium">Hoa hồng tiếp thị</p>
                                <h3 className="text-2xl font-black text-purple-700">${stats.affiliateRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                            </div>
                        </div>

                        {/* Active Listings */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2">
                                <div className="bg-orange-100 p-2 rounded-lg text-orange-700">
                                    <TrendingUp size={20} />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Đang niêm yết</p>
                                <h3 className="text-2xl font-black text-gray-900">{stats.activeCount} <span className="text-sm text-gray-400 font-normal">sản phẩm</span></h3>
                            </div>
                        </div>

                        {/* Pending Verification */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2">
                                <div className="bg-yellow-100 p-2 rounded-lg text-yellow-700">
                                    <AlertTriangle size={20} />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Chờ duyệt</p>
                                <h3 className="text-2xl font-black text-gray-900">{stats.pendingCount} <span className="text-sm text-gray-400 font-normal">sản phẩm</span></h3>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* 2. Sales by Category (Bar Chart Visualization) */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <PieChartIcon size={18} className="text-[#febd69]"/> Doanh thu theo danh mục
                                </h3>
                            </div>

                            {stats.categoryList.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
                                    <BarChart3 size={48} className="mb-2 opacity-20"/>
                                    <p>Chưa có dữ liệu bán hàng.</p>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {stats.categoryList.map((cat, idx) => (
                                        <div key={idx}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-bold text-gray-700">{cat.name}</span>
                                                <span className="font-bold text-gray-900">${cat.revenue.toFixed(2)} ({cat.percentage.toFixed(1)}%)</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                <div 
                                                    className="bg-[#febd69] h-2.5 rounded-full transition-all duration-1000" 
                                                    style={{ width: `${cat.percentage}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">{cat.count} đơn hàng</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 3. Recent Transactions / Affiliate Highlight */}
                        <div className="space-y-6">
                            {/* Affiliate Quick Stats */}
                            <div className="bg-gradient-to-br from-[#131921] to-black text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Link2 size={100} />
                                </div>
                                <h3 className="font-bold text-lg mb-1 relative z-10">Hiệu suất Affiliate</h3>
                                <p className="text-gray-400 text-sm mb-4 relative z-10">Thu nhập thụ động từ chia sẻ liên kết</p>
                                
                                <div className="space-y-3 relative z-10">
                                    <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                        <span className="text-sm text-gray-300">Tổng doanh số tạo ra</span>
                                        {/* Giả định hoa hồng trung bình 5% để tính ngược doanh số */}
                                        <span className="font-bold text-[#febd69]">${(stats.affiliateRevenue * 20).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                        <span className="text-sm text-gray-300">Đơn hàng liên kết</span>
                                        <span className="font-bold text-white">{stats.affiliateOrders.length}</span>
                                    </div>
                                    <button onClick={() => setActiveTab('network')} className="w-full mt-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                                        <ExternalLink size={12}/> Xem báo cáo chi tiết mạng lưới
                                    </button>
                                </div>
                            </div>

                            {/* Recent Orders List */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex-1">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <ArrowUpRight size={18} className="text-green-600"/> Đơn hàng gần đây
                                </h3>
                                {stats.recentOrders.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">Chưa có đơn hàng nào.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {stats.recentOrders.map(order => (
                                            <div key={order.id} className="flex items-center gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs shrink-0">
                                                    {order.isAffiliate ? 'AFF' : 'SALE'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate">{order.title}</p>
                                                    <p className="text-xs text-gray-500">{new Date().toLocaleDateString()}</p>
                                                </div>
                                                <span className={`text-sm font-bold ${order.isAffiliate ? 'text-purple-600' : 'text-green-600'}`}>
                                                    +${order.isAffiliate ? ((order.price * (order.commissionRate || 0)) / 100).toFixed(2) : order.price}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                {/* Conversion Funnel */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-gray-100 p-2 rounded-lg text-gray-600"><Users size={18}/></div>
                      <span className="text-xs font-bold text-gray-500 uppercase">Lượt xem</span>
                    </div>
                    <h4 className="text-2xl font-black">{stats.conversionData.views}</h4>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><MousePointer2 size={18}/></div>
                      <span className="text-xs font-bold text-gray-500 uppercase">Lượt click</span>
                    </div>
                    <h4 className="text-2xl font-black">{stats.conversionData.clicks}</h4>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><ShoppingCart size={18}/></div>
                      <span className="text-xs font-bold text-gray-500 uppercase">Đơn hàng</span>
                    </div>
                    <h4 className="text-2xl font-black">{stats.conversionData.orders}</h4>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 p-5 rounded-xl text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-white/20 p-2 rounded-lg text-white"><TrendingUp size={18}/></div>
                      <span className="text-xs font-bold text-white/80 uppercase">Tỷ lệ chuyển đổi</span>
                    </div>
                    <h4 className="text-2xl font-black">{stats.conversionData.rate}%</h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue Chart */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <DollarSign size={18} className="text-green-600"/> Xu hướng doanh thu (7 ngày qua)
                    </h3>
                    <div className="h-64 w-full flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <p className="text-gray-400 text-sm">Biểu đồ doanh thu (Đang bảo trì hiển thị)</p>
                    </div>
                  </div>

                  {/* Orders Chart */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Package size={18} className="text-blue-600"/> Số lượng đơn hàng
                    </h3>
                    <div className="h-64 w-full flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <p className="text-gray-400 text-sm">Biểu đồ đơn hàng (Đang bảo trì hiển thị)</p>
                    </div>
                  </div>

                  {/* Customer Segments Chart */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Users size={18} className="text-purple-600"/> Phân tích khách hàng mục tiêu
                    </h3>
                    <div className="h-64 w-full flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <p className="text-gray-400 text-sm">Phân tích khách hàng (Đang bảo trì hiển thị)</p>
                    </div>
                  </div>
                </div>

                {/* Top Products */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Star size={18} className="text-yellow-500"/> Sản phẩm bán chạy & Xu hướng
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="p-3 rounded-tl-lg">Sản phẩm</th>
                          <th className="p-3">Lượt xem</th>
                          <th className="p-3">Đã bán</th>
                          <th className="p-3">Doanh thu</th>
                          <th className="p-3 text-right rounded-tr-lg">Xu hướng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {stats.topProductsData.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="p-3 flex items-center gap-3">
                              <img src={p.image} className="w-8 h-8 rounded object-cover" referrerPolicy="no-referrer" />
                              <span className="font-medium truncate max-w-[200px]">{p.title}</span>
                            </td>
                            <td className="p-3 text-gray-500">{p.views}</td>
                            <td className="p-3 font-bold text-gray-900">{p.sold || 0}</td>
                            <td className="p-3 font-bold text-green-600">${((p.sold || 0) * p.price).toFixed(2)}</td>
                            <td className="p-3 text-right">
                              <span className="text-green-500 flex items-center justify-end gap-1 font-bold">
                                <TrendingUp size={14}/> +{p.trend}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: NETWORK REPORT */}
            {activeTab === 'network' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                                    <Network className="text-purple-600"/> Báo cáo Chi tiết Mạng lưới Affiliate
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Theo dõi hiệu suất của các đối tác tiếp thị liên kết</p>
                            </div>
                            <button 
                                onClick={() => alert('Đang chuẩn bị tệp CSV...')}
                                className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-100 transition-colors"
                            >
                                <Download size={16} /> Xuất CSV
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="border border-purple-100 bg-purple-50/50 p-4 rounded-lg">
                                <p className="text-sm text-purple-600 font-medium">Tổng hoa hồng đã nhận</p>
                                <p className="text-2xl font-black text-purple-900">${stats.affiliateRevenue.toFixed(2)}</p>
                            </div>
                            <div className="border border-purple-100 bg-purple-50/50 p-4 rounded-lg">
                                <p className="text-sm text-purple-600 font-medium">Số đơn hàng Affiliate</p>
                                <p className="text-2xl font-black text-purple-900">{stats.affiliateOrders.length}</p>
                            </div>
                            <div className="border border-purple-100 bg-purple-50/50 p-4 rounded-lg">
                                <p className="text-sm text-purple-600 font-medium">Tỷ lệ chuyển đổi (Ước tính)</p>
                                <p className="text-2xl font-black text-purple-900">4.2%</p>
                            </div>
                        </div>

                        <h4 className="font-bold text-gray-800 mb-4">Lịch sử giao dịch Affiliate</h4>
                        {stats.affiliateOrders.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <Link2 size={40} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-gray-500">Chưa có giao dịch Affiliate nào được ghi nhận.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="p-3 rounded-tl-lg">Sản phẩm</th>
                                            <th className="p-3">Ngày giao dịch</th>
                                            <th className="p-3">Giá trị đơn</th>
                                            <th className="p-3">Tỷ lệ hoa hồng</th>
                                            <th className="p-3 text-right rounded-tr-lg">Hoa hồng nhận được</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {stats.affiliateOrders.map((order, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="p-3 font-medium text-gray-900">{order.title}</td>
                                                <td className="p-3 text-gray-500">{new Date().toLocaleDateString()}</td>
                                                <td className="p-3">${order.price.toFixed(2)}</td>
                                                <td className="p-3 text-purple-600 font-medium">{order.commissionRate}%</td>
                                                <td className="p-3 text-right font-bold text-green-600">+${order.commissionEarned.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: TAX REPORT */}
            {activeTab === 'tax' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                                    <Calculator className="text-blue-600"/> Tổng hợp Báo cáo Tính Thuế
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Ước tính nghĩa vụ thuế và phí nền tảng (Kỳ báo cáo: Tháng này)</p>
                            </div>
                            <button 
                                onClick={() => window.print()}
                                className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-100 transition-colors"
                            >
                                <FileText size={16} /> In Báo Cáo
                            </button>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                                    <span className="text-gray-600 font-medium">Tổng doanh thu gộp (Gross Revenue)</span>
                                    <span className="font-bold text-lg text-gray-900">${stats.totalRevenue.toFixed(2)}</span>
                                </div>
                                
                                <div className="flex justify-between items-center text-red-500">
                                    <span>Trừ: Phí nền tảng AmazeBid (5%)</span>
                                    <span>-${stats.tax.platformFee.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between items-center pb-4 border-b border-gray-200 pt-2">
                                    <span className="text-gray-800 font-bold">Thu nhập chịu thuế (Taxable Income)</span>
                                    <span className="font-bold text-lg text-gray-900">${stats.tax.taxableIncome.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between items-center text-orange-600">
                                    <span>Ước tính Thuế GTGT / VAT (8%)</span>
                                    <span>-${stats.tax.vatTax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-orange-600 pb-4 border-b border-gray-200">
                                    <span>Ước tính Thuế TNCN (1.5%)</span>
                                    <span>-${stats.tax.personalIncomeTax.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between items-center text-red-600 pt-2">
                                    <span>Trừ: Chi phí nhân công & vận hành</span>
                                    <span>-${stats.totalLaborCost.toLocaleString()}</span>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                    <span className="text-gray-900 font-black text-lg">Thu nhập ròng ước tính (Net Income)</span>
                                    <span className="font-black text-2xl text-green-600">${stats.tax.netIncome.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 bg-blue-50 text-blue-800 p-4 rounded-lg text-sm flex items-start gap-3">
                            <div className="mt-0.5"><FileText size={18} /></div>
                            <p>
                                <strong>Lưu ý pháp lý:</strong> Các số liệu thuế trên chỉ mang tính chất ước tính dựa trên quy định hiện hành dành cho hộ kinh doanh cá thể. 
                                Vui lòng tham khảo ý kiến chuyên gia tư vấn thuế hoặc xuất báo cáo chi tiết để nộp cho cơ quan thuế địa phương.
                            </p>
                        </div>

                        {/* Detailed Lists for Tax Reporting */}
                        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Sold Orders List */}
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                        <ShoppingCart size={16} className="text-green-600"/> Đơn hàng đã bán
                                    </h4>
                                    <span className="text-xs font-bold text-gray-500">{stats.soldOrders.length} đơn</span>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left text-xs">
                                        <thead className="sticky top-0 bg-white border-b border-gray-100">
                                            <tr className="text-gray-400 uppercase">
                                                <th className="p-3">Sản phẩm</th>
                                                <th className="p-3">Giá</th>
                                                <th className="p-3 text-right">Ngày</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {stats.soldOrders.map(order => (
                                                <tr key={order.id} className="hover:bg-gray-50">
                                                    <td className="p-3 font-medium text-gray-900 truncate max-w-[150px]">{order.title}</td>
                                                    <td className="p-3 font-bold text-green-600">${order.price.toLocaleString()}</td>
                                                    <td className="p-3 text-right text-gray-500">{new Date().toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                            {stats.soldOrders.length === 0 && (
                                                <tr><td colSpan={3} className="p-8 text-center text-gray-400 italic">Chưa có đơn hàng</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Purchase Invoices List */}
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                        <FileText size={16} className="text-blue-600"/> Hóa đơn nhập hàng
                                    </h4>
                                    <span className="text-xs font-bold text-gray-500">{stats.myInvoices.length} HĐ</span>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left text-xs">
                                        <thead className="sticky top-0 bg-white border-b border-gray-100">
                                            <tr className="text-gray-400 uppercase">
                                                <th className="p-3">Mã HĐ</th>
                                                <th className="p-3">Tổng tiền</th>
                                                <th className="p-3 text-right">Ngày</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {stats.myInvoices.map(inv => (
                                                <tr key={inv.id} className="hover:bg-gray-50">
                                                    <td className="p-3 font-mono text-blue-600">{inv.id}</td>
                                                    <td className="p-3 font-bold text-red-600">${inv.totalAmount.toLocaleString()}</td>
                                                    <td className="p-3 text-right text-gray-500">{inv.invoiceDate}</td>
                                                </tr>
                                            ))}
                                            {stats.myInvoices.length === 0 && (
                                                <tr><td colSpan={3} className="p-8 text-center text-gray-400 italic">Chưa có hóa đơn nhập</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: PRODUCTS & PROFIT */}
            {activeTab === 'products' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                                    <Package className="text-emerald-600"/> Quản lý Sản phẩm & Lợi nhuận
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Tối ưu hóa danh mục và tạo combo thông minh bằng AI</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {stats.myProducts.map(product => (
                                <div key={product.id} className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden flex flex-col group hover:border-emerald-400 transition-all">
                                    <div className="aspect-video relative overflow-hidden">
                                        <img src={product.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                            <div className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold text-gray-800 shadow-sm">
                                                {product.category}
                                            </div>
                                            {product.status === OrderStatus.PENDING_VERIFICATION && (
                                                <div className="bg-yellow-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1">
                                                    <AlertTriangle size={10} /> Chờ duyệt
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <h4 className="font-bold text-gray-900 mb-1 truncate">{product.title}</h4>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-sm font-black text-emerald-600">${product.price}</span>
                                            <span className="text-xs text-gray-500">Đã bán: {product.sold || 0}</span>
                                        </div>
                                        
                                        <div className="mt-auto space-y-2">
                                            <button 
                                                onClick={() => setSelectedProductForCombo(product)}
                                                disabled={product.status === OrderStatus.PENDING_VERIFICATION}
                                                className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${product.status === OrderStatus.PENDING_VERIFICATION ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
                                            >
                                                <Wand2 size={14} /> Tạo Combo AI
                                            </button>
                                            <button className="w-full bg-white border border-gray-200 text-gray-600 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all">
                                                Chi tiết lợi nhuận
                                            </button>
                                            <PackagingSuggestionComponent product={product} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Smart Combo Modal Overlay */}
            {selectedProductForCombo && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProductForCombo(null)} />
                    <div className="relative w-full max-w-4xl animate-in zoom-in-95 duration-200">
                        <SmartComboGenerator 
                            product={selectedProductForCombo} 
                            onClose={() => setSelectedProductForCombo(null)} 
                        />
                    </div>
                </div>
            )}

            {/* TAB: ALERTS */}
            {activeTab === 'alerts' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-red-600"/> Cảnh báo kho hàng
                  </h3>
                  
                  <div className="space-y-4">
                    {stats.lowStockAlerts.length === 0 && stats.expiringAuctionAlerts.length === 0 && (
                      <div className="text-center py-10 text-gray-500">
                        <Check size={40} className="mx-auto text-green-500 mb-2"/>
                        <p>Kho hàng của bạn đang ở trạng thái tốt!</p>
                      </div>
                    )}

                    {stats.lowStockAlerts.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl">
                        <div className="flex items-center gap-3">
                          <img src={p.image} className="w-12 h-12 rounded object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <p className="font-bold text-gray-900">{p.title}</p>
                            <p className="text-xs text-red-600 font-bold">Sắp hết hàng: Chỉ còn {p.stock} sản phẩm</p>
                          </div>
                        </div>
                        <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-700">Nhập thêm</button>
                      </div>
                    ))}

                    {stats.expiringAuctionAlerts.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-xl">
                        <div className="flex items-center gap-3">
                          <img src={p.image} className="w-12 h-12 rounded object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <p className="font-bold text-gray-900">{p.title}</p>
                            <p className="text-xs text-orange-600 font-bold">Đấu giá sắp kết thúc mà chưa có người thầu</p>
                          </div>
                        </div>
                        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-orange-700">Tăng hiển thị</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

        </div>
      </div>

      {/* PRINT REPORT TEMPLATE (Hidden in UI, visible in Print) */}
      <div id="print-report" className="hidden print:block">
        <div className="text-center mb-8 border-b-2 border-gray-900 pb-4">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Báo cáo Tài chính AmazeBid</h1>
          <p className="text-sm text-gray-500 mt-1">Kênh Người Bán & Thống Kê - {new Date().toLocaleDateString('vi-VN')}</p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-lg font-bold border-b border-gray-300 mb-3 pb-1">Thông tin người bán</h2>
            <p className="text-sm">ID Người bán: <span className="font-mono">{currentUserId}</span></p>
            <p className="text-sm">Ngày xuất báo cáo: {new Date().toLocaleString('vi-VN')}</p>
          </div>
          <div>
            <h2 className="text-lg font-bold border-b border-gray-300 mb-3 pb-1">Tóm tắt tài chính</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Tổng doanh thu:</span><span className="font-bold">${stats.totalRevenue.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Phí nền tảng (5%):</span><span className="font-bold">-${stats.tax.platformFee.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Thu nhập chịu thuế:</span><span className="font-bold">${stats.tax.taxableIncome.toFixed(2)}</span></div>
              <div className="flex justify-between text-red-600"><span>Chi phí nhân công:</span><span className="font-bold">-${stats.totalLaborCost.toLocaleString()}</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                <span className="font-bold">Thu nhập ròng (Net):</span>
                <span className="font-black text-lg text-green-700">${stats.tax.netIncome.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold bg-gray-100 p-2 mb-4">Chi tiết đơn hàng đã bán ({stats.soldOrders.length})</h2>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="py-2">Mã đơn</th>
                <th className="py-2">Sản phẩm</th>
                <th className="py-2">Danh mục</th>
                <th className="py-2 text-right">Giá bán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.soldOrders.map(order => (
                <tr key={order.id}>
                  <td className="py-2 font-mono text-xs">{order.id}</td>
                  <td className="py-2">{order.title}</td>
                  <td className="py-2">{order.category}</td>
                  <td className="py-2 text-right font-bold">${order.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold bg-gray-100 p-2 mb-4">Chi tiết hóa đơn nhập hàng ({stats.myInvoices.length})</h2>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="py-2">Mã HĐ</th>
                <th className="py-2">Ngày nhập</th>
                <th className="py-2">Nhà cung cấp</th>
                <th className="py-2 text-right">Tổng tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.myInvoices.map(inv => (
                <tr key={inv.id}>
                  <td className="py-2 font-mono text-xs">{inv.id}</td>
                  <td className="py-2">{inv.invoiceDate}</td>
                  <td className="py-2">NCC ID: {inv.supplierId}</td>
                  <td className="py-2 text-right font-bold">${inv.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-300 text-center text-xs text-gray-400">
          <p>Báo cáo này được tạo tự động bởi hệ thống AmazeBid. Dữ liệu được cập nhật theo thời gian thực.</p>
          <p>© 2026 AmazeBid Platform - Hybrid E-commerce & Auction</p>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
