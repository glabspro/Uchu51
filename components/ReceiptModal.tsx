import React from 'react';
import type { Pedido } from '../types';
import { Logo } from './Logo';

interface ReceiptModalProps {
    order: Pedido;
    onClose: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
    
    const handlePrint = () => {
        const printContents = document.getElementById('receipt-printable-area')?.innerHTML;
        const originalContents = document.body.innerHTML;
        if (printContents) {
            document.body.innerHTML = printContents;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload(); // To re-attach React components
        }
    };

    const pago = order.pagoRegistrado;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100] p-4">
            <style>
                {`@media print {
                    .no-print { display: none; }
                    body { margin: 0; background-color: #fff; }
                    #receipt-printable-area {
                        font-family: 'Courier New', Courier, monospace;
                    }
                }`}
            </style>
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div id="receipt-printable-area" className="p-6 text-sm text-text-primary">
                    <div className="text-center mb-6">
                        <Logo className="h-10 w-auto mx-auto mb-2" />
                        <p className="text-xs text-text-secondary">Av. Ejemplo 123, Lima, Perú</p>
                        <p className="text-lg font-bold mt-2">COMPROBANTE DE PAGO</p>
                    </div>

                    <div className="border-b border-dashed border-gray-300 pb-2 mb-2">
                        <p><span className="font-semibold">Pedido:</span> {order.id}</p>
                        <p><span className="font-semibold">Fecha:</span> {pago ? new Date(pago.fecha).toLocaleString() : new Date(order.fecha).toLocaleString()}</p>
                        <p><span className="font-semibold">Cliente:</span> {order.cliente.nombre}</p>
                        {order.tipo === 'local' && <p><span className="font-semibold">Mesa:</span> {order.cliente.mesa}</p>}
                    </div>

                    <div className="border-b border-dashed border-gray-300 pb-2 mb-2">
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
                        <div className="border-t border-dashed border-gray-300 pt-2 mt-2">
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

                    <p className="text-center text-xs mt-6 text-text-secondary">¡Gracias por su compra!</p>
                </div>
                 <div className="p-4 bg-background rounded-b-lg grid grid-cols-2 gap-4 no-print">
                    <button onClick={onClose} className="w-full bg-text-primary/10 hover:bg-text-primary/20 text-text-primary font-bold py-2 px-4 rounded-lg">
                        Cerrar
                    </button>
                    <button onClick={handlePrint} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow-md">
                        Imprimir
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;