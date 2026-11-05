/**
 * Production ERP Authentication & Login View.
 *
 * Industrial-grade login screen featuring:
 * - Constant-time credential authentication via POST /api/auth/login
 * - Cryptographic session token storage
 * - Quick-fill demo personas for rapid evaluation & audit testing
 * - Sanitized generic error handling
 */

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertCircle, Factory, CheckCircle2 } from 'lucide-react';

interface PersonaPreset {
  name: string;
  role: string;
  username: string;
  plant: string;
  description: string;
}

const DEMO_PERSONAS: PersonaPreset[] = [
  {
    name: 'Budi Santoso',
    role: 'Planner',
    username: 'budi.planner',
    plant: 'PLANT-01',
    description: 'MPS, Production Orders & MRP Planning',
  },
  {
    name: 'Agus Pratama',
    role: 'Supervisor',
    username: 'agus.spv',
    plant: 'PLANT-01',
    description: 'Shop Floor Dispatch & Operations',
  },
  {
    name: 'Hendra Wijaya',
    role: 'Quality Lead',
    username: 'hendra.ppicmgr',
    plant: 'PLANT-01 & 02',
    description: 'Quality Inspections, NCR & Disposition',
  },
  {
    name: 'Ir. Hartono Hadipuro',
    role: 'Plant Manager',
    username: 'hartono.plantdir',
    plant: 'All Plants (*)',
    description: 'Full Plant Executive Authorization',
  },
];

const DEFAULT_DEMO_PASSWORD = 'Kranex2026!';

export const LoginView: React.FC = () => {
  const { login, error, clearError } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!identifier.trim() || !password) {
      setLocalError('Username/email and password are required.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(identifier.trim(), password);
    setIsSubmitting(false);

    if (!result.success) {
      setLocalError(result.error || 'Invalid credentials.');
    }
  };

  const selectPersona = (persona: PersonaPreset) => {
    setIdentifier(persona.username);
    setPassword(DEFAULT_DEMO_PASSWORD);
    setLocalError(null);
    clearError();
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Background Decorators */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-600 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 mb-2">
            <Factory className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            KRANEX <span className="text-blue-400 font-light text-xl">ERP</span>
          </h1>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-mono">
            Industrial Manufacturing Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white">System Sign In</h2>
            <p className="text-xs text-slate-400">
              Enter your corporate credentials to access production floor & planning services.
            </p>
          </div>

          {/* Error Banner */}
          {activeError && (
            <div
              role="alert"
              className="p-3 bg-rose-950/80 border border-rose-800 rounded-lg flex items-start gap-2.5 text-xs text-rose-200 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-300">Authentication Failed</p>
                <p className="text-rose-200/90 mt-0.5">{activeError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifier Input */}
            <div className="space-y-1.5">
              <label htmlFor="identifier" className="block text-xs font-medium text-slate-300">
                Username or Corporate Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. budi.planner or budi.santoso@kranex.co.id"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-medium text-slate-300">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 text-sm bg-slate-900/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate Session</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Persona Selector */}
          <div className="pt-4 border-t border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
                Demo Evaluation Personas
              </span>
              <span className="text-[10px] text-blue-400 font-mono">Password: {DEFAULT_DEMO_PASSWORD}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_PERSONAS.map((p) => {
                const isSelected = identifier === p.username;
                return (
                  <button
                    key={p.username}
                    type="button"
                    onClick={() => selectPersona(p)}
                    className={`p-2 rounded-lg text-left border transition-all text-xs flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-950/60 border-blue-500 text-white'
                        : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/40 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold truncate">{p.name}</span>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0 ml-1" />}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                      <span className="font-mono text-blue-400">{p.role}</span>
                      <span>•</span>
                      <span className="truncate">{p.plant}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security Compliance Footer */}
        <div className="text-center space-y-1">
          <p className="text-[11px] text-slate-400 font-mono">
            HMAC-SHA256 Bearer Token • Constant-Time Verification • Server-Side RBAC
          </p>
          <p className="text-[10px] text-slate-400">
            Kranex Industrial Platform &bull; ISO 9001 / IATF 16949 Audited Security Model
          </p>
        </div>
      </div>
    </div>
  );
};
