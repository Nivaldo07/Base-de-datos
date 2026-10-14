'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Utensils,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Por favor ingresa tanto tu correo como tu contraseña.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Credenciales no válidas. Revisa tu correo y contraseña.');
        return;
      }

      // Redirigir al dashboard principal
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError('Error al comunicarse con el servidor. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoCredentials = () => {
    setEmail('admin@nutriicbf.gov.co');
    setPassword('NutriICBF2026*');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Header institucional */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-900/50 mb-3.5 ring-4 ring-emerald-500/20">
            <Utensils className="w-8 h-8" />
          </div>
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold tracking-wider uppercase mb-2">
            Instituto Colombiano de Bienestar Familiar
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Nutri<span className="text-emerald-400">ICBF</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Plataforma Oficial de Formulación de Minutas y Seguimiento Nutricional
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Correo Institucional
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@nutriicbf.gov.co"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span>Ingresar a NutriICBF</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Banner de credenciales de prueba */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-300">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Credenciales de Acceso Demo
                </span>
                <button
                  type="button"
                  onClick={handleUseDemoCredentials}
                  className="text-[11px] text-teal-400 hover:text-teal-300 underline font-medium cursor-pointer inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Rellenar
                </button>
              </div>
              <div className="space-y-1 font-mono text-[11px] bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Usuario:</span>
                  <span className="text-emerald-300 font-semibold">admin@nutriicbf.gov.co</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Clave:</span>
                  <span className="text-amber-300 font-semibold">NutriICBF2026*</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer legal / institucional */}
        <div className="text-center mt-6 text-xs text-slate-400 space-y-1">
          <p>© 2026 Instituto Colombiano de Bienestar Familiar (ICBF)</p>
          <p className="text-[11px] text-slate-400">
            Sistema seguro protegido con JWT y cifrado de contraseñas Bcrypt
          </p>
        </div>
      </div>
    </div>
  );
}
