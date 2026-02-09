
import React from 'react';
import { ShieldAlert, ExternalLink, LogOut, Heart } from 'lucide-react';
import { UserRole } from '../types';

interface RestrictedAccessProps {
    role: UserRole;
    onLogout: () => void;
}

const RestrictedAccess: React.FC<RestrictedAccessProps> = ({ role, onLogout }) => {
    const externalPlatforms = [
        {
            name: 'Sistema de Incidencias',
            url: 'https://sistema-de-incidencias.vercel.app/',
            description: 'Reporte y seguimiento de convivencia escolar.',
            icon: <ExternalLink className="w-4 h-4" />
        },
        {
            name: 'Sistema de Calificaciones',
            url: '#',
            description: 'Registro de notas y competencias (Próximamente).',
            icon: <ExternalLink className="w-4 h-4 text-slate-300" />
        },
        {
            name: 'Asistencia Escolar',
            url: '#',
            description: 'Marcado de asistencia de los alumnos (Próximamente).',
            icon: <ExternalLink className="w-4 h-4 text-slate-300" />
        }
    ];

    const handleLogoutClick = () => {
        console.log('RestrictedAccess: Logoout button clicked');
        onLogout();
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-6 font-sans">
            <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-[#57C5D5]/10 border border-slate-100 relative overflow-hidden">
                    {/* Decorative Pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#57C5D5]/5 rounded-full -mr-16 -mt-16" />

                    <div className="relative text-center">
                        <div className="inline-flex p-4 bg-amber-50 rounded-3xl text-amber-500 mb-6">
                            <ShieldAlert className="w-10 h-10" />
                        </div>

                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                            Acceso Restringido
                        </h1>

                        <p className="mt-4 text-slate-500 text-sm font-medium leading-relaxed">
                            Hola. Tu cuenta tiene asignado el rol de <span className="text-amber-600 font-bold uppercase tracking-wider">{role}</span>.
                        </p>

                        <div className="mt-6 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                            <p className="text-xs text-slate-600 leading-relaxed italic">
                                "Este Módulo Administrativo es exclusivo para el equipo de dirección, secretaría y supervisión."
                            </p>
                        </div>

                        <div className="mt-8 space-y-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Plataformas Disponibles para ti</p>

                            {externalPlatforms.map((platform, idx) => (
                                <a
                                    key={idx}
                                    href={platform.url}
                                    target={platform.url !== '#' ? '_blank' : undefined}
                                    rel="noopener noreferrer"
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${platform.url !== '#'
                                        ? 'bg-white border-slate-100 hover:border-[#57C5D5] hover:shadow-lg hover:shadow-[#57C5D5]/5 group'
                                        : 'bg-slate-50 border-transparent cursor-not-allowed opacity-60'
                                        }`}
                                >
                                    <div className="text-left">
                                        <p className={`text-xs font-bold ${platform.url !== '#' ? 'text-slate-800' : 'text-slate-400'}`}>
                                            {platform.name}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{platform.description}</p>
                                    </div>
                                    <div className={platform.url !== '#' ? 'text-[#57C5D5] group-hover:translate-x-1 transition-transform' : 'text-slate-300'}>
                                        {platform.icon}
                                    </div>
                                </a>
                            ))}
                        </div>

                        <button
                            onClick={handleLogoutClick}
                            className="mt-10 w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98]"
                        >
                            <LogOut className="w-4 h-4" />
                            Cerrar Sesión
                        </button>

                        <div className="mt-8 flex items-center justify-center gap-2 opacity-30 grayscale">
                            <img src="/logo-colegio.png" alt="Logo" className="h-6" onError={(e) => (e.currentTarget.style.display = 'none')} />
                            <span className="text-[10px] font-black uppercase text-slate-900">Valores y Ciencias</span>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-center text-slate-400 text-[10px] font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-1">
                    Hecho con <Heart className="w-3 h-3 text-red-500 fill-red-500" /> para I.E.P. Valores y Ciencias
                </p>
            </div>
        </div>
    );
};

export default RestrictedAccess;
