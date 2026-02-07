import React, { useState } from 'react';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';

interface LoginProps {
  onLogin: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    console.log('Login: Iniciando autenticación para:', email);
    try {
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Login Timeout')), 10000));

      console.log('Login: Esperando respuesta de Supabase...');
      const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any;

      console.log('Login: Respuesta recibida:', { data, error });

      if (error) throw error;

      onLogin(email);
    } catch (error: any) {
      console.error('Login: Error fatal:', error);
      alert(error.message || 'Error al iniciar sesión. Verifica tu conexión.');
    } finally {
      console.log('Login: Finalizando estado de carga');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E6F7F9] flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
      <div className="w-full max-w-[440px] bg-white rounded-[40px] shadow-2xl shadow-[#57C5D5]/20 overflow-hidden flex flex-col transition-all border border-white">

        {/* Header con Logo */}
        <div className="bg-[#57C5D5] py-12 flex flex-col items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-white blur-3xl" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-white blur-3xl" />
          </div>

          <div className="bg-white p-3 rounded-2xl shadow-xl z-10 w-24 h-24 flex items-center justify-center">
            {/* Logo placeholder - En un entorno real sería una etiqueta img */}
            <img
              src="https://vctarapoto.edu.pe/wp-content/uploads/2021/03/logo_vc.png"
              alt="Logo Valores y Ciencias"
              className="w-16 h-16 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=VC&backgroundColor=57C5D5';
              }}
            />
          </div>

          <div className="text-center z-10 px-4">
            <h1 className="text-white text-3xl font-black italic tracking-tighter uppercase leading-none italic">
              Valores y Ciencias
            </h1>
            <p className="text-white/80 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">
              Módulo Administrativo
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-10 md:p-12 space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block pl-1">
                Correo Electrónico
              </label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@vctarapoto.edu.pe"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#57C5D5]/20 focus:border-[#57C5D5] focus:bg-white transition-all placeholder:text-slate-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block pl-1">
                Contraseña Segura
              </label>
              <div className="relative group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#57C5D5]/20 focus:border-[#57C5D5] focus:bg-white transition-all placeholder:text-slate-300"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 bg-[#57C5D5] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-[#57C5D5]/30 hover:bg-[#46b3c2] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Entrar al Sistema</span>
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <button type="button" className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-[#57C5D5] transition-colors">
              ¿Olvidaste tu acceso institucional?
            </button>
          </div>
        </form>
      </div>

      <footer className="mt-12 text-[10px] text-[#57C5D5] font-black uppercase tracking-[0.25em] opacity-60">
        I.E.P. Valores y Ciencias © 2026
      </footer>
    </div>
  );
};

export default Login;
