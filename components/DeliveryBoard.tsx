
import React, { useState, useEffect } from 'react';
import type { Pedido, EstadoPedido, UserRole } from '../types';
import { useAppContext } from '../store';
import OrderCard from './OrderCard';
import { UserIcon, TruckIcon, CashIcon, CheckCircleIcon } from './icons';

interface DeliveryBoardProps {}

const DeliveryColumn: React.FC<{ title: string; children: React.ReactNode; count: number; }> = ({ title, children, count }) => (
    <div className="bg-background dark:bg-[#34424D]/50 rounded-2xl w-full md:w-1/3 flex-shrink-0 shadow-sm flex flex-col border border-text-primary/5 dark:border-[#45535D]">
        <h2 className="text-lg font-heading font-bold text-text-primary dark:text-ivory-cream bg-text-primary/10 dark:bg-[#45535D]/50 px-4 py-3 rounded-t-2xl flex items-center justify-between">
            {title}
            <span className="bg-black/10 text-xs font-bold rounded-full px-2.5 py-1">{count}</span>
        </h2>
        <div className="space-y-4 h-[calc(100vh-10rem)] overflow-y-auto p-4">
            {children}
        </div>
    </div>
);

const DeliveryBoard: React.FC<DeliveryBoardProps> = () => {
    const { state, dispatch } = useAppContext();
    const { orders, turno, restaurantSettings } = state;
    const [announcedOrders, setAnnouncedOrders] = useState<Set<string>>(new Set());

    const deliveryDrivers = restaurantSettings?.drivers || [];

    const updateOrderStatus = (orderId: string, newStatus: EstadoPedido, user: UserRole) => {
        dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, newStatus, user } });
    };

    const assignDriver = (orderId: string, driverName: string) => {
        dispatch({ type: 'ASSIGN_DRIVER', payload: { orderId, driverName } });
    };

    const onInitiateDeliveryPayment = (order: Pedido) => {
        dispatch({ type: 'INITIATE_DELIVERY_PAYMENT', payload: order });
    };

    const componentOrders = orders.filter(o => o.tipo === 'delivery' && ['listo', 'en camino', 'entregado', 'pagado'].includes(o.estado) && o.turno === turno);

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
        const readyOrders = componentOrders.filter(o => o.estado === 'listo');
        const newOrdersToAnnounce = readyOrders.filter(order => !announcedOrders.has(order.id));

        if (newOrdersToAnnounce.length > 0) {
            speak('Nuevo pedido para delivery');
            setAnnouncedOrders(prev => {
                const newSet = new Set(prev);
                newOrdersToAnnounce.forEach(order => newSet.add(order.id));
                return newSet;
            });
        }
    }, [componentOrders, announcedOrders]);

    const readyOrders = componentOrders.filter(o => o.estado === 'listo');
    const onTheWayOrders = componentOrders.filter(o => o.estado === 'en camino');
    const deliveredOrders = componentOrders.filter(o => o.estado === 'entregado' || o.estado === 'pagado');

    return (
        <div className="flex flex-col md:flex-row gap-6">
            <DeliveryColumn title="Listos para Enviar" count={readyOrders.length}>
                {readyOrders.map((order, i) => (
                    <OrderCard key={order.id} order={order} style={{ '--delay': `${i * 50}ms` } as React.CSSProperties}>
                        <div className="flex items-center space-x-2 relative mt-2">
                            <UserIcon className="h-5 w-5 text-text-primary/40 dark:text-light-silver/50 absolute left-3" />
                            <select
                                value={order.repartidorAsignado || ''}
                                onChange={(e) => assignDriver(order.id, e.target.value)}
                                className="w-full bg-surface dark:bg-[#45535D] text-text-primary dark:text-ivory-cream border-text-primary/10 dark:border-[#56656E] border rounded-lg py-2 pl-10 pr-4 appearance-none focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                            >
                                <option value="" disabled>Asignar Repartidor</option>
                                {deliveryDrivers.map(driver => <option key={driver} value={driver}>{driver}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={() => updateOrderStatus(order.id, 'en camino', 'repartidor')}
                            disabled={!order.repartidorAsignado}
                            className="w-full mt-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95"
                        >
                            <TruckIcon className="h-5 w-5 mr-2" /> Enviar
                        </button>
                    </OrderCard>
                ))}
            </DeliveryColumn>
            <DeliveryColumn title="En Camino" count={onTheWayOrders.length}>
                {onTheWayOrders.map((order, i) => (
                    <OrderCard key={order.id} order={order} style={{ '--delay': `${i * 50}ms` } as React.CSSProperties}>
                        <div className="text-center font-semibold text-text-secondary dark:text-light-silver mb-2">
                            Repartidor: {order.repartidorAsignado}
                        </div>
                        {order.pagoRegistrado ? (
                             <div className="space-y-2">
                                <div className="text-center text-xs font-bold text-success bg-success/10 p-1 rounded">
                                    PAGADO ({order.pagoRegistrado.metodo.toUpperCase()})
                                </div>
                                <button
                                    onClick={() => updateOrderStatus(order.id, 'entregado', 'repartidor')}
                                    className="w-full bg-success hover:brightness-105 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-success/30 hover:-translate-y-0.5 active:scale-95"
                                >
                                    <CheckCircleIcon className="h-5 w-5 mr-2" /> Confirmar Entrega
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => onInitiateDeliveryPayment(order)}
                                className="w-full bg-primary hover:brightness-105 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95"
                            >
                                <CashIcon className="h-5 w-5 mr-2" /> Registrar Pago
                            </button>
                        )}
                    </OrderCard>
                ))}
            </DeliveryColumn>
            <DeliveryColumn title="Entregados y Pagados" count={deliveredOrders.length}>
                {deliveredOrders.map((order, i) => (
                    <OrderCard key={order.id} order={order} style={{ '--delay': `${i * 50}ms` } as React.CSSProperties}>
                        <div className="text-center font-semibold text-success dark:text-green-400 p-3 bg-success/10 dark:bg-green-500/10 rounded-lg">
                           {order.estado === 'pagado' ? 'PAGO REGISTRADO' : `Entregado por: ${order.repartidorAsignado}`}
                        </div>
                    </OrderCard>
                ))}
            </DeliveryColumn>
        </div>
    );
};

export default DeliveryBoard;
