

import React, { useState, useEffect } from 'react';
import type { Pedido } from '../types';
import { ClockIcon, UserIcon, PhoneIcon, MapPinIcon } from './icons';

interface OrderCardProps {
    order: Pedido;
    children?: React.ReactNode;
    style?: React.CSSProperties;
}

const getStatusAppearance = (status: Pedido['estado']) => {
    switch (status) {
        case 'nuevo': return { color: 'bg-gray-500', text: 'text-gray-800 dark:text-gray-200', label: 'Nuevo' };
        case 'pendiente de confirmación': return { color: 'bg-yellow-500', text: 'text-yellow-800 dark:text-yellow-200', label: 'Pendiente' };
        case 'pendiente confirmar pago': return { color: 'bg-purple-500', text: 'text-purple-800 dark:text-purple-200', label: 'Pago por Confirmar' };
        case 'confirmado': return { color: 'bg-primary', text: 'text-primary-dark dark:text-orange-200', label: 'Confirmado' };
        case 'en preparación': return { color: 'bg-amber-500', text: 'text-amber-800 dark:text-amber-200', label: 'En Preparación' };
        case 'en armado': return { color: 'bg-yellow-400', text: 'text-yellow-800 dark:text-yellow-200', label: 'En Armado' };
        case 'listo para armado': return { color: 'bg-yellow-400', text: 'text-yellow-800 dark:text-yellow-200', label: 'Listo p/ Armado' };
        case 'listo': return { color: 'bg-green-500', text: 'text-green-800 dark:text-green-200', label: 'Listo' };
        case 'en camino': return { color: 'bg-teal-500', text: 'text-teal-800 dark:text-teal-200', label: 'En Camino' };
        case 'entregado': return { color: 'bg-emerald-500', text: 'text-emerald-800 dark:text-emerald-200', label: 'Entregado' };
        case 'recogido': return { color: 'bg-cyan-500', text: 'text-cyan-800 dark:text-cyan-200', label: 'Recogido' };
        case 'pagado': return { color: 'bg-blue-500', text: 'text-blue-800 dark:text-blue-200', label: 'Pagado' };
        case 'cancelado': return { color: 'bg-danger', text: 'text-red-800 dark:text-red-200', label: 'Cancelado' };
        default: return { color: 'bg-gray-300', text: 'text-gray-800 dark:text-gray-200', label: 'Estado' };
    }
};

