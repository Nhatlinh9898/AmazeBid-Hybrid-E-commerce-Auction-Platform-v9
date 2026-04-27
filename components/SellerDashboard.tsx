import React from 'react';
import { X, TrendingUp, DollarSign, Package, BarChart3, PieChart as PieChartIcon, ArrowUpRight, Link2, ExternalLink, FileText, Network, Calculator, Download, Users, MousePointer2, ShoppingCart, Star, AlertTriangle, Check, Wand2, Store as LucideStore, Truck, Briefcase, PieChart, ChevronLeft, ChevronRight, Calendar, Cpu } from 'lucide-react';
import { SmartComboGenerator } from './SmartComboGenerator';
import { StoreManagement } from './StoreManagement';
import { SupplyChainManagement } from './SupplyChainManagement';
import { LaborManagement } from './LaborManagement';
import { EquityManagement } from './EquityManagement';
import ProductManagement from './ProductManagement';
import SellerOrderManagement from './SellerOrderManagement';
import InventoryDashboard from '../src/components/InventoryDashboard';
import PackagingSuggestionComponent from '../src/components/PackagingSuggestion';
import { Product, OrderStatus, ItemType, PhysicalStore, Order } from '../types';
import { supplyChainService } from '../src/services/SupplyChainService';
import { equityService } from '../src/services/EquityService';
import { localAnalyzeProfit } from '../src/services/inventoryService';
import { useAuth } from '../context/useAuth';
import { storeService } from '../services/StoreService';
import { configService } from '../services/ConfigService';
import { api } from '../services/api';
import { GlobalConfig } from '../types';

import { workforceService } from '../services/WorkforceService';

interface SellerDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentUserId: string;
  onRefreshProducts?: () => void;
}

type TabType = 'overview' | 'analytics' | 'network' | 'tax' | 'products' | 'alerts' | 'inventory' | 'store' | 'product-mgmt' | 'supply-chain' | 'labor' | 'equity' | 'orders' | 'workplace';

