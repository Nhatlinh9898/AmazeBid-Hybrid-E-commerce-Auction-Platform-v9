import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Image as ImageIcon, FileText, Trash2, Search, Tag, Database, Upload, Video, Settings, BookOpen, Info, ShieldCheck, Link2, Monitor, Globe } from 'lucide-react';
import { KnowledgeItem, User } from '../types';
import { db, auth } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDocFromServer } from 'firebase/firestore';
import { handleFirestoreError } from '../src/services/firebaseUtils';

interface KnowledgeBaseManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage?: (imageUrl: string, title: string) => void;
  onSelectVideo?: (videoUrl: string, title: string) => void;
  currentUser?: User | null;
}

const BRIDGE_URL = 'http://localhost:3001';

export const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({ isOpen, onClose, onSelectImage, onSelectVideo, currentUser }) => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'SPEC' | 'INSTRUCTION'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBridgeOnline, setIsBridgeOnline] = useState(false);
  const [localWorkspace, setLocalWorkspace] = useState<{path: string, files: any[]} | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showWorkspaceSetup, setShowWorkspaceSetup] = useState(false);
  const [basePathInput, setBasePathInput] = useState('');
  
  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [useLocalSource, setUseLocalSource] = useState(false);
  const [newItemType, setNewItemType] = useState<'TEXT' | 'IMAGE' | 'VIDEO' | 'SPEC' | 'INSTRUCTION'>('TEXT');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemContent, setNewItemContent] = useState('');
  const [newItemTags, setNewItemTags] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.email === 'Nhatlinhckm2016@gmail.com';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check Local Bridge connectivity
  useEffect(() => {
    const checkBridge = async () => {
      try {
        const response = await fetch(BRIDGE_URL, { method: 'HEAD', mode: 'no-cors' });
        setIsBridgeOnline(true);
      } catch (e) {
        setIsBridgeOnline(false);
      }
    };
    checkBridge();
    const interval = setInterval(checkBridge, 10000); 
    return () => clearInterval(interval);
  }, []);

  // Sync Local Workspace files
  const syncLocalWorkspace = async () => {
    if (!isBridgeOnline) return;
    setIsSyncing(true);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/browse-workspace`);
      const data = await res.json();
      if (data.success) {
        setLocalWorkspace({
          path: data.workspace,
          files: data.files
        });
      }
    } catch (e) {
      console.error("Local sync failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isBridgeOnline && isOpen) {
      syncLocalWorkspace();
    }
  }, [isBridgeOnline, isOpen]);

  const handleSetupWorkspace = async () => {
    if (!basePathInput) return;
    try {
      const res = await fetch(`${BRIDGE_URL}/api/setup-workspace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basePath: basePathInput })
      });
      const data = await res.json();
      if (data.success) {
        setShowWorkspaceSetup(false);
        syncLocalWorkspace();
      }
    } catch (e) {
      alert("Lỗi kết nối Local Bridge");
    }
  };

  const handleAddLocalFileToCloud = async (file: any) => {
    if (!db || !auth?.currentUser) return;
    
    const newItem: any = {
      type: file.type || 'TEXT',
      title: file.name,
      content: file.path,
      tags: [file.category, 'local'],
      createdAt: new Date().toISOString(),
      createdBy: auth.currentUser.uid,
      creatorName: currentUser?.fullName || auth.currentUser.email || 'Anonymous',
      isLocalReference: true,
      localPath: file.path
    };

    try {
      await addDoc(collection(db, 'knowledge_base'), newItem);
    } catch (error) {
      console.error("Error adding local file to firestore:", error);
    }
  };

  // Test Firestore Connection
  useEffect(() => {
    if (!db || !currentUser || !auth) return;
    
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const testConnection = async () => {
          try {
            await getDocFromServer(doc(db, 'test', 'connection'));
            console.log("Firestore connection verified for:", firebaseUser.email);
          } catch (error) {
            if (error instanceof Error && error.message.includes('the client is offline')) {
              console.error("Please check your Firebase configuration.");
            } else {
              console.error("Firestore connectivity test failed:", error);
            }
          }
        };
        testConnection();
      }
    });

    return () => unsubscribe();
  }, [currentUser, db, auth]);

  // Real-time sync with Firestore
  useEffect(() => {
    if (!db || !isOpen || !currentUser || !auth) return;

    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
      // Clean up previous snapshot listener if it exists
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!firebaseUser) {
        console.warn("Waiting for Firebase Auth for real-time sync...");
        return;
      }

      setIsLoading(true);
      const q = query(collection(db, 'knowledge_base'), orderBy('createdAt', 'desc'));
      unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const newItems = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as KnowledgeItem[];
        setItems(newItems);
        setIsLoading(false);
      }, (error) => {
        console.error("Firestore sync error:", error);
        if (error.message.includes('permission')) {
          console.warn("Auth state mismatch. Firebase UI:", firebaseUser.email, "React User Prop:", currentUser.email);
        }
        setIsLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [isOpen, currentUser, db, auth]);

  if (!isOpen) return null;

  const handleAddItem = async () => {
    if (!newItemTitle || !newItemContent || !db || !auth?.currentUser) return;
    
    const tags = newItemTags.split(',').map(t => t.trim()).filter(t => t);
    
    const newItem: any = {
      type: newItemType,
      title: newItemTitle,
      content: newItemContent,
      tags,
      createdAt: new Date().toISOString(),
      createdBy: auth.currentUser.uid,
      creatorName: currentUser?.fullName || auth.currentUser.email || 'Anonymous',
      isLocalReference: useLocalSource && (newItemType === 'IMAGE' || newItemType === 'VIDEO'),
      localPath: useLocalSource ? newItemContent : null
    };

    try {
      await addDoc(collection(db, 'knowledge_base'), newItem);
      setIsAdding(false);
      setNewItemTitle('');
      setNewItemContent('');
      setNewItemTags('');
      setUseLocalSource(false);
    } catch (error: any) {
      console.error("Error adding document: ", error);
      try {
        handleFirestoreError(error, 'create', 'knowledge_base');
      } catch (advancedError: any) {
        console.error("Detailed Firestore Error:", advancedError.message);
        alert(`Lỗi quyền truy cập: ${advancedError.message}`);
      }
    }
  };

  const getMediaUrl = (item: KnowledgeItem) => {
    if (item.isLocalReference && item.localPath) {
      return `${BRIDGE_URL}/api/file?path=${encodeURIComponent(item.localPath)}`;
    }
    return item.content;
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
    } catch (error: any) {
      console.error("Error deleting document: ", error);
      try {
        handleFirestoreError(error, 'delete', `knowledge_base/${id}`);
      } catch (advancedError: any) {
        alert(`Lỗi xóa: ${advancedError.message}`);
      }
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
              <div className="flex items-center gap-2">
                <p className="text-gray-400 text-sm">Cung cấp thông tin sản phẩm cho AI.</p>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${isBridgeOnline ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  <Monitor size={10} /> Bridge: {isBridgeOnline ? 'CONNECTED' : 'DISCONNECTED'}
                </div>
                <button 
                  onClick={() => setShowWorkspaceSetup(true)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors flex items-center gap-1 ${isBridgeOnline ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border-purple-500/20' : 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700 hover:text-gray-300'}`}
                >
                  <Settings size={10} /> {localWorkspace ? 'Change Workspace' : 'Setup Workspace'}
                </button>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-gray-800/50 hover:bg-gray-700 p-2 rounded-full">
            <X size={24} />
          </button>
        </div>

        {showWorkspaceSetup && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1a1d21] w-full max-w-md rounded-2xl border border-gray-800 p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Monitor size={20} className="text-purple-400" /> Thiết lập Workspace
                </h3>
                <button onClick={() => setShowWorkspaceSetup(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Chọn thư mục trên máy tính của bạn để lưu trữ tài nguyên (Hình ảnh, Video). Hệ thống sẽ tự động tạo cấu trúc thư mục chuẩn.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Đường dẫn thư mục gốc</label>
                  <input 
                    type="text" 
                    value={basePathInput}
                    onChange={(e) => setBasePathInput(e.target.value)}
                    placeholder="VD: D:/AmazeBid_Data"
                    className="w-full bg-[#0f1115] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="bg-[#0f1115] p-3 rounded-lg border border-gray-800 text-[10px] text-gray-500 italic">
                  Các thư mục con sẽ được tạo: /images, /videos, /docs
                </div>
                <button 
                  onClick={handleSetupWorkspace}
                  disabled={!basePathInput}
                  className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-500 transition-colors disabled:opacity-50"
                >
                  Khởi động & Tạo thư mục
                </button>
              </div>
            </div>
          </div>
        )}

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

            {isBridgeOnline ? (
              localWorkspace ? (
                <div className="mt-4 p-3 bg-purple-600/10 rounded-xl border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Local Workspace</span>
                    <button onClick={syncLocalWorkspace} disabled={isSyncing} className="text-purple-400 hover:text-white transition-colors">
                      <Monitor size={12} className={isSyncing ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  <div className="text-[10px] text-gray-500 truncate" title={localWorkspace.path}>{localWorkspace.path}</div>
                  <div className="mt-2 text-[10px] text-gray-400">
                    {localWorkspace.files.length} files detected
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-3 bg-gray-800/30 rounded-xl border border-gray-700 border-dashed">
                  <p className="text-[10px] text-gray-500 text-center mb-2">Chưa thiết lập Workspace</p>
                  <button 
                    onClick={() => setShowWorkspaceSetup(true)}
                    className="w-full text-[10px] bg-purple-600 text-white font-bold py-1.5 rounded-lg hover:bg-purple-500 transition-colors"
                  >
                    Thiết lập Ngay
                  </button>
                </div>
              )
            ) : (
              <div className="mt-4 p-3 bg-red-900/10 rounded-xl border border-red-900/20">
                <p className="text-[10px] text-red-400 font-bold mb-1 flex items-center gap-1">
                   <Info size={10}/> Bridge Offline
                </p>
                <p className="text-[10px] text-gray-500 leading-tight mb-2">Vui lòng chạy `node local-bridge.js` trên máy tính của bạn.</p>
                <button 
                  onClick={() => setShowWorkspaceSetup(true)}
                  className="w-full text-[10px] bg-gray-800 text-gray-400 py-1.5 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
                >
                  Xem hướng dẫn Setup
                </button>
              </div>
            )}

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
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-sm font-medium text-gray-400">
                            {newItemType === 'IMAGE' ? 'Tài nguyên hình ảnh' : 'Tài nguyên Video'}
                          </label>
                          <div className="flex items-center gap-2 bg-[#0f1115] p-1 rounded-lg border border-gray-700">
                             <button 
                               onClick={() => setUseLocalSource(false)}
                               className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${!useLocalSource ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                             >
                               <Globe size={10}/> Cloud
                             </button>
                             <button 
                               onClick={() => setUseLocalSource(true)}
                               className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${useLocalSource ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                             >
                               <Monitor size={10}/> Local Path
                             </button>
                          </div>
                        </div>

                        {useLocalSource ? (
                          <div className="space-y-2">
                            <input 
                              type="text" 
                              value={newItemContent}
                              onChange={(e) => setNewItemContent(e.target.value)}
                              placeholder={newItemType === 'IMAGE' ? "VD: D:/Photos/product.jpg" : "VD: E:/Videos/demo.mp4"}
                              className="w-full bg-[#0f1115] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                            />
                            <p className="text-[10px] text-gray-500 flex items-center gap-1">
                              <Info size={10}/> Hệ thống sẽ kết nối tới file trên ổ cứng thông qua Local Bridge.
                            </p>
                          </div>
                        ) : newItemType === 'IMAGE' ? (
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
                              <span>Click để chọn hoặc kéo thả ảnh</span>
                            </button>
                          )
                        ) : (
                          <input 
                            type="text" 
                            value={newItemContent}
                            onChange={(e) => setNewItemContent(e.target.value)}
                            placeholder="VD: https://youtube.com/watch?v=..."
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
              ) : (
                <div className="space-y-8">
                  {/* Local Workspace Files Section */}
                  {isBridgeOnline && localWorkspace && activeTab !== 'SPEC' && activeTab !== 'INSTRUCTION' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                        <div className="flex items-center gap-2">
                          <Monitor size={18} className="text-purple-400" />
                          <h3 className="text-lg font-bold text-white">Tài nguyên cục bộ ({localWorkspace.files.length})</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500">Thanh lọc từ {localWorkspace.path}</span>
                          <button onClick={syncLocalWorkspace} disabled={isSyncing} className="p-1 hover:bg-gray-800 rounded transition-colors">
                            <Monitor size={14} className={isSyncing ? 'animate-spin' : ''} />
                          </button>
                        </div>
                      </div>
                      
                      {localWorkspace.files.length === 0 ? (
                        <div className="p-8 border border-dashed border-purple-500/10 rounded-xl flex flex-col items-center justify-center text-gray-500 bg-purple-500/5">
                          <Plus size={24} className="mb-2 opacity-20" />
                          <p className="text-sm">Thư mục trống. Hãy copy file vào /articles, /images, /videos, /specs, /instructions...</p>
                          <button onClick={syncLocalWorkspace} className="text-purple-400 text-xs mt-2 hover:underline">Quét lại thư mục</button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {localWorkspace.files
                            .filter(file => {
                              if (activeTab === 'ALL') return true;
                              return file.type === activeTab;
                            })
                            .map((file, idx) => {
                              const isAlreadyInCloud = items.some(i => i.isLocalReference && i.localPath === file.path);
                              return (
                                <div key={`local-${idx}`} className="bg-purple-600/5 border border-purple-500/20 rounded-xl p-4 flex flex-col group hover:border-purple-500/40 transition-colors">
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                      {file.type === 'TEXT' && <FileText size={16} className="text-blue-400" />}
                                      {file.type === 'IMAGE' && <ImageIcon size={16} className="text-green-400" />}
                                      {file.type === 'VIDEO' && <Video size={16} className="text-red-400" />}
                                      {file.type === 'SPEC' && <Settings size={16} className="text-orange-400" />}
                                      {file.type === 'INSTRUCTION' && <BookOpen size={16} className="text-purple-400" />}
                                      <h4 className="font-bold text-white line-clamp-1 text-sm">{file.name}</h4>
                                    </div>
                                    {isAlreadyInCloud ? (
                                      <div className="text-green-500 flex items-center gap-1 text-[10px] bg-green-500/10 px-1.5 py-0.5 rounded">
                                        <ShieldCheck size={10}/> Đã đồng bộ
                                      </div>
                                    ) : (
                                      <button 
                                        onClick={() => handleAddLocalFileToCloud(file)}
                                        className="text-purple-400 hover:text-white flex items-center gap-1 text-[10px] transition-colors"
                                      >
                                        <Upload size={12}/> Đưa vào Cloud
                                      </button>
                                    )}
                                  </div>
                                  <div className="w-full h-24 rounded-lg bg-black relative mb-2 flex items-center justify-center">
                                    {file.category === 'images' ? (
                                      <img 
                                        src={`${BRIDGE_URL}/api/file?path=${encodeURIComponent(file.path)}`} 
                                        className="w-full h-full object-contain" 
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <Monitor size={24} className="text-gray-700" />
                                    )}
                                  </div>
                                  <div className="text-[10px] text-gray-500 truncate" title={file.path}>{file.path}</div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cloud/Firestore Items Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
                      <Globe size={18} className="text-blue-400" />
                      <h3 className="text-lg font-bold text-white">Tài nguyên hệ thống Cloud ({filteredItems.length})</h3>
                    </div>
                    {filteredItems.length === 0 ? (
                      <div className="h-32 flex flex-col items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
                        <Database size={32} className="mb-2 opacity-20" />
                        <p className="text-sm">Chưa có tài nguyên cloud nào.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredItems.map(item => (
                          <div key={item.id} className="bg-[#1a1d21] border border-gray-800 rounded-xl p-4 flex flex-col group hover:border-gray-600 transition-colors">
                            {/* ... existing item card content ... */}
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
                              <div className="w-full h-32 rounded-lg overflow-hidden mb-3 bg-black relative">
                                <img src={getMediaUrl(item)} alt={item.title} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                {item.isLocalReference && (
                                  <div className="absolute bottom-1 right-1 bg-purple-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Monitor size={8}/> Local
                                  </div>
                                )}
                              </div>
                            ) : item.type === 'VIDEO' ? (
                              <div className="w-full h-32 rounded-lg bg-black flex items-center justify-center mb-3 relative">
                                <Video size={32} className="text-gray-700" />
                                {item.isLocalReference && (
                                  <div className="absolute bottom-1 right-1 bg-purple-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Monitor size={8}/> Local
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-full h-32 rounded-lg bg-[#0f1115] p-3 mb-3 overflow-hidden text-sm text-gray-400 whitespace-pre-wrap">
                                {item.content}
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
                                    onClick={() => onSelectImage(getMediaUrl(item), item.title)}
                                    className="flex-1 bg-purple-600/20 text-purple-400 font-medium py-1.5 rounded-lg hover:bg-purple-600/30 transition-colors text-sm"
                                  >
                                    Chọn ảnh
                                  </button>
                                )}
                                {item.type === 'VIDEO' && onSelectVideo && (
                                  <button 
                                    onClick={() => onSelectVideo(getMediaUrl(item), item.title)}
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
