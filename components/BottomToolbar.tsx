import React from 'react';
import { Cpu, MessageSquare, Sparkles } from 'lucide-react';
import { useAuth } from '../context/useAuth';

interface BottomToolbarProps {
  onToggleGemini: () => void;
  onToggleAIWorker: () => void;
  onToggleChat: () => void;
  isGeminiOpen: boolean;
  isAIWorkerOpen: boolean;
  isChatOpen: boolean;
}

const BottomToolbar: React.FC<BottomToolbarProps> = ({
  onToggleGemini,
  onToggleAIWorker,
  onToggleChat,
  isGeminiOpen,
  isAIWorkerOpen,
  isChatOpen
}) => {
  const { user } = useAuth();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-12 bg-[#131921]/95 backdrop-blur-md border-t border-white/10 z-[10002] flex items-center justify-between px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-4">
        {/* AI Worker Manager Trigger */}
        {user?.role === 'ADMIN' && (
          <button 
            onClick={onToggleAIWorker}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              isAIWorkerOpen ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/5 text-zinc-400'
            }`}
          >
            <Cpu size={18} />
            <span className="text-xs font-medium hidden sm:inline">AI Worker</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Gemini Assistant Trigger */}
        <button 
          onClick={onToggleGemini}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all ${
            isGeminiOpen ? 'bg-[#febd69] text-black' : 'bg-[#232f3e] text-white hover:bg-[#37475a]'
          } shadow-lg`}
        >
          <Sparkles size={18} />
          <span className="text-sm font-bold">Gemini AI</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* Chat Widget Trigger */}
        <button 
          onClick={onToggleChat}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
            isChatOpen ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5 text-zinc-400'
          }`}
        >
          <div className="relative">
            <MessageSquare size={18} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-[#131921]"></span>
          </div>
          <span className="text-xs font-medium hidden sm:inline">Chat</span>
        </button>
      </div>
    </div>
  );
};

export default BottomToolbar;