const SellerDashboard: React.FC<SellerDashboardProps> = ({ isOpen, onClose, products, currentUserId, onRefreshProducts }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState<TabType>('overview');
  const [globalConfig, setGlobalConfig] = React.useState<GlobalConfig>(() => configService.getConfig());
  const [selectedProductForCombo, setSelectedProductForCombo] = React.useState<Product | null>(null);
  const [selectedProductForProfit, setSelectedProductForProfit] = React.useState<Product | null>(null);

  React.useEffect(() => {
    const unsub = configService.subscribe(setGlobalConfig);
    return () => unsub();
  }, []);
  const [now] = React.useState(() => Date.now());
  const tabsRef = React.useRef<HTMLDivElement>(null);

  // Filte states for Tax Report
  const [startDate, setStartDate] = React.useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = React.useState(() => new Date().toISOString().split('T')[0]);
  const [selectedStoreId, setSelectedStoreId] = React.useState<string>('all');
  const [stores, setStores] = React.useState<PhysicalStore[]>([]);
  const [realOrders, setRealOrders] = React.useState<Order[]>([]);

  const fetchRealOrders = React.useCallback(async () => {
    try {
      const response = await api.orders.getSellerOrders(currentUserId);
      if (response && response.orders) {
        setRealOrders(response.orders);
      }
    } catch (err) {
      console.error('Failed to fetch real orders for dashboard:', err);
    }
  }, [currentUserId]);

  React.useEffect(() => {
    if (isOpen) {
      const load = async () => {
        await fetchRealOrders();
      };
      load();
    }
  }, [isOpen, fetchRealOrders]);

  React.useEffect(() => {
    const unsubscribe = storeService.subscribe((allStores) => {
        setStores(allStores.filter(s => s.ownerId === currentUserId));
    });
    return unsubscribe;
  }, [currentUserId]);

  const isStaff = React.useMemo(() => workforceService.getStoresByStaff(currentUserId).length > 0, [currentUserId]);

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
  const stats = React.useMemo(() => {
    const oneDayFromNow = new Date(now + 24 * 60 * 60 * 1000);
    // 1. Lọc sản phẩm của người bán hiện tại và theo filter (cho Tax Report)
    const myProducts = products.filter(p => p.sellerId === currentUserId);
    
    // Filter by date for tax period
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    endObj.setHours(23, 59, 59, 999);

    const legacySoldOrders = myProducts.filter(p => {
        if (!p.soldDate) return false;
        const soldDate = new Date(p.soldDate);
        return soldDate >= startObj && soldDate <= endObj;
    });

    // POS and other real orders from the API
    const filteredRealOrders = realOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        const matchesDate = orderDate >= startObj && orderDate <= endObj;
        const matchesStore = selectedStoreId === 'all' || o.storeId === selectedStoreId;
        return matchesDate && matchesStore;
    });

    // Flatten all items from orders to treat them similar to product entries for cat stats
    const allOrderLineItems: any[] = [];
    
    // Process legacy orders
    legacySoldOrders.forEach(p => {
      allOrderLineItems.push({
        id: p.id,
        title: p.title,
        price: p.price,
        category: p.category,
        quantity: 1,
        isAffiliate: p.isAffiliate,
        commissionRate: p.commissionRate,
        vatRate: p.vatRate,
        specialTaxRate: p.specialTaxRate,
        soldDate: p.soldDate,
        isPOS: false
      });
    });

    // Process real orders (including POS)
    filteredRealOrders.forEach(order => {
      order.items.forEach(item => {
        allOrderLineItems.push({
          ...item,
          quantity: item.quantity || 1,
          soldDate: order.createdAt,
          isPOS: order.isPOS
        });
      });
    });

    // 2. Phân loại theo trạng thái
    const activeListings = myProducts.filter(p => p.status === OrderStatus.AVAILABLE);
    const pendingListings = myProducts.filter(p => p.status === OrderStatus.PENDING_VERIFICATION);
    
    // 3. Tính tổng doanh thu (Gross Revenue) & Affiliate Commission
    let totalRevenue = 0;
    let affiliateRevenue = 0;
    let physicalRevenue = 0;
    let posRevenue = 0;
    const affiliateHighlightOrders: any[] = [];

    allOrderLineItems.forEach(item => {
        if (item.isAffiliate) {
            const commission = (item.price * (item.commissionRate || 0)) / 100;
            affiliateRevenue += commission;
            affiliateHighlightOrders.push({ ...item, commissionEarned: commission });
        } else {
            const lineTotal = item.price * (item.quantity || 1);
            physicalRevenue += lineTotal;
            if (item.isPOS) posRevenue += lineTotal;
        }
    });
    totalRevenue = physicalRevenue + affiliateRevenue;

    // 4. Thống kê theo danh mục (Category Breakdown)
    const categoryStats: Record<string, { count: number; revenue: number }> = {};
    
    allOrderLineItems.forEach(item => {
        if (!categoryStats[item.category]) {
            categoryStats[item.category] = { count: 0, revenue: 0 };
        }
        categoryStats[item.category].count += (item.quantity || 1);
        categoryStats[item.category].revenue += item.isAffiliate 
            ? (item.price * (item.commissionRate || 0)) / 100 
            : (item.price * (item.quantity || 1));
    });

    // Chuyển object thành array để render
    const categoryList = Object.keys(categoryStats).map(cat => ({
        name: cat,
        count: categoryStats[cat].count,
        revenue: categoryStats[cat].revenue,
        percentage: (categoryStats[cat].revenue / (totalRevenue || 1)) * 100
    })).sort((a, b) => b.revenue - a.revenue);

    const totalAiSpending = (user?.wallet?.transactions || [])
        .filter((tx: any) => tx.type === 'AI_FEE')
        .reduce((sum: number, tx: any) => sum + tx.amount, 0);

    // 9. Supply Chain Data (moved up)
    const allInvoices = supplyChainService.getInvoicesByOwner(currentUserId);
    const myInvoices = allInvoices.filter((inv: any) => {
        const d = new Date(inv.date);
        return d >= startObj && d <= endObj;
    });
    const myLaborCosts = equityService.getLaborCostsByOwner(currentUserId);
    const totalLaborCost = myLaborCosts.reduce((sum, c) => sum + c.amount, 0);

    // 5. Tính toán Thuế (Sử dụng ConfigService)
    const platformFee = totalRevenue * globalConfig.platformFeeRate;
    const totalSupplyCost = myInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || inv.amount || 0), 0);
    const taxableIncome = Math.max(0, totalRevenue - platformFee - totalSupplyCost - totalLaborCost - totalAiSpending);
    
    // VAT calculation
    let totalVat = 0;
    allOrderLineItems.forEach(item => {
       const rate = item.vatRate !== undefined ? item.vatRate : globalConfig.defaultVatRate;
       const lineTotal = item.price * (item.quantity || 1);
       const vatAmount = (lineTotal / (1 + (item.specialTaxRate || 0) + rate)) * rate;
       totalVat += vatAmount;
    });

    const personalIncomeTax = taxableIncome * globalConfig.personalIncomeTaxRate;
    const netIncome = taxableIncome - totalVat - personalIncomeTax;

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
      views: (allOrderLineItems.length + activeListings.length) * 45,
      clicks: (allOrderLineItems.length + activeListings.length) * 12,
      orders: filteredRealOrders.length + legacySoldOrders.length,
      rate: (filteredRealOrders.length + legacySoldOrders.length) > 0 ? ((filteredRealOrders.length + legacySoldOrders.length) / ((allOrderLineItems.length + activeListings.length) * 45) * 100).toFixed(2) : '0.00'
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

    // 10. Grouping sold orders by Month/Quarter for Tax Report
    const groupedOrders = allOrderLineItems.map((item) => {
        const dateObj = new Date(item.soldDate || now);
        const month = dateObj.getMonth() + 1;
        const year = dateObj.getFullYear();
        const quarter = Math.ceil(month / 3);
        return { ...item, month, year, quarter };
    });

    const monthlyStats: Record<string, { month: number, year: number, revenue: number, count: number, orders: any[] }> = {};
    const quarterlyStats: Record<string, { quarter: number, year: number, revenue: number, count: number, orders: any[] }> = {};

    groupedOrders.forEach(order => {
        const monthKey = `${order.year}-${order.month}`;
        if (!monthlyStats[monthKey]) {
            monthlyStats[monthKey] = { month: order.month, year: order.year, revenue: 0, count: 0, orders: [] };
        }
        monthlyStats[monthKey].revenue += (order.price * (order.quantity || 1));
        monthlyStats[monthKey].count += (order.quantity || 1);
        monthlyStats[monthKey].orders.push(order);

        const quarterKey = `${order.year}-Q${order.quarter}`;
        if (!quarterlyStats[quarterKey]) {
            quarterlyStats[quarterKey] = { quarter: order.quarter, year: order.year, revenue: 0, count: 0, orders: [] };
        }
        quarterlyStats[quarterKey].revenue += (order.price * (order.quantity || 1));
        quarterlyStats[quarterKey].count += (order.quantity || 1);
        quarterlyStats[quarterKey].orders.push(order);
    });

    const isIframe = typeof window !== 'undefined' && window.self !== window.top;

    // 11. Customer segments (Mocked)
    return {
        myProducts,
        isIframe,
        totalProducts: myProducts.length,
        activeCount: activeListings.length,
        pendingCount: pendingListings.length,
        soldCount: filteredRealOrders.length + legacySoldOrders.length,
        totalRevenue,
        affiliateRevenue,
        physicalRevenue,
        posRevenue,
        totalAiSpending,
        categoryList,
        recentOrders: allOrderLineItems.sort((a, b) => (b.soldDate || '').localeCompare(a.soldDate || '')).slice(0, 10),
        monthlyStats: Object.values(monthlyStats).sort((a, b) => b.year - a.year || b.month - a.month),
        quarterlyStats: Object.values(quarterlyStats).sort((a, b) => b.year - a.year || b.quarter - a.quarter),
        affiliateOrders: affiliateHighlightOrders,
        tax: {
            platformFee,
            taxableIncome,
            vatTax: totalVat,
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
        soldOrders: groupedOrders,
        totalLaborCost
    };
  }, [products, realOrders, currentUserId, now, startDate, endDate, globalConfig, user, selectedStoreId]);

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
                {isStaff && (
                  <button 
                    onClick={() => setActiveTab('workplace')}
                    className={`py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'workplace' ? 'border-indigo-600 text-indigo-700 font-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                  >
                    <Briefcase size={16} /> Nơi làm việc (Nhân viên)
                  </button>
                )}
                <button 
                    onClick={() => setActiveTab('orders')}
                    className={`py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'orders' ? 'border-amber-600 text-amber-700 font-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    <ShoppingCart size={16} /> Quản lý đơn hàng
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
            {activeTab === 'orders' && <SellerOrderManagement products={products} currentUserId={currentUserId} globalConfig={globalConfig} />}
            {activeTab === 'inventory' && <InventoryDashboard products={products} onRefreshProducts={onRefreshProducts} />}
            {activeTab === 'product-mgmt' && <ProductManagement onUpdate={onRefreshProducts} />}
            {activeTab === 'store' && <StoreManagement ownerId={currentUserId} onRefreshProducts={onRefreshProducts} />}
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
            {activeTab === 'workplace' && (
              <StoreManagement ownerId={currentUserId} isStaffMode={true} onRefreshProducts={onRefreshProducts} />
            )}

            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* 1. Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                                <h3 className="text-2xl font-black text-gray-900">${(Number(stats.totalRevenue) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                            </div>
                        </div>

                        {/* AI Investing Card */}
                        <div className="bg-white p-5 rounded-xl border border-indigo-200 shadow-sm flex flex-col justify-between bg-gradient-to-br from-white to-indigo-50/30">
                            <div className="flex justify-between items-start mb-2">
                                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700 shadow-sm">
                                    <Cpu size={20} />
                                </div>
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-widest leading-none flex items-center">Amaze AI</span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Chi phí AI</p>
                                <h3 className="text-2xl font-black text-indigo-900">{(stats.totalAiSpending || 0).toLocaleString('vi-VN')} {globalConfig.currencySymbol}</h3>
                                <p className="text-[10px] text-indigo-400 mt-1 font-bold italic">Tối ưu hoá SEO & Hình ảnh</p>
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
                                <h3 className="text-2xl font-black text-purple-700">${(Number(stats.affiliateRevenue) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
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
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 printable-report">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm no-print">
                        <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
                            <div className="flex-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <LucideStore size={12}/> Cửa hàng
                                </label>
                                <select 
                                    value={selectedStoreId}
                                    onChange={(e) => setSelectedStoreId(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-50 rounded-lg text-sm font-bold border-gray-200"
                                >
                                    <option value="all">Tất cả cửa hàng</option>
                                    {stores.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <Calendar size={12}/> Kỳ báo cáo: Từ ngày
                                </label>
                                <input 
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-50 rounded-lg text-sm font-bold border-gray-200"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <Calendar size={12}/> Đến ngày
                                </label>
                                <input 
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-50 rounded-lg text-sm font-bold border-gray-200"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                                    <Calculator className="text-blue-600"/> Tổng hợp Báo cáo Tính Thuế
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Ước tính nghĩa vụ thuế và phí nền tảng cho kỳ: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-2">
                                {stats.isIframe && (
                                    <button 
                                        onClick={() => window.open(window.location.href, '_blank')}
                                        className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors"
                                        title="Mở trong tab mới để in báo cáo tốt nhất"
                                    >
                                        <ExternalLink size={16} /> Mở tab mới
                                    </button>
                                )}
                                <button 
                                    onClick={() => {
                                        try {
                                            window.focus();
                                            window.print();
                                        } catch {
                                            alert("Trình duyệt không hỗ trợ in trực tiếp từ khung này. Vui lòng mở trang trong tab mới để in.");
                                        }
                                    }}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                                >
                                    <Download size={16} /> In Toàn Bộ Báo Cáo
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tax Configurations (Dynamic settings) */}
                    <div className="bg-white rounded-3xl p-6 border border-indigo-100 shadow-sm no-print">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-indigo-600 rounded-2xl text-white">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900">Thông số Thuế & Phí Hệ thống</h3>
                                <p className="text-sm text-gray-500">
                                    {user?.role === 'ADMIN' 
                                        ? "Cập nhật các tỷ lệ phần trăm khi có sự thay đổi từ chính sách Nhà Nước" 
                                        : "Chỉ quản trị viên cấp cao (ADMIN) mới có quyền thay đổi các thông số này"}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Thuế VAT mặc định (%)</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        step="0.1" 
                                        className={`w-full px-4 py-2 bg-gray-50 rounded-xl font-black text-blue-600 outline-none focus:ring-2 focus:ring-blue-500 ${user?.role !== 'ADMIN' ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        value={globalConfig.defaultVatRate * 100}
                                        onChange={(e) => user?.role === 'ADMIN' && configService.updateConfig({ defaultVatRate: Number(e.target.value) / 100 })}
                                        readOnly={user?.role !== 'ADMIN'}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Phí nền tảng AmazeBid (%)</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        step="0.1" 
                                        className={`w-full px-4 py-2 bg-gray-50 rounded-xl font-black text-indigo-600 outline-none focus:ring-2 focus:ring-blue-500 ${user?.role !== 'ADMIN' ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        value={globalConfig.platformFeeRate * 100}
                                        onChange={(e) => user?.role === 'ADMIN' && configService.updateConfig({ platformFeeRate: Number(e.target.value) / 100 })}
                                        readOnly={user?.role !== 'ADMIN'}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Thuế TNCN / Hộ KD (%)</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        step="0.1" 
                                        className={`w-full px-4 py-2 bg-gray-50 rounded-xl font-black text-orange-600 outline-none focus:ring-2 focus:ring-blue-500 ${user?.role !== 'ADMIN' ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        value={globalConfig.personalIncomeTaxRate * 100}
                                        onChange={(e) => user?.role === 'ADMIN' && configService.updateConfig({ personalIncomeTaxRate: Number(e.target.value) / 100 })}
                                        readOnly={user?.role !== 'ADMIN'}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Tiền tệ mặc định</label>
                                <select 
                                    className={`w-full px-4 py-2 bg-gray-50 rounded-xl font-black text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${user?.role !== 'ADMIN' ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    value={globalConfig.currencySymbol}
                                    onChange={(e) => user?.role === 'ADMIN' && configService.updateConfig({ currencySymbol: e.target.value })}
                                    disabled={user?.role !== 'ADMIN'}
                                >
                                    <option value="đ">VND (đ)</option>
                                    <option value="$">USD ($)</option>
                                    <option value="€">EUR (€)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {stats.isIframe && (
                        <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-xl text-xs flex items-center gap-2 no-print">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>Bạn đang xem trong chế độ xem thử. Để in báo cáo đầy đủ và đẹp nhất, vui lòng nhấn <strong>"Mở tab mới"</strong> và sau đó nhấn <strong>Ctrl + P</strong>.</span>
                        </div>
                    )}

                    {/* Printable Report Content */}
                    <div id="tax-report-printable" className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm print-container">
                        {/* Report Header (Only visible in print) */}
                        <div className="hidden print-only mb-8 text-center border-b-2 border-gray-900 pb-4">
                            <h1 className="text-3xl font-black uppercase">BÁO CÁO KÊ KHAI THUẾ - AMAZEBID</h1>
                            <p className="text-sm text-gray-600 mt-1">Kỳ báo cáo: {new Date(startDate).toLocaleDateString()} đến {new Date(endDate).toLocaleDateString()}</p>
                            <div className="mt-4 grid grid-cols-2 gap-4 text-left border-t border-gray-100 pt-4">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thông tin người báo cáo</p>
                                    <p className="font-bold text-gray-900">{user?.fullName || 'N/A'}</p>
                                    <p className="text-xs text-gray-500">{user?.email || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cửa hàng/Mã người bán</p>
                                    <p className="font-bold text-gray-900">
                                        {selectedStoreId === 'all' 
                                            ? (stores.length > 0 ? stores.map(s => s.name).join(', ') : 'Cửa hàng trực tuyến') 
                                            : (stores.find(s => s.id === selectedStoreId)?.name || 'N/A')}
                                    </p>
                                    <p className="text-xs text-gray-500">ID: {currentUserId}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Doanh thu gộp</p>
                                <p className="text-2xl font-black text-blue-900">{(Number(stats.totalRevenue) || 0).toLocaleString('vi-VN')} {globalConfig.currencySymbol}</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Phí sàn ({(globalConfig.platformFeeRate * 100).toFixed(1)}%)</p>
                                <p className="text-2xl font-black text-indigo-900">-{(Number(stats.tax?.platformFee) || 0).toLocaleString('vi-VN')} {globalConfig.currencySymbol}</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100">
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Dự tính Thuế ({(globalConfig.personalIncomeTaxRate * 100 + globalConfig.defaultVatRate * 100).toFixed(1)}%)</p>
                                <p className="text-2xl font-black text-amber-900">{Math.round((Number(stats.tax?.vatTax) || 0) + (Number(stats.tax?.personalIncomeTax) || 0)).toLocaleString('vi-VN')} {globalConfig.currencySymbol}</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Lợi nhuận ròng</p>
                                <p className="text-2xl font-black text-emerald-900">{(Number(stats.tax?.netIncome) || 0).toLocaleString('vi-VN')} {globalConfig.currencySymbol}</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Income / Expense Table */}
                            <div>
                                <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <FileText className="text-blue-600" /> Bảng Thu - Chi chi tiết
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] font-bold">
                                            <tr>
                                                <th className="p-3">Ngày</th>
                                                <th className="p-3">Mô tả</th>
                                                <th className="p-3">Loại</th>
                                                <th className="p-3 text-right">Số tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {/* Sold orders as income */}
                                            {stats.soldOrders.map((order: any) => (
                                                <tr key={order.id} className="hover:bg-gray-50">
                                                    <td className="p-3 font-medium text-gray-600">{order.soldDate}</td>
                                                    <td className="p-3 font-bold text-gray-900">{order.title}</td>
                                                    <td className="p-3"><span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">THU NHẬP</span></td>
                                                    <td className="p-3 text-right font-black text-green-600">
                                                        +{(Number(order.isAffiliate ? ((order.price || 0) * (order.commissionRate || 0)/100) : (order.price || 0))).toLocaleString('vi-VN')} {globalConfig.currencySymbol}
                                                    </td>
                                                </tr>
                                            ))}
                                            {/* Invoices as expenses */}
                                            {stats.myInvoices.map((inv: any) => (
                                                <tr key={inv.id} className="hover:bg-gray-50">
                                                    <td className="p-3 font-medium text-gray-600">{inv.date ? new Date(inv.date).toLocaleDateString() : 'N/A'}</td>
                                                    <td className="p-3 font-bold text-gray-900">Chi phí nhập hàng: {inv.supplier}</td>
                                                    <td className="p-3"><span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">CHI PHÍ</span></td>
                                                    <td className="p-3 text-right font-black text-red-600">-{Number(inv.totalAmount || inv.amount || 0).toLocaleString('vi-VN')} {globalConfig.currencySymbol}</td>
                                                </tr>
                                            ))}
                                            {/* Labor costs as expenses */}
                                            {stats.totalLaborCost > 0 && (
                                                <tr>
                                                    <td className="p-3 font-medium text-gray-600 italic">Tổng kết kỳ</td>
                                                    <td className="p-3 font-bold text-gray-900">Chi phí nhân công & vận hành</td>
                                                    <td className="p-3"><span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">CHI PHÍ</span></td>
                                                    <td className="p-3 text-right font-black text-red-600">-{Number(stats.totalLaborCost || 0).toLocaleString('vi-VN')} {globalConfig.currencySymbol}</td>
                                                </tr>
                                            )}
                                            {/* AI Spending as expenses */}
                                            {(stats.totalAiSpending || 0) > 0 && (
                                                <tr>
                                                    <td className="p-3 font-medium text-gray-600 italic">Tổng kết kỳ</td>
                                                    <td className="p-3 font-bold text-gray-900">Chi phí dịch vụ AI (Amaze AI)</td>
                                                    <td className="p-3"><span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">CHI PHÍ AI</span></td>
                                                    <td className="p-3 text-right font-black text-indigo-600">-{Number(stats.totalAiSpending || 0).toLocaleString('vi-VN')} {globalConfig.currencySymbol}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot className="bg-gray-900 text-white font-black">
                                            <tr>
                                                <td colSpan={3} className="p-4 text-right uppercase tracking-widest text-xs">Lợi nhuận ròng cuối kỳ</td>
                                                <td className="p-4 text-right text-lg">{(Number(stats.tax?.netIncome) || 0).toLocaleString('vi-VN')} {globalConfig.currencySymbol}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Monthly Summary */}
                            <div>
                                <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <Calculator className="text-indigo-600" /> 2. Chi tiết theo Tháng
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 no-print">
                                    {stats.monthlyStats.map((item: any) => (
                                        <div key={`${item.year}-${item.month}`} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Tháng {item.month}/{item.year}</p>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-lg font-black text-gray-900">{(Number(item.revenue) || 0).toLocaleString('vi-VN')} {globalConfig.currencySymbol}</p>
                                                    <p className="text-[10px] text-gray-500">{item.count} đơn hàng</p>
                                                </div>
                                                <p className="text-xs font-bold text-orange-600">Thuế: {Math.round((item.revenue || 0) * globalConfig.platformFeeRate).toLocaleString('vi-VN')} {globalConfig.currencySymbol}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Printable Monthly Table */}
                                <div className="hidden print-only overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-gray-200">
                                            <tr>
                                                <th className="py-2">Tháng</th>
                                                <th className="py-2">Số đơn</th>
                                                <th className="py-2 text-right">Doanh thu</th>
                                                <th className="py-2 text-right">Thuế ước tính</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {stats.monthlyStats.map((item: any) => (
                                                <tr key={`${item.year}-${item.month}`}>
                                                    <td className="py-2">Tháng {item.month}/{item.year}</td>
                                                    <td className="py-2">{item.count}</td>
                                                    <td className="py-2 text-right font-bold">{(item.revenue || 0).toLocaleString('vi-VN')} {globalConfig.currencySymbol}</td>
                                                    <td className="py-2 text-right text-orange-600">-{Math.round((item.revenue || 0) * globalConfig.platformFeeRate).toLocaleString('vi-VN')} {globalConfig.currencySymbol}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Quarterly Summary */}
                            <div>
                                <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <PieChartIcon className="text-blue-600" /> 3. Chi tiết theo Quý
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {stats.quarterlyStats.map((item: any) => (
                                        <div key={`${item.year}-Q${item.quarter}`} className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Quý {item.quarter}/{item.year}</p>
                                            <p className="text-lg font-black text-indigo-900">{(Number(item.revenue) || 0).toLocaleString('vi-VN')} {globalConfig.currencySymbol}</p>
                                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-indigo-100">
                                                <span className="text-[10px] font-bold text-indigo-600">{item.count} đơn</span>
                                                <span className="text-[10px] font-black text-orange-600">-{Math.round((Number(item.revenue) || 0) * (globalConfig.platformFeeRate + globalConfig.personalIncomeTaxRate)).toLocaleString('vi-VN')} {globalConfig.currencySymbol}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Report Footer (Only visible in print) */}
                        <div className="hidden print-only mt-12 pt-8 border-t-2 border-dashed border-gray-200">
                            <div className="grid grid-cols-2 gap-12 text-center">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 mb-16 italic uppercase tracking-widest">Người lập biểu (Ký tên)</p>
                                    <p className="font-black text-gray-900 border-b border-gray-900 inline-block px-8">{user?.fullName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 mb-16 italic uppercase tracking-widest">Đại diện Nền tảng AmazeBid</p>
                                    <p className="font-black text-gray-900 italic">Xác thực hệ thống kỹ thuật số</p>
                                </div>
                            </div>
                            <p className="text-[8px] text-gray-400 text-center mt-12 font-bold uppercase tracking-widest">
                                Báo cáo này được trích xuất tự động và có giá trị tham chiếu kê khai nội bộ. AmazeBid không chịu trách nhiệm pháp lý thay hộ kinh doanh.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm no-print">
                        <h3 className="text-xl font-black text-gray-900 mb-6">Mẹo tối ưu thuế</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
                                <h4 className="font-bold text-indigo-900 mb-2">Hạch toán chi phí</h4>
                                <p className="text-xs text-indigo-700 leading-relaxed">Đảm bảo bạn nhập đầy đủ tất cả hóa đơn mua hàng, chi phí nhân công và bao bì để giảm thu nhập tính thuế một cách hợp lệ.</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
                                <h4 className="font-bold text-emerald-900 mb-2">Đăng ký Hộ kinh doanh</h4>
                                <p className="text-xs text-emerald-700 leading-relaxed">Sử dụng mã số thuế cá nhân hoặc hộ kinh doanh để áp dụng mức thuế khoán ưu đãi dành cho thương mại điện tử (thường là 1.5% tổng doanh thu).</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
                                <h4 className="font-bold text-blue-900 mb-2">In báo cáo minh bạch</h4>
                                <p className="text-xs text-blue-700 leading-relaxed">Luôn in và lưu trữ báo cáo định kỳ hàng tháng để sẵn sàng đối soát khi có yêu cầu từ cơ quan quản lý thuế.</p>
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
                                            <button 
                                                onClick={() => setSelectedProductForProfit(product)}
                                                className="w-full bg-white border border-gray-200 text-gray-600 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
                                            >
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

            {/* Profit Analysis Modal Overlay - Local Engine */}
            {selectedProductForProfit && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProductForProfit(null)} />
                    <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-[#131921] p-4 text-white flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2">
                                <Calculator size={18} className="text-[#febd69]" /> Phân tích lợi nhuận (Local AI)
                            </h3>
                            <button onClick={() => setSelectedProductForProfit(null)} className="hover:bg-gray-800 p-1 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6 p-3 bg-gray-50 rounded-xl">
                                <img src={selectedProductForProfit.image} className="w-16 h-16 rounded-lg object-cover" />
                                <div>
                                    <h4 className="font-bold text-gray-900">{selectedProductForProfit.title}</h4>
                                    <p className="text-xs text-gray-500">{selectedProductForProfit.category}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Giá vốn (Cost)</p>
                                    <p className="text-xl font-black text-blue-900">${selectedProductForProfit.costPrice || 0}</p>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Giá bán (Price)</p>
                                    <p className="text-xl font-black text-emerald-900">${selectedProductForProfit.price}</p>
                                </div>
                            </div>

                            <div className="bg-gray-900 text-emerald-400 p-4 rounded-xl font-mono text-sm mb-6 whitespace-pre-line leading-relaxed">
                                {localAnalyzeProfit(selectedProductForProfit).analysis}
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                    <span className="text-gray-500">Số lượng đã bán:</span>
                                    <span className="font-bold">{selectedProductForProfit.sold || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                    <span className="text-gray-500">Tổng lợi nhuận thực tế:</span>
                                    <span className="font-bold text-emerald-600">
                                        ${((selectedProductForProfit.price - (selectedProductForProfit.costPrice || 0)) * (selectedProductForProfit.sold || 0)).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">ROI ước tính:</span>
                                    <span className="font-bold text-blue-600">
                                        {selectedProductForProfit.costPrice ? (((selectedProductForProfit.price - selectedProductForProfit.costPrice) / selectedProductForProfit.costPrice) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                            </div>

                            <button 
                                onClick={() => setSelectedProductForProfit(null)}
                                className="w-full mt-8 bg-[#febd69] hover:bg-[#f3a847] text-black font-bold py-3 rounded-xl transition-all"
                            >
                                Đóng phân tích
                            </button>
                        </div>
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
              <div className="flex justify-between"><span>Tổng doanh thu:</span><span className="font-bold">${(stats.totalRevenue || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Phí nền tảng (5%):</span><span className="font-bold">-${(stats.tax?.platformFee || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Thu nhập chịu thuế:</span><span className="font-bold">${(stats.tax?.taxableIncome || 0).toFixed(2)}</span></div>
              <div className="flex justify-between text-red-600"><span>Chi phí nhân công:</span><span className="font-bold">-${(stats.totalLaborCost || 0).toLocaleString()}</span></div>
              <div className="flex justify-between text-indigo-600"><span>Chi phí AI:</span><span className="font-bold">-{Number(stats.totalAiSpending || 0).toLocaleString('vi-VN')} {globalConfig.currencySymbol}</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                <span className="font-bold">Thu nhập ròng (Net):</span>
                <span className="font-black text-lg text-green-700">${(stats.tax?.netIncome || 0).toFixed(2)}</span>
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
                  <td className="py-2 text-right font-bold">${(order.price || 0).toFixed(2)}</td>
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
                  <td className="py-2 text-right font-bold">${(inv.totalAmount || 0).toFixed(2)}</td>
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
