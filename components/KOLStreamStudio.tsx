import React, { useState, useRef } from 'react';
import { X, Upload, Video, Sparkles, User, Play, Loader2, Share2, Wand2, Film, Mic, Package, Shirt, Save, Library, Image, Database } from 'lucide-react';
import { generateKOLGallery, generateStreamScript, generateStreamVideo, generateKOLOutfitGallery } from '../services/kolService';
import { useAuth } from '../context/useAuth';
import { Product, KnowledgeItem } from '../types';
import { KnowledgeBaseManager } from './KnowledgeBaseManager';

interface KOLStreamStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onPostToFeed: (content: any) => void;
  products: Product[];
}

interface SavedAsset {
  id: string;
  type: 'AVATAR' | 'VIDEO';
  url: string;
  name: string;
  createdAt: string;
  metadata?: string; // Style or Script
}

const KOLStreamStudio: React.FC<KOLStreamStudioProps> = ({ isOpen, onClose, onPostToFeed, products = [] }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'KOL' | 'PRODUCT' | 'PREVIEW' | 'LIBRARY'>('KOL');
  const [isLoading, setIsLoading] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);

  // Saved Assets State
  const [savedAssets, setSavedAssets] = useState<SavedAsset[]>(() => {
    try {
      const saved = localStorage.getItem('kol_assets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse saved assets", e);
      return [];
    }
  });

  // KOL State
  const [kolName, setKolName] = useState('');
  const [kolStyle, setKolStyle] = useState('Energetic, Fashionable, Gen Z');
  const [stageStyle, setStageStyle] = useState('Professional Studio');
  const [kolGallery, setKolGallery] = useState<string[]>([]);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number>(0);
  const kolAvatar = kolGallery[selectedAvatarIndex] || null;
  const [selectedPoses, setSelectedPoses] = useState<string[]>([]);
  const [selectedCameraAngle, setSelectedCameraAngle] = useState<string>('cinematic camera angle');

  // Product State
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [script, setScript] = useState('');
  const [slideshowSpeed, setSlideshowSpeed] = useState<number>(10);
  const [isKnowledgeBaseOpen, setIsKnowledgeBaseOpen] = useState(false);
  
  // Generated Content
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

  const professionalStyles = [
    { label: 'Công nhân', value: 'Công nhân kỹ thuật, đồng phục bảo hộ, năng động, thực tế, hiện trường nhà máy' },
    { label: 'Kỹ sư', value: 'Kỹ sư chuyên nghiệp, áo sơ mi, kính cận, thông thái, tin cậy, bản vẽ kỹ thuật' },
    { label: 'Xây dựng', value: 'Kỹ sư xây dựng, mũ bảo hộ vàng, áo phản quang, công trường đang thi công' },
    { label: 'Điện tử', value: 'Thợ sửa chữa điện tử, kính lúp, linh kiện vi mạch, tỉ mỉ, phòng kỹ thuật' },
    { label: 'Văn phòng', value: 'Nhân viên văn phòng, vest công sở, lịch sự, chuyên nghiệp, hiện đại' },
    { label: 'Tài chính', value: 'Chuyên gia tài chính, vest cao cấp, phong thái tự tin, biểu đồ kinh tế' },
    { label: 'Y tế', value: 'Bác sĩ, áo blouse trắng, tận tâm, chuyên môn cao, môi trường y tế' },
    { label: 'Đầu bếp', value: 'Đầu bếp chuyên nghiệp, mũ trắng, sáng tạo, đam mê, không gian bếp' },
    { label: 'Giáo viên', value: 'Giáo viên, trang phục thanh lịch, thân thiện, truyền cảm hứng, lớp học' },
    { label: 'Thể thao', value: 'Huấn luyện viên thể thao, đồ tập năng động, khỏe khoắn, phòng tập' },
    { label: 'Giao hàng', value: 'Nhân viên giao hàng, đồng phục shipper, nhanh nhẹn, thân thiện, ngoài đường phố' },
    { label: 'Bán hàng', value: 'Nhân viên bán hàng, trang phục lịch sự, nụ cười tươi, nhiệt tình, cửa hàng hiện đại' },
    { label: 'Nông dân', value: 'Nông dân hiện đại, trang phục làm vườn, nón lá, mộc mạc, cánh đồng xanh' },
    { label: 'Làm đẹp', value: 'Chuyên gia trang điểm (Makeup Artist), sành điệu, nghệ thuật, studio làm đẹp' },
    { label: 'Công nghệ', value: 'Chuyên gia công nghệ (Tech Reviewer), hiện đại, am hiểu, phòng lab công nghệ' },
    { label: 'Nội trợ', value: 'Người nội trợ đảm đang, ấm áp, gần gũi, không gian gia đình tiện nghi' },
    { label: 'Du lịch', value: 'Blogger du lịch, trang phục dã ngoại, năng động, bối cảnh thiên nhiên hùng vĩ' },
    { label: 'Mẹ & Bé', value: 'Người mẹ trẻ, dịu dàng, chu đáo, trang phục thoải mái, phòng trẻ em' },
    { label: 'Gen Z', value: 'Energetic, Fashionable, Gen Z, trẻ trung, bắt trend, phong cách đường phố' }
  ];

  const poseTemplates = [
    { label: 'Đứng thẳng', value: 'standing confidently, looking at camera, full body' },
    { label: 'Đang làm việc', value: 'working focused, using tools or equipment, professional setting' },
    { label: 'Đang đọc sách', value: 'sitting comfortably, reading a book, intellectual expression' },
    { label: 'Đang thuyết trình', value: 'standing, gesturing with hands, explaining something' },
    { label: 'Đang uống cafe', value: 'sitting at a cafe, holding a coffee cup, relaxed' },
    { label: 'Đang đi bộ', value: 'walking forward, dynamic movement, street background' },
    { label: 'Đang cười', value: 'close up portrait, big friendly smile, looking at camera' },
    { label: 'Đang suy nghĩ', value: 'sitting, hand on chin, thoughtful expression' }
  ];

  const cameraAngleTemplates = [
    { label: 'Cinematic', value: 'cinematic camera angle, 8k, highly detailed' },
    { label: 'Cận cảnh', value: 'close-up shot, focus on facial expressions' },
    { label: 'Góc rộng', value: 'wide angle shot, showing the environment' },
    { label: 'Góc thấp', value: 'low angle shot, looking up, heroic and powerful' },
    { label: 'Góc cao', value: 'high angle shot, looking down, vulnerable or small' },
    { label: 'Ngang tầm mắt', value: 'eye level shot, neutral and direct' },
    { label: 'Góc nghiêng', value: 'dutch angle, tilted camera, dynamic and edgy' },
    { label: 'Góc nhìn thứ nhất', value: 'first person view, POV, immersive' },
    { label: 'Chụp từ trên xuống', value: 'top down view, flat lay style' },
    { label: 'Chụp từ dưới lên', value: 'bottom up view, dramatic perspective' },
    { label: 'Góc 3/4', value: 'three-quarter view, classic portrait angle' },
    { label: 'Chụp nghiêng', value: 'side profile shot, showing silhouette' },
    { label: 'Chụp từ xa', value: 'long shot, character in landscape' },
    { label: 'Chụp cực cận', value: 'macro shot, extreme close-up on details' },
    { label: 'Góc mắt chim', value: 'bird\'s eye view, directly from above' },
    { label: 'Góc mắt giun', value: 'worm\'s eye view, directly from below' },
    { label: 'Góc qua vai', value: 'over the shoulder shot, conversational' },
    { label: 'Góc nhìn lén', value: 'paparazzi style, candid through obstacles' },
    { label: 'Góc đối xứng', value: 'symmetrical composition, centered' },
    { label: 'Góc quy tắc 1/3', value: 'rule of thirds composition, off-center' },
    { label: 'Góc sâu', value: 'deep focus, foreground and background sharp' },
    { label: 'Góc mờ ảo', value: 'shallow depth of field, bokeh background' },
    { label: 'Góc toàn cảnh', value: 'panoramic view, wide horizontal' },
    { label: 'Góc chân dung', value: 'portrait orientation, focus on person' }
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const safeProducts = products || [];

  const handleSaveAsset = (type: 'AVATAR' | 'VIDEO', url: string, name: string, metadata?: string) => {
    const newAsset: SavedAsset = {
      id: Date.now().toString(),
      type,
      url,
      name,
      createdAt: new Date().toISOString(),
      metadata
    };
    const updatedAssets = [newAsset, ...savedAssets];
    setSavedAssets(updatedAssets);
    localStorage.setItem('kol_assets', JSON.stringify(updatedAssets));
  };

  const handleDeleteAsset = (id: string) => {
    const updatedAssets = savedAssets.filter(a => a.id !== id);
    setSavedAssets(updatedAssets);
    localStorage.setItem('kol_assets', JSON.stringify(updatedAssets));
  };

  const handleRestoreAsset = (asset: SavedAsset) => {
    if (asset.type === 'AVATAR') {
      setKolAvatar(asset.url);
      setKolName(asset.name);
      if (asset.metadata) setKolStyle(asset.metadata);
      setActiveTab('KOL');
    } else {
      setGeneratedVideo(asset.url);
      setActiveTab('PREVIEW');
    }
  };

  const handleSelectProduct = (product: Product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
    }
    setShowProductSelector(false);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const handleGenerateAvatar = async () => {
    setIsLoading(true);
    try {
      const gallery = await generateKOLGallery(`${kolName}, ${kolStyle}`, selectedPoses, selectedCameraAngle);
      if (gallery && gallery.length > 0) {
        setKolGallery(gallery);
        setSelectedAvatarIndex(0);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateOutfit = async () => {
    if (selectedProducts.length === 0) return;
    setIsLoading(true);
    try {
      const productTitles = selectedProducts.map(p => p.title);
      const gallery = await generateKOLOutfitGallery(`${kolName}, ${kolStyle}`, productTitles, selectedPoses, selectedCameraAngle);
      if (gallery && gallery.length > 0) {
        setKolGallery(gallery);
        setSelectedAvatarIndex(0);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Create a temporary product object for uploaded image
        const newProduct: Product = {
            id: `temp-${Date.now()}`,
            title: 'Uploaded Item',
            description: '',
            price: 0,
            image: reader.result as string,
            category: 'Custom',
            type: 'FIXED_PRICE' as any,
            rating: 0,
            reviewCount: 0,
            status: 'AVAILABLE' as any,
            sellerId: user?.id || 'me'
        };
        setSelectedProducts([...selectedProducts, newProduct]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateScript = async () => {
    setIsLoading(true);
    try {
      const productNames = selectedProducts.map(p => p.title);
      
      // Fetch knowledge base items
      let knowledgeContext = '';
      try {
        const savedKb = localStorage.getItem('ai_knowledge_base');
        if (savedKb) {
          const kbItems: KnowledgeItem[] = JSON.parse(savedKb);
          const relevantItems = kbItems.filter(item => 
            (item.type === 'TEXT' || item.type === 'SPEC' || item.type === 'INSTRUCTION') && 
            selectedProducts.some(p => 
              item.title.toLowerCase().includes(p.title.toLowerCase()) || 
              item.tags.some(t => p.title.toLowerCase().includes(t.toLowerCase()))
            )
          );
          if (relevantItems.length > 0) {
            knowledgeContext = relevantItems.map(item => `[${item.type} - ${item.title}]: ${item.content}`).join('\n\n');
          }
        }
      } catch (e) {
        console.error("Failed to load knowledge base", e);
      }

      const newScript = await generateStreamScript(productNames, `${kolStyle}, Setting: ${stageStyle}`, knowledgeContext);
      setScript(newScript);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!kolAvatar || selectedProducts.length === 0) return;
    setIsLoading(true);
    try {
      // Combine styles for the video prompt
      const fullPrompt = `KOL Style: ${kolStyle}. Setting: ${stageStyle}. Script Action: ${script}`;
      // Use the first product image as reference if needed, or just rely on the KOL avatar which now includes the outfit
      const videoUrl = await generateStreamVideo(kolAvatar, selectedProducts[0]?.image, fullPrompt);
      if (videoUrl) setGeneratedVideo(videoUrl);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setActiveTab('PREVIEW');
    }
  };

  const handlePost = () => {
    const isSlideshow = !generatedVideo?.startsWith('data:video') && !generatedVideo?.endsWith('.mp4');
    onPostToFeed({
      id: Date.now().toString(),
      title: `Live Demo: ${selectedProducts.map(p => p.title).join(', ')}`,
      content: script,
      keywords: ['livestream', 'demo', ...selectedProducts.map(p => p.category)],
      generatedImages: isSlideshow ? selectedProducts.map(p => p.image) : (kolAvatar ? [kolAvatar] : []),
      generatedVideo: isSlideshow ? undefined : generatedVideo,
      status: 'PUBLISHED',
      platform: 'BLOG',
      createdAt: new Date().toISOString(),
      relatedProductId: selectedProducts[0]?.id
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[#1a1d21] w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-800 animate-in zoom-in-95 duration-200">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-[#131518] p-6 flex flex-col gap-2 border-r border-gray-800">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-6 flex items-center gap-2">
            <Sparkles className="text-purple-500" /> KOL Studio
          </h2>
          
          <button 
            onClick={() => setActiveTab('KOL')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${activeTab === 'KOL' ? 'bg-purple-600/20 text-purple-400 border border-purple-600/50' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <User size={18} />
            <span className="font-medium">1. Tạo Nhân Vật</span>
          </button>

          <button 
            onClick={() => setActiveTab('PRODUCT')}
            disabled={!kolAvatar}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${activeTab === 'PRODUCT' ? 'bg-blue-600/20 text-blue-400 border border-blue-600/50' : 'text-gray-400 hover:bg-white/5 disabled:opacity-50'}`}
          >
            <Wand2 size={18} />
            <span className="font-medium">2. Kịch Bản & Demo</span>
          </button>

          <button 
            onClick={() => setActiveTab('PREVIEW')}
            disabled={!generatedVideo}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${activeTab === 'PREVIEW' ? 'bg-green-600/20 text-green-400 border border-green-600/50' : 'text-gray-400 hover:bg-white/5 disabled:opacity-50'}`}
          >
            <Film size={18} />
            <span className="font-medium">3. Xem & Đăng</span>
          </button>

          <button 
            onClick={() => setActiveTab('LIBRARY')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${activeTab === 'LIBRARY' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/50' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <Library size={18} />
            <span className="font-medium">Thư viện</span>
          </button>

          <button 
            onClick={() => setIsKnowledgeBaseOpen(true)}
            className="flex items-center gap-3 p-3 rounded-xl transition-all text-left text-gray-400 hover:bg-white/5 mt-auto"
          >
            <Database size={18} className="text-purple-400" />
            <span className="font-medium text-purple-400">Kho Dữ Liệu AI</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#0f1113] relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 bg-black/50 p-2 rounded-full">
            <X size={20} />
          </button>

          <div className="p-8 max-w-2xl mx-auto">
            
            {/* TAB 1: KOL CREATION */}
            {activeTab === 'KOL' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Thiết kế KOL Ảo của bạn</h3>
                  <p className="text-gray-400">Tạo nhân vật đại diện độc đáo để livestream bán hàng tự động.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Tên Nhân Vật</label>
                    <input 
                      type="text" 
                      value={kolName}
                      onChange={(e) => setKolName(e.target.value)}
                      placeholder="VD: Sarah, Minh Anh..."
                      className="w-full bg-[#23262a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Phong cách & Cá tính</label>
                    <textarea 
                      value={kolStyle}
                      onChange={(e) => setKolStyle(e.target.value)}
                      placeholder="Mô tả phong cách (VD: Năng động, Gen Z, chuyên nghiệp, giọng nói ấm áp...)"
                      className="w-full bg-[#23262a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none"
                    />
                    
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">Gợi ý phong cách nghề nghiệp:</p>
                      <div className="flex flex-wrap gap-2">
                        {professionalStyles.map((style) => (
                          <button
                            key={style.label}
                            onClick={() => setKolStyle(style.value)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                              kolStyle === style.value 
                                ? 'bg-purple-600/20 border-purple-500 text-purple-400' 
                                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                            }`}
                          >
                            {style.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Tư thế & Hành động (Tùy chọn)</label>
                    <div className="flex flex-wrap gap-2">
                      {poseTemplates.map((pose) => (
                        <button
                          key={pose.label}
                          onClick={() => {
                            if (selectedPoses.includes(pose.value)) {
                              setSelectedPoses(selectedPoses.filter(p => p !== pose.value));
                            } else {
                              if (selectedPoses.length < 5) {
                                setSelectedPoses([...selectedPoses, pose.value]);
                              }
                            }
                          }}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                            selectedPoses.includes(pose.value) 
                              ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          {pose.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 italic">
                      * Chọn tối đa 5 tư thế. Nếu không chọn, AI sẽ tự động tạo các tư thế mặc định.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Góc Máy & Kỹ Thuật (24 Góc)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {cameraAngleTemplates.map((angle) => (
                        <button
                          key={angle.label}
                          onClick={() => setSelectedCameraAngle(angle.value)}
                          className={`text-[10px] px-2 py-2 rounded-lg border transition-all text-center leading-tight ${
                            selectedCameraAngle === angle.value 
                              ? 'bg-orange-600/20 border-orange-500 text-orange-400' 
                              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          {angle.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={handleGenerateAvatar}
                      disabled={isLoading || !kolName}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                      Tạo Hình Ảnh KOL (AI)
                    </button>
                    <button 
                      onClick={() => document.getElementById('kol-avatar-upload')?.click()}
                      className="flex-1 bg-[#23262a] border border-gray-700 hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                    >
                      <Upload size={18} />
                      Tải ảnh lên
                    </button>
                    <input 
                      id="kol-avatar-upload"
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setKolGallery([reader.result as string]);
                            setSelectedAvatarIndex(0);
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </div>
                  <p className="text-center text-xs text-gray-500 mt-2">
                    Bạn có thể tải lên ảnh nhân vật có sẵn để tái sử dụng làm KOL mà không cần tạo mới bằng AI.
                  </p>
                </div>

                {kolGallery.length > 0 && kolAvatar && (
                  <div className="mt-8 bg-[#1a1d21] p-4 rounded-2xl border border-gray-800">
                    <h4 className="text-white font-bold mb-4 flex items-center gap-2"><User size={16}/> Kết quả:</h4>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Main Avatar Preview */}
                      <div className="aspect-[9/16] w-full md:w-64 shrink-0 mx-auto rounded-xl overflow-hidden shadow-2xl border border-gray-700 relative group">
                        <img src={kolAvatar} alt="Generated KOL" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                          <p className="text-white font-bold text-lg">{kolName}</p>
                          <p className="text-gray-300 text-xs">{kolStyle}</p>
                        </div>
                      </div>

                      {/* Gallery Thumbnails */}
                      {kolGallery.length > 1 && (
                        <div className="flex-1 overflow-x-auto custom-scrollbar">
                          <p className="text-xs text-gray-400 mb-2 font-medium">Chọn ảnh đại diện chính:</p>
                          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {kolGallery.map((img, idx) => (
                              <div 
                                key={idx} 
                                onClick={() => setSelectedAvatarIndex(idx)}
                                className={`aspect-[9/16] w-24 md:w-full shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedAvatarIndex === idx ? 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'border-transparent hover:border-gray-500'}`}
                              >
                                <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                      <button 
                        onClick={() => handleSaveAsset('AVATAR', kolAvatar, kolName, kolStyle)}
                        className="bg-gray-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-600 transition-colors flex items-center gap-2"
                      >
                        <Save size={16} /> Lưu
                      </button>
                      <button 
                        onClick={() => setActiveTab('PRODUCT')}
                        className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                      >
                        Tiếp tục <Play size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PRODUCT & SCRIPT */}
            {activeTab === 'PRODUCT' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Phối đồ & Kịch bản</h3>
                  <p className="text-gray-400">Chọn trang phục/sản phẩm để KOL mặc và tạo kịch bản.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Selection & Outfit */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-gray-300">Sản phẩm / Trang phục ({selectedProducts.length})</label>
                      <div className="flex gap-2">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                        >
                            <Upload size={12} /> Upload
                        </button>
                        <button 
                            onClick={() => setIsKnowledgeBaseOpen(true)}
                            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                        >
                            <Database size={12} /> Từ Kho Dữ Liệu
                        </button>
                        <button 
                            onClick={() => setShowProductSelector(true)}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                            <Package size={12} /> Chọn từ kho
                        </button>
                      </div>
                    </div>

                    {/* Selected Products List */}
                    <div className="bg-[#23262a] border border-gray-700 rounded-xl p-4 h-48 overflow-y-auto space-y-2">
                        {selectedProducts.length > 0 ? (
                            selectedProducts.map((p, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-black/20 p-2 rounded-lg group">
                                    <img src={p.image} className="w-10 h-10 rounded object-cover bg-white" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{p.title}</p>
                                    </div>
                                    <button onClick={() => handleRemoveProduct(p.id)} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <X size={16} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm italic">
                                <Shirt size={24} className="mb-2 opacity-50" />
                                Chưa chọn sản phẩm nào...
                            </div>
                        )}
                    </div>
                    
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleProductUpload} accept="image/*" />

                    {/* Generate Outfit Button */}
                    <button 
                      onClick={handleGenerateOutfit}
                      disabled={isLoading || selectedProducts.length === 0}
                      className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-300 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Shirt size={18} />}
                      Mặc thử lên KOL (AI Outfit)
                    </button>
                  </div>

                  {/* Script Gen */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Bối cảnh / Sân khấu</label>
                      <select 
                        value={stageStyle}
                        className="w-full bg-[#23262a] border border-gray-700 rounded-xl px-4 py-3 text-white outline-none"
                        onChange={(e) => setStageStyle(e.target.value)}
                      >
                        <option value="Professional Studio">Studio Chuyên Nghiệp</option>
                        <option value="Fashion Runway">Sàn Diễn Thời Trang (Runway)</option>
                        <option value="Cozy Living Room">Phòng Khách Ấm Cúng</option>
                        <option value="Outdoor Park">Công Viên Ngoài Trời</option>
                        <option value="Futuristic Stage">Sân Khấu Tương Lai</option>
                      </select>
                    </div>

                    <div className="bg-[#23262a] border border-gray-700 rounded-xl p-4 h-48 overflow-y-auto">
                      {script ? (
                        <p className="text-gray-300 whitespace-pre-wrap text-sm">{script}</p>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">
                          Chưa có kịch bản...
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={handleGenerateScript}
                      disabled={isLoading || selectedProducts.length === 0}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Mic size={18} />}
                      Viết Kịch Bản AI
                    </button>
                  </div>
                </div>
                
                {/* Product Selector Modal (Overlay) */}
                {showProductSelector && (
                    <div className="absolute inset-0 z-20 bg-[#1a1d21] p-6 animate-in slide-in-from-bottom-10">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-white font-bold text-lg">Kho hàng của bạn</h4>
                          <button onClick={() => setShowProductSelector(false)} className="bg-gray-800 p-2 rounded-full hover:bg-gray-700"><X size={20} className="text-white"/></button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 overflow-y-auto h-[calc(100%-60px)] pb-4">
                          {safeProducts.length > 0 ? (
                            safeProducts.map(p => {
                                const isSelected = selectedProducts.some(sp => sp.id === p.id);
                                return (
                                    <div 
                                        key={p.id} 
                                        onClick={() => handleSelectProduct(p)}
                                        className={`flex flex-col gap-2 p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-blue-600/20 border-blue-500' : 'bg-[#23262a] border-transparent hover:border-gray-600'}`}
                                    >
                                        <img src={p.image} className="w-full aspect-square rounded-lg object-cover bg-white" />
                                        <div>
                                            <p className="text-white text-sm font-medium truncate">{p.title}</p>
                                            <p className="text-gray-500 text-xs">${p.price}</p>
                                        </div>
                                        {isSelected && <div className="mt-1 text-xs text-blue-400 font-bold flex items-center gap-1"><Sparkles size={10}/> Đã chọn</div>}
                                    </div>
                                );
                            })
                          ) : (
                            <p className="text-gray-500 text-center col-span-2 py-10">Chưa có sản phẩm nào trong kho.</p>
                          )}
                        </div>
                    </div>
                )}

                <div className="pt-6 border-t border-gray-800">
                  <div className="mb-4 flex items-center justify-between bg-[#23262a] p-3 rounded-xl border border-gray-700">
                    <span className="text-sm font-medium text-gray-300">Tốc độ Slideshow:</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSlideshowSpeed(15)}
                        className={`px-3 py-1 text-xs rounded-lg font-bold transition-colors ${slideshowSpeed === 15 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                      >
                        Chậm (15s)
                      </button>
                      <button 
                        onClick={() => setSlideshowSpeed(10)}
                        className={`px-3 py-1 text-xs rounded-lg font-bold transition-colors ${slideshowSpeed === 10 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                      >
                        Vừa (10s)
                      </button>
                      <button 
                        onClick={() => setSlideshowSpeed(5)}
                        className={`px-3 py-1 text-xs rounded-lg font-bold transition-colors ${slideshowSpeed === 5 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                      >
                        Nhanh (5s)
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={handleGenerateVideo}
                      disabled={isLoading || !script || selectedProducts.length === 0}
                      className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 className="animate-spin" /> : <Video />}
                      Tạo Video (AI)
                    </button>
                    <button 
                      onClick={() => {
                        if (selectedProducts.length === 0) return;
                        setIsLoading(true);
                        // Simulate creating a slideshow from product images
                        setTimeout(() => {
                          // In a real app, this would use a canvas to draw images and export as a video blob
                          // For demo, we just use the first product image as a static "video" placeholder
                          // or a simple CSS animation in the preview
                          setGeneratedVideo(selectedProducts[0].image);
                          setActiveTab('PREVIEW');
                          setIsLoading(false);
                        }, 1500);
                      }}
                      disabled={isLoading || selectedProducts.length === 0}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 className="animate-spin" /> : <Image />}
                      Tạo Slideshow (Miễn phí)
                    </button>
                    <button 
                      onClick={() => document.getElementById('kol-video-upload')?.click()}
                      className="flex-1 bg-[#23262a] border border-gray-700 hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                    >
                      <Upload size={18} />
                      Tải video lên
                    </button>
                    <input 
                      id="kol-video-upload"
                      type="file" 
                      accept="video/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setGeneratedVideo(reader.result as string);
                            setActiveTab('PREVIEW');
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </div>
                  <p className="text-center text-xs text-gray-500 mt-3">
                    💡 <strong>Mẹo tiết kiệm:</strong> Tạo Slideshow từ ảnh sản phẩm hoặc tải lên video có sẵn để không tốn phí tạo AI.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: PREVIEW */}
            {activeTab === 'PREVIEW' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in text-center">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Xem trước & Đăng tải</h3>
                  <p className="text-gray-400">Video livestream demo của bạn đã sẵn sàng!</p>
                </div>

                {generatedVideo ? (
                  <div className="aspect-[9/16] max-w-xs mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-700 relative">
                    {generatedVideo.startsWith('data:video') || generatedVideo.endsWith('.mp4') ? (
                      <video src={generatedVideo} controls autoPlay loop className="w-full h-full object-cover" />
                    ) : (
                      // Slideshow preview (CSS animation)
                      <div className="w-full h-full relative overflow-hidden">
                        <div 
                          className="absolute inset-0 flex"
                          style={{ animation: `slide ${slideshowSpeed}s infinite alternate` }}
                        >
                          {selectedProducts.map((p, i) => (
                            <img key={i} src={p.image} className="w-full h-full object-cover shrink-0" />
                          ))}
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 bg-black/60 p-3 rounded-lg backdrop-blur-sm">
                          <p className="text-white text-sm font-bold truncate">{selectedProducts[0]?.title}</p>
                          <p className="text-[#febd69] text-xs">Slideshow tự động ({slideshowSpeed}s)</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[9/16] max-w-xs mx-auto bg-[#23262a] rounded-2xl flex items-center justify-center border border-gray-700">
                    <p className="text-gray-500">Đang chờ video...</p>
                  </div>
                )}

                <div className="flex gap-4 justify-center mt-8">
                  <button 
                    onClick={() => setActiveTab('PRODUCT')}
                    className="px-6 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-white/5 font-medium"
                  >
                    Chỉnh sửa lại
                  </button>
                  <button 
                    onClick={() => handleSaveAsset('VIDEO', generatedVideo!, `Demo: ${selectedProducts.map(p => p.title).join(', ')}`)}
                    className="px-6 py-3 rounded-xl bg-gray-700 text-white font-bold hover:bg-gray-600 flex items-center gap-2"
                  >
                    <Save size={18} /> Lưu Video
                  </button>
                  <button 
                    onClick={handlePost}
                    className="px-8 py-3 rounded-xl bg-[#febd69] text-black font-bold hover:bg-[#f3a847] shadow-lg flex items-center gap-2"
                  >
                    <Share2 size={18} /> Đăng lên Cộng đồng
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: LIBRARY */}
            {activeTab === 'LIBRARY' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Thư viện của bạn</h3>
                  <p className="text-gray-400">Quản lý các KOL và Video đã tạo.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Avatars */}
                  <div>
                    <h4 className="text-white font-bold mb-4 flex items-center gap-2"><User size={16}/> KOL Avatars</h4>
                    <div className="space-y-3">
                      {savedAssets.filter(a => a.type === 'AVATAR').length > 0 ? (
                        savedAssets.filter(a => a.type === 'AVATAR').map(asset => (
                          <div key={asset.id} className="bg-[#23262a] p-3 rounded-xl flex gap-3 group relative border border-gray-700 hover:border-gray-500 transition-colors">
                            <img src={asset.url} className="w-16 h-24 object-cover rounded-lg bg-black" />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-bold truncate">{asset.name}</p>
                              <p className="text-gray-500 text-xs truncate">{asset.metadata}</p>
                              <p className="text-gray-600 text-xs mt-1">{new Date(asset.createdAt).toLocaleDateString()}</p>
                              
                              <div className="flex gap-2 mt-2">
                                <button 
                                  onClick={() => handleRestoreAsset(asset)}
                                  className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-600/30"
                                >
                                  Sử dụng
                                </button>
                                <button 
                                  onClick={() => handleDeleteAsset(asset.id)}
                                  className="text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded hover:bg-red-600/30"
                                >
                                  Xóa
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm italic">Chưa có KOL nào được lưu.</p>
                      )}
                    </div>
                  </div>

                  {/* Videos */}
                  <div>
                    <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Video size={16}/> Videos Demo</h4>
                    <div className="space-y-3">
                      {savedAssets.filter(a => a.type === 'VIDEO').length > 0 ? (
                        savedAssets.filter(a => a.type === 'VIDEO').map(asset => (
                          <div key={asset.id} className="bg-[#23262a] p-3 rounded-xl flex gap-3 group relative border border-gray-700 hover:border-gray-500 transition-colors">
                            <video src={asset.url} className="w-16 h-24 object-cover rounded-lg bg-black" />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-bold truncate">{asset.name}</p>
                              <p className="text-gray-600 text-xs mt-1">{new Date(asset.createdAt).toLocaleDateString()}</p>
                              
                              <div className="flex gap-2 mt-2">
                                <button 
                                  onClick={() => handleRestoreAsset(asset)}
                                  className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded hover:bg-green-600/30"
                                >
                                  Xem lại
                                </button>
                                <button 
                                  onClick={() => handleDeleteAsset(asset.id)}
                                  className="text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded hover:bg-red-600/30"
                                >
                                  Xóa
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm italic">Chưa có video nào được lưu.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      
      <KnowledgeBaseManager 
        isOpen={isKnowledgeBaseOpen} 
        onClose={() => setIsKnowledgeBaseOpen(false)} 
        currentUser={user}
        onSelectImage={(imageUrl, title) => {
          const newProduct: Product = {
            id: `kb-${Date.now()}`,
            title: title || 'Sản phẩm từ Kho',
            description: '',
            price: 0,
            image: imageUrl,
            category: 'Custom',
            type: 'FIXED_PRICE' as any,
            rating: 0,
            reviewCount: 0,
            status: 'AVAILABLE' as any,
            sellerId: user?.id || 'me'
          };
          setSelectedProducts([...selectedProducts, newProduct]);
          setIsKnowledgeBaseOpen(false);
        }}
        onSelectVideo={(videoUrl) => {
          setGeneratedVideo(videoUrl);
          setIsKnowledgeBaseOpen(false);
          setActiveTab('PREVIEW');
        }}
      />
    </div>
  );
};

export default KOLStreamStudio;
