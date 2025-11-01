

import React, { useState, useMemo } from 'react';
import type { Pedido, CajaSession, MovimientoCaja } from '../types';
import { CheckCircleIcon, CashIcon, CalculatorIcon, PlusCircleIcon, MinusCircleIcon, DocumentMagnifyingGlassIcon } from './icons';
import CloseCajaModal from './CloseCajaModal';
import SalesHistoryModal from './SalesHistoryModal';

interface CajaViewProps {
    orders: Pedido[];
    retiroOrdersToPay: Pedido[];
    paidOrders: Pedido[];
    onInitiatePayment: (order: Pedido) => void;
    cajaSession: CajaSession;
    onOpenCaja: (saldoInicial: number) => void;
    onCloseCaja: (efectivoContado: number) => void;
    onAddMovimiento: (monto: number, descripcion: string, tipo: 'ingreso' | 'egreso') => void;
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

const MovimientoCajaModal: React.FC<{
    tipo: 'ingreso' | 'egreso';
    onClose: () => void;
    onConfirm: (monto: number, descripcion: string) => void;
}> = ({ tipo, onClose, onConfirm }) => {
    const [monto, setMonto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        const montoNum = parseFloat(monto);
        if (isNaN(montoNum) || montoNum <= 0) {
            setError('Por favor, ingrese un monto válido.');
            return;
        }
        if (!descripcion.trim()) {
            setError('La descripción es obligatoria.');
            return;
        }
        onConfirm(montoNum, descripcion);
    };
    
    const isIngreso = tipo === 'ingreso';

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4">
            <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full animate-fade-in-scale">
                 <h3 className="text-2xl font-heading font-bold text-text-primary dark:text-white text-center mb-1">
                    {isIngreso ? 'Añadir Efectivo' : 'Retirar Efectivo'}
                </h3>
                <p className="text-text-secondary dark:text-slate-400 mb-6 text-center text-sm">
                    {isIngreso ? 'Registra un ingreso de dinero a la caja.' : 'Registra un gasto o retiro de dinero.'}
                </p>
                <div className="space-y-4">
                     <div>
                        <label className="font-semibold text-text-secondary dark:text-slate-400 text-sm">Monto</label>
                        <input type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" className="bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-lg p-3 w-full text-text-primary dark:text-slate-100 placeholder-text-secondary/70 dark:placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary transition text-lg font-mono" autoFocus />
                    </div>
                     <div>
                        <label className="font-semibold text-text-secondary dark:text-slate-400 text-sm">Descripción</label>
                        <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder={isIngreso ? 'Ej: Sencillo para caja' : 'Ej: Compra de insumos'} className="bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-lg p-3 w-full text-text-primary dark:text-slate-100 placeholder-text-secondary/70 dark:placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary transition" />
                    </div>
                </div>

                {error && <p className="text-danger text-xs mt-2 text-center">{error}</p>}
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <button onClick={onClose} className="bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-3 px-4 rounded-lg transition-colors active:scale-95">Cancelar</button>
                    <button onClick={handleSubmit} className={`${isIngreso ? 'bg-success hover:brightness-110' : 'bg-warning hover:brightness-110'} text-white font-bold py-3 px-4 rounded-lg transition-all active:scale-95`}>Confirmar</button>
                </div>
            </div>
        </div>
    );
};

const CajaView: React.FC<CajaViewProps> = ({ orders, retiroOrdersToPay, paidOrders, onInitiatePayment, cajaSession, onOpenCaja, onCloseCaja, onAddMovimiento }) => {
    const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
    const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
    const [movimientoModal, setMovimientoModal] = useState<'ingreso' | 'egreso' | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    const cuentasPorCobrarSalon = useMemo(() => orders, [orders]);
    
    const { totalIngresos, totalEgresos } = useMemo(() => {
        const movimientos = cajaSession.movimientos || [];
        return {
            totalIngresos: movimientos.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0),
            totalEgresos: movimientos.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0),
        };
    }, [cajaSession.movimientos]);

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
            {movimientoModal && <MovimientoCajaModal tipo={movimientoModal} onClose={() => setMovimientoModal(null)} onConfirm={(monto, desc) => { onAddMovimiento(monto, desc, movimientoModal); setMovimientoModal(null); }} />}
            <SalesHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} paidOrders={paidOrders} />
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                <div className="lg:col-span-2 bg-surface dark:bg-slate-800 rounded-2xl shadow-lg p-6 flex flex-col border border-text-primary/5 dark:border-slate-700">
                     <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-slate-100 mb-4">Cuentas por Cobrar</h2>
                     <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                        <div>
                            <h3 className="text-lg font-semibold text-text-secondary dark:text-slate-400 mb-2">Salón ({cuentasPorCobrarSalon.length})</h3>
                            {cuentasPorCobrarSalon.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {cuentasPorCobrarSalon.map(order => (
                                        <div key={order.id} className="bg-background dark:bg-slate-900/50 p-4 rounded-xl border border-text-primary/5 dark:border-slate-700 flex flex-col">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-lg text-text-primary dark:text-slate-100">Mesa {order.cliente.mesa}</h3>
                                                    <p className="text-xs font-mono text-text-secondary dark:text-slate-500">{order.id}</p>
                                                </div>
                                                <p className="font-mono text-xl font-semibold text-text-primary dark:text-slate-200">S/.{order.total.toFixed(2)}</p>
                                            </div>
                                            <ul className="text-sm space-y-1 my-2 flex-grow">
                                                {order.productos.map(p => <li key={p.id + p.nombre} className="text-text-secondary dark:text-slate-400">{p.cantidad}x {p.nombre}</li>)}
                                            </ul>
                                            <button onClick={() => onInitiatePayment(order)} className="w-full mt-3 bg-primary text-white font-bold py-2.5 rounded-lg shadow-md hover:bg-primary-dark transition-transform hover:-translate-y-0.5 active:scale-95">
                                                Registrar Pago
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-text-secondary dark:text-slate-500 text-sm">No hay cuentas de salón pendientes.</p>}
                        </div>
                        <div className="border-t border-text-primary/10 dark:border-slate-700 my-4"></div>
                        <div>
                            <h3 className="text-lg font-semibold text-text-secondary dark:text-slate-400 mb-2">Retiro en Tienda ({retiroOrdersToPay.length})</h3>
                             {retiroOrdersToPay.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {retiroOrdersToPay.map(order => (
                                        <div key={order.id} className="bg-background dark:bg-slate-900/50 p-4 rounded-xl border border-text-primary/5 dark:border-slate-700 flex flex-col">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-lg text-text-primary dark:text-slate-100">{order.cliente.nombre}</h3>
                                                    <p className="text-xs font-mono text-text-secondary dark:text-slate-500">{order.id}</p>
                                                </div>
                                                <p className="font-mono text-xl font-semibold text-text-primary dark:text-slate-200">S/.{order.total.toFixed(2)}</p>
                                            </div>
                                            <ul className="text-sm space-y-1 my-2 flex-grow">
                                                 {order.productos.map(p => <li key={p.id + p.nombre} className="text-text-secondary dark:text-slate-400">{p.cantidad}x {p.nombre}</li>)}
                                            </ul>
                                            <button onClick={() => onInitiatePayment(order)} className="w-full mt-3 bg-primary text-white font-bold py-2.5 rounded-lg shadow-md hover:bg-primary-dark transition-transform hover:-translate-y-0.5 active:scale-95">
                                                Registrar Pago
                                            </button>
                                        </div>
                                    ))}
                                </div>
                             ) : <p className="text-text-secondary dark:text-slate-500 text-sm">No hay pedidos de retiro pendientes de pago.</p>}
                        </div>
                         {cuentasPorCobrarSalon.length === 0 && retiroOrdersToPay.length === 0 && (
                            <div className="md:col-span-2 h-full flex flex-col items-center justify-center text-center text-text-secondary/60 dark:text-slate-500">
                                <CheckCircleIcon className="h-20 w-20 mb-4" />
                                <p className="text-lg font-semibold">¡Todo al día!</p>
                                <p>No hay cuentas pendientes de cobro.</p>
                            </div>
                         )}
                     </div>
                </div>
                <div className="lg:col-span-1 bg-surface dark:bg-slate-800 rounded-2xl shadow-lg p-6 flex flex-col border border-text-primary/5 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-slate-100">Control de Turno</h2>
                        <button
                            onClick={() => setIsHistoryModalOpen(true)}
                            className="flex items-center gap-2 bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                        >
                            <DocumentMagnifyingGlassIcon className="h-5 w-5"/>
                            <span>Historial</span>
                        </button>
                    </div>
                     <div className="flex-grow flex flex-col">
                        <div className="bg-background dark:bg-slate-900/50 p-4 rounded-xl space-y-2 mb-4">
                            <div className="flex justify-between items-center text-sm"><span className="text-text-secondary dark:text-slate-400">Saldo Inicial</span> <span className="font-mono text-text-primary dark:text-slate-200">S/.{cajaSession.saldoInicial.toFixed(2)}</span></div>
                            <div className="flex justify-between items-center text-sm"><span className="text-text-secondary dark:text-slate-400">Ventas en Efectivo</span> <span className="font-mono text-success dark:text-green-400">+ S/.{(cajaSession.ventasPorMetodo.efectivo || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between items-center text-sm"><span className="text-text-secondary dark:text-slate-400">Otros Ingresos</span> <span className="font-mono text-success dark:text-green-400">+ S/.{totalIngresos.toFixed(2)}</span></div>
                            <div className="flex justify-between items-center text-sm"><span className="text-text-secondary dark:text-slate-400">Egresos / Gastos</span> <span className="font-mono text-danger dark:text-red-400">- S/.{totalEgresos.toFixed(2)}</span></div>
                            <div className="border-t border-dashed border-text-primary/20 dark:border-slate-600 my-2"></div>
                            <div className="flex justify-between items-center text-lg font-bold"><span className="text-text-primary dark:text-slate-200">Efectivo Esperado</span> <span className="font-mono text-primary dark:text-orange-400">S/.{cajaSession.totalEfectivoEsperado.toFixed(2)}</span></div>
                        </div>

                         <div className="grid grid-cols-2 gap-3 mb-4">
                             <button onClick={() => setMovimientoModal('ingreso')} className="flex items-center justify-center gap-2 bg-success/10 text-success font-semibold p-2 rounded-lg hover:bg-success/20 transition-colors"><PlusCircleIcon className="h-5 w-5"/> Añadir Efectivo</button>
                             <button onClick={() => setMovimientoModal('egreso')} className="flex items-center justify-center gap-2 bg-warning/10 text-warning font-semibold p-2 rounded-lg hover:bg-warning/20 transition-colors"><MinusCircleIcon className="h-5 w-5"/> Retirar Efectivo</button>
                         </div>
                         
                         <div className="flex-grow bg-background dark:bg-slate-900/50 p-2 rounded-xl flex flex-col">
                            <h3 className="text-sm font-semibold text-text-secondary dark:text-slate-400 text-center py-1">Movimientos de Caja</h3>
                            <div className="flex-grow overflow-y-auto space-y-1 text-xs p-1">
                                {(cajaSession.movimientos || []).slice().reverse().map((mov, i) => (
                                    <div key={i} className={`p-2 rounded-md ${mov.tipo === 'ingreso' ? 'bg-success/10' : 'bg-danger/10'}`}>
                                        <div className="flex justify-between font-semibold">
                                             <span className={mov.tipo === 'ingreso' ? 'text-success' : 'text-danger'}>{mov.tipo === 'ingreso' ? 'INGRESO' : 'EGRESO'}</span>
                                             <span className="font-mono">{mov.tipo === 'ingreso' ? '+' : '-'} S/.{mov.monto.toFixed(2)}</span>
                                        </div>
                                        <p className="text-text-secondary dark:text-slate-400">{mov.descripcion}</p>
                                    </div>
                                ))}
                                {(!cajaSession.movimientos || cajaSession.movimientos.length === 0) && <p className="text-center text-text-secondary/50 dark:text-slate-500 pt-8">No hay movimientos.</p>}
                            </div>
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
