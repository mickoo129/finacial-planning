import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BarChart3, Search, GitCompare, PieChart, Calculator, Crown } from 'lucide-react';

const navItems = [
  { to: '/', label: '基金排名', icon: Crown },
  { to: '/search', label: '搜尋基金', icon: Search },
  { to: '/compare', label: '比較基金', icon: GitCompare },
  { to: '/categories', label: '類別比較', icon: PieChart },
  { to: '/retirement', label: '退休計算', icon: Calculator },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Top info bar */}
      <div className="bg-muted/50 border-b border-border">
        <div className="container mx-auto px-4 py-1.5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>📊</span>
          <span>數據來源：etnet · 更新日期 <strong className="text-foreground">2026年4月</strong> · 僅供參考，不構成投資建議</span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-base font-bold text-foreground block leading-tight">MPF Compare</span>
                <span className="text-[10px] text-muted-foreground">強積金比較平台</span>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 pb-24 md:pb-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="hidden md:block border-t border-border py-4 text-center text-xs text-muted-foreground">
        數據來源：etnet · 數據截至 2026年4月 · 僅供參考，不構成投資建議
      </footer>
    </div>
  );
}
