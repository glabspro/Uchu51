

import React from 'react';
import type { Pedido, EstadoPedido, UserRole } from '../types';
import OrderCard from './OrderCard';
import { CheckCircleIcon } from './icons';

interface RetiroBoardProps {
    orders: Pedido[];
    updateOrderStatus: (orderId: string, newStatus: EstadoPedido, user: UserRole) => void;
}

const RetiroColumn: React.FC<{ title: string; children: React.ReactNode; count: number; }> = ({ title, children, count }) => (
    <div className="bg-background dark:bg-slate-800/50 rounded-2xl w-full md:w-1/4 flex-shrink-0 shadow-sm flex flex-col border border-text-primary/5 dark:border-slate-700">
        <h2 className="text-lg font-heading font-bold text-text-primary dark:text-slate-200 bg-text-primary/10 dark:bg-slate-700/50 px-4 py-3 rounded-t-2xl flex items-center justify-between">
            {title}
            <span className="bg-black/10 text-xs font-bold rounded-full px-2.5 py-1">{count}</span>
        </h2>
        <div className="space-y-4 h-[calc(100vh-10rem)] overflow-y-auto p-4">
            {children}
        </div>
    </div>
);

const RetiroBoard: React.FC<RetiroBoardProps> = ({ orders, updateOrderStatus }) => {
    const paymentConfirmationOrders = orders.filter(o => o.estado === 'pendiente confirmar pago');
    const pendingConfirmationOrders = orders.filter(o => o.estado === 'pendiente de confirmación');
    const readyOrders = orders.filter(o => o.estado === 'listo');
    const pickedUpOrders = orders.filter(o => ['recogido', 'pagado'].includes(o.estado));

    return (
        <div className="flex flex-col md:flex-row gap-6">
            <RetiroColumn title="Pagos por Confirmar" count={paymentConfirmationOrders.length}>
                {paymentConfirmationOrders.map((order, i) => (
                    <OrderCard key={order.id} order={order} style={{ '--delay': `${i * 50}ms` } as React.CSSProperties}>
                        <button 
                            onClick={() => updateOrderStatus(order.id, 'en preparación', 'recepcionista')}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 active:scale-95"
                        >
                            <CheckCircleIcon className="h-5 w-5 mr-2" /> Validar Pago
                        </button>
                    </OrderCard>
                ))}
            </RetiroColumn>
            <RetiroColumn title="Pendiente de Confirmación" count={pendingConfirmationOrders.length}>
                {pendingConfirmationOrders.map((order, i) => (
                    <OrderCard key={order.id} order={order} style={{ '--delay': `${i * 50}ms` } as React.CSSProperties}>
                        <button 
                            onClick={() => updateOrderStatus(order.id, 'en preparación', 'recepcionista')}
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-yellow-500/30 hover:-translate-y-0.5 active:scale-95"
                        >
                            <CheckCircleIcon className="h-5 w-5 mr-2" /> Validar Pedido
                        </button>
                    </OrderCard>
                ))}
            </RetiroColumn>
            <RetiroColumn title="Listos para Retirar" count={readyOrders.length}>
                {readyOrders.map((order, i) => (
                    <OrderCard key={order.id} order={order} style={{ '--delay': `${i * 50}ms` } as React.CSSProperties}>
                        {['efectivo', 'tarjeta'].includes(order.metodoPago) ? (
                            <div className="text-center font-semibold text-blue-600 dark:text-blue-400 p-3 bg-blue-500/10 dark:bg-blue-500/10 rounded-lg">
                                Esperando pago en Caja
                            </div>
                        ) : (
                            <button
                                onClick={() => updateOrderStatus(order.id, 'recogido', 'recepcionista')}
                                className="w-full mt-2 bg-success hover:brightness-105 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-success/30 hover:-translate-y-0.5 active:scale-95"
                            >
                                <CheckCircleIcon className="h-5 w-5 mr-2" /> Marcar como Recogido
                            </button>
                        )}
                    </OrderCard>
                ))}
            </RetiroColumn>
            <RetiroColumn title="Recogidos y Pagados" count={pickedUpOrders.length}>
                {pickedUpOrders.map((order, i) => (
                    <OrderCard key={order.id} order={order} style={{ '--delay': `${i * 50}ms` } as React.CSSProperties}>
                         <div className="text-center font-semibold text-success dark:text-green-400 p-3 bg-success/10 dark:bg-green-500/10 rounded-lg">
                           {order.estado === 'pagado' ? 'PAGO REGISTRADO' : `Recogido por ${order.cliente.nombre}`}
                        </div>
                    </OrderCard>
                ))}
            </RetiroColumn>
        </div>
    );
};

export default RetiroBoard;
