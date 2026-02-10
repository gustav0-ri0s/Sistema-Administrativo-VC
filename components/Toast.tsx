import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle, Sparkles } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    type: ToastType;
    message: string;
    title?: string;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ type, message, title, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    const styles = {
        success: {
            bg: 'bg-emerald-50/90 backdrop-blur-md',
            border: 'border-emerald-200/50',
            text: 'text-emerald-900',
            iconColor: 'bg-emerald-500',
            icon: CheckCircle2,
            shadow: 'shadow-emerald-200/50'
        },
        error: {
            bg: 'bg-red-50/90 backdrop-blur-md',
            border: 'border-red-200/50',
            text: 'text-red-900',
            iconColor: 'bg-red-500',
            icon: AlertCircle,
            shadow: 'shadow-red-200/50'
        },
        warning: {
            bg: 'bg-amber-50/90 backdrop-blur-md',
            border: 'border-amber-200/50',
            text: 'text-amber-900',
            iconColor: 'bg-amber-500',
            icon: AlertTriangle,
            shadow: 'shadow-amber-200/50'
        },
        info: {
            bg: 'bg-sky-50/90 backdrop-blur-md',
            border: 'border-sky-200/50',
            text: 'text-sky-900',
            iconColor: 'bg-sky-500',
            icon: Info,
            shadow: 'shadow-sky-200/50'
        }
    };

    const style = styles[type];
    const Icon = style.icon;

    return (
        <div
            className={`
                w-80 md:w-96 p-4 rounded-3xl shadow-2xl border flex items-start gap-4 transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                ${style.bg} ${style.border} ${style.shadow}
                ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-12 opacity-0 scale-90'}
            `}
        >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${style.iconColor} text-white`}>
                <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
                {title ? (
                    <h4 className={`text-xs font-black uppercase tracking-[0.15em] mb-1 flex items-center gap-2 ${style.text}`}>
                        {title}
                        {type === 'success' && <Sparkles className="w-3 h-3 text-emerald-400" />}
                    </h4>
                ) : (
                    <h4 className={`text-xs font-black uppercase tracking-[0.15em] mb-1 ${style.text}`}>
                        {type === 'success' ? 'Éxito' : type === 'error' ? 'Error' : type === 'warning' ? 'Atención' : 'Información'}
                    </h4>
                )}
                <p className={`text-sm font-semibold leading-relaxed ${style.text} opacity-80 break-words`}>
                    {message}
                </p>
            </div>

            <button
                onClick={handleClose}
                className={`p-1.5 rounded-xl hover:bg-black/5 transition-all active:scale-90 ${style.text}`}
            >
                <X className="w-4 h-4" />
            </button>

            <div className="absolute bottom-0 left-0 h-1 bg-white/20 rounded-full animate-progress-bar" style={{ width: '100%' }}></div>
        </div>
    );
};
