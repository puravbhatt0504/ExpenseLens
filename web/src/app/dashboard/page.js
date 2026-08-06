'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { 
  Hexagon, 
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Receipt,
  Wallet,
  TrendingDown,
  Scale,
  PiggyBank,
  X,
  Split
} from 'lucide-react';
import useSWR from 'swr';
import api, { fetcher } from '@/lib/api';
import SmoothScroll from '@/components/SmoothScroll';

const DistributeSavingsModal = ({ isOpen, onClose, netBalance, savings, onSuccess }) => {
  const [allocations, setAllocations] = useState({});
  const [loading, setLoading] = useState(false);

  const { data: userData, mutate: mutateUser } = useSWR('/auth/me', fetcher);
  const autoSplitEnabled = userData?.user?.auto_split_savings || false;

  const toggleAutoSplit = async () => {
    try {
      await api.patch('/auth/me', { auto_split_savings: !autoSplitEnabled });
      mutateUser();
    } catch (err) {
      console.error(err);
      alert("Failed to update setting.");
    }
  };

  useEffect(() => {
    if (isOpen) setAllocations({});
  }, [isOpen]);

  if (!isOpen) return null;

  const activeGoals = savings?.filter(g => g.current_amount < g.target_amount) || [];
  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + (Number(val) || 0), 0);
  const remaining = netBalance - totalAllocated;

  const handleAutoSplit = () => {
    if (activeGoals.length === 0) return;
    const splitAmount = Math.floor((netBalance / activeGoals.length) * 100) / 100;
    const newAllocations = {};
    activeGoals.forEach(g => newAllocations[g.id] = splitAmount);
    setAllocations(newAllocations);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (remaining < 0) return alert("You cannot distribute more than your net balance.");
    setLoading(true);
    try {
      const promises = Object.entries(allocations).map(([id, amount]) => {
        const numAmount = Number(amount);
        if (numAmount > 0) {
          const goal = activeGoals.find(g => g.id === parseInt(id, 10));
          return api.patch(`/savings/${id}`, { current_amount: goal.current_amount + numAmount });
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to distribute savings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[500px] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-border bg-surface/50 flex justify-between items-center">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <PiggyBank size={20} className="text-[#0284c7]" /> Distribute Savings
          </h2>
          <button onClick={onClose} className="p-2 text-text-muted hover:bg-surface rounded-md"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-6">
          <div className="flex justify-between items-center bg-[#e0f2fe] text-[#0284c7] p-4 rounded-xl">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">Remaining to Allocate</p>
              <p className="text-2xl font-extrabold">₹{remaining.toFixed(2)}</p>
            </div>
            <button type="button" onClick={handleAutoSplit} className="bg-white text-[#0284c7] px-4 py-2 rounded-lg font-bold shadow-sm hover:shadow-md transition-shadow text-sm flex items-center gap-2">
              <Split size={16} /> Auto-Split Equally
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {activeGoals.length === 0 ? (
              <p className="text-text-muted text-sm text-center">No active goals to fund.</p>
            ) : (
              activeGoals.map(goal => (
                <div key={goal.id} className="flex justify-between items-center gap-4">
                  <div className="flex-1 truncate">
                    <p className="font-bold text-foreground text-sm truncate">{goal.icon || '🎯'} {goal.name}</p>
                    <p className="text-xs text-text-muted">₹{goal.current_amount} / ₹{goal.target_amount}</p>
                  </div>
                  <div className="relative w-1/3">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold text-sm">₹</span>
                    <input type="number" step="0.01" min="0" max={netBalance} className="w-full pl-7 pr-3 py-2 rounded-lg border border-border focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] outline-none transition-all font-semibold text-sm" value={allocations[goal.id] || ''} onChange={e => setAllocations({...allocations, [goal.id]: e.target.value})} placeholder="0.00" />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border mt-2">
            <div>
              <p className="font-bold text-sm text-foreground">Auto-Split Every Month</p>
              <p className="text-xs text-text-muted">Automatically split your net balance equally on the last day of every month.</p>
            </div>
            <button
              type="button"
              onClick={toggleAutoSplit}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoSplitEnabled ? 'bg-[#10b981]' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoSplitEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex justify-end pt-4 border-t border-border mt-2">
            <button type="submit" disabled={loading || remaining < 0 || totalAllocated <= 0} className="bg-[#0284c7] text-white px-6 py-2.5 rounded-lg font-bold disabled:opacity-50 transition-opacity">
              {loading ? 'Saving...' : 'Confirm Distribution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function DashboardOverview() {
  const router = useRouter();
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: summary, error, isLoading: loading } = useSWR(`/summary?month=${currentMonth}`, fetcher, {
    onError: (err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    }
  });

  const { data: savings, isLoading: loadingSavings, mutate: mutateSavings } = useSWR('/savings', fetcher);
  const [isDistributeOpen, setIsDistributeOpen] = useState(false);

  const shiftMonth = (offset) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const d = new Date(year, month - 1 + offset, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const monthName = new Date(`${currentMonth}-01`).toLocaleString('default', { month: 'long', year: 'numeric' });

  // Custom Tooltip for the Pie Chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-border p-3 rounded-lg shadow-md text-sm font-medium">
          {data.categoryName ? (
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: data.categoryColor || '#000' }}>{data.categoryIcon}</span>
              <span>{data.categoryName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <span>{data.name}</span>
            </div>
          )}
          <p className="font-bold">{formatCurrency(data.amount)}</p>
        </div>
      );
    }
    return null;
  };

  const netBalance = summary ? summary.totalIncome - summary.total : 0;
  
  const barChartData = summary ? [
    { name: 'Income', amount: summary.totalIncome, fill: '#10b981' },
    { name: 'Spend', amount: summary.total, fill: '#ef4444' },
  ] : [];

  return (
    <>
      <header className="flex justify-between items-center bg-white h-16 px-10 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">Overview</h1>
        
        <div className="flex items-center gap-2">
          <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded-md border border-border bg-white text-text-muted hover:bg-surface transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold w-[140px] text-center">{monthName}</span>
          <button onClick={() => shiftMonth(1)} className="p-1.5 rounded-md border border-border bg-white text-text-muted hover:bg-surface transition-colors"><ChevronRight size={16} /></button>
        </div>
      </header>

      <DistributeSavingsModal 
        isOpen={isDistributeOpen} 
        onClose={() => setIsDistributeOpen(false)} 
        netBalance={Math.max(0, netBalance)} 
        savings={savings} 
        onSuccess={mutateSavings} 
      />

      <SmoothScroll className="flex-1 overflow-y-auto p-10 bg-surface">
        <div className="max-w-[1200px] mx-auto">
          {loading ? (
            <div className="flex flex-1 justify-center items-center h-[60vh]">
              <div className="animate-spin text-text-muted"><Hexagon size={32} /></div>
            </div>
          ) : summary ? (
            <motion.div 
              className="flex flex-col gap-6"
              initial="hidden" animate="show"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
            >
              
              {/* TOP METRICS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                  <div className="text-sm font-bold text-text-muted flex items-center gap-2 mb-4 uppercase tracking-wider">
                    <Scale size={16} className="text-[#0284c7]" /> Net Balance
                  </div>
                  <h2 className={`text-4xl font-extrabold tracking-tight ${netBalance >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {netBalance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netBalance))}
                  </h2>
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                  <div className="text-sm font-bold text-text-muted flex items-center gap-2 mb-4 uppercase tracking-wider">
                    <TrendingUp size={16} className="text-[#10b981]" /> Total Income
                  </div>
                  <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
                    {formatCurrency(summary.totalIncome)}
                  </h2>
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                  <div className="text-sm font-bold text-text-muted flex items-center gap-2 mb-4 uppercase tracking-wider">
                    <TrendingDown size={16} className="text-[#ef4444]" /> Total Spend
                  </div>
                  <h2 className="text-4xl font-extrabold tracking-tight text-foreground mb-4">
                    {formatCurrency(summary.total)}
                  </h2>
                  {summary.totalBudget && (
                    <div className="mt-auto">
                      <div className="flex justify-between mb-2 text-xs font-bold uppercase">
                        <span className="text-text-muted">Budget: {formatCurrency(summary.totalBudget)}</span>
                        <span className={summary.total > summary.totalBudget ? 'text-[#e00]' : 'text-[#10b981]'}>
                          {((summary.total / summary.totalBudget) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min((summary.total / summary.totalBudget) * 100, 100)}%`,
                            background: summary.total > summary.totalBudget ? '#ef4444' : '#10b981'
                          }} 
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* SAVINGS ROW */}
              {!loadingSavings && savings && savings.length > 0 && (
                <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-sm font-bold text-text-muted flex items-center gap-2 uppercase tracking-wider">
                      <PiggyBank size={16} className="text-[#0284c7]" /> Active Savings Goals
                    </div>
                    {netBalance > 0 && (
                      <button 
                        onClick={() => setIsDistributeOpen(true)}
                        className="bg-[#0284c7] text-white px-3 py-1.5 rounded-md font-semibold flex items-center gap-2 text-xs hover:bg-[#0369a1] transition-colors"
                      >
                        <Split size={14} /> Distribute Savings
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savings.map(goal => {
                      const progress = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
                      const isComplete = progress >= 100;
                      return (
                        <div key={goal.id} className="p-4 rounded-xl border border-border/50 bg-surface/30 flex flex-col gap-3 hover:bg-surface transition-colors cursor-pointer" onClick={() => router.push('/dashboard/savings')}>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{goal.icon || '🎯'}</span>
                            <span className="font-bold text-foreground truncate">{goal.name}</span>
                          </div>
                          <div>
                            <div className="flex justify-between items-end mb-1">
                              <span className={`font-extrabold ${isComplete ? 'text-[#10b981]' : 'text-[#0284c7]'}`}>{formatCurrency(goal.current_amount)}</span>
                              <span className="text-xs font-semibold text-text-muted">/ {formatCurrency(goal.target_amount)}</span>
                            </div>
                            <div className="h-2 w-full bg-border/50 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-500 ${isComplete ? 'bg-[#10b981]' : 'bg-[#0284c7]'}`} style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* CHARTS ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Income vs Spend Bar Chart */}
                <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col min-h-[350px]">
                  <div className="text-sm font-bold text-text-muted flex items-center gap-2 mb-6 uppercase tracking-wider">
                    <Wallet size={16} /> Cash Flow
                  </div>
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontWeight: 'bold' }} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,0,0,0.02)'}} />
                        <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={60}>
                          {barChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Category Breakdown & Pie Chart */}
                <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col min-h-[350px]">
                  <div className="text-sm font-bold text-text-muted flex items-center gap-2 mb-6 uppercase tracking-wider">
                    <Receipt size={16} /> Expense Breakdown
                  </div>
                  
                  {summary.byCategory.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-sm font-medium py-10">
                      <AlertCircle size={32} className="opacity-30 mb-3 text-[#ef4444]" />
                      No spending recorded for this month.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center flex-1">
                      <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={summary.byCategory}
                              dataKey="amount"
                              nameKey="categoryName"
                              cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} stroke="none"
                            >
                              {summary.byCategory.map((cat, index) => (
                                <Cell key={`cell-${index}`} fill={cat.categoryColor || '#000'} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-2">
                        {summary.byCategory.map((cat, i) => (
                          <div key={cat.categoryId || i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-surface/30 hover:bg-surface transition-colors">
                            <div className="w-8 h-8 rounded-full bg-white border border-border flex justify-center items-center text-sm shadow-sm shrink-0" style={{ color: cat.categoryColor || '#000' }}>
                              {cat.categoryIcon}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="flex justify-between items-end mb-1">
                                <span className="font-semibold text-xs truncate">{cat.categoryName}</span>
                                <span className="font-extrabold text-xs">{formatCurrency(cat.amount)}</span>
                              </div>
                              {cat.budget && (
                                <div className="h-1 bg-border rounded-full overflow-hidden">
                                  <div 
                                    className="h-full transition-all duration-500"
                                    style={{ 
                                      width: `${Math.min((cat.amount / cat.budget) * 100, 100)}%`,
                                      background: cat.amount > cat.budget ? '#ef4444' : (cat.categoryColor || '#000')
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>

              </div>

            </motion.div>
          ) : (
            <div className="text-center text-sm font-medium text-[#e00] mt-10">Failed to load dashboard data.</div>
          )}
        </div>
      </SmoothScroll>
    </>
  );
}
