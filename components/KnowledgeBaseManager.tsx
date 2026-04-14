import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Image as ImageIcon, FileText, Trash2, Search, Tag, Database, Upload, Video, Settings, BookOpen, Info, ShieldCheck } from 'lucide-react';
import { KnowledgeItem, User } from '../types';
import { db, auth } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDocFromServer } from 'firebase/firestore';

interface KnowledgeBaseManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage?: (imageUrl: string, title: string) => void;
  onSelectVideo?: (videoUrl: string, title: string) => void;
  currentUser?: User | null;
}

export const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({ isOpen, onClose, onSelectImage, onSelectVideo, currentUser }) => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'SPEC' | 'INSTRUCTION'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [newItemType, setNewItemType] = useState<'TEXT' | 'IMAGE' | 'VIDEO' | 'SPEC' | 'INSTRUCTION'>('TEXT');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemContent, setNewItemContent] = useState('');
  const [newItemTags, setNewItemTags] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.email === 'Nhatlinhckm2016@gmail.com';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Test Firestore Connection
  useEffect(() => {
    if (!db) return;
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  }, []);

  // Real-time sync with Firestore
  useEffect(() => {
    if (!db || !isOpen) return;

    const q = query(collection(db, 'knowledge_base'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newItems = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as KnowledgeItem[];
      setItems(newItems);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore sync error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddItem = async () => {
    if (!newItemTitle || !newItemContent || !db || !auth?.currentUser) return;
    
    const tags = newItemTags.split(',').map(t => t.trim()).filter(t => t);
    
    const newItem = {
      type: newItemType,
      title: newItemTitle,
      content: newItemContent,
      tags,
      createdAt: new Date().toISOString(),
      createdBy: auth.currentUser.uid,
      creatorName: currentUser?.fullName || auth.currentUser.email || 'Anonymous'
    };

    try {
      await addDoc(collection(db, 'knowledge_base'), newItem);
      setIsAdding(false);
      setNewItemTitle('');
      setNewItemContent('');
      setNewItemTags('');
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Lỗi khi lưu dữ liệu lên Cloud. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  const handleDeleteItem = async (id: string, createdBy?: string) => {
    if (!db) return;
    
    // Security check: Only owner or admin can delete
    if (createdBy !== auth?.currentUser?.uid && !isAdmin) {
      alert("Bạn không có quyền xóa tài nguyên này.");
      return;
    }

    try {
      await deleteDoc(doc(db, 'knowledge_base', id));
    } catch (error) {
      console.error("Error deleting document: ", error);
      alert("Lỗi khi xóa tài nguyên.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItemContent(reader.result as string);
        if (!newItemTitle) {
          setNewItemTitle(file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredItems = items.filter(item => {
    if (activeTab !== 'ALL' && item.type !== activeTab) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(query) || 
             item.content.toLowerCase().includes(query) ||
             item.tags.some(t => t.toLowerCase().includes(query));
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-[#0f1115] w-full max-w-5xl h-[85vh] rounded-2xl border border-gray-800 flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#1a1d21]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
              <Database size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Kho Dữ Liệu AI (Knowledge Base)</h2>
              <p className="text-gray-400 text-sm">Cung cấp thông tin sản phẩm, bài viết mẫu để AI tham khảo khi tạo nội dung.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-gray-800/50 hover:bg-gray-700 p-2 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-800 bg-[#14171a] p-4 flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('ALL')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-3 ${activeTab === 'ALL' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <Database size={18} /> Tất cả tài nguyên
            </button>
            <button 
              onClick={() => setActiveTab('TEXT')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-3 ${activeTab === 'TEXT' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <FileText size={18} /> Nội dung bài viết
            </button>
            <button 
              onClick={() => setActiveTab('IMAGE')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-3 ${activeTab === 'IMAGE' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <ImageIcon size={18} /> Ảnh sản phẩm
            </button>
            <button 
              onClick={() => setActiveTab('VIDEO')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-3 ${activeTab === 'VIDEO' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <Video size={18} /> Video demo
            </button>
            <button 
              onClick={() => setActiveTab('SPEC')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-3 ${activeTab === 'SPEC' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <Settings size={18} /> Thông số kỹ thuật
            </button>
            <button 
              onClick={() => setActiveTab('INSTRUCTION')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-3 ${activeTab === 'INSTRUCTION' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <BookOpen size={18} /> Hướng dẫn sử dụng
            </button>

            <div className="mt-auto pt-4 border-t border-gray-800">
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Thêm tài nguyên
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col bg-[#0f1115]">
            {isAdding ? (
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="max-w-2xl mx-auto bg-[#1a1d21] p-6 rounded-2xl border border-gray-800">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Thêm tài nguyên mới</h3>
                    <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Loại tài nguyên</label>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-white cursor-pointer">
                          <input type="radio" checked={newItemType === 'TEXT'} onChange={() => setNewItemType('TEXT')} className="text-purple-500 focus:ring-purple-500" />
                          <FileText size={16} className="text-gray-400"/> Bài viết
                        </label>
                        <label className="flex items-center gap-2 text-white cursor-pointer">
                          <input type="radio" checked={newItemType === 'IMAGE'} onChange={() => setNewItemType('IMAGE')} className="text-purple-500 focus:ring-purple-500" />
                          <ImageIcon size={16} className="text-gray-400"/> Hình ảnh
                        </label>
                        <label className="flex items-center gap-2 text-white cursor-pointer">
                          <input type="radio" checked={newItemType === 'VIDEO'} onChange={() => setNewItemType('VIDEO')} className="text-purple-500 focus:ring-purple-500" />
                          <Video size={16} className="text-gray-400"/> Video
                        </label>
                        <label className="flex items-center gap-2 text-white cursor-pointer">
                          <input type="radio" checked={newItemType === 'SPEC'} onChange={() => setNewItemType('SPEC')} className="text-purple-500 focus:ring-purple-500" />
                          <Settings size={16} className="text-gray-400"/> Thông số
                        </label>
                        <label className="flex items-center gap-2 text-white cursor-pointer">
                          <input type="radio" checked={newItemType === 'INSTRUCTION'} onChange={() => setNewItemType('INSTRUCTION')} className="text-purple-500 focus:ring-purple-500" />
                          <BookOpen size={16} className="text-gray-400"/> Hướng dẫn
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Tiêu đề / Tên sản phẩm</label>
                      <input 
                        type="text" 
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        placeholder="VD: Thông tin chi tiết iPhone 15 Pro Max"
                        className="w-full bg-[#0f1115] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {newItemType === 'IMAGE' || newItemType === 'VIDEO' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                          {newItemType === 'IMAGE' ? 'Tải ảnh lên' : 'Đường dẫn Video (URL)'}
                        </label>
                        {newItemType === 'IMAGE' ? (
                          newItemContent ? (
                            <div className="relative w-40 h-40 rounded-lg overflow-hidden border border-gray-700 group">
                              <img src={newItemContent} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <button 
                                onClick={() => setNewItemContent('')}
                                className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full h-40 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-colors"
                            >
                              <Upload size={24} className="mb-2" />
                              <span>Click để chọn ảnh</span>
                            </button>
                          )
                        ) : (
                          <input 
                            type="text" 
                            value={newItemContent}
                            onChange={(e) => setNewItemContent(e.target.value)}
                            placeholder="VD: https://example.com/video.mp4"
                            className="w-full bg-[#0f1115] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                          />
                        )}
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleImageUpload} 
                          accept="image/*" 
                          className="hidden" 
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                          {newItemType === 'TEXT' ? 'Nội dung bài viết' : newItemType === 'SPEC' ? 'Thông số kỹ thuật' : 'Hướng dẫn sử dụng'}
                        </label>
                        <textarea 
                          value={newItemContent}
                          onChange={(e) => setNewItemContent(e.target.value)}
                          placeholder={
                            newItemType === 'TEXT' ? "Nhập nội dung bài viết mẫu..." : 
                            newItemType === 'SPEC' ? "VD: CPU: M3 Pro, RAM: 18GB, SSD: 512GB..." : 
                            "VD: Bước 1: Cắm điện, Bước 2: Nhấn nút nguồn..."
                          }
                          className="w-full bg-[#0f1115] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 h-40"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Tags (phân cách bằng dấu phẩy)</label>
                      <input 
                        type="text" 
                        value={newItemTags}
                        onChange={(e) => setNewItemTags(e.target.value)}
                        placeholder="VD: iphone, apple, smartphone"
                        className="w-full bg-[#0f1115] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <button 
                      onClick={handleAddItem}
                      disabled={!newItemTitle || !newItemContent}
                      className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                      Lưu vào Kho Dữ Liệu
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-800 flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm tài nguyên..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#1a1d21] border border-gray-800 rounded-full pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="text-gray-400 text-sm">
                    {filteredItems.length} tài nguyên
                  </div>
                </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <Database size={48} className="mb-4 opacity-20" />
                  <p>Chưa có tài nguyên nào trong hệ thống Cloud.</p>
                  <button onClick={() => setIsAdding(true)} className="text-purple-400 mt-2 hover:underline">Thêm tài nguyên đầu tiên</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map(item => (
                    <div key={item.id} className="bg-[#1a1d21] border border-gray-800 rounded-xl p-4 flex flex-col group hover:border-gray-600 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          {item.type === 'TEXT' && <FileText size={16} className="text-blue-400" />}
                          {item.type === 'IMAGE' && <ImageIcon size={16} className="text-green-400" />}
                          {item.type === 'VIDEO' && <Video size={16} className="text-red-400" />}
                          {item.type === 'SPEC' && <Settings size={16} className="text-orange-400" />}
                          {item.type === 'INSTRUCTION' && <BookOpen size={16} className="text-purple-400" />}
                          <h4 className="font-bold text-white line-clamp-1" title={item.title}>{item.title}</h4>
                        </div>
                        {(item.createdBy === auth?.currentUser?.uid || isAdmin) && (
                          <button 
                            onClick={() => handleDeleteItem(item.id, item.createdBy)}
                            className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      
                      {item.type === 'IMAGE' ? (
                        <div className="w-full h-32 rounded-lg overflow-hidden mb-3 bg-black">
                          <img src={item.content} alt={item.title} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      ) : item.type === 'VIDEO' ? (
                        <div className="w-full h-32 rounded-lg bg-black flex items-center justify-center mb-3">
                          <Video size={32} className="text-gray-700" />
                        </div>
                      ) : (
                        <div className="w-full h-32 rounded-lg bg-[#0f1115] p-3 mb-3 overflow-hidden">
                          <p className="text-sm text-gray-400 line-clamp-5 whitespace-pre-wrap">{item.content}</p>
                        </div>
                      )}

                      <div className="mt-auto flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag, idx) => (
                              <span key={idx} className="text-[10px] bg-gray-800 text-gray-300 px-2 py-1 rounded-full flex items-center gap-1">
                                <Tag size={10} /> {tag}
                              </span>
                            ))}
                          </div>
                          {item.createdBy === auth?.currentUser?.uid && (
                            <span className="text-[10px] text-purple-400 flex items-center gap-1">
                              <ShieldCheck size={10} /> Của bạn
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-2 mt-2">
                          {item.type === 'IMAGE' && onSelectImage && (
                            <button 
                              onClick={() => onSelectImage(item.content, item.title)}
                              className="flex-1 bg-purple-600/20 text-purple-400 font-medium py-1.5 rounded-lg hover:bg-purple-600/30 transition-colors text-sm"
                            >
                              Chọn ảnh
                            </button>
                          )}
                          {item.type === 'VIDEO' && onSelectVideo && (
                            <button 
                              onClick={() => onSelectVideo(item.content, item.title)}
                              className="flex-1 bg-red-600/20 text-red-400 font-medium py-1.5 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
                            >
                              Chọn video
                            </button>
                          )}
                          {(item.type === 'TEXT' || item.type === 'SPEC' || item.type === 'INSTRUCTION') && (
                            <div className="flex-1 text-[10px] text-gray-500 flex items-center gap-1">
                              <Info size={10} /> AI sẽ tự động tham khảo
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
