
import React, { useState, useMemo, useEffect } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import BottomToolbar from './components/BottomToolbar';
import GeminiAssistant from './components/GeminiAssistant';
import SellModal from './components/SellModal';
import OrderDashboard from './components/OrderDashboard';
import LiveStreamViewer from './components/LiveStreamViewer';
import CreateStreamModal from './components/CreateStreamModal'; 
import BidModal from './components/BidModal';
import AuthModal from './components/AuthModal'; 
import UserProfile from './components/UserProfile'; 
import CustomerServiceModal from './components/CustomerServiceModal'; 
import ContentStudioModal from './components/ContentStudioModal'; 
import KOLStreamStudio from './components/KOLStreamStudio';
import SuperDealsModal from './components/SuperDealsModal'; 
import SellerDashboard from './components/SellerDashboard'; 
import AdminDashboard from './components/AdminDashboard'; 
import CommunityFeed from './components/CommunityFeed';
import AIRecommendations from './components/AIRecommendations';
import FlashSaleBanner from './components/FlashSaleBanner';
import { AIWorkerManager } from './components/AIWorkerManager';
import AIRouterDashboard from './src/App';
import { useAuth } from './context/useAuth'; 
import { api } from './services/api';
import socket from './services/socket';
import { analyzeImageForSearch } from './services/geminiService';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './components/CheckoutForm';

import BusinessPages from './components/BusinessPages';
import Footer from './components/Footer';
import { EmailInbox } from './components/EmailInbox';
import { emailService } from './services/EmailService';

import { StoreDiscovery } from './components/StoreDiscovery';
import StoreDetail from './components/StoreDetail';
import { StoreRegistration } from './components/StoreRegistration';
import { MenuDiscovery } from './components/MenuDiscovery';
import { DigitalMenu } from './components/DigitalMenu';
import { storeService } from './services/StoreService';
import ApiKeySelector from './components/ApiKeySelector';

import { Product, CartItem, ItemType, OrderStatus, LiveStream, ContentPost, DiscountCode, ShippingOption, FeedPost, PhysicalStore } from './types';
import { MOCK_FEED_POSTS, MOCK_REVIEWS, MOCK_DISCOUNT_CODES, MOCK_SHIPPING_OPTIONS } from './data';

import { ShoppingBag, X, Minus, Plus, Trash2, Sparkles, Filter, PackageSearch, ShieldCheck, PlayCircle, Loader2, MapPin, Phone, Mail, User } from 'lucide-react';

// Initialize Stripe outside component to avoid recreating it on every render
import ChatWidget from './components/ChatWidget';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

import { lazy, Suspense } from 'react';

// Lazy load the 3D heavy component
const VirtualAvatarStudio = lazy(() => import('./components/VirtualAvatarStudio/AvatarStudio'));

const categoryMap: Record<string, string> = {
  'Điện tử (Electronics)': 'Electronics',
  'Thời trang (Fashion)': 'Fashion',
  'Đồ cổ (Collectibles)': 'Collectibles',
  'Máy tính (Computers)': 'Computers',
  'Nhà cửa (Home & Office)': 'Home & Office',
  'Làm đẹp (Beauty)': 'Beauty',
  'Âm nhạc (Music)': 'Music',
  'Điện thoại & Phụ kiện (Phones & Accessories)': 'Phones & Accessories',
  'Mẹ & Bé (Mother & Baby)': 'Mother & Baby',
  'Sức khỏe & Y tế (Health & Medical)': 'Health & Medical',
  'Thể thao & Dã ngoại (Sports & Outdoors)': 'Sports & Outdoors',
  'Sách & Văn phòng phẩm (Books & Stationery)': 'Books & Stationery',
  'Ô tô & Xe máy (Cars & Motorcycles)': 'Cars & Motorcycles',
  'Đồ chơi & Trò chơi (Toys & Games)': 'Toys & Games',
  'Bất động sản (Real Estate)': 'Real Estate',
  'Thực phẩm & Đồ uống (Food & Beverages)': 'Food & Beverages',
  'Dịch vụ (Services)': 'Services'
};

import UserWalletModal from './components/UserWalletModal';

