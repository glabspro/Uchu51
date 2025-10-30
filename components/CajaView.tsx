
import React, { useState, useMemo, useEffect } from 'react';
import type { Pedido, TipoPedido } from '../types';
import { CheckCircleIcon, HomeIcon, TruckIcon, ShoppingBagIcon } from './icons';

interface CajaViewProps {
    orders: Pedido[];
    onInitiatePayment: (order: Pedido) => void;
    onGeneratePreBill: (order: Pedido) => void;
}

const TabButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    count: number;
}> = ({ isActive, onClick, icon, label, count }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-center space-x-2 py-3 px-2 font-semibold transition-colors border-b-4 ${
            isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-primary hover:bg-background'
        }`}
    >
        {icon}
        <span>{label}</span>
        <span className={`text-xs font-bold rounded-full px-2 py-0.5 transition-colors ${
            isActive ? 'bg-primary text-white' : 'bg-text-primary/10 text-text-primary'
        }`}>{count}</span>
    </button>
);


const CajaView: React.FC<CajaViewProps> = ({ orders, onInitiatePayment, onGeneratePreBill }) => {
    const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
    const [activeTab, setActiveTab] = useState<TipoPedido | 'local'>('local');

    const salonOrders = useMemo(() => orders.filter(o => o.tipo === 'local'), [orders]);
    const deliveryOrders = useMemo(() => orders.filter(o => o.tipo === 'delivery'), [orders]);
    const retiroOrders = useMemo(() => orders.filter(o => o.tipo === 'retiro'), [orders]);

    const filteredOrders = useMemo(() => {
        switch (activeTab) {
            case 'local': return salonOrders;
            case 'delivery': return deliveryOrders;
            case 'retiro': return retiroOrders;
            default: return [];
        }
    }, [activeTab, salonOrders, deliveryOrders, retiroOrders]);
    
    useEffect(() => {
        setSelectedOrder(filteredOrders[0] || null);
    }, [filteredOrders]);


    return (
        <div className="flex h-[calc(100vh-100px)] gap-6">
            <div className="w-1/3 bg-surface rounded-2xl shadow-lg p-0 flex flex-col border border-text-primary/5">
                 <div className="flex-shrink-0 border-b border-text-primary/5">
                    <div className="flex">
                        <TabButton
                            isActive={activeTab === 'local'}
                            onClick={() => setActiveTab('local')}
                            icon={<HomeIcon className="h-5 w-5" />}
                            label="Salón"
                            count={salonOrders.length}
                        />
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
                    </div>
                </div>
                <div className="overflow-y-auto space-y-2 p-4">
                    {filteredOrders.length > 0 ? filteredOrders.map(order => (
                        <button
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                                selectedOrder?.id === order.id
                                    ? 'bg-primary text-white font-bold shadow-lg -translate-x-1'
                                    : 'bg-background hover:bg-text-primary/5'
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{order.tipo === 'local' ? `Mesa ${order.cliente.mesa}` : `${order.cliente.nombre}`}</p>
                                    <p className="text-xs font-mono">{order.id}</p>
                                </div>
                                <p className="font-mono text-lg font-semibold">S/.{order.total.toFixed(2)}</p>
                            </div>
                        </button>
                    )) : (
                        <p className="text-center text-text-secondary mt-8">No hay cuentas abiertas en esta sección.</p>
                    )}
                </div>
            </div>

            <div className="w-2/3 bg-surface rounded-2xl shadow-lg p-8 flex flex-col border border-text-primary/5">
                {selectedOrder ? (
                    <>
                        <h2 className="text-3xl font-heading font-bold text-text-primary mb-1">Pedido {selectedOrder.id}</h2>
                        <p className="text-text-secondary text-lg mb-4">{selectedOrder.tipo === 'local' ? `Mesa ${selectedOrder.cliente.mesa}` : selectedOrder.cliente.nombre}</p>
                        
                        <div className="flex-grow border-t border-b border-text-primary/10 py-4 overflow-y-auto my-4">
                            <ul className="space-y-2">
                                {selectedOrder.productos.map((p, index) => (
                                    <li key={index} className="flex justify-between items-center text-text-primary">
                                        <div>
                                            <span className="font-semibold">{p.cantidad}x {p.nombre}</span>
                                            {p.salsas && p.salsas.length > 0 && (
                                                <p className="text-xs text-sky-600 italic">
                                                    + {p.salsas.map(s => s.nombre).join(', ')}
                                                </p>
                                            )}
                                        </div>
                                        <span className="font-mono">S/.{(p.precio * p.cantidad).toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                             {selectedOrder.notas && (
                                <div className="mt-4 p-3 bg-amber-500/10 text-amber-800 rounded-lg text-sm">
                                    <p><span className="font-bold">Nota del Cliente:</span> {selectedOrder.notas}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex-shrink-0">
                             <div className="flex justify-between items-center text-4xl font-heading font-extrabold mb-6 text-text-primary">
                                <span>TOTAL</span>
                                <span className="font-mono">S/.{selectedOrder.total.toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => onGeneratePreBill(selectedOrder)}
                                    className="w-full bg-text-primary text-white font-bold py-4 rounded-xl text-lg hover:bg-text-primary/90 transition-all duration-300 shadow-lg hover:shadow-text-primary/20 hover:-translate-y-0.5"
                                    aria-label={`Generar pre-cuenta para el pedido ${selectedOrder.id}`}
                                >
                                    Generar Cuenta
                                </button>
                                <button
                                    onClick={() => onInitiatePayment(selectedOrder)}
                                    className="w-full bg-primary text-white font-bold py-4 rounded-xl text-lg transition-all duration-300 shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5"
                                    aria-label={`Registrar pago para el pedido ${selectedOrder.id}`}
                                >
                                    Registrar Pago
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary/50">
                        <CheckCircleIcon className="h-24 w-24 mb-4" />
                        <h2 className="text-xl font-semibold text-text-primary">Seleccione una cuenta para cobrar</h2>
                        <p>Los detalles del pedido y las opciones de pago aparecerán aquí.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CajaView;