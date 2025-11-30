
import React from 'react';
import type { Mesa, EstadoPedido } from '../types';
import { useAppContext } from '../store';
import { CreditCardIcon, ClockIcon, CheckCircleIcon, FireIcon, AdjustmentsHorizontalIcon, BellIcon, UserIcon } from './icons';

interface LocalBoardProps {
    mesas: Mesa[];
}

const statusConfig: { [key in EstadoPedido]?: { label: string; icon: React.ReactNode; progress: number; className: string; pulse?: boolean; pulseColor?: string; } } = {
    'nuevo': { label: 'Tomando Orden', icon: <ClockIcon className="h-4 w-4" />, progress: 10, className: 'bg-gray-500' },
    'confirmado': { label: 'Confirmado', icon: <CheckCircleIcon className="h-4 w-4" />, progress: 20, className: 'bg-primary' },
    'en preparación': { label: 'Cocinando', icon: <FireIcon className="h-4 w-4" />, progress: 40, className: 'bg-amber-500' },
    'en armado': { label: 'Sirviendo', icon: <AdjustmentsHorizontalIcon className="h-4 w-4" />, progress: 60, className: 'bg-yellow-400' },
    'listo': { label: 'Listo p/ Llevar', icon: <BellIcon className="h-4 w-4" />, progress: 80, className: 'bg-green-500', pulse: true, pulseColor: '34, 197, 94' }, // green-500
    'entregado': { label: 'Comiendo', icon: <UserIcon className="h-4 w-4" />, progress: 100, className: 'bg-emerald-700', pulse: false }, // Dark Green for eating
    'cuenta solicitada': { label: 'Pide Cuenta', icon: <CreditCardIcon className="h-4 w-4" />, progress: 100, className: 'bg-blue-600', pulse: true, pulseColor: '37, 99, 235' }, // blue-600
    'pagado': { label: 'Pagado', icon: <CheckCircleIcon className="h-4 w-4" />, progress: 100, className: 'bg-slate-500' },
};

const LocalBoard: React.FC<LocalBoardProps> = ({ mesas }) => {
    const { dispatch } = useAppContext();

    const onSelectMesa = (mesa: Mesa) => {
        // If the table is already occupied, go directly to the POS for that order.
        // The modal is only for assigning a customer to a NEW order.
        if (mesa.ocupada) {
            dispatch({ type: 'SELECT_MESA', payload: { mesa, customer: null } });
        } else {
            // If the table is free, initiate the process to assign a customer to a new order.
            dispatch({ type: 'INITIATE_ASSIGN_CUSTOMER_TO_MESA', payload: mesa });
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-heading font-bold mb-8 text-text-primary dark:text-ivory-cream">Gestión de Salón</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {mesas.map((mesa, i) => {
                    const statusInfo = mesa.ocupada && mesa.estadoPedido ? statusConfig[mesa.estadoPedido] : null;

                    const cardClasses = [
                        'table-card',
                        'group',
                        'animate-fade-in-up',
                        'bg-surface dark:bg-[#34424D]',
                        'rounded-2xl shadow-lg',
                        'flex flex-col items-center justify-center',
                        'p-4 text-center transition-all duration-300',
                        'active:scale-95 border-2',
                        'relative overflow-hidden h-48',
                        mesa.ocupada ? (statusInfo?.className ? `border-[${statusInfo.className.replace('bg-', '')}]` : 'border-primary/50') : 'border-transparent dark:border-[#45535D]',
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
                            <div className="absolute top-3 left-3 text-xs font-mono text-text-secondary/60 dark:text-light-silver/50 opacity-0 group-hover:opacity-100 transition-opacity">
                               {mesa.pedidoId}
                            </div>
                            
                            <h2 className="text-6xl font-heading font-extrabold text-text-primary dark:text-ivory-cream group-hover:text-primary transition-colors">
                                {mesa.numero}
                            </h2>
                            <p className="font-semibold text-text-secondary dark:text-light-silver -mt-1">Mesa</p>

                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                                {mesa.ocupada ? (
                                    statusInfo ? (
                                        <div>
                                            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-text-primary dark:text-white">
                                                <div className={`p-1 rounded-full text-white ${statusInfo.className}`}>
                                                    {statusInfo.icon}
                                                </div>
                                                <span>{statusInfo.label}</span>
                                            </div>
                                            <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
                                                <div className={`${statusInfo.className} h-1.5 rounded-full transition-all duration-500`} style={{width: `${statusInfo.progress}%`}}></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className={`text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-primary/20 text-primary`}>
                                            Ocupada
                                        </span>
                                    )
                                ) : (
                                     <span className={`text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-text-primary/10 dark:bg-[#45535D] text-text-primary dark:text-ivory-cream`}>
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
