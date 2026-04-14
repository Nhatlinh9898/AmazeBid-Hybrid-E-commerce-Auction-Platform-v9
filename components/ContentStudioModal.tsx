
import React, { useState } from 'react';
import { X, PenTool, Image as ImageIcon, Video, Share2, Sparkles, LayoutTemplate, Save, Download, ChevronRight, Wand2, CheckCircle2, ShoppingBag, Plus, RefreshCw, RotateCcw, Tag, Upload, Link2, Database } from 'lucide-react';
import { generateSEOContent, generateProductImage, generateProductVideo, generateKeywordSuggestions, generateProductTags } from '../services/geminiService';
import { ContentPost, Product, KnowledgeItem } from '../types';
import { KnowledgeBaseManager } from './KnowledgeBaseManager';

interface ContentStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  myProducts: Product[];
  onSavePost: (post: ContentPost) => void;
}

const ContentStudioModal: React.FC<ContentStudioModalProps> = ({ isOpen, onClose, myProducts, onSavePost }) => {
  const [step, setStep] = useState(1);
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('Chuyên nghiệp & Tin cậy');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [imagePrompt, setImagePrompt] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [isProductListOpen, setIsProductListOpen] = useState(false);
  const [isKnowledgeBaseOpen, setIsKnowledgeBaseOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

  const resetForm = () => {
      setStep(1);
      setProductName('');
      setDescription('');
      setKeywords('');
      setSuggestedKeywords([]);
      setTags([]);
      setGeneratedContent('');
      setGeneratedImages([]);
      setGeneratedVideo(null);
      setSelectedProduct(null);
      setImagePrompt('');
      setVideoPrompt('');
  };

  const handleSelectProduct = (product: Product) => {
      setSelectedProduct(product);
      setProductName(product.title);
      setDescription(product.description);
      setIsProductListOpen(false);
  };

  const handleGenerateKeywords = async () => {
      setIsGeneratingKeywords(true);
      try {
          const kws = await generateKeywordSuggestions(productName);
          setSuggestedKeywords(kws);
      } catch {
          alert("Lỗi gợi ý từ khóa.");
      } finally {
          setIsGeneratingKeywords(false);
      }
  };

  const toggleKeyword = (kw: string) => {
      setKeywords(prev => {
          const list = prev.split(',').map(k => k.trim()).filter(k => k);
          if (list.includes(kw)) {
              return list.filter(k => k !== kw).join(', ');
          } else {
              return [...list, kw].join(', ');
          }
      });
  };

  const handleGenerateTags = async () => {
      setIsGeneratingTags(true);
      try {
          const tgs = await generateProductTags(productName, description);
          setTags(tgs);
      } catch {
          alert("Lỗi tạo thẻ.");
      } finally {
          setIsGeneratingTags(false);
      }
  };

  const toggleTag = (tag: string) => {
      setTags(prev => prev.filter(t => t !== tag));
  };

  const handleGenerateText = async () => {
      setIsLoading(true);
      try {
          // Fetch knowledge base items for context
          let knowledgeContext = '';
          try {
              const savedKb = localStorage.getItem('ai_knowledge_base');
              if (savedKb) {
                  const kbItems: KnowledgeItem[] = JSON.parse(savedKb);
                  const relevantItems = kbItems.filter(item => 
                      (item.type === 'TEXT' || item.type === 'SPEC' || item.type === 'INSTRUCTION') && 
                      (
                          item.title.toLowerCase().includes(productName.toLowerCase()) || 
                          item.tags.some(t => productName.toLowerCase().includes(t.toLowerCase())) ||
                          (selectedProduct && item.title.toLowerCase().includes(selectedProduct.title.toLowerCase()))
                      )
                  );
                  if (relevantItems.length > 0) {
                      knowledgeContext = relevantItems.map(item => `[${item.type} - ${item.title}]: ${item.content}`).join('\n\n');
                  }
              }
          } catch (e) {
              console.error("Failed to load knowledge base", e);
          }

          const content = await generateSEOContent(productName, keywords, tone, knowledgeContext);
          setGeneratedContent(content);
          setStep(2);
      } catch {
          alert("Lỗi tạo nội dung.");
      } finally {
          setIsLoading(false);
      }
  };

  if (!isOpen) return null;

  const handleGenerateImage = async () => {
      setIsLoading(true);
      try {
          const imgData = await generateProductImage(imagePrompt);
          if (imgData) {
              setGeneratedImages(prev => [...prev, imgData]);
          }
      } catch {
          alert("Lỗi tạo ảnh. (Lưu ý: Tính năng này cần API Key có quyền Imagen)");
      } finally {
          setIsLoading(false);
      }
  };

  const handleGenerateVideo = async () => {
      setIsLoading(true);
      try {
          const videoUrl = await generateProductVideo(videoPrompt);
          if (videoUrl) {
              setGeneratedVideo(videoUrl);
          }
      } catch {
          alert("Lỗi tạo video. (Lưu ý: Tính năng này cần API Key có quyền Veo và cần người dùng tự chọn key trong môi trường thực tế)");
      } finally {
          setIsLoading(false);
      }
  };

  const handlePublish = () => {
      if (onSavePost) {
          const newPost: ContentPost = {
              id: `post_${Date.now()}`,
              title: productName,
              content: generatedContent,
              keywords: keywords.split(',').map(k => k.trim()),
              generatedImages: generatedImages,
              generatedVideo: generatedVideo || undefined,
              status: 'PUBLISHED',
              platform: 'BLOG',
              createdAt: new Date().toISOString()
          };
          onSavePost(newPost);
      }
      setStep(5); // Go to Success Step
  };

  // --- Render Steps ---

  const renderStep1_Info = () => (
      <div className="space-y-6 animate-in slide-in-from-right relative h-full flex flex-col">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
              <Sparkles className="text-blue-600 shrink-0" />
              <div>
                  <h3 className="font-bold text-blue-800">Bắt đầu ý tưởng</h3>
                  <p className="text-sm text-blue-700">Chọn sản phẩm từ kho của bạn hoặc nhập chủ đề mới để AI viết bài chuẩn SEO.</p>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Sản phẩm / Chủ đề</label>
                <div className="flex gap-2">
                    <input 
                        value={productName}
                        onChange={e => setProductName(e.target.value)}
                        placeholder="VD: iPhone 15 Pro Max..."
                        className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:border-[#febd69] outline-none font-medium"
                    />
                    <button 
                        onClick={() => setIsProductListOpen(!isProductListOpen)}
                        className="px-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-sm text-gray-700 flex items-center gap-2 whitespace-nowrap"
                    >
                        <ShoppingBag size={18}/> Chọn từ kho
                    </button>
                    <button 
                        onClick={() => setIsKnowledgeBaseOpen(true)}
                        className="px-4 bg-purple-100 hover:bg-purple-200 rounded-xl font-bold text-sm text-purple-700 flex items-center gap-2 whitespace-nowrap"
                        title="Kho Dữ Liệu AI"
                    >
                        <Database size={18}/> Kho AI
                    </button>
                </div>
                
                {/* Product Select Dropdown */}
                {isProductListOpen && (
                    <div className="mt-2 border border-gray-200 rounded-xl shadow-lg bg-white max-h-60 overflow-y-auto absolute z-50 w-full left-0 right-0 max-w-2xl mx-auto">
                        {myProducts.length === 0 ? (
                            <p className="p-4 text-center text-gray-400 text-sm">Kho hàng trống.</p>
                        ) : (
                            myProducts.map(p => (
                                <div 
                                    key={p.id} 
                                    onClick={() => handleSelectProduct(p)}
                                    className="p-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-gray-100"
                                >
                                    <img src={p.image} className="w-10 h-10 rounded object-cover bg-gray-100"/>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-gray-800">{p.title}</p>
                                        <p className="text-xs text-gray-500 truncate">{p.description}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-700">Từ khóa SEO</label>
                    <button 
                        onClick={handleGenerateKeywords}
                        disabled={!productName || isGeneratingKeywords}
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                        <Wand2 size={12}/> {isGeneratingKeywords ? 'Đang phân tích...' : 'Gợi ý từ khóa AI'}
                    </button>
                </div>
                
                <input 
                    value={keywords}
                    onChange={e => setKeywords(e.target.value)}
                    placeholder="VD: giá rẻ, chính hãng, review chi tiết..."
                    className="w-full p-3 border border-gray-200 rounded-xl focus:border-[#febd69] outline-none mb-3"
                />

                {/* Keyword Chips */}
                {suggestedKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        {suggestedKeywords.map((kw, idx) => {
                            const isSelected = keywords.includes(kw);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => toggleKeyword(kw)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                                        isSelected 
                                        ? 'bg-blue-100 text-blue-700 border-blue-200' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                    }`}
                                >
                                    {kw} {isSelected && <CheckCircle2 size={10} className="inline ml-1"/>}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-700">Thẻ sản phẩm (Tags)</label>
                    <button 
                        onClick={handleGenerateTags}
                        disabled={!productName || isGeneratingTags}
                        className="text-xs font-bold text-green-600 hover:underline flex items-center gap-1"
                    >
                        <Tag size={12}/> {isGeneratingTags ? 'Đang tạo...' : 'Tự động gắn thẻ AI'}
                    </button>
                </div>
                
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300 min-h-[50px]">
                    {tags.length === 0 && <p className="text-xs text-gray-400">Chưa có thẻ nào.</p>}
                    {tags.map((tag, idx) => (
                        <button
                            key={idx}
                            onClick={() => toggleTag(tag)}
                            className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-xs font-bold flex items-center gap-1"
                        >
                            #{tag} <X size={10}/>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Giọng văn (Tone of Voice)</label>
                <select 
                    value={tone}
                    onChange={e => setTone(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl bg-white outline-none"
                >
                    <option>Chuyên nghiệp & Tin cậy</option>
                    <option>Hài hước & Thân thiện</option>
                    <option>Sang trọng & Đẳng cấp</option>
                    <option>Ngắn gọn & Súc tích</option>
                </select>
            </div>
          </div>

          <button 
            onClick={handleGenerateText}
            disabled={!productName || isLoading}
            className="w-full bg-[#131921] text-white py-4 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-auto"
          >
              {isLoading ? <Wand2 className="animate-spin"/> : <PenTool size={20}/>}
              {isLoading ? 'AI Đang Viết...' : 'Tạo Bài Viết Ngay'}
          </button>
      </div>
  );

  const insertLink = (type: 'product' | 'system' | 'affiliate') => {
      let linkText = '';
      if (type === 'product') {
          const productId = selectedProduct ? selectedProduct.id : 'ID_SAN_PHAM';
          linkText = `\n\n🛒 Mua ngay sản phẩm tại đây: https://amazebid.com/product/${productId}`;
      } else if (type === 'system') {
          linkText = `\n\n🌐 Khám phá thêm tại hệ thống AmazeBid: https://amazebid.com`;
      } else if (type === 'affiliate') {
          linkText = `\n\n💰 Đăng ký Affiliate để nhận hoa hồng: https://amazebid.com/affiliate?ref=YOUR_CODE`;
      }
      
      if (linkText) {
          setGeneratedContent(prev => prev + linkText);
      }
  };

  const renderStep2_Text = () => (
      <div className="flex flex-col h-full animate-in slide-in-from-right">
          <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Nội dung SEO (Bản nháp)</h3>
              <button onClick={() => setStep(3)} className="bg-[#febd69] px-4 py-2 rounded-lg font-bold text-sm">Tiếp theo: Hình ảnh</button>
          </div>
          <textarea 
            value={generatedContent}
            onChange={e => setGeneratedContent(e.target.value)}
            className="flex-1 w-full p-6 bg-gray-50 border border-gray-200 rounded-xl resize-none outline-none focus:bg-white transition-colors font-serif text-lg leading-relaxed shadow-inner"
          />
          
          {/* Link Insertion Toolbar */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 border-b border-gray-100 mb-2">
               <span className="text-xs font-bold text-blue-600 flex items-center gap-1 uppercase"><Link2 size={14}/> Chèn Link Nhanh:</span>
               <button onClick={() => insertLink('product')} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold hover:bg-blue-100 whitespace-nowrap">
                   + Link Sản phẩm
               </button>
               <button onClick={() => insertLink('system')} className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold hover:bg-green-100 whitespace-nowrap">
                   + Link Hệ thống
               </button>
               <button onClick={() => insertLink('affiliate')} className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-bold hover:bg-purple-100 whitespace-nowrap">
                   + Link Affiliate
               </button>
          </div>

          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
               <span className="text-xs font-bold text-gray-400 uppercase">Gợi ý chỉnh sửa:</span>
               {['Thêm Emoji', 'Viết dài hơn', 'Tóm tắt lại', 'Thêm thông số kỹ thuật'].map(act => (
                   <button key={act} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium hover:bg-gray-200 whitespace-nowrap">
                       {act}
                   </button>
               ))}
          </div>
      </div>
  );

  const renderStep3_Visuals = () => (
      <div className="h-full overflow-y-auto custom-scrollbar space-y-8 animate-in slide-in-from-right pr-2">
          {/* Image Section */}
          <div>
              <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                  <ImageIcon className="text-blue-600"/> Studio Hình ảnh (Imagen 3)
              </h3>
              
              {selectedProduct && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-gray-300">
                          <img src={selectedProduct.image} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                          <h4 className="font-bold text-sm text-gray-800">Ảnh gốc sản phẩm</h4>
                          <p className="text-xs text-gray-500 mb-2">Sử dụng AI để sáng tạo lại hình ảnh này với phong cách chuyên nghiệp hơn.</p>
                          <div className="flex gap-2">
                            <button 
                                onClick={() => setImagePrompt(`Creative product photography of ${productName}, luxury studio lighting, 8k resolution, cinematic, showing details of ${description.slice(0, 50)}...`)}
                                className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-100 flex items-center gap-1"
                            >
                                <Sparkles size={12} className="text-[#febd69]"/> Tạo Prompt "Re-imagine"
                            </button>
                            <button 
                                onClick={() => {
                                    // Giả định chuyển đổi ảnh sản phẩm sang base64 để gửi đi
                                    // Trong thực tế cần hàm chuyển đổi ảnh từ URL sang base64
                                    alert("Tính năng này cần chuyển đổi ảnh sang base64 trước.");
                                }}
                                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-green-700 flex items-center gap-1"
                            >
                                <Upload size={12}/> Cải thiện ảnh gốc (Studio)
                            </button>
                          </div>
                      </div>
                  </div>
              )}

              <div className="flex gap-2 mb-4">
                  <input 
                    value={imagePrompt}
                    onChange={e => setImagePrompt(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Mô tả hình ảnh bạn muốn tạo..."
                  />
                  <button 
                    onClick={handleGenerateImage}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-4 rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                      {isLoading ? '...' : 'Tạo Ảnh'}
                  </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {generatedImages.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                          <img src={img} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button className="p-2 bg-white rounded-full hover:bg-gray-100"><Download size={16}/></button>
                          </div>
                      </div>
                  ))}
                  {generatedImages.length === 0 && (
                      <div className="col-span-full h-32 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                          Chưa có hình ảnh nào được tạo.
                      </div>
                  )}
              </div>
          </div>

          <div className="border-t border-gray-200 my-4"/>

          {/* Video Section */}
          <div>
              <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                  <Video className="text-red-600"/> Studio Video (Veo)
              </h3>
              <div className="bg-orange-50 p-3 rounded-lg text-xs text-orange-800 mb-4 flex items-center gap-2">
                  <Wand2 size={14}/> Video được tạo bởi mô hình Veo mới nhất. Quá trình có thể mất 1-2 phút.
              </div>
              <div className="flex gap-2 mb-4">
                  <input 
                    value={videoPrompt}
                    onChange={e => setVideoPrompt(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Mô tả video quảng cáo..."
                  />
                  <button 
                     onClick={handleGenerateVideo}
                     disabled={isLoading}
                     className="bg-red-600 text-white px-4 rounded-lg font-bold text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                      {isLoading ? 'Đang render...' : 'Tạo Video'}
                  </button>
              </div>

              {generatedVideo ? (
                  <div className="rounded-xl overflow-hidden bg-black aspect-video relative shadow-lg">
                      <video src={generatedVideo} controls className="w-full h-full" />
                  </div>
              ) : (
                  <div className="h-48 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm flex-col gap-2">
                      <Video size={32} className="opacity-20"/>
                      <span>Khu vực hiển thị Video Preview</span>
                  </div>
              )}
          </div>

          <div className="pt-4 flex justify-end">
              <button onClick={() => setStep(4)} className="bg-[#131921] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                  Xem bản hoàn chỉnh <ChevronRight size={18}/>
              </button>
          </div>
      </div>
  );

  const renderStep4_Review = () => (
      <div className="h-full flex flex-col animate-in slide-in-from-right">
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 p-6 rounded-xl border border-gray-200 mb-4">
              {/* Blog Post Preview UI */}
              <article className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm">
                  <h1 className="text-3xl font-black text-gray-900 mb-4 leading-tight">{productName}</h1>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
                      <img src="https://ui-avatars.com/api/?name=Admin&background=random" className="w-6 h-6 rounded-full"/>
                      <span>Bởi <strong>Content AI</strong></span>
                      <span>•</span>
                      <span>{new Date().toLocaleDateString()}</span>
                  </div>

                  {generatedVideo && (
                      <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
                          <video src={generatedVideo} controls className="w-full" />
                      </div>
                  )}

                  {generatedImages.length > 0 && (
                      <img src={generatedImages[0]} className="w-full h-auto rounded-xl mb-8 object-cover shadow-md" alt="Main visual"/>
                  )}

                  <div className="prose prose-lg text-gray-700 whitespace-pre-wrap font-serif">
                      {generatedContent}
                  </div>

                  {generatedImages.length > 1 && (
                      <div className="grid grid-cols-2 gap-4 mt-8">
                          {generatedImages.slice(1).map((img, i) => (
                              <img key={i} src={img} className="rounded-lg shadow-sm w-full h-32 object-cover"/>
                          ))}
                      </div>
                  )}
              </article>
          </div>

          <div className="flex justify-between items-center border-t border-gray-100 pt-4">
               <button onClick={() => setStep(3)} className="text-gray-500 font-bold hover:text-black">Quay lại</button>
               <div className="flex gap-3">
                   <button className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-xl font-bold hover:bg-gray-50">
                       <Save size={18}/> Lưu nháp
                   </button>
                   <button 
                    onClick={handlePublish}
                    className="flex items-center gap-2 px-6 py-3 bg-[#febd69] text-black rounded-xl font-bold hover:bg-[#f3a847] shadow-lg"
                   >
                       <Share2 size={18}/> Đăng & Chia sẻ
                   </button>
               </div>
          </div>
      </div>
  );

  const renderStep5_Success = () => (
      <div className="h-full flex flex-col items-center justify-center animate-in zoom-in">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={48} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Đăng bài thành công!</h2>
          <p className="text-gray-500 mb-8 text-center max-w-md">Bài viết của bạn đã được xuất bản. Bạn có muốn tiếp tục tạo nội dung mới không?</p>
          
          <div className="flex gap-4">
              <button 
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-xl font-bold hover:bg-gray-50 text-gray-700"
              >
                  Đóng Studio
              </button>
              <button 
                onClick={resetForm}
                className="px-6 py-3 bg-[#131921] text-white rounded-xl font-bold hover:bg-black shadow-lg flex items-center gap-2"
              >
                  <RefreshCw size={18}/> Tạo bài viết mới
              </button>
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="relative bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 bg-[#131921] text-white p-6 flex flex-col shrink-0">
            <h2 className="text-2xl font-bold italic mb-8 flex items-center gap-2">
                <Wand2 className="text-[#febd69]"/> Content<span className="text-[#febd69]">Studio</span>
            </h2>
            
            <button 
                onClick={resetForm}
                className="mb-6 w-full py-2 bg-[#febd69] text-black rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#f3a847] transition-all"
            >
                <Plus size={16}/> Dự án mới
            </button>
            
            <div className="space-y-2 relative">
                {/* Step Indicators */}
                {[
                    { id: 1, label: 'Thông tin & Ý tưởng', icon: LayoutTemplate },
                    { id: 2, label: 'AI Writer', icon: PenTool },
                    { id: 3, label: 'Media (Ảnh/Video)', icon: ImageIcon },
                    { id: 4, label: 'Review & Đăng', icon: Share2 },
                    ...(step === 5 ? [{ id: 5, label: 'Hoàn tất', icon: CheckCircle2 }] : [])
                ].map((s) => (
                    <div 
                        key={s.id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${step === s.id ? 'bg-white/10 text-white font-bold' : 'text-gray-400'}`}
                    >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${step === s.id ? 'border-white' : 'border-gray-500'}`}>
                            {step > s.id ? <CheckCircle2 size={14}/> : s.id}
                        </div>
                        <span className="text-sm">{s.label}</span>
                    </div>
                ))}
            </div>

            <div className="mt-auto bg-gray-800 p-4 rounded-xl text-xs text-gray-400">
                <p className="font-bold text-white mb-1">AI Power</p>
                <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-green-500"/> Gemini 3 Pro (Text)</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-green-500"/> Imagen 3 (Image)</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-green-500"/> Veo (Video)</span>
                </div>
            </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col relative h-full">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                {step < 5 && (
                    <button 
                        onClick={resetForm} 
                        className="p-2 hover:bg-gray-100 rounded-full bg-white shadow-sm border border-gray-100 text-gray-500"
                        title="Làm mới"
                    >
                        <RotateCcw size={20}/>
                    </button>
                )}
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full bg-white shadow-sm border border-gray-100">
                    <X size={20} className="text-gray-500"/>
                </button>
            </div>

            <div className="flex-1 p-8 overflow-hidden h-full">
                {step === 1 && renderStep1_Info()}
                {step === 2 && renderStep2_Text()}
                {step === 3 && renderStep3_Visuals()}
                {step === 4 && renderStep4_Review()}
                {step === 5 && renderStep5_Success()}
            </div>
        </div>
      </div>

      <KnowledgeBaseManager 
        isOpen={isKnowledgeBaseOpen} 
        onClose={() => setIsKnowledgeBaseOpen(false)} 
        currentUser={user}
        onSelectImage={(imageUrl, title) => {
            setImagePrompt(`Professional product photography of ${title}, high quality, studio lighting`);
            setIsKnowledgeBaseOpen(false);
            setStep(3);
        }}
        onSelectVideo={(videoUrl) => {
            setGeneratedVideo(videoUrl);
            setIsKnowledgeBaseOpen(false);
            setStep(3);
        }}
      />
    </div>
  );
};

export default ContentStudioModal;