const OrderCard: React.FC<OrderCardProps> = ({ order, children, style }) => {
    const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);

    const finalStates: Pedido['estado'][] = ['entregado', 'recogido', 'pagado', 'cancelado'];
    const isFinalState = finalStates.includes(order.estado);

    useEffect(() => {
        let timerId: number | undefined;

        if (isFinalState) {
            const firstHistory = order.historial[0];
            const lastHistory = order.historial[order.historial.length - 1];
            if (firstHistory && lastHistory) {
                const startTime = new Date(firstHistory.fecha).getTime();
                const endTime = new Date(lastHistory.fecha).getTime();
                const durationInSeconds = Math.floor((endTime - startTime) / 1000);
                setTiempoTranscurrido(durationInSeconds > 0 ? durationInSeconds : 0);
            } else {
                setTiempoTranscurrido(0);
            }
        } else {
            const calculateElapsedTime = () => {
                const elapsed = Math.floor((new Date().getTime() - new Date(order.fecha).getTime()) / 1000);
                setTiempoTranscurrido(elapsed > 0 ? elapsed : 0);
            };
            calculateElapsedTime(); // Initial calculation
            timerId = window.setInterval(calculateElapsedTime, 1000);
        }

        return () => {
            if (timerId) {
                clearInterval(timerId);
            }
        };
    }, [order.estado, order.fecha, order.historial, isFinalState]);


    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const getTimerColor = (timeInSeconds: number, timeEstimatedInMinutes: number) => {
        if (isFinalState) {
            return 'text-text-secondary dark:text-slate-400';
        }
        const percentage = timeInSeconds / (timeEstimatedInMinutes * 60);
        if (percentage < 0.75) return 'text-success dark:text-green-400';
        if (percentage <= 1) return 'text-warning dark:text-yellow-400';
        return 'text-danger dark:text-red-400';
    };

    const timerColor = getTimerColor(tiempoTranscurrido, order.tiempoEstimado);
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
        <div style={style} className="bg-surface dark:bg-slate-800 rounded-2xl shadow-lg dark:shadow-2xl dark:shadow-slate-950/50 flex flex-col justify-between min-h-[250px] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group animate-fade-in-up border border-text-primary/5 dark:border-slate-700">
            <div className="p-5 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-heading font-extrabold text-xl text-text-primary dark:text-slate-100">{order.id}</h3>
                        <p className="text-sm font-semibold text-primary dark:text-orange-400">
                            {order.tipo === 'delivery' ? 'Delivery' : (order.cliente.mesa ? `Salón - Mesa ${order.cliente.mesa}` : 'Retiro')}
                        </p>
                    </div>
                     <div className={`text-2xl font-bold ${timerColor} flex items-center bg-background dark:bg-slate-700/50 px-3 py-1 rounded-lg font-mono`}>
                       <ClockIcon className="h-5 w-5 mr-2"/> {formatTime(tiempoTranscurrido)}
                    </div>
                </div>
                 <div className="flex items-center space-x-2 mb-4">
                    <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`}></span>
                    <span className={`text-xs font-bold uppercase tracking-wider ${statusTextColor}`}>{statusLabel}</span>
                </div>

                <div className="space-y-2 text-sm text-text-secondary dark:text-slate-400 mb-4">
                    <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-2.5 text-text-primary/40 dark:text-slate-500" />
                        <span className="font-medium text-text-primary dark:text-slate-200">{order.cliente.nombre}</span>
                    </div>
                    <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-2.5 text-text-primary/40 dark:text-slate-500" />
                        <span>{order.cliente.telefono}</span>
                    </div>
                    {order.tipo === 'delivery' && order.cliente.direccion && (
                         <div className="flex items-start">
                            <MapPinIcon className="h-4 w-4 mr-2.5 mt-0.5 text-text-primary/40 dark:text-slate-500 flex-shrink-0" />
                            {mapsLink ? (
                                <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline transition-colors font-semibold">
                                    Ver en Google Maps
                                </a>
                            ) : (
                                <span className="break-all">{order.cliente.direccion}</span>
                            )}
                         </div>
                    )}
                </div>
                 {order.tipo === 'delivery' && order.metodoPago === 'efectivo' && (
                    <div className="my-2 p-2 bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 rounded-lg text-sm font-semibold text-center">
                        {order.pagoExacto
                            ? 'Paga con monto exacto'
                            : `Paga con S/. ${order.pagoConEfectivo?.toFixed(2)}`
                        }
                    </div>
                )}
                {order.notas && (
                    <div className="my-2 p-3 bg-amber-500/10 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 rounded-lg text-xs">
                        <span className="font-bold">Nota:</span> {order.notas}
                    </div>
                )}
                <div className="border-t border-text-primary/10 dark:border-slate-700 pt-3 mt-auto">
                    <ul className="space-y-1.5 text-sm">
                        {order.productos.map((p, index) => (
                            <li key={index}>
                                <div className="flex justify-between">
                                    <span className="text-text-primary dark:text-slate-200">{p.cantidad}x {p.nombre}</span>
                                    <span className="font-mono text-text-secondary dark:text-slate-400">S/.{(p.cantidad * p.precio).toFixed(2)}</span>
                                </div>
                                {p.especificaciones && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 pl-2 italic">↳ {p.especificaciones}</p>}
                                {p.salsas && p.salsas.length > 0 && (
                                    <p className="text-xs text-sky-600 dark:text-sky-400 mt-1 pl-2 italic">
                                        ↳ {p.salsas.map(s => s.nombre).join(', ')}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            
            <div className="px-5 pb-5">
                <div className="flex justify-between items-center text-sm font-bold border-t border-text-primary/10 dark:border-slate-700 pt-3">
                    <span className="text-text-secondary dark:text-slate-300 text-base">TOTAL</span>
                    <span className="text-xl font-mono text-text-primary dark:text-white font-heading">S/.{order.total.toFixed(2)}</span>
                </div>
                {children && <div className="mt-4">{children}</div>}
            </div>
        </div>
    );
};

export default OrderCard;