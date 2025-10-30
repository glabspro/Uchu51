
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
                : 'border-transparent text-slate-500 hover:text-primary hover:bg-slate-100'
        }`}
    >
        {icon}
        <span>{label}</span>
        <span className={`text-xs font-bold rounded-full px-2 py-0.5 transition-colors ${
            isActive ? 'bg-primary text-white' : 'bg-slate-300 text-slate-600'
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
        setSelectedOrder(null);
    }, [activeTab]);


    return (
        <div className="flex h-[calc(100vh-100px)] gap-6">
            <div className="w-1/3 bg-white rounded-xl shadow-lg p-0 flex flex-col">
                 <div className="flex-shrink-0 border-b border-slate-200">
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
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                                selectedOrder?.id === order.id
                                    ? 'bg-primary text-white font-bold shadow-lg'
                                    : 'bg-slate-100 hover:bg-slate-200'
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{order.tipo === 'local' ? `Mesa ${order.cliente.mesa}` : `${order.cliente.nombre}`}</p>
                                    <p className="text-xs font-mono">{order.id}</p>
                                </div>
                                <p className="font-mono text-lg">S/.{order.total.toFixed(2)}</p>
                            </div>
                        </button>
                    )) : (
                        <p className="text-center text-slate-500 mt-8">No hay cuentas abiertas en esta sección.</p>
                    )}
                </div>
            </div>

            <div className="w-2/3 bg-white rounded-xl shadow-lg p-6 flex flex-col">
                {selectedOrder ? (
                    <>
                        <h2 className="text-2xl font-bold text-slate-800 mb-1">Pedido {selectedOrder.id}</h2>
                        <p className="text-slate-600 mb-4">{selectedOrder.tipo === 'local' ? `Mesa ${selectedOrder.cliente.mesa}` : selectedOrder.cliente.nombre}</p>
                        
                        <div className="flex-grow border-t border-b border-slate-200 py-4 overflow-y-auto my-4">
                            <ul className="space-y-2">
                                {selectedOrder.productos.map((p, index) => (
                                    <li key={index} className="flex justify-between items-center text-slate-600">
                                        <div>
                                            <span>{p.cantidad}x {p.nombre}</span>
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
                                <div className="mt-4 p-3 bg-amber-100 text-amber-800 rounded-lg text-sm">
                                    <p><span className="font-bold">Nota del Cliente:</span> {selectedOrder.notas}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex-shrink-0">
                             <div className="flex justify-between items-center text-3xl font-bold mb-6 text-slate-800">
                                <span>TOTAL</span>
                                <span className="font-mono">S/.{selectedOrder.total.toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => onGeneratePreBill(selectedOrder)}
                                    className="w-full bg-slate-800 text-white font-bold py-4 rounded-lg text-lg hover:bg-slate-700 transition-shadow shadow-lg"
                                    aria-label={`Generar pre-cuenta para el pedido ${selectedOrder.id}`}
                                >
                                    Generar Cuenta
                                </button>
                                <button
                                    onClick={() => onInitiatePayment(selectedOrder)}
                                    className="w-full bg-primary text-white font-bold py-4 rounded-lg text-lg hover:bg-primary-dark transition-shadow shadow-lg"
                                    aria-label={`Registrar pago para el pedido ${selectedOrder.id}`}
                                >
                                    Registrar Pago
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                        <CheckCircleIcon className="h-24 w-24 text-slate-300 mb-4" />
                        <h2 className="text-xl font-semibold">Seleccione una cuenta para cobrar</h2>
                        <p>Las detalles del pedido y las opciones de pago aparecerán aquí.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CajaView;