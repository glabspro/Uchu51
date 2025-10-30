import React from 'react';
import type { Pedido } from '../types';
import { Logo } from './Logo';

interface PreBillModalProps {
    order: Pedido;
    onClose: () => void;
}

const PreBillModal: React.FC<PreBillModalProps> = ({ order, onClose }) => {
    
    // This is a simple but effective print method. It replaces the body content,
    // triggers print, and then restores it. Reloading is necessary to re-initialize React's state.
    const handlePrint = () => {
        const printContents = document.getElementById('prebill-printable-area')?.innerHTML;
        const originalContents = document.body.innerHTML;
        if (printContents) {
            document.body.innerHTML = printContents;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload(); 
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100] p-4">
            <style>
                {`@media print {
                    .no-print { display: none; }
                    body { margin: 0; background-color: #fff; }
                     #prebill-printable-area {
                        font-family: 'Courier New', Courier, monospace;
                    }
                }`}
            </style>
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div id="prebill-printable-area" className="p-6 text-sm text-text-primary">
                    <div className="text-center mb-6">
                        <Logo className="h-10 w-auto mx-auto mb-2" />
                        <p className="text-xs text-text-secondary">Av. Ejemplo 123, Lima, Perú</p>
                        <p className="text-lg font-bold mt-2">PRE-CUENTA</p>
                    </div>

                    <div className="border-b border-dashed border-gray-300 pb-2 mb-2">
                        <p><span className="font-semibold">Pedido:</span> {order.id}</p>
                        <p><span className="font-semibold">Fecha:</span> {new Date(order.fecha).toLocaleString()}</p>
                        <p><span className="font-semibold">Cliente:</span> {order.cliente.nombre}</p>
                        {order.tipo === 'local' && <p><span className="font-semibold">Mesa:</span> {order.cliente.mesa}</p>}
                    </div>
                    
                    {order.notas && (
                        <div className="border-b border-dashed border-gray-300 pb-2 mb-2">
                            <p><span className="font-semibold">Notas:</span> {order.notas}</p>
                        </div>
                    )}

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
                            <span>TOTAL A PAGAR:</span>
                            <span className="font-mono">S/.{order.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <p className="text-center text-xs mt-6 text-text-secondary">Este no es un comprobante de pago.</p>
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

export default PreBillModal;