const InnerApp: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [contentPosts, setContentPosts] = useState<ContentPost[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data from backend
  useEffect(() => {
    const testHealth = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(new Error('Timeout after 5s')), 5000);
          
          const res = await fetch('/api/health', { signal: controller.signal });
          clearTimeout(timeoutId);
          
          if (res.ok) {
            const data = await res.json();
            console.log('API Health Check Result:', data);
            return;
          }
        } catch (error) {
          console.warn(`Health check attempt ${i + 1} failed:`, error);
          if (i === retries - 1) console.error('API Health Check Failed after retries');
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    };
    testHealth();

    const fetchData = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const [productsData, streamsData] = await Promise.all([
            api.products.getAll(),
            api.streams.getAll()
          ]);
          
          const apiProducts = productsData.products;
          
          const storeCategoryToMainCategory: Record<string, string> = {
            'FOOD': 'Food & Beverages',
            'DRINK': 'Food & Beverages',
            'FASHION': 'Fashion',
            'ELECTRONICS': 'Electronics',
            'BEAUTY': 'Beauty',
            'BOOKS': 'Books & Stationery',
            'SERVICES': 'Services',
            'OTHER': 'Other'
          };

          const mapStoreProducts = (stores: PhysicalStore[]) => {
            const allStoreProducts: Product[] = [];
            stores.forEach(store => {
              store.menu.forEach(item => {
                allStoreProducts.push({
                  id: item.id,
                  title: item.name,
                  description: item.description,
                  price: item.price,
                  image: item.image,
                  category: storeCategoryToMainCategory[store.category] || store.category,
                  type: ItemType.FIXED_PRICE,
                  rating: store.rating,
                  reviewCount: store.reviewCount,
                  status: item.isAvailable ? OrderStatus.AVAILABLE : OrderStatus.CANCELLED,
                  sellerId: store.id,
                });
              });
            });
            return allStoreProducts;
          };

          const initialStoreProducts = mapStoreProducts(storeService.getStores());
          setProducts([...apiProducts, ...initialStoreProducts]);
          setStreams(streamsData.streams);

          // Subscribe to store changes
          const unsubscribe = storeService.subscribe((stores) => {
            const updatedStoreProducts = mapStoreProducts(stores);
            setProducts(prev => {
              const nonStoreProducts = prev.filter(p => !p.sellerId.startsWith('store-'));
              return [...nonStoreProducts, ...updatedStoreProducts];
            });
          });

          setIsLoading(false);
          return unsubscribe;
        } catch (error) {
          console.warn(`Data fetch attempt ${i + 1} failed:`, error);
          if (i === retries - 1) {
            console.error('Error fetching data after retries:', error);
            setIsLoading(false);
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    };
    
    let unsubscribeStores: (() => void) | undefined;
    fetchData().then(unsub => {
      unsubscribeStores = unsub;
    });

    // Socket Listeners
    socket.on('bid:updated', ({ productId, product }: { productId: string, product: Product }) => {
      setProducts(prev => prev.map(p => p.id === productId ? product : p));
      setBidModalProduct(prev => (prev && prev.id === productId) ? product : prev);
    });

    return () => {
      socket.off('bid:updated');
      if (unsubscribeStores) unsubscribeStores();
    };
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [isVisualSearching, setIsVisualSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [filterType, setFilterType] = useState<'ALL' | ItemType>('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Modals State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isOrderDashboardOpen, setIsOrderDashboardOpen] = useState(false);
  const [bidModalProduct, setBidModalProduct] = useState<Product | null>(null);
  const [isCreateStreamModalOpen, setIsCreateStreamModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCustomerServiceOpen, setIsCustomerServiceOpen] = useState(false);
  const [isContentStudioOpen, setIsContentStudioOpen] = useState(false);
  const [isKOLStudioOpen, setIsKOLStudioOpen] = useState(false);
  const [isSuperDealsOpen, setIsSuperDealsOpen] = useState(false);
  const [isSellerDashboardOpen, setIsSellerDashboardOpen] = useState(false);
  const [isAdminAITasksOpen, setIsAdminAITasksOpen] = useState(false);
  const [isAvatarStudioOpen, setIsAvatarStudioOpen] = useState(false); // New State
  const [isCommunityOpen, setIsCommunityOpen] = useState(false); // New State
  const [isEmailInboxOpen, setIsEmailInboxOpen] = useState(false); // New State
  const [isStoreDiscoveryOpen, setIsStoreDiscoveryOpen] = useState(false);
  const [isStoreRegistrationOpen, setIsStoreRegistrationOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isGeminiOpen, setIsGeminiOpen] = useState(false);
  const [isAIWorkerOpen, setIsAIWorkerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMenuDiscoveryOpen, setIsMenuDiscoveryOpen] = useState(false);
  const [isDigitalMenuOpen, setIsDigitalMenuOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [activeBusinessPage, setActiveBusinessPage] = useState<string | null>(null);
  const [chatTargetUser, setChatTargetUser] = useState<{ id: string, fullName: string, avatar: string } | null>(null);

  const closeAllPages = () => {
    setIsCommunityOpen(false);
    setIsStoreDiscoveryOpen(false);
    setIsMenuDiscoveryOpen(false);
    setIsDigitalMenuOpen(false);
    setIsEmailInboxOpen(false);
    setIsStoreRegistrationOpen(false);
    setIsSuperDealsOpen(false);
    setIsAvatarStudioOpen(false);
    setIsContentStudioOpen(false);
    setIsKOLStudioOpen(false);
    setActiveBusinessPage(null);
    setShowLiveList(false);
  };

  useEffect(() => {
    (window as any).onOpenMenuDiscovery = () => {
      closeAllPages();
      setIsMenuDiscoveryOpen(true);
      setSelectedStoreId(null);
    };
    (window as any).onOpenDigitalMenu = (storeId: string) => {
      closeAllPages();
      setSelectedStoreId(storeId);
      setIsDigitalMenuOpen(true);
    };
    return () => {
      delete (window as any).onOpenMenuDiscovery;
      delete (window as any).onOpenDigitalMenu;
    };
  }, []);
  const [feedPosts, setFeedPosts] = useState(MOCK_FEED_POSTS);
  const [reviews] = useState(MOCK_REVIEWS);
  const [following, setFollowing] = useState<string[]>([]); // New State for Follows

  // Stripe Payment State
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // E-commerce Core State
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption>(MOCK_SHIPPING_OPTIONS[0]);
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [discountError, setDiscountError] = useState('');

  // Live Stream States
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);
  const [isHostMode, setIsHostMode] = useState(false); 
  const [showLiveList, setShowLiveList] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);

  const categories = [
    'Tất cả', 
    'Điện tử (Electronics)', 
    'Thời trang (Fashion)', 
    'Đồ cổ (Collectibles)', 
    'Máy tính (Computers)', 
    'Nhà cửa (Home & Office)', 
    'Làm đẹp (Beauty)', 
    'Âm nhạc (Music)',
    'Điện thoại & Phụ kiện (Phones & Accessories)',
    'Mẹ & Bé (Mother & Baby)',
    'Sức khỏe & Y tế (Health & Medical)',
    'Thể thao & Dã ngoại (Sports & Outdoors)',
    'Sách & Văn phòng phẩm (Books & Stationery)',
    'Ô tô & Xe máy (Cars & Motorcycles)',
    'Đồ chơi & Trò chơi (Toys & Games)',
    'Bất động sản (Real Estate)',
    'Thực phẩm & Đồ uống (Food & Beverages)',
    'Dịch vụ (Services)'
  ];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (p.status !== OrderStatus.AVAILABLE) return false;
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Tất cả' || p.category === categoryMap[selectedCategory] || p.category === selectedCategory;
      const matchesType = filterType === 'ALL' || p.type === filterType;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [searchTerm, products, selectedCategory, filterType]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleGoHome = () => {
    closeAllPages();
    setSelectedCategory('Tất cả');
    setSearchTerm('');
    setFilterType('ALL');
  };

  const handleImageSearch = async (base64Data: string, mimeType: string) => {
    setIsVisualSearching(true);
    try {
      const keyword = await analyzeImageForSearch(base64Data, mimeType);
      if (keyword) {
        setSearchTerm(keyword);
        showNotification(`Đã tìm thấy từ khóa: "${keyword}"`);
        // Optional: Reset category to "Tất cả" to broaden search
        setSelectedCategory('Tất cả');
      } else {
        showNotification("Không tìm thấy từ khóa phù hợp từ hình ảnh.");
      }
    } catch (error: any) {
      showNotification(error.message || "Lỗi khi phân tích hình ảnh.");
    } finally {
      setIsVisualSearching(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showNotification(`Đã thêm ${product.title} vào giỏ hàng`);
  };

  const handleOpenBidModal = (product: Product) => {
    if (!user) {
        setIsAuthModalOpen(true);
        return;
    }
    setBidModalProduct(product);
  };

  const handleSubmitBid = async (product: Product, amount: number) => {
    if (!user) return;
    try {
      const data = await api.bidding.placeBid(product.id, amount, user.id, user.fullName);
      setProducts(prev => prev.map(p => p.id === product.id ? data.product : p));
      showNotification(`Đã đặt giá thầu $${amount} thành công!`);
    } catch (error: any) {
      showNotification(error.message || 'Lỗi đặt giá thầu');
    }
  };

  const handleAddProduct = async (newProduct: Product) => {
    if (!user) {
        setIsAuthModalOpen(true);
        return;
    }
    try {
      const data = await api.products.create({ ...newProduct, sellerId: user.id });
      setProducts(prev => [data.product, ...prev]);
      showNotification(`Niêm yết "${newProduct.title}" thành công!`);
    } catch (error: any) {
      showNotification(error.message || 'Lỗi niêm yết sản phẩm');
    }
  };

  const handleAddContentPost = (post: ContentPost) => {
      setContentPosts(prev => [post, ...prev]);
      showNotification(`Đã xuất bản bài viết "${post.title}" thành công!`);
  };

  const handleCreateStream = (streamData: Partial<LiveStream>) => {
    if (!user) return;
    const newStream = streamData as LiveStream;
    // Override host info
    newStream.hostName = user.fullName;
    newStream.hostAvatar = user.avatar;
    
    setStreams(prev => [newStream, ...prev]);
    setIsCreateStreamModalOpen(false);
    
    // Enter Host Mode
    setActiveStream(newStream);
    setIsHostMode(true);
    showNotification("Đang bắt đầu phiên Live...");
  };

  const handleCheckout = async () => {
    if (!user) {
        setIsAuthModalOpen(true);
        return;
    }
    
    setIsProcessingPayment(true);
    try {
      // Create PaymentIntent as soon as the checkout button is clicked
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart }),
      });
      
      const data = await response.json();
      
      if (data.clientSecret) {
         setClientSecret(data.clientSecret);
      } else {
         showNotification(data.error || 'Lỗi khởi tạo thanh toán');
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      showNotification('Lỗi kết nối đến cổng thanh toán');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      // Notify backend to process fees and update stock/campaigns
      await api.orders.complete(cart, totalAmount, selectedShipping);
      
      const boughtIds = cart.map(c => c.id);
      setProducts(prev => prev.map(p => {
        if (boughtIds.includes(p.id)) return { ...p, status: OrderStatus.PAID_ESCROW };
        return p;
      }));

      // Simulate sending emails
      if (user) {
        const mockOrder = {
          id: Math.random().toString(36).substring(2, 10),
          userId: user.id,
          items: cart,
          totalAmount,
          status: OrderStatus.PAID_ESCROW,
          createdAt: new Date().toISOString(),
          shippingAddress: user.address || 'Địa chỉ mặc định',
          paymentMethod: 'Thanh toán trực tuyến'
        };
        emailService.sendPurchaseConfirmation(user, mockOrder);
        emailService.sendPaymentEscrowNotification(user, mockOrder);
        
        // Notify sellers
        const sellerIds = [...new Set(cart.map(item => item.sellerId))];
        sellerIds.forEach(sellerId => {
          const sellerItems = cart.filter(item => item.sellerId === sellerId);
          const sellerOrder = { ...mockOrder, items: sellerItems, totalAmount: sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0) };
          emailService.sendSellerNotification(`seller_${sellerId}@example.com`, sellerOrder);
        });
      }

      setCart([]);
      setIsCartOpen(false);
      setClientSecret(null); // Reset payment state
      showNotification("Thanh toán thành công! Tiền đang được hệ thống tạm giữ.");
      setTimeout(() => setIsOrderDashboardOpen(true), 1500); 
    } catch (error) {
      console.error('Error completing order on backend:', error);
      showNotification('Lỗi cập nhật trạng thái đơn hàng trên hệ thống');
    }
  };

  const handleOrderStatusUpdate = async (productId: string, newStatus: OrderStatus, shippingInfo?: any) => {
    try {
      await api.products.updateStatus(productId, newStatus, shippingInfo);
      setProducts(prev => prev.map(p => {
          if (p.id === productId) {
            return { ...p, status: newStatus, shippingInfo: shippingInfo || p.shippingInfo };
          }
          return p;
      }));
    } catch (error) {
      console.error('Failed to update product status:', error);
      showNotification('Lỗi cập nhật trạng thái đơn hàng');
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const calculateDiscount = () => {
    if (!appliedDiscount) return 0;
    if (appliedDiscount.type === 'PERCENTAGE') {
      const discount = subtotalAmount * (appliedDiscount.value / 100);
      return appliedDiscount.maxDiscount ? Math.min(discount, appliedDiscount.maxDiscount) : discount;
    }
    if (appliedDiscount.type === 'FIXED_AMOUNT') {
      return appliedDiscount.value;
    }
    return 0; // FREE_SHIPPING handled separately
  };

  const discountAmount = calculateDiscount();
  const shippingCost = appliedDiscount?.type === 'FREE_SHIPPING' ? 0 : selectedShipping.price;
  const totalAmount = Math.max(0, subtotalAmount - discountAmount + shippingCost);

  const handleApplyDiscount = () => {
    setDiscountError('');
    const code = MOCK_DISCOUNT_CODES.find(c => c.code === discountCodeInput.toUpperCase());
    
    if (!code) {
      setDiscountError('Mã giảm giá không hợp lệ');
      return;
    }
    if (!code.isActive || new Date(code.expiryDate) < new Date()) {
      setDiscountError('Mã giảm giá đã hết hạn');
      return;
    }
    if (code.minPurchase && subtotalAmount < code.minPurchase) {
      setDiscountError(`Đơn hàng tối thiểu $${code.minPurchase} để áp dụng`);
      return;
    }
    
    setAppliedDiscount(code);
    setDiscountCodeInput('');
    showNotification(`Đã áp dụng mã ${code.code}`);
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
  };

  const handleLikePost = (postId: string) => {
    setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
  };

  const handleCommentPost = (postId: string) => {
    setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p));
    showNotification("Đã gửi bình luận!");
  };

  const handleAddPost = (content: string, images?: string[], relatedProductId?: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const newPost: FeedPost = {
      id: `post_${Date.now()}`,
      userId: user.id,
      userName: user.fullName,
      userAvatar: user.avatar,
      content,
      images: images || [],
      relatedProductId,
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
    };
    setFeedPosts([newPost, ...feedPosts]);
    showNotification("Đã đăng bài thành công!");
  };

  const handleToggleFollow = (userId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setFollowing(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleChatWithSeller = (sellerId: string, sellerName: string, sellerAvatar: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (user.id === sellerId) {
      showNotification("Bạn không thể chat với chính mình!");
      return;
    }
    setChatTargetUser({ id: sellerId, fullName: sellerName, avatar: sellerAvatar });
  };

  // Filter products belonging to current user
  const myProducts = useMemo(() => {
      if (!user) return [];
      return products.filter(p => p.sellerId === user.id);
  }, [products, user]);

  // Filter products for Super Deals (items with discounts)
  const superDealsProducts = useMemo(() => {
    return products.filter(p => p.type === ItemType.FIXED_PRICE && (p.originalPrice && p.originalPrice > p.price));
  }, [products]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f4f6] pb-14">
      <Navbar 
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)} 
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        onImageSearch={handleImageSearch}
        isVisualSearching={isVisualSearching}
        openCart={() => setIsCartOpen(true)}
        openSellModal={() => setIsSellModalOpen(true)}
        openOrders={() => setIsOrderDashboardOpen(true)}
        onOpenLiveStudio={() => {
            if(user) setIsCreateStreamModalOpen(true);
            else setIsAuthModalOpen(true);
        }}
        onViewLiveStreams={() => {
            const wasShowing = showLiveList;
            closeAllPages();
            setShowLiveList(!wasShowing);
            if (!wasShowing) window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenCustomerService={() => setIsCustomerServiceOpen(true)}
        onOpenContentStudio={() => {
            closeAllPages();
            setIsContentStudioOpen(true);
        }}
        onOpenKOLStudio={() => {
            closeAllPages();
            setIsKOLStudioOpen(true);
        }}
        onOpenSuperDeals={() => {
            closeAllPages();
            setIsSuperDealsOpen(true);
        }}
        onOpenSellerDashboard={() => setIsSellerDashboardOpen(true)}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
        onOpenAdminAITasks={() => setIsAdminAITasksOpen(true)}
        onOpenAvatarStudio={() => {
            closeAllPages();
            setIsAvatarStudioOpen(true);
        }}
        onOpenCommunity={() => {
            closeAllPages();
            setIsCommunityOpen(true);
        }}
        onOpenEmailInbox={() => {
            closeAllPages();
            setIsEmailInboxOpen(true);
        }}
        onOpenStoreDiscovery={() => {
            closeAllPages();
            setIsStoreDiscoveryOpen(true);
        }}
        onOpenStoreRegistration={() => {
            closeAllPages();
            setIsStoreRegistrationOpen(true);
        }}
        onOpenWallet={() => {
            if (user) {
                setIsWalletOpen(true);
            } else {
                setIsAuthModalOpen(true);
            }
        }}
        onGoHome={handleGoHome}
      />

      {isStoreDiscoveryOpen ? (
        <div className="flex-grow">
          <StoreDiscovery 
            onSelectStore={(store) => setSelectedStoreId(store.id)} 
            onViewMenu={(store) => {
              setSelectedStoreId(store.id);
              setIsDigitalMenuOpen(true);
            }}
          />
        </div>
      ) : isMenuDiscoveryOpen ? (
        <div className="flex-grow">
          <MenuDiscovery 
            onSelectStore={(store) => {
              setSelectedStoreId(store.id);
              setIsMenuDiscoveryOpen(false);
            }}
            onClose={() => setIsMenuDiscoveryOpen(false)}
          />
        </div>
      ) : isCommunityOpen ? (
        <div className="flex-grow">
          <CommunityFeed 
            posts={feedPosts} 
            reviews={reviews} 
            products={products} 
            contentPosts={contentPosts}
            currentUserId={user?.id}
            currentUserAvatar={user?.avatar}
            following={following}
            onLikePost={handleLikePost}
            onCommentPost={handleCommentPost}
            onAddPost={handleAddPost}
            onToggleFollow={handleToggleFollow}
            onAddToCart={handleAddToCart}
          />
        </div>
      ) : (
      <main className="flex-grow max-w-[1500px] mx-auto px-4 pt-6 pb-0 w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Đang tải dữ liệu từ Backend Engine...</p>
          </div>
        ) : (
          <>
            {/* Live Stream List Section */}
        {showLiveList && (
            <div className="mb-10 animate-in slide-in-from-top-4 fade-in">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"/>
                    <h2 className="text-xl font-bold uppercase tracking-wider">Đang phát trực tiếp</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {streams.map(stream => (
                        <div 
                            key={stream.id}
                            onClick={() => {
                                setActiveStream(stream);
                                setIsHostMode(false);
                            }}
                            className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-2xl transition-all"
                        >
                            <img src={stream.thumbnail} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                                <div className="absolute top-3 left-3 bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Live</div>
                                <div className="absolute top-3 right-3 bg-black/50 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                    <User size={10} /> {stream.viewerCount}
                                </div>
                                <h3 className="font-bold text-lg leading-tight mb-1">{stream.title}</h3>
                                <div className="flex items-center gap-2">
                                    <img src={stream.hostAvatar} className="w-6 h-6 rounded-full border border-white" />
                                    <span className="text-xs font-medium text-gray-300">{stream.hostName}</span>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px]">
                                    <PlayCircle size={48} className="text-white drop-shadow-lg" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Banner Section */}
        {!showLiveList && (
            <div className="relative h-[250px] md:h-[350px] mb-8 overflow-hidden rounded-xl shadow-lg group">
            <img 
                src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=1500" 
                alt="Promotion Banner"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex flex-col justify-center p-8 md:p-12 text-white">
                <span className="bg-[#febd69] text-black text-xs font-bold px-2 py-1 rounded w-fit mb-4">SỰ KIỆN GIỚI HẠN</span>
                <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">MUA SẮM THÔNG MINH<br/>ĐẤU GIÁ ĐỈNH CAO</h1>
                <p className="text-sm md:text-lg text-gray-200 font-medium max-w-lg mb-6">Bảo vệ người mua và người bán với hệ thống thanh toán tạm giữ (Escrow) an toàn tuyệt đối.</p>
                <div className="flex gap-4">
                <button 
                    onClick={() => user ? setIsSellModalOpen(true) : setIsAuthModalOpen(true)}
                    className="bg-[#febd69] text-black font-bold px-6 py-3 rounded-lg hover:bg-[#f3a847] transition-all transform hover:-translate-y-1 shadow-lg"
                >
                    Đăng bán ngay
                </button>
                </div>
            </div>
            </div>
        )}

        {/* Categories Tab Bar */}
        <div className="bg-white rounded-xl shadow-sm mb-8 sticky top-[108px] z-40 border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 p-3 overflow-x-auto custom-scrollbar">
            <div className="flex items-center gap-2 pr-4 border-r border-gray-200 shrink-0 sticky left-0 bg-white z-10 py-1 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
              <Filter size={18} className="text-gray-400" />
              <span className="text-xs font-bold text-gray-500 uppercase">Danh mục</span>
            </div>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all shrink-0 border ${
                  selectedCategory === cat 
                  ? 'bg-[#131921] text-white border-[#131921] shadow-md' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4 bg-white p-1 rounded-lg shadow-sm border border-gray-100">
            <button 
              onClick={() => setFilterType('ALL')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filterType === 'ALL' ? 'bg-gray-100 text-[#131921]' : 'text-gray-400'}`}
            >
              TẤT CẢ
            </button>
            <button 
              onClick={() => setFilterType(ItemType.FIXED_PRICE)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filterType === ItemType.FIXED_PRICE ? 'bg-orange-100 text-orange-600' : 'text-gray-400'}`}
            >
              MUA NGAY
            </button>
            <button 
              onClick={() => setFilterType(ItemType.AUCTION)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filterType === ItemType.AUCTION ? 'bg-red-100 text-red-600' : 'text-gray-400'}`}
            >
              ĐẤU GIÁ
            </button>
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Hiển thị <span className="text-[#131921] font-bold">{filteredProducts.length}</span> kết quả cho "{searchTerm || selectedCategory}"
          </p>
        </div>

        {/* Flash Sale Banner */}
        {filterType === 'ALL' && !searchTerm && selectedCategory === 'Tất cả' && (
          <FlashSaleBanner 
            products={products} 
            onAddToCart={handleAddToCart} 
            onPlaceBid={handleOpenBidModal} 
          />
        )}

        {/* AI Recommendations */}
        <AIRecommendations 
          products={products} 
          cartItems={cart} 
          onAddToCart={handleAddToCart} 
          onPlaceBid={handleOpenBidModal} 
        />

        {/* Business Info Section on Home Page */}
        <section className="mt-16 mb-12 bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Về AmazeBid</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                AmazeBid là nền tảng thương mại điện tử và đấu giá trực tuyến hàng đầu tại Việt Nam. Chúng tôi cung cấp giải pháp mua sắm an toàn với hệ thống thanh toán tạm giữ (Escrow), đảm bảo quyền lợi tối đa cho cả người mua và người bán.
              </p>
              
              <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 mb-6">
                <h3 className="text-xl font-bold text-orange-800 mb-3 flex items-center gap-2">
                  <Sparkles size={20} className="text-orange-500" />
                  Câu chuyện đằng sau cái tên AMAZEBID
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed mb-3">
                  Trong hành trình xây dựng một nền tảng thương mại hiện đại, chúng tôi muốn tìm một cái tên không chỉ dễ nhớ, dễ đọc, mà còn phải truyền tải được tinh thần cốt lõi của sản phẩm: <span className="font-bold">đơn giản – mạnh mẽ – gây ấn tượng</span>. Từ đó, <span className="font-bold text-orange-600">AMAZEBID</span> ra đời.
                </p>
                <p className="text-gray-700 text-sm leading-relaxed mb-3">
                  Tên gọi này được ghép từ hai từ tiếng Anh:
                </p>
                <ul className="list-disc list-inside text-gray-700 text-sm mb-3 space-y-1 ml-2">
                  <li><span className="font-bold">Amaze</span> – tạo ra sự ngạc nhiên, khiến người dùng phải "wow" vì trải nghiệm vượt mong đợi</li>
                  <li><span className="font-bold">Bid</span> – đấu giá, ra giá, mua bán</li>
                </ul>
                <blockquote className="border-l-4 border-orange-400 pl-4 italic text-gray-800 font-medium">
                  "Một nền tảng mua bán – đấu giá mang đến trải nghiệm bất ngờ, thú vị và đầy cảm hứng cho mọi người."
                </blockquote>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">1M+</p>
                  <p className="text-xs text-gray-500 font-bold uppercase">Người dùng</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl">
                  <p className="text-2xl font-bold text-orange-600">500K+</p>
                  <p className="text-xs text-gray-500 font-bold uppercase">Sản phẩm</p>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-gray-50 p-6 rounded-2xl border border-gray-200 sticky top-24">
              <h3 className="font-bold text-lg mb-4">Thông tin liên hệ</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin size={18} className="text-blue-600" />
                  <span>123 Đường Công Nghệ, Quận 1, TP. Hồ Chí Minh</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone size={18} className="text-green-600" />
                  <span>Hotline: 1900 1234</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail size={18} className="text-orange-600" />
                  <span>Email: support@amazebid.vn</span>
                </li>
                <li className="pt-4 border-t border-gray-200">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mã số thuế: 0123456789</p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={handleAddToCart}
                onPlaceBid={handleOpenBidModal} 
                onChatWithSeller={handleChatWithSeller}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-20 text-center shadow-sm border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <PackageSearch size={40} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy sản phẩm</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">Chúng tôi không tìm thấy kết quả phù hợp với lựa chọn của bạn. Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('Tất cả');
                setFilterType('ALL');
              }}
              className="text-blue-600 font-bold hover:underline"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
          </>
        )}
      </main>
      )}

      <Footer onOpenPage={setActiveBusinessPage} />

      {activeBusinessPage && (
        <BusinessPages 
          page={activeBusinessPage} 
          onClose={() => setActiveBusinessPage(null)} 
        />
      )}

      <KOLStreamStudio 
        isOpen={isKOLStudioOpen} 
        onClose={() => setIsKOLStudioOpen(false)} 
        onPostToFeed={handleAddContentPost}
        products={myProducts}
      />

      {selectedStoreId && !isDigitalMenuOpen && (
        <StoreDetail 
          storeId={selectedStoreId} 
          onClose={() => setSelectedStoreId(null)} 
        />
      )}

      {selectedStoreId && isDigitalMenuOpen && (
        <DigitalMenu 
          storeId={selectedStoreId}
          onClose={() => setIsDigitalMenuOpen(false)}
          onAddToCart={(item) => {
            // Handle add to cart from menu
            // This would need to be integrated with the cart state
            // For now, let's just show a notification
            setNotification(`Đã thêm ${item.name} vào giỏ hàng`);
            setTimeout(() => setNotification(null), 3000);
          }}
        />
      )}

      {isStoreRegistrationOpen && (
        <StoreRegistration 
          onClose={() => setIsStoreRegistrationOpen(false)} 
        />
      )}

      {/* ChatWidget moved to BottomToolbar integration */}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[200] overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-5 bg-[#232f3e] text-white flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-3">
                <ShoppingBag size={24} className="text-[#febd69]" />
                <h2 className="text-lg font-bold">Giỏ hàng ({cart.reduce((s, i) => s + i.quantity, 0)})</h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="hover:bg-gray-700 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="bg-gray-100 p-6 rounded-full">
                    <ShoppingBag size={48} className="text-gray-300" />
                  </div>
                  <div>
                    <p className="text-gray-800 font-bold text-lg">Giỏ hàng của bạn đang trống</p>
                    <p className="text-gray-500 text-sm mt-1">Hãy tiếp tục khám phá và thêm sản phẩm!</p>
                  </div>
                  <button 
                    onClick={() => setIsCartOpen(false)} 
                    className="bg-[#febd69] px-8 py-3 rounded-full font-bold shadow-md hover:bg-[#f3a847] transition-all"
                  >
                    Bắt đầu mua sắm
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                    <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <img src={item.image} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">{item.title}</h4>
                        <p className="text-xs text-green-600 mt-1">Còn hàng</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-lg font-bold text-[#b12704]">${(item.price * item.quantity).toFixed(2)}</p>
                        <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-lg p-1 shadow-sm">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-100 rounded text-gray-500"><Minus size={14}/></button>
                          <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-100 rounded text-gray-500"><Plus size={14}/></button>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)} 
                        className="text-[10px] font-bold text-blue-600 hover:text-red-600 uppercase mt-2 w-fit flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12}/> Xóa
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4">
                {/* Shipping Options */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Đơn vị vận chuyển</label>
                  <div className="grid grid-cols-1 gap-2">
                    {MOCK_SHIPPING_OPTIONS.map(option => (
                      <button
                        key={option.id}
                        onClick={() => setSelectedShipping(option)}
                        className={`flex justify-between items-center p-3 rounded-xl border transition-all text-left ${
                          selectedShipping.id === option.id
                            ? 'bg-white border-orange-500 shadow-sm ring-1 ring-orange-500'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-gray-900">{option.name}</p>
                          <p className="text-[10px] text-gray-500">{option.provider} • {option.estimatedDays}</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">${option.price.toFixed(2)}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Discount Code */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mã giảm giá</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={discountCodeInput}
                      onChange={(e) => setDiscountCodeInput(e.target.value)}
                      placeholder="Nhập mã (ví dụ: AMAZE10)"
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    />
                    <button 
                      onClick={handleApplyDiscount}
                      className="bg-[#131921] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors"
                    >
                      Áp dụng
                    </button>
                  </div>
                  {discountError && <p className="text-[10px] text-red-600 font-bold">{discountError}</p>}
                  {appliedDiscount && (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-green-600" />
                        <span className="text-xs font-bold text-green-700">Đã áp dụng: {appliedDiscount.code}</span>
                      </div>
                      <button onClick={handleRemoveDiscount} className="text-green-700 hover:text-red-600"><X size={14}/></button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tạm tính:</span>
                    <span>${subtotalAmount.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                      <span>Giảm giá:</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Phí vận chuyển:</span>
                    <span>${shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-[#b12704] pt-2 border-t border-gray-200">
                    <span>Tổng cộng:</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                
                {clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm 
                      amount={totalAmount} 
                      onSuccess={handlePaymentSuccess} 
                      onCancel={() => setClientSecret(null)}
                    />
                  </Elements>
                ) : (
                  <button 
                    onClick={handleCheckout}
                    disabled={isProcessingPayment}
                    className="w-full bg-[#febd69] py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-[#f3a847] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingPayment ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
                    {isProcessingPayment ? 'Đang xử lý...' : 'Thanh toán an toàn (Stripe)'}
                  </button>
                )}
                <p className="text-[10px] text-center text-gray-400 font-medium">Thanh toán được bảo mật bởi Stripe & AmazeBid Escrow</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <SellModal 
        isOpen={isSellModalOpen} 
        onClose={() => setIsSellModalOpen(false)} 
        onAddProduct={handleAddProduct} 
      />

      {user?.role === 'ADMIN' && (
        <AdminDashboard 
          isOpen={isAdminDashboardOpen} 
          onClose={() => setIsAdminDashboardOpen(false)} 
          products={products}
        />
      )}

      {user?.role === 'ADMIN' && isAdminAITasksOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAdminAITasksOpen(false)} />
          <div className="relative w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="absolute top-4 right-4 z-50">
               <button onClick={() => setIsAdminAITasksOpen(false)} className="text-gray-400 hover:text-white bg-black/50 p-2 rounded-full backdrop-blur-md transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-auto bg-[#0a0a0a]">
               <AIRouterDashboard />
            </div>
          </div>
        </div>
      )}

      <SellerDashboard 
        isOpen={isSellerDashboardOpen}
        onClose={() => setIsSellerDashboardOpen(false)}
        products={products}
        currentUserId={user?.id || 'currentUser'}
      />

      <Suspense fallback={<div className="p-10 text-center">Đang tải Studio...</div>}>
        <VirtualAvatarStudio
          isOpen={isAvatarStudioOpen}
          onClose={() => setIsAvatarStudioOpen(false)}
          products={myProducts}
        />
      </Suspense>

      <OrderDashboard 
        isOpen={isOrderDashboardOpen} 
        onClose={() => setIsOrderDashboardOpen(false)} 
        products={products}
        currentUserId={user?.id || 'guest'}
        onUpdateStatus={handleOrderStatusUpdate}
      />

      {activeStream && (
          <LiveStreamViewer 
            stream={activeStream} 
            isHost={isHostMode}
            onClose={() => {
                setActiveStream(null);
                setIsHostMode(false);
            }} 
          />
      )}

      {isCreateStreamModalOpen && (
        <CreateStreamModal 
          onClose={() => setIsCreateStreamModalOpen(false)} 
          onStartStream={handleCreateStream}
          myProducts={myProducts}
          onOpenSellModal={() => {
            setIsCreateStreamModalOpen(false);
            setIsSellModalOpen(true);
          }}
        />
      )}

      {bidModalProduct && (
        <BidModal 
          product={bidModalProduct} 
          onClose={() => setBidModalProduct(null)} 
          onSubmitBid={(amount) => handleSubmitBid(bidModalProduct, amount)}
        />
      )}

      <SuperDealsModal 
        isOpen={isSuperDealsOpen} 
        onClose={() => setIsSuperDealsOpen(false)} 
        products={superDealsProducts}
        onAddToCart={handleAddToCart}
      />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      <UserProfile 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)}
        myProducts={myProducts}
        myPosts={contentPosts}
      />

      <CustomerServiceModal 
        isOpen={isCustomerServiceOpen}
        onClose={() => setIsCustomerServiceOpen(false)}
      />
      
      <ContentStudioModal
        isOpen={isContentStudioOpen}
        onClose={() => setIsContentStudioOpen(false)}
        onSavePost={handleAddContentPost}
        myProducts={myProducts}
      />

      <EmailInbox 
        isOpen={isEmailInboxOpen}
        onClose={() => setIsEmailInboxOpen(false)}
      />

      {user && (
        <UserWalletModal
          isOpen={isWalletOpen}
          onClose={() => setIsWalletOpen(false)}
        />
      )}

      {notification && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[300] bg-[#131921] text-white px-8 py-3 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 border-2 border-[#febd69] flex items-center gap-3">
          <div className="bg-[#febd69] p-1 rounded-full">
            <Sparkles className="text-black" size={16} />
          </div>
          <span className="text-sm font-bold tracking-tight">{notification}</span>
        </div>
      )}

      <GeminiAssistant 
        products={products} 
        hasChatWidget={!!user?.id} 
        isOpen={isGeminiOpen}
        onClose={() => setIsGeminiOpen(false)}
      />
      {user?.role === 'ADMIN' && <AIWorkerManager isOpen={isAIWorkerOpen} />}
      <ChatWidget 
        currentUserId={user?.id} 
        targetUser={chatTargetUser || undefined} 
        isOpen={isChatOpen || !!chatTargetUser}
        onClose={() => {
          setIsChatOpen(false);
          setChatTargetUser(null);
        }}
      />
      <BottomToolbar 
        isGeminiOpen={isGeminiOpen}
        isAIWorkerOpen={isAIWorkerOpen}
        isChatOpen={isChatOpen || !!chatTargetUser}
        onToggleGemini={() => setIsGeminiOpen(!isGeminiOpen)}
        onToggleAIWorker={() => setIsAIWorkerOpen(!isAIWorkerOpen)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
      />
      <ApiKeySelector />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <InnerApp />
    </Elements>
  );
};

export default App;
