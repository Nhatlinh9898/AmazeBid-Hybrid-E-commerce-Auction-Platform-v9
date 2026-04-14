import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User as UserIcon } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

interface ChatWidgetProps {
  currentUserId?: string;
  targetUser?: {
    id: string;
    fullName: string;
    avatar: string;
  };
  isOpen?: boolean;
  onClose?: () => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ currentUserId, targetUser, isOpen: externalOpen, onClose }) => {
  const [internalOpen, setInternalOpen] = useState(!!targetUser);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = (val: boolean) => {
    if (onClose && !val) onClose();
    setInternalOpen(val);
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUserId) return;

    // Initialize socket
    socketRef.current = io();

    const receiverId = targetUser?.id || 'support_admin';
    socketRef.current.emit('chat:join', { userId: currentUserId, otherId: receiverId });

    socketRef.current.on('chat:new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on('chat:typing_status', ({ senderId, isTyping }: { senderId: string, isTyping: boolean }) => {
      const expectedSender = targetUser?.id || 'support_admin';
      if (senderId === expectedSender) {
        setOtherUserTyping(isTyping);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [currentUserId, targetUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !currentUserId || !socketRef.current) return;

    const receiverId = targetUser?.id || 'support_admin';

    socketRef.current.emit('chat:message', {
      senderId: currentUserId,
      receiverId: receiverId,
      text: inputText
    });

    setInputText('');
    socketRef.current.emit('chat:typing', { senderId: currentUserId, receiverId: receiverId, isTyping: false });
  };

  const handleTyping = (text: string) => {
    setInputText(text);
    if (!socketRef.current || !currentUserId) return;

    const receiverId = targetUser?.id || 'support_admin';

    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      socketRef.current.emit('chat:typing', { senderId: currentUserId, receiverId: receiverId, isTyping: true });
    } else if (text.length === 0 && isTyping) {
      setIsTyping(false);
      socketRef.current.emit('chat:typing', { senderId: currentUserId, receiverId: receiverId, isTyping: false });
    }
  };

  if (!currentUserId) return null;

  return (
    <div className={`fixed transition-all duration-300 right-6 ${isOpen ? 'bottom-14 z-[10000]' : 'bottom-[-600px] z-[9999]'}`}>
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                {targetUser?.avatar ? (
                  <img src={targetUser.avatar} alt={targetUser.fullName} className="w-10 h-10 rounded-full border-2 border-white/20" />
                ) : (
                  <div className="bg-white/20 p-2 rounded-full">
                    <UserIcon size={20} />
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-blue-600 rounded-full"></span>
              </div>
              <div>
                <h3 className="font-bold text-sm">{targetUser?.fullName || 'Hỗ trợ trực tuyến'}</h3>
                <p className="text-[10px] text-blue-100 italic">
                  {otherUserTyping ? 'Đang soạn tin...' : 'Đang hoạt động'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                setIsOpen(false);
                if (onClose) onClose();
              }} 
              className="hover:bg-blue-700 p-1 rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="h-80 bg-gray-50 p-4 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 opacity-60">
                <MessageSquare size={40} />
                <p className="text-xs">Bắt đầu cuộc trò chuyện với {targetUser?.fullName || 'hỗ trợ trực tuyến'}</p>
              </div>
            )}
            {messages.map(msg => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'}`}>
                    <p>{msg.text}</p>
                    <p className={`text-[9px] mt-1 ${isMe ? 'text-blue-200 text-right' : 'text-gray-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            {otherUserTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-200/50 rounded-2xl px-4 py-2 flex items-center gap-1">
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Nhập tin nhắn..." 
              value={inputText}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-gray-100 border-transparent rounded-full px-4 py-2 text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full disabled:opacity-50 transition-colors shadow-md active:scale-95"
            >
              <Send size={18} className="ml-0.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
