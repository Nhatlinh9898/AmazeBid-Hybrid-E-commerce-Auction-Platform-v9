import React from 'react';
import { 
  TreeDeciduous, 
  ChevronRight, 
  ChevronDown, 
  Boxes, 
  MapPin, 
  Truck, 
  Zap, 
  Users,
  TrendingUp,
  Search,
  Plus,
  Save,
  Network
} from 'lucide-react';
import { motion } from 'motion/react';
import { supplyChainService } from '../src/services/SupplyChainService';
import { BOMItem } from '../src/types';
import { geminiService } from '../services/geminiService';
import ProductEcosystemNetwork from './ProductEcosystemNetwork';

const ProductStructureAnalyzer: React.FC = () => {
  const [boms, setBoms] = React.useState<BOMItem[]>([]);
  const [selectedBOM, setSelectedBOM] = React.useState<BOMItem | null>(null);
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(new Set());
  const [aiAnalysis, setAiAnalysis] = React.useState<string>('');
  const [analyzing, setAnalyzing] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'list' | 'ecosystem'>('list');

  const [newBOM, setNewBOM] = React.useState<Partial<BOMItem>>({
    name: '',
    productId: '',
    specs: '',
    basePrice: 0,
    quantity: 1,
    unit: 'Unit',
    origin: ''
  });

  const handleSaveNewBOM = () => {
    if (!newBOM.name || !newBOM.productId) return;
    const item: BOMItem = {
      ...newBOM as BOMItem,
      id: `bom-${Math.random().toString(36).substring(2, 9)}`,
      supplierOptions: [],
      subComponents: []
    };
    supplyChainService.saveBOM(item);
    setIsCreating(false);
    setNewBOM({ name: '', productId: '', specs: '', basePrice: 0, quantity: 1, unit: 'Unit', origin: '' });
  };

  const filteredBoms = boms.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.productId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  React.useEffect(() => {
    const unsubscribe = supplyChainService.subscribe((data) => {
      setBoms(data.boms);
      if (data.boms.length > 0 && !selectedBOM) {
        setSelectedBOM(data.boms[0]);
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleNode = (id: string) => {
    const next = new Set(expandedNodes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedNodes(next);
  };

  const getAIInsights = async (item: BOMItem) => {
    setAnalyzing(true);
    try {
      const prompt = `Phân tích cấu trúc nguyên vật liệu cho sản phẩm: ${item.name}. 
      Thông số: ${item.specs}. 
      Giá gốc: ${item.basePrice} USD. 
      Linh kiện con: ${item.subComponents?.map(c => c.name).join(', ') || 'Không có'}.
      Hãy đưa ra dự báo biến động giá thị trường trong 3 tháng tới và 3 lời khuyên tối ưu hóa chi phí sản xuất. 
      Trả về dưới dạng markdown ngắn gọn.`;
      
      const response = await geminiService.generateText(prompt);
      setAiAnalysis(response);
    } catch {
      setAiAnalysis('Không thể tải phân tích AI lúc này.');
    } finally {
      setAnalyzing(false);
    }
  };

  const renderBOMTree = (item: BOMItem, level = 0) => {
    const isExpanded = expandedNodes.has(item.id);
    const hasChildren = item.subComponents && item.subComponents.length > 0;

    return (
      <div key={item.id} className="ml-4 border-l border-slate-800">
        <div 
          onClick={() => hasChildren && toggleNode(item.id)}
          className={`group flex items-center gap-3 p-3 rounded-xl cursor-all transition-all hover:bg-slate-800/50 ${selectedBOM?.id === item.id ? 'bg-indigo-500/10 border-l border-indigo-500' : ''}`}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={14} className="text-indigo-400" /> : <ChevronRight size={14} className="text-slate-500" />
          ) : (
            <div className="w-3.5" />
          )}
          
          <div className="flex-1 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-200">{item.name}</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  {item.quantity} {item.unit}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{item.specs}</p>
            </div>
            
            <div className="text-right">
              <span className="text-xs font-mono text-emerald-400">${item.basePrice}</span>
              <p className="text-[9px] text-slate-600 uppercase tracking-widest">{item.origin}</p>
            </div>
          </div>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBOM(item);
              getAIInsights(item);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg transition-all"
          >
            <TrendingUp size={12} />
          </button>
        </div>

        {hasChildren && isExpanded && (
          <div className="overflow-hidden">
            {item.subComponents?.map(sub => renderBOMTree(sub, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* View Selector Toggle */}
      <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-2xl border border-slate-800 w-fit">
        <button 
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Boxes size={14} /> Danh Mục (BOM)
        </button>
        <button 
          onClick={() => setViewMode('ecosystem')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'ecosystem' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Network size={14} /> Hệ Sinh Thái
        </button>
      </div>

      {viewMode === 'ecosystem' ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <ProductEcosystemNetwork />
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cấu trúc cây BOM */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Boxes className="text-indigo-400" /> Cấu Trúc Linh Kiện (BOM)
              </h3>
              <p className="text-xs text-slate-500 font-medium">Truy xuất đa cấp & Quản lý nguyên vật liệu</p>
            </div>
            <button 
              onClick={() => setIsCreating(!isCreating)}
              className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text"
              placeholder="Tìm kiếm sản phẩm hoặc mã SP..."
              className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isCreating && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" placeholder="Tên sản phẩm"
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-[10px] text-white"
                  value={newBOM.name}
                  onChange={(e) => setNewBOM({...newBOM, name: e.target.value})}
                />
                <input 
                  type="text" placeholder="Mã SP"
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-[10px] text-white"
                  value={newBOM.productId}
                  onChange={(e) => setNewBOM({...newBOM, productId: e.target.value})}
                />
              </div>
              <textarea 
                placeholder="Thông số kỹ thuật"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[10px] text-white h-20"
                value={newBOM.specs}
                onChange={(e) => setNewBOM({...newBOM, specs: e.target.value})}
              />
              <div className="grid grid-cols-3 gap-3">
                <input 
                  type="number" placeholder="Giá gốc"
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-[10px] text-white"
                  value={newBOM.basePrice}
                  onChange={(e) => setNewBOM({...newBOM, basePrice: parseFloat(e.target.value)})}
                />
                <input 
                  type="text" placeholder="Xuất xứ"
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-[10px] text-white"
                  value={newBOM.origin}
                  onChange={(e) => setNewBOM({...newBOM, origin: e.target.value})}
                />
                <button 
                  onClick={handleSaveNewBOM}
                  className="bg-indigo-500 text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-1"
                >
                  <Save size={12} /> Lưu BOM
                </button>
              </div>
            </motion.div>
          )}

          <div className="space-y-1">
            {filteredBoms.map(bom => (
              <div key={bom.id} className="mb-4">
                <div 
                  className="flex items-center gap-3 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 mb-2 cursor-pointer"
                  onClick={() => setSelectedBOM(bom)}
                >
                  <TreeDeciduous className="text-indigo-400" />
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-white">{bom.name}</h4>
                    <p className="text-[10px] text-indigo-300/60 uppercase">Mã SP: {bom.productId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-400 font-mono">
                      ${supplyChainService.calculateTotalBOMCost(bom).toLocaleString()}
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Giá Thành Ước Tính</p>
                  </div>
                </div>
                {renderBOMTree(bom)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Phân tích & Tối ưu hóa */}
      <div className="lg:col-span-7 space-y-6">
        {selectedBOM ? (
          <>
            {/* AI Insights */}
            <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/10 rounded-3xl border border-indigo-500/30 p-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 opacity-5">
                <Zap size={200} />
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-black text-white flex items-center gap-3 uppercase tracking-wider">
                  <Zap className="text-amber-400 fill-amber-400" size={18} /> Phân tích Dự báo AI
                </h3>
                {analyzing && (
                  <span className="flex items-center gap-2 text-xs text-indigo-400 animate-pulse">
                     Đang tính toán...
                  </span>
                )}
              </div>

              <div className="prose prose-invert max-w-none">
                {aiAnalysis ? (
                  <div className="text-xs text-slate-300 leading-relaxed bg-black/40 rounded-2xl p-4 border border-white/5 whitespace-pre-wrap">
                    {aiAnalysis}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-xs text-slate-500 italic">Chọn một linh kiện để xem dự báo thị trường & tối ưu hóa giá thành.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top 5 Nhà Cung Cấp */}
            <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-md font-black text-white flex items-center gap-2 uppercase tracking-wider">
                    <Users className="text-indigo-400" size={18} /> Top 5 Nhà Cung Cấp Tối Ưu
                  </h3>
                  <p className="text-xs text-slate-500">Dựa trên Giá, Vận chuyển & Độ tin cậy</p>
                </div>
              </div>

              {selectedBOM.supplierOptions?.length > 0 ? (
                <div className="space-y-3">
                  {supplyChainService.getOptimalSuppliers(selectedBOM.supplierOptions).map((opt, idx) => (
                    <motion.div 
                      key={opt.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/50 hover:border-indigo-500/30 transition-all flex items-center gap-4 group"
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-amber-500 text-amber-950' : 'bg-slate-800 text-slate-400'}`}>
                        #{idx + 1}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{opt.name}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-500 px-2 rounded font-mono uppercase tracking-widest">{opt.origin}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1"><MapPin size={10} /> {opt.location}</span>
                          <span className="flex items-center gap-1"><Truck size={10} /> {opt.leadTimeDays} ngày</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-400">${opt.pricePerUnit}</p>
                        <p className="text-[9px] text-slate-600">+ ${opt.shippingFee} vận chuyển</p>
                      </div>

                      <div className="flex flex-col items-center pl-4 border-l border-slate-800">
                        <span className="text-[10px] font-black text-amber-400">{opt.reliabilityScore}%</span>
                        <span className="text-[8px] text-slate-600 uppercase font-bold tracking-tighter">Reliability</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-950/20 rounded-3xl border border-dashed border-slate-800">
                  <p className="text-xs text-slate-500">Không tìm thấy dữ liệu nhà cung cấp cho linh kiện này.</p>
                </div>
              )}
            </div>

            {/* Ecosystem Relationships */}
            <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 backdrop-blur-xl">
              <h3 className="text-md font-black text-white flex items-center gap-2 uppercase tracking-wider mb-6">
                <Network className="text-indigo-400" size={18} /> Liên Kết Hệ Sinh Thái
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                  <p className="text-[10px] text-emerald-400 font-black uppercase mb-3">Sản phẩm tiêu thụ đầu ra</p>
                  {supplyChainService.findPotentialBuyers(selectedBOM.productId).length > 0 ? (
                    supplyChainService.findPotentialBuyers(selectedBOM.productId).map(b => (
                      <div key={b.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                        <span className="text-xs text-white font-bold">{b.name}</span>
                        <span className="text-[10px] text-slate-500">{b.productId}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-600 italic">Chưa có sản phẩm tiêu thụ.</p>
                  )}
                </div>

                <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/20">
                  <p className="text-[10px] text-blue-400 font-black uppercase mb-3">Nguồn cung ứng nội bộ</p>
                  {supplyChainService.findInternalSuppliers(selectedBOM).length > 0 ? (
                    supplyChainService.findInternalSuppliers(selectedBOM).map(b => (
                      <div key={b.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                        <span className="text-xs text-white font-bold">{b.name}</span>
                        <span className="text-[10px] text-slate-500">${b.basePrice}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-600 italic">Nhập từ nhà cung cấp bên ngoài.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
            <Boxes size={48} className="text-slate-700 mb-4" />
            <h4 className="text-slate-400 font-bold">Hãy chọn sản phẩm để bắt đầu phân tích</h4>
            <p className="text-xs text-slate-600 mt-2 max-w-xs">Hệ thống sẽ dựa trên cấu trúc linh kiện để dự báo biên lợi nhuận và tối ưu chi phí vận hành.</p>
          </div>
        )}
      </div>
      </div>
      )}
    </div>
  );
};

export default ProductStructureAnalyzer;
