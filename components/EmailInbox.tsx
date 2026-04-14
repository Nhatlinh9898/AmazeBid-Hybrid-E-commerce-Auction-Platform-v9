import React, { useState, useEffect, useMemo } from 'react';
import { Mail, MailOpen, Trash2, X, CheckCircle, ShoppingBag, ShieldCheck, Gavel, Search, Archive, Check } from 'lucide-react';
import { emailService, EmailTemplate } from '../services/EmailService';

interface EmailInboxProps {
  isOpen: boolean;
  onClose: () => void;
}

type EmailFilter = 'ALL' | 'PURCHASE' | 'AUCTION' | 'KYC' | 'SYSTEM';

export const EmailInbox: React.FC<EmailInboxProps> = ({ isOpen, onClose }) => {
  const [emails, setEmails] = useState<EmailTemplate[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<EmailFilter>('ALL');

  useEffect(() => {
    const unsubscribe = emailService.subscribe(setEmails);
    return () => unsubscribe();
  }, []);

  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      const matchesSearch = 
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.to.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = 
        filter === 'ALL' ||
        (filter === 'PURCHASE' && email.type === 'PURCHASE') ||
        (filter === 'AUCTION' && email.type === 'AUCTION_WIN') ||
        (filter === 'KYC' && email.type === 'KYC') ||
        (filter === 'SYSTEM' && (email.type === 'PAYMENT_CONFIRMATION' || email.type === 'SHIPPING'));

      return matchesSearch && matchesFilter;
    });
  }, [emails, searchTerm, filter]);

  if (!isOpen) return null;

  const handleEmailClick = (email: EmailTemplate) => {
    emailService.markAsRead(email.id);
    setSelectedEmail(email);
  };

  const handleDeleteEmail = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    emailService.deleteEmail(id);
    if (selectedEmail?.id === id) {
      setSelectedEmail(null);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'PURCHASE': return <ShoppingBag className="w-5 h-5 text-blue-500" />;
      case 'PAYMENT_CONFIRMATION': return <ShieldCheck className="w-5 h-5 text-green-500" />;
      case 'KYC': return <CheckCircle className="w-5 h-5 text-purple-500" />;
      case 'AUCTION_WIN': return <Gavel className="w-5 h-5 text-amber-500" />;
      default: return <Mail className="w-5 h-5 text-gray-500" />;
    }
  };

  const unreadCount = emails.filter(e => !e.isRead).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex overflow-hidden relative">
        
        {/* Sidebar - Email List */}
        <div className="w-2/5 border-r border-gray-200 bg-gray-50 flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" /> Hộp Thư Hệ Thống
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full md:hidden">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm email..."
                className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar">
              {(['ALL', 'PURCHASE', 'AUCTION', 'KYC', 'SYSTEM'] as EmailFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${
                    filter === f 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {f === 'ALL' ? 'Tất cả' : f}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-3 bg-white border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {unreadCount} chưa đọc
              </span>
              <button 
                onClick={() => emailService.markAllAsRead()}
                className="text-[10px] text-gray-500 hover:text-blue-600 flex items-center gap-1 font-bold"
                title="Đánh dấu tất cả đã đọc"
              >
                <Check className="w-3 h-3" /> Đã đọc hết
              </button>
            </div>
            <button 
              onClick={() => {
                if(confirm('Bạn có chắc chắn muốn xóa toàn bộ hộp thư?')) {
                  emailService.clearAll();
                  setSelectedEmail(null);
                }
              }}
              className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-1 font-bold"
            >
              <Trash2 className="w-3 h-3" /> Xóa hết
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredEmails.length === 0 ? (
              <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                <MailOpen className="w-16 h-16 mb-4 opacity-10" />
                <p className="text-sm font-medium">Không tìm thấy email nào</p>
                <p className="text-xs text-gray-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            ) : (
              filteredEmails.map(email => (
                <div 
                  key={email.id}
                  onClick={() => handleEmailClick(email)}
                  className={`group p-4 border-b border-gray-100 cursor-pointer transition-all relative ${
                    selectedEmail?.id === email.id ? 'bg-white shadow-inner border-l-4 border-l-blue-600' : 'hover:bg-white'
                  } ${!email.isRead ? 'bg-blue-50/40' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 shrink-0">
                      {getIconForType(email.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm truncate pr-2 ${!email.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {email.subject}
                        </span>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {new Date(email.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500 truncate">Tới: {email.to}</p>
                        <button 
                          onClick={(e) => handleDeleteEmail(e, email.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded transition-all"
                          title="Xóa email"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content - Email View */}
        <div className="flex-1 bg-white flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
            <div className="flex items-center gap-3">
              {selectedEmail && (
                <button 
                  onClick={() => setSelectedEmail(null)}
                  className="p-2 hover:bg-gray-100 rounded-full md:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                Chi tiết thông báo hệ thống
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedEmail && (
                <button 
                  onClick={(e) => handleDeleteEmail(e as any, selectedEmail.id)}
                  className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                >
                  <Trash2 className="w-4 h-4" /> Xóa
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
            {selectedEmail ? (
              <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-2 mb-4">
                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                         selectedEmail.type === 'PURCHASE' ? 'bg-blue-100 text-blue-700' :
                         selectedEmail.type === 'AUCTION_WIN' ? 'bg-amber-100 text-amber-700' :
                         selectedEmail.type === 'KYC' ? 'bg-purple-100 text-purple-700' :
                         'bg-gray-100 text-gray-700'
                       }`}>
                         {selectedEmail.type}
                       </span>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-4 leading-tight">{selectedEmail.subject}</h1>
                    <div className="flex flex-wrap gap-y-2 justify-between items-center text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-gray-400">Từ:</span> system@amazebid.com
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-gray-400">Tới:</span> {selectedEmail.to}
                        </div>
                      </div>
                      <div className="font-medium bg-gray-100 px-2 py-1 rounded">
                        {new Date(selectedEmail.timestamp).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                  <div className="p-8 bg-white">
                    {/* Render HTML Content safely */}
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }} 
                    />
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                    <p className="text-[10px] text-gray-400 font-medium italic">
                      Đây là email mô phỏng được gửi từ hệ thống AmazeBid.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <div className="relative">
                  <Mail className="w-24 h-24 mb-6 opacity-5" />
                  <Archive className="w-8 h-8 absolute -bottom-2 -right-2 text-blue-200" />
                </div>
                <h3 className="text-lg font-bold text-gray-300">Chọn một thông báo</h3>
                <p className="text-sm">Vui lòng chọn một email từ danh sách bên trái để xem chi tiết.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
