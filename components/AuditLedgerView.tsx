import React from 'react';
import { Download, ShieldCheck, Search, ArrowDownLeft, ArrowUpRight, Scale, Clock } from 'lucide-react';
import { ledger } from '../services/TransactionLedger';
import { TransactionRecord } from '../src/types';

const AuditLedgerView: React.FC = () => {
  const [transactions, setTransactions] = React.useState<TransactionRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');

  const loadData = async () => {
    setLoading(true);
    const data = await ledger.getAuditHistory();
    setTransactions(data);
    setLoading(false);
  };

  const generateDemoTx = async () => {
    const adminId = 'SUPER-ADMIN-01';
    await ledger.commitTransaction(
      adminId,
      'AUDIT-TEST-NODE',
      1500,
      'TRANSFER',
      { referenceCode: 'AUDIT-DEMO' }
    );
    loadData();
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const filteredTransactions = transactions.filter(tx => 
    tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.senderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.receiverId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 backdrop-blur-xl">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-3">
            <Scale className="text-indigo-400" /> Nhật Ký Giao Dịch Truy Xuất (Compliance Ledger)
          </h3>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">
            Số liệu được ký điện tử SHA-256 & Lưu trữ phi tập trung
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={generateDemoTx}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-black uppercase tracking-widest text-amber-500 transition-all border border-slate-700 shadow-lg"
          >
            <Clock size={14} /> Demo Audit Log
          </button>
          <button 
            onClick={loadData}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-all border border-slate-700"
          >
            <Clock size={16} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-indigo-500/20">
            <Download size={14} /> Xuất Báo Cáo (CSV)
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        <input 
          type="text"
          placeholder="Tìm kiếm bằng Mã giao dịch, ID người gửi/nhận..."
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-separate border-spacing-y-3">
          <thead>
            <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4">
              <th className="pb-2">Trạng thái</th>
              <th className="pb-2">ID Giao Dịch</th>
              <th className="pb-2">Người Gửi/Nhận</th>
              <th className="pb-2">Số tiền</th>
              <th className="pb-2">Loại</th>
              <th className="pb-2 text-right">Mã Băm (Hash)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="h-16 bg-slate-800/30 rounded-2xl"></td>
                </tr>
              ))
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center text-slate-500 italic text-sm">
                  Chưa có dữ liệu giao dịch nào được ghi nhận.
                </td>
              </tr>
            ) : filteredTransactions.map((tx) => (
              <tr key={tx.id} className="bg-slate-950/40 hover:bg-slate-800/40 transition-all group">
                <td className="p-4 rounded-l-2xl border-y border-l border-slate-800/50">
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400">
                    <ShieldCheck size={12} /> {tx.status}
                  </span>
                </td>
                <td className="p-4 border-y border-slate-800/50">
                  <div className="flex flex-col">
                    <span className="text-xs font-mono text-white">{tx.id}</span>
                    <span className="text-[9px] text-slate-500">{new Date(tx.timestamp).toLocaleString()}</span>
                  </div>
                </td>
                <td className="p-4 border-y border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <ArrowUpRight size={10} className="text-rose-400" /> {tx.senderId.substring(0, 12)}...
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <ArrowDownLeft size={10} className="text-emerald-400" /> {tx.receiverId.substring(0, 12)}...
                      </span>
                    </div>
                  </div>
                </td>
                <td className="p-4 border-y border-slate-800/50">
                  <span className="text-sm font-black text-white">${tx.amount.toLocaleString()}</span>
                </td>
                <td className="p-4 border-y border-slate-800/50">
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-lg font-bold">
                    {tx.type}
                  </span>
                </td>
                <td className="p-4 rounded-r-2xl border-y border-r border-slate-800/50 text-right">
                  <code className="text-[9px] text-slate-600 font-mono group-hover:text-amber-400/50 transition-all">
                    {tx.metadata.hash.substring(0, 16)}...
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLedgerView;
