import React, { useState } from 'react';
import { X, ShieldCheck, Upload, Camera, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { User } from '../types';
import { emailService } from '../services/EmailService';

interface KYCModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const KYCModal: React.FC<KYCModalProps> = ({ isOpen, onClose, user }) => {
  const [step, setStep] = useState(1);
  const [kycType, setKycType] = useState<'PERSONAL' | 'BUSINESS'>('PERSONAL');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles].slice(0, 3)); // Max 3 files
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Simulate API call and AI Processing
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      if (user) {
        // Simulate sending KYC approval email after a short delay
        setTimeout(() => {
          emailService.sendKYCStatusNotification(user, 'APPROVED');
        }, 2000);
      }
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <ShieldCheck size={28} className="text-blue-200" />
            <div>
              <h2 className="text-xl font-bold">Xác minh danh tính (KYC)</h2>
              <p className="text-blue-100 text-xs mt-1">Bảo mật bằng mã hóa AES-256</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Đã gửi yêu cầu KYC</h3>
              <p className="text-gray-500 max-w-md">
                Hệ thống AI đang xử lý và đối chiếu thông tin của bạn với cơ sở dữ liệu quốc gia. Quá trình này thường mất từ 5-15 phút.
              </p>
              <div className="mt-8 bg-blue-50 border border-blue-100 p-4 rounded-xl text-left max-w-md w-full">
                <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2 mb-2">
                  <ShieldCheck size={16} /> Cam kết bảo mật
                </h4>
                <ul className="text-xs text-blue-800 space-y-2 list-disc pl-4">
                  <li>Tài liệu của bạn đã được mã hóa và lưu trữ an toàn.</li>
                  <li>Hệ thống tự động đóng dấu bản quyền (Watermark) lên hình ảnh.</li>
                  <li>Dữ liệu nhạy cảm sẽ tự động xóa sau khi xác minh hoàn tất.</li>
                </ul>
              </div>
              <button 
                onClick={onClose}
                className="mt-8 bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
              >
                Đóng cửa sổ
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Step 1: Select Type */}
              {step === 1 && (
                <div className="animate-in slide-in-from-right-4">
                  <h3 className="font-bold text-lg text-gray-800 mb-4">1. Chọn loại tài khoản</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div 
                      onClick={() => setKycType('PERSONAL')}
                      className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                        kycType === 'PERSONAL' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                        <FileText size={24} />
                      </div>
                      <h4 className="font-bold text-gray-800">Cá nhân</h4>
                      <p className="text-xs text-gray-500 mt-2">Xác minh bằng CCCD/CMND hoặc Hộ chiếu. Dành cho người dùng và người bán cá nhân.</p>
                    </div>
                    
                    <div 
                      onClick={() => setKycType('BUSINESS')}
                      className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                        kycType === 'BUSINESS' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck size={24} />
                      </div>
                      <h4 className="font-bold text-gray-800">Doanh nghiệp</h4>
                      <p className="text-xs text-gray-500 mt-2">Xác minh bằng Giấy phép ĐKKD và Mã số thuế. Dành cho cửa hàng, công ty.</p>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={() => setStep(2)}
                      className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                    >
                      Tiếp tục
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Upload Documents */}
              {step === 2 && (
                <div className="animate-in slide-in-from-right-4 space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-800 font-bold text-sm">
                      &larr; Quay lại
                    </button>
                    <h3 className="font-bold text-lg text-gray-800">2. Tải lên giấy tờ</h3>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-bold text-yellow-900 text-sm">Yêu cầu hình ảnh</h4>
                      <p className="text-xs text-yellow-700 mt-1">
                        Hình ảnh phải rõ nét, không bị chói sáng, không bị cắt góc. Hệ thống AI sẽ tự động từ chối nếu phát hiện ảnh chụp lại từ màn hình hoặc có dấu hiệu chỉnh sửa.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      {kycType === 'PERSONAL' ? 'Ảnh mặt trước & mặt sau CCCD + Ảnh chân dung (Selfie)' : 'Giấy phép ĐKKD + Giấy tờ tùy thân người đại diện'}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    
                    {files.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        {files.map((file, idx) => (
                          <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square bg-gray-50 flex items-center justify-center">
                            {file.type.startsWith('image/') ? (
                              <img src={URL.createObjectURL(file)} alt="Document" className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="text-gray-400" size={32} />
                            )}
                            <button 
                              type="button"
                              onClick={() => removeFile(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            >
                              <X size={14} />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 truncate px-2">
                              {file.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {files.length < 3 && (
                      <div className="grid grid-cols-2 gap-3">
                        <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                          <Upload size={24} className="text-blue-500 mb-2" />
                          <p className="font-bold text-gray-700 text-xs">Tải lên file</p>
                          <input type="file" multiple accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
                        </label>
                        
                        <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                          <Camera size={24} className="text-blue-500 mb-2" />
                          <p className="font-bold text-gray-700 text-xs">Chụp ảnh</p>
                          <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={handleSubmit}
                      disabled={files.length === 0 || isSubmitting}
                      className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                        files.length === 0 || isSubmitting
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                      }`}
                    >
                      {isSubmitting ? (
                        <><Loader2 size={18} className="animate-spin" /> Đang mã hóa & gửi...</>
                      ) : (
                        'Gửi yêu cầu xác minh'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYCModal;
