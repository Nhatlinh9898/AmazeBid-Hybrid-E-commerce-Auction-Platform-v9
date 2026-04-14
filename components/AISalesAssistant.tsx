import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Send, Bot, X, Check, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Product } from '../types';

interface AISalesAssistantProps {
  product: Product;
  onNegotiationSuccess?: (finalPrice: number) => void;
  isOpen?: boolean;
  onClose?: () => void;
  isFloating?: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export const AISalesAssistant: React.FC<AISalesAssistantProps> = ({ 
  product, 
  onNegotiationSuccess, 
  isOpen: externalIsOpen, 
  onClose: externalOnClose,
  isFloating = true
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = (val: boolean) => {
    if (externalOnClose && !val) externalOnClose();
    setInternalIsOpen(val);
  };
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: `Chào bạn! Tôi là trợ lý AI của AmazeBid. Bạn muốn thương lượng giá cho sản phẩm "${product.title}" chứ? Giá niêm yết là $${product.price}. Bạn muốn đề nghị giá bao nhiêu?` }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [negotiationStatus, setNegotiationStatus] = useState<'IDLE' | 'ACCEPTED' | 'REJECTED'>('IDLE');

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userOffer = parseFloat(inputValue);
    if (isNaN(userOffer)) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Vui lòng nhập một con số hợp lệ nhé!' }]);
      return;
    }

    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: `Tôi muốn mua với giá $${userOffer}` }];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const result = await api.ai.negotiate({
        productId: product.id,
        userOffer,
        chatHistory: newMessages
      });

      setMessages(prev => [...prev, { role: 'assistant', text: result.message }]);

      if (result.status === 'ACCEPTED') {
        setNegotiationStatus('ACCEPTED');
        if (onNegotiationSuccess) onNegotiationSuccess(userOffer);
      } else if (result.status === 'REJECTED') {
        setNegotiationStatus('REJECTED');
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Rất tiếc, tôi đang gặp chút trục trặc. Bạn thử lại sau nhé!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={isFloating ? "fixed bottom-6 right-6 z-50" : "w-full"}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`${isFloating ? "mb-4 w-80 sm:w-96 shadow-2xl" : "w-full shadow-lg"} bg-white rounded-2xl border border-black/5 overflow-hidden flex flex-col h-[500px]`}
          >
            {/* Header */}
            <div className="bg-black text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Amaze AI Assistant</h3>
                  <p className="text-[10px] opacity-70">Đang trực tuyến</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-black text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 shadow-sm border border-black/5 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-black/5 rounded-tl-none">
                    <RefreshCw size={16} className="animate-spin text-slate-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Footer / Input */}
            <div className="p-4 bg-white border-t border-black/5">
              {negotiationStatus === 'ACCEPTED' ? (
                <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl flex items-center gap-2 text-sm font-medium">
                  <Check size={18} />
                  Thương lượng thành công! Bạn có thể mua với giá mới.
                </div>
              ) : negotiationStatus === 'REJECTED' ? (
                <div className="bg-rose-50 text-rose-700 p-3 rounded-xl flex items-center gap-2 text-sm font-medium">
                  <X size={18} />
                  Rất tiếc, chúng tôi không thể giảm thêm.
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Nhập giá đề nghị ($)..."
                    className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-black transition-all"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading}
                    className="bg-black text-white p-2 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    <Send size={20} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {isFloating && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="bg-black text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:bg-slate-800 transition-colors relative"
        >
          <MessageCircle size={24} />
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </motion.button>
      )}
    </div>
  );
};
