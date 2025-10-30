
import React from 'react';
import type { Pedido, EstadoPedido, UserRole } from '../types';
import OrderCard from './OrderCard';
import { CheckCircleIcon } from './icons';

interface WaitingBoardProps {
    orders: Pedido[];
    updateOrderStatus: (orderId: string, newStatus: EstadoPedido, user: UserRole) => void;
}

const BoardColumn: React.FC<{ title: string; children: React.ReactNode; count: number; bgColor: string; textColor: string; }> = ({ title, children, count, bgColor, textColor }) => (
    <div className="bg-background rounded-2xl w-full md:w-1/3 flex-shrink-0 shadow-sm flex flex-col border border-text-primary/5">
        <h2 className={`text-lg font-heading font-bold ${textColor} ${bgColor} px-4 py-3 rounded-t-2xl flex items-center justify-between`}>
            {title}
            <span className={`bg-black/10 text-xs font-bold rounded-full px-2.5 py-1`}>{count}</span>
        </h2>
        <div className="space-y-4 h-[calc(100vh-220px)] overflow-y-auto p-4">
            {children}
        </div>
    </div>
);

const WaitingBoard: React.FC<WaitingBoardProps> = ({ orders, updateOrderStatus }) => {
    const pendingConfirmationOrders = orders.filter(o => o.estado === 'pendiente de confirmación');
    const newOrders = orders.filter(o => o.estado === 'nuevo');
    const confirmedOrders = orders.filter(o => o.estado === 'confirmado');

    return (
        <div className="flex flex-col md:flex-row gap-6">
            <BoardColumn title="Pendiente de Confirmación" count={pendingConfirmationOrders.length} bgColor="bg-yellow-400/20" textColor="text-yellow-900">
                {pendingConfirmationOrders.map((order, i) => (
                    <OrderCard key={order.id} order={order} style={{ '--delay': `${i * 50}ms` } as React.CSSProperties}>
                        <button 
                            onClick={() => updateOrderStatus(order.id, 'nuevo', 'recepcionista')}
                            className="w-full bg-text-primary hover:bg-text-primary/90 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-text-primary/20 hover:-translate-y-0.5"
                        >
                            <CheckCircleIcon className="h-5 w-5 mr-2" /> Validar Pedido
                        </button>
                    </OrderCard>
                ))}
            </BoardColumn>
            <BoardColumn title="Nuevos Pedidos" count={newOrders.length} bgColor="bg-blue-400/20" textColor="text-blue-900">
                {newOrders.map((order, i) => (
                    <OrderCard key={order.id} order={order} style={{ '--delay': `${i * 50}ms` } as React.CSSProperties}>
                        <button 
                            onClick={() => updateOrderStatus(order.id, 'confirmado', 'recepcionista')}
                            className="w-full bg-text-primary hover:bg-text-primary/90 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-text-primary/20 hover:-translate-y-0.5"
                        >
                            <CheckCircleIcon className="h-5 w-5 mr-2" /> Confirmar
                        </button>
                    </OrderCard>
                ))}
            </BoardColumn>
            <BoardColumn title="Confirmados (Para Cocina)" count={confirmedOrders.length} bgColor="bg-text-primary/10" textColor="text-text-primary">
                {confirmedOrders.map((order, i) => (
                    <OrderCard key={order.id} order={order} style={{ '--delay': `${i * 50}ms` } as React.CSSProperties}>
                       <button
                         onClick={() => updateOrderStatus(order.id, 'en preparación', 'recepcionista')}
                         className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
                       >
                         Enviar a Cocina
                       </button>
                    </OrderCard>
                ))}
            </BoardColumn>
        </div>
    );
};

export default WaitingBoard;