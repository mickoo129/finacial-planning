import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BarChart3, Search, GitCompare, PieChart, Calculator, Crown, Building2, Briefcase, Zap, MoreHorizontal } from 'lucide-react';
import { useMpfFunds } from '@/hooks/useMpfFunds';
import { useState } from 'react';

const navItems = [
  { to: '/', label: '基金排名', icon: Crown },
  { to: '/search', label: '基金搜尋', icon: Search },
  { to: '/compare', label: '基金比較', icon: GitCompare },
  { to: '/categories', label: '類別比較', icon: PieChart },
  { to: '/retirement', label: '退休計算機', icon: Calculator },
  { to: '/trustee', label: '受托人', icon: Building2 },
  { to: '/portfolio', label: '模擬器', icon: Briefcase },
  { to: '/radar', label: 'RADAR', icon: Zap },
];

const PRIMARY_NAV = navItems.slice(0, 4);
const SECONDARY_NAV = navItems.slice(4);

function formatDataDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function MobileNav({ pathname }: { pathname: string }) {
  const [showMore, setShowMore] = useState(false);
  const isSecondaryActive = SECONDARY_NAV.some(item => item.to === pathname);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-white/80 backdrop-blur-2xl safe-area-bottom">
        <div className="grid grid-cols-5 py-1">
          {PRIMARY_NAV.map((item) => {
            const isActive = pathname === item.to;
            return (
              <Link key={item.to} to={item.to} onClick={() => setShowMore(false)}
                className={cn('flex flex-col items-center gap-0.5 py-1.5 text-[10px] transition-colors', isActive ? 'text-primary font-medium' : 'text-muted-foreground')}>
                <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button onClick={() => setShowMore(!showMore)}
            className={cn('flex flex-col items-center gap-0.5 py-1.5 text-[10px] transition-colors', isSecondaryActive || showMore ? 'text-primary font-medium' : 'text-muted-foreground')}>
            <MoreHorizontal className={cn('h-5 w-5', (isSecondaryActive || showMore) && 'text-primary')} />
            <span>更多</span>
          </button>
        </div>
      </nav>

      {showMore && (
        <>
          <div className="md:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setShowMore(false)} />
          <div className="md:hidden fixed bottom-[60px] left-0 right-0 z-40 bg-white/90 backdrop-blur-2xl border-t border-border/60 rounded-t-3xl shadow-[0_-8px_30px_-12px_hsl(230_60%_70%/0.2)] animate-in slide-in-from-bottom-4 duration-200">
            <div className="p-4 grid grid-cols-4 gap-3">
              {SECONDARY_NAV.map((item) => {
                const isActive = pathname === item.to;
                return (
                  <Link key={item.to} to={item.to} onClick={() => setShowMore(false)}
                    className={cn('flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-colors', isActive ? 'text-primary bg-primary/8 font-medium' : 'text-muted-foreground hover:bg-muted/50')}>
                    <item.icon className={cn('h-6 w-6', isActive && 'text-primary')} />
                    <span className="text-[11px]">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
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
              <div className="w-8 h-8 rounded-2xl bg-primary-foreground/15 border border-primary-foreground/20 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <span className="text-sm font-bold text-primary-foreground block leading-tight tracking-tight">強積金比較系統</span>
                <span className="text-[10px] text-primary-foreground/60">MPF Compare</span>
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link key={item.to} to={item.to}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                      isActive ? 'bg-primary-foreground/15 text-primary-foreground' : 'text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/8')}>
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10">
          <div className="container mx-auto px-4 py-1 flex items-center justify-between text-[10px] text-primary-foreground/50">
            <span>數據來源：etnet · MPFA</span>
            <span>數據截至 <strong className="text-primary-foreground/80">{formattedDate}</strong> · 僅供參考</span>
          </div>
        </div>
      </header>

      <MobileNav pathname={location.pathname} />

      <main className="container mx-auto px-3 md:px-6 py-5 pb-20 md:pb-6 max-w-[1600px]">
        {children}
      </main>

      <footer className="hidden md:block border-t border-border/60 py-3 text-center text-[11px] text-muted-foreground">
        數據來源：etnet · MPFA · 數據截至 {formattedDate} · 僅供參考，不構成投資建議
      </footer>
    </div>
  );
}
