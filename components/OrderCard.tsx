
import React from 'react';
import type { Pedido } from '../types';
import { ClockIcon, UserIcon, PhoneIcon, MapPinIcon } from './icons';

interface OrderCardProps {
    order: Pedido;
    children?: React.ReactNode;
}

const getStatusColor = (status: Pedido['estado']) => {
    switch (status) {
        case 'nuevo': return 'bg-slate-400';
        case 'pendiente de confirmación': return 'bg-yellow-500';
        case 'confirmado': return 'bg-primary';
        case 'en preparación': return 'bg-amber-500';
        case 'en armado': return 'bg-yellow-400';
        case 'listo': return 'bg-green-500';
        case 'en camino': return 'bg-teal-500';
        case 'entregado': return 'bg-emerald-500';
        case 'recogido': return 'bg-cyan-500';
        case 'cancelado': return 'bg-danger';
        default: return 'bg-gray-300';
    }
};

const OrderCard: React.FC<OrderCardProps> = ({ order, children }) => {
    
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const getTimerColor = (timeInMinutes: number, timeEstimated: number) => {
        const percentage = (timeInMinutes * 60) / (timeEstimated * 60);
        if (percentage < 0.75) return 'text-success';
        if (percentage <= 1) return 'text-warning';
        return 'text-danger';
    };

    const timerColor = getTimerColor(order.tiempoTranscurrido / 60, order.tiempoEstimado);

    let mapsLink = '';
    if (order.tipo === 'delivery' && order.cliente.direccion && order.cliente.direccion.startsWith('Lat:')) {
        try {
            const parts = order.cliente.direccion.replace('Lat:', '').replace('Lon:', '').split(',');
            const lat = parseFloat(parts[0].trim());
            const lon = parseFloat(parts[1].trim());
            if (!isNaN(lat) && !isNaN(lon)) {
                mapsLink = `https://www.google.com/maps?q=${lat},${lon}`;
            }
        } catch {}
    }

    return (
        <div className="bg-white rounded-lg shadow-md relative overflow-hidden mb-4 flex flex-col justify-between min-h-[250px] transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getStatusColor(order.estado)}`}></div>
            <div className="p-4 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-extrabold text-lg text-slate-800">{order.id}</h3>
                        <p className="text-sm font-semibold text-primary">
                            {order.tipo === 'delivery' ? 'Delivery' : (order.cliente.mesa ? `Salón - Mesa ${order.cliente.mesa}` : 'Retiro')}
                        </p>
                    </div>
                    <div className={`text-xl font-bold ${timerColor} flex items-center`}>
                       <ClockIcon className="h-5 w-5 mr-1"/> {formatTime(order.tiempoTranscurrido)}
                    </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600 mb-4">
                    <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-2 text-slate-400" />
                        <span>{order.cliente.nombre}</span>
                    </div>
                    <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-2 text-slate-400" />
                        <span>{order.cliente.telefono}</span>
                    </div>
                    {order.tipo === 'delivery' && order.cliente.direccion && (
                         <div className="flex items-start">
                            <MapPinIcon className="h-4 w-4 mr-2 mt-0.5 text-slate-400 flex-shrink-0" />
                            {mapsLink ? (
                                <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline transition-colors">
                                    Ver en Mapa
                                </a>
                            ) : (
                                <span className="break-all">{order.cliente.direccion}</span>
                            )}
                         </div>
                    )}
                </div>
                 {order.tipo === 'delivery' && order.metodoPago === 'efectivo' && (
                    <div className="my-2 p-2 bg-blue-100 text-blue-800 rounded-md text-sm font-semibold text-center">
                        {order.pagoExacto
                            ? 'Paga con monto exacto'
                            : `Paga con S/. ${order.pagoConEfectivo?.toFixed(2)}`
                        }
                    </div>
                )}
                {order.notas && (
                    <div className="my-2 p-2 bg-amber-100 text-amber-800 rounded-md text-xs">
                        <span className="font-bold">Nota:</span> {order.notas}
                    </div>
                )}
                <div className="border-t border-slate-200 pt-3 mt-auto">
                    <ul className="space-y-2 text-sm">
                        {order.productos.map((p, index) => (
                            <li key={index}>
                                <div className="flex justify-between">
                                    <span className="text-slate-700">{p.cantidad}x {p.nombre}</span>
                                    <span className="font-mono text-slate-500">S/.{(p.cantidad * p.precio).toFixed(2)}</span>
                                </div>
                                {p.especificaciones && <p className="text-xs text-amber-600 mt-1 pl-2 italic">↳ {p.especificaciones}</p>}
                                {p.salsas && p.salsas.length > 0 && (
                                    <p className="text-xs text-sky-600 mt-1 pl-2 italic">
                                        ↳ {p.salsas.map(s => s.nombre).join(', ')}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            
            <div className="px-4 pb-4">
                <div className="flex justify-between items-center text-sm font-bold border-t border-slate-200 pt-2">
                    <span className="text-slate-600">TOTAL</span>
                    <span className="text-lg font-mono text-slate-800">S/.{order.total.toFixed(2)}</span>
                </div>
                {children && <div className="mt-4">{children}</div>}
            </div>
        </div>
    );
};

export default OrderCard;