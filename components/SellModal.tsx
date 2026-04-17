
import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Gavel, DollarSign, Tag, Info, PlusCircle, CreditCard, Landmark, Wallet, CheckCircle2, Sparkles, Link2, Globe, Download, Calculator, TrendingUp, ShieldAlert, Camera, FileText, ScanText, Bot, Loader2, Edit2, Trash2, Clock, Cpu } from 'lucide-react';
import { Product, ItemType, OrderStatus, AffiliateAccount } from '../types';
import { PRODUCT_TEMPLATES, AFFILIATE_NETWORK_ITEMS } from '../data';
import { api } from '../services/api';
import { aiImportService } from '../services/aiImportService';
import { edgeAI } from '../services/edgeAIService';
import { localProcessingService } from '../services/localProcessingService';
import BarcodeScanner from './BarcodeScanner';
import CameraCapture from './CameraCapture';
import { Scan } from 'lucide-react';

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (p: Product) => void;
}

const SellModal: React.FC<SellModalProps> = ({ isOpen, onClose, onAddProduct }) => {
  const [activeTab, setActiveTab] = useState<'PHYSICAL' | 'AFFILIATE'>('PHYSICAL');
  const [step, setStep] = useState(1);
  const [suggestions, setSuggestions] = useState<typeof PRODUCT_TEMPLATES>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // AI Import State
  const [showAiImport, setShowAiImport] = useState(false);
  const [aiImportLoading, setAiImportLoading] = useState(false);

  // AI Pricing State
  const [pricingPlan, setPricingPlan] = useState<any>(null);
  const [aiDescription, setAiDescription] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  // Affiliate Link Input (Manual)
  const [manualAffiliateLink, setManualAffiliateLink] = useState('');

  // High-value asset verification state
  const [legalDocuments, setLegalDocuments] = useState<File[]>([]);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [preferredNetworks, setPreferredNetworks] = useState('Shopee, Lazada, Amazon, Tiki');
  const [isSearchingAffiliate, setIsSearchingAffiliate] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isLocalAiLoading, setIsLocalAiLoading] = useState(false);
  const [isLocalMatching, setIsLocalMatching] = useState(false);
  const [importMode, setImportMode] = useState<'CLOUD' | 'LOCAL'>('CLOUD');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [cameraMode, setCameraMode] = useState<'INVOICE' | 'IMAGE'>('INVOICE');

  const [affiliateItems, setAffiliateItems] = useState(AFFILIATE_NETWORK_ITEMS);
  const [affiliateAccounts, setAffiliateAccounts] = useState<AffiliateAccount[]>([
    { id: '1', platform: 'Shopee', affiliateId: 'ref_shopee_123', isActive: true },
    { id: '2', platform: 'Amazon', affiliateId: 'ref_amazon_456', isActive: false }
  ]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('1');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [newAccountData, setNewAccountData] = useState({ platform: 'Shopee', affiliateId: '' });

  const [formData, setFormData] = useState(() => ({
    title: '',
    description: '',
    price: '',
    category: 'Electronics',
    type: ItemType.FIXED_PRICE,
    image: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000000)}/400/400`,
    payoutMethod: 'BANK_TRANSFER',
    isAffiliate: false,
    affiliateLink: '',
    platformName: '',
    commissionRate: 0,
    // New Pricing Fields
    costPrice: '',
    totalStock: '10',
    pricingStrategy: 'MANUAL' as 'AUTO' | 'MANUAL',
    isNegotiable: true,
    minNegotiationPrice: '',
    // AI Classification
    aiPriority: 'NORMAL' as 'URGENT' | 'NORMAL' | 'LOW',
    aiTags: '',
    // Flash Sale
    isFlashSale: false,
    flashSalePrice: '',
    flashSaleEndTime: '',
    // Packaging Info
    weight: '0.5',
    length: '10',
    width: '10',
    height: '10',
    isFragile: false,
    unit: 'Cái',
    currency: 'USD',
    // Auction Scheduling
    startTime: '', // Empty = Immediate
    endTime: '',
    autoRestart: false,
    stepPrice: '1'
  }));

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Auto-calculate pricing when inputs change
  useEffect(() => {
    if (formData.pricingStrategy === 'AUTO' && formData.costPrice && formData.totalStock) {
      const timer = setTimeout(async () => {
        setIsCalculating(true);
        try {
          const { plan, aiDescription } = await api.pricing.calculate({
            costPrice: parseFloat(formData.costPrice),
            totalStock: parseInt(formData.totalStock)
          });
          setPricingPlan(plan);
          setAiDescription(aiDescription);
          setFormData(prev => ({ ...prev, price: plan.sellingPrice.toString() }));
        } catch (err) {
          console.error(err);
        } finally {
          setIsCalculating(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.costPrice, formData.totalStock, formData.pricingStrategy]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const isHighValueAsset = ['Real Estate', 'Cars & Motorcycles', 'Collectibles'].includes(formData.category);

  const handleLocalAiCategory = async () => {
    if (!formData.title || isLocalAiLoading) return;
    
    setIsLocalAiLoading(true);
    try {
      const categories = [
        "Electronics", "Fashion", "Collectibles", "Computers", "Home & Office",
        "Beauty", "Music", "Phones & Accessories", "Mother & Baby", "Health & Medical",
        "Sports & Outdoors", "Books & Stationery", "Cars & Motorcycles", "Toys & Games",
        "Real Estate", "Food & Beverages"
      ];
      
      const suggested = await edgeAI.classify(formData.title, categories);
      if (suggested) {
        setFormData(prev => ({ ...prev, category: suggested }));
      }
    } catch (error) {
      console.error("Local AI Classification failed:", error);
    } finally {
      setIsLocalAiLoading(false);
    }
  };

  const handleLocalAiMatch = async () => {
    if (!formData.title || isLocalMatching) return;
    
    setIsLocalMatching(true);
    try {
      // Combine both specific templates AND shared inventory
      const catalog = [...PRODUCT_TEMPLATES, ...AFFILIATE_NETWORK_ITEMS];
      
      const bestMatch = await edgeAI.findBestMatch(formData.title, catalog);
      
      if (bestMatch) {
        applyTemplate(bestMatch);
        // Show a little success feedback (implicitly via form filling)
      } else {
        alert("Không tìm thấy kết quả phù hợp trong kho dữ liệu cục bộ. Bạn có thể thử tính năng Nhập liệu thông minh bằng Gemini AI.");
      }
    } catch (error) {
      console.error("Local matching failed:", error);
    } finally {
      setIsLocalMatching(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, title: value });

    if (value.length > 1) {
      const matches = PRODUCT_TEMPLATES.filter(item => 
        item.title.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const applyTemplate = (template: typeof PRODUCT_TEMPLATES[0]) => {
    setFormData({
      ...formData,
      title: template.title,
      description: template.description,
      price: template.price.toString(),
      category: template.category,
      image: template.image,
      type: ItemType.FIXED_PRICE 
    });
    setShowSuggestions(false);
  };

  const handleAiFindAffiliate = async () => {
      if (!aiSearchQuery) return;
      setIsSearchingAffiliate(true);
      
      const selectedAccount = affiliateAccounts.find(acc => acc.id === selectedAccountId);
      const accountContext = selectedAccount 
        ? `Sử dụng ID tiếp thị liên kết của tôi cho nền tảng ${selectedAccount.platform}: ${selectedAccount.affiliateId}. `
        : '';
      
      const networkContext = preferredNetworks 
        ? `Ưu tiên tìm kiếm trên các mạng lưới/nền tảng: ${preferredNetworks}. `
        : '';

      try {
          const prompt = `Tìm kiếm thông tin sản phẩm thực tế và link affiliate (hoặc link mua hàng trực tiếp) cho: "${aiSearchQuery}". 
          ${accountContext}
          ${networkContext}
          Hãy trả về dữ liệu dưới dạng JSON với các trường: 
          title, description, price (số), image (URL), category, platformName (ví dụ Amazon, Shopee, Lazada, Tiki), commissionRate (số từ 1-15), affiliateLink.
          Lưu ý: affiliateLink PHẢI là link trực tiếp đến trang bán sản phẩm (ví dụ: https://shopee.vn/product-name-i.123.456). Nếu không tìm thấy link affiliate thực tế, hãy tạo một link mua hàng từ nền tảng uy tín.`;

          const result = await api.ai.generate({
              prompt,
              task: 'find_affiliate',
              tools: [{ googleSearch: {} }]
          });

          // The result is already canonicalized by api.ai.generate
          let productData: any = {};
          try {
              // Remove potential style prefix like "[PROFESSIONAL] " and markdown blocks
              // Also fix common AI JSON mistakes
              const cleanContent = result.content
                  .replace(/^\[.*?\]\s*/, '')
                  .replace(/```json|```/g, '')
                  .replace(/:\s*True\b/g, ': true')
                  .replace(/:\s*False\b/g, ': false')
                  .replace(/:\s*None\b/g, ': null')
                  .trim();
              productData = JSON.parse(cleanContent);
          } catch (e) {
              console.error("Failed to parse AI product data, using raw content:", e);
              productData = {
                  title: aiSearchQuery,
                  description: result.content
              };
          }

          let productImage = productData.image;
          
          // Nếu AI không tìm thấy ảnh thực tế, tự động tạo ảnh bằng AI Image Model
          if (!productImage || productImage.includes('example.com') || productImage.includes('placeholder')) {
              try {
                  const genImageResult = await api.ai.image({
                      prompt: `Professional product photography of ${productData.title || aiSearchQuery}. ${productData.description || ''}. High resolution, studio lighting, clean background, e-commerce style.`,
                      aspectRatio: '1:1'
                  });
                  productImage = genImageResult.image;
              } catch (imgErr) {
                  console.warn("Failed to generate AI image for affiliate:", imgErr);
                  productImage = `https://picsum.photos/seed/${encodeURIComponent(aiSearchQuery)}/400/400`;
              }
          }

          const newProduct: Product = {
              id: `ai-aff-${Date.now()}`,
              title: productData.title || aiSearchQuery,
              description: productData.description || `Sản phẩm được tìm thấy cho: ${aiSearchQuery}`,
              price: productData.price || 0,
              image: productImage,
              category: productData.category || result.category || 'General',
              type: ItemType.FIXED_PRICE,
              rating: 4.5,
              reviewCount: 50,
              status: OrderStatus.AVAILABLE,
              sellerId: 'currentUser',
              isAffiliate: true,
              affiliateLink: productData.affiliateLink || `https://www.google.com/search?q=${encodeURIComponent(aiSearchQuery)}`,
              platformName: productData.platformName || 'External',
              commissionRate: productData.commissionRate || 5,
          };
          
          setAffiliateItems(prev => [newProduct, ...prev]);
          addFromAffiliateNetwork(newProduct);
          setAiSearchQuery('');
          alert(`AI đã tìm thấy và thêm sản phẩm "${newProduct.title}" vào kho hàng của bạn!`);
      } catch (error) {
          console.error("Lỗi khi tìm link affiliate:", error);
          alert("Không thể tìm thấy link affiliate phù hợp lúc này. Vui lòng thử lại với từ khóa khác.");
      } finally {
          setIsSearchingAffiliate(false);
      }
  };

  const addFromAffiliateNetwork = (item: any) => {
      const selectedAccount = affiliateAccounts.find(acc => acc.id === selectedAccountId);
      const trackingId = selectedAccount ? selectedAccount.affiliateId : 'user_123';
      
      const newProduct: Product = {
          id: `aff-${Date.now()}`,
          title: item.title,
          description: item.description,
          price: item.price,
          category: item.category,
          type: ItemType.FIXED_PRICE,
          image: item.image,
          rating: 5.0,
          reviewCount: 0,
          status: OrderStatus.AVAILABLE,
          sellerId: 'currentUser',
          isAffiliate: true,
          affiliateLink: item.affiliateLink || `https://amazebid.com/out?ref=${trackingId}&item=${item.id}`,
          platformName: item.platformName,
          commissionRate: item.commissionRate,
      };
      onAddProduct(newProduct);
      onClose();
  };

  const handleGenerateAiImage = async () => {
      if (!formData.title) {
          alert("Vui lòng nhập tên sản phẩm để AI có thể tạo ảnh chính xác.");
          return;
      }
      
      setIsGeneratingImage(true);
      try {
          const result = await api.ai.image({
              prompt: `Professional product photography of ${formData.title}. ${formData.description}. High resolution, studio lighting, clean background, e-commerce style.`,
              aspectRatio: '1:1'
          });
          setFormData({ ...formData, image: result.image });
      } catch (error) {
          console.error("Lỗi tạo ảnh AI:", error);
          alert("Không thể tạo ảnh AI lúc này. Vui lòng thử lại sau.");
      } finally {
          setIsGeneratingImage(false);
      }
  };

  const handleAddAffiliateAccount = () => {
      if (!newAccountData.affiliateId) return;
      
      if (editingAccountId) {
          setAffiliateAccounts(prev => prev.map(acc => 
              acc.id === editingAccountId 
                ? { ...acc, platform: newAccountData.platform, affiliateId: newAccountData.affiliateId }
                : acc
          ));
          setEditingAccountId(null);
      } else {
          const newAcc: AffiliateAccount = {
              id: Date.now().toString(),
              platform: newAccountData.platform,
              affiliateId: newAccountData.affiliateId,
              isActive: true
          };
          setAffiliateAccounts([...affiliateAccounts, newAcc]);
          setSelectedAccountId(newAcc.id);
      }
      
      setShowAddAccount(false);
      setNewAccountData({ platform: 'Shopee', affiliateId: '' });
  };

  const handleDeleteAffiliateAccount = (id: string) => {
      if (affiliateAccounts.length <= 1) {
          alert("Bạn phải giữ lại ít nhất một tài khoản affiliate.");
          return;
      }
      if (confirm("Bạn có chắc chắn muốn xóa tài khoản affiliate này?")) {
          const updated = affiliateAccounts.filter(acc => acc.id !== id);
          setAffiliateAccounts(updated);
          if (selectedAccountId === id) {
              setSelectedAccountId(updated[0].id);
          }
      }
  };

  const startEditingAccount = (acc: AffiliateAccount) => {
      setEditingAccountId(acc.id);
      setNewAccountData({ platform: acc.platform, affiliateId: acc.affiliateId });
      setShowAddAccount(true);
  };

  const handleAiImport = async (type: 'IMAGE' | 'INVOICE' | 'FILE' | 'BARCODE', source?: File | Blob | string) => {
    setAiImportLoading(true);
    try {
        let result = null;
        
        if (type === 'BARCODE' && typeof source === 'string') {
            // Giả lập tra cứu từ mã vạch
            result = {
                title: `Sản phẩm mã ${source.slice(-6)}`,
                description: `Sản phẩm được nhận diện từ mã vạch/QR: ${source}. Dữ liệu được trích xuất từ cơ sở dữ liệu nội bộ.`,
                category: "Electronics",
                price: (Math.floor(Math.random() * 900) + 100).toString(),
                costPrice: (Math.floor(Math.random() * 400) + 50).toString(),
                totalStock: "1"
            };
        } else if (importMode === 'LOCAL' && source) {
            // Xử lý trực tiếp (Client-side) không dùng API
            if (type === 'INVOICE' || type === 'IMAGE') {
                result = await localProcessingService.scanInvoice(source as any);
            } else if (type === 'FILE' && source instanceof File) {
                result = await localProcessingService.parseInventoryFile(source);
            }
        } else if (source) {
            // Xử lý bằng Cloud AI (API) - Giả định source là base64 hoặc file cần được convert
            const mockBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
            if (type === 'INVOICE') {
                result = await aiImportService.analyzeInvoice(mockBase64, 'image/png');
            } else if (type === 'IMAGE') {
                result = await aiImportService.analyzeProductImage(mockBase64, 'image/png');
            } else if (type === 'FILE' && source instanceof File) {
                result = await aiImportService.analyzeInventoryFile("Product Name, Price, Cost, Stock\nPS5, 499, 450, 50");
            }
        }

        if (result) {
            setFormData(prev => ({
                ...prev,
                title: result.title,
                description: result.description,
                category: result.category || prev.category,
                price: result.price,
                costPrice: result.costPrice,
                totalStock: result.totalStock || prev.totalStock,
                pricingStrategy: 'AUTO',
                aiTags: (result.category || '') + ', ' + result.title.split(' ')[0],
                aiPriority: 'NORMAL'
            }));
            
            // Auto-generate image if it's not a direct photo
            if (type !== 'IMAGE') {
                const imgResult = await api.ai.image({
                    prompt: `Professional product photography of ${result.title}. High resolution, studio lighting, clean background.`,
                    aspectRatio: '1:1'
                });
                setFormData(prev => ({ ...prev, image: imgResult.image }));
            }
        }
        
        setShowAiImport(false);
    } catch (error) {
        console.error("Import Error:", error);
        alert("Lỗi khi nhập liệu. Vui lòng thử lại.");
    } finally {
        setAiImportLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setLegalDocuments(prev => [...prev, ...newFiles].slice(0, 5)); // Max 5 files
    }
  };

  const removeFile = (index: number) => {
    setLegalDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price) return;

    if (isHighValueAsset) {
        alert('Tài sản giá trị cao của bạn đã được gửi để kiểm duyệt. Quá trình xác thực giấy tờ pháp lý có thể mất từ 1-2 ngày làm việc. Cảm ơn bạn đã hợp tác để tạo ra môi trường giao dịch an toàn!');
    }

    const newProduct: Product = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      type: formData.type,
      image: formData.image,
      rating: 5.0,
      reviewCount: 0,
      status: isHighValueAsset ? OrderStatus.PENDING_VERIFICATION : OrderStatus.AVAILABLE,
      sellerId: 'currentUser',
      payoutMethod: formData.payoutMethod,
      isAffiliate: activeTab === 'AFFILIATE',
      affiliateLink: formData.affiliateLink || manualAffiliateLink,
      platformName: formData.platformName || 'External',
      commissionRate: formData.commissionRate,
      // Pricing Strategy Fields
      pricingStrategy: formData.pricingStrategy,
      costPrice: parseFloat(formData.costPrice) || 0,
      totalStock: parseInt(formData.totalStock) || 1,
      stock: parseInt(formData.totalStock) || 1,
      isNegotiable: formData.isNegotiable,
      minNegotiationPrice: parseFloat(formData.minNegotiationPrice) || (parseFloat(formData.price) * 0.8), // Default 80% if not set
      sold: 0,
      breakEvenQuantity: pricingPlan?.breakEvenQuantity || 0,
      isRecoveryPhase: formData.pricingStrategy === 'AUTO',
      systemFeeRate: 0.05,
      privacyMode: isHighValueAsset ? privacyMode : false,
      aiPriority: formData.aiPriority,
      aiTags: formData.aiTags.split(',').map(t => t.trim()).filter(t => t),
      isFlashSale: formData.isFlashSale,
      flashSalePrice: formData.pricingStrategy === 'AUTO' ? (pricingPlan?.flashSalePrice || 0) : (parseFloat(formData.flashSalePrice) || 0),
      flashSaleEndTime: formData.flashSaleEndTime,
      // New Auction & Localization Fields
      startTime: formData.startTime,
      endTime: formData.endTime,
      autoRestart: formData.autoRestart,
      stepPrice: parseFloat(formData.stepPrice) || 1,
      unit: formData.unit,
      currency: formData.currency,
      packagingInfo: {
          weight: parseFloat(formData.weight) || 0,
          length: parseFloat(formData.length) || 0,
          width: parseFloat(formData.width) || 0,
          height: parseFloat(formData.height) || 0,
          isFragile: formData.isFragile
      },
      ...(formData.type === ItemType.AUCTION ? { 
        currentBid: parseFloat(formData.price), 
        bidCount: 0,
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString() 
      } : {})
    };
    onAddProduct(newProduct);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#131921] p-5 text-white flex justify-between items-center border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#febd69] rounded-lg">
              <PlusCircle size={24} className="text-[#131921]" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                 {activeTab === 'PHYSICAL' ? 'Đăng bán sản phẩm' : 'Thêm Affiliate Link'}
              </h2>
              {activeTab === 'PHYSICAL' && (
                <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                    <span className={step === 1 ? "text-[#febd69]" : ""}>1. Thông tin</span>
                    <span>&gt;</span>
                    <span className={step === 2 ? "text-[#febd69]" : ""}>2. Thanh toán</span>
                    {isHighValueAsset && (
                        <>
                            <span>&gt;</span>
                            <span className={step === 3 ? "text-[#febd69]" : ""}>3. Xác thực</span>
                        </>
                    )}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-gray-800 p-2 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex border-b border-gray-100 shrink-0">
            <button 
                onClick={() => setActiveTab('PHYSICAL')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'PHYSICAL' ? 'text-[#131921] border-b-2 border-[#131921] bg-gray-50' : 'text-gray-400 hover:bg-gray-50'}`}
            >
                <Tag size={16} /> Hàng của tôi (Vật lý)
            </button>
            <button 
                onClick={() => setActiveTab('AFFILIATE')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'AFFILIATE' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-50'}`}
            >
                <Globe size={16} /> Affiliate Network
            </button>
        </div>

        {activeTab === 'AFFILIATE' ? (
             // AFFILIATE MODE
             <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50">
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Link2 size={18} className="text-blue-600"/>
                            Kho hàng tiếp thị liên kết (Shared Inventory)
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Tài khoản:</span>
                            <div className="flex items-center gap-1">
                                <select 
                                    value={selectedAccountId}
                                    onChange={(e) => {
                                        if (e.target.value === 'new') {
                                            setEditingAccountId(null);
                                            setNewAccountData({ platform: 'Shopee', affiliateId: '' });
                                            setShowAddAccount(true);
                                        } else {
                                            setSelectedAccountId(e.target.value);
                                        }
                                    }}
                                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white outline-none focus:border-blue-500"
                                >
                                    {affiliateAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.platform} ({acc.affiliateId})</option>
                                    ))}
                                    <option value="new">+ Thêm tài khoản mới</option>
                                </select>
                                
                                <button 
                                    onClick={() => {
                                        const acc = affiliateAccounts.find(a => a.id === selectedAccountId);
                                        if (acc) startEditingAccount(acc);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Chỉnh sửa tài khoản"
                                >
                                    <Edit2 size={12} />
                                </button>
                                <button 
                                    onClick={() => handleDeleteAffiliateAccount(selectedAccountId)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Xóa tài khoản"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {showAddAccount && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg animate-in slide-in-from-top-2">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold text-blue-800">
                                    {editingAccountId ? 'Chỉnh sửa tài khoản Affiliate' : 'Thêm tài khoản Affiliate mới'}
                                </h4>
                                <button onClick={() => {
                                    setShowAddAccount(false);
                                    setEditingAccountId(null);
                                    setNewAccountData({ platform: 'Shopee', affiliateId: '' });
                                }} className="text-gray-400 hover:text-gray-600"><X size={14}/></button>
                            </div>
                            <div className="flex gap-2">
                                <select 
                                    value={newAccountData.platform}
                                    onChange={(e) => setNewAccountData({...newAccountData, platform: e.target.value})}
                                    className="text-xs border border-gray-300 rounded px-2 py-1 outline-none"
                                >
                                    <option value="Shopee">Shopee</option>
                                    <option value="Lazada">Lazada</option>
                                    <option value="Amazon">Amazon</option>
                                    <option value="Tiki">Tiki</option>
                                </select>
                                <input 
                                    value={newAccountData.affiliateId}
                                    onChange={(e) => setNewAccountData({...newAccountData, affiliateId: e.target.value})}
                                    placeholder="Nhập Tracking ID (VD: ref123)"
                                    className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 outline-none"
                                />
                                <button 
                                    onClick={handleAddAffiliateAccount}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700"
                                >
                                    Lưu
                                </button>
                            </div>
                        </div>
                    )}

                    <p className="text-sm text-gray-500 mb-4">
                        Chọn sản phẩm từ kho chung để thêm vào shop của bạn. Link tiếp thị sẽ được tự động tạo dựa trên tài khoản đã chọn.
                    </p>
                    
                    <div className="space-y-3">
                        {affiliateItems.map((item, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4 hover:border-blue-400 transition-all group">
                                <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative">
                                    <img src={item.image} className="w-full h-full object-cover" />
                                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl">
                                        {item.commissionRate}% HH
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-gray-900 line-clamp-1">{item.title}</h4>
                                            <p className="text-xs text-gray-500">{item.category} • Bán trên <span className="font-bold text-blue-600">{item.platformName}</span></p>
                                        </div>
                                        <p className="font-bold text-[#b12704]">${item.price}</p>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                                    
                                    <button 
                                        onClick={() => addFromAffiliateNetwork(item)}
                                        className="mt-3 w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2 border border-blue-200"
                                    >
                                        <Download size={14} /> Thêm vào kho hàng & Tạo Link
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                    <h3 className="font-bold text-gray-800 mb-3 text-sm">Hoặc thêm thủ công Link Affiliate</h3>
                    <div className="flex gap-2 mb-4">
                        <input 
                            value={manualAffiliateLink}
                            onChange={(e) => setManualAffiliateLink(e.target.value)}
                            className="flex-1 border border-gray-300 p-2 rounded-lg text-sm focus:border-blue-500 outline-none"
                            placeholder="Dán link sản phẩm (Amazon, Shopee, v.v.)"
                        />
                        <button className="bg-gray-800 text-white px-4 rounded-lg font-bold text-sm hover:bg-black">
                            Tìm
                        </button>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                        <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bot size={16} className="text-blue-600" /> AI Tự động tìm Link Affiliate
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-blue-600 bg-white px-2 py-0.5 rounded-full border border-blue-100">
                                <Globe size={10} /> Mạng lưới: {preferredNetworks.split(',').length}
                            </div>
                        </h4>
                        
                        <div className="mb-3">
                            <label className="text-[10px] font-bold text-blue-700 uppercase mb-1 block">Mạng lưới ưu tiên (cách nhau bằng dấu phẩy)</label>
                            <input 
                                value={preferredNetworks}
                                onChange={(e) => setPreferredNetworks(e.target.value)}
                                className="w-full border border-blue-200 p-1.5 rounded-lg text-[11px] focus:border-blue-500 outline-none bg-white/50"
                                placeholder="VD: Shopee, Lazada, Amazon, Tiki, AccessTrade..."
                            />
                        </div>

                        <p className="text-xs text-blue-700 mb-3">
                            Nhập tên sản phẩm, AI sẽ tìm kiếm trên các mạng lưới trên và tạo link cho bạn.
                        </p>
                        <div className="flex gap-2">
                            <input 
                                value={aiSearchQuery}
                                onChange={(e) => setAiSearchQuery(e.target.value)}
                                className="flex-1 border border-blue-200 p-2 rounded-lg text-sm focus:border-blue-500 outline-none bg-white"
                                placeholder="VD: Bàn phím cơ không dây Logitech..."
                            />
                            <button 
                                onClick={handleAiFindAffiliate}
                                disabled={isSearchingAffiliate || !aiSearchQuery}
                                className="bg-blue-600 text-white px-4 rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSearchingAffiliate ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                Tìm & Tạo Link
                            </button>
                        </div>
                    </div>
                </div>
             </div>
        ) : (
             // PHYSICAL MODE (Original)
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8">
            {step === 1 ? (
                showAiImport ? (
                    <div className="col-span-1 md:col-span-2 animate-in fade-in zoom-in-95 relative">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={() => setShowAiImport(false)} className="text-gray-400 hover:text-black transition-colors">
                                    <X size={20} />
                                </button>
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Bot className="text-indigo-600" /> Smart Import
                                </h3>
                            </div>
                            <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200">
                                <button 
                                    type="button"
                                    onClick={() => setImportMode('CLOUD')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${importMode === 'CLOUD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <Globe size={14} /> Cloud AI (Gemini)
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setImportMode('LOCAL')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${importMode === 'LOCAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <Cpu size={14} /> Xử lý Cục bộ (NPU/GPU)
                                </button>
                            </div>
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-8">
                            {importMode === 'CLOUD' 
                                ? "Sử dụng trí tuệ nhân tạo Gemini 1.5 để phân tích sâu, tối ưu nội dung và tìm kiếm thị trường. Cần kết nối Internet."
                                : "Xử lý trực tiếp trên thiết bị (OCR & Data Parsing). Miễn phí, cực nhanh, hoạt động ngay cả khi không có mạng và bảo vệ dữ liệu tuyệt đối."}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Option 1: Invoice */}
                            <div 
                                onClick={() => {
                                    if (importMode === 'LOCAL') {
                                        setCameraMode('INVOICE');
                                        setShowCameraCapture(true);
                                    } else {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/*';
                                        input.onchange = (e: any) => handleAiImport('INVOICE', e.target.files[0]);
                                        input.click();
                                    }
                                }}
                                className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <ScanText size={24} />
                                </div>
                                <h4 className="font-bold text-gray-800 mb-2">Quét Hóa Đơn</h4>
                                <p className="text-xs text-gray-500">
                                    {importMode === 'LOCAL' ? "Dùng camera chụp & quét OCR tại chỗ." : "Tải ảnh hóa đơn lên để AI phân tích."}
                                </p>
                            </div>

                            {/* Option 2: Image */}
                            <div 
                                onClick={() => {
                                    if (importMode === 'LOCAL') {
                                        setCameraMode('IMAGE');
                                        setShowCameraCapture(true);
                                    } else {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/*';
                                        input.onchange = (e: any) => handleAiImport('IMAGE', e.target.files[0]);
                                        input.click();
                                    }
                                }}
                                className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Camera size={24} />
                                </div>
                                <h4 className="font-bold text-gray-800 mb-2">Chụp Ảnh SP</h4>
                                <p className="text-xs text-gray-500">Tự động viết mô tả & điền thông tin từ hình ảnh.</p>
                            </div>

                            {/* Option 3: Barcode - Only in Local Mode for efficiency */}
                            {importMode === 'LOCAL' && (
                                <div 
                                    onClick={() => setShowBarcodeScanner(true)}
                                    className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Scan size={24} />
                                    </div>
                                    <h4 className="font-bold text-gray-800 mb-2">Quét Mã Vạch</h4>
                                    <p className="text-xs text-gray-500">Tra cứu nhanh hàng hóa từ mã vạch/QR code.</p>
                                </div>
                            )}

                            {/* Option 4: File */}
                            <div 
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = '.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel';
                                    input.onchange = (e: any) => handleAiImport('FILE', e.target.files[0]);
                                    input.click();
                                }}
                                className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <FileText size={24} />
                                </div>
                                <h4 className="font-bold text-gray-800 mb-2">Tải File (CSV/Excel)</h4>
                                <p className="text-xs text-gray-500">Nhập danh sách hàng loại từ file kho hàng.</p>
                            </div>
                        </div>

                        {aiImportLoading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl">
                                <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
                                <h3 className="text-lg font-bold text-gray-800 mb-2">AI đang phân tích dữ liệu...</h3>
                                <p className="text-sm text-gray-500">Đang trích xuất thông tin, tối ưu hóa mô tả và đề xuất giá bán.</p>
                            </div>
                        )}
                    </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* AI Smart Import Banner */}
                <div className="col-span-1 md:col-span-2 mb-2">
                    <div 
                        onClick={() => setShowAiImport(true)}
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px] rounded-2xl cursor-pointer hover:shadow-lg transition-all group"
                    >
                        <div className="bg-white p-4 rounded-2xl flex items-center justify-between group-hover:bg-opacity-90 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                        Nhập liệu thông minh với AI <Sparkles size={14} className="text-pink-500" />
                                    </h4>
                                    <p className="text-xs text-gray-500">Tải lên hóa đơn, hình ảnh hoặc file để AI tự động điền thông tin</p>
                                </div>
                            </div>
                            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">
                                Dùng thử ngay
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 1: Product Info */}
                <div className="space-y-6">
                    <div ref={wrapperRef} className="relative">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-wider flex justify-between">
                        <span>Tên sản phẩm</span>
                        <div className="flex items-center gap-3">
                            <button 
                                type="button"
                                onClick={handleLocalAiMatch}
                                disabled={!formData.title || isLocalMatching}
                                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 normal-case text-[10px] font-bold transition-colors disabled:opacity-50"
                            >
                                {isLocalMatching ? <Loader2 size={10} className="animate-spin" /> : <ScanText size={10} />}
                                Khớp lệnh Kho AI (Local)
                            </button>
                            <span className="text-[#febd69] flex items-center gap-1 normal-case"><Sparkles size={10} /> Tự động điền</span>
                        </div>
                    </label>
                    <div className="relative">
                        <input 
                            required
                            autoFocus
                            className="w-full border-2 border-gray-100 p-3 pl-4 rounded-xl focus:border-[#febd69] focus:ring-0 outline-none transition-all placeholder:text-gray-300 text-sm font-medium"
                            placeholder="VD: iPhone 15, Rolex..."
                            value={formData.title}
                            onChange={handleTitleChange}
                            onFocus={() => {
                                if(formData.title.length > 1 && suggestions.length > 0) setShowSuggestions(true);
                            }}
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                                <div className="bg-gray-50 px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                    Gợi ý từ kho dữ liệu
                                </div>
                                {suggestions.map((item, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => applyTemplate(item)}
                                        className="p-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                                    >
                                        <img src={item.image} className="w-10 h-10 rounded bg-gray-200 object-cover" />
                                        <div>
                                            <p className="font-bold text-sm text-[#131921]">{item.title}</p>
                                            <p className="text-xs text-gray-400 truncate w-48">{item.category}</p>
                                        </div>
                                        <div className="ml-auto text-xs font-bold text-[#febd69] bg-[#131921] px-2 py-1 rounded">
                                            Auto-fill
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 italic">Nhập tên để tìm kiếm thông tin có sẵn từ catalog.</p>
                    </div>

                    <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-wider">Mô tả chi tiết</label>
                    <textarea 
                        required
                        rows={4}
                        className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-[#febd69] focus:ring-0 outline-none transition-all placeholder:text-gray-300 text-sm resize-none"
                        placeholder="Mô tả sẽ được tự động điền nếu chọn gợi ý..."
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                    </div>

                    <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-wider flex justify-between items-center">
                        <span>Danh mục</span>
                        <button 
                            type="button"
                            onClick={handleLocalAiCategory}
                            disabled={!formData.title || isLocalAiLoading}
                            className="flex items-center gap-1 text-[9px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
                        >
                            {isLocalAiLoading ? (
                                <Loader2 size={10} className="animate-spin" />
                            ) : (
                                <Bot size={10} />
                            )}
                            Gợi ý bằng AI Cục bộ (NPU/GPU)
                        </button>
                    </label>
                    <select 
                        className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-[#febd69] outline-none transition-all text-sm font-bold bg-white"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                        <option value="Electronics">Điện tử (Electronics)</option>
                        <option value="Fashion">Thời trang (Fashion)</option>
                        <option value="Collectibles">Đồ cổ (Collectibles)</option>
                        <option value="Computers">Máy tính (Computers)</option>
                        <option value="Home & Office">Nhà cửa (Home & Office)</option>
                        <option value="Beauty">Làm đẹp (Beauty)</option>
                        <option value="Music">Âm nhạc (Music)</option>
                        <option value="Phones & Accessories">Điện thoại & Phụ kiện (Phones & Accessories)</option>
                        <option value="Mother & Baby">Mẹ & Bé (Mother & Baby)</option>
                        <option value="Health & Medical">Sức khỏe & Y tế (Health & Medical)</option>
                        <option value="Sports & Outdoors">Thể thao & Dã ngoại (Sports & Outdoors)</option>
                        <option value="Books & Stationery">Sách & Văn phòng phẩm (Books & Stationery)</option>
                        <option value="Cars & Motorcycles">Ô tô & Xe máy (Cars & Motorcycles)</option>
                        <option value="Toys & Games">Đồ chơi & Trò chơi (Toys & Games)</option>
                        <option value="Real Estate">Bất động sản (Real Estate)</option>
                        <option value="Food & Beverages">Thực phẩm & Đồ uống (Food & Beverages)</option>
                    </select>
                    </div>
                </div>

                <div className="space-y-6">
                    <div 
                        className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center group hover:border-[#febd69] transition-all cursor-pointer relative overflow-hidden min-h-[200px]"
                        onClick={() => document.getElementById('product-image-upload')?.click()}
                    >
                    <input 
                        id="product-image-upload"
                        type="file" 
                        accept="image/*,video/*" 
                        className="hidden" 
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    setFormData(prev => ({ ...prev, image: reader.result as string }));
                                };
                                reader.readAsDataURL(file);
                            }
                        }} 
                    />
                    {/* Preview Image if Auto-filled */}
                    {formData.image.includes('picsum') ? (
                        <>
                            <div className="p-3 bg-white rounded-full shadow-sm mb-3 text-gray-400 group-hover:text-[#febd69] transition-colors z-10">
                                <Upload size={28} />
                            </div>
                            <p className="text-xs font-bold text-gray-500 z-10">Kéo thả hoặc tải ảnh lên</p>
                            <p className="text-[10px] text-gray-400 mt-2 z-10 text-center px-4">
                                Bạn có thể tải lên ảnh/video có sẵn để tiết kiệm chi phí tạo AI. Hệ thống sẽ tự động tối ưu hóa và tái sử dụng cho các bài đăng sau.
                            </p>
                        </>
                    ) : (
                        <>
                            <img src={formData.image} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                            <div className="z-10 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                                <p className="text-xs font-bold text-gray-800 flex items-center gap-1"><CheckCircle2 size={12} className="text-green-600"/> Ảnh sản phẩm</p>
                            </div>
                        </>
                    )}
                    
                    {/* AI Image Generation Button */}
                    <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleGenerateAiImage(); }}
                        disabled={isGeneratingImage}
                        className="absolute bottom-4 right-4 bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-md z-20 transition-all disabled:opacity-50"
                    >
                        {isGeneratingImage ? (
                            <>
                                <Loader2 size={12} className="animate-spin" /> Đang tạo ảnh...
                            </>
                        ) : (
                            <>
                                <Sparkles size={12} /> Tạo ảnh thật bằng AI
                            </>
                        )}
                    </button>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Chiến lược & Đơn vị</label>
                            <div className="flex gap-2">
                                <select 
                                    className="text-[10px] font-bold border border-gray-200 rounded px-1.5 py-0.5 bg-white outline-none focus:border-[#febd69]"
                                    value={formData.currency}
                                    onChange={e => setFormData({...formData, currency: e.target.value})}
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="VND">VND (đ)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="JPY">JPY (¥)</option>
                                </select>
                                <select 
                                    className="text-[10px] font-bold border border-gray-200 rounded px-1.5 py-0.5 bg-white outline-none focus:border-[#febd69]"
                                    value={formData.unit}
                                    onChange={e => setFormData({...formData, unit: e.target.value})}
                                >
                                    <optgroup label="Phổ biến">
                                        <option value="Cái">Cái</option>
                                        <option value="Chiếc">Chiếc</option>
                                        <option value="Bộ">Bộ</option>
                                        <option value="Sản phẩm">Sản phẩm</option>
                                    </optgroup>
                                    <optgroup label="Khối lượng">
                                        <option value="Grm">Gram (g)</option>
                                        <option value="Kg">Kilogram (kg)</option>
                                        <option value="Tấn">Tấn</option>
                                    </optgroup>
                                    <optgroup label="Đóng gói">
                                        <option value="Thùng">Thùng</option>
                                        <option value="Hộp">Hộp</option>
                                        <option value="Gói">Gói</option>
                                        <option value="Túi">Túi</option>
                                        <option value="Chai">Chai</option>
                                        <option value="Lon">Lon</option>
                                        <option value="Kiện">Kiện</option>
                                        <option value="Lô">Lô / Batch</option>
                                    </optgroup>
                                    <optgroup label="Dịch vụ & Thời gian">
                                        <option value="Giờ">Giờ</option>
                                        <option value="Ngày">Ngày</option>
                                        <option value="Tháng">Tháng</option>
                                        <option value="Năm">Năm</option>
                                        <option value="Suất">Suất / Phần</option>
                                        <option value="Lượt">Lượt / Lần</option>
                                        <option value="Vé">Vé</option>
                                        <option value="Gói DV">Gói dịch vụ</option>
                                    </optgroup>
                                    <optgroup label="Kích thước & Diện tích">
                                        <option value="Mét">Mét (m)</option>
                                        <option value="M2">Mét vuông (m2)</option>
                                        <option value="Km">Kilomét (km)</option>
                                    </optgroup>
                                    <optgroup label="Kỹ thuật số">
                                        <option value="GB">Dung lượng (GB)</option>
                                        <option value="Account">Tài khoản</option>
                                        <option value="License">Giấy phép / Key</option>
                                    </optgroup>
                                </select>
                            </div>
                        </div>
                        <div className="flex p-1 bg-white rounded-lg border border-gray-200">
                            <button 
                                type="button"
                                onClick={() => setFormData({...formData, pricingStrategy: 'MANUAL'})}
                                className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 text-xs font-bold transition-all ${formData.pricingStrategy === 'MANUAL' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                            >
                                Thủ công
                            </button>
                            <button 
                                type="button"
                                onClick={() => setFormData({...formData, pricingStrategy: 'AUTO'})}
                                className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 text-xs font-bold transition-all ${formData.pricingStrategy === 'AUTO' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                            >
                                <TrendingUp size={14} /> AI Tự động
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-wider">Giá vốn / đơn vị ({formData.unit})</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">{formData.currency === 'VND' ? 'đ' : formData.currency === 'USD' ? '$' : formData.currency}</div>
                                    <input 
                                        type="number"
                                        className="w-full border-2 border-gray-100 p-2 pl-7 rounded-lg focus:border-indigo-500 outline-none transition-all text-sm font-bold"
                                        placeholder="0.00"
                                        value={formData.costPrice}
                                        onChange={e => setFormData({...formData, costPrice: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-wider">Số lượng nhập ({formData.unit})</label>
                                <input 
                                    type="number"
                                    className="w-full border-2 border-gray-100 p-2 rounded-lg focus:border-indigo-500 outline-none transition-all text-sm font-bold"
                                    placeholder="10"
                                    value={formData.totalStock}
                                    onChange={e => setFormData({...formData, totalStock: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Financial Analytics Preview */}
                        {formData.costPrice && formData.price && (
                            <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
                                <div className="text-center">
                                    <p className="text-[9px] text-gray-400 uppercase font-extrabold mb-1">Lợi nhuận/SP</p>
                                    <p className={`text-xs font-black ${parseFloat(formData.price) - parseFloat(formData.costPrice) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formData.currency === 'VND' ? 'đ' : '$'}{(parseFloat(formData.price) - parseFloat(formData.costPrice)).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-center border-x border-gray-200">
                                    <p className="text-[9px] text-gray-400 uppercase font-extrabold mb-1">Tỷ suất LN</p>
                                    <p className="text-xs font-black text-blue-600">
                                        {(( (parseFloat(formData.price) - parseFloat(formData.costPrice)) / parseFloat(formData.price) ) * 100).toFixed(1)}%
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] text-gray-400 uppercase font-extrabold mb-1">ROI dự kiến</p>
                                    <p className="text-xs font-black text-purple-600">
                                        {(( (parseFloat(formData.price) - parseFloat(formData.costPrice)) / parseFloat(formData.costPrice) ) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        )}

                        {formData.pricingStrategy === 'AUTO' && (
                            <>
                                {isCalculating ? (
                                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-center gap-3">
                                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-xs font-bold text-indigo-700">AI đang tính toán chiến lược...</span>
                                    </div>
                                ) : pricingPlan && (
                                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
                                        <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs">
                                            <Calculator size={14} /> Kế hoạch AI {pricingPlan.sellingPrice} {formData.currency}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white p-2 rounded-lg border border-indigo-100">
                                                <p className="text-[9px] text-gray-400 uppercase font-bold">Điểm hòa vốn</p>
                                                <p className="text-sm font-black text-indigo-600">{pricingPlan.breakEvenQuantity} {formData.unit}</p>
                                            </div>
                                            <div className="bg-white p-2 rounded-lg border border-indigo-100">
                                                <p className="text-[9px] text-gray-400 uppercase font-bold">Lợi nhuận gộp</p>
                                                <p className="text-sm font-black text-green-600">{formData.currency === 'VND' ? 'đ' : '$'}{pricingPlan.estimatedProfit.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-indigo-600 leading-relaxed italic bg-white/50 p-2 rounded-lg">
                                            {aiDescription}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Hình thức giao dịch</label>
                    <div className="flex p-1 bg-white rounded-lg border border-gray-200">
                        <button 
                        type="button"
                        onClick={() => setFormData({...formData, type: ItemType.FIXED_PRICE})}
                        className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 text-xs font-bold transition-all ${formData.type === ItemType.FIXED_PRICE ? 'bg-[#131921] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                        <DollarSign size={14} /> MUA NGAY
                        </button>
                        <button 
                        type="button"
                        onClick={() => setFormData({...formData, type: ItemType.AUCTION})}
                        className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 text-xs font-bold transition-all ${formData.type === ItemType.AUCTION ? 'bg-[#febd69] text-black shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                        <Gavel size={14} /> ĐẤU GIÁ
                        </button>
                    </div>
                    </div>

                    <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-wider">
                        {formData.type === ItemType.FIXED_PRICE ? 'Giá bán (Dự kiến)' : 'Giá khởi điểm'}
                    </label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{formData.currency === 'VND' ? 'đ' : formData.currency === 'USD' ? '$' : formData.currency}</div>
                        <input 
                        required
                        type="number"
                        className="w-full border-2 border-gray-100 p-3 pl-8 rounded-xl focus:border-[#febd69] outline-none transition-all font-bold text-xl text-[#131921]"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                        />
                    </div>
                    </div>

                    {/* Auction specific fields */}
                    {formData.type === ItemType.AUCTION && (
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-orange-800 uppercase tracking-wider">Thời điểm bắt đầu</label>
                                    <input 
                                        type="datetime-local"
                                        className="w-full border border-orange-200 p-2 rounded-lg text-xs font-bold bg-white"
                                        value={formData.startTime}
                                        onChange={e => setFormData({...formData, startTime: e.target.value})}
                                    />
                                    <p className="text-[9px] text-orange-600 italic">Để trống nếu muốn đấu giá ngay lập tức.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-orange-800 uppercase tracking-wider">Thời điểm kết thúc</label>
                                    <input 
                                        type="datetime-local"
                                        required
                                        className="w-full border border-orange-200 p-2 rounded-lg text-xs font-bold bg-white"
                                        value={formData.endTime}
                                        onChange={e => setFormData({...formData, endTime: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-orange-800 uppercase tracking-wider">Bước giá tối thiểu</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400 font-bold text-xs">{formData.currency === 'VND' ? 'đ' : '$'}</div>
                                        <input 
                                            type="number"
                                            className="w-full border border-orange-200 p-2 pl-6 rounded-lg text-sm font-bold bg-white"
                                            value={formData.stepPrice}
                                            onChange={e => setFormData({...formData, stepPrice: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-orange-800 uppercase tracking-wider">Tự động chạy lại</span>
                                        <span className="text-[8px] text-orange-600">Nếu không có người bid</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={formData.autoRestart}
                                            onChange={e => setFormData({...formData, autoRestart: e.target.checked})}
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="p-3 bg-white/60 rounded-lg flex gap-2">
                                <Clock className="text-orange-500 shrink-0" size={14} />
                                <p className="text-[9px] text-orange-800 leading-relaxed">
                                    {formData.startTime ? (
                                        <>Sau khi đăng, sản phẩm sẽ ở trạng thái <b>"Chờ đấu giá"</b> để người mua thẩm định. Bidding sẽ tự động mở vào đúng thời điểm bạn đã chọn.</>
                                    ) : (
                                        <>Đấu giá sẽ bắt đầu <b>Tức thì</b> ngay sau khi sản phẩm được duyệt.</>
                                    )}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* AI Negotiation Settings */}
                    {formData.type === ItemType.FIXED_PRICE && (
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Bot size={16} className="text-emerald-600" />
                                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Trợ lý Mặc cả AI</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={formData.isNegotiable}
                                        onChange={e => setFormData({...formData, isNegotiable: e.target.checked})}
                                    />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                </label>
                            </div>
                            
                            {formData.isNegotiable && (
                                <div className="space-y-2">
                                    <label className="block text-[9px] font-bold text-emerald-600 uppercase">Giá tối thiểu AI có thể chốt ($)</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-xs">$</div>
                                        <input 
                                            type="number"
                                            className="w-full border border-emerald-200 p-2 pl-6 rounded-lg focus:border-emerald-500 outline-none transition-all text-sm font-bold bg-white"
                                            placeholder="VD: 80"
                                            value={formData.minNegotiationPrice}
                                            onChange={e => setFormData({...formData, minNegotiationPrice: e.target.value})}
                                        />
                                    </div>
                                    <p className="text-[9px] text-emerald-500 italic">AI sẽ thay bạn mặc cả với khách hàng nhưng không bao giờ chốt dưới giá này.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Flash Sale Settings */}
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={16} className="text-red-600" />
                                <span className="text-xs font-bold text-red-800 uppercase tracking-wider">Chương trình Flash Sale</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={formData.isFlashSale}
                                    onChange={e => setFormData({...formData, isFlashSale: e.target.checked})}
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                        </div>
                        
                        {formData.isFlashSale && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="block text-[9px] font-bold text-red-600 uppercase">Giá Flash Sale ($)</label>
                                    <input 
                                        type="number"
                                        className="w-full border border-red-200 p-2 rounded-lg text-sm font-bold bg-white outline-none focus:border-red-500"
                                        placeholder="VD: 50"
                                        value={formData.flashSalePrice}
                                        onChange={e => setFormData({...formData, flashSalePrice: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[9px] font-bold text-red-600 uppercase">Kết thúc lúc</label>
                                    <input 
                                        type="datetime-local"
                                        className="w-full border border-red-200 p-2 rounded-lg text-xs bg-white outline-none focus:border-red-500"
                                        value={formData.flashSaleEndTime}
                                        onChange={e => setFormData({...formData, flashSaleEndTime: e.target.value})}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI Classification & Packaging */}
                    <div className="bg-gray-100 p-4 rounded-xl space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-wider">Độ ưu tiên (AI)</label>
                                <select 
                                    className="w-full border border-gray-300 p-2 rounded-lg text-xs bg-white outline-none"
                                    value={formData.aiPriority}
                                    onChange={e => setFormData({...formData, aiPriority: e.target.value as any})}
                                >
                                    <option value="LOW">Thấp</option>
                                    <option value="NORMAL">Bình thường</option>
                                    <option value="URGENT">Khẩn cấp</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-wider">AI Tags (cách nhau bằng dấu phẩy)</label>
                                <input 
                                    className="w-full border border-gray-300 p-2 rounded-lg text-xs bg-white outline-none"
                                    placeholder="VD: tech, premium, limited"
                                    value={formData.aiTags}
                                    onChange={e => setFormData({...formData, aiTags: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="pt-2 border-t border-gray-200">
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-wider">Thông tin đóng gói & Vận chuyển</label>
                            <div className="grid grid-cols-4 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-gray-500 uppercase">Cân nặng (kg)</label>
                                    <input type="number" step="0.1" className="w-full border border-gray-300 p-1.5 rounded text-xs bg-white" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-gray-500 uppercase">Dài (cm)</label>
                                    <input type="number" className="w-full border border-gray-300 p-1.5 rounded text-xs bg-white" value={formData.length} onChange={e => setFormData({...formData, length: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-gray-500 uppercase">Rộng (cm)</label>
                                    <input type="number" className="w-full border border-gray-300 p-1.5 rounded text-xs bg-white" value={formData.width} onChange={e => setFormData({...formData, width: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-gray-500 uppercase">Cao (cm)</label>
                                    <input type="number" className="w-full border border-gray-300 p-1.5 rounded text-xs bg-white" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 mt-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="w-3 h-3 text-blue-600 rounded"
                                    checked={formData.isFragile}
                                    onChange={e => setFormData({...formData, isFragile: e.target.checked})}
                                />
                                <span className="text-[10px] font-bold text-gray-600 uppercase">Hàng dễ vỡ</span>
                            </label>
                        </div>
                    </div>
                </div>
                </div>
                )
            ) : (
                <div className="space-y-6 animate-in slide-in-from-right">
                {/* Step 2: Payment & Payout Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                    <Info className="text-blue-600 shrink-0" size={20} />
                    <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">Cơ chế Bảo vệ AmazeBid SafePay</p>
                    <p>Tiền của người mua sẽ được hệ thống tạm giữ. Bạn sẽ chỉ nhận được tiền sau khi người mua xác nhận đã nhận hàng thành công và không có khiếu nại trả hàng.</p>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-wider">Chọn phương thức nhận tiền (Payout)</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                        onClick={() => setFormData({...formData, payoutMethod: 'BANK_TRANSFER'})}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.payoutMethod === 'BANK_TRANSFER' ? 'border-[#febd69] bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                        <Landmark size={24} className="mb-2 text-gray-700" />
                        <p className="font-bold text-sm">Chuyển khoản NH</p>
                        <p className="text-xs text-gray-500 mt-1">1-3 ngày làm việc</p>
                    </div>
                    <div 
                        onClick={() => setFormData({...formData, payoutMethod: 'WALLET'})}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.payoutMethod === 'WALLET' ? 'border-[#febd69] bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                        <Wallet size={24} className="mb-2 text-gray-700" />
                        <p className="font-bold text-sm">Ví điện tử</p>
                        <p className="text-xs text-gray-500 mt-1">Tức thì (Momo/ZaloPay)</p>
                    </div>
                    <div 
                        onClick={() => setFormData({...formData, payoutMethod: 'CRYPTO'})}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.payoutMethod === 'CRYPTO' ? 'border-[#febd69] bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                        <CreditCard size={24} className="mb-2 text-gray-700" />
                        <p className="font-bold text-sm">Tiền số (USDT)</p>
                        <p className="text-xs text-gray-500 mt-1">Mạng TRC20/ERC20</p>
                    </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Thông tin chi tiết</label>
                    <input 
                        className="w-full border border-gray-300 p-3 rounded-lg focus:border-[#febd69] outline-none text-sm"
                        placeholder={formData.payoutMethod === 'BANK_TRANSFER' ? "Số tài khoản - Tên ngân hàng - Chi nhánh" : "Địa chỉ ví / Số điện thoại ví"}
                    />
                    <div className="flex items-start gap-2 text-xs text-gray-500">
                        <CheckCircle2 size={14} className="text-green-600 mt-0.5" />
                        <span>Tôi đồng ý với điều khoản: Nếu có trả hàng, phí vận chuyển sẽ được trừ vào tài khoản của tôi hoặc người mua tùy theo chính sách.</span>
                    </div>
                </div>
                </div>
            )}

            {step === 3 && isHighValueAsset && (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 animate-in slide-in-from-right-4">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
                        <ShieldAlert className="text-blue-600 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="font-bold text-blue-900 text-sm">Xác thực tài sản giá trị cao</h4>
                            <p className="text-xs text-blue-700 mt-1">
                                Sản phẩm thuộc danh mục {formData.category === 'Real Estate' ? 'Bất động sản' : formData.category === 'Cars & Motorcycles' ? 'Ô tô & Xe máy' : 'Đồ cổ'} yêu cầu cung cấp giấy tờ pháp lý để đảm bảo tính minh bạch và an toàn cho người mua. Tin đăng sẽ được Admin kiểm duyệt trước khi hiển thị.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">
                            Giấy tờ pháp lý (Sổ đỏ, Giấy đăng ký xe, Chứng nhận...) <span className="text-red-500">*</span>
                        </label>
                        
                        {legalDocuments.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                                {legalDocuments.map((file, idx) => (
                                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square bg-gray-50 flex items-center justify-center">
                                        {file.type.startsWith('image/') ? (
                                            <img src={URL.createObjectURL(file)} alt="Document" className="w-full h-full object-cover" />
                                        ) : (
                                            <FileText className="text-gray-400" size={32} />
                                        )}
                                        <button 
                                            type="button"
                                            onClick={() => removeFile(idx)}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                        >
                                            <X size={14} />
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 truncate px-2">
                                            {file.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {legalDocuments.length < 5 && (
                            <div className="grid grid-cols-2 gap-3">
                                <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                                    <Upload size={24} className="text-blue-500 mb-2" />
                                    <p className="font-bold text-gray-700 text-xs">Tải lên file</p>
                                    <p className="text-[10px] text-gray-500 mt-1">Ảnh hoặc PDF</p>
                                    <input type="file" multiple accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
                                </label>
                                
                                <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                                    <Camera size={24} className="text-blue-500 mb-2" />
                                    <p className="font-bold text-gray-700 text-xs">Chụp ảnh</p>
                                    <p className="text-[10px] text-gray-500 mt-1">Dùng camera</p>
                                    <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                                </label>
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Tối đa 5 file, mỗi file không quá 10MB. Bắt buộc phải có ít nhất 1 giấy tờ.</p>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Bảo mật thông tin</label>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    checked={privacyMode}
                                    onChange={(e) => setPrivacyMode(e.target.checked)}
                                />
                                <div>
                                    <p className="font-bold text-sm text-gray-800">Bảo mật thông tin nhạy cảm</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Ẩn địa chỉ chính xác và các thông tin cá nhân trên giấy tờ. Chỉ những người mua đã được xác minh danh tính (KYC) hoặc đặt cọc mới có thể xem chi tiết.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Hợp đồng & Điều khoản</label>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                />
                                <div>
                                    <p className="font-bold text-sm text-gray-800">Đồng ý với Hợp đồng giao dịch tài sản giá trị cao</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Tôi xác nhận các thông tin và giấy tờ cung cấp là chính xác. Tôi đồng ý với các điều khoản về giải quyết tranh chấp, phí nền tảng và trách nhiệm pháp lý giữa Người bán, Người mua và Sàn giao dịch.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            )}
            </form>
        )}

        {/* Footer */}
        {activeTab === 'PHYSICAL' && (
             <div className="p-5 border-t border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                {step > 1 ? (
                    <button 
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="text-gray-500 font-bold text-sm hover:text-black"
                    >
                    Quay lại
                    </button>
                ) : (
                    <div />
                )}
                
                {step === 1 ? (
                    <button 
                    type="button"
                    onClick={() => {
                        if (formData.title && formData.price) setStep(2);
                    }}
                    className="bg-[#131921] text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all"
                    >
                    Tiếp tục: Thanh toán
                    </button>
                ) : step === 2 && isHighValueAsset ? (
                    <button 
                    type="button"
                    onClick={() => setStep(3)}
                    className="bg-[#131921] text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all"
                    >
                    Tiếp tục: Xác thực
                    </button>
                ) : (
                    <button 
                    onClick={handleSubmit}
                    disabled={isHighValueAsset && step === 3 && (!agreedToTerms || legalDocuments.length === 0)}
                    className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${
                        isHighValueAsset && step === 3 && (!agreedToTerms || legalDocuments.length === 0)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-[#febd69] text-black hover:bg-[#f3a847]'
                    }`}
                    >
                    Hoàn tất đăng bán
                    </button>
                )}
            </div>
        )}
      </div>

      <BarcodeScanner 
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScanSuccess={(code) => handleAiImport('BARCODE', code)}
      />

      <CameraCapture 
        isOpen={showCameraCapture}
        onClose={() => setShowCameraCapture(false)}
        onCapture={(blob) => handleAiImport(cameraMode, blob as any)}
      />
    </div>
  );
};

export default SellModal;
