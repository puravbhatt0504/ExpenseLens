'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ChevronLeft,
  ChevronRight,
  Receipt,
  Hexagon,
  AlertCircle,
  Plus
} from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import AddTransactionModal from '@/components/AddTransactionModal';
import SmoothScroll from '@/components/SmoothScroll';

export default function TransactionsPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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

  return (
    <>
      <header className="flex justify-between items-center bg-white h-16 px-10 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">Transactions</h1>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2 mr-4 text-xs py-1.5">
            <Plus size={14} /> Add Transaction
          </button>
          <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded-md border border-border bg-white text-text-muted hover:bg-surface transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold w-[140px] text-center">{monthName}</span>
          <button onClick={() => shiftMonth(1)} className="p-1.5 rounded-md border border-border bg-white text-text-muted hover:bg-surface transition-colors"><ChevronRight size={16} /></button>
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
              <Receipt size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Ledger</h2>
              <p className="text-sm font-medium text-text-muted">All recorded transactions for {monthName}</p>
            </div>
          </div>

          <div className="flex-1 p-0">
            {loading ? (
              <div className="flex h-full justify-center items-center py-20">
                <div className="animate-spin text-text-muted"><Hexagon size={32} /></div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#e00] text-sm font-medium">
                <AlertCircle size={24} className="opacity-50 mb-2" />
                Failed to load transactions.
              </div>
            ) : (!transactions || transactions.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-20 text-text-muted text-sm font-medium">
                <AlertCircle size={24} className="opacity-50 mb-2" />
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
                    {transactions.map((txn, i) => {
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
                            <span 
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold border border-border/50 bg-white"
                              style={{ color: txn.category_color || '#000' }}
                            >
                              {txn.category_icon} {txn.category_name || 'Uncategorized'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-text-muted capitalize text-xs">
                            {txn.payment_method || (txn.source ? txn.source.replace('_', ' ') : 'Cash')}
                          </td>
                          <td className="py-4 px-6 text-right font-bold text-foreground">
                            {formatCurrency(txn.amount)}
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
