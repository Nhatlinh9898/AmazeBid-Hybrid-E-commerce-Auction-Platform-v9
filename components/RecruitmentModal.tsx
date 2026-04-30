import React from 'react';
import { X, Briefcase, CheckCircle2, DollarSign, Calendar, MapPin, Sparkles, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { PhysicalStore } from '../types';

interface JobPosition {
  id: string;
  title: string;
  type: 'Full-time' | 'Part-time';
  salary: string;
  description: string;
  requirements: string[];
}

interface RecruitmentModalProps {
  store: PhysicalStore;
  onClose: () => void;
}

const RecruitmentModal: React.FC<RecruitmentModalProps> = ({ store, onClose }) => {
  const [selectedJob, setSelectedJob] = React.useState<JobPosition | null>(null);
  const [isApplying, setIsApplying] = React.useState(false);

  const defaultJobs: JobPosition[] = [
    {
      id: '1',
      title: 'Nhân viên Phục vụ (Server)',
      type: 'Part-time',
      salary: '25.000 - 30.000 đ/giờ',
      description: 'Chào đón khách hàng, ghi nhận order và đảm bảo trải nghiệm khách hàng tại bàn chu đáo.',
      requirements: ['Giao tiếp tốt', 'Nhanh nhẹn', 'Thái độ tích cực']
    },
    {
      id: '2',
      title: 'Thu ngân (Cashier)',
      type: 'Full-time',
      salary: '6.000.000 - 8.000.000 đ/tháng',
      description: 'Thanh toán hóa đơn qua POS AmazeBid, hỗ trợ khách hàng đăng ký thành viên.',
      requirements: ['Cẩn thận', 'Trung thực', 'Sử dụng máy tính cơ bản']
    },
    {
      id: '3',
      title: 'Pha chế (Barista)',
      type: 'Full-time',
      salary: '7.000.000 - 9.000.000 đ/tháng',
      description: 'Chuẩn bị đồ uống theo công thức tiêu chuẩn của cửa hàng.',
      requirements: ['Có kinh nghiệm pha chế', 'Yêu thích ngành F&B', 'Sáng tạo']
    }
  ];

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setSelectedJob(null);
      alert('Đã gửi hồ sơ ứng tuyển thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-indigo-950 text-white">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-amber-400" />
              Cơ Hội Nghề Nghiệp tại {store.name}
            </h2>
            <p className="text-indigo-300 text-sm font-bold mt-1">Gia nhập đội ngũ năng động và phát triển bền vững</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: General Info & Perks */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Đãi ngộ tại cửa hàng
                </h3>
                <div className="space-y-4">
                  {(store.perks && store.perks.length > 0 ? store.perks : ['Bảo hiểm đầy đủ', 'Thưởng doanh số', 'Môi trường Pro', 'Đào tạo lộ trình']).map((perk, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-50 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-600 font-bold">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2">Thông tin chung</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
                    <MapPin className="w-4 h-4" /> {store.address}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
                    <Calendar className="w-4 h-4" /> Tuyển dụng liên tục
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Job List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Các vị trí hiện có</h3>
              <div className="space-y-4">
                {defaultJobs.map(job => (
                  <motion.div 
                    key={job.id}
                    whileHover={{ scale: 1.02 }}
                    className={`bg-white p-6 rounded-3xl border transition-all cursor-pointer ${
                      selectedJob?.id === job.id ? 'border-indigo-600 shadow-xl shadow-indigo-50' : 'border-gray-100 hover:border-indigo-200'
                    }`}
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-black text-gray-900">{job.title}</h4>
                      <span className="px-3 py-1 bg-gray-100 text-[10px] font-black uppercase rounded-full">{job.type}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1 font-bold text-indigo-600">
                        <DollarSign className="w-3 h-3" /> {job.salary}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{job.description}</p>
                    
                    {selectedJob?.id === job.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="border-t border-gray-100 pt-4"
                      >
                        <h5 className="text-xs font-black text-gray-900 uppercase mb-3">Yêu cầu:</h5>
                        <ul className="grid grid-cols-2 gap-2 mb-6">
                          {job.requirements.map((req, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-gray-500">
                              <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                              </div>
                              {req}
                            </li>
                          ))}
                        </ul>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApply();
                          }}
                          disabled={isApplying}
                          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                        >
                          {isApplying ? (
                            <><Sparkles className="w-4 h-4 animate-spin" /> Đang gửi...</>
                          ) : (
                            <><Send className="w-4 h-4" /> Ứng tuyển ngay</>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 font-bold">
            Mọi thắc mắc vui lòng liên hệ Hotline: <span className="text-indigo-900">{store.phone || '1900 xxxx'}</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RecruitmentModal;
