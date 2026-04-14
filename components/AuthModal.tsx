
import React, { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight, Github, Smartphone, Facebook, Chrome, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, loginWithPhone, loginWithSocial, verify2FA } = useAuth();
  
  // Views: 'LOGIN' | 'REGISTER'
  const [view, setView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  // Methods: 'EMAIL' | 'PHONE'
  const [method, setMethod] = useState<'EMAIL' | 'PHONE'>('EMAIL');
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', otp: '', expiresIn: '24h' });
  
  // OTP State
  const [otpSent, setOtpSent] = useState(false);

  // 2FA State
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTwoFactorError('');
    
    try {
        if (view === 'LOGIN') {
            const result = await login(formData.email, formData.password, formData.expiresIn);
            if (result?.twoFactorRequired) {
                setTwoFactorRequired(true);
                setTwoFactorEmail(result.email || formData.email);
                setIsLoading(false);
                return;
            }
        } else {
            await register(formData.name, formData.email, formData.password);
        }
        onClose();
    } catch (error) {
        console.error("Auth error", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTwoFactorError('');
    try {
        const success = await verify2FA(twoFactorEmail, twoFactorCode);
        if (success) {
            onClose();
        } else {
            setTwoFactorError('Mã xác thực không đúng');
        }
    } catch {
        setTwoFactorError('Lỗi xác thực 2 bước');
    } finally {
        setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      if (!otpSent) {
          // Simulate sending OTP
          setTimeout(() => {
              setOtpSent(true);
              setIsLoading(false);
              alert(`Mã OTP giả lập của bạn là: 123456`);
          }, 1000);
      } else {
          // Verify OTP
          try {
            await loginWithPhone(formData.phone, formData.otp);
            onClose();
          } catch(e) {
              console.error(e);
          } finally {
            setIsLoading(false);
          }
      }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'github') => {
      setIsLoading(true);
      try {
          await loginWithSocial(provider);
          onClose();
      } catch (e) {
          console.error(e);
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
        
        {/* Banner */}
        <div className="bg-[#131921] p-6 text-center text-white relative">
            <button onClick={onClose} className="absolute top-4 right-4 hover:bg-white/20 p-1 rounded-full"><X size={20}/></button>
            <h2 className="text-2xl font-bold italic mb-1">Amaze<span className="text-[#febd69]">Bid</span></h2>
            <p className="text-xs text-gray-400">Nền tảng Mua sắm & Đấu giá an toàn</p>
        </div>

        <div className="p-8">
            {/* Method Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button 
                    onClick={() => { setMethod('EMAIL'); setOtpSent(false); }}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${method === 'EMAIL' ? 'bg-white shadow text-[#131921]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Mail size={16}/> Email
                </button>
                <button 
                    onClick={() => { setMethod('PHONE'); setOtpSent(false); }}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${method === 'PHONE' ? 'bg-white shadow text-[#131921]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Smartphone size={16}/> Số điện thoại
                </button>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                {twoFactorRequired ? 'Xác thực 2 bước' : (view === 'LOGIN' ? 'Đăng nhập' : 'Đăng ký tài khoản')}
            </h3>

            {twoFactorRequired ? (
                <form onSubmit={handle2FASubmit} className="space-y-4 animate-in slide-in-from-right">
                    <div className="text-center mb-4">
                        <p className="text-sm text-gray-600">Vui lòng nhập mã 6 số từ ứng dụng Authenticator của bạn.</p>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Mã 6 số"
                            className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:border-[#febd69] outline-none text-center tracking-widest font-mono text-xl"
                            value={twoFactorCode}
                            onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                            required
                            maxLength={6}
                            autoFocus
                        />
                    </div>
                    {twoFactorError && <p className="text-xs text-red-500 text-center font-bold">{twoFactorError}</p>}
                    <button 
                        disabled={isLoading || twoFactorCode.length !== 6}
                        className="w-full bg-[#febd69] hover:bg-[#f3a847] text-black font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? 'Đang xác thực...' : 'Xác nhận'}
                        {!isLoading && <ArrowRight size={18} />}
                    </button>
                    <button 
                        type="button"
                        onClick={() => setTwoFactorRequired(false)}
                        className="w-full text-xs text-gray-500 hover:text-blue-600 underline"
                    >
                        Quay lại đăng nhập
                    </button>
                </form>
            ) : method === 'EMAIL' ? (
                /* EMAIL FORM */
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                    {view === 'REGISTER' && (
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Họ và tên"
                                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:border-[#febd69] outline-none"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                required
                            />
                        </div>
                    )}
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="email" 
                            placeholder="Email"
                            className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:border-[#febd69] outline-none"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            required
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="password" 
                            placeholder="Mật khẩu"
                            className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:border-[#febd69] outline-none"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            required
                        />
                    </div>

                    {view === 'LOGIN' && (
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Duy trì đăng nhập trong:</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { label: '24 Giờ', value: '24h' },
                                    { label: '7 Ngày', value: '7d' },
                                    { label: '30 Ngày', value: '30d' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setFormData({...formData, expiresIn: opt.value})}
                                        className={`py-2 text-xs font-bold rounded-lg border transition-all ${formData.expiresIn === opt.value ? 'bg-[#131921] text-white border-[#131921]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <button 
                        disabled={isLoading}
                        className="w-full bg-[#febd69] hover:bg-[#f3a847] text-black font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? 'Đang xử lý...' : (view === 'LOGIN' ? 'Đăng nhập' : 'Tạo tài khoản')}
                        {!isLoading && <ArrowRight size={18} />}
                    </button>
                </form>
            ) : (
                /* PHONE FORM */
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    {!otpSent ? (
                        <div className="relative animate-in slide-in-from-right">
                            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="tel" 
                                placeholder="Số điện thoại (VD: 0901234567)"
                                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:border-[#febd69] outline-none"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                required
                                pattern="[0-9]{10,11}"
                            />
                        </div>
                    ) : (
                        <div className="relative animate-in slide-in-from-right">
                             <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                             <input 
                                type="text" 
                                placeholder="Nhập mã OTP (123456)"
                                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:border-[#febd69] outline-none tracking-widest font-bold text-center"
                                value={formData.otp}
                                onChange={e => setFormData({...formData, otp: e.target.value})}
                                required
                                maxLength={6}
                            />
                            <p className="text-xs text-center text-gray-500 mt-2">Mã OTP đã được gửi đến {formData.phone}</p>
                        </div>
                    )}

                    <button 
                        disabled={isLoading}
                        className="w-full bg-[#febd69] hover:bg-[#f3a847] text-black font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? 'Đang xử lý...' : (!otpSent ? 'Gửi mã OTP' : 'Xác nhận & Đăng nhập')}
                        {!isLoading && !otpSent && <ArrowRight size={18} />}
                    </button>
                    
                    {otpSent && (
                        <button 
                            type="button"
                            onClick={() => setOtpSent(false)}
                            className="w-full text-xs text-gray-500 hover:text-blue-600 underline"
                        >
                            Đổi số điện thoại
                        </button>
                    )}
                </form>
            )}
            
            {/* Social Login */}
            <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 mb-4">Hoặc tiếp tục với</p>
                <div className="flex gap-3 justify-center">
                    <button 
                        onClick={() => handleSocialLogin('google')}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-bold transition-colors"
                        title="Đăng nhập Google"
                    >
                         <Chrome size={18} className="text-red-500"/>
                    </button>
                    <button 
                        onClick={() => handleSocialLogin('facebook')}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-blue-50 text-sm font-bold transition-colors text-blue-700"
                        title="Đăng nhập Facebook"
                    >
                        <Facebook size={18} />
                    </button>
                    <button 
                        onClick={() => handleSocialLogin('github')}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-800 hover:text-white text-sm font-bold transition-colors"
                        title="Đăng nhập GitHub"
                    >
                        <Github size={18} />
                    </button>
                </div>
            </div>

            {method === 'EMAIL' && (
                <div className="mt-8 text-center text-sm">
                    <span className="text-gray-500">
                        {view === 'LOGIN' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                    </span>
                    <button 
                        onClick={() => setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                        className="text-blue-600 font-bold hover:underline"
                    >
                        {view === 'LOGIN' ? 'Đăng ký ngay' : 'Đăng nhập'}
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
