import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, Clock, Database, Server, RefreshCw, Play, ShieldAlert, Terminal } from 'lucide-react';
import { cn } from './lib/utils';
import { Job } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<'monitoring' | 'dlq' | 'tests'>('monitoring');
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dlq, setDlq] = useState<Job[]>([]);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setStats(data.stats);
      setJobs(data.jobs);
      setDlq(data.dlq);
    } catch (e: any) {
      console.error(e.message);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 2000);
    return () => clearInterval(interval);
  }, []);

  const submitTask = async (valid: boolean) => {
    const payload = valid ? {
      id: crypto.randomUUID(),
      type: Math.random() > 0.5 ? 'data_analysis' : 'text_summarization',
      priority: 'normal',
      payload: { text: 'Sample input data' },
      timestamp: Date.now()
    } : {
      invalid_field: 'This will fail schema validation'
    };

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Schema Validation Failed:\n${JSON.stringify(data.details, null, 2)}`);
      }
      fetchDashboard();
    } catch (e: any) {
      console.error(e.message);
    }
  };

  const retryJob = async (id: string) => {
    await fetch(`/api/queue/retry/${id}`, { method: 'POST' });
    fetchDashboard();
  };

  const runTests = async () => {
    setIsRunningTests(true);
    setTestLogs(['Starting tests...']);
    try {
      const res = await fetch('/api/tests/run', { method: 'POST' });
      const data = await res.json();
      setTestLogs(data.logs);
    } catch (e: any) {
      setTestLogs(prev => [...prev, `Error running tests: ${e.message}`]);
    } finally {
      setIsRunningTests(false);
      fetchDashboard();
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      processing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      failed: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      dlq: 'bg-red-500/10 text-red-500 border-red-500/20',
    }[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';

    return (
      <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider", styles)}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Activity className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-xl font-semibold text-white tracking-tight">AI Router Dashboard</h1>
          </div>
          <div className="flex gap-4">
            <button onClick={() => submitTask(true)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <Play className="w-4 h-4" /> Submit Valid Task
            </button>
            <button onClick={() => submitTask(false)} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Test Schema Rejection
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Tasks', value: stats?.total || 0, icon: Database, color: 'text-gray-400' },
            { label: 'Pending', value: stats?.pending || 0, icon: Clock, color: 'text-yellow-400' },
            { label: 'Processing', value: stats?.processing || 0, icon: RefreshCw, color: 'text-blue-400' },
            { label: 'Completed', value: stats?.completed || 0, icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'DLQ (Failed)', value: stats?.dlq || 0, icon: AlertCircle, color: 'text-red-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#141414] border border-white/5 rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">{stat.label}</span>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <span className="text-3xl font-light text-white">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-white/10 mb-6">
          {[
            { id: 'monitoring', label: 'Live Monitoring' },
            { id: 'dlq', label: 'Dead Letter Queue' },
            { id: 'tests', label: 'Test Suite & E2E' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "pb-3 text-sm font-medium transition-colors relative",
                activeTab === tab.id ? "text-white" : "text-gray-500 hover:text-gray-300"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-[#141414] border border-white/5 rounded-xl overflow-hidden min-h-[500px]">
          
          {activeTab === 'monitoring' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/20 text-gray-400 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 font-medium">Task ID</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Router</th>
                    <th className="px-6 py-4 font-medium">Attempts</th>
                    <th className="px-6 py-4 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {jobs.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No active tasks</td></tr>
                  ) : jobs.map(job => (
                    <tr key={job.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">{job.id.split('-')[0]}...</td>
                      <td className="px-6 py-4">{job.data.type}</td>
                      <td className="px-6 py-4"><StatusBadge status={job.status} /></td>
                      <td className="px-6 py-4">
                        {job.processedBy ? (
                          <span className="flex items-center gap-2 text-gray-400">
                            <Server className="w-4 h-4" /> {job.processedBy}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4">{job.attempts}/{job.maxAttempts}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(job.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'dlq' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/20 text-gray-400 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 font-medium">Task ID</th>
                    <th className="px-6 py-4 font-medium">Error</th>
                    <th className="px-6 py-4 font-medium">Failed At</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dlq.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">DLQ is empty</td></tr>
                  ) : dlq.map(job => (
                    <tr key={job.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">{job.id}</td>
                      <td className="px-6 py-4 text-red-400">{job.error}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(job.updatedAt).toLocaleTimeString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => retryJob(job.id)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-medium transition-colors"
                        >
                          Retry Task
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-white">Automated Test Suite</h3>
                  <p className="text-sm text-gray-500 mt-1">Runs E2E flow, Schema Validation, and Queue Retry logic.</p>
                </div>
                <button 
                  onClick={runTests}
                  disabled={isRunningTests}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {isRunningTests ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
                  {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
                </button>
              </div>
              
              <div className="flex-1 bg-black rounded-lg border border-white/10 p-4 font-mono text-sm overflow-y-auto">
                {testLogs.length === 0 ? (
                  <div className="text-gray-600 h-full flex items-center justify-center">
                    Click 'Run All Tests' to execute the test suite
                  </div>
                ) : (
                  <div className="space-y-2">
                    {testLogs.map((log, i) => (
                      <div key={i} className={cn(
                        "py-1",
                        log.includes('✅') ? "text-emerald-400" : 
                        log.includes('❌') ? "text-red-400" : 
                        "text-gray-400"
                      )}>
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
