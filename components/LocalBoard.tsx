
import React from 'react';
import type { Mesa, EstadoPedido } from '../types';
import { CreditCardIcon, ClockIcon, CheckCircleIcon, FireIcon, AdjustmentsHorizontalIcon, BellIcon, UserIcon } from './icons';

interface LocalBoardProps {
    mesas: Mesa[];
    onSelectMesa: (mesa: Mesa) => void;
}

const statusConfig: { [key in EstadoPedido]?: { label: string; icon: React.ReactNode; progress: number; className: string; pulse?: boolean; pulseColor?: string; } } = {
    'nuevo': { label: 'Nuevo', icon: <ClockIcon className="h-4 w-4" />, progress: 10, className: 'bg-gray-500' },
    'confirmado': { label: 'Confirmado', icon: <CheckCircleIcon className="h-4 w-4" />, progress: 25, className: 'bg-primary' },
    'en preparación': { label: 'En Cocina', icon: <FireIcon className="h-4 w-4" />, progress: 50, className: 'bg-amber-500' },
    'en armado': { label: 'En Armado', icon: <AdjustmentsHorizontalIcon className="h-4 w-4" />, progress: 75, className: 'bg-yellow-400' },
    'listo': { label: 'Listo p/ Servir', icon: <BellIcon className="h-4 w-4" />, progress: 100, className: 'bg-green-500', pulse: true, pulseColor: '52, 211, 153' }, // green
    'entregado': { label: 'En Mesa', icon: <UserIcon className="h-4 w-4" />, progress: 100, className: 'bg-emerald-600' },
    'cuenta solicitada': { label: 'Pidiendo Cuenta', icon: <CreditCardIcon className="h-4 w-4" />, progress: 100, className: 'bg-blue-500', pulse: true, pulseColor: '59, 130, 246' }, // blue
};

const LocalBoard: React.FC<LocalBoardProps> = ({ mesas, onSelectMesa }) => {
    return (
        <div>
            <h1 className="text-3xl font-heading font-bold mb-8 text-text-primary dark:text-slate-100">Gestión de Salón</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {mesas.map((mesa, i) => {
                    const statusInfo = mesa.ocupada && mesa.estadoPedido ? statusConfig[mesa.estadoPedido] : null;

                    const cardClasses = [
                        'table-card',
                        'group',
                        'animate-fade-in-up',
                        'bg-surface dark:bg-slate-800',
                        'rounded-2xl shadow-lg',
                        'flex flex-col items-center justify-center',
                        'p-4 text-center transition-all duration-300',
                        'active:scale-95 border-2',
                        'relative overflow-hidden h-48',
                        mesa.ocupada ? 'border-primary/50 dark:border-primary/70' : 'border-transparent dark:border-slate-700',
                        statusInfo?.pulse ? 'animate-pulse-glow' : '',
                    ].join(' ');

                    const cardStyle = {
                        '--delay': `${i * 30}ms`,
                        '--glow-color': statusInfo?.pulseColor || '249, 115, 22',
                    } as React.CSSProperties;

                    return (
                        <button 
                            key={mesa.numero} 
                            onClick={() => onSelectMesa(mesa)}
                            style={cardStyle}
                            className={cardClasses}
                        >
                            <div className="absolute top-3 left-3 text-xs font-mono text-text-secondary/60 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                               {mesa.pedidoId}
                            </div>
                            
                            <h2 className="text-6xl font-heading font-extrabold text-text-primary dark:text-slate-100 group-hover:text-primary transition-colors">
                                {mesa.numero}
                            </h2>
                            <p className="font-semibold text-text-secondary dark:text-slate-400 -mt-1">Mesa</p>

                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                                {mesa.ocupada ? (
                                    statusInfo ? (
                                        <div>
                                            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                                                {statusInfo.icon}
                                                <span>{statusInfo.label}</span>
                                            </div>
                                            <div className="w-full bg-black/20 dark:bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
                                                <div className={`${statusInfo.className} h-1.5 rounded-full transition-all duration-500`} style={{width: `${statusInfo.progress}%`}}></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className={`text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-primary/20 text-primary`}>
                                            Ocupada
                                        </span>
                                    )
                                ) : (
                                     <span className={`text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-text-primary/10 dark:bg-slate-700 text-text-primary dark:text-slate-200`}>
                                        Libre
                                    </span>
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

export default LocalBoard;