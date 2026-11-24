import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckSquare, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export function AuthPage() {
  const {
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    requestPasswordReset,
    completePasswordReset,
  } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const oobCode = searchParams.get('oobCode') ?? '';

  const [mode, setMode] = useState<AuthMode>(() => {
    if (oobCode || location.pathname === '/reset-password') return 'reset';
    if (location.pathname === '/register') return 'register';
    if (location.pathname === '/forgot-password') return 'forgot';
    return 'login';
  });

  useEffect(() => {
    if (oobCode || location.pathname === '/reset-password') {
      setMode('reset');
    } else if (location.pathname === '/register') {
      setMode('register');
    } else if (location.pathname === '/forgot-password') {
      setMode('forgot');
    } else if (location.pathname === '/login') {
      setMode('login');
    }
  }, [location.pathname, oobCode]);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setErrorMsg(null);
    setInfoMsg(null);
    if (next === 'login') navigate('/login');
    if (next === 'register') navigate('/register');
    if (next === 'forgot') navigate('/forgot-password');
    if (next === 'reset') navigate('/reset-password');
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
        navigate('/');
      } else if (mode === 'register') {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        await registerWithEmail(email, password, displayName);
        navigate('/');
      } else if (mode === 'forgot') {
        await requestPasswordReset(email);
        setInfoMsg('If an account exists for that address, reset instructions have been sent.');
      } else if (mode === 'reset') {
        if (!oobCode) {
          throw new Error('Missing password reset code. Open the link from your reset email.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        await completePasswordReset(oobCode, password);
        switchMode('login');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
          TaskFlow
        </span>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 max-w-[1200px] w-full mx-auto items-center gap-12 px-6 py-12">
        <div className="space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-400">
            <CheckSquare className="w-4 h-4" />
            <span>Personal & Team Task Workspace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight [text-wrap:balance]">
            Plan every deliverable, deadline, and daily priority in one calm workspace.
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            TaskFlow keeps your daily schedule, upcoming deadlines, priorities, and category workflows synchronized in PostgreSQL with private per-user access.
          </p>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Views</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                My Day & Upcoming
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Organization</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Priorities & Tags
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Insights</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                7-Day Progress
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {mode === 'login' && 'Sign in to TaskFlow'}
              {mode === 'register' && 'Create your account'}
              {mode === 'forgot' && 'Reset your password'}
              {mode === 'reset' && 'Set a new password'}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {mode === 'login' && 'Access your private tasks and productivity dashboard.'}
              {mode === 'register' && 'Start organizing your tasks with persistent cloud storage.'}
              {mode === 'forgot' && 'Enter your account email to receive password reset instructions.'}
              {mode === 'reset' && 'Choose a new password for your TaskFlow account.'}
            </p>
          </div>

          {(mode === 'login' || mode === 'register') && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                <span className="text-xs text-slate-400 dark:text-slate-500">or with email</span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>
            </>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300">
              {infoMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full px-3.5 py-2 text-sm rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2 text-sm rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'reset') && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    {mode === 'reset' ? 'New Password' : 'Password'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-sm rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}

            {mode === 'reset' && (
              <div>
                <label
                  htmlFor="auth-confirm-password"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Confirm New Password
                </label>
                <input
                  id="auth-confirm-password"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-sm rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-colors disabled:opacity-60"
            >
              <span>
                {submitting
                  ? 'Please wait...'
                  : mode === 'login'
                    ? 'Sign In with Email'
                    : mode === 'register'
                      ? 'Create Account'
                      : mode === 'forgot'
                        ? 'Send Reset Link'
                        : 'Update Password'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login' && (
              <>
                New to TaskFlow?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Create an account
                </button>
              </>
            )}
            {(mode === 'register' || mode === 'forgot' || mode === 'reset') && (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Back to Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
