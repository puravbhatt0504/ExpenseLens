'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft,
  ChevronRight,
  Landmark,
  Hexagon,
  AlertCircle,
  Plus,
  Briefcase,
  Gift,
  DollarSign,
  TrendingUp,
  X,
  Trash2
} from 'lucide-react';
import useSWR from 'swr';
import api, { fetcher } from '@/lib/api';
import SmoothScroll from '@/components/SmoothScroll';

const AddIncomeModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState('Salary');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [note, setNote] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !date) return setError('Amount and Date are required.');
    if (loading) return;
    
    setLoading(true);
    setError('');
    
    try {
      await api.post('/incomes', {
        amount: Number(amount),
        date,
        source: source || 'Other',
        note: note || '',
        payment_method: paymentMethod
      });
      onSuccess();
      setAmount('');
      setNote('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add income.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[450px] bg-white rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.9, y: '-45%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, y: '-45%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="flex justify-between items-center p-6 border-b border-border bg-surface/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#e8f5e9] border border-[#c8e6c9] flex items-center justify-center text-[#2e7d32] shadow-sm">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Record Income</h2>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-text-muted hover:bg-surface rounded-md">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">Amount <span className="text-[#e00]">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold">₹</span>
                  <input type="number" step="0.01" min="0" required autoFocus
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-border focus:border-[#2e7d32] focus:ring-1 focus:ring-[#2e7d32] outline-none transition-all font-semibold"
                    value={amount} onChange={e => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">Date <span className="text-[#e00]">*</span></label>
                <input type="date" required
                  className="w-full px-4 py-2 rounded-lg border border-border focus:border-[#2e7d32] focus:ring-1 focus:ring-[#2e7d32] outline-none transition-all font-semibold"
                  value={date} onChange={e => setDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">Source</label>
                <select
                  className="w-full px-4 py-2 rounded-lg border border-border focus:border-[#2e7d32] focus:ring-1 focus:ring-[#2e7d32] outline-none transition-all font-semibold bg-white"
                  value={source} onChange={e => setSource(e.target.value)}
                >
                  <option value="Salary">Salary</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Gift">Gift</option>
                  <option value="Interest">Interest</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">Received In (Payment Method)</label>
                <select
                  className="w-full px-4 py-2 rounded-lg border border-border focus:border-[#2e7d32] focus:ring-1 focus:ring-[#2e7d32] outline-none transition-all font-semibold bg-white"
                  value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">Note</label>
                <input type="text"
                  className="w-full px-4 py-2 rounded-lg border border-border focus:border-[#2e7d32] focus:ring-1 focus:ring-[#2e7d32] outline-none transition-all font-semibold"
                  value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. August Salary"
                />
              </div>
              {error && <p className="text-[#e00] text-sm font-medium">{error}</p>}
              <div className="mt-2 flex justify-end">
                <button type="submit" disabled={loading} className="bg-[#2e7d32] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#1b5e20] transition-colors shadow-sm">
                  {loading ? <Hexagon size={16} className="animate-spin" /> : <Plus size={16} />}
                  Add Income
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default function IncomePage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: incomes, error, isLoading, mutate } = useSWR(`/incomes?month=${currentMonth}`, fetcher, {
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

  const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const monthName = new Date(`${currentMonth}-01`).toLocaleString('default', { month: 'long', year: 'numeric' });

  const totalIncome = incomes ? incomes.reduce((acc, curr) => acc + curr.amount, 0) : 0;

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this income entry?')) {
      try {
        await api.delete(`/incomes/${id}`);
        mutate();
      } catch (err) {
        console.error('Failed to delete income:', err);
        alert('Failed to delete income.');
      }
    }
  };

  const getSourceIcon = (source) => {
    switch(source) {
      case 'Salary': return <Briefcase size={18} />;
      case 'Gift': return <Gift size={18} />;
      default: return <DollarSign size={18} />;
    }
  };

  return (
    <>
      <header className="flex justify-between items-center bg-white h-16 px-10 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">Income</h1>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setIsModalOpen(true)} className="bg-[#2e7d32] text-white px-3 py-1.5 rounded-md font-semibold flex items-center gap-2 mr-4 text-xs hover:bg-[#1b5e20] transition-colors">
            <Plus size={14} /> Add Income
          </button>
          <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded-md border border-border bg-white text-text-muted hover:bg-surface transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold w-[140px] text-center">{monthName}</span>
          <button onClick={() => shiftMonth(1)} className="p-1.5 rounded-md border border-border bg-white text-text-muted hover:bg-surface transition-colors"><ChevronRight size={16} /></button>
        </div>
      </header>

      <AddIncomeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => mutate()} />

      <SmoothScroll className="flex-1 overflow-y-auto p-10 bg-surface">
        <div className="max-w-[1000px] mx-auto flex flex-col gap-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, type: 'spring' }}
            className="bg-gradient-to-br from-[#1b5e20] to-[#2e7d32] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-20">
              <Landmark size={120} />
            </div>
            <p className="text-[#a5d6a7] font-semibold mb-2">Total Received in {monthName}</p>
            <h1 className="text-5xl font-extrabold tracking-tight">
              {isLoading ? '...' : formatCurrency(totalIncome)}
            </h1>
          </motion.div>

          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-6 border-b border-border flex items-center gap-3 bg-surface/30">
              <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center text-foreground">
                <TrendingUp size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">Income Streams</h2>
                <p className="text-sm font-medium text-text-muted">All money received for {monthName}</p>
              </div>
            </div>

            <div className="flex-1 p-0">
              {isLoading ? (
                <div className="flex h-full justify-center items-center py-20">
                  <div className="animate-spin text-text-muted"><Hexagon size={32} /></div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 text-[#e00] text-sm font-medium">
                  <AlertCircle size={24} className="opacity-50 mb-2" />
                  Failed to load income records.
                </div>
              ) : (!incomes || incomes.length === 0) ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-text-muted text-sm font-medium">
                  <Landmark size={32} className="opacity-40 mb-3" />
                  No income recorded this month.
                </motion.div>
              ) : (
                <motion.ul 
                  className="w-full flex flex-col"
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: 0.05 }
                    }
                  }}
                >
                  {incomes.map((inc) => {
                    const date = new Date(inc.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                    return (
                      <motion.li 
                        key={inc.id}
                        variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
                        whileHover={{ scale: 1.01, backgroundColor: 'rgba(0,0,0,0.02)' }}
                        className="flex items-center justify-between py-4 px-6 border-b border-border/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#e8f5e9] flex items-center justify-center text-[#2e7d32]">
                            {getSourceIcon(inc.source)}
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground">{inc.source}</h3>
                            <p className="text-xs text-text-muted font-medium">
                              {inc.note || 'No note'} • {inc.payment_method || 'Bank Transfer'} • {date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right font-extrabold text-lg text-[#2e7d32]">
                            +{formatCurrency(inc.amount)}
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(inc.id); }}
                            className="p-2 text-text-muted hover:text-[#e00] hover:bg-[#e00]/10 rounded-full transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              )}
            </div>
          </div>

        </div>
      </SmoothScroll>
    </>
  );
}
