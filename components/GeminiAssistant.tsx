
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot } from 'lucide-react';
import { Message, Product } from '../types';
import { getShoppingAdvice } from '../services/geminiService';

interface GeminiAssistantProps {
  products: Product[];
  hasChatWidget?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ products, isOpen: externalOpen, onClose }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = onClose || setInternalOpen;
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Chào mừng bạn đến với AmazeBid! Tôi là Gemini Assistant. Bạn cần tìm sản phẩm mua ngay hay muốn tham gia đấu giá?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = textToSend.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const response = await getShoppingAdvice(userMsg, products);
    
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsLoading(false);
  };

  return (
    <div className={`fixed transition-all duration-300 left-1/2 -translate-x-1/2 ${
      isOpen ? 'bottom-14 z-[10000]' : 'bottom-[-600px] z-[9998]'
    }`}>
      {isOpen && (
        <div className="bg-white w-[350px] sm:w-[400px] h-[500px] rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-[#131921] p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#febd69] rounded-lg">
                <Bot size={20} className="text-[#131921]" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Trợ lý Mua sắm AI</h3>
                <p className="text-[10px] text-green-400">Đang trực tuyến (Gemini 3 Flash)</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-gray-700 p-1 rounded">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                  msg.role === 'user' 
                  ? 'bg-[#131921] text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm rounded-tl-none flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestions */}
          <div className="px-4 py-2 bg-gray-50 flex gap-2 overflow-x-auto custom-scrollbar">
            {['Tìm sản phẩm giá rẻ', 'Sản phẩm nào đang đấu giá?', 'Gợi ý quà tặng', 'Hỏi về vận chuyển'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  handleSend(suggestion);
                }}
                className="shrink-0 whitespace-nowrap bg-white border border-gray-200 text-xs text-gray-600 px-3 py-1.5 rounded-full hover:border-[#febd69] hover:text-[#131921] transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100 flex gap-2 items-center">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Hỏi về sản phẩm..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#febd69]"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading}
              className="bg-[#febd69] p-2 rounded-full hover:bg-orange-500 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeminiAssistant;
