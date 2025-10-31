

import React, { useState, useMemo } from 'react';
import type { Pedido, MetodoPago } from '../types';
import { ChevronDownIcon, ChevronUpIcon, CashIcon, CreditCardIcon, DevicePhoneMobileIcon, DocumentMagnifyingGlassIcon } from './icons';

type ActiveFilter = 'all' | 'efectivo' | 'tarjeta' | 'yape' | 'plin';


const SalesHistoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    paidOrders: Pedido[];
}> = ({ isOpen, onClose, paidOrders }) => {
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');

    const memoizedData = useMemo(() => {
        try {
            const summary: { [key in ActiveFilter]: { count: number; total: number } } = {
                'all': { count: 0, total: 0 },
                'efectivo': { count: 0, total: 0 },
                'tarjeta': { count: 0, total: 0 },
                'yape': { count: 0, total: 0 },
                'plin': { count: 0, total: 0 },
            };
            
            const safeOrders = (paidOrders || []).filter(order => 
                order && 
                order.pagoRegistrado && 
                typeof order.total === 'number'
            );

            safeOrders.forEach(order => {
                const method = order.pagoRegistrado!.metodo as ActiveFilter;
                if (summary[method]) {
                    summary[method].count += 1;
                    summary[method].total += order.total;
                }
            });
            
            summary.all.count = safeOrders.length;
            summary.all.total = safeOrders.reduce((sum, order) => sum + order.total, 0);

            return { safeOrders, summary };
        } catch (error) {
            console.error("Error processing sales history:", error);
            return {
                safeOrders: [],
                summary: {
                    'all': { count: 0, total: 0 },
                    'efectivo': { count: 0, total: 0 },
                    'tarjeta': { count: 0, total: 0 },
                    'yape': { count: 0, total: 0 },
                    'plin': { count: 0, total: 0 },
                }
            };
        }
    }, [paidOrders]);

    const { safeOrders, summary } = memoizedData;

    const filteredOrders = useMemo(() => {
        if (activeFilter === 'all') {
            return safeOrders;
        }
        return safeOrders.filter(order => order.pagoRegistrado?.metodo === activeFilter);
    }, [safeOrders, activeFilter]);

    const filteredTotalRevenue = useMemo(() => {
        return filteredOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    }, [filteredOrders]);

    if (!isOpen) return null;

    // FIX: Added a `color` property to the 'all' config to ensure a consistent object shape, resolving a TypeScript error.
    const paymentMethodConfig = {
        'all': { label: 'Todas', icon: <DocumentMagnifyingGlassIcon className="h-5 w-5" />, color: 'text-text-secondary dark:text-slate-400' },
        'efectivo': { label: 'Efectivo', icon: <CashIcon className="h-5 w-5" />, color: 'text-green-500' },
        'tarjeta': { label: 'Tarjeta', icon: <CreditCardIcon className="h-5 w-5" />, color: 'text-blue-500' },
        'yape': { label: 'Yape', icon: <DevicePhoneMobileIcon className="h-5 w-5" />, color: 'text-purple-500' },
        'plin': { label: 'Plin', icon: <DevicePhoneMobileIcon className="h-5 w-5" />, color: 'text-sky-500' },
    };

    const filtersToDisplay: ActiveFilter[] = ['all', 'efectivo', 'tarjeta', 'yape', 'plin'];

    const safeFormatTime = (dateString?: string) => {
        if (!dateString) return 'Inválido';
        try {
            return new Date(dateString).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch {
            return 'Inválido';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4 animate-fade-in-scale">
            <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 flex-shrink-0">
                    <h2 className="text-xl font-heading font-bold text-text-primary dark:text-slate-100">Historial de Ventas del Turno</h2>
                </header>
                
                <div className="px-4 pb-4 border-b border-text-primary/10 dark:border-slate-700 flex-shrink-0">
                    <div className="flex flex-wrap items-center gap-3">
                        {filtersToDisplay.map(key => {
                            const config = paymentMethodConfig[key as keyof typeof paymentMethodConfig];
                            const summaryData = summary[key];
                            const isActive = activeFilter === key;
                            
                            return (
                                <button
                                    key={key}
                                    onClick={() => setActiveFilter(key)}
                                    className={`p-2.5 rounded-xl border-2 text-left transition-all duration-200 flex-grow ${ isActive ? 'bg-primary/10 border-primary shadow-inner' : 'bg-background dark:bg-slate-900/50 border-text-primary/5 dark:border-slate-700 hover:border-primary/40'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`flex-shrink-0 ${isActive ? 'text-primary' : config.color}`}>{config.icon}</div>
                                        <div>
                                            <span className={`text-xs font-semibold ${isActive ? 'text-primary' : 'text-text-secondary dark:text-slate-400'}`}>{config.label} ({summaryData.count})</span>
                                            <p className={`font-bold text-base leading-tight ${isActive ? 'text-primary' : 'text-text-primary dark:text-slate-200'}`}>S/.{summaryData.total.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <main className="flex-1 overflow-y-auto min-h-0 p-4">
                    {filteredOrders.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                             <p className="text-center text-text-secondary dark:text-slate-400 mt-8">No hay ventas que coincidan con el filtro.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredOrders.slice().reverse().map(order => {
                                const isExpanded = expandedOrderId === order.id;
                                const metodo = order.pagoRegistrado?.metodo || '';
                                return (
                                    <div key={order.id} className="bg-background dark:bg-slate-900/50 rounded-lg border border-text-primary/5 dark:border-slate-700">
                                        <button
                                            className="w-full p-3 text-left flex items-center justify-between"
                                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="font-mono text-sm text-text-secondary dark:text-slate-400">{safeFormatTime(order.pagoRegistrado?.fecha)}</span>
                                                <div>
                                                     <span className="font-bold text-text-primary dark:text-slate-200">{order.id}</span>
                                                     <span className="text-xs capitalize text-text-secondary dark:text-slate-500 block">{order.tipo} - {metodo}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-mono font-bold text-lg text-primary dark:text-orange-400">S/.{order.total.toFixed(2)}</span>
                                                {isExpanded ? <ChevronUpIcon className="h-5 w-5 text-text-secondary" /> : <ChevronDownIcon className="h-5 w-5 text-text-secondary" />}
                                            </div>
                                        </button>
                                        {isExpanded && (
                                            <div className="px-4 pb-3 border-t border-text-primary/10 dark:border-slate-700 animate-fade-in-up">
                                                <ul className="text-sm space-y-1 mt-2">
                                                    {order.productos.map((p, index) => (
                                                        <li key={index} className="flex justify-between text-text-secondary dark:text-slate-400">
                                                            <span>{p.cantidad}x {p.nombre}</span>
                                                            <span className="font-mono">S/.{(p.cantidad * p.precio).toFixed(2)}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
                <footer className="p-4 border-t border-text-primary/10 dark:border-slate-700 flex-shrink-0 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-3 px-6 rounded-xl transition-colors active:scale-95"
                    >
                        Cerrar
                    </button>
                    <div className="text-right">
                        <span className="text-sm text-text-secondary dark:text-slate-400">Total Filtrado ({filteredOrders.length} Venta(s))</span>
                        <p className="text-2xl font-bold font-mono text-text-primary dark:text-slate-100">S/.{filteredTotalRevenue.toFixed(2)}</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default SalesHistoryModal;