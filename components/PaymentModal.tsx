
import React, { useState, useMemo } from 'react';
import type { Pedido, MetodoPago } from '../types';
import { CashIcon, CreditCardIcon, DevicePhoneMobileIcon } from './icons';

interface PaymentModalProps {
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
                : 'bg-surface border-text-primary/10 text-text-primary hover:border-primary/50'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const PaymentModal: React.FC<PaymentModalProps> = ({ order, onClose, onConfirmPayment }) => {
    const [selectedMethod, setSelectedMethod] = useState<MetodoPago>('efectivo');
    const [amountReceived, setAmountReceived] = useState<string>('');

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
            <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg animate-fade-in-scale" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-text-primary/10 text-center">
                    <h2 className="text-2xl font-heading font-bold text-text-primary">Registrar Pago</h2>
                    <p className="text-text-secondary">Pedido {order.id} - {order.tipo === 'local' ? `Mesa ${order.cliente.mesa}` : order.cliente.nombre}</p>
                </div>

                <div className="p-6">
                    <div className="bg-background border border-text-primary/5 p-4 rounded-xl text-center mb-6">
                        <p className="text-lg text-text-secondary">Total a Pagar</p>
                        <p className="text-5xl font-heading font-extrabold text-text-primary font-mono">S/.{order.total.toFixed(2)}</p>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-text-secondary mb-3">Método de Pago</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <PaymentMethodButton method="efectivo" label="Efectivo" icon={<CashIcon className="h-5 w-5"/>} currentMethod={selectedMethod} setMethod={setSelectedMethod} />
                            <PaymentMethodButton method="tarjeta" label="Tarjeta" icon={<CreditCardIcon className="h-5 w-5"/>} currentMethod={selectedMethod} setMethod={setSelectedMethod} />
                            <PaymentMethodButton method="yape/plin" label="Yape/Plin" icon={<DevicePhoneMobileIcon className="h-5 w-5"/>} currentMethod={selectedMethod} setMethod={setSelectedMethod} />
                        </div>
                    </div>

                    {selectedMethod === 'efectivo' && (
                        <div className="space-y-4 animate-fade-in-right">
                             <div>
                                <label htmlFor="amount-received" className="block text-sm font-bold text-text-primary mb-1">Monto Recibido</label>
                                <input
                                    id="amount-received"
                                    type="number"
                                    value={amountReceived}
                                    onChange={(e) => setAmountReceived(e.target.value)}
                                    placeholder="Ej: 50.00"
                                    className="bg-background border border-text-primary/10 rounded-lg p-3 w-full text-text-primary placeholder-text-secondary/70 focus:ring-2 focus:ring-primary focus:border-primary transition text-xl font-mono"
                                />
                            </div>
                            <div className="flex gap-2">
                                {quickCashOptions.map(amount => (
                                     <button key={amount} onClick={() => setAmountReceived(amount.toFixed(2))} className="flex-1 bg-text-primary/10 text-text-primary font-semibold py-2 rounded-lg hover:bg-text-primary/20 transition-colors">
                                        S/. {amount.toFixed(2)}
                                     </button>
                                ))}
                            </div>
                            <div className="bg-blue-500/10 p-4 rounded-xl text-center">
                                <p className="text-lg text-blue-800">Vuelto</p>
                                <p className="text-4xl font-extrabold text-blue-900 font-mono">S/.{vuelto.toFixed(2)}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t mt-auto bg-background rounded-b-2xl grid grid-cols-2 gap-4">
                    <button onClick={onClose} className="w-full bg-text-primary/10 hover:bg-text-primary/20 text-text-primary font-bold py-3 px-6 rounded-xl transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled}
                        className="w-full bg-text-primary hover:bg-text-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-text-primary/20 hover:-translate-y-0.5 disabled:bg-gray-400 disabled:shadow-none disabled:translate-y-0"
                    >
                        Confirmar Pago
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;