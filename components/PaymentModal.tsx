
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
        className={`flex items-center justify-center space-x-2 w-full p-3 rounded-lg border-2 transition-all duration-200 ${
            currentMethod === method
                ? 'bg-primary/10 border-primary text-primary font-bold shadow-inner'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const PaymentModal: React.FC<PaymentModalProps> = ({ order, onClose, onConfirmPayment }) => {
    const [selectedMethod, setSelectedMethod] = useState<MetodoPago>('efectivo');
    const [amountReceived, setAmountReceived] = useState<string>('');

    const quickCashOptions = [20, 50, 100, 200];

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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100] p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 text-center">
                    <h2 className="text-2xl font-bold text-slate-800">Registrar Pago</h2>
                    <p className="text-slate-500">Pedido {order.id} - {order.tipo === 'local' ? `Mesa ${order.cliente.mesa}` : order.cliente.nombre}</p>
                </div>

                <div className="p-6">
                    <div className="bg-slate-100 p-4 rounded-xl text-center mb-6">
                        <p className="text-lg text-slate-600">Total a Pagar</p>
                        <p className="text-5xl font-extrabold text-slate-800 font-mono">S/.{order.total.toFixed(2)}</p>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-slate-600 mb-3">Método de Pago</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <PaymentMethodButton method="efectivo" label="Efectivo" icon={<CashIcon className="h-5 w-5"/>} currentMethod={selectedMethod} setMethod={setSelectedMethod} />
                            <PaymentMethodButton method="tarjeta" label="Tarjeta" icon={<CreditCardIcon className="h-5 w-5"/>} currentMethod={selectedMethod} setMethod={setSelectedMethod} />
                            <PaymentMethodButton method="yape/plin" label="Yape/Plin" icon={<DevicePhoneMobileIcon className="h-5 w-5"/>} currentMethod={selectedMethod} setMethod={setSelectedMethod} />
                        </div>
                    </div>

                    {selectedMethod === 'efectivo' && (
                        <div className="space-y-4 animate-fade-in-right">
                             <div>
                                <label htmlFor="amount-received" className="block text-sm font-bold text-slate-700 mb-1">Monto Recibido</label>
                                <input
                                    id="amount-received"
                                    type="number"
                                    value={amountReceived}
                                    onChange={(e) => setAmountReceived(e.target.value)}
                                    placeholder="Ej: 50.00"
                                    className="bg-white border border-slate-300 rounded-lg p-3 w-full text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary transition text-xl font-mono"
                                />
                            </div>
                            <div className="flex gap-2">
                                {quickCashOptions.map(amount => (
                                     <button key={amount} onClick={() => setAmountReceived(amount.toString())} className="flex-1 bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg hover:bg-slate-300 transition-colors">
                                        S/. {amount}
                                     </button>
                                ))}
                            </div>
                            <div className="bg-blue-100 p-4 rounded-xl text-center">
                                <p className="text-lg text-blue-800">Vuelto</p>
                                <p className="text-4xl font-extrabold text-blue-900 font-mono">S/.{vuelto.toFixed(2)}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t mt-auto bg-slate-50 rounded-b-2xl grid grid-cols-2 gap-4">
                    <button onClick={onClose} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-6 rounded-lg transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed shadow-lg"
                    >
                        Confirmar Pago
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;