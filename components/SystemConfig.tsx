import React, { useState, useEffect } from 'react';
import { Settings, Percent, Cpu, DollarSign, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

const SystemConfig: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const data = await api.admin.getConfig();
      setConfig(data);
    } catch {
      setError('Không thể tải cấu hình hệ thống');
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
        <p className="text-sm text-gray-500">Đang tải cấu hình...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Settings className="text-indigo-600" size={20} /> Cấu hình Thuế & Phí Hệ thống
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <Percent size={14} /> Phí nền tảng (Platform Fee)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.001"
                  value={config.platformFeeRate}
                  onChange={e => setConfig({ ...config, platformFeeRate: parseFloat(e.target.value) })}
                  className="w-full border border-gray-200 p-3 rounded-xl focus:border-indigo-500 outline-none font-bold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">% / 100</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Ví dụ: 0.05 tương ứng với 5% phí trên mỗi giao dịch.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <Percent size={14} /> Thuế VAT mặc định
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  value={config.defaultVatRate}
                  onChange={e => setConfig({ ...config, defaultVatRate: parseFloat(e.target.value) })}
                  className="w-full border border-gray-200 p-3 rounded-xl focus:border-indigo-500 outline-none font-bold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">% / 100</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <Percent size={14} /> Thuế TNCN (Personal Income Tax)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.001"
                  value={config.personalIncomeTaxRate}
                  onChange={e => setConfig({ ...config, personalIncomeTaxRate: parseFloat(e.target.value) })}
                  className="w-full border border-gray-200 p-3 rounded-xl focus:border-indigo-500 outline-none font-bold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">% / 100</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <DollarSign size={14} /> Ký hiệu tiền tệ
              </label>
              <input 
                type="text" 
                value={config.currencySymbol}
                onChange={e => setConfig({ ...config, currencySymbol: e.target.value })}
                className="w-full border border-gray-200 p-3 rounded-xl focus:border-indigo-500 outline-none font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Cpu className="text-indigo-600" size={20} /> Cấu hình Trí tuệ Nhân tạo (Amaze AI)
        </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Phí sử dụng AI mỗi lần gọi</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <span className="text-sm font-bold text-gray-700 mb-2 block">AI Flash (Tốc độ)</span>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={config.flashAIFee}
                      onChange={e => setConfig({ ...config, flashAIFee: parseInt(e.target.value) })}
                      className="w-full border border-gray-200 p-2 rounded-lg focus:border-indigo-500 outline-none font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{config.currencySymbol}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <span className="text-sm font-bold text-gray-700 mb-2 block">AI Pro (Thông minh)</span>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={config.proAIFee}
                      onChange={e => setConfig({ ...config, proAIFee: parseInt(e.target.value) })}
                      className="w-full border border-gray-200 p-2 rounded-lg focus:border-indigo-500 outline-none font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{config.currencySymbol}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Cấp độ xử lý mặc định (Default Model)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setConfig({ ...config, defaultModelType: 'FLASH' })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  config.defaultModelType === 'FLASH' 
                    ? 'border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-100' 
                    : 'border-gray-100 hover:border-indigo-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-black text-lg">AI Flash</span>
                  {config.defaultModelType === 'FLASH' && <CheckCircle2 className="text-indigo-600" size={20} />}
                </div>
                <p className="text-xs text-gray-500">Tốc độ cực nhanh, phản hồi tức thì. Phù hợp cho chat và gợi ý từ khóa. Tiết kiệm tài nguyên.</p>
              </button>

              <button 
                onClick={() => setConfig({ ...config, defaultModelType: 'PRO' })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  config.defaultModelType === 'PRO' 
                    ? 'border-purple-600 bg-purple-50 shadow-md shadow-purple-100' 
                    : 'border-gray-100 hover:border-purple-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-black text-lg">AI Pro (Google AI Pro)</span>
                  {config.defaultModelType === 'PRO' && <CheckCircle2 className="text-purple-600" size={20} />}
                </div>
                <p className="text-xs text-gray-500">Sử dụng Gemini 3.1 Pro. Thông minh vượt trội, lập luận phức tạp, viết bài chuẩn SEO chất lượng cao.</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-gray-50/80 backdrop-blur-md p-4 rounded-t-2xl border-t border-gray-100">
        {error && <span className="text-sm text-red-600 font-bold flex items-center mr-auto">⚠️ {error}</span>}
        {success && <span className="text-sm text-green-600 font-bold flex items-center mr-auto">✅ Đã lưu cấu hình thành công!</span>}
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
          Lưu Cấu hình Toàn hệ thống
        </button>
      </div>
    </div>
  );
};

export default SystemConfig;
