import React, { useState, useEffect } from 'react';
import type { Pedido, EstadoPedido, UserRole, AreaPreparacion } from '../types';
import { useAppContext } from '../store';
import OrderCard from './OrderCard';
import { HomeIcon, TruckIcon, ShoppingBagIcon, CheckCircleIcon } from './icons';

interface KitchenBoardProps {}

const KitchenColumn: React.FC<{ 
    title: string; 
    children: React.ReactNode; 
    count: number;
    onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
    className?: string;
}> = ({ title, children, count, onDrop, onDragOver, className = '' }) => (
    <div 
        className={`bg-text-primary/5 dark:bg-[#34424D]/50 rounded-xl flex flex-col ${className}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
    >
        <h2 className="text-lg font-heading font-bold mb-4 text-text-primary dark:text-ivory-cream flex items-center justify-between bg-text-primary/10 dark:bg-[#45535D]/50 px-3 py-2 rounded-lg m-4 mb-0">
            {title}
            <span className="bg-text-primary/20 dark:bg-[#56656E] text-text-primary dark:text-ivory-cream text-sm font-semibold rounded-full px-2.5 py-1">{count}</span>
        </h2>
        <div className="space-y-4 h-full overflow-y-auto p-4">
            {children}
        </div>
    </div>
);

const TabButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    count: number;
}> = ({ isActive, onClick, icon, label, count }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 py-3 px-4 font-semibold transition-colors rounded-t-lg border-b-2 ${
            isActive
                ? 'bg-background dark:bg-gunmetal text-primary border-primary'
                : 'text-text-secondary dark:text-light-silver hover:bg-background/50 dark:hover:bg-[#34424D]/50 border-transparent'
        }`}
    >
        {icon}
        <span>{label}</span>
        <span className={`text-xs font-bold rounded-full px-2 py-0.5 transition-colors ${
            isActive ? 'bg-primary text-white' : 'bg-text-primary/10 dark:bg-[#45535D] text-text-primary dark:text-ivory-cream'
        }`}>{count}</span>
    </button>
);


