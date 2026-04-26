import React from 'react';
import { edgeAI } from '../services/edgeAIService';
import { p2p } from '../services/p2pService';
import { Cpu, ShieldCheck } from 'lucide-react';

/**
 * COMPONENT: AIWorkerManager
 * Quản lý việc đóng góp tài nguyên CPU/GPU của người dùng.
 */
export const AIWorkerManager: React.FC<{ isOpen?: boolean }> = ({ isOpen: externalOpen }) => {
  const [caps, setCaps] = React.useState<any>(null);
  const [isContributing, setIsContributing] = React.useState(false);
  const [tasksProcessed, setTasksProcessed] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  const isOpen = externalOpen !== undefined ? externalOpen : isHovered;

  React.useEffect(() => {
    const init = async () => {
      const capabilities = await edgeAI.getCapabilities();
      setCaps(capabilities);

      // Tự động tham gia mạng lưới nếu thiết bị mạnh (Tier HIGH hoặc MEDIUM)
      if (capabilities.tier !== 'LOW') {
        setIsContributing(true);
        
        // Bắt đầu lắng nghe và xử lý tác vụ từ Mesh
        p2p.startListeningForTasks(capabilities, async (task) => {
          console.log('Processing task from Mesh:', task.id);
          const result = await edgeAI.rewrite(task.text, task.instruction);
          setTasksProcessed(prev => prev + 1);
          return result || '';
        });
      }
    };

    init();
  }, []);

  if (!caps) return null;

  return (
    <div 
      className={`fixed transition-all duration-500 left-6 z-[10001] ${isOpen ? 'bottom-14' : 'bottom-[-200px]'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl transition-all duration-500 overflow-hidden flex flex-col-reverse p-4 ${
        isOpen ? 'w-64 max-h-[250px]' : 'w-[68px] max-h-[68px]'
      }`}>
        
        {/* Header / Icon */}
        <div className="flex items-center gap-3 w-full shrink-0">
          <div className={`p-2 rounded-lg shrink-0 transition-colors ${isContributing ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
            <Cpu size={20} />
          </div>
          <div className={`transition-opacity duration-500 whitespace-nowrap ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            <h4 className="text-sm font-medium text-white">AI Node Status</h4>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
              {isContributing ? `Active Worker (${caps.tier})` : 'Observer Mode'}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className={`transition-opacity duration-500 w-full mb-3 shrink-0 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          {isContributing && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Tasks Shared</span>
                <span className="text-emerald-400 font-mono">{tasksProcessed}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Hardware</span>
                <span className="text-zinc-300">{caps.hasWebGPU ? 'WebGPU (Fast)' : 'WASM (Standard)'}</span>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[10px] text-emerald-500/80">
                <ShieldCheck size={12} />
                <span>Earning AmazeCredits...</span>
              </div>
            </div>
          )}

          {!isContributing && caps.tier === 'LOW' && (
            <p className="text-[10px] text-zinc-500 italic">
              Device resources are limited. AI tasks will be processed by nearby powerful nodes.
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
