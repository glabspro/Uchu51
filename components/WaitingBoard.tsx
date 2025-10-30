
import React from 'react';
import type { Pedido, EstadoPedido, UserRole } from '../types';
import OrderCard from './OrderCard';
import { CheckCircleIcon } from './icons';

interface WaitingBoardProps {
    orders: Pedido[];
    updateOrderStatus: (orderId: string, newStatus: EstadoPedido, user: UserRole) => void;
}

const BoardColumn: React.FC<{ title: string; children: React.ReactNode; count: number; bgColor: string; textColor: string; }> = ({ title, children, count, bgColor, textColor }) => (
    <div className="bg-slate-200/60 rounded-xl w-full md:w-1/3 flex-shrink-0 shadow-sm flex flex-col">
        <h2 className={`text-xl font-bold ${textColor} ${bgColor} px-4 py-3 rounded-t-xl flex items-center justify-between`}>
            {title}
            <span className={`bg-black/20 text-xs font-bold rounded-full px-2.5 py-1`}>{count}</span>
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
            <BoardColumn title="Pendiente de Confirmación" count={pendingConfirmationOrders.length} bgColor="bg-warning" textColor="text-white">
                {pendingConfirmationOrders.map(order => (
                    <OrderCard key={order.id} order={order}>
                        <button 
                            onClick={() => updateOrderStatus(order.id, 'nuevo', 'recepcionista')}
                            className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors shadow-md"
                        >
                            <CheckCircleIcon className="h-5 w-5 mr-2" /> Validar Pedido
                        </button>
                    </OrderCard>
                ))}
            </BoardColumn>
            <BoardColumn title="Nuevos Pedidos" count={newOrders.length} bgColor="bg-accent" textColor="text-white">
                {newOrders.map(order => (
                    <OrderCard key={order.id} order={order}>
                        <button 
                            onClick={() => updateOrderStatus(order.id, 'confirmado', 'recepcionista')}
                            className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors shadow-md"
                        >
                            <CheckCircleIcon className="h-5 w-5 mr-2" /> Confirmar
                        </button>
                    </OrderCard>
                ))}
            </BoardColumn>
            <BoardColumn title="Confirmados (Para Cocina)" count={confirmedOrders.length} bgColor="bg-slate-700" textColor="text-white">
                {confirmedOrders.map(order => (
                    <OrderCard key={order.id} order={order}>
                       <button
                         onClick={() => updateOrderStatus(order.id, 'en preparación', 'recepcionista')}
                         className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors shadow-md"
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