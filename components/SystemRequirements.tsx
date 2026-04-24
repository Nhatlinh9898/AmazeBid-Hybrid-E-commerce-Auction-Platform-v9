import React, { useState } from 'react';
import { 
  Server, 
  Cpu, 
  Wifi, 
  Smartphone, 
  Monitor, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Zap,
  Activity,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SystemRequirements: React.FC = () => {
  const [hardwareInfo] = useState<{
    cores: number;
    memory?: number;
    online: boolean;
    platform: string;
  }>({
    cores: navigator.hardwareConcurrency || 0,
    online: navigator.onLine,
    platform: navigator.platform
  });

  const [activeTab, setActiveTab] = useState<'SELLER' | 'ADMIN' | 'BUYER'>('BUYER');

  const requirements = {
    BUYER: {
      title: "Cấu hình Người mua (Bidders)",
      desc: "Dành cho người dùng tham gia đấu giá, xem livestream.",
      specs: [
        { label: "Thiết bị", val: "Smartphone (iOS/Android) hoặc Laptop", icon: <Smartphone size={16}/> },
        { label: "Trình duyệt", val: "Chrome, Safari, Edge (Bản mới nhất)", icon: <Activity size={16}/> },
        { label: "Băng thông", val: "Tối thiểu 5Mbps (Ổn định 4G/Wifi)", icon: <Wifi size={16}/> },
        { label: "AI Feature", val: "Edge AI hỗ trợ lọc bình luận rác", icon: <Zap size={16}/> },
      ],
      score: "Phù hợp mọi thiết bị di động"
    },
    SELLER: {
      title: "Cấu hình Người bán (Livestreamers)",
      desc: "Dành cho Seller cần chạy AI phân tích khách hàng và stream 4K.",
      specs: [
        { label: "CPU", val: "Intel Core i5 / Apple M1 trở lên", icon: <Cpu size={16}/> },
        { label: "RAM", val: "Tối thiểu 8GB (Khuyến nghị 16GB)", icon: <HardDrive size={16}/> },
        { label: "Băng thông", val: "Upload > 20Mbps (Cáp quang cá nhân)", icon: <Wifi size={16}/> },
        { label: "AI Feature", val: "Chạy Transformers.js (Edge AI) mượt mà", icon: <Zap size={16}/> },
      ],
      score: "Cần máy tính cấu hình trung bình - khá"
    },
    ADMIN: {
      title: "Cấu hình Máy chủ (Admin Relay)",
      desc: "Dành cho quản trị viên vận hành Relay Node và DB trung tâm.",
      specs: [
        { label: "CPU", val: "Tối thiểu 4 Cores (Xeon hoặc i7)", icon: <Server size={16}/> },
        { label: "RAM", val: "Tối thiểu 16GB ECC", icon: <HardDrive size={16}/> },
        { label: "Băng thông", val: "Upload/Download 100Mbps (IP Tĩnh)", icon: <Wifi size={16}/> },
        { label: "Uptime", val: "24/7 (Cần UPS hoặc Cloud VPS)", icon: <CheckCircle2 size={16}/> },
      ],
      score: "Yêu cầu hạ tầng máy chủ chuyên dụng"
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <div className="flex items-center gap-2 text-indigo-600 font-bold mb-2">
            <Monitor size={20} />
            <span className="uppercase tracking-widest text-xs">Phòng kỹ thuật AmazeBid</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
            Yêu cầu Cấu hình <br/> & Khả năng Vận hành
          </h1>
          <p className="mt-4 text-gray-500 max-w-xl text-sm sm:text-base leading-relaxed">
            Hệ thống của chúng tôi sử dụng công nghệ P2P Mesh từ Google. Hãy chọn vai trò của bạn để xem gợi ý cấu hình phù hợp nhất.
          </p>
        </header>

        {/* Current Device Check */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 mb-8 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity size={120} />
          </div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-6">
            <CheckCircle2 size={18} className="text-green-500" /> 
            Kiểm tra thiết bị của bạn
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">CPU Cores</p>
              <p className="text-xl font-black text-indigo-600">{hardwareInfo.cores || 'N/A'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Internet</p>
              <p className={`text-xl font-black ${hardwareInfo.online ? 'text-green-600' : 'text-red-500'}`}>
                {hardwareInfo.online ? 'ONLINE' : 'OFFLINE'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Nền tảng</p>
              <p className="text-sm font-bold text-gray-700 truncate">{hardwareInfo.platform}</p>
            </div>
            <div className="p-4 bg-indigo-600 rounded-2xl border border-indigo-700 text-white shadow-lg shadow-indigo-200">
              <p className="text-[10px] uppercase font-bold opacity-70 mb-1">Sức mạnh Ước tính</p>
              <p className="text-xl font-black">
                {hardwareInfo.cores > 4 ? 'EXCELLENT' : hardwareInfo.cores > 2 ? 'GOOD' : 'FAIR'}
              </p>
            </div>
          </div>
        </div>

        {/* Role Selector */}
        <div className="flex p-1 bg-gray-200 rounded-2xl mb-6">
          {(['BUYER', 'SELLER', 'ADMIN'] as const).map(role => (
            <button
              key={role}
              onClick={() => setActiveTab(role)}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                activeTab === role 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {role === 'BUYER' ? 'Người mua' : role === 'SELLER' ? 'Người bán' : 'Quản trị viên'}
            </button>
          ))}
        </div>

        {/* Requirements Card */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 relative overflow-hidden">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.2 }}
             >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                   <div>
                      <h2 className="text-2xl font-black text-gray-900">{requirements[activeTab].title}</h2>
                      <p className="text-gray-500 text-sm mt-1">{requirements[activeTab].desc}</p>
                   </div>
                   <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black self-start">
                      Đánh giá: {requirements[activeTab].score}
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {requirements[activeTab].specs.map((spec, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 group hover:border-indigo-200 transition-colors">
                      <div className="p-3 bg-white rounded-xl text-indigo-500 shadow-sm group-hover:scale-110 transition-transform">
                        {spec.icon}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">{spec.label}</p>
                        <p className="text-sm font-bold text-gray-900">{spec.val}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Technical Insight */}
                <div className="mt-8 p-6 bg-[#131921] rounded-2xl text-white">
                  <h4 className="flex items-center gap-2 font-bold mb-3">
                    <Info size={16} className="text-indigo-400" />
                    Tại sao cấu hình này quan trọng?
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {activeTab === 'ADMIN' ? (
                      "Máy chủ Relay chịu trách nhiệm điều phối hàng ngàn kết nối P2P đồng thời. Băng thông ổn định giúp giảm độ trễ (latency) khi người dùng đặt thầu trong những giây cuối. RAM ECC giúp ngăn ngừa lỗi dữ liệu khi hệ thống chạy 24/7."
                    ) : activeTab === 'SELLER' ? (
                      "Khi bạn livestream, AmazeBid chạy mô hình AI (Transformers.js) ngay trên trình duyệt của bạn để nhận diện khuôn mặt và cảm xúc khách hàng. CPU/RAM mạnh giúp AI phản hồi ngay lập tức mà không làm lag luồng video."
                    ) : (
                      "Người mua chỉ cần một trình duyệt hiện đại. Toàn bộ logic đấu giá được xử lý cực nhẹ, ưu tiên tiết kiệm pin cho điện thoại nhưng vẫn đảm bảo hiển thị giá thầu theo thời gian thực (Real-time)."
                    )}
                  </p>
                </div>
             </motion.div>
           </AnimatePresence>
        </div>

        {/* FAQ Footer */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
           <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                 <AlertTriangle size={20} />
              </div>
              <div>
                 <h5 className="font-bold text-gray-900 mb-1 text-sm">Điện thoại có chạy được không?</h5>
                 <p className="text-xs text-gray-500 leading-relaxed">
                   **Hoàn toàn được!** Chúng tôi hỗ trợ 100% các tính năng mua sắm, đấu giá và cả Livestream từ smartphone. Chỉ cần Safari hoặc Chrome.
                 </p>
              </div>
           </div>
           <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                 <Zap size={20} />
              </div>
              <div>
                 <h5 className="font-bold text-gray-900 mb-1 text-sm">Offline có dùng được không?</h5>
                 <p className="text-xs text-gray-500 leading-relaxed">
                   Cơ chế P2P cho phép bạn xem thông tin sản phẩm đã cache ngay cả khi mạng chập chờn. Tuy nhiên đặt thầu cần có internet ổn định.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SystemRequirements;
