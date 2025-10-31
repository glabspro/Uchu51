import React, { useState, useMemo } from 'react';
import type { Pedido, MetodoPago } from '../types';
import { ChevronDownIcon, ChevronUpIcon, CashIcon, CreditCardIcon, DevicePhoneMobileIcon } from './icons';

const SalesHistoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    paidOrders: Pedido[];
}> = ({ isOpen, onClose, paidOrders }) => {
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    if (!isOpen) return null;

    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
    
    const summaryByPaymentMethod = useMemo(() => {
        const initialSummary: Record<string, { count: number; total: number }> = {};
        
        return paidOrders.reduce((acc, order) => {
            const method = order.pagoRegistrado?.metodo;
            if (method) {
                if (!acc[method]) {
                    acc[method] = { count: 0, total: 0 };
                }
                acc[method].count += 1;
                acc[method].total += order.total;
            }
            return acc;
        }, initialSummary);
    }, [paidOrders]);

    const paymentMethodIcons: Record<string, React.ReactNode> = {
        'efectivo': <CashIcon className="h-6 w-6 text-green-500" />,
        'tarjeta': <CreditCardIcon className="h-6 w-6 text-blue-500" />,
        'yape/plin': <DevicePhoneMobileIcon className="h-6 w-6 text-purple-500" />,
        'online': <DevicePhoneMobileIcon className="h-6 w-6 text-indigo-500" />,
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4 animate-fade-in-scale">
            <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 flex justify-between items-center border-b border-text-primary/10 dark:border-slate-700 flex-shrink-0">
                    <h2 className="text-xl font-heading font-bold text-text-primary dark:text-slate-100">Historial de Ventas del Turno</h2>
                </header>

                <main className="p-6 flex-grow overflow-y-auto min-h-0">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                        {Object.entries(summaryByPaymentMethod).map(([method, data]) => {
                            // FIX: Explicitly cast data from Object.entries which is inferred as 'unknown'.
                            const summaryData = data as { count: number; total: number };
                            return (
                                <div key={method} className="bg-background dark:bg-slate-900/50 p-3 rounded-lg border border-text-primary/5 dark:border-slate-700 flex items-center gap-3">
                                    {paymentMethodIcons[method as MetodoPago]}
                                    <div>
                                        <span className="text-xs font-semibold capitalize text-text-secondary dark:text-slate-400">{method.replace('yape/plin', 'Yape/Plin')} ({summaryData.count})</span>
                                        <p className="font-bold text-lg text-text-primary dark:text-slate-200">S/.{summaryData.total.toFixed(2)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {paidOrders.length === 0 ? (
                        <p className="text-center text-text-secondary dark:text-slate-400 mt-8">No se han registrado ventas en este turno.</p>
                    ) : (
                        <div className="space-y-3">
                            {paidOrders.slice().reverse().map(order => {
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
                                                    {order.pagoRegistrado ? new Date(order.pagoRegistrado.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
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
                                                    S/.{order.total.toFixed(2)}
                                                </span>
                                                {isExpanded ? <ChevronUpIcon className="h-5 w-5 text-text-secondary" /> : <ChevronDownIcon className="h-5 w-5 text-text-secondary" />}
                                            </div>
                                        </button>
                                        {isExpanded && (
                                            <div id={`details-${order.id}`} className="px-4 pb-3 border-t border-text-primary/10 dark:border-slate-700 animate-fade-in-up">
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

                <footer className="p-4 border-t border-text-primary/10 dark:border-slate-700 bg-background dark:bg-slate-900/50 rounded-b-2xl flex justify-between items-center flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-3 px-6 rounded-xl transition-all duration-200 active:scale-95 hover:-translate-y-px"
                    >
                        Cerrar
                    </button>
                    <div className="flex items-center gap-6">
                        <div className="font-semibold text-text-secondary dark:text-slate-300">
                            {paidOrders.length} Venta(s)
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