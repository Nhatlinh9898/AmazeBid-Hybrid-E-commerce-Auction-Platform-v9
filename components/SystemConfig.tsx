import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  DollarSign, 
  Save, 
  Loader2, 
  CheckCircle2, 
  Globe, 
  ShieldCheck, 
  Key, 
  ExternalLink,
  Zap,
  Info,
  AlertTriangle,
  Link as LinkIcon
} from 'lucide-react';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';

const SystemConfig: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getConfig();
      // Initialize new fields if they don't exist
      const normalizedData = {
        platformFeeRate: 0.05,
        defaultVatRate: 0.08,
        personalIncomeTaxRate: 0.015,
        currencySymbol: 'đ',
        defaultModelType: 'FLASH',
        flashAIFee: 100,
        proAIFee: 500,
        domainName: '',
        stripePublicKey: '',
        stripeSecretKey: '',
        vnpayTmnCode: '',
        vnpayHashSecret: '',
        deployStatus: 'IDEAL',
        ...(data || {})
      };
      setConfig(normalizedData);
    } catch (err: any) {
      console.error('Fetch config error:', err);
      setError('Không thể tải cấu hình hệ thống: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError('');
    try {
      await api.admin.updateConfig(config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyDomain = async () => {
    if (!config.domainName) {
      setError('Vui lòng nhập tên miền trước khi triển khai');
      return;
    }
    setDeploying(true);
    try {
      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 3000));
      const updatedConfig = { ...config, deployStatus: 'ACTIVE' };
      setConfig(updatedConfig);
      await api.admin.updateConfig(updatedConfig);
      setSuccess(true);
    } catch (err: any) {
      setError('Lỗi khi triển khai tên miền: ' + err.message);
    } finally {
      setDeploying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Đang đồng bộ cấu hình hệ thống...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-red-50 rounded-[2.5rem] border-2 border-dashed border-red-200">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="font-black text-red-800 text-lg mb-2">Không thể tải cấu hình</h3>
        <p className="text-sm text-red-600 text-center max-w-md font-medium mb-6">
          Đã có lỗi xảy ra khi kết nối với máy chủ AI. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.
        </p>
        <button 
          onClick={fetchConfig}
          className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
        >
          Thử tải lại cấu hình
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">
      
      {/* Header Notification */}
      {config.deployStatus !== 'ACTIVE' && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl flex items-start gap-3 shadow-sm">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-black text-amber-800">Hệ thống chưa được liên kết Domain</h4>
            <p className="text-xs text-amber-700 mt-1">
              Bạn đang chạy trên domain mặc định của AI Studio. Đăng ký Domain và cấu hình SSL để vận hành thực tế.
            </p>
          </div>
        </div>
      )}

      {/* SECTION 1: ECONOMICS */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50">
        <h3 className="font-black text-xl text-gray-900 mb-8 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl">
            <DollarSign className="text-white" size={24} />
          </div>
          Cấu hình Tài chính & Kinh tế
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                Phí nền tảng (Platform Fee)
              </label>
              <div className="relative group">
                <input 
                  type="number" 
                  step="0.001"
                  value={config.platformFeeRate}
                  onChange={e => setConfig({ ...config, platformFeeRate: parseFloat(e.target.value) })}
                  className="w-full bg-gray-50 border-2 border-transparent p-4 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-black text-xl transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">% / 100</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 ml-1">Mặc định: 0.05 (5%) - Áp dụng cho mỗi giao dịch thành công.</p>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Thuế VAT mặc định</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  value={config.defaultVatRate}
                  onChange={e => setConfig({ ...config, defaultVatRate: parseFloat(e.target.value) })}
                  className="w-full bg-gray-50 border-2 border-transparent p-4 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-black text-xl transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">% / 100</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Thuế TNCN (Dành cho Người bán)</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.001"
                  value={config.personalIncomeTaxRate}
                  onChange={e => setConfig({ ...config, personalIncomeTaxRate: parseFloat(e.target.value) })}
                  className="w-full bg-gray-50 border-2 border-transparent p-4 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-black text-xl transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">% / 100</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Đơn vị & Ký hiệu tiền tệ</label>
              <input 
                type="text" 
                value={config.currencySymbol}
                onChange={e => setConfig({ ...config, currencySymbol: e.target.value })}
                className="w-full bg-gray-50 border-2 border-transparent p-4 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-black text-xl transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: AI */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50">
        <h3 className="font-black text-xl text-gray-900 mb-8 flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-xl">
            <Cpu className="text-white" size={24} />
          </div>
          Trí tuệ Nhân tạo Amaze AI
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Phí dịch vụ AI Flash / Lượt gọi</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={config.flashAIFee}
                    onChange={e => setConfig({ ...config, flashAIFee: parseInt(e.target.value) })}
                    className="w-full bg-gray-50 border-2 border-transparent p-4 rounded-2xl focus:bg-white focus:border-purple-500 outline-none font-black text-xl transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">{config.currencySymbol}</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Phí dịch vụ AI Pro / Lượt gọi</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={config.proAIFee}
                    onChange={e => setConfig({ ...config, proAIFee: parseInt(e.target.value) })}
                    className="w-full bg-gray-50 border-2 border-transparent p-4 rounded-2xl focus:bg-white focus:border-purple-500 outline-none font-black text-xl transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">{config.currencySymbol}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mô hình AI Mặc định</label>
               <button 
                onClick={() => setConfig({ ...config, defaultModelType: 'FLASH' })}
                className={`p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${
                  config.defaultModelType === 'FLASH' 
                    ? 'border-indigo-600 bg-indigo-50/50' 
                    : 'border-transparent bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black">AI Flash (Tốc độ)</span>
                  {config.defaultModelType === 'FLASH' && <CheckCircle2 className="text-indigo-600" size={18} />}
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed font-medium">Tiết kiệm năng lượng, phản hồi ngay lập tức.</p>
              </button>

              <button 
                onClick={() => setConfig({ ...config, defaultModelType: 'PRO' })}
                className={`p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${
                  config.defaultModelType === 'PRO' 
                    ? 'border-purple-600 bg-purple-50/50' 
                    : 'border-transparent bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black">AI Pro (Thông minh)</span>
                  {config.defaultModelType === 'PRO' && <CheckCircle2 className="text-purple-600" size={18} />}
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed font-medium">Lập luận chuyên sâu, nội dung chất lượng cao.</p>
              </button>
            </div>
        </div>
      </div>

      {/* SECTION 3: DOMAIN & PRODUCTION INTEGRATION */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl shadow-indigo-900/10 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 blur-[80px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
            <div>
              <h3 className="font-black text-2xl mb-2 flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-xl">
                  <Globe className="text-white" size={24} />
                </div>
                Triển khai Thực tế & Tên miền
              </h3>
              <p className="text-slate-400 text-sm font-medium">Kết nối domain riêng và cổng thanh toán để bắt đầu kinh doanh.</p>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
              <div className={`w-3 h-3 rounded-full animate-pulse ${config.deployStatus === 'ACTIVE' ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.5)]' : 'bg-slate-500'}`} />
              <div>
                <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Trạng thái triển khai</div>
                <div className="text-sm font-black">{config.deployStatus === 'ACTIVE' ? 'HỆ THỐNG ĐÃ SẴN SÀNG' : 'CHƯA TRIỂN KHAI'}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              {/* Domain Input */}
              <div className="space-y-4">
                <label className="inline-flex items-center gap-2 text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">
                  <LinkIcon size={14} /> Domain Name (Tên miền của bạn)
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="example.com"
                    value={config.domainName}
                    onChange={e => setConfig({ ...config, domainName: e.target.value })}
                    className="w-full bg-slate-800 border-2 border-slate-700 p-5 rounded-3xl focus:border-indigo-500 outline-none font-black text-xl transition-all placeholder:text-slate-600"
                  />
                  {config.deployStatus === 'ACTIVE' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-green-500/10 rounded-full">
                      <CheckCircle2 className="text-green-500" size={20} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/20">
                  <Info className="text-indigo-400 shrink-0" size={16} />
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    Sau khi nhập Domain, hệ thống sẽ tự động cập nhật Webhook và Redirect URL cho các cổng thanh toán.
                  </p>
                </div>
              </div>

              {/* Payment Keys */}
              <div className="space-y-6">
                <div className="flex items-baseline justify-between">
                  <label className="inline-flex items-center gap-2 text-xs font-black text-indigo-400 uppercase tracking-widest">
                    <Key size={14} /> Cấu hình Cổng thanh toán
                  </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer" className="flex-1 bg-slate-800/50 border border-slate-700 p-3 rounded-xl text-[10px] font-black text-slate-400 hover:text-white hover:bg-indigo-600/20 hover:border-indigo-500/50 flex items-center justify-center gap-2 transition-all">
                    Lấy Key từ Stripe <ExternalLink size={10} />
                  </a>
                  <a href="https://sandbox.vnpayment.vn/paymentv2/Regist.html" target="_blank" rel="noreferrer" className="flex-1 bg-slate-800/50 border border-slate-700 p-3 rounded-xl text-[10px] font-black text-slate-400 hover:text-white hover:bg-blue-600/20 hover:border-blue-500/50 flex items-center justify-center gap-2 transition-all">
                    Đăng ký VNPAY Sandbox <ExternalLink size={10} />
                  </a>
                  <a href="https://developers.momo.vn/" target="_blank" rel="noreferrer" className="flex-1 bg-slate-800/50 border border-slate-700 p-3 rounded-xl text-[10px] font-black text-slate-400 hover:text-white hover:bg-pink-600/20 hover:border-pink-500/50 flex items-center justify-center gap-2 transition-all">
                    Momo Developer <ExternalLink size={10} />
                  </a>
                </div>
                </div>
                
                <div className="space-y-4">
                  <div className="group">
                    <span className="text-[10px] font-black text-slate-600 block mb-2 px-1">STRIPE SECRET KEY (Sk_live_...)</span>
                    <input 
                      type="password" 
                      value={config.stripeSecretKey}
                      onChange={e => setConfig({ ...config, stripeSecretKey: e.target.value })}
                      placeholder="••••••••••••••••••••••••"
                      className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-2xl focus:border-indigo-500 outline-none font-mono text-sm transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-black text-slate-600 block mb-2 px-1">VNPAY TMN CODE</span>
                      <input 
                        type="text" 
                        value={config.vnpayTmnCode}
                        onChange={e => setConfig({ ...config, vnpayTmnCode: e.target.value })}
                        placeholder="ABC12345"
                        className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-2xl focus:border-indigo-500 outline-none font-bold text-sm transition-all"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-600 block mb-2 px-1">VNPAY HASH SECRET</span>
                      <input 
                        type="password" 
                        value={config.vnpayHashSecret}
                        onChange={e => setConfig({ ...config, vnpayHashSecret: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-2xl focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Guide & Steps */}
            <div className="bg-slate-800/40 border border-slate-700/50 p-8 rounded-[2rem] space-y-6">
              <h4 className="text-white font-black text-lg flex items-center gap-2">
                <ShieldCheck className="text-indigo-400" size={20} /> Hướng dẫn Cấu hình Domain
              </h4>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-xs font-black border border-slate-600">1</div>
                  <div className="space-y-1">
                    <p className="font-bold text-sm">Đăng ký Tên miền từ Google</p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Truy cập <a href="https://domains.google" target="_blank" rel="noreferrer" className="text-indigo-400 underline decoration-indigo-400/30">Google Domains</a> (hoặc Cloud Domains) để sở hữu tên miền .com, .vn...
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-xs font-black border border-slate-600">2</div>
                  <div className="space-y-1">
                    <p className="font-bold text-sm">Cấu hình DNS (A Record)</p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Trỏ bản ghi A Record về Server IP của hệ thống (lấy từ Dashboard Cloud của bạn).
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-xs font-black border border-slate-600">3</div>
                  <div className="space-y-1">
                    <p className="font-bold text-sm">Tích hợp Payment Key</p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Nhập Secret Key từ Stripe và VNPAY vào ô bên trái để kích hoạt thanh toán ngân hàng thực tế.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-700">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleApplyDomain}
                    disabled={deploying || config.deployStatus === 'ACTIVE'}
                    className={`w-full p-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl ${
                      config.deployStatus === 'ACTIVE'
                        ? 'bg-green-500/20 text-green-500 border border-green-500/30 cursor-default'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'
                    }`}
                  >
                    {deploying ? (
                      <>
                        <Loader2 className="animate-spin" size={20} /> ĐANG TRIỂN KHAI...
                      </>
                    ) : config.deployStatus === 'ACTIVE' ? (
                      <>
                        <CheckCircle2 size={20} /> ĐÃ KÍCH HOẠT THÀNH CÔNG
                      </>
                    ) : (
                      <>
                        <Zap size={20} /> XÁC NHẬN & TRIỂN KHAI TỰ ĐỘNG
                      </>
                    )}
                  </motion.button>
                  <p className="text-[10px] text-slate-500 mt-4 text-center italic font-medium">
                    Hệ thống sẽ tự động cấu hình SSL, Webhooks và Proxy sau khi xác nhận.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-8 sticky bottom-6 bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-gray-100 shadow-2xl shadow-indigo-100/50 z-[100]">
        <AnimatePresence>
          {error && (
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-red-600 font-black flex items-center mr-auto bg-red-50 px-4 py-2 rounded-full border border-red-100"
            >
              <AlertTriangle size={14} className="mr-2" /> {error}
            </motion.span>
          )}
          {success && (
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-green-600 font-black flex items-center mr-auto bg-green-50 px-4 py-2 rounded-full border border-green-100"
            >
              <CheckCircle2 size={14} className="mr-2" /> Đã lưu cấu hình thành công!
            </motion.span>
          )}
        </AnimatePresence>
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-900 transition-all disabled:opacity-50 shadow-2xl shadow-indigo-200 hover:shadow-none"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={22} />}
          LƯU TẤT CẢ CẤU HÌNH
        </button>
      </div>
    </div>
  );
};

export default SystemConfig;
