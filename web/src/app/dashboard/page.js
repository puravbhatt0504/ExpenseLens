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
  AlertCircle,
  TrendingDown,
  Scale
} from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';

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

      <div className="flex-1 overflow-y-auto p-10 bg-surface">
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
      </div>
    </>
  );
}
