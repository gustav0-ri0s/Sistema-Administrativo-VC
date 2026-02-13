
import React, { useState, useEffect } from 'react';
import { rolePermissionService, profileService } from '../services/database.service';
import { RolePermission, UserRole, Profile } from '../types';
import { NAVIGATION_ITEMS, ROLE_LABELS } from '../constants';
import { ShieldCheck, Save, Loader2, CheckCircle2, AlertCircle, Users, Mail, Phone, Calendar } from 'lucide-react';

const RolesManager: React.FC = () => {
    const [permissions, setPermissions] = useState<RolePermission[]>([]);
    const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
    const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [permsData, profilesData] = await Promise.all([
                rolePermissionService.getAll(),
                profileService.getAll()
            ]);
            setPermissions(permsData);
            setAllProfiles(profilesData);
        } catch (error) {
            console.error('Error loading data:', error);
            setMessage({ text: 'Error al cargar datos', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const activePermissions = permissions.find(p => p.role === selectedRole);
    const selectedModules = activePermissions?.modules || [];
    const roleUsers = allProfiles.filter(p => p.role === selectedRole);

    const handleToggleModule = (moduleId: string) => {
        const isSelected = selectedModules.includes(moduleId);
        const newModules = isSelected
            ? selectedModules.filter(id => id !== moduleId)
            : [...selectedModules, moduleId];

        setPermissions(prev => prev.map(p =>
            p.role === selectedRole ? { ...p, modules: newModules } : p
        ));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await rolePermissionService.update(selectedRole, selectedModules);
            setMessage({ text: 'Configuración actualizada correctamente', type: 'success' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error saving permissions:', error);
            setMessage({ text: 'Error al guardar cambios', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="w-10 h-10 text-[#57C5D5] animate-spin" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Módulo de Roles</h2>
                    <p className="text-slate-500 font-medium italic">Gestiona el acceso y visualiza el personal por cargo.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-slate-900 border-2 border-slate-900 hover:bg-white hover:text-slate-900 text-white px-8 py-3 rounded-2xl font-black transition-all shadow-xl disabled:opacity-50 uppercase tracking-widest text-xs"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar Cambios
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p className="text-sm font-bold">{message.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Left: Role Selection */}
                <div className="xl:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Cargos Disponibles</h3>
                        <div className="space-y-2">
                            {Object.values(UserRole).map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setSelectedRole(role)}
                                    className={`w-full flex items-center justify-between px-5 py-5 rounded-3xl font-black transition-all ${selectedRole === role
                                        ? 'bg-[#57C5D5] text-white shadow-xl shadow-[#57C5D5]/20 scale-[1.02]'
                                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className={`w-5 h-5 ${selectedRole === role ? 'text-white' : 'text-slate-300'}`} />
                                        <span className="text-xs uppercase tracking-wider">{ROLE_LABELS[role]}</span>
                                    </div>
                                    <div className={`text-[10px] px-2 py-0.5 rounded-full ${selectedRole === role ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                        {allProfiles.filter(p => p.role === role).length}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Middle: Module Access */}
                <div className="xl:col-span-2 space-y-8">
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Acceso a Módulos</h3>
                                <p className="text-sm text-slate-400 font-medium">Marca los módulos que el cargo <span className="text-[#57C5D5] font-black">{ROLE_LABELS[selectedRole]}</span> tendrá permitidos.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {NAVIGATION_ITEMS.map((item) => (
                                <label
                                    key={item.id}
                                    className={`group flex items-center gap-4 p-5 rounded-3xl border-2 transition-all cursor-pointer ${selectedModules.includes(item.id)
                                        ? 'border-[#57C5D5]/30 bg-[#57C5D5]/5'
                                        : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
                                        }`}
                                >
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            className="peer absolute opacity-0 w-full h-full cursor-pointer"
                                            checked={selectedModules.includes(item.id)}
                                            onChange={() => handleToggleModule(item.id)}
                                            disabled={selectedRole === UserRole.ADMIN && item.id === 'roles'}
                                        />
                                        <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${selectedModules.includes(item.id)
                                            ? 'bg-[#57C5D5] border-[#57C5D5] shadow-lg shadow-[#57C5D5]/30'
                                            : 'bg-white border-slate-200'
                                            }`}>
                                            {selectedModules.includes(item.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-2xl transition-colors ${selectedModules.includes(item.id) ? 'bg-[#57C5D5] text-white' : 'bg-white text-slate-400 group-hover:text-slate-600'}`}>
                                            {React.cloneElement(item.icon as React.ReactElement, { className: 'w-5 h-5' })}
                                        </div>
                                        <span className={`text-sm font-black uppercase tracking-wider ${selectedModules.includes(item.id) ? 'text-slate-900' : 'text-slate-400'}`}>
                                            {item.label}
                                        </span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Personal (Users with this role) */}
                <div className="xl:col-span-1 space-y-4">
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl space-y-6">
                        <div className="flex items-center gap-3 border-b border-white/10 pb-6">
                            <Users className="w-6 h-6 text-[#57C5D5]" />
                            <h3 className="text-lg font-black uppercase tracking-tighter">Personal Asignado</h3>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {roleUsers.length > 0 ? (
                                roleUsers.map((user) => (
                                    <div key={user.id} className="bg-white/5 border border-white/10 p-5 rounded-[2rem] hover:bg-white/10 transition-colors">
                                        <p className="font-black text-sm uppercase tracking-tight mb-1">{user.full_name}</p>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                <Mail className="w-3 h-3 text-[#57C5D5]" />
                                                {user.email || 'Sin correo'}
                                            </div>
                                            {user.phone && (
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                    <Phone className="w-3 h-3 text-[#57C5D5]" />
                                                    {user.phone}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                                        <Users className="w-6 h-6 text-white/20" />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No hay personal con este cargo</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RolesManager;
