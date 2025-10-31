import React from 'react';
import type { Pedido, Theme } from '../types';
import { Logo } from './Logo';

interface PreBillModalProps {
    order: Pedido;
    onClose: () => void;
    theme: Theme;
}

const PreBillModal: React.FC<PreBillModalProps> = ({ order, onClose, theme }) => {
    
    const handlePrint = () => {
        const handleAfterPrint = () => {
            document.body.classList.remove('uchu-printing');
            window.removeEventListener('afterprint', handleAfterPrint);
        };
        window.addEventListener('afterprint', handleAfterPrint);
        document.body.classList.add('uchu-printing');
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100] p-4 printable-modal" onClick={onClose}>
            <div className="bg-surface dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-sm text-text-primary dark:text-slate-200 printable-modal-content">
                    <div className="text-center mb-6">
                        <Logo className="h-10 w-auto mx-auto mb-2" variant={theme === 'dark' ? 'light' : 'default'} />
                        <p className="text-xs text-text-secondary dark:text-slate-400">Av. Ejemplo 123, Lima, Perú</p>
                        <p className="text-lg font-bold mt-2">PRE-CUENTA</p>
                    </div>

                    <div className="border-b border-dashed border-gray-300 dark:border-slate-600 pb-2 mb-2">
                        <p><span className="font-semibold">Pedido:</span> {order.id}</p>
                        <p><span className="font-semibold">Fecha:</span> {new Date(order.fecha).toLocaleString()}</p>
                        <p><span className="font-semibold">Cliente:</span> {order.cliente.nombre}</p>
                        {order.tipo === 'local' && <p><span className="font-semibold">Mesa:</span> {order.cliente.mesa}</p>}
                    </div>
                    
                    {order.notas && (
                        <div className="border-b border-dashed border-gray-300 dark:border-slate-600 pb-2 mb-2">
                            <p><span className="font-semibold">Notas:</span> {order.notas}</p>
                        </div>
                    )}

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
                            <span>TOTAL A PAGAR:</span>
                            <span className="font-mono">S/.{order.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <p className="text-center text-xs mt-6 text-text-secondary dark:text-slate-500">Este no es un comprobante de pago.</p>
                </div>
                 <div className="p-4 bg-background dark:bg-slate-900/50 rounded-b-lg grid grid-cols-2 gap-4 no-print">
                    <button onClick={onClose} className="w-full bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-2 px-4 rounded-lg">
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