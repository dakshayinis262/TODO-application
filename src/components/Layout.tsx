import React, { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Plus,
  Settings,
  Star,
  Sun,
  SunMedium,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTasks } from '../contexts/TasksContext';
import { isTaskDueToday, isTaskUpcoming } from '../utils/taskHelpers';

interface LayoutProps {
  children: React.ReactNode;
  onOpenNewTask: () => void;
}

export function Layout({ children, onOpenNewTask }: LayoutProps) {
  const { user, profile, logout, syncThemePreference } = useAuth();
  const { theme } = useTheme();
  const { tasks } = useTasks();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const counts = useMemo(() => {
    return {
      all: tasks.length,
      today: tasks.filter((t) => isTaskDueToday(t)).length,
      upcoming: tasks.filter((t) => isTaskUpcoming(t)).length,
      important: tasks.filter((t) => t.isImportant && t.status !== 'Completed').length,
      inProgress: tasks.filter((t) => t.status === 'In Progress').length,
      completed: tasks.filter((t) => t.status === 'Completed').length,
    };
  }, [tasks]);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, count: null },
    { to: '/tasks', label: 'All Tasks', icon: ListTodo, count: counts.all },
    { to: '/my-day', label: 'My Day', icon: SunMedium, count: counts.today },
    { to: '/upcoming', label: 'Upcoming', icon: CalendarClock, count: counts.upcoming },
    { to: '/important', label: 'Important', icon: Star, count: counts.important },
    { to: '/in-progress', label: 'In Progress', icon: Loader2, count: counts.inProgress },
    { to: '/completed', label: 'Completed', icon: CheckCircle2, count: counts.completed },
    { to: '/categories', label: 'Categories', icon: FolderKanban, count: null },
    { to: '/settings', label: 'Settings', icon: Settings, count: null },
  ];

  const currentPageTitle = useMemo(() => {
    const match = navItems.find((item) => item.to === location.pathname);
    return match ? match.label : 'Dashboard';
  }, [location.pathname]);

  const userEmail = profile?.email ?? user?.email ?? '';
  const displayName = profile?.displayName ?? user?.displayName ?? userEmail.split('@')[0];

  const handleToggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    syncThemePreference(next);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
        <NavLink
          to="/"
          onClick={() => setMobileMenuOpen(false)}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
        >
          TaskFlow
        </NavLink>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              {item.count !== null && (
                <span className="text-xs font-mono tabular-nums text-slate-400 dark:text-slate-500 shrink-0">
                  {item.count}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {displayName}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={userEmail}>
            {userEmail}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-3.5 h-3.5" />
                Dark
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5" />
                Light
              </>
            )}
          </button>

          <button
            type="button"
            onClick={logout}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-50">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 px-4 sm:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">Workspace</span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
              <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                {currentPageTitle}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenNewTask}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-[1200px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
