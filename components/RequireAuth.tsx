
import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { profileService } from "../services/database.service";
import { UserRole, Profile } from "../types";
import RestrictedAccess from "./RestrictedAccess";

const ALLOWED_ROLES = [
    UserRole.ADMIN,
    UserRole.SUBDIRECTOR,
    UserRole.SUPERVISOR,
    UserRole.SECRETARIA,
    UserRole.DOCENTE_INGLES
];

interface RequireAuthProps {
    children: React.ReactNode;
    onUserLoaded: (user: Profile) => void;
}

export function RequireAuth({ children, onUserLoaded }: RequireAuthProps) {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [userProfile, setUserProfile] = useState<Profile | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    console.log("RequireAuth: No session found, redirecting to portal");
                    redirectToPortal();
                    return;
                }

                // Get user profile to check roles
                const profile = await profileService.getById(session.user.id);

                if (!profile) {
                    console.error("RequireAuth: Profile not found");
                    redirectToPortal();
                } else if (!ALLOWED_ROLES.includes(profile.role)) {
                    console.warn("RequireAuth: Role not authorized:", profile.role);
                    setUserProfile(profile);
                    setAuthorized(false);
                } else {
                    setUserProfile(profile);
                    setAuthorized(true);
                    onUserLoaded(profile);
                }
            } catch (error) {
                console.error("RequireAuth: Error during validation:", error);
                redirectToPortal();
            } finally {
                setLoading(false);
            }
        })();

        function redirectToPortal() {
            const portal = import.meta.env.VITE_PORTAL_URL || "https://portal-vc-academico.vercel.app";
            const currentUrl = window.location.href;
            window.location.href = `${portal}?view=login&returnTo=${encodeURIComponent(currentUrl)}`;
        }
    }, [onUserLoaded]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-slate-100 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-20 h-20 border-t-4 border-[#57C5D5] rounded-full animate-spin"></div>
                </div>
                <div className="mt-8 space-y-2">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Validando Sesión</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] leading-relaxed">Verificando autorizaciones...</p>
                </div>
            </div>
        );
    }

    if (!authorized && userProfile) {
        return <RestrictedAccess role={userProfile.role} onLogout={() => {
            supabase.auth.signOut().then(() => {
                const portal = import.meta.env.VITE_PORTAL_URL || "https://valores-y-ciencias.vercel.app";
                window.location.href = portal;
            });
        }} />;
    }

    if (!authorized) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Acceso Denegado</h2>
                <p className="text-xs text-slate-500 mt-2">No tienes permisos para acceder a este módulo.</p>
                <button
                    onClick={() => window.location.href = import.meta.env.VITE_PORTAL_URL || "https://valores-y-ciencias.vercel.app"}
                    className="mt-6 px-6 py-2 bg-[#57C5D5] text-white rounded-xl text-xs font-bold uppercase tracking-widest"
                >
                    Volver al Portal
                </button>
            </div>
        );
    }

    return <>{children}</>;
}
