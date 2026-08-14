'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Wallet01Icon,
  HexagonIcon,
  FloppyDiskIcon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';
import useSWR from 'swr';
import api, { fetcher } from '@/lib/api';
import SmoothScroll from '@/components/SmoothScroll';
import CategoryIcon from '@/components/CategoryIcon';

export default function BudgetsPage() {
  const router = useRouter();
  const [budgets, setBudgets] = useState({});
  const [totalBudget, setTotalBudget] = useState('');
  const { data: categories, error: catsError, isLoading: catsLoading } = useSWR('/categories?v=2', fetcher);
  const { data: budgetsData, error: budgError, isLoading: budgLoading, mutate: mutateBudgets } = useSWR('/budgets', fetcher);

  const loading = catsLoading || budgLoading;
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (budgetsData && budgetsData.categoryBudgets) {
      const bMap = {};
      budgetsData.categoryBudgets.forEach(b => {
        bMap[b.categoryId] = b.amount;
      });
      setBudgets(bMap);
      setTotalBudget(budgetsData.totalBudget || '');
    }
  }, [budgetsData]);

  if (catsError || budgError) {
    if (catsError?.response?.status === 401 || budgError?.response?.status === 401) {
      localStorage.removeItem('token');
      router.push('/login');
    }
  }

  const handleBudgetChange = (catId, value) => {
    setBudgets(prev => ({
      ...prev,
      [catId]: value === '' ? '' : Number(value)
    }));
    setSuccess(false);
  };

  const saveBudgets = async () => {
    if (saving) return;
    setSaving(true);
    setSuccess(false);
    
    try {
      const payload = {
        totalBudget: totalBudget === '' ? null : Number(totalBudget),
        categoryBudgets: {}
      };
      
      if (categories) {
        for (const cat of categories) {
          if (budgets[cat.id] !== undefined && budgets[cat.id] !== '') {
            payload.categoryBudgets[cat.id] = Number(budgets[cat.id]);
          } else {
            payload.categoryBudgets[cat.id] = null;
          }
        }
      }
      
      await api.put('/budgets', payload);
      await mutateBudgets(); // Revalidate SWR cache
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="flex justify-between items-center bg-white h-16 px-10 border-b border-border shrink-0 sticky top-0 z-20">
        <h1 className="text-lg font-semibold tracking-tight">Budgets</h1>
        <div className="flex items-center gap-4">
          {success && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="flex items-center gap-1.5 text-[#00a86b] text-sm font-bold"
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color="#00a86b" strokeWidth={1.75} /> Saved
            </motion.span>
          )}
          <button 
            onClick={saveBudgets}
            disabled={saving}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
          >
            {saving ? (
              <div className="animate-spin"><HugeiconsIcon icon={HexagonIcon} size={16} color="white" strokeWidth={1.75} /></div>
            ) : (
              <><HugeiconsIcon icon={FloppyDiskIcon} size={16} color="white" strokeWidth={1.75} /> Save Changes</>
            )}
          </button>
        </div>
      </header>

      <SmoothScroll className="flex-1 overflow-y-auto p-10 bg-surface">
        <div className="max-w-[800px] mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-[60vh]">
              <div className="animate-spin text-text-muted"><HugeiconsIcon icon={HexagonIcon} size={32} color="currentColor" strokeWidth={1.75} /></div>
            </div>
          ) : (catsError || budgError) ? (
            <div className="flex justify-center items-center h-[60vh] text-[#e00] font-medium">
              Failed to load budgets.
            </div>
          ) : (
            <motion.div 
              className="bg-white border border-border rounded-xl shadow-sm flex flex-col relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="p-8 border-b border-border bg-surface/50 rounded-t-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center text-foreground shadow-sm">
                    <HugeiconsIcon icon={Wallet01Icon} size={20} color="currentColor" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Budget Allocation</h2>
                    <p className="text-sm font-medium text-text-muted">Set spending limits to track your financial health.</p>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="block text-sm font-semibold text-foreground mb-1">Monthly Total Budget</label>
                  <p className="text-xs text-text-muted mb-3 font-medium">Your overarching limit for the entire month.</p>
                  <div className="relative max-w-[300px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold">₹</span>
                    <input 
                      type="number" 
                      className="w-full pl-8 pr-4 py-2 rounded-lg border border-border focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-semibold"
                      value={totalBudget}
                      onChange={(e) => { setTotalBudget(e.target.value); setSuccess(false); }}
                      placeholder="e.g. 50000"
                    />
                  </div>
                </div>
              </div>

              <div className="p-8">
                <h3 className="text-sm font-bold text-foreground mb-4">Category Limits</h3>
                
                {categories && Object.entries(
                  categories.reduce((acc, cat) => {
                    const group = cat.category_group || 'Uncategorized';
                    if (!acc[group]) acc[group] = [];
                    acc[group].push(cat);
                    return acc;
                  }, {})
                ).map(([group, cats]) => (
                  <div key={group} className="mb-8">
                    {group !== 'Uncategorized' && (
                      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 border-b border-border pb-2">{group}</h4>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {cats.map((cat) => (
                        <div key={cat.id} className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-sm font-semibold">
                            <span className="w-6 h-6 rounded-full flex items-center justify-center bg-surface border border-border text-xs shadow-sm" style={{ color: cat.color }}>
                              <CategoryIcon icon={cat.icon} className="w-3.5 h-3.5" />
                            </span>
                            {cat.name}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold">₹</span>
                            <input 
                              type="number" 
                              className="w-full pl-8 pr-4 py-2 rounded-lg border border-border focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-semibold text-sm"
                              value={budgets[cat.id] !== undefined ? budgets[cat.id] : ''}
                              onChange={(e) => handleBudgetChange(cat.id, e.target.value)}
                              placeholder="No limit"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </SmoothScroll>
    </>
  );
}
