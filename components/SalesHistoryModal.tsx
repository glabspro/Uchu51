import React, { useState, useMemo } from 'react';
import type { Pedido } from '../types';
import { ChevronDownIcon, ChevronUpIcon, CashIcon, DevicePhoneMobileIcon, DocumentMagnifyingGlassIcon } from './icons';

// This is a type guard to check if an object is a valid order for history display.
const isValidHistoryOrder = (order: any): order is Pedido => {
    return (
        order &&
        typeof order === 'object' &&
        typeof order.id === 'string' &&
        typeof order.total !== 'undefined' &&
        Array.isArray(order.productos) &&
        order.pagoRegistrado &&
        typeof order.pagoRegistrado === 'object' &&
        typeof order.pagoRegistrado.metodo === 'string'
    );
};


const SalesHistoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    paidOrders: Pedido[];
}> = ({ isOpen, onClose, paidOrders }) => {
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<'all' | 'Efectivo' | 'Online'>('all');

    const { safeOrders, totalRevenue, summaryByGroup } = useMemo(() => {
        // Guard against non-array input
        if (!Array.isArray(paidOrders)) {
            return {
                safeOrders: [],
                totalRevenue: 0,
                summaryByGroup: { Efectivo: { count: 0, total: 0 }, Online: { count: 0, total: 0 } }
            };
        }

        const validOrders = paidOrders.filter(isValidHistoryOrder);
        const revenue = validOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

        const summary: {
            Efectivo: { count: number; total: number };
            Online: { count: number; total: number };
        } = {
            Efectivo: { count: 0, total: 0 },
            Online: { count: 0, total: 0 },
        };

        for (const order of validOrders) {
            const method = order.pagoRegistrado!.metodo;
            const total = Number(order.total) || 0;

            if (method === 'efectivo') {
                summary.Efectivo.count += 1;
                summary.Efectivo.total += total;
            } else { // 'tarjeta', 'yape/plin', 'online'
                summary.Online.count += 1;
                summary.Online.total += total;
            }
        }

        return { safeOrders: validOrders, totalRevenue: revenue, summaryByGroup: summary };
    }, [paidOrders]);

    const filteredOrders = useMemo(() => {
        switch (activeFilter) {
            case 'Efectivo':
                return safeOrders.filter(order => order.pagoRegistrado?.metodo === 'efectivo');
            case 'Online':
                return safeOrders.filter(order => order.pagoRegistrado?.metodo !== 'efectivo');
            case 'all':
            default:
                return safeOrders;
        }
    }, [safeOrders, activeFilter]);

    if (!isOpen) return null;

    const FilterButton: React.FC<{
        filterKey: 'all' | 'Efectivo' | 'Online';
        label: string;
        total: number;
        icon: React.ReactNode;
    }> = ({ filterKey, label, total, icon }) => {
        const isActive = activeFilter === filterKey;
        return (
            <button
                onClick={() => {
                    setActiveFilter(filterKey);
                    setExpandedOrderId(null);
                }}
                className={`p-3 rounded-lg border-2 text-left flex items-center gap-3 w-full transition-all duration-200 ${
                    isActive
                        ? 'bg-primary/10 border-primary shadow-inner'
                        : 'bg-background dark:bg-slate-900/50 border-text-primary/5 dark:border-slate-700 hover:border-primary/40'
                }`}
            >
                {icon}
                <div>
                    <span className={`text-xs font-semibold capitalize ${isActive ? 'text-primary' : 'text-text-secondary dark:text-slate-400'}`}>{label}</span>
                    <p className={`font-bold text-lg ${isActive ? 'text-primary' : 'text-text-primary dark:text-slate-200'}`}>S/.{total.toFixed(2)}</p>
                </div>
            </button>
        );
    };

    const safeFormatTime = (dateString?: string) => {
        if (!dateString || typeof dateString !== 'string') return 'Hora Inválida';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Hora Inválida';
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch {
            return 'Hora Inválida';
        }
    };


    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4 animate-fade-in-scale">
            <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 flex justify-between items-center border-b border-text-primary/10 dark:border-slate-700 flex-shrink-0">
                    <h2 className="text-xl font-heading font-bold text-text-primary dark:text-slate-100">Historial de Ventas del Turno</h2>
                </header>

                <main className="p-4 md:p-6 flex-1 overflow-y-auto min-h-0">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                        <FilterButton
                            filterKey="all"
                            label={`Ventas (${safeOrders.length})`}
                            total={totalRevenue}
                            icon={<DocumentMagnifyingGlassIcon className={`h-6 w-6 ${activeFilter === 'all' ? 'text-primary' : 'text-text-secondary dark:text-slate-400'}`}/>}
                        />
                        <FilterButton
                            filterKey="Efectivo"
                            label={`Efectivo (${summaryByGroup.Efectivo.count})`}
                            total={summaryByGroup.Efectivo.total}
                            icon={<CashIcon className="h-6 w-6 text-green-500" />}
                        />
                        <FilterButton
                            filterKey="Online"
                            label={`Online (${summaryByGroup.Online.count})`}
                            total={summaryByGroup.Online.total}
                            icon={<DevicePhoneMobileIcon className="h-6 w-6 text-indigo-500" />}
                        />
                    </div>
                    
                    {filteredOrders.length === 0 ? (
                        <p className="text-center text-text-secondary dark:text-slate-400 mt-8">No hay ventas que coincidan con el filtro.</p>
                    ) : (
                        <div className="space-y-3">
                            {filteredOrders.slice().reverse().map(order => {
                                const isExpanded = expandedOrderId === order.id;
                                return (
                                    <div key={order.id} className="bg-background dark:bg-slate-900/50 rounded-lg border border-text-primary/5 dark:border-slate-700">
                                        <button
                                            className="w-full p-3 text-left flex items-center justify-between"
                                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                            aria-expanded={isExpanded}
                                            aria-controls={`details-${order.id}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="font-mono text-sm text-text-secondary dark:text-slate-400">
                                                    {safeFormatTime(order.pagoRegistrado?.fecha)}
                                                </span>
                                                <div className="flex flex-col text-left">
                                                     <span className="font-bold text-text-primary dark:text-slate-200">{order.id}</span>
                                                     <span className="text-xs capitalize text-text-secondary dark:text-slate-500">
                                                        {order.tipo} - {(order.pagoRegistrado?.metodo || '').replace('yape/plin', 'Online')}
                                                     </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-mono font-bold text-lg text-primary dark:text-orange-400">
                                                    S/.{(Number(order.total) || 0).toFixed(2)}
                                                </span>
                                                {isExpanded ? <ChevronUpIcon className="h-5 w-5 text-text-secondary" /> : <ChevronDownIcon className="h-5 w-5 text-text-secondary" />}
                                            </div>
                                        </button>
                                        {isExpanded && (
                                            <div id={`details-${order.id}`} className="px-4 pb-3 border-t border-text-primary/10 dark:border-slate-700 animate-fade-in-up">
                                                <ul className="text-sm space-y-1 mt-2">
                                                    {order.productos.map((p, index) => {
                                                        const quantity = Number(p.cantidad) || 0;
                                                        const price = Number(p.precio) || 0;
                                                        return (
                                                            <li key={index} className="flex justify-between text-text-secondary dark:text-slate-400">
                                                                <span>{quantity}x {p.nombre || 'Producto sin nombre'}</span>
                                                                <span className="font-mono">S/.{(quantity * price).toFixed(2)}</span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>

                <footer className="p-4 border-t border-text-primary/10 dark:border-slate-700 bg-background dark:bg-slate-900/50 rounded-b-2xl flex justify-between items-center flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-3 px-6 rounded-xl transition-all duration-200 active:scale-95 hover:-translate-y-px"
                    >
                        Cerrar
                    </button>
                    <div className="flex items-center gap-6">
                        <div className="font-semibold text-text-secondary dark:text-slate-300">
                            {safeOrders.length} Venta(s)
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-semibold text-text-secondary dark:text-slate-400 block">Ingresos Totales</span>
                            <span className="text-2xl font-heading font-bold text-text-primary dark:text-white">
                                S/.{totalRevenue.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default SalesHistoryModal;