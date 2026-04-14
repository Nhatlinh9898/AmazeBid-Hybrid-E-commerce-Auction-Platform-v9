
import React, { useState, useEffect, useRef } from 'react';
import { X, Book, CreditCard, Package, Truck, RefreshCw, FileText, Scale, CheckCircle2, AlertTriangle, ShieldCheck, ChevronRight, MessageSquare, Send, Bot, User as UserIcon, Loader2, Sparkles } from 'lucide-react';
import { customerServiceChat } from '../services/geminiService';
import { api } from '../services/api';
import { Order, Message } from '../types';

interface CustomerServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOPICS = [
  { id: 'CHAT', title: 'Chat với AI (Beta)', icon: MessageSquare, color: 'text-purple-600' },
  { id: 'GUIDE', title: 'Hướng dẫn sử dụng', icon: Book, color: 'text-blue-600' },
  { id: 'PAYMENT', title: 'Quy tắc thanh toán', icon: CreditCard, color: 'text-green-600' },
  { id: 'PACKAGING', title: 'Quy cách đóng gói', icon: Package, color: 'text-orange-600' },
  { id: 'SHIPPING', title: 'Gửi & Nhận hàng', icon: Truck, color: 'text-indigo-600' },
  { id: 'RETURN', title: 'Trả hàng & Hoàn tiền', icon: RefreshCw, color: 'text-red-600' },
  { id: 'TAX', title: 'Khai báo thuế tự chủ', icon: Scale, color: 'text-gray-600' },
  { id: 'AGREEMENT', title: 'Hợp đồng thỏa thuận', icon: FileText, color: 'text-yellow-600' },
];

