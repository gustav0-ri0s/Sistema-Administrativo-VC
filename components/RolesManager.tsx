
import React, { useState, useEffect } from 'react';
import { rolePermissionService, profileService, portalModuleService, roleManagementService } from '../services/database.service';
import { RolePermission, UserRole, Profile } from '../types';
import { NAVIGATION_ITEMS, ROLE_LABELS } from '../constants';
import {
    ShieldCheck,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Users,
    Mail,
    Phone,
    LayoutGrid,
    Globe,
    Settings,
    Plus,
    X,
    ClipboardPen,
    UserCheck,
    Stethoscope,
    Calendar,
    AlertTriangle,
    Check
} from 'lucide-react';
import { supabase } from '../services/supabase';

const EXTERNAL_SYSTEMS = [
    { key: 'ADMIN', title: 'Administrativo', icon: <Settings />, description: 'Gestión central de la institución' },
    { key: 'GRADES', title: 'Calificaciones', icon: <ClipboardPen />, description: 'Registro y gestión de notas' },
    { key: 'ATTENDANCE', title: 'Asistencia', icon: <UserCheck />, description: 'Control de asistencia docente/alumnos' },
    { key: 'INCIDENTS', title: 'Incidencias', icon: <AlertTriangle />, description: 'Reporte y seguimiento de eventos' },
    { key: 'CALENDARIZATION', title: 'Calendarización', icon: <Calendar />, description: 'Gestión de horarios y cronogramas' },
    { key: 'PSYCHOLOGY', title: 'Psicología', icon: <Stethoscope />, description: 'Seguimiento psicopedagógico' },
];

const SYSTEM_COLORS: Record<string, string> = {
    ADMIN: 'bg-indigo-500',
    GRADES: 'bg-emerald-500',
    ATTENDANCE: 'bg-[#4dbdcc]',
    INCIDENTS: 'bg-orange-500',
    CALENDARIZATION: 'bg-blue-500',
    PSYCHOLOGY: 'bg-pink-500',
};

