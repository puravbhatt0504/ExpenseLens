'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hexagon, Save, Receipt, Calendar, Tag, CreditCard } from 'lucide-react';
import useSWR from 'swr';
import api, { fetcher } from '@/lib/api';

export default function AddTransactionModal({ isOpen, onClose, onSuccess }) {
  const { data: categories } = useSWR('/categories', fetcher);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [merchant, setMerchant] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  
  // Reset form when modal closes
  const handleClose = () => {
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setMerchant('');
    setCategoryId('');
    setPaymentMethod('UPI');
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !date) {
      setError('Amount and Date are required.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.post('/transactions', {
        amount: Number(amount),
        txn_date: date,
        merchant: merchant || 'Untitled',
        category_id: categoryId ? Number(categoryId) : null,
        source: 'manual',
        payment_method: paymentMethod
      });
      
      onSuccess(); // Triggers SWR mutate in parent
      handleClose();
    } catch (err) {
      console.error('Failed to add transaction:', err);
      setError(err.response?.data?.error || 'Failed to add transaction. Please try again.');
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] bg-white rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.95, y: '-45%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, y: '-45%' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center p-6 border-b border-border bg-surface/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center text-foreground shadow-sm">
                  <Receipt size={16} />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Log Transaction</h2>
                  <p className="text-xs font-medium text-text-muted">Manually record a new expense.</p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 text-text-muted hover:text-foreground hover:bg-surface rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CreditCard size={14} className="text-text-muted" /> Amount <span className="text-[#e00]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold">₹</span>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    required
                    autoFocus
                    className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-border focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-semibold"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Calendar size={14} className="text-text-muted" /> Date <span className="text-[#e00]">*</span>
                </label>
                <input 
                  type="date" 
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-border focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-semibold text-sm"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Receipt size={14} className="text-text-muted" /> Merchant / Note
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 rounded-lg border border-border focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-semibold text-sm"
                  placeholder="Where did you spend?"
                  value={merchant}
                  onChange={e => setMerchant(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CreditCard size={14} className="text-text-muted" /> Payment Method
                </label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border border-border focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-semibold text-sm bg-white"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Tag size={14} className="text-text-muted" /> Category
                </label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border border-border focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-semibold text-sm bg-white"
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                >
                  <option value="">Uncategorized</option>
                  {categories?.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {error && <p className="text-[#e00] text-sm font-medium">{error}</p>}

              <div className="mt-4 pt-4 border-t border-border flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={handleClose}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? <Hexagon size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Transaction
                </button>
              </div>

            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
