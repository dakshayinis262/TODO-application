import React, { useEffect, useState } from 'react';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTasks } from '../contexts/TasksContext';
import { computeDashboardStats } from '../utils/taskHelpers';

export function SettingsPage() {
  const { user, profile, updateUserDisplayName, syncThemePreference, logout } = useAuth();
  const { theme } = useTheme();
  const { tasks } = useTasks();

  const [displayName, setDisplayName] = useState(
    profile?.displayName ?? user?.displayName ?? ''
  );
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.displayName ?? user?.displayName ?? '');
  }, [profile?.displayName, user?.displayName]);

  const stats = computeDashboardStats(tasks);
  const email = profile?.email ?? user?.email ?? '';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateUserDisplayName(displayName);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Settings</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your profile, appearance preference, and session.
        </p>
      </div>

      {/* Account Details */}
      <section className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Account Profile
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your tasks are private and accessible only when signed into this account.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label
              htmlFor="settings-email"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Signed-in Email
            </label>
            <input
              id="settings-email"
              type="email"
              readOnly
              value={email}
              className="w-full px-3.5 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="settings-display-name"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Display Name
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="settings-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="flex-1 px-3.5 py-2 text-sm rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Theme Appearance */}
      <section className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Appearance
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Choose between a crisp light workspace or low-glare dark mode.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => syncThemePreference('light')}
            className={`flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-medium rounded-lg border transition-colors ${
              theme === 'light'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-700 dark:text-blue-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Sun className="w-4 h-4" />
            Light Theme
          </button>

          <button
            type="button"
            onClick={() => syncThemePreference('dark')}
            className={`flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-medium rounded-lg border transition-colors ${
              theme === 'dark'
                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Moon className="w-4 h-4" />
            Dark Theme
          </button>
        </div>
      </section>

      {/* Workspace Summary & Sign Out */}
      <section className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Workspace Summary
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
            {stats.total} total tasks · {stats.completed} completed · {stats.completionRate}% rate
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors whitespace-nowrap shrink-0"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </section>
    </div>
  );
}
