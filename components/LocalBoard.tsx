
import React from 'react';
import type { Mesa, Pedido } from '../types';

interface LocalBoardProps {
    mesas: Mesa[];
    onSelectMesa: (mesa: Mesa) => void;
}

const getStatusAppearance = (status: Pedido['estado']) => {
    switch (status) {
        case 'nuevo': return { color: 'bg-gray-500', label: 'Nuevo' };
        case 'confirmado': return { color: 'bg-primary', label: 'Confirmado' };
        case 'en preparación': return { color: 'bg-amber-500', label: 'En Preparación' };
        case 'en armado': return { color: 'bg-yellow-400', label: 'En Armado' };
        case 'listo': return { color: 'bg-green-500', label: 'Listo' };
        case 'entregado': return { color: 'bg-emerald-600', label: 'En Mesa' };
        case 'cuenta solicitada': return { color: 'bg-blue-500', label: 'Pidiendo Cuenta' };
        default: return null;
    }
};


const LocalBoard: React.FC<LocalBoardProps> = ({ mesas, onSelectMesa }) => {
    return (
        <div>
            <h1 className="text-3xl font-heading font-bold mb-8 text-text-primary dark:text-slate-100">Gestión de Salón</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {mesas.map((mesa, i) => {
                    const statusInfo = mesa.ocupada && mesa.estadoPedido ? getStatusAppearance(mesa.estadoPedido) : null;
                    return (
                        <button 
                            key={mesa.numero} 
                            onClick={() => onSelectMesa(mesa)}
                            style={{ '--delay': `${i * 30}ms` } as React.CSSProperties}
                            className={`group animate-fade-in-up bg-surface dark:bg-slate-800 rounded-2xl shadow-lg flex flex-col items-center justify-center p-6 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:scale-102 active:scale-95 border-2 ${
                                mesa.ocupada ? 'border-primary/50 dark:border-primary/70' : 'border-transparent dark:border-slate-700'
                            }`}
                        >
                            <h2 className="text-5xl font-heading font-extrabold text-text-primary dark:text-slate-100 group-hover:text-primary transition-colors">
                                {mesa.numero}
                            </h2>
                            <p className="font-semibold text-text-secondary dark:text-slate-400 mt-1">Mesa</p>
                            <div className="h-10 mt-4 flex items-center">
                                {mesa.ocupada ? (
                                    statusInfo ? (
                                        <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full text-white flex items-center gap-2 ${statusInfo.color}`}>
                                            <span className={`h-2 w-2 rounded-full bg-white`}></span>
                                            {statusInfo.label}
                                        </span>
                                    ) : (
                                        <span className={`mt-4 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-primary/10 text-primary`}>
                                            Ocupada
                                        </span>
                                    )
                                ) : (
                                     <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-text-primary/10 dark:bg-slate-700 text-text-primary dark:text-slate-200`}>
                                        Libre
                                    </span>
                                )}
                            </div>
                            <div className="h-4 mt-2">
                                {mesa.ocupada && (
                                    <span className="text-xs font-mono text-text-secondary/60 dark:text-slate-500">{mesa.pedidoId}</span>
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