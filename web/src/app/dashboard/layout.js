'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SWRConfig, useSWRConfig } from 'swr';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  DashboardSquare01Icon,
  Money02Icon,
  ReceiptIndianRupeeIcon,
  Wallet01Icon,
  PiggyBankIcon,
  Logout01Icon,
  HexagonIcon,
} from '@hugeicons/core-free-icons';
import AuthGuard from '@/components/AuthGuard';
import { logout, hardLogout } from '@/lib/auth';
import api from '@/lib/api';
import { useCurrency, CURRENCIES } from '@/lib/currency';

function CurrencyPicker() {
  const { code } = useCurrency();
  const { mutate } = useSWRConfig();

  const change = async (e) => {
    await api.patch('/auth/me', { currency: e.target.value });
    mutate('/auth/me'); // every useCurrency() consumer re-renders off this one key
  };

  return (
    <label className="mt-auto flex items-center gap-3 p-3 text-sm font-medium text-text-muted">
      <HugeiconsIcon icon={Money02Icon} size={18} color="currentColor" strokeWidth={1.75} />
      <span className="sr-only">Currency</span>
      <select
        value={code}
        onChange={change}
        className="flex-1 bg-transparent cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-foreground rounded"
      >
        {Object.entries(CURRENCIES).map(([c, { symbol }]) => (
          <option key={c} value={c}>{`${symbol} ${c}`}</option>
        ))}
      </select>
    </label>
  );
}

function DashboardChrome({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: DashboardSquare01Icon },
    { name: 'Income', path: '/dashboard/income', icon: Money02Icon },
    { name: 'Transactions', path: '/dashboard/transactions', icon: ReceiptIndianRupeeIcon },
    { name: 'Budgets', path: '/dashboard/budgets', icon: Wallet01Icon },
    { name: 'Savings', path: '/dashboard/savings', icon: PiggyBankIcon },
  ];

  return (
    <div className="flex h-screen bg-surface overflow-hidden font-sans">
      <aside className="w-[260px] bg-white border-r border-border py-6 px-4 flex flex-col z-10 shrink-0">
        <div className="text-xl font-bold tracking-tight flex items-center gap-2 mb-10 px-2 text-foreground">
          <HugeiconsIcon icon={HexagonIcon} size={20} color="black" strokeWidth={2} />
          ExpenseLens
        </div>
        
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            
            return (
              <Link 
                href={item.path} 
                key={item.name}
                className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-all ${
                  isActive 
                    ? 'bg-surface font-semibold text-foreground' 
                    : 'font-medium text-text-muted hover:bg-surface hover:text-foreground'
                }`}
              >
                <HugeiconsIcon icon={item.icon} size={18} color="currentColor" strokeWidth={1.75} /> {item.name}
              </Link>
            );
          })}
        </nav>

        <CurrencyPicker />

        <button
          className="flex items-center gap-3 p-3 rounded-lg text-sm font-medium cursor-pointer text-text-muted hover:bg-surface hover:text-foreground transition-all"
          onClick={handleLogout}
        >
          <HugeiconsIcon icon={Logout01Icon} size={18} color="currentColor" strokeWidth={1.75} /> Sign Out
        </button>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard>
      <SWRConfig
        value={{
          onError: (err) => {
            if (err.response?.status === 401) {
              hardLogout();
            }
          },
          revalidateOnFocus: false,
          dedupingInterval: 60_000,
          keepPreviousData: true,
        }}
      >
        <DashboardChrome>{children}</DashboardChrome>
      </SWRConfig>
    </AuthGuard>
  );
}
