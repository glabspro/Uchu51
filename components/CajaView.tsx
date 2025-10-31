

import React, { useState, useMemo } from 'react';
import type { Pedido, CajaSession } from '../types';
import { CheckCircleIcon, CashIcon, CalculatorIcon } from './icons';
import CloseCajaModal from './CloseCajaModal';

interface CajaViewProps {
    orders: Pedido[];
    onInitiatePayment: (order: Pedido) => void;
    cajaSession: CajaSession;
    onOpenCaja: (saldoInicial: number) => void;
    onCloseCaja: (efectivoContado: number) => void;
}

const OpenCajaModal: React.FC<{ onClose: () => void; onOpen: (saldo: number) => void; }> = ({ onClose, onOpen }) => {
    const [saldo, setSaldo] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        const saldoNum = parseFloat(saldo);
        if (isNaN(saldoNum) || saldoNum < 0) {
            setError('Por favor, ingrese un monto válido.');
            return;
        }
        onOpen(saldoNum);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4">
            <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full text-center animate-fade-in-scale">
                <CashIcon className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-2xl font-heading font-bold text-text-primary dark:text-white">Abrir Caja</h3>
                <p className="text-text-secondary dark:text-slate-400 my-3">Ingresa el saldo inicial en efectivo para comenzar el turno.</p>
                <input
                    type="number"
                    value={saldo}
                    onChange={(e) => { setSaldo(e.target.value); setError(''); }}
                    placeholder="Ej: 150.00"
                    className="bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-lg p-3 w-full text-center text-text-primary dark:text-slate-100 placeholder-text-secondary/70 dark:placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary transition text-xl font-mono"
                    autoFocus
                />
                {error && <p className="text-danger text-xs mt-1">{error}</p>}
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <button onClick={onClose} className="bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-3 px-4 rounded-lg transition-colors active:scale-95">Cancelar</button>
                    <button onClick={handleSubmit} className="bg-success hover:brightness-110 text-white font-bold py-3 px-4 rounded-lg transition-all active:scale-95">Confirmar</button>
                </div>
            </div>
        </div>
    );
};

const CajaView: React.FC<CajaViewProps> = ({ orders, onInitiatePayment, cajaSession, onOpenCaja, onCloseCaja }) => {
    const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
    const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);

    const cuentasPorCobrar = useMemo(() => orders, [orders]);

    if (cajaSession.estado === 'cerrada') {
        return (
            <>
                {isOpeningModalOpen && <OpenCajaModal onClose={() => setIsOpeningModalOpen(false)} onOpen={(saldo) => { onOpenCaja(saldo); setIsOpeningModalOpen(false); }} />}
                <div className="h-full flex flex-col items-center justify-center text-center bg-surface dark:bg-slate-800 rounded-2xl shadow-lg p-8">
                    <h1 className="text-3xl font-heading font-bold text-text-primary dark:text-slate-100">Caja Cerrada</h1>
                    <p className="text-text-secondary dark:text-slate-400 mt-2 mb-6 max-w-sm">Para empezar a registrar ventas, necesitas abrir la caja con el saldo inicial del día.</p>
                    <button
                        onClick={() => setIsOpeningModalOpen(true)}
                        className="bg-primary hover:bg-primary-dark text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 active:scale-95"
                    >
                        <CashIcon className="inline-block h-6 w-6 mr-2" />
                        Abrir Caja
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            {isClosingModalOpen && <CloseCajaModal onClose={() => setIsClosingModalOpen(false)} onCloseCaja={(efectivo) => { onCloseCaja(efectivo); }} session={cajaSession} />}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                <div className="lg:col-span-2 bg-surface dark:bg-slate-800 rounded-2xl shadow-lg p-6 flex flex-col border border-text-primary/5 dark:border-slate-700">
                     <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-slate-100 mb-4">Cuentas por Cobrar ({cuentasPorCobrar.length})</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-y-auto pr-2">
                         {cuentasPorCobrar.length > 0 ? cuentasPorCobrar.map(order => (
                             <div key={order.id} className="bg-background dark:bg-slate-900/50 p-4 rounded-xl border border-text-primary/5 dark:border-slate-700 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                     <div>
                                        <h3 className="font-bold text-lg text-text-primary dark:text-slate-100">{order.tipo === 'local' ? `Mesa ${order.cliente.mesa}` : order.cliente.nombre}</h3>
                                        <p className="text-xs font-mono text-text-secondary dark:text-slate-500">{order.id}</p>
                                     </div>
                                     <p className="font-mono text-xl font-semibold text-text-primary dark:text-slate-200">S/.{order.total.toFixed(2)}</p>
                                </div>
                                <ul className="text-sm space-y-1 my-2 flex-grow">
                                    {order.productos.map(p => <li key={p.id} className="text-text-secondary dark:text-slate-400">{p.cantidad}x {p.nombre}</li>)}
                                </ul>
                                <button onClick={() => onInitiatePayment(order)} className="w-full mt-3 bg-primary text-white font-bold py-2.5 rounded-lg shadow-md hover:bg-primary-dark transition-transform hover:-translate-y-0.5 active:scale-95">
                                    Registrar Pago
                                </button>
                             </div>
                         )) : (
                            <div className="md:col-span-2 h-full flex flex-col items-center justify-center text-center text-text-secondary/60 dark:text-slate-500">
                                <CheckCircleIcon className="h-20 w-20 mb-4" />
                                <p className="text-lg font-semibold">¡Todo al día!</p>
                                <p>No hay cuentas pendientes de cobro.</p>
                            </div>
                         )}
                     </div>
                </div>
                <div className="lg:col-span-1 bg-surface dark:bg-slate-800 rounded-2xl shadow-lg p-6 flex flex-col border border-text-primary/5 dark:border-slate-700">
                    <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-slate-100 mb-4">Control de Turno</h2>
                     <div className="flex-grow">
                         <div className="bg-background dark:bg-slate-900/50 p-4 rounded-xl text-center mb-6">
                            <p className="text-lg text-text-secondary dark:text-slate-400">Ventas Totales del Turno</p>
                            <p className="text-5xl font-heading font-extrabold text-text-primary dark:text-white font-mono">S/.{cajaSession.totalVentas.toFixed(2)}</p>
                        </div>
                        <div className="bg-background dark:bg-slate-900/50 p-4 rounded-xl text-center">
                            <p className="text-lg text-text-secondary dark:text-slate-400">Ganancia Estimada</p>
                            <p className="text-5xl font-heading font-extrabold text-success dark:text-green-400 font-mono">S/.{(cajaSession.gananciaTotal || 0).toFixed(2)}</p>
                        </div>
                     </div>
                    <div className="mt-auto pt-6">
                         <button onClick={() => setIsClosingModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-danger hover:brightness-110 text-white font-bold py-4 px-4 rounded-xl transition-all active:scale-95 text-lg shadow-lg shadow-danger/20">
                            <CalculatorIcon className="h-6 w-6"/> Arqueo y Cierre de Caja
                        </button>
                    </div>
                </div>
             </div>
        </>
    );
};

export default CajaView;