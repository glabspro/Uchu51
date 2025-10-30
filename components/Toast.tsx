
import React, { useEffect } from 'react';
import { CheckCircleIcon, InformationCircleIcon } from './icons';

interface ToastProps {
    message: string;
    type: 'success' | 'info';
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 6000);

        return () => {
            clearTimeout(timer);
        };
    }, [onClose]);

    const baseStyle = "text-white p-4 rounded-xl shadow-2xl flex items-start w-full border border-white/10";
    const animationStyle = "animate-fade-in-right";
    const typeStyles = {
        success: "bg-success",
        info: "bg-text-primary",
    };
    
    const Icon = type === 'success' ? CheckCircleIcon : InformationCircleIcon;

    return (
        <div className={`${baseStyle} ${typeStyles[type]} ${animationStyle}`}>
            <div className="flex-shrink-0 pt-0.5">
                <Icon className="h-6 w-6" />
            </div>
            <div className="ml-3 flex-1">
                <p className="text-sm font-semibold">{message}</p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
                <button onClick={onClose} className="-mx-1.5 -my-1.5 bg-transparent inline-flex rounded-md p-1.5 text-white/80 hover:text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-600 focus:ring-white">
                    <span className="sr-only">Close</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Toast;