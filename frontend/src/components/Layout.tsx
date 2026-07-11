import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../hooks/useTheme';
import { toggleLanguage } from '../i18n';
import {
  LayoutDashboard, ShoppingCart, Package, BarChart3, Settings as SettingsIcon,
  LogOut, Store, Receipt, Users, Truck, ScrollText, Moon, Sun, Languages,
} from 'lucide-react';

const navItems = [
  { key: 'dashboard', path: '/', roles: ['ADMIN', 'CASHIER', 'STOCK_MANAGER', 'SUPERVISOR'], icon: LayoutDashboard },
  { key: 'pos', path: '/pos', roles: ['ADMIN', 'CASHIER', 'SUPERVISOR'], icon: ShoppingCart },
  { key: 'invoices', path: '/invoices', roles: ['ADMIN', 'SUPERVISOR'], icon: Receipt },
  { key: 'inventory', path: '/inventory', roles: ['ADMIN', 'STOCK_MANAGER', 'SUPERVISOR'], icon: Package },
  { key: 'customers', path: '/customers', roles: ['ADMIN', 'SUPERVISOR', 'CASHIER'], icon: Users },
  { key: 'suppliers', path: '/suppliers', roles: ['ADMIN', 'STOCK_MANAGER'], icon: Truck },
  { key: 'shifts', path: '/shifts', roles: ['ADMIN', 'CASHIER', 'SUPERVISOR'], icon: ScrollText },
  { key: 'reports', path: '/reports', roles: ['ADMIN', 'SUPERVISOR'], icon: BarChart3 },
  { key: 'settings', path: '/settings', roles: ['ADMIN'], icon: SettingsIcon },
];

export default function Layout() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const { dark, setDark } = useTheme();
  const role = user?.role || 'CASHIER';
  const items = navItems.filter((i) => i.roles.includes(role));
  const current = items.find((i) => i.path === location.pathname);

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col shrink-0">
        <div className="p-5 flex items-center gap-3 border-b">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-heading font-bold leading-tight">CloudPOS</p>
            <p className="text-[11px] text-muted-foreground">Point of Sale</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span>{t(item.key)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t">
          {user && (
            <div className="px-3 py-2 mb-1">
              <p className="text-sm font-medium truncate">{user.full_name}</p>
              <p className="text-xs text-muted-foreground">{t(role)}</p>
            </div>
          )}
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 shrink-0">
          <h1 className="font-heading text-lg font-semibold">
            {current ? t(current.key) : 'CloudPOS'}
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDark(!dark)}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
              title="Toggle theme"
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={toggleLanguage}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
              title="Toggle language"
            >
              <Languages className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}