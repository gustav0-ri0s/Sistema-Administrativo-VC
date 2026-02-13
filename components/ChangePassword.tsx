
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { profileService } from '../services/database.service';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface ChangePasswordProps {
    userId: string;
    onSuccess: () => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ userId, onSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const { showToast } = useToast();

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 8) {
            showToast('error', 'La contraseña debe tener al menos 8 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            showToast('error', 'Las contraseñas no coinciden');
            return;
        }

        try {
            setIsUpdating(true);

            // 1. Update password in Supabase Auth
            const { error: authError } = await supabase.auth.updateUser({
                password: password
            });

            if (authError) throw authError;

            // 2. Clear the force_password_change flag in profiles
            await profileService.update(userId, {
                force_password_change: false
            });

            showToast('success', 'Contraseña actualizada correctamente');
            onSuccess();
        } catch (error: any) {
            console.error('ChangePassword error:', error);
            showToast('error', error.message || 'Error al actualizar contraseña');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-500">
                <header className="p-8 bg-slate-50 border-b border-slate-100 text-center">
                    <div className="w-16 h-16 bg-[#57C5D5]/10 text-[#57C5D5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Cambio de Seguridad</h2>
                    <p className="text-slate-500 text-sm mt-2 font-medium">Por política de seguridad institucional, debes actualizar tu contraseña para continuar.</p>
                </header>

                <form onSubmit={handleUpdate} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#57C5D5]/20 outline-none transition-all"
                                    placeholder="Mínimo 8 caracteres"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Contraseña</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#57C5D5]/20 outline-none transition-all"
                                placeholder="Repite la contraseña"
                            />
                        </div>
                    </div>

                    <div className="bg-[#57C5D5]/5 p-4 rounded-2xl border border-[#57C5D5]/10 space-y-2">
                        <p className="text-[10px] font-bold text-[#57C5D5] uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3" /> Requerimientos
                        </p>
                        <ul className="text-[10px] text-slate-500 font-medium space-y-1">
                            <li className={`flex items-center gap-1.5 ${password.length >= 8 ? 'text-emerald-600' : ''}`}>
                                • Al menos 8 caracteres alfanuméricos
                            </li>
                            <li className={`flex items-center gap-1.5 ${password && password === confirmPassword ? 'text-emerald-600' : ''}`}>
                                • Ambas contraseñas deben ser idénticas
                            </li>
                        </ul>
                    </div>

                    <button
                        type="submit"
                        disabled={isUpdating || password.length < 8 || password !== confirmPassword}
                        className="w-full py-4 bg-[#57C5D5] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-[#57C5D5]/20 hover:bg-[#46b3c2] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isUpdating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Actualizando...
                            </>
                        ) : (
                            'Actualizar y Entrar'
                        )}
                    </button>
                </form>

                <footer className="px-8 pb-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-amber-500 bg-amber-50 py-2 px-4 rounded-xl border border-amber-100">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">Cambio Obligatorio</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ChangePassword;
