import React from 'react';
import { motion } from 'motion/react';
import { 
  Network, 
  Orbit, 
  ArrowRightLeft, 
  Link as LinkIcon, 
  Target, 
  Activity,
  Zap,
  Info
} from 'lucide-react';
import { supplyChainService } from '../src/services/SupplyChainService';
import { BOMItem } from '../src/types';

const ProductEcosystemNetwork: React.FC = () => {
  const [boms, setBoms] = React.useState<BOMItem[]>([]);
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsubscribe = supplyChainService.subscribe((data) => {
      setBoms(data.boms);
    });
    return unsubscribe;
  }, []);

  const findConnections = (productId: string) => {
    const outputs = supplyChainService.findPotentialBuyers(productId);
    const item = boms.find(b => b.productId === productId);
    const inputs = item ? supplyChainService.findInternalSuppliers(item) : [];
    return { inputs, outputs };
  };

  const getNodePosition = (idx: number, total: number) => {
    const angle = (idx / total) * 2 * Math.PI;
    const radius = 180;
    const centerX = 350; // Larger container offset
    const centerY = 250;
    return {
      x: Math.cos(angle) * radius + centerX,
      y: Math.sin(angle) * radius + centerY,
      angle
    };
  };

  const getConnectionsForNode = (nodeId: string) => {
    const node = boms.find(b => b.id === nodeId);
    if (!node) return { inputs: [], outputs: [] };
    return findConnections(node.productId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-8 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12">
          <Network size={200} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <Orbit className="text-indigo-400 animate-spin-slow" /> Mạng Lưới Hệ Sinh Thái Sản Phẩm
              </h3>
              <p className="text-sm text-slate-500 font-medium">Neural Supply Chain & P2P Ecosystem</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase rounded-full border border-emerald-500/20 flex items-center gap-2">
                <Activity size={10} /> Live Network
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Neural Map Visualization */}
            <div className="lg:col-span-8 bg-slate-950/50 rounded-2xl border border-slate-800/50 h-[500px] relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.05)_0%,transparent_70%)]" />
              
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {boms.map((bom, idx) => {
                  const pos = getNodePosition(idx, boms.length);
                  return (bom.consumesProductIds || []).map(targetId => {
                    const targetIdx = boms.findIndex(b => b.productId === targetId);
                    if (targetIdx === -1) return null;
                    const targetPos = getNodePosition(targetIdx, boms.length);
                    const isSelected = selectedNode === bom.id || boms[targetIdx].id === selectedNode;

                    return (
                      <motion.line
                        key={`${bom.id}-${targetId}`}
                        x1={pos.x}
                        y1={pos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        stroke={isSelected ? "#6366f1" : "#1e293b"}
                        strokeWidth={isSelected ? 2 : 1}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: isSelected ? 0.8 : 0.2 }}
                      />
                    );
                  });
                })}
              </svg>

              <div className="relative w-full h-full">
                {boms.map((bom, idx) => {
                  const pos = getNodePosition(idx, boms.length);
                  const isSelected = selectedNode === bom.id;

                  return (
                    <motion.div 
                      key={bom.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      onClick={() => setSelectedNode(bom.id)}
                      className={`absolute cursor-pointer flex flex-col items-center group z-20 -translate-x-1/2 -translate-y-1/2`}
                      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-500 shadow-lg shadow-indigo-500/50 ring-4 ring-indigo-500/20' : 'bg-slate-800 border border-slate-700 group-hover:border-indigo-400'}`}>
                        <Zap size={18} className={isSelected ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'} />
                      </div>
                      <span className={`mt-2 text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                        {bom.name.split(' ')[0]}
                      </span>
                    </motion.div>
                  );
                })}

                {/* Center Node / Platform */}
                <div className="absolute left-[350px] top-[250px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                   <div className="w-20 h-20 bg-indigo-600/10 rounded-full border border-indigo-500/30 flex items-center justify-center animate-pulse">
                      <div className="w-12 h-12 bg-indigo-600/20 rounded-full border border-indigo-500/50 flex items-center justify-center">
                        <Network className="text-indigo-400" size={24} />
                      </div>
                   </div>
                </div>
              </div>

              <div className="absolute bottom-4 left-4 text-[10px] text-slate-600 font-mono">
                GRAPH_ALGO: NEURAL_MAPPING_V4 // CLUSTER_STATUS: STABLE
              </div>
            </div>

            {/* Recommendations Panel */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Target size={14} /> Khớp Nối Thông Minh
                </h4>
                
                {selectedNode ? (
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Đề xuất nơi bán (Forward)</p>
                      {getConnectionsForNode(selectedNode).outputs.length > 0 ? (
                        getConnectionsForNode(selectedNode).outputs.map(out => (
                          <div key={out.id} className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between mb-2">
                            <div>
                              <p className="text-xs font-black text-white">{out.name}</p>
                              <p className="text-[9px] text-slate-500">Sản phẩm này cần linh kiện của bạn</p>
                            </div>
                            <LinkIcon size={12} className="text-emerald-400" />
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-600 italic">Chưa tìm thấy sản phẩm tiêu thụ đầu ra.</p>
                      )}
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Linh kiện nội bộ (Backward)</p>
                      {getConnectionsForNode(selectedNode).inputs.length > 0 ? (
                        getConnectionsForNode(selectedNode).inputs.map(inp => (
                          <div key={inp.id} className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-center justify-between mb-2">
                            <div>
                              <p className="text-xs font-black text-white">{inp.name}</p>
                              <p className="text-[9px] text-slate-500">Mua trực tiếp từ hệ sinh thái</p>
                            </div>
                            <ArrowRightLeft size={12} className="text-blue-400" />
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-600 italic">Tất cả linh kiện đang được nhập từ bên ngoài.</p>
                      )}
                    </div>

                    <div className="p-4 bg-indigo-500/10 border border-dashed border-indigo-500/30 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2 text-indigo-400">
                        <Info size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Optimized Route</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Chuyển sang sản xuất linh kiện <span className="text-white font-bold">Brushless Motor</span> nội bộ có thể tiết kiệm 
                        <span className="text-emerald-400 font-bold"> 15%</span> tổng chi phí vận hành.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-xs text-slate-600 font-medium italic">Chọn một nút trên bản đồ để xem các liên kết hệ sinh thái.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductEcosystemNetwork;
