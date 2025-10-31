

import React, { useState, useMemo } from 'react';
import type { Pedido, MetodoPago } from '../types';
import { CashIcon, CreditCardIcon, DevicePhoneMobileIcon } from './icons';

interface DeliveryPaymentModalProps {
    order: Pedido;
    onClose: () => void;
    onConfirmPayment: (orderId: string, details: { metodo: MetodoPago; montoPagado?: number }) => void;
}

const PaymentMethodButton: React.FC<{
    method: MetodoPago;
    label: string;
    icon: React.ReactNode;
    currentMethod: MetodoPago;
    setMethod: (method: MetodoPago) => void;
}> = ({ method, label, icon, currentMethod, setMethod }) => (
    <button
        onClick={() => setMethod(method)}
        className={`flex items-center justify-center space-x-2 w-full p-3 rounded-xl border-2 transition-all duration-200 ${
            currentMethod === method
                ? 'bg-primary/10 border-primary text-primary font-bold shadow-inner'
                : 'bg-surface dark:bg-slate-700 border-text-primary/10 dark:border-slate-600 text-text-primary dark:text-slate-200 hover:border-primary/50 dark:hover:border-primary/80'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const DeliveryPaymentModal: React.FC<DeliveryPaymentModalProps> = ({ order, onClose, onConfirmPayment }) => {
    const [selectedMethod, setSelectedMethod] = useState<MetodoPago>(order.metodoPago);
    const [amountReceived, setAmountReceived] = useState<string>(order.pagoConEfectivo?.toString() || '');

    const quickCashOptions = [order.total, 20, 50, 100, 200].filter((v, i, a) => a.indexOf(v) === i && v >= order.total).sort((a,b) => a-b);

    const vuelto = useMemo(() => {
        if (selectedMethod !== 'efectivo' || !amountReceived) return 0;
        const received = parseFloat(amountReceived);
        if (isNaN(received) || received < order.total) return 0;
        return received - order.total;
    }, [amountReceived, order.total, selectedMethod]);

    const handleConfirm = () => {
        const paymentDetails = {
            metodo: selectedMethod,
            montoPagado: selectedMethod === 'efectivo' ? parseFloat(amountReceived) : order.total,
        };
        onConfirmPayment(order.id, paymentDetails);
    };
    
    const isConfirmDisabled = selectedMethod === 'efectivo' && (parseFloat(amountReceived) < order.total || isNaN(parseFloat(amountReceived)));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100] p-4 font-sans" onClick={onClose}>
            <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg animate-fade-in-scale" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-text-primary/10 dark:border-slate-700 text-center">
                    <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-slate-100">Registrar Pago y Entrega</h2>
                    <p className="text-text-secondary dark:text-slate-400">Pedido {order.id}</p>
                </div>

                <div className="p-6">
                    <div className="bg-background dark:bg-slate-900/50 border border-text-primary/5 dark:border-slate-700 p-4 rounded-xl text-center mb-6">
                        <p className="text-lg text-text-secondary dark:text-slate-400">Total a Cobrar</p>
                        <p className="text-5xl font-heading font-extrabold text-text-primary dark:text-white font-mono">S/.{order.total.toFixed(2)}</p>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-text-secondary dark:text-slate-300 mb-3">Método de Pago</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                           <PaymentMethodButton method="efectivo" label="Efectivo" icon={<CashIcon className="h-5 w-5"/>} currentMethod={selectedMethod} setMethod={setSelectedMethod} />
                           <PaymentMethodButton method="tarjeta" label="Tarjeta" icon={<CreditCardIcon className="h-5 w-5"/>} currentMethod={selectedMethod} setMethod={setSelectedMethod} />
                           <PaymentMethodButton method="yape" label="Yape" icon={<DevicePhoneMobileIcon className="h-5 w-5"/>} currentMethod={selectedMethod} setMethod={setSelectedMethod} />
                           <PaymentMethodButton method="plin" label="Plin" icon={<DevicePhoneMobileIcon className="h-5 w-5"/>} currentMethod={selectedMethod} setMethod={setSelectedMethod} />
                        </div>
                    </div>

                    {selectedMethod === 'efectivo' && (
                        <div className="space-y-4 animate-fade-in-right">
                             <div>
                                <label htmlFor="amount-received" className="block text-sm font-bold text-text-primary dark:text-slate-200 mb-1">Monto Recibido</label>
                                <input
                                    id="amount-received"
                                    type="number"
                                    value={amountReceived}
                                    onChange={(e) => setAmountReceived(e.target.value)}
                                    placeholder={`Ej: ${order.pagoConEfectivo?.toFixed(2) || '50.00'}`}
                                    className="bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-lg p-3 w-full text-text-primary dark:text-slate-100 placeholder-text-secondary/70 dark:placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary transition text-xl font-mono"
                                />
                            </div>
                            <div className="flex gap-2">
                                {quickCashOptions.map(amount => (
                                     <button key={amount} onClick={() => setAmountReceived(amount.toFixed(2))} className="flex-1 bg-text-primary/10 dark:bg-slate-700 text-text-primary dark:text-slate-200 font-semibold py-2 rounded-lg hover:bg-text-primary/20 dark:hover:bg-slate-600 transition-colors">
                                        S/. {amount.toFixed(2)}
                                     </button>
                                ))}
                            </div>
                            <div className="bg-blue-500/10 dark:bg-blue-500/20 p-4 rounded-xl text-center">
                                <p className="text-lg text-blue-800 dark:text-blue-300">Vuelto</p>
                                <p className="text-4xl font-extrabold text-blue-900 dark:text-blue-200 font-mono">S/.{vuelto.toFixed(2)}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t dark:border-slate-700 mt-auto bg-background dark:bg-slate-900/50 rounded-b-2xl grid grid-cols-2 gap-4">
                    <button onClick={onClose} className="w-full bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-3 px-6 rounded-xl transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled}
                        className="w-full bg-success hover:brightness-105 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-success/20 hover:-translate-y-0.5 disabled:bg-gray-400 dark:disabled:bg-slate-600/50 dark:disabled:text-slate-400 disabled:shadow-none disabled:translate-y-0"
                    >
                        Confirmar Entrega y Pago
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeliveryPaymentModal;