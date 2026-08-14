'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { HugeiconsIcon, TransactionIcon, ArrowUpRight01Icon, ArrowDownRight01Icon, FilterIcon, Calendar03Icon, Receipt01Icon } from '@hugeicons/react';
import CategoryIcon from '../../components/CategoryIcon';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ReceiptIndianRupeeIcon,
  HexagonIcon,
  AlertCircleIcon,
  PlusSignIcon,
  Delete02Icon,
} from '@hugeicons/core-free-icons';
import useSWR from 'swr';
import api, { fetcher } from '@/lib/api';
import AddTransactionModal from '@/components/AddTransactionModal';
import SmoothScroll from '@/components/SmoothScroll';

export default function TransactionsPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: transactions, error, isLoading: loading, mutate } = useSWR(`/transactions?month=${currentMonth}`, fetcher, {
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

  const formatCurrency = (amount) => `₹${Number(amount).toFixed(2)}`;
  const monthName = new Date(`${currentMonth}-01`).toLocaleString('default', { month: 'long', year: 'numeric' });

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.delete(`/transactions/${id}`);
        mutate();
      } catch (err) {
        console.error('Failed to delete transaction:', err);
        alert('Failed to delete transaction.');
      }
    }
  };

  return (
    <>
      <header className="flex justify-between items-center bg-white h-16 px-10 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">Transactions</h1>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2 mr-4 text-xs py-1.5">
            <HugeiconsIcon icon={PlusSignIcon} size={14} color="white" strokeWidth={1.75} /> Add Transaction
          </button>
          <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded-md border border-border bg-white text-text-muted hover:bg-surface transition-colors"><HugeiconsIcon icon={ChevronLeftIcon} size={16} color="currentColor" strokeWidth={1.75} /></button>
          <span className="text-sm font-semibold w-[140px] text-center">{monthName}</span>
          <button onClick={() => shiftMonth(1)} className="p-1.5 rounded-md border border-border bg-white text-text-muted hover:bg-surface transition-colors"><HugeiconsIcon icon={ChevronRightIcon} size={16} color="currentColor" strokeWidth={1.75} /></button>
        </div>
      </header>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => mutate()} 
      />

      <SmoothScroll className="flex-1 overflow-y-auto p-10 bg-surface">
        <div className="max-w-[1000px] mx-auto bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          
          <div className="p-6 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-foreground">
              <HugeiconsIcon icon={ReceiptIndianRupeeIcon} size={20} color="currentColor" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Ledger</h2>
              <p className="text-sm font-medium text-text-muted">All recorded transactions for {monthName}</p>
            </div>
            
            <div className="ml-auto flex bg-surface p-1 rounded-lg border border-border">
              <button 
                onClick={() => setSortBy('date')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${sortBy === 'date' ? 'bg-white shadow-sm text-foreground' : 'text-text-muted hover:text-foreground'}`}
              >
                By Date
              </button>
              <button 
                onClick={() => setSortBy('category')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${sortBy === 'category' ? 'bg-white shadow-sm text-foreground' : 'text-text-muted hover:text-foreground'}`}
              >
                By Category
              </button>
            </div>
          </div>

          <div className="flex-1 p-0">
            {loading ? (
              <div className="flex h-full justify-center items-center py-20">
                <div className="animate-spin text-text-muted"><HugeiconsIcon icon={HexagonIcon} size={32} color="currentColor" strokeWidth={1.75} /></div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#e00] text-sm font-medium">
                <HugeiconsIcon icon={AlertCircleIcon} size={24} color="currentColor" strokeWidth={1.75} className="opacity-50 mb-2" />
                Failed to load transactions.
              </div>
            ) : (!transactions || transactions.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-20 text-text-muted text-sm font-medium">
                <HugeiconsIcon icon={AlertCircleIcon} size={24} color="currentColor" strokeWidth={1.75} className="opacity-50 mb-2" />
                No transactions recorded this month.
              </div>
            ) : (
              <motion.div 
                className="w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <table className="w-full text-left text-sm font-medium">
                  <thead className="bg-surface text-text-muted sticky top-0">
                    <tr>
                      <th className="py-3 px-6 font-semibold border-b border-border">Date</th>
                      <th className="py-3 px-6 font-semibold border-b border-border">Merchant / Note</th>
                      <th className="py-3 px-6 font-semibold border-b border-border">Category</th>
                      <th className="py-3 px-6 font-semibold border-b border-border">Payment Method</th>
                      <th className="py-3 px-6 font-semibold border-b border-border text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...transactions].sort((a, b) => {
                      if (sortBy === 'category') {
                        const catA = a.category_name || 'Uncategorized';
                        const catB = b.category_name || 'Uncategorized';
                        if (catA < catB) return -1;
                        if (catA > catB) return 1;
                        return new Date(b.txn_date) - new Date(a.txn_date);
                      }
                      return new Date(b.txn_date) - new Date(a.txn_date);
                    }).map((txn, i) => {
                      const date = new Date(txn.txn_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                      return (
                        <motion.tr 
                          key={txn.id} 
                          className="border-b border-border/50 hover:bg-surface/50 transition-colors"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.2 }}
                        >
                          <td className="py-4 px-6 text-text-muted">{date}</td>
                          <td className="py-4 px-6 text-foreground font-semibold">
                            {txn.merchant || txn.note || 'Untitled'}
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-2 font-semibold">
                              <span className="w-5 h-5 rounded-full flex items-center justify-center bg-surface border border-border text-[10px] shadow-sm shrink-0"
                                style={{ color: txn.category_color || '#000' }}
                              >
                                <CategoryIcon icon={txn.category_icon} className="w-3.5 h-3.5" />
                              </span>
                              {txn.category_name || 'Uncategorized'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-text-muted capitalize text-xs">
                            {txn.payment_method || (txn.source ? txn.source.replace('_', ' ') : 'Cash')}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-3">
                              <span className="font-bold text-foreground">{formatCurrency(txn.amount)}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(txn.id); }}
                                className="p-1.5 text-text-muted hover:text-[#e00] hover:bg-[#e00]/10 rounded-md transition-colors"
                                title="Delete Transaction"
                              >
                                <HugeiconsIcon icon={Delete02Icon} size={16} color="currentColor" strokeWidth={1.75} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </motion.div>
            )}
          </div>
        </div>
      </SmoothScroll>
    </>
  );
}
