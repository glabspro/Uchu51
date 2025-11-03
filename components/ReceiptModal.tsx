import React, { useState } from 'react';
import type { Pedido, Theme } from '../types';
import { Logo } from './Logo';
import { WhatsAppIcon, CheckCircleIcon } from './icons';

interface ReceiptModalProps {
    order: Pedido;
    onClose: () => void;
    theme: Theme;
    showToast: (message: string, type: 'success' | 'info' | 'danger') => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose, theme, showToast }) => {
    const [whatsAppStatus, setWhatsAppStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    const handlePrint = () => {
        const handleAfterPrint = () => {
            document.body.classList.remove('uchu-printing');
            window.removeEventListener('afterprint', handleAfterPrint);
        };
        window.addEventListener('afterprint', handleAfterPrint);
        document.body.classList.add('uchu-printing');
        window.print();
    };
    
    const handleSendWhatsApp = async () => {
        if (!order.cliente.telefono || !/^\d{9}$/.test(order.cliente.telefono)) {
            showToast('El cliente no tiene un número de teléfono válido.', 'danger');
            return;
        }

        setWhatsAppStatus('sending');

        let message = `*¡Gracias por tu compra en Uchu51!* 🎉\n\n`;
        message += `Hola *${order.cliente.nombre}*, aquí tienes el detalle de tu pedido:\n\n`;
        message += `*Pedido:* ${order.id}\n`;
        message += `*Fecha:* ${new Date(order.pagoRegistrado?.fecha || order.fecha).toLocaleString()}\n\n`;
        message += `*Resumen:*\n`;
        order.productos.forEach(item => {
            message += ` - ${item.cantidad}x ${item.nombre} - S/.${(item.cantidad * item.precio).toFixed(2)}\n`;
        });
        message += `\n*TOTAL:* S/.${order.total.toFixed(2)}\n`;
        message += `*Método de Pago:* ${order.pagoRegistrado?.metodo.toUpperCase()}\n`;

        if (order.puntosGanados && order.puntosGanados > 0) {
            message += `\n---------------------\n`;
            message += `*¡Felicidades!* 🌟\n`;
            message += `Ganaste *${order.puntosGanados}* puntos con esta compra. ¡Sigue acumulando para canjear recompensas!`;
        }

        try {
            // Reemplaza '/api/send-whatsapp' con tu endpoint real de n8n o Evolution API
            const response = await fetch('/api/send-whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: `51${order.cliente.telefono}`, // Agrega el código de país
                    message: message,
                }),
            });

            if (response.ok) {
                setWhatsAppStatus('sent');
                showToast('Comprobante enviado por WhatsApp.', 'success');
            } else {
                throw new Error('La respuesta de la API no fue exitosa');
            }
        } catch (error) {
            console.error("Error al enviar por WhatsApp:", error);
            setWhatsAppStatus('error');
            showToast('Error al enviar. Inténtalo de nuevo.', 'danger');
        }
    };

    const pago = order.pagoRegistrado;

    const renderWhatsAppButtonContent = () => {
        switch (whatsAppStatus) {
            case 'sending':
                return (
                    <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando...
                    </div>
                );
            case 'sent':
                return (
                    <div className="flex items-center justify-center gap-2">
                       <CheckCircleIcon className="h-5 w-5"/> Enviado
                    </div>
                );
            case 'error':
                return 'Reintentar';
            default:
                return (
                     <div className="flex items-center justify-center gap-2">
                        <WhatsAppIcon className="h-5 w-5" /> Enviar
                    </div>
                );
        }
    }


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100] p-4 printable-modal" onClick={onClose}>
            <div className="bg-surface dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-sm text-text-primary dark:text-slate-200 printable-modal-content">
                    <div className="text-center mb-6">
                        <Logo className="h-10 w-auto mx-auto mb-2" variant={theme === 'dark' ? 'light' : 'default'} />
                        <p className="text-xs text-text-secondary dark:text-slate-400">Av. Ejemplo 123, Lima, Perú</p>
                        <p className="text-lg font-bold mt-2">COMPROBANTE DE PAGO</p>
                    </div>

                    <div className="border-b border-dashed border-gray-300 dark:border-slate-600 pb-2 mb-2">
                        <p><span className="font-semibold">Pedido:</span> {order.id}</p>
                        <p><span className="font-semibold">Fecha:</span> {pago ? new Date(pago.fecha).toLocaleString() : new Date(order.fecha).toLocaleString()}</p>
                        <p><span className="font-semibold">Cliente:</span> {order.cliente.nombre}</p>
                        {order.tipo === 'local' && <p><span className="font-semibold">Mesa:</span> {order.cliente.mesa}</p>}
                    </div>

                    <div className="border-b border-dashed border-gray-300 dark:border-slate-600 pb-2 mb-2">
                        <div className="flex justify-between font-semibold">
                            <span>Cant.</span>
                            <span className="flex-grow text-left pl-2">Descripción</span>
                            <span>Total</span>
                        </div>
                        {order.productos.map((item, index) => (
                            <div key={index} className="flex justify-between">
                                <span>{item.cantidad}x</span>
                                <span className="flex-grow text-left pl-2">{item.nombre}</span>
                                <span className="font-mono">S/.{(item.cantidad * item.precio).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-1 pt-2">
                         <div className="flex justify-between font-semibold text-lg">
                            <span>TOTAL:</span>
                            <span className="font-mono">S/.{order.total.toFixed(2)}</span>
                        </div>
                    </div>

                    {pago && (
                        <div className="border-t border-dashed border-gray-300 dark:border-slate-600 pt-2 mt-2">
                            <div className="flex justify-between">
                                <span>Método:</span>
                                <span className="font-semibold capitalize">{pago.metodo.replace(/yape\/plin/g, 'Yape/Plin')}</span>
                            </div>
                            {pago.metodo === 'efectivo' && typeof pago.montoPagado !== 'undefined' && typeof pago.vuelto !== 'undefined' && (
                                <>
                                    <div className="flex justify-between">
                                        <span>Recibido:</span>
                                        <span className="font-mono">S/.{pago.montoPagado.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Vuelto:</span>
                                        <span className="font-mono">S/.{pago.vuelto.toFixed(2)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    
                    {order.puntosGanados && order.puntosGanados > 0 && (
                        <div className="border-t border-dashed border-gray-300 dark:border-slate-600 mt-2 pt-2 text-center bg-primary/10 dark:bg-orange-500/20 p-3 rounded-lg">
                            <p className="font-semibold text-primary dark:text-orange-300">¡Gracias por tu lealtad! 🌟</p>
                            <p className="text-text-primary dark:text-slate-200">Ganaste <span className="font-bold text-lg">{order.puntosGanados}</span> puntos en esta compra.</p>
                        </div>
                    )}


                    <p className="text-center text-xs mt-6 text-text-secondary dark:text-slate-500">¡Gracias por su compra!</p>
                </div>
                 <div className="p-4 bg-background dark:bg-slate-900/50 rounded-b-lg grid grid-cols-3 gap-2 no-print">
                    <button onClick={onClose} className="w-full bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-2 px-3 rounded-lg text-sm">
                        Cerrar
                    </button>
                    <button onClick={handlePrint} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-3 rounded-lg shadow-md text-sm">
                        Imprimir
                    </button>
                    <button 
                        onClick={handleSendWhatsApp}
                        disabled={whatsAppStatus === 'sending' || whatsAppStatus === 'sent'}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg shadow-md text-sm disabled:bg-green-400 disabled:cursor-not-allowed"
                    >
                        {renderWhatsAppButtonContent()}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;