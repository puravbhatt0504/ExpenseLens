'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  PiggyBankIcon,
  HexagonIcon,
  AlertCircleIcon,
  PlusSignIcon,
  Target01Icon,
  Cancel01Icon,
  ArrowRight01Icon,
  Wallet01Icon,
  Delete02Icon,
} from '@hugeicons/core-free-icons';
import useSWR from 'swr';
import api, { fetcher } from '@/lib/api';
import SmoothScroll from '@/components/SmoothScroll';

const AddGoalModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount) return setError('Name and Target Amount are required.');
    if (loading) return;
    
    setLoading(true);
    setError('');
    
    try {
      await api.post('/savings', {
        name,
        target_amount: Number(targetAmount),
        target_date: targetDate || null,
        icon: '🎯',
        color: '#10b981'
      });
      onSuccess();
      setName('');
      setTargetAmount('');
      setTargetDate('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add savings goal.');
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
                <div className="w-8 h-8 rounded-lg bg-[#e0f2fe] border border-[#bae6fd] flex items-center justify-center text-[#0284c7] shadow-sm">
                  <HugeiconsIcon icon={Target01Icon} size={16} color="#0284c7" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">New Savings Goal</h2>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-text-muted hover:bg-surface rounded-md">
                <HugeiconsIcon icon={Cancel01Icon} size={20} color="currentColor" strokeWidth={1.75} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">Goal Name <span className="text-[#e00]">*</span></label>
                <input type="text" required autoFocus placeholder="e.g. Vacation Fund"
                  className="w-full px-4 py-2 rounded-lg border border-border focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] outline-none transition-all font-semibold"
                  value={name} onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">Target Amount <span className="text-[#e00]">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold">₹</span>
                  <input type="number" step="0.01" min="0" required
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-border focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] outline-none transition-all font-semibold"
                    value={targetAmount} onChange={e => setTargetAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">Target Date</label>
                <input type="date"
                  className="w-full px-4 py-2 rounded-lg border border-border focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] outline-none transition-all font-semibold"
                  value={targetDate} onChange={e => setTargetDate(e.target.value)}
                />
              </div>
              {error && <p className="text-[#e00] text-sm font-medium">{error}</p>}
              <div className="mt-2 flex justify-end">
                <button type="submit" disabled={loading} className="bg-[#0284c7] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#0369a1] transition-colors shadow-sm">
                  {loading ? <HugeiconsIcon icon={HexagonIcon} size={16} color="white" strokeWidth={1.75} className="animate-spin" /> : <HugeiconsIcon icon={PlusSignIcon} size={16} color="white" strokeWidth={1.75} />}
                  Create Goal
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const AddFundsModal = ({ isOpen, onClose, goal, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) return;
    if (loading) return;
    setLoading(true);
    try {
      await api.patch(`/savings/${goal.id}`, {
        current_amount: goal.current_amount + Number(amount)
      });
      onSuccess();
      setAmount('');
      onClose();
    } catch (err) {
      console.error(err);
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[400px] bg-white rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.9, y: '-45%' }} animate={{ opacity: 1, scale: 1, y: '-50%' }} exit={{ opacity: 0, scale: 0.9, y: '-45%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="p-6 border-b border-border bg-surface/50">
              <h2 className="text-lg font-bold tracking-tight">Add Funds to {goal?.name}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold">₹</span>
                <input type="number" step="0.01" min="0" required autoFocus
                  className="w-full pl-8 pr-4 py-2 rounded-lg border border-border focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] outline-none transition-all font-semibold"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="Amount to add"
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-semibold text-text-muted hover:bg-surface">Cancel</button>
                <button type="submit" disabled={loading} className="bg-[#0284c7] text-white px-4 py-2 rounded-lg font-bold">Add</button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default function SavingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  const { data: goals, error, isLoading, mutate } = useSWR('/savings', fetcher);

  const [currentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: summary } = useSWR(`/summary?month=${currentMonth}`, fetcher);

  const handleDeleteGoal = async (id) => {
    if (window.confirm('Are you sure you want to delete this savings goal?')) {
      try {
        await api.delete(`/savings/${id}`);
        mutate();
      } catch (err) {
        console.error('Failed to delete savings goal:', err);
        alert('Failed to delete savings goal.');
      }
    }
  };

  const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <header className="flex justify-between items-center bg-white h-16 px-10 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">Savings Goals</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#0284c7] text-white px-3 py-1.5 rounded-md font-semibold flex items-center gap-2 text-xs hover:bg-[#0369a1] transition-colors">
          <HugeiconsIcon icon={PlusSignIcon} size={14} color="white" strokeWidth={1.75} /> New Goal
        </button>
      </header>

      <AddGoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => mutate()} />
      <AddFundsModal isOpen={!!selectedGoal} onClose={() => setSelectedGoal(null)} goal={selectedGoal} onSuccess={() => mutate()} />

      <SmoothScroll className="flex-1 overflow-y-auto p-10 bg-surface">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-6">

          {summary && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-[#6C63FF] to-[#0284c7] rounded-2xl p-6 shadow-sm text-white flex items-center gap-6"
            >
              <div className="bg-white/20 p-4 rounded-full">
                <HugeiconsIcon icon={Wallet01Icon} size={32} color="white" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-white/80 text-sm font-semibold mb-1 uppercase tracking-wider">Net Monthly Savings</p>
                <h2 className="text-3xl font-extrabold tracking-tight">
                  {formatCurrency(summary.totalIncome - summary.total)}
                </h2>
                <p className="text-white/70 text-xs font-medium mt-1">Actual Cash Flow (Total Income - Total Spend)</p>
              </div>
            </motion.div>
          )}

          {isLoading ? (
            <div className="flex h-[50vh] justify-center items-center">
              <div className="animate-spin text-text-muted"><HugeiconsIcon icon={HexagonIcon} size={32} color="currentColor" strokeWidth={1.75} /></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#e00] text-sm font-medium">
              <HugeiconsIcon icon={AlertCircleIcon} size={24} color="currentColor" strokeWidth={1.75} className="opacity-50 mb-2" />
              Failed to load savings goals.
            </div>
          ) : (!goals || goals.length === 0) ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-text-muted text-sm font-medium">
              <HugeiconsIcon icon={PiggyBankIcon} size={48} color="#0284c7" strokeWidth={1.25} className="opacity-40 mb-4" />
              <h2 className="text-lg font-bold text-foreground mb-1">No savings goals yet</h2>
              <p>Start tracking your dreams by creating a new goal.</p>
              <button onClick={() => setIsModalOpen(true)} className="mt-4 bg-[#0284c7] text-white px-4 py-2 rounded-lg font-bold">Create a Goal</button>
            </motion.div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden" animate="show"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
            >
              {goals.map((goal) => {
                const progress = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
                const isComplete = progress >= 100;
                
                return (
                  <motion.div 
                    key={goal.id}
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-border relative overflow-hidden transition-all group"
                  >
                    {isComplete && (
                      <div className="absolute top-0 right-0 bg-[#10b981] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                        ACHIEVED
                      </div>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteGoal(goal.id); }}
                      className="absolute top-3 right-3 p-2 text-text-muted hover:text-[#e00] hover:bg-[#e00]/10 rounded-full transition-colors z-10"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={16} color="currentColor" strokeWidth={1.75} />
                    </button>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-3xl">{goal.icon || '🎯'}</div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground leading-tight">{goal.name}</h3>
                        {goal.target_date && (
                          <p className="text-xs text-text-muted font-medium">By {new Date(goal.target_date).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-2xl font-extrabold text-[#0284c7]">{formatCurrency(goal.current_amount)}</span>
                        <span className="text-sm font-medium text-text-muted">of {formatCurrency(goal.target_amount)}</span>
                      </div>
                      <div className="h-3 w-full bg-surface rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full ${isComplete ? 'bg-[#10b981]' : 'bg-[#0284c7]'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.2 }}
                        />
                      </div>
                      <p className="text-right text-xs font-bold text-text-muted mt-1">{progress.toFixed(1)}%</p>
                    </div>

                    <button 
                      onClick={() => setSelectedGoal(goal)}
                      disabled={isComplete}
                      className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                        isComplete ? 'bg-surface text-text-muted cursor-not-allowed' : 'bg-[#e0f2fe] text-[#0284c7] hover:bg-[#bae6fd] group-hover:shadow-sm'
                      }`}
                    >
                      {isComplete ? 'Goal Reached' : (
                        <>Add Funds <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="#0284c7" strokeWidth={1.75} /></>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </SmoothScroll>
    </>
  );
}