const KitchenBoard: React.FC<KitchenBoardProps> = () => {
    const { state, dispatch } = useAppContext();
    const { orders, turno } = state;
    const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
    const [announcedOrders, setAnnouncedOrders] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<AreaPreparacion>('delivery');

    const updateOrderStatus = (orderId: string, newStatus: EstadoPedido, user: UserRole) => {
        dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, newStatus, user } });
    };

    const componentOrders = orders.filter(o => ['en preparación', 'en armado', 'listo para armado'].includes(o.estado) && o.turno === turno);

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
        const allKitchenOrders = componentOrders.filter(o => ['en preparación'].includes(o.estado));
        
        const newDeliveryOrders = allKitchenOrders.filter(o => o.areaPreparacion === 'delivery' && !announcedOrders.has(o.id));
        const newRetiroOrders = allKitchenOrders.filter(o => o.areaPreparacion === 'retiro' && !announcedOrders.has(o.id));
        const newSalonOrders = allKitchenOrders.filter(o => o.areaPreparacion === 'salon' && !announcedOrders.has(o.id));

        if (newDeliveryOrders.length > 0) speak('Nuevo pedido para Delivery');
        if (newRetiroOrders.length > 0) speak('Nuevo pedido para llevar');
        if (newSalonOrders.length > 0) speak('Nuevo pedido para Salón');

        if (newDeliveryOrders.length > 0 || newRetiroOrders.length > 0 || newSalonOrders.length > 0) {
            setAnnouncedOrders(prev => {
                const newSet = new Set(prev);
                [...newDeliveryOrders, ...newRetiroOrders, ...newSalonOrders].forEach(order => newSet.add(order.id));
                return newSet;
            });
        }
    }, [componentOrders, announcedOrders]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, orderId: string) => {
        setDraggedOrderId(orderId);
    };

    const handleDrop = (newStatus: EstadoPedido) => (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (draggedOrderId) {
            updateOrderStatus(draggedOrderId, newStatus, 'cocinero');
            setDraggedOrderId(null);
        }
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const deliveryOrders = componentOrders.filter(o => o.areaPreparacion === 'delivery');
    const retiroOrders = componentOrders.filter(o => o.areaPreparacion === 'retiro');
    const salonOrders = componentOrders.filter(o => o.areaPreparacion === 'salon');
    
    const getFilteredOrders = () => {
        switch(activeTab) {
            case 'delivery': return deliveryOrders;
            case 'retiro': return retiroOrders;
            case 'salon': return salonOrders;
            default: return [];
        }
    };

    const filteredOrders = getFilteredOrders();
    
    const preparingOrders = filteredOrders.filter(o => o.estado === 'en preparación');
    const assemblingOrders = filteredOrders.filter(o => o.estado === 'en armado' || o.estado === 'listo para armado');
    
    const columnClass = 'w-80 flex-shrink-0 lg:w-auto';

    return (
        <div className="flex flex-col h-full">
            <div className="bg-surface dark:bg-[#34424D] rounded-t-lg shadow-sm flex-shrink-0">
                <div className="flex space-x-1 border-b border-text-primary/5 dark:border-[#45535D]">
                    <TabButton 
                        isActive={activeTab === 'delivery'}
                        onClick={() => setActiveTab('delivery')}
                        icon={<TruckIcon className="h-5 w-5" />}
                        label="Delivery"
                        count={deliveryOrders.length}
                    />
                    <TabButton 
                        isActive={activeTab === 'retiro'}
                        onClick={() => setActiveTab('retiro')}
                        icon={<ShoppingBagIcon className="h-5 w-5" />}
                        label="Para Llevar"
                        count={retiroOrders.length}
                    />
                    <TabButton 
                        isActive={activeTab === 'salon'}
                        onClick={() => setActiveTab('salon')}
                        icon={<HomeIcon className="h-5 w-5" />}
                        label="Salón"
                        count={salonOrders.length}
                    />
                </div>
            </div>
            <div className="flex flex-row gap-4 overflow-x-auto p-4 flex-grow bg-background dark:bg-gunmetal rounded-b-lg lg:grid lg:grid-cols-3 lg:gap-6">
                <KitchenColumn title="En Preparación" count={preparingOrders.length} onDrop={handleDrop('en preparación')} onDragOver={handleDragOver} className={columnClass}>
                    {preparingOrders.map((order, i) => (
                        <div key={order.id} draggable onDragStart={(e) => handleDragStart(e, order.id)} className="animate-fade-in-up" style={{ '--delay': `${i * 50}ms` } as React.CSSProperties}>
                            <OrderCard order={order}>
                                <select
                                    value={order.estado}
                                    onChange={(e) => updateOrderStatus(order.id, e.target.value as EstadoPedido, 'cocinero')}
                                    className="w-full bg-surface dark:bg-[#45535D] text-text-primary dark:text-ivory-cream border-text-primary/10 dark:border-[#56656E] border rounded-md py-2 pl-3 pr-4 appearance-none focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                                >
                                    <option value="en preparación">En Preparación</option>
                                    <option value="en armado">En Armado</option>
                                    <option value="listo para armado">Listo p/ Armado</option>
                                    <option value="listo">Listo para Entrega</option>
                                </select>
                            </OrderCard>
                        </div>
                    ))}
                </KitchenColumn>
                <KitchenColumn title="En Armado" count={assemblingOrders.length} onDrop={handleDrop('en armado')} onDragOver={handleDragOver} className={columnClass}>
                    {assemblingOrders.map((order, i) => (
                        <div key={order.id} draggable onDragStart={(e) => handleDragStart(e, order.id)} className="animate-fade-in-up" style={{ '--delay': `${i * 50}ms` } as React.CSSProperties}>
                            <OrderCard order={order}>
                               <select
                                    value={order.estado}
                                    onChange={(e) => updateOrderStatus(order.id, e.target.value as EstadoPedido, 'cocinero')}
                                    className="w-full bg-surface dark:bg-[#45535D] text-text-primary dark:text-ivory-cream border-text-primary/10 dark:border-[#56656E] border rounded-md py-2 pl-3 pr-4 appearance-none focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                                >
                                    <option value="en preparación">En Preparación</option>
                                    <option value="en armado">En Armado</option>
                                    <option value="listo para armado">Listo p/ Armado</option>
                                    <option value="listo">Listo para Entrega</option>
                                </select>
                            </OrderCard>
                        </div>
                    ))}
                </KitchenColumn>
                <div className={`bg-text-primary/5 dark:bg-[#34424D]/50 rounded-xl p-4 flex flex-col ${columnClass}`} onDrop={handleDrop('listo')} onDragOver={handleDragOver}>
                    <h2 className="text-lg font-heading font-bold mb-4 text-text-primary dark:text-ivory-cream bg-text-primary/10 dark:bg-[#45535D]/50 px-3 py-2 rounded-lg">Listo para Entrega</h2>
                    <div className="h-full overflow-y-auto pr-2 flex items-center justify-center border-2 border-dashed border-text-primary/20 dark:border-[#45535D] rounded-lg">
                         <p className="text-text-secondary dark:text-light-silver/50 font-semibold">Arrastra aquí los pedidos listos</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KitchenBoard;