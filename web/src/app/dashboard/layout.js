'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Hexagon, 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  LogOut,
  Landmark,
  PiggyBank
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Income', path: '/dashboard/income', icon: Landmark },
    { name: 'Transactions', path: '/dashboard/transactions', icon: Receipt },
    { name: 'Budgets', path: '/dashboard/budgets', icon: Wallet },
    { name: 'Savings', path: '/dashboard/savings', icon: PiggyBank },
  ];

  return (
    <div className="flex h-screen bg-surface overflow-hidden font-sans">
      <aside className="w-[260px] bg-white border-r border-border py-6 px-4 flex flex-col z-10 shrink-0">
        <div className="text-xl font-bold tracking-tight flex items-center gap-2 mb-10 px-2 text-foreground">
          <Hexagon size={20} className="fill-black text-black" />
          ExpenseLens
        </div>
        
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            
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
                <Icon size={18} /> {item.name}
              </Link>
            );
          })}
        </nav>

        <button 
          className="flex items-center gap-3 p-3 rounded-lg text-sm font-medium cursor-pointer text-text-muted hover:bg-surface hover:text-foreground transition-all mt-auto" 
          onClick={handleLogout}
        >
          <LogOut size={18} /> Sign Out
        </button>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {children}
      </main>
    </div>
  );
}
