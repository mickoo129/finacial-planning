import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BarChart3, Search, GitCompare, PieChart, Calculator, Crown, Building2, Briefcase, Zap, MoreHorizontal } from 'lucide-react';
import { useMpfFunds } from '@/hooks/useMpfFunds';
import { useState } from 'react';

const navItems = [
  { to: '/', label: '排名', icon: Crown },
  { to: '/search', label: '搜尋', icon: Search },
  { to: '/compare', label: '比較', icon: GitCompare },
  { to: '/trustee', label: '受托人', icon: Building2 },
  { to: '/portfolio', label: '模擬器', icon: Briefcase },
  { to: '/radar', label: 'RADAR', icon: Zap },
  { to: '/categories', label: '類別', icon: PieChart },
  { to: '/retirement', label: '退休', icon: Calculator },
];

// Mobile bottom nav: show top 4 + "more" drawer for the rest
const PRIMARY_NAV = navItems.slice(0, 4);
const SECONDARY_NAV = navItems.slice(4);

function formatDataDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { data: funds } = useMpfFunds();
  const dataDate = funds?.[0]?.data_date;
  const formattedDate = formatDataDate(dataDate);

  return (
    <div className="min-h-screen bg-background">
      {/* Dark professional header */}
      <header className="sticky top-0 z-50" style={{ background: 'var(--header-gradient)' }}>
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-foreground/15 border border-primary-foreground/20 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <span className="text-sm font-bold text-primary-foreground block leading-tight tracking-tight">MPF Compare</span>
                <span className="text-[10px] text-primary-foreground/60">強積金比較平台</span>
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                      isActive
                        ? 'bg-primary-foreground/15 text-primary-foreground'
                        : 'text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/8'
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        {/* Data ticker bar */}
        <div className="border-t border-primary-foreground/10">
          <div className="container mx-auto px-4 py-1 flex items-center justify-between text-[10px] text-primary-foreground/50">
            <span>數據來源：etnet · MPFA</span>
            <span>數據截至 <strong className="text-primary-foreground/80">{formattedDate}</strong> · 僅供參考</span>
          </div>
        </div>
      </header>

      {/* Mobile nav - scrollable */}
      <MobileNav pathname={location.pathname} />

      {/* Content */}
      <main className="container mx-auto px-4 py-5 pb-20 md:pb-6 max-w-7xl">
        {children}
      </main>

      {/* Footer */}
      <footer className="hidden md:block border-t border-border py-3 text-center text-[11px] text-muted-foreground">
        數據來源：etnet · MPFA · 數據截至 {formattedDate} · 僅供參考，不構成投資建議
      </footer>
    </div>
  );
}
