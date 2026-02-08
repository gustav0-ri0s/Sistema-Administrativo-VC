import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';

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
        // Small delay to trigger animation
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
    };

    const styles = {
        success: {
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            text: 'text-emerald-800',
            iconColor: 'text-emerald-500',
            icon: CheckCircle2
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-100',
            text: 'text-red-800',
            iconColor: 'text-red-500',
            icon: AlertCircle
        },
        warning: {
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            text: 'text-amber-800',
            iconColor: 'text-amber-500',
            icon: AlertTriangle
        },
        info: {
            bg: 'bg-sky-50',
            border: 'border-sky-100',
            text: 'text-sky-800',
            iconColor: 'text-sky-500',
            icon: Info
        }
    };

    const style = styles[type];
    const Icon = style.icon;

    return (
        <div
            className={`
        w-80 md:w-96 p-4 rounded-2xl shadow-lg border-2 flex items-start gap-3 transform transition-all duration-300 ease-out
        ${style.bg} ${style.border}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
        >
            <div className={`p-2 bg-white rounded-full shadow-sm shrink-0 ${style.iconColor}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                {title && (
                    <h4 className={`text-sm font-black uppercase tracking-wide mb-1 ${style.text}`}>
                        {title}
                    </h4>
                )}
                <p className={`text-xs font-medium leading-relaxed ${style.text} opacity-90`}>
                    {message}
                </p>
            </div>
            <button
                onClick={handleClose}
                className={`p-1 rounded-lg hover:bg-black/5 transition-colors ${style.text}`}
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};
