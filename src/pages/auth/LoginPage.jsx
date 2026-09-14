import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Shield, Database, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { hrmsApi, DB_ID } from '../../lib/api';

export function LoginPage({ onLoginSuccess, onShowToast }) {
  const [email, setEmail] = useState('mohit.kataria@hrtiva.com');
  const [password, setPassword] = useState('Pass@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const DEMO_ACCOUNTS = [
    {
      name: 'Mohit Kataria',
      email: 'mohit.kataria@hrtiva.com',
      role: 'Super Admin',
      userid: 'TYS-1021',
      dept: 'Systems & Cloud Arch'
    },
    {
      name: 'Priyanka Chopra',
      email: 'priyanka.chopra@hrtiva.com',
      role: 'HR Admin',
      userid: 'TYS-1003',
      dept: 'People Operations'
    }
  ];

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await hrmsApi.login(email, password);
      if (res.success) {
        if (onShowToast) {
          onShowToast({
            type: 'success',
            title: 'Authentication Successful',
            message: `Welcome back, ${res.user?.first_name || 'Admin'}!`
          });
        }
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please verify your credentials.');
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Sign In Failed',
          message: err.message || 'Invalid email or password.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuickAccount = (acc) => {
    setEmail(acc.email);
    setPassword('Pass@123');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl font-bold tracking-tight text-[#27292C]">
            PulseHRMS
          </span>
          <span className="text-xs text-[#5F6368] border-l border-[#E5E7EB] pl-2.5">
            Enterprise Console
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#5F6368]">
          <Database className="w-3.5 h-3.5 text-[#27292C]" />
          <span className="hidden sm:inline font-mono">D1: {DB_ID.slice(0, 8)}...</span>
          <span className="inline-flex items-center gap-1 text-[#10B981] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            Worker Live
          </span>
        </div>
      </header>

      {/* Main Login Box */}
      <main className="w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#27292C] tracking-tight">
              Sign in
            </h1>
            <p className="text-sm text-[#5F6368] mt-1">
              Enter your credentials to access the enterprise HR management system.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] flex items-start gap-2.5 text-xs text-[#B91C1C]">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626] mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#27292C] mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hrtiva.com"
                  required
                  className="w-full h-10 px-3.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-sm text-[#27292C] placeholder-[#9AA0A6] focus:outline-none focus:border-[#27292C] focus:ring-1 focus:ring-[#27292C] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#27292C]">
                  Password
                </label>
                <span className="text-[11px] text-[#5F6368]">
                  Default: Pass@123
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-10 pl-3.5 pr-10 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-sm text-[#27292C] placeholder-[#9AA0A6] focus:outline-none focus:border-[#27292C] focus:ring-1 focus:ring-[#27292C] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6368] hover:text-[#27292C] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 mt-2 bg-[#27292C] hover:bg-[#1A1C1E] active:bg-[#000000] text-[#FFFFFF] font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[#FFFFFF]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Select Accounts */}
          <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
            <span className="block text-xs font-medium text-[#5F6368] mb-3">
              Fast Demo Sign In (Live D1 Database Users):
            </span>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected = email === acc.email;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectQuickAccount(acc)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#27292C] bg-[#F8F9FA]'
                        : 'border-[#E5E7EB] hover:border-[#D1D5DB] bg-[#FFFFFF]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#27292C]">
                          {acc.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[#F1F3F5] text-[#27292C]">
                          {acc.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#5F6368] font-mono block mt-0.5">
                        {acc.email}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-[#5F6368]">
                      {acc.userid}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="w-full max-w-5xl mx-auto text-center py-4 text-xs text-[#5F6368]">
        <p>
          Connected to <span className="font-mono text-[#27292C]">hrms-api.mkmkataria07.workers.dev</span> · SQLite D1 Engine
        </p>
      </footer>
    </div>
  );
}
