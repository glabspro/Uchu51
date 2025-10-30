
import React, { useState, useEffect } from 'react';
import type { Pedido, EstadoPedido, UserRole } from '../types';
import OrderCard from './OrderCard';
import { UserIcon, TruckIcon, CheckCircleIcon } from './icons';

interface DeliveryBoardProps {
    orders: Pedido[];
    updateOrderStatus: (orderId: string, newStatus: EstadoPedido, user: UserRole) => void;
    assignDriver: (orderId: string, driverName: string) => void;
    deliveryDrivers: string[];
}

const DeliveryColumn: React.FC<{ title: string; children: React.ReactNode; count: number; }> = ({ title, children, count }) => (
    <div className="bg-background rounded-2xl w-full md:w-1/3 flex-shrink-0 shadow-sm flex flex-col border border-text-primary/5">
        <h2 className="text-lg font-heading font-bold text-text-primary bg-text-primary/10 px-4 py-3 rounded-t-2xl flex items-center justify-between">
            {title}
            <span className="bg-black/10 text-xs font-bold rounded-full px-2.5 py-1">{count}</span>
        </h2>
        <div className="space-y-4 h-[calc(100vh-220px)] overflow-y-auto p-4">
            {children}
        </div>
    </div>
);

const DeliveryBoard: React.FC<DeliveryBoardProps> = ({ orders, updateOrderStatus, assignDriver, deliveryDrivers }) => {
    const [announcedOrders, setAnnouncedOrders] = useState<Set<string>>(new Set());

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES';
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('Speech synthesis not supported in this browser.');
        }
    };

    useEffect(() => {
        const readyOrders = orders.filter(o => o.estado === 'listo');
        const newOrdersToAnnounce = readyOrders.filter(order => !announcedOrders.has(order.id));

        if (newOrdersToAnnounce.length > 0) {
            speak('Nuevo pedido para delivery');
            setAnnouncedOrders(prev => {
                const newSet = new Set(prev);
                newOrdersToAnnounce.forEach(order => newSet.add(order.id));
                return newSet;
            });
        }
    }, [orders, announcedOrders]);

    const readyOrders = orders.filter(o => o.estado === 'listo');
    const onTheWayOrders = orders.filter(o => o.estado === 'en camino');
    const deliveredOrders = orders.filter(o => o.estado === 'entregado');

    return (
        <div className="flex flex-col md:flex-row gap-6">
            <DeliveryColumn title="Listos para Enviar" count={readyOrders.length}>
                {readyOrders.map((order, i) => (
                    <OrderCard key={order.id} order={order} style={{ '--delay': `${i * 50}ms` } as React.CSSProperties}>
                        <div className="flex items-center space-x-2 relative mt-2">
                            <UserIcon className="h-5 w-5 text-text-primary/40 absolute left-3" />
                            <select
                                value={order.repartidorAsignado || ''}
                                onChange={(e) => assignDriver(order.id, e.target.value)}
                                className="w-full bg-surface text-text-primary border-text-primary/10 border rounded-lg py-2 pl-10 pr-4 appearance-none focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                            >
                                <option value="" disabled>Asignar Repartidor</option>
                                {deliveryDrivers.map(driver => <option key={driver} value={driver}>{driver}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={() => updateOrderStatus(order.id, 'en camino', 'repartidor')}
                            disabled={!order.repartidorAsignado}
                            className="w-full mt-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
                        >
                            <TruckIcon className="h-5 w-5 mr-2" /> Enviar
                        </button>
                    </OrderCard>
                ))}
            </DeliveryColumn>
            <DeliveryColumn title="En Camino" count={onTheWayOrders.length}>
                {onTheWayOrders.map((order, i) => (
                    <OrderCard key={order.id} order={order} style={{ '--delay': `${i * 50}ms` } as React.CSSProperties}>
                        <div className="text-center font-semibold text-text-secondary mb-2">
                            Repartidor: {order.repartidorAsignado}
                        </div>
                        <button
                            onClick={() => updateOrderStatus(order.id, 'entregado', 'repartidor')}
                            className="w-full bg-success hover:brightness-105 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-success/30 hover:-translate-y-0.5"
                        >
                            <CheckCircleIcon className="h-5 w-5 mr-2" /> Marcar como Entregado
                        </button>
                    </OrderCard>
                ))}
            </DeliveryColumn>
            <DeliveryColumn title="Entregados" count={deliveredOrders.length}>
                {deliveredOrders.map((order, i) => (
                    <OrderCard key={order.id} order={order} style={{ '--delay': `${i * 50}ms` } as React.CSSProperties}>
                        <div className="text-center font-semibold text-success p-3 bg-success/10 rounded-lg">
                           Entregado por: {order.repartidorAsignado}
                        </div>
                    </OrderCard>
                ))}
            </DeliveryColumn>
        </div>
    );
};

export default DeliveryBoard;