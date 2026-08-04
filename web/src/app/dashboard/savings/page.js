'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PiggyBank,
  Hexagon,
  AlertCircle,
  Plus,
  Target,
  X,
  ArrowRight
} from 'lucide-react';
import useSWR from 'swr';
import api, { fetcher } from '@/lib/api';

const AddGoalModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount) return setError('Name and Target Amount are required.');
    
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
                  <Target size={16} />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">New Savings Goal</h2>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-text-muted hover:bg-surface rounded-md">
                <X size={20} />
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
                  {loading ? <Hexagon size={16} className="animate-spin" /> : <Plus size={16} />}
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
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  const { data: goals, error, isLoading, mutate } = useSWR('/savings', fetcher, {
    onError: (err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    }
  });

  const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <header className="flex justify-between items-center bg-white h-16 px-10 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">Savings Goals</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#0284c7] text-white px-3 py-1.5 rounded-md font-semibold flex items-center gap-2 text-xs hover:bg-[#0369a1] transition-colors">
          <Plus size={14} /> New Goal
        </button>
      </header>

      <AddGoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => mutate()} />
      <AddFundsModal isOpen={!!selectedGoal} onClose={() => setSelectedGoal(null)} goal={selectedGoal} onSuccess={() => mutate()} />

      <div className="flex-1 overflow-y-auto p-10 bg-surface">
        <div className="max-w-[1200px] mx-auto">
          {isLoading ? (
            <div className="flex h-[50vh] justify-center items-center">
              <div className="animate-spin text-text-muted"><Hexagon size={32} /></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#e00] text-sm font-medium">
              <AlertCircle size={24} className="opacity-50 mb-2" />
              Failed to load savings goals.
            </div>
          ) : (!goals || goals.length === 0) ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-text-muted text-sm font-medium">
              <PiggyBank size={48} className="opacity-40 mb-4 text-[#0284c7]" />
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
                        <>Add Funds <ArrowRight size={16} /></>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
