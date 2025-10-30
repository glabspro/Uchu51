
import React from 'react';
import type { Pedido } from '../types';

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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div id="receipt-printable-area" className="p-6 text-sm text-slate-800">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-black text-slate-900">GRAB IT</h1>
                        <p className="text-xs text-slate-500">Av. Ejemplo 123, Lima, Perú</p>
                        <p className="text-xs text-slate-500">RUC: 20123456789</p>
                    </div>

                    <div className="border-b border-dashed border-slate-300 pb-2 mb-2">
                        <p><span className="font-semibold">Pedido:</span> {order.id}</p>
                        <p><span className="font-semibold">Fecha:</span> {new Date(order.fecha).toLocaleString()}</p>
                        <p><span className="font-semibold">Cliente:</span> {order.cliente.nombre}</p>
                        {order.tipo === 'local' && <p><span className="font-semibold">Mesa:</span> {order.cliente.mesa}</p>}
                    </div>

                    {order.notas && (
                        <div className="border-b border-dashed border-slate-300 pb-2 mb-2">
                            <p><span className="font-semibold">Notas:</span> {order.notas}</p>
                        </div>
                    )}

                    <div className="border-b border-dashed border-slate-300 pb-2 mb-2">
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
                        <div className="flex justify-between font-semibold text-base">
                            <span>TOTAL:</span>
                            <span className="font-mono">S/.{order.total.toFixed(2)}</span>
                        </div>
                        {pago && (
                            <>
                                <div className="flex justify-between">
                                    <span>Método de Pago:</span>
                                    <span>{pago.metodo.charAt(0).toUpperCase() + pago.metodo.slice(1)}</span>
                                </div>
                                {pago.metodo === 'efectivo' && pago.montoPagado && (
                                     <div className="flex justify-between">
                                        <span>Monto Pagado:</span>
                                        <span className="font-mono">S/.{pago.montoPagado.toFixed(2)}</span>
                                    </div>
                                )}
                                 {pago.metodo === 'efectivo' && pago.vuelto != null && (
                                     <div className="flex justify-between font-semibold">
                                        <span>VUELTO:</span>
                                        <span className="font-mono">S/.{pago.vuelto.toFixed(2)}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <p className="text-center text-xs mt-6 text-slate-500">¡Gracias por su compra!</p>
                </div>
                 <div className="p-4 bg-slate-100 rounded-b-lg grid grid-cols-2 gap-4 no-print">
                    <button onClick={onClose} className="w-full bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold py-2 px-4 rounded-lg">
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