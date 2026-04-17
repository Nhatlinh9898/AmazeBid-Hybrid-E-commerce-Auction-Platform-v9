import React, { useState } from 'react';
import { Product } from '../types';
import { 
  forecastDemand, suggestCombos, 
  localForecastDemand, localSuggestCombos,
  DemandForecast, ComboSuggestion 
} from '../services/inventoryService';
import { TrendingUp, Wand2, Database, Zap } from 'lucide-react';

interface InventoryDashboardProps {
  products: Product[];
}

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ products }) => {
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [combos, setCombos] = useState<ComboSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'AI' | 'LOCAL'>('LOCAL');

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    try {
      let forecastResult: DemandForecast[] = [];
      let comboResult: ComboSuggestion[] = [];

      if (analysisMode === 'AI') {
        [forecastResult, comboResult] = await Promise.all([
          forecastDemand(products),
          suggestCombos(products)
        ]);
      } else {
        // Run local synchronous analysis
        forecastResult = localForecastDemand(products);
        comboResult = localSuggestCombos(products);
      }
      
      setForecasts(forecastResult);
      setCombos(comboResult);
    } catch (error) {
      console.error("Inventory analysis failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="text-indigo-600" /> Quản lý Kho & Dự báo
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setAnalysisMode('LOCAL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${analysisMode === 'LOCAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Database size={14} /> Nội bộ
            </button>
            <button 
              onClick={() => setAnalysisMode('AI')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${analysisMode === 'AI' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Zap size={14} /> AI Cloud
            </button>
          </div>
          <button 
            onClick={handleRunAnalysis}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              analysisMode === 'LOCAL' 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
            }`}
          >
            <Wand2 size={16} /> {isLoading ? 'Đang phân tích...' : analysisMode === 'LOCAL' ? 'Phân tích Dữ liệu' : 'Chạy AI Phân tích'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold text-sm text-gray-500 mb-4">Dự báo nhập hàng</h3>
          {forecasts.map(f => {
            const product = products.find(p => p.id === f.productId);
            return (
              <div key={f.productId} className="bg-gray-50 p-3 rounded-lg mb-2 border border-gray-100">
                <p className="font-bold text-sm">{product?.title}</p>
                <p className="text-xs text-gray-600">Gợi ý nhập: <span className="font-bold text-indigo-600">{f.suggestedRestockQuantity}</span></p>
                <p className="text-[10px] text-gray-500 mt-1">{f.reason}</p>
              </div>
            );
          })}
        </div>
        <div>
          <h3 className="font-bold text-sm text-gray-500 mb-4">Combo gợi ý</h3>
          {combos.map((c, idx) => (
            <div key={idx} className="bg-gray-50 p-3 rounded-lg mb-2 border border-gray-100">
              <p className="text-xs text-gray-700 mb-1">
                {c.productIds.map(id => products.find(p => p.id === id)?.title).join(' + ')}
              </p>
              <p className="text-[10px] text-gray-500">{c.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;