const CustomerServiceModal: React.FC<CustomerServiceModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('CHAT');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Xin chào! Tôi là trợ lý ảo AmazeBid. Tôi có thể giúp bạn giải đáp thắc mắc về chính sách, tra cứu đơn hàng hoặc hỗ trợ khiếu nại. Bạn cần giúp gì hôm nay?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [hasAgreed, setHasAgreed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('amaze_agreement_accepted') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchData = async () => {
    try {
      const user = await api.auth.me();
      if (user && user.id) {
        const orderData = await api.orders.getUserOrders(user.id);
        setOrders(orderData.orders);
      }
    } catch {
      console.error("Error fetching user data for chat");
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await customerServiceChat(userMessage, messages, orders);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: 'Rất tiếc, tôi không thể kết nối được với máy chủ. Vui lòng thử lại sau.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAgree = () => {
    localStorage.setItem('amaze_agreement_accepted', 'true');
    setHasAgreed(true);
    alert("Cảm ơn! Bạn đã xác nhận đồng ý với các điều khoản của AmazeBid.");
  };

  if (!isOpen) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'CHAT':
        return (
          <div className="flex flex-col h-full animate-in slide-in-from-right-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="text-purple-600"/> Trợ lý AI Thông minh
                </h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-100">
                    <Sparkles size={12} className="animate-pulse" />
                    Powered by Gemini 3.1 Pro
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-2xl border border-gray-200 mb-4 space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                msg.role === 'user' ? 'bg-[#131921] text-white' : 'bg-purple-100 text-purple-600'
                            }`}>
                                {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={18} />}
                            </div>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-[#131921] text-white rounded-tr-none' 
                                : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                <Bot size={18} />
                            </div>
                            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2 text-gray-400">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-xs italic">Đang suy nghĩ...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
                <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Nhập câu hỏi của bạn (vd: Đơn hàng ĐH-123 của tôi đâu?)"
                    className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
                <button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white p-3 rounded-xl transition-all shadow-md active:scale-95"
                >
                    <Send size={20} />
                </button>
            </div>
            
            <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider w-full mb-1">Gợi ý câu hỏi:</span>
                {['Trạng thái đơn hàng', 'Chính sách trả hàng', 'Làm sao để khiếu nại?', 'Phí ship tính thế nào?'].map(hint => (
                    <button 
                        key={hint}
                        onClick={() => setInputValue(hint)}
                        className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-full border border-gray-200 transition-colors"
                    >
                        {hint}
                    </button>
                ))}
            </div>
          </div>
        );
      case 'GUIDE':
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Book className="text-[#febd69]"/> Hướng dẫn sử dụng AmazeBid</h2>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="font-bold text-lg mb-2">1. Mua hàng (Fixed Price)</h3>
              <p className="text-sm text-gray-600">Chọn sản phẩm có nhãn "Mua ngay". Nhấn "Thêm vào giỏ" và tiến hành thanh toán. Tiền của bạn sẽ được giữ an toàn bởi hệ thống cho đến khi bạn nhận được hàng.</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="font-bold text-lg mb-2">2. Đấu giá (Auction)</h3>
              <p className="text-sm text-gray-600">Sản phẩm đấu giá có đồng hồ đếm ngược. Bạn cần đặt giá cao hơn giá hiện tại ít nhất một bước giá. Nếu thắng, bạn có 24h để thanh toán.</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="font-bold text-lg mb-2">3. Livestream & Affiliate</h3>
              <p className="text-sm text-gray-600">Tham gia Live Studio để bán hàng trực tiếp. Bạn cũng có thể lấy hàng từ Kho Affiliate để bán và hưởng hoa hồng mà không cần nhập hàng.</p>
            </div>
          </div>
        );

      case 'PAYMENT':
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><CreditCard className="text-[#febd69]"/> Quy tắc thanh toán</h2>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="font-bold text-blue-800">Cơ chế AmazeBid SafePay™</p>
              <p className="text-sm text-blue-700 mt-1">Mọi giao dịch đều qua trung gian. Người bán KHÔNG nhận được tiền ngay lập tức. Tiền chỉ được giải ngân sau khi người mua xác nhận "Đã nhận hàng & Hài lòng".</p>
            </div>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mt-4">
                <li>Hỗ trợ thẻ Visa/Mastercard/JCB nội địa và quốc tế.</li>
                <li>Hỗ trợ chuyển khoản ngân hàng (xác thực tự động).</li>
                <li>Hỗ trợ Ví điện tử (Momo, ZaloPay) và Crypto (USDT).</li>
                <li><strong>Người mua:</strong> Không mất phí giao dịch.</li>
                <li><strong>Người bán:</strong> Phí sàn 5% trên mỗi đơn hàng thành công.</li>
            </ul>
          </div>
        );

      case 'PACKAGING':
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Package className="text-[#febd69]"/> Quy cách đóng gói</h2>
            <p className="text-gray-600 italic mb-4">Người bán chịu trách nhiệm hoàn toàn về sự nguyên vẹn của hàng hóa khi đến tay người mua.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border p-4 rounded-lg">
                    <h4 className="font-bold text-gray-900 mb-2">Hàng dễ vỡ</h4>
                    <p className="text-sm text-gray-600">Bắt buộc quấn 3-4 lớp xốp hơi (bubble wrap). Dùng thùng carton cứng, chèn kín các khe hở bằng xốp hoặc giấy vụn. Dán tem "Hàng dễ vỡ".</p>
                </div>
                <div className="border p-4 rounded-lg">
                    <h4 className="font-bold text-gray-900 mb-2">Đồ điện tử</h4>
                    <p className="text-sm text-gray-600">Bọc nilon chống thấm nước trước khi đóng hộp. Tháo pin nếu có thể (đối với thiết bị dùng pin rời).</p>
                </div>
                <div className="border p-4 rounded-lg">
                    <h4 className="font-bold text-gray-900 mb-2">Quần áo/Vải vóc</h4>
                    <p className="text-sm text-gray-600">Gấp gọn, bọc trong túi nilon kín miệng để tránh ẩm mốc hoặc nước trong quá trình vận chuyển.</p>
                </div>
            </div>
            <div className="mt-4 bg-yellow-50 p-3 rounded text-sm text-yellow-800 font-bold border border-yellow-200">
                Lưu ý: Quay video quá trình đóng gói để làm bằng chứng nếu có tranh chấp xảy ra.
            </div>
          </div>
        );

      case 'SHIPPING':
        return (
           <div className="space-y-6 animate-in slide-in-from-right-4">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Truck className="text-[#febd69]"/> Quy tắc Gửi & Nhận hàng</h2>
            
            <div className="space-y-4">
                <div className="bg-white p-4 shadow-sm border rounded-lg">
                    <h3 className="font-bold text-[#131921] border-b pb-2 mb-2">Quy trình Gửi hàng (Người bán)</h3>
                    <ul className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                        <li>Xác nhận đơn hàng trong vòng 24h.</li>
                        <li>Đóng gói theo quy chuẩn.</li>
                        <li>Giao cho đơn vị vận chuyển được AmazeBid chỉ định trong vòng 48h.</li>
                        <li>Cập nhật trạng thái "Đã gửi" lên hệ thống.</li>
                    </ul>
                </div>

                <div className="bg-white p-4 shadow-sm border rounded-lg">
                    <h3 className="font-bold text-[#131921] border-b pb-2 mb-2">Quy trình Nhận hàng (Người mua)</h3>
                    <ul className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                        <li><strong>Đồng kiểm:</strong> Được phép kiểm tra ngoại quan (không thử hàng) khi nhận.</li>
                        <li><strong>Quay video:</strong> BẮT BUỘC quay video mở hộp (uncut) để làm bằng chứng khiếu nại.</li>
                        <li><strong>Xác nhận:</strong> Nhấn "Đã nhận hàng" trong vòng 3 ngày kể từ khi nhận. Sau 3 ngày, hệ thống tự động xác nhận.</li>
                    </ul>
                </div>
            </div>
           </div>
        );

      case 'RETURN':
        return (
           <div className="space-y-6 animate-in slide-in-from-right-4">
             <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><RefreshCw className="text-[#febd69]"/> Quy tắc Trả hàng & Hoàn tiền</h2>
             <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3">
                 <AlertTriangle className="text-red-600 shrink-0"/>
                 <div>
                     <p className="font-bold text-red-800">Thời hạn khiếu nại: 3 ngày</p>
                     <p className="text-sm text-red-700">Kể từ lúc đơn vị vận chuyển báo giao hàng thành công.</p>
                 </div>
             </div>

             <div className="space-y-4 mt-2">
                 <h3 className="font-bold text-gray-900">Lý do chấp nhận trả hàng:</h3>
                 <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 pl-4">
                     <li>Hàng không đúng mô tả (sai màu, sai size, sai mẫu).</li>
                     <li>Hàng bị bể vỡ, hư hỏng trong quá trình vận chuyển.</li>
                     <li>Hàng giả/nhái (cần bằng chứng xác thực).</li>
                     <li>Thiếu phụ kiện kèm theo.</li>
                 </ul>

                 <h3 className="font-bold text-gray-900 mt-4">Chi phí trả hàng:</h3>
                 <p className="text-sm text-gray-700">
                    - <strong>Lỗi người bán/Vận chuyển:</strong> Người bán hoặc Đơn vị vận chuyển chịu phí.<br/>
                    - <strong>Người mua đổi ý:</strong> Không hỗ trợ trả hàng (trừ khi người bán đồng ý, người mua chịu 100% phí ship 2 chiều).
                 </p>
             </div>
           </div>
        );

      case 'TAX':
        return (
            <div className="space-y-6 animate-in slide-in-from-right-4">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Scale className="text-[#febd69]"/> Quy định Khai báo thuế Tự chủ</h2>
                <div className="bg-gray-100 p-6 rounded-xl border border-gray-200 text-center">
                    <p className="text-gray-800 font-medium mb-4">
                        AmazeBid là nền tảng trung gian kết nối. Chúng tôi không chịu trách nhiệm kê khai và nộp thuế thu nhập cá nhân (TNCN) thay cho người bán (trừ các khoản thuế sàn TMĐT bắt buộc khấu trừ tại nguồn nếu luật pháp quy định).
                    </p>
                    <div className="text-left bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="font-bold text-[#131921] mb-2">Trách nhiệm của Người bán:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                            <li>Cá nhân kinh doanh có doanh thu trên 100 triệu đồng/năm thuộc diện chịu thuế GTGT và TNCN.</li>
                            <li>Tự chủ động đăng ký mã số thuế cá nhân.</li>
                            <li>Tự kê khai doanh thu phát sinh từ AmazeBid vào tờ khai thuế hàng năm.</li>
                            <li>Lưu trữ chứng từ giao dịch để phục vụ thanh tra thuế khi cần thiết.</li>
                        </ul>
                    </div>
                </div>
            </div>
        );

      case 'AGREEMENT':
        return (
            <div className="h-full flex flex-col animate-in slide-in-from-right-4">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><FileText className="text-[#febd69]"/> Hợp đồng Thỏa thuận Người dùng</h2>
                
                {/* Scrollable Agreement Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50 border border-gray-300 p-6 rounded-xl mb-4 text-justify text-sm leading-relaxed custom-scrollbar shadow-inner">
                    <h3 className="font-bold text-center mb-4 uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br/>Độc lập - Tự do - Hạnh phúc<br/>---</h3>
                    <h4 className="font-bold text-center mb-6">THỎA THUẬN CUNG CẤP VÀ SỬ DỤNG DỊCH VỤ TMĐT AMAZEBID</h4>

                    <p className="mb-3"><strong>Điều 1: Định nghĩa</strong><br/>AmazeBid là sàn giao dịch thương mại điện tử...</p>
                    
                    <p className="mb-3"><strong>Điều 2: Quyền và nghĩa vụ của người dùng</strong><br/>
                    1. Người dùng cam kết cung cấp thông tin chính xác, trung thực.<br/>
                    2. Người dùng chịu trách nhiệm bảo mật tài khoản và mật khẩu.<br/>
                    3. Không sử dụng dịch vụ vào mục đích lừa đảo, phát tán nội dung đồi trụy, vi phạm pháp luật.<br/>
                    4. Tôn trọng quyền sở hữu trí tuệ của AmazeBid và các bên thứ ba.</p>

                    <p className="mb-3"><strong>Điều 3: Chính sách giao dịch</strong><br/>
                    Mọi giao dịch trên AmazeBid tuân thủ quy chế hoạt động đã được công bố. AmazeBid đóng vai trò trung gian thanh toán SafePay để bảo vệ quyền lợi hai bên.</p>

                    <p className="mb-3"><strong>Điều 4: Miễn trừ trách nhiệm</strong><br/>
                    AmazeBid không chịu trách nhiệm về chất lượng hàng hóa thực tế (trừ hàng Mall), tuy nhiên chúng tôi hỗ trợ giải quyết tranh chấp công bằng dựa trên bằng chứng.</p>

                    <p className="mb-3"><strong>Điều 5: Cam kết thuế</strong><br/>
                    Người bán cam kết tự chịu trách nhiệm về nghĩa vụ thuế đối với nhà nước theo quy định hiện hành.</p>

                    <p className="mb-3"><strong>Điều 6: Điều khoản thi hành</strong><br/>
                    Thỏa thuận này có hiệu lực kể từ khi người dùng bấm nút "Tôi đồng ý". AmazeBid có quyền sửa đổi bổ sung thỏa thuận và sẽ thông báo trước 5 ngày.</p>
                    
                    <br/><br/>
                    <p className="italic text-center text-gray-500">Bản cập nhật ngày 01/01/2024</p>
                </div>

                {/* Footer Action */}
                <div className="bg-white border-t pt-4 flex flex-col items-center gap-3">
                    {hasAgreed ? (
                        <div className="flex flex-col items-center text-green-600 animate-in zoom-in">
                            <ShieldCheck size={48} className="mb-2"/>
                            <p className="font-bold text-lg">Bạn đã ký xác nhận thỏa thuận này.</p>
                            <p className="text-xs text-gray-500">Hiệu lực từ: {new Date().toLocaleDateString()}</p>
                        </div>
                    ) : (
                        <div className="w-full">
                            <p className="text-xs text-center text-gray-500 mb-3">Vui lòng đọc kỹ toàn bộ nội dung trước khi xác nhận.</p>
                            <button 
                                onClick={handleAgree}
                                className="w-full bg-[#131921] hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={20} /> TÔI ĐÃ ĐỌC VÀ ĐỒNG Ý
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="relative bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-[#f3f4f6] border-r border-gray-200 flex flex-col shrink-0">
            <div className="p-5 border-b border-gray-200 bg-white">
                <h2 className="font-bold text-xl text-[#131921] flex items-center gap-2">
                    Dịch vụ KH
                </h2>
                <p className="text-xs text-gray-500">Trung tâm hỗ trợ & Pháp lý</p>
            </div>
            
            <nav className="p-4 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                {TOPICS.map(topic => (
                    <button
                        key={topic.id}
                        onClick={() => setActiveTab(topic.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-between transition-all ${
                            activeTab === topic.id 
                            ? 'bg-[#131921] text-white shadow-md' 
                            : 'text-gray-600 hover:bg-white hover:shadow-sm'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <topic.icon size={18} className={topic.color} />
                            {topic.title}
                        </div>
                        {activeTab === topic.id && <ChevronRight size={14}/>}
                    </button>
                ))}
            </nav>
            
            {hasAgreed && (
                <div className="p-4 bg-green-50 m-4 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2 text-green-800 font-bold text-xs mb-1">
                        <ShieldCheck size={14} /> Trạng thái tài khoản
                    </div>
                    <p className="text-xs text-green-700">Đã xác thực hợp đồng pháp lý.</p>
                </div>
            )}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col relative h-full">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full z-10">
                <X size={24} />
            </button>
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                {renderContent()}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerServiceModal;
