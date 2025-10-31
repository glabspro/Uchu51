import React, { useState, useMemo } from 'react';
import type { Pedido, MetodoPago } from '../types';
import { ChevronDownIcon, ChevronUpIcon, CashIcon, CreditCardIcon, DevicePhoneMobileIcon } from './icons';

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

    // This useMemo hook now performs a deep validation of each order.
    // It ensures that any corrupted or malformed data from localStorage is filtered out
    // before it can cause a rendering crash.
    const { safeOrders, totalRevenue, summaryByPaymentMethod } = useMemo(() => {
        if (!Array.isArray(paidOrders)) {
            return { safeOrders: [], totalRevenue: 0, summaryByPaymentMethod: {} };
        }

        const validOrders = paidOrders.filter(isValidHistoryOrder);
        
        const revenue = validOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

        const summary: Record<string, { count: number; total: number }> = {};
        for (const order of validOrders) {
            const method = order.pagoRegistrado!.metodo;
            if (!summary[method]) {
                summary[method] = { count: 0, total: 0 };
            }
            summary[method].count += 1;
            summary[method].total += (Number(order.total) || 0);
        }

        return { safeOrders: validOrders, totalRevenue: revenue, summaryByPaymentMethod: summary };
    }, [paidOrders]);


    if (!isOpen) return null;

    const paymentMethodIcons: Record<string, React.ReactNode> = {
        'efectivo': <CashIcon className="h-6 w-6 text-green-500" />,
        'tarjeta': <CreditCardIcon className="h-6 w-6 text-blue-500" />,
        'yape/plin': <DevicePhoneMobileIcon className="h-6 w-6 text-purple-500" />,
        'online': <DevicePhoneMobileIcon className="h-6 w-6 text-indigo-500" />,
    };

    // Safely format time to prevent crashes from invalid date strings.
    const safeFormatTime = (dateString?: string) => {
        if (!dateString || typeof dateString !== 'string') return 'Hora Inválida';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Hora Inválida';
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

                <main className="p-6 flex-grow overflow-y-auto min-h-0">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                        {Object.entries(summaryByPaymentMethod).map(([method, data]) => (
                            <div key={method} className="bg-background dark:bg-slate-900/50 p-3 rounded-lg border border-text-primary/5 dark:border-slate-700 flex items-center gap-3">
                                {paymentMethodIcons[method as MetodoPago]}
                                <div>
                                    <span className="text-xs font-semibold capitalize text-text-secondary dark:text-slate-400">{method.replace('yape/plin', 'Yape/Plin')} ({data.count})</span>
                                    <p className="font-bold text-lg text-text-primary dark:text-slate-200">S/.{data.total.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {safeOrders.length === 0 ? (
                        <p className="text-center text-text-secondary dark:text-slate-400 mt-8">No se han registrado ventas en este turno.</p>
                    ) : (
                        <div className="space-y-3">
                            {safeOrders.slice().reverse().map(order => {
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
                                                        {order.tipo} - {order.pagoRegistrado?.metodo.replace('yape/plin', 'Yape/Plin')}
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