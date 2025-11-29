
import React from 'react';
import type { Pedido, EstadoPedido, UserRole } from '../types';
import { useAppContext } from '../store';
import OrderCard from './OrderCard';
import { CheckCircleIcon } from './icons';

interface WaitingBoardProps {}

const BoardColumn: React.FC<{ title: string; children: React.ReactNode; count: number; bgColor: string; textColor: string; widthClass?: string; }> = ({ title, children, count, bgColor, textColor, widthClass = 'md:w-1/4' }) => (
    <div className={`bg-background dark:bg-[#34424D]/50 rounded-2xl ${widthClass} flex flex-col border border-text-primary/5 dark:border-[#45535D]`}>
        <h2 className={`text-lg font-heading font-bold ${textColor} ${bgColor} px-4 py-3 rounded-t-2xl flex items-center justify-between`}>
            {title}
            <span className={`bg-black/10 text-xs font-bold rounded-full px-2.5 py-1`}>{count}</span>
        </h2>
        <div className="space-y-4 h-[calc(100vh-10rem)] overflow-y-auto p-4">
            {children}
        </div>
    </div>
);

const WaitingBoard: React.FC<WaitingBoardProps> = () => {
    const { state, dispatch } = useAppContext();
    const { orders, turno } = state;

    const updateOrderStatus = (orderId: string, newStatus: EstadoPedido, user: string) => {
        dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, newStatus, user } });
    };
    
    const componentOrders = orders.filter(o => ['pendiente confirmar pago', 'pendiente de confirmación', 'nuevo', 'confirmado'].includes(o.estado) && o.turno === turno);

    const paymentConfirmationOrders = componentOrders.filter(o => o.estado === 'pendiente confirmar pago');
    const pendingConfirmationOrders = componentOrders.filter(o => o.estado === 'pendiente de confirmación');
    const newOrders = componentOrders.filter(o => o.estado === 'nuevo');
    const confirmedOrders = componentOrders.filter(o => o.estado === 'confirmado');

    return (
        <div className="flex flex-row gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-4 md:gap-6">
             <BoardColumn title="Pagos por Confirmar" count={paymentConfirmationOrders.length} bgColor="bg-purple-400/20 dark:bg-purple-500/10" textColor="text-purple-900 dark:text-purple-200" widthClass="w-80 flex-shrink-0 md:w-auto">
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
            </BoardColumn>
            <BoardColumn title="Pendiente de Confirmación" count={pendingConfirmationOrders.length} bgColor="bg-yellow-400/20 dark:bg-yellow-500/10" textColor="text-yellow-900 dark:text-yellow-200" widthClass="w-80 flex-shrink-0 md:w-auto">
                {pendingConfirmationOrders.map((order, i) => (
                    <OrderCard key={order.id} order={order} style={{ '--delay': `${i * 50}ms` } as React.CSSProperties}>
                        <button 
                            onClick={() => updateOrderStatus(order.id, 'en preparación', 'recepcionista')}
                            className="w-full bg-text-primary dark:bg-[#45535D] hover:bg-text-primary/90 dark:hover:bg-[#56656E] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-text-primary/20 hover:-translate-y-0.5 active:scale-95"
                        >
                            <CheckCircleIcon className="h-5 w-5 mr-2" /> Validar Pedido
                        </button>
                    </OrderCard>
                ))}
            </BoardColumn>
            <BoardColumn title="Nuevos Pedidos" count={newOrders.length} bgColor="bg-blue-400/20 dark:bg-blue-500/10" textColor="text-blue-900 dark:text-blue-200" widthClass="w-80 flex-shrink-0 md:w-auto">
                {newOrders.map((order, i) => (
                    <OrderCard key={order.id} order={order} style={{ '--delay': `${i * 50}ms` } as React.CSSProperties}>
                        <button 
                            onClick={() => updateOrderStatus(order.id, 'confirmado', 'recepcionista')}
                            className="w-full bg-text-primary dark:bg-[#45535D] hover:bg-text-primary/90 dark:hover:bg-[#56656E] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-text-primary/20 hover:-translate-y-0.5 active:scale-95"
                        >
                            <CheckCircleIcon className="h-5 w-5 mr-2" /> Confirmar
                        </button>
                    </OrderCard>
                ))}
            </BoardColumn>
            <BoardColumn title="Confirmados (Para Cocina)" count={confirmedOrders.length} bgColor="bg-text-primary/10 dark:bg-[#45535D]/50" textColor="text-text-primary dark:text-ivory-cream" widthClass="w-80 flex-shrink-0 md:w-auto">
                {confirmedOrders.map((order, i) => (
                    <OrderCard key={order.id} order={order} style={{ '--delay': `${i * 50}ms` } as React.CSSProperties}>
                       <button
                         onClick={() => updateOrderStatus(order.id, 'en preparación', 'recepcionista')}
                         className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95"
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
