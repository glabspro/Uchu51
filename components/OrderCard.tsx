
import React from 'react';
import type { Pedido } from '../types';
import { ClockIcon, UserIcon, PhoneIcon, MapPinIcon } from './icons';

interface OrderCardProps {
    order: Pedido;
    children?: React.ReactNode;
    style?: React.CSSProperties;
}

const getStatusAppearance = (status: Pedido['estado']) => {
    switch (status) {
        case 'nuevo': return { color: 'bg-gray-500', text: 'text-gray-800', label: 'Nuevo' };
        case 'pendiente de confirmación': return { color: 'bg-yellow-500', text: 'text-yellow-800', label: 'Pendiente' };
        case 'confirmado': return { color: 'bg-primary', text: 'text-primary-dark', label: 'Confirmado' };
        case 'en preparación': return { color: 'bg-amber-500', text: 'text-amber-800', label: 'En Preparación' };
        case 'en armado': return { color: 'bg-yellow-400', text: 'text-yellow-800', label: 'En Armado' };
        case 'listo': return { color: 'bg-green-500', text: 'text-green-800', label: 'Listo' };
        case 'en camino': return { color: 'bg-teal-500', text: 'text-teal-800', label: 'En Camino' };
        case 'entregado': return { color: 'bg-emerald-500', text: 'text-emerald-800', label: 'Entregado' };
        case 'recogido': return { color: 'bg-cyan-500', text: 'text-cyan-800', label: 'Recogido' };
        case 'cancelado': return { color: 'bg-danger', text: 'text-red-800', label: 'Cancelado' };
        default: return { color: 'bg-gray-300', text: 'text-gray-800', label: 'Estado' };
    }
};

const OrderCard: React.FC<OrderCardProps> = ({ order, children, style }) => {
    
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
    const { color: statusColor, text: statusTextColor, label: statusLabel } = getStatusAppearance(order.estado);

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
        <div style={style} className="bg-surface rounded-2xl shadow-lg flex flex-col justify-between min-h-[250px] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group animate-fade-in-up border border-text-primary/5">
            <div className="p-5 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-heading font-extrabold text-xl text-text-primary">{order.id}</h3>
                        <p className="text-sm font-semibold text-primary">
                            {order.tipo === 'delivery' ? 'Delivery' : (order.cliente.mesa ? `Salón - Mesa ${order.cliente.mesa}` : 'Retiro')}
                        </p>
                    </div>
                     <div className={`text-2xl font-bold ${timerColor} flex items-center bg-background px-3 py-1 rounded-lg font-mono`}>
                       <ClockIcon className="h-5 w-5 mr-2"/> {formatTime(order.tiempoTranscurrido)}
                    </div>
                </div>
                 <div className="flex items-center space-x-2 mb-4">
                    <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`}></span>
                    <span className={`text-xs font-bold uppercase tracking-wider ${statusTextColor}`}>{statusLabel}</span>
                </div>

                <div className="space-y-2 text-sm text-text-secondary mb-4">
                    <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-2.5 text-text-primary/40" />
                        <span className="font-medium text-text-primary">{order.cliente.nombre}</span>
                    </div>
                    <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-2.5 text-text-primary/40" />
                        <span>{order.cliente.telefono}</span>
                    </div>
                    {order.tipo === 'delivery' && order.cliente.direccion && (
                         <div className="flex items-start">
                            <MapPinIcon className="h-4 w-4 mr-2.5 mt-0.5 text-text-primary/40 flex-shrink-0" />
                            {mapsLink ? (
                                <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline transition-colors font-semibold">
                                    Ver en Google Maps
                                </a>
                            ) : (
                                <span className="break-all">{order.cliente.direccion}</span>
                            )}
                         </div>
                    )}
                </div>
                 {order.tipo === 'delivery' && order.metodoPago === 'efectivo' && (
                    <div className="my-2 p-2 bg-blue-500/10 text-blue-700 rounded-lg text-sm font-semibold text-center">
                        {order.pagoExacto
                            ? 'Paga con monto exacto'
                            : `Paga con S/. ${order.pagoConEfectivo?.toFixed(2)}`
                        }
                    </div>
                )}
                {order.notas && (
                    <div className="my-2 p-3 bg-amber-500/10 text-amber-800 rounded-lg text-xs">
                        <span className="font-bold">Nota:</span> {order.notas}
                    </div>
                )}
                <div className="border-t border-text-primary/10 pt-3 mt-auto">
                    <ul className="space-y-1.5 text-sm">
                        {order.productos.map((p, index) => (
                            <li key={index}>
                                <div className="flex justify-between">
                                    <span className="text-text-primary">{p.cantidad}x {p.nombre}</span>
                                    <span className="font-mono text-text-secondary">S/.{(p.cantidad * p.precio).toFixed(2)}</span>
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
            
            <div className="px-5 pb-5">
                <div className="flex justify-between items-center text-sm font-bold border-t border-text-primary/10 pt-3">
                    <span className="text-text-secondary text-base">TOTAL</span>
                    <span className="text-xl font-mono text-text-primary font-heading">S/.{order.total.toFixed(2)}</span>
                </div>
                {children && <div className="mt-4">{children}</div>}
            </div>
        </div>
    );
};

export default OrderCard;