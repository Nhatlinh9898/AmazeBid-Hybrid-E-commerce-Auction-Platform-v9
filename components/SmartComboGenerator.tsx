
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Package, DollarSign, TrendingUp, CheckCircle2, ChevronRight, Wand2, RefreshCw, Bot, Share2, Layout } from 'lucide-react';
import { generatePriceBundles, rewriteWithStyle, BundleSchema, StyleProfile, STYLE_PROFILES } from '../services/aiPromptService';
import { Product } from '../types';

interface SmartComboGeneratorProps {
  product: Product;
  onClose: () => void;
}

export const SmartComboGenerator: React.FC<SmartComboGeneratorProps> = ({ product, onClose }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [bundles, setBundles] = React.useState<BundleSchema | null>(null);
  const [selectedStyle, setSelectedStyle] = React.useState<StyleProfile>('AmazeBid');
  const [activeTier, setActiveTier] = React.useState<'budget' | 'standard' | 'premium'>('standard');

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await generatePriceBundles(product.title, `Tạo combo 3 mức giá cho sản phẩm: ${product.title}. Mô tả: ${product.description}`);
      if (result) {
        setBundles(result);
      }
    } catch (error) {
      console.error("Generate Bundles Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyStyle = async (style: StyleProfile) => {
    if (!bundles) return;
    setSelectedStyle(style);
    setIsLoading(true);
    try {
      const restyled = await rewriteWithStyle(bundles, style);
      setBundles(restyled);
    } catch (error) {
      console.error("Restyle Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-black/5 overflow-hidden flex flex-col max-h-[85vh] w-full max-w-4xl">
      {/* Header */}
      <div className="bg-[#131921] p-6 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-lg">
            <Package size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Smart Combo Generator <Sparkles size={18} className="text-[#febd69]" />
            </h2>
            <p className="text-xs text-gray-400">Tạo combo đa tầng & Rewrite theo phong cách bán hàng</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Left Sidebar: Controls */}
        <div className="w-full md:w-72 border-r border-gray-100 p-6 space-y-6 bg-gray-50/50">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Sản phẩm gốc</label>
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
              <img src={product.image} className="w-10 h-10 rounded object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{product.title}</p>
                <p className="text-[10px] text-gray-500">${product.price}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Phong cách nội dung</label>
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(STYLE_PROFILES) as StyleProfile[]).map((style) => (
                <button
                  key={style}
                  onClick={() => handleApplyStyle(style)}
                  disabled={!bundles || isLoading}
                  className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    selectedStyle === style 
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200 hover:bg-indigo-50'
                  } disabled:opacity-50`}
                >
                  {style.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {!bundles && (
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            >
              {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <Wand2 size={20} />}
              {isLoading ? 'Đang phân tích...' : 'Tạo Combo Ngay'}
            </button>
          )}

          {bundles && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-[10px] text-emerald-700 font-bold uppercase mb-2">AI Insights</p>
              <p className="text-xs text-emerald-600 leading-relaxed italic">
                "{bundles.intent}"
              </p>
            </div>
          )}
        </div>

        {/* Right Content: Preview */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-white">
          <AnimatePresence mode="wait">
            {!bundles ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-300">
                  <Layout size={40} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Sẵn sàng tạo Combo</h3>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto">AI sẽ phân tích sản phẩm và đề xuất 3 mức giá phù hợp với nhu cầu khách hàng.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Tier Switcher */}
                <div className="flex p-1 bg-gray-100 rounded-2xl border border-gray-200">
                  {(['budget', 'standard', 'premium'] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setActiveTier(tier)}
                      className={`flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                        activeTier === tier 
                          ? 'bg-white text-indigo-600 shadow-sm' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>

                {/* Bundle Display */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-3xl border border-indigo-100 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-2xl font-black text-gray-900 mb-1 capitalize">{activeTier} Combo</h4>
                        <p className="text-sm text-indigo-600 font-medium">Được tối ưu bởi {selectedStyle} Engine</p>
                      </div>
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-indigo-50">
                        <DollarSign className="text-indigo-600" size={24} />
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Sản phẩm trong gói</p>
                      <div className="grid grid-cols-1 gap-3">
                        {bundles.bundles[activeTier].items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                            <span className="text-sm font-medium text-gray-800">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Lợi ích nổi bật</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {bundles.bundles[activeTier].benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sales Copy */}
                  <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Bot size={100} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                          <TrendingUp size={18} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-300">Sales Copy (Styled)</span>
                      </div>
                      <p className="text-lg font-medium leading-relaxed font-serif italic text-gray-100">
                        "{bundles.bundles[activeTier].sales_copy_styled || bundles.bundles[activeTier].sales_copy_raw}"
                      </p>
                      <div className="mt-8 flex gap-4">
                        <button className="flex-1 bg-white text-black py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                          <Share2 size={18} /> Đăng lên Feed
                        </button>
                        <button className="flex-1 bg-indigo-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors">
                          <CheckCircle2 size={18} /> Áp dụng cho Shop
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