const RolesManager: React.FC = () => {
    const [permissions, setPermissions] = useState<RolePermission[]>([]);
    const [portalModules, setPortalModules] = useState<any[]>([]);
    const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
    const [roles, setRoles] = useState<string[]>([]);
    const [selectedRole, setSelectedRole] = useState<string>(UserRole.ADMIN);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [showAddRoleModal, setShowAddRoleModal] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [permsData, profilesData, portalData] = await Promise.all([
                rolePermissionService.getAll(),
                profileService.getAll(),
                portalModuleService.getAll()
            ]);
            setPermissions(permsData);
            setAllProfiles(profilesData);
            setPortalModules(portalData);

            // Extract distinct roles from all sources
            const allRoles = Array.from(new Set([
                ...Object.values(UserRole),
                ...permsData.map(p => p.role as string),
                ...portalData.map(p => p.role as string)
            ]));
            setRoles(allRoles);
        } catch (error) {
            console.error('Error loading data:', error);
            setMessage({ text: 'Error al cargar datos', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const activePermissions = permissions.find(p => p.role === selectedRole);
    const selectedInternalModules = activePermissions?.modules || [];
    const roleUsers = allProfiles.filter(p => p.role === selectedRole);
    const rolePortalModules = portalModules.filter(m => m.role === selectedRole);
    const hasAdminAccess = rolePortalModules.some(m => m.module_key === 'ADMIN');

    const handleToggleInternalModule = (moduleId: string) => {
        const newModules = selectedInternalModules.includes(moduleId)
            ? selectedInternalModules.filter(id => id !== moduleId)
            : [...selectedInternalModules, moduleId];

        setPermissions(prev => {
            const exists = prev.some(p => p.role === selectedRole);
            if (!exists) {
                return [...prev, { role: selectedRole as UserRole, modules: newModules }];
            }
            return prev.map(p => p.role === selectedRole ? { ...p, modules: newModules } : p);
        });
    };

    const handleToggleExternalSystem = (systemKey: string) => {
        const isSelected = rolePortalModules.some(m => m.module_key === systemKey);

        if (isSelected) {
            setPortalModules(prev => prev.filter(m => !(m.role === selectedRole && m.module_key === systemKey)));
        } else {
            const system = EXTERNAL_SYSTEMS.find(s => s.key === systemKey);
            const newModule = {
                role: selectedRole,
                module_key: systemKey,
                module_title: system?.title,
                module_description: system?.description,
                module_url: getSystemUrl(systemKey),
                module_color: SYSTEM_COLORS[systemKey] || 'bg-slate-500',
                display_order: EXTERNAL_SYSTEMS.findIndex(s => s.key === systemKey) + 1,
                active: true,
                return_to: getSystemReturnTo(systemKey)
            };
            setPortalModules(prev => [...prev, newModule]);
        }
    };

    const getSystemUrl = (key: string) => {
        switch (key) {
            case 'ADMIN': return 'https://sistema-administrativo-vc.vercel.app';
            case 'ATTENDANCE': return 'https://sistema-de-asistencia-silk.vercel.app';
            case 'GRADES': return 'https://sistema-de-calificaciones-vc.vercel.app';
            case 'INCIDENTS': return 'https://sistema-de-incidencias.vercel.app';
            case 'CALENDARIZATION': return 'https://sistema-calendarizacion.vercel.app';
            case 'PSYCHOLOGY': return 'https://sistema-psicologia.vercel.app';
            default: return '';
        }
    };

    const getSystemReturnTo = (key: string) => {
        switch (key) {
            case 'ADMIN': return '/dashboard';
            case 'ATTENDANCE': return '/asistencias';
            case 'GRADES': return '/registro';
            case 'INCIDENTS': return '/panel';
            case 'CALENDARIZATION': return '/calendar';
            case 'PSYCHOLOGY': return '/psicologia';
            default: return '/';
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await Promise.all([
                rolePermissionService.update(selectedRole as any, selectedInternalModules),
                portalModuleService.updateRoleModules(selectedRole, rolePortalModules)
            ]);
            setMessage({ text: 'Configuración de seguridad actualizada', type: 'success' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error saving permissions:', error);
            setMessage({ text: 'Error al sincronizar con la base de datos', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddRole = async () => {
        if (!newRoleName.trim()) return;

        try {
            const normalizedRole = newRoleName.toLowerCase().trim().replace(/\s+/g, '_');

            // 1. Add to postgres enum if possible (via RCP or just trust insertion if RLS allows)
            // For now, we'll try to insert a permission record which often forces the role existence in DB logic
            await rolePermissionService.update(normalizedRole as any, []);

            setRoles(prev => Array.from(new Set([...prev, normalizedRole])));
            setSelectedRole(normalizedRole);
            setNewRoleName('');
            setShowAddRoleModal(false);
            setMessage({ text: `Cargo "${newRoleName}" añadido correctamente`, type: 'success' });
        } catch (error) {
            console.error('Error adding role:', error);
            setMessage({ text: 'Error al crear el nuevo cargo', type: 'error' });
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="w-10 h-10 text-[#57C5D5] animate-spin" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sincronizando seguridad...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Perfiles y Sub-sistemas</h2>
                    <p className="text-slate-500 font-medium mt-1">Configura el acceso global a los subsistemas y módulos internos.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowAddRoleModal(true)}
                        className="flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-slate-900 text-slate-900 px-6 py-3 rounded-2xl font-black transition-all text-xs uppercase tracking-widest"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Cargo
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-[#7CD6DE] hover:bg-[#68c1c9] text-slate-700 px-8 py-3 rounded-2xl font-black transition-all shadow-xl shadow-[#7CD6DE]/20 disabled:opacity-50 uppercase tracking-widest text-xs"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar Cambios
                    </button>
                </div>
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
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex justify-between">
                            Cargos y Perfiles
                            <span className="text-[#57C5D5]">{roles.length}</span>
                        </h3>
                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {roles.sort().map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setSelectedRole(role)}
                                    className={`w-full flex items-center justify-between px-5 py-4 rounded-3xl font-black transition-all ${selectedRole === role
                                        ? 'bg-slate-900 text-white shadow-xl scale-[1.02]'
                                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${selectedRole === role ? 'bg-white/10' : 'bg-white'}`}>
                                            <ShieldCheck className={`w-4 h-4 ${selectedRole === role ? 'text-[#7CD6DE]' : 'text-slate-300'}`} />
                                        </div>
                                        <span className="text-[11px] uppercase tracking-wider truncate max-w-[120px]">
                                            {ROLE_LABELS[role as UserRole] || role.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <div className={`text-[9px] px-2 py-0.5 rounded-full ${selectedRole === role ? 'bg-[#7CD6DE] text-slate-900' : 'bg-slate-200 text-slate-500'}`}>
                                        {allProfiles.filter(p => p.role === role).length}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Assigned Staff Preview */}
                    <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-2xl">
                        <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-4">
                            <Users className="w-4 h-4 text-[#7CD6DE]" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-[#7CD6DE]">Personal</h4>
                        </div>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {roleUsers.length > 0 ? (
                                roleUsers.map(user => (
                                    <div key={user.id} className="text-[10px] bg-white/5 p-3 rounded-2xl border border-white/5">
                                        <p className="font-bold uppercase truncate">{user.full_name}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[10px] text-slate-500 italic text-center py-4">Sin personal asignado</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main: Systems and Modules */}
                <div className="xl:col-span-3 space-y-8">
                    {/* Sub-systems Section */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-6">
                            <Globe className="w-6 h-6 text-[#57C5D5]" />
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Acceso a Sub-Sistemas</h3>
                                <p className="text-sm text-slate-400 font-medium">Define a qué plataformas tiene acceso el cargo <span className="text-[#57C5D5] font-black">{ROLE_LABELS[selectedRole as UserRole] || selectedRole}</span>.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {EXTERNAL_SYSTEMS.map((system) => {
                                const isSelected = rolePortalModules.some(m => m.module_key === system.key);
                                return (
                                    <div
                                        key={system.key}
                                        onClick={() => handleToggleExternalSystem(system.key)}
                                        className={`group relative p-6 rounded-[2rem] border-2 transition-all cursor-pointer ${isSelected
                                            ? 'border-[#7CD6DE] bg-[#7CD6DE]/5'
                                            : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all ${isSelected ? SYSTEM_COLORS[system.key] + ' text-white scale-110' : 'bg-white text-slate-300'}`}>
                                            {React.cloneElement(system.icon as React.ReactElement, { className: 'w-6 h-6' })}
                                        </div>
                                        <h4 className={`text-sm font-black uppercase tracking-wider mb-1 ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                                            {system.title}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                            {system.description}
                                        </p>

                                        {isSelected && (
                                            <div className="absolute top-4 right-4 w-5 h-5 bg-[#7CD6DE] rounded-full flex items-center justify-center">
                                                <Check className="w-3 h-3 text-white" strokeWidth={4} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Internal Administrative Modules (Conditional) */}
                    {hasAdminAccess && (
                        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in zoom-in-95 duration-500">
                            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-6">
                                <LayoutGrid className="w-6 h-6 text-indigo-500" />
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Módulos Administrativos</h3>
                                    <p className="text-sm text-slate-400 font-medium">Permisos específicos dentro de este sistema administrativo.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {NAVIGATION_ITEMS.map((item) => {
                                    const isSelected = selectedInternalModules.includes(item.id);
                                    return (
                                        <label
                                            key={item.id}
                                            className={`group flex items-center gap-4 p-5 rounded-3xl border transition-all cursor-pointer ${isSelected
                                                ? 'border-indigo-100 bg-indigo-50/30'
                                                : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
                                                }`}
                                        >
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    className="peer absolute opacity-0 w-full h-full cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleInternalModule(item.id)}
                                                    disabled={selectedRole === UserRole.ADMIN && item.id === 'roles'}
                                                />
                                                <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${isSelected
                                                    ? 'bg-indigo-500 border-indigo-500 shadow-lg shadow-indigo-500/30'
                                                    : 'bg-white border-slate-200'
                                                    }`}>
                                                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl transition-colors ${isSelected ? 'bg-indigo-500 text-white' : 'bg-white text-slate-400 group-hover:text-slate-600'}`}>
                                                    {React.cloneElement(item.icon as React.ReactElement, { className: 'w-4 h-4' })}
                                                </div>
                                                <span className={`text-[11px] font-black uppercase tracking-wider ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                                                    {item.label}
                                                </span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Role Modal */}
            {showAddRoleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-900 uppercase">Nuevo Cargo Institucional</h3>
                            <button onClick={() => setShowAddRoleModal(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Nombre del Cargo</label>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Ej: Psicóloga, Tesorero, etc."
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-2 focus:ring-[#7CD6DE] focus:border-transparent transition-all font-bold placeholder:text-slate-300"
                                />
                            </div>

                            <p className="text-[10px] text-slate-400 italic">
                                * El cargo se creará con acceso restringido por defecto. Podrás configurar sus permisos una vez creado.
                            </p>

                            <button
                                onClick={handleAddRole}
                                disabled={!newRoleName.trim()}
                                className="w-full py-4 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                            >
                                Crear Cargo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RolesManager;

