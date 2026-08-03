'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  Hexagon, 
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Receipt,
  Wallet,
  AlertCircle
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

  const formatCurrency = (amount) => `₹${Number(amount).toFixed(0)}`;
  const monthName = new Date(`${currentMonth}-01`).toLocaleString('default', { month: 'long', year: 'numeric' });

  // Custom Tooltip for the Pie Chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-border p-3 rounded-lg shadow-md text-sm font-medium">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: data.categoryColor || '#000' }}>{data.categoryIcon}</span>
            <span>{data.categoryName}</span>
          </div>
          <p className="font-bold">{formatCurrency(data.amount)}</p>
        </div>
      );
    }
    return null;
  };

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

      <div className="flex-1 overflow-y-auto p-10">
        <div className="max-w-[1200px] mx-auto">
          {loading ? (
            <div className="flex flex-1 justify-center items-center h-[60vh]">
              <div className="animate-spin text-text-muted"><Hexagon size={32} /></div>
            </div>
          ) : summary ? (
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Total Spend */}
              <div className="lg:col-span-2 bg-white border border-border rounded-xl p-8 flex flex-col shadow-sm">
                <div className="text-sm font-medium text-text-muted flex items-center gap-2 mb-2">
                  <TrendingUp size={16} /> Total Spend
                </div>
                <h2 className="text-5xl font-bold tracking-tight mb-8">{formatCurrency(summary.total)}</h2>
                
                {summary.totalBudget && (
                  <div className="mt-auto">
                    <div className="flex justify-between mb-2 text-sm font-medium">
                      <span className="text-text-muted">Budget: {formatCurrency(summary.totalBudget)}</span>
                      <span className={summary.total > summary.totalBudget ? 'text-[#e00]' : 'text-foreground'}>
                        {((summary.total / summary.totalBudget) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-surface rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min((summary.total / summary.totalBudget) * 100, 100)}%`,
                          background: summary.total > summary.totalBudget ? '#e00' : '#000'
                        }} 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="bg-white border border-border rounded-xl p-8 flex flex-col shadow-sm">
                <div className="text-sm font-medium text-text-muted flex items-center gap-2 mb-auto">
                  <Receipt size={16} /> Activity
                </div>
                <div>
                  <span className="text-5xl font-bold tracking-tight">
                    {summary.count}
                  </span>
                  <p className="text-text-muted text-sm font-medium mt-1">Transactions this month</p>
                </div>
              </div>

              {/* Category Breakdown & Pie Chart */}
              <div className="bg-white border border-border rounded-xl p-8 flex flex-col shadow-sm lg:col-span-3">
                <div className="text-sm font-medium text-text-muted flex items-center gap-2 mb-6">
                  <Wallet size={16} /> Breakdown
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                  {summary.byCategory.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-text-muted text-sm font-medium">
                      <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                      No spending recorded for this month.
                    </div>
                  ) : (
                    <>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={summary.byCategory}
                              dataKey="amount"
                              nameKey="categoryName"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              stroke="none"
                            >
                              {summary.byCategory.map((cat, index) => (
                                <Cell key={`cell-${index}`} fill={cat.categoryColor || '#000'} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
                        {summary.byCategory.map((cat, i) => (
                          <div key={cat.categoryId || i} className="flex items-center gap-4 p-3 rounded-lg border border-border/50 bg-surface/50">
                            <div className="w-8 h-8 rounded-full bg-white border border-border flex justify-center items-center text-sm shadow-sm" style={{ color: cat.categoryColor || '#000' }}>
                              {cat.categoryIcon}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-end mb-1">
                                <span className="font-semibold text-sm">{cat.categoryName}</span>
                                <span className="font-bold text-sm">{formatCurrency(cat.amount)}</span>
                              </div>
                              {cat.budget && (
                                <div className="h-1 bg-border rounded-full overflow-hidden mt-2">
                                  <div 
                                    className="h-full transition-all duration-500"
                                    style={{ 
                                      width: `${Math.min((cat.amount / cat.budget) * 100, 100)}%`,
                                      background: cat.amount > cat.budget ? '#e00' : (cat.categoryColor || '#000')
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
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
