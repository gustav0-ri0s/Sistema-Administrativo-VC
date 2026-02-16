
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            const hash = window.location.hash.startsWith("#")
                ? window.location.hash.slice(1)
                : "";

            const params = new URLSearchParams(hash);
            const access_token = params.get("access_token");
            const refresh_token = params.get("refresh_token");
            const returnTo = params.get("returnTo") || "/dashboard";

            if (!access_token || !refresh_token) {
                console.error("AuthCallback: Missing tokens in hash");
                const portal = import.meta.env.VITE_PORTAL_URL || "https://valores-y-ciencias.vercel.app";
                window.location.href = `${portal}/login?returnTo=${encodeURIComponent(window.location.href)}`;
                return;
            }

            try {
                // ✅ inyecta sesión en este dominio
                const { error } = await supabase.auth.setSession({
                    access_token: access_token,
                    refresh_token: refresh_token,
                });

                if (error) throw error;

                // ✅ limpia hash (no dejar tokens expuestos)
                window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname + window.location.search
                );

                // ✅ navega a donde te mandó el portal
                navigate(returnTo, { replace: true });
            } catch (err) {
                console.error("AuthCallback: Error setting session:", err);
                const portal = import.meta.env.VITE_PORTAL_URL || "https://valores-y-ciencias.vercel.app";
                window.location.href = `${portal}/login?error=session_failed`;
            }
        })();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-slate-100 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-20 h-20 border-t-4 border-[#57C5D5] rounded-full animate-spin"></div>
            </div>
            <div className="mt-8 space-y-2">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Iniciando Sesión</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] leading-relaxed">Conectando con el portal institucional...</p>
            </div>
        </div>
    );
}
