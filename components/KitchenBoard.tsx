

import React, { useState, useEffect } from 'react';
import type { Pedido, EstadoPedido, UserRole, AreaPreparacion } from '../types';
import OrderCard from './OrderCard';
import { HomeIcon, TruckIcon, ShoppingBagIcon, CheckCircleIcon } from './icons';

interface KitchenBoardProps {
    orders: Pedido[];
    updateOrderStatus: (orderId: string, newStatus: EstadoPedido, user: UserRole) => void;
}

const KitchenColumn: React.FC<{ 
    title: string; 
    children: React.ReactNode; 
    count: number;
    onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
    className?: string;
}> = ({ title, children, count, onDrop, onDragOver, className = '' }) => (
    <div 
        className={`bg-text-primary/5 dark:bg-slate-800/50 rounded-xl p-4 flex-shrink-0 ${className}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
    >
        <h2 className="text-lg font-heading font-bold mb-4 text-text-primary dark:text-slate-200 flex items-center justify-between bg-text-primary/10 dark:bg-slate-700/50 px-3 py-2 rounded-lg">
            {title}
            <span className="bg-text-primary/20 dark:bg-slate-600 text-text-primary dark:text-slate-200 text-sm font-semibold rounded-full px-2.5 py-1">{count}</span>
        </h2>
        <div className="space-y-4 h-[calc(100vh-14rem)] overflow-y-auto pr-2">
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
                ? 'bg-background dark:bg-slate-900 text-primary border-primary'
                : 'text-text-secondary dark:text-slate-400 hover:bg-background/50 dark:hover:bg-slate-800/50 border-transparent'
        }`}
    >
        {icon}
        <span>{label}</span>
        <span className={`text-xs font-bold rounded-full px-2 py-0.5 transition-colors ${
            isActive ? 'bg-primary text-white' : 'bg-text-primary/10 dark:bg-slate-700 text-text-primary dark:text-slate-200'
        }`}>{count}</span>
    </button>
);


const KitchenBoard: React.FC<KitchenBoardProps> = ({ orders, updateOrderStatus }) => {
    const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
    const [announcedOrders, setAnnouncedOrders] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<AreaPreparacion>('delivery');

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
        const allKitchenOrders = orders.filter(o => ['en preparación', 'pendiente confirmar pago'].includes(o.estado));
        
        const newDeliveryOrders = allKitchenOrders.filter(o => o.areaPreparacion === 'delivery' && !announcedOrders.has(o.id));
        const newRetiroOrders = allKitchenOrders.filter(o => o.areaPreparacion === 'retiro' && o.estado === 'en preparación' && !announcedOrders.has(o.id));
        const newSalonOrders = allKitchenOrders.filter(o => o.areaPreparacion === 'salon' && o.estado === 'en preparación' && !announcedOrders.has(o.id));

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
    }, [orders, announcedOrders]);

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

    const deliveryOrders = orders.filter(o => o.areaPreparacion === 'delivery');
    const retiroOrders = orders.filter(o => o.areaPreparacion === 'retiro');
    const salonOrders = orders.filter(o => o.areaPreparacion === 'salon');
    
    const getFilteredOrders = () => {
        switch(activeTab) {
            case 'delivery': return deliveryOrders;
            case 'retiro': return retiroOrders;
            case 'salon': return salonOrders;
            default: return [];
        }
    };

    const filteredOrders = getFilteredOrders();
    
    const paymentConfirmationOrders = activeTab === 'delivery' ? filteredOrders.filter(o => o.estado === 'pendiente confirmar pago') : [];
    const preparingOrders = filteredOrders.filter(o => o.estado === 'en preparación');
    const assemblingOrders = filteredOrders.filter(o => o.estado === 'en armado' || o.estado === 'listo para armado');
    
    const columnClass = activeTab === 'delivery' ? 'w-1/4' : 'flex-1';

    return (
        <div className="flex flex-col h-full">
            <div className="bg-surface dark:bg-slate-800 rounded-t-lg shadow-sm flex-shrink-0">
                <div className="flex space-x-1 border-b border-text-primary/5 dark:border-slate-700">
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
            <div className="flex flex-col md:flex-row gap-6 pt-4 flex-grow bg-background dark:bg-slate-900 p-4 rounded-b-lg">
                 {activeTab === 'delivery' && (
                    <KitchenColumn title="Pagos por Confirmar" count={paymentConfirmationOrders.length} className={columnClass}>
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
                    </KitchenColumn>
                )}

                <KitchenColumn title="En Preparación" count={preparingOrders.length} onDrop={handleDrop('en preparación')} onDragOver={handleDragOver} className={columnClass}>
                    {preparingOrders.map((order, i) => (
                        <div key={order.id} draggable onDragStart={(e) => handleDragStart(e, order.id)} className="animate-fade-in-up" style={{ '--delay': `${i * 50}ms` } as React.CSSProperties}>
                            <OrderCard order={order}>
                                <select
                                    value={order.estado}
                                    onChange={(e) => updateOrderStatus(order.id, e.target.value as EstadoPedido, 'cocinero')}
                                    className="w-full bg-surface dark:bg-slate-700 text-text-primary dark:text-slate-200 border-text-primary/10 dark:border-slate-600 border rounded-md py-2 pl-3 pr-4 appearance-none focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
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
                                    className="w-full bg-surface dark:bg-slate-700 text-text-primary dark:text-slate-200 border-text-primary/10 dark:border-slate-600 border rounded-md py-2 pl-3 pr-4 appearance-none focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
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
                <div className={`bg-text-primary/5 dark:bg-slate-800/50 rounded-xl p-4 flex-shrink-0 ${columnClass}`} onDrop={handleDrop('listo')} onDragOver={handleDragOver}>
                    <h2 className="text-lg font-heading font-bold mb-4 text-text-primary dark:text-slate-200 bg-text-primary/10 dark:bg-slate-700/50 px-3 py-2 rounded-lg">Listo para Entrega</h2>
                    <div className="h-[calc(100vh-14rem)] overflow-y-auto pr-2 flex items-center justify-center border-2 border-dashed border-text-primary/20 dark:border-slate-700 rounded-lg">
                         <p className="text-text-secondary dark:text-slate-500 font-semibold">Arrastra aquí los pedidos listos</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KitchenBoard;
