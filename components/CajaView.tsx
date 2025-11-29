
import React, { useState, useMemo } from 'react';
import type { Pedido, CajaSession, MovimientoCaja } from '../types';
import { useAppContext } from '../store';
import { CheckCircleIcon, CashIcon, CalculatorIcon, PlusCircleIcon, MinusCircleIcon, DocumentMagnifyingGlassIcon, UserIcon, ClockIcon, CalendarIcon } from './icons';
import CloseCajaModal from './CloseCajaModal';
import SalesHistoryModal from './SalesHistoryModal';
import CashDenominationCounter, { DenominationCounts } from './CashDenominationCounter';

interface CajaViewProps {
    orders: Pedido[];
    retiroOrdersToPay: Pedido[];
    paidOrders: Pedido[];
}

const AdvancedOpenCajaModal: React.FC<{ onClose: () => void; onOpen: (saldo: number) => void; }> = ({ onClose, onOpen }) => {
    const { state } = useAppContext();
    const { turno, currentUserRole } = state;
    const [mode, setMode] = useState<'manual' | 'calculator'>('manual');
    const [montoManual, setMontoManual] = useState('');
    const [counts, setCounts] = useState<DenominationCounts>({});
    const [calculatedTotal, setCalculatedTotal] = useState(0);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    const MIN_OPENING_AMOUNT = 100;

    const handleCountChange = (total: number, newCounts: DenominationCounts) => {
        setCalculatedTotal(total);
        setCounts(newCounts);
        setMontoManual(total.toFixed(2));
    };

    const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMontoManual(e.target.value);
    };

    const totalToOpen = mode === 'calculator' ? calculatedTotal : parseFloat(montoManual || '0');

    const handleSubmit = () => {
        if (isNaN(totalToOpen) || totalToOpen < 0) {
            setError('Por favor, ingrese un monto válido.');
            return;
        }
        if (totalToOpen === 0) {
             setError('El monto inicial no puede ser 0.');
             return;
        }
        onOpen(totalToOpen);
    };

    const today = new Date();
    const formattedDate = today.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = today.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4">
            <div className="bg-surface dark:bg-zinc-800 rounded-2xl shadow-xl p-0 max-w-lg w-full flex flex-col animate-fade-in-scale overflow-hidden max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-primary/10 p-6 pb-4 border-b border-primary/20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary rounded-lg text-white">
                            <CashIcon className="h-6 w-6" />
                        </div>
                        <h3 className="text-2xl font-heading font-bold text-text-primary dark:text-zinc-100">Apertura de Caja</h3>
                    </div>
                    <p className="text-text-secondary dark:text-zinc-400 text-sm">Inicia el turno registrando el fondo de caja.</p>
                </div>

                <div className="flex-grow overflow-y-auto p-6 space-y-6">
                    {/* Turn Info */}
                    <div className="bg-background dark:bg-zinc-900/50 p-4 rounded-xl border border-text-primary/5 dark:border-zinc-700 grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <UserIcon className="h-5 w-5 text-text-secondary dark:text-zinc-500" />
                            <div>
                                <p className="text-xs text-text-secondary dark:text-zinc-500 font-bold uppercase">Usuario</p>
                                <p className="text-sm font-semibold text-text-primary dark:text-zinc-200 capitalize">{currentUserRole}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <ClockIcon className="h-5 w-5 text-text-secondary dark:text-zinc-500" />
                            <div>
                                <p className="text-xs text-text-secondary dark:text-zinc-500 font-bold uppercase">Turno</p>
                                <p className="text-sm font-semibold text-text-primary dark:text-zinc-200 capitalize">{turno}</p>
                            </div>
                        </div>
                        <div className="col-span-2 flex items-center gap-3 pt-2 border-t border-text-primary/5 dark:border-zinc-700">
                            <CalendarIcon className="h-5 w-5 text-text-secondary dark:text-zinc-500" />
                            <div>
                                <p className="text-xs text-text-secondary dark:text-zinc-500 font-bold uppercase">Fecha y Hora</p>
                                <p className="text-sm font-semibold text-text-primary dark:text-zinc-200 capitalize">{formattedDate} - {formattedTime}</p>
                            </div>
                        </div>
                    </div>

                    {/* Amount Input Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-bold text-text-secondary dark:text-zinc-400 uppercase">Monto Inicial</label>
                            <div className="flex bg-background dark:bg-zinc-900 rounded-lg p-1 border border-text-primary/10 dark:border-zinc-700">
                                <button 
                                    onClick={() => setMode('manual')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${mode === 'manual' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary dark:text-zinc-400 hover:text-primary'}`}
                                >
                                    Manual
                                </button>
                                <button 
                                    onClick={() => setMode('calculator')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${mode === 'calculator' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary dark:text-zinc-400 hover:text-primary'}`}
                                >
                                    <CalculatorIcon className="h-3 w-3" /> Asistente
                                </button>
                            </div>
                        </div>

                        {mode === 'manual' ? (
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary dark:text-zinc-500 font-bold text-xl">S/.</span>
                                <input
                                    type="number"
                                    value={montoManual}
                                    onChange={handleManualChange}
                                    placeholder="0.00"
                                    className="w-full bg-background dark:bg-zinc-900 border border-text-primary/10 dark:border-zinc-700 rounded-xl p-4 pl-12 text-3xl font-mono font-bold text-text-primary dark:text-zinc-100 focus:ring-2 focus:ring-primary focus:border-primary transition"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <div className="bg-background dark:bg-zinc-900 rounded-xl border border-text-primary/10 dark:border-zinc-700 overflow-hidden">
                                <div className="p-3 bg-primary/5 border-b border-primary/10 flex justify-between items-center">
                                    <span className="text-xs font-bold text-primary">Calculadora de Efectivo</span>
                                    <span className="font-mono font-bold text-primary">S/.{calculatedTotal.toFixed(2)}</span>
                                </div>
                                <div className="p-2 max-h-48 overflow-y-auto">
                                    <CashDenominationCounter onTotalChange={handleCountChange} initialCounts={counts} />
                                </div>
                            </div>
                        )}

                        {error && <p className="text-danger text-sm font-semibold mt-2 animate-fade-in-up">{error}</p>}
                        
                        {!error && totalToOpen > 0 && totalToOpen < MIN_OPENING_AMOUNT && (
                            <div className="mt-2 flex items-start gap-2 text-warning text-sm bg-warning/10 p-2 rounded-lg">
                                <span className="text-lg">⚠️</span>
                                <p>El monto es menor al mínimo recomendado de S/. {MIN_OPENING_AMOUNT.toFixed(2)}. Asegúrate de tener suficiente sencillo.</p>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-zinc-400 mb-1">Notas / Observaciones (Opcional)</label>
                        <textarea 
                            value={notes} 
                            onChange={(e) => setNotes(e.target.value)} 
                            placeholder="Ej: Se incluye sencillo del día anterior..."
                            rows={2}
                            className="w-full bg-background dark:bg-zinc-900 border border-text-primary/10 dark:border-zinc-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-2 border-t border-text-primary/5 dark:border-zinc-700 bg-background dark:bg-zinc-900/30">
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={onClose} className="w-full bg-text-primary/10 dark:bg-zinc-700 hover:bg-text-primary/20 dark:hover:bg-zinc-600 text-text-primary dark:text-zinc-200 font-bold py-3.5 px-4 rounded-xl transition-colors active:scale-95">
                            Cancelar
                        </button>
                        <button onClick={handleSubmit} className="w-full bg-success hover:brightness-110 text-white font-bold py-3.5 px-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-success/20 flex items-center justify-center gap-2">
                            <CheckCircleIcon className="h-5 w-5" />
                            Abrir Caja
                        </button>
                    </div>
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
            <div className="bg-surface dark:bg-[#34424D] rounded-2xl shadow-xl p-6 max-w-sm w-full animate-fade-in-scale">
                 <h3 className="text-2xl font-heading font-bold text-text-primary dark:text-white text-center mb-1">
                    {isIngreso ? 'Añadir Efectivo' : 'Retirar Efectivo'}
                </h3>
                <p className="text-text-secondary dark:text-light-silver mb-6 text-center text-sm">
                    {isIngreso ? 'Registra un ingreso de dinero a la caja.' : 'Registra un gasto o retiro de dinero.'}
                </p>
                <div className="space-y-4">
                     <div>
                        <label className="font-semibold text-text-secondary dark:text-light-silver text-sm">Monto</label>
                        <input type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" className="bg-background dark:bg-[#45535D] border border-text-primary/10 dark:border-[#56656E] rounded-lg p-3 w-full text-text-primary dark:text-ivory-cream placeholder-text-secondary/70 dark:placeholder-light-silver focus:ring-2 focus:ring-primary focus:border-primary transition text-lg font-mono" autoFocus />
                    </div>
                     <div>
                        <label className="font-semibold text-text-secondary dark:text-light-silver text-sm">Descripción</label>
                        <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder={isIngreso ? 'Ej: Sencillo para caja' : 'Ej: Compra de insumos'} className="bg-background dark:bg-[#45535D] border border-text-primary/10 dark:border-[#56656E] rounded-lg p-3 w-full text-text-primary dark:text-ivory-cream placeholder-text-secondary/70 dark:placeholder-light-silver focus:ring-2 focus:ring-primary focus:border-primary transition" />
                    </div>
                </div>

                {error && <p className="text-danger text-xs mt-2 text-center">{error}</p>}
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <button onClick={onClose} className="bg-text-primary/10 dark:bg-[#45535D] hover:bg-text-primary/20 dark:hover:bg-[#56656E] text-text-primary dark:text-ivory-cream font-bold py-3 px-4 rounded-lg transition-colors active:scale-95">Cancelar</button>
                    <button onClick={handleSubmit} className={`${isIngreso ? 'bg-success hover:brightness-110' : 'bg-warning hover:brightness-110'} text-white font-bold py-3 px-4 rounded-lg transition-all active:scale-95`}>Confirmar</button>
                </div>
            </div>
        </div>
    );
};

const CajaView: React.FC<CajaViewProps> = ({ orders, retiroOrdersToPay, paidOrders }) => {
    const { state, dispatch } = useAppContext();
    const { cajaSession } = state;
    
    const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
    const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
    const [movimientoModal, setMovimientoModal] = useState<'ingreso' | 'egreso' | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    const onInitiatePayment = (order: Pedido) => dispatch({ type: 'INITIATE_PAYMENT', payload: order });
    const onOpenCaja = (saldo: number) => dispatch({ type: 'OPEN_CAJA', payload: saldo });
    const onCloseCaja = (efectivo: number) => dispatch({ type: 'CLOSE_CAJA', payload: efectivo });
    const onAddMovimiento = (monto: number, descripcion: string, tipo: 'ingreso' | 'egreso') => dispatch({ type: 'ADD_MOVIMIENTO_CAJA', payload: { monto, descripcion, tipo } });

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
                {isOpeningModalOpen && <AdvancedOpenCajaModal onClose={() => setIsOpeningModalOpen(false)} onOpen={(saldo) => { onOpenCaja(saldo); setIsOpeningModalOpen(false); }} />}
                <div className="h-full flex flex-col items-center justify-center text-center bg-surface dark:bg-[#34424D] rounded-2xl shadow-lg p-8">
                    <h1 className="text-3xl font-heading font-bold text-text-primary dark:text-ivory-cream">Caja Cerrada</h1>
                    <p className="text-text-secondary dark:text-light-silver mt-2 mb-6 max-w-sm">Para empezar a registrar ventas, necesitas abrir la caja con el saldo inicial del día.</p>
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
                <div className="lg:col-span-2 bg-surface dark:bg-[#34424D] rounded-2xl shadow-lg p-6 flex flex-col border border-text-primary/5 dark:border-[#45535D]">
                     <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-ivory-cream mb-4">Cuentas por Cobrar</h2>
                     <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                        <div>
                            <h3 className="text-lg font-semibold text-text-secondary dark:text-light-silver mb-2">Salón ({cuentasPorCobrarSalon.length})</h3>
                            {cuentasPorCobrarSalon.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {cuentasPorCobrarSalon.map(order => (
                                        <div key={order.id} className="bg-background dark:bg-gunmetal/50 p-4 rounded-xl border border-text-primary/5 dark:border-[#45535D] flex flex-col">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-lg text-text-primary dark:text-ivory-cream">Mesa {order.cliente.mesa}</h3>
                                                    <p className="text-xs font-mono text-text-secondary dark:text-light-silver/50">{order.id}</p>
                                                </div>
                                                <p className="font-mono text-xl font-semibold text-text-primary dark:text-ivory-cream">S/.{order.total.toFixed(2)}</p>
                                            </div>
                                            <ul className="text-sm space-y-1 my-2 flex-grow">
                                                {order.productos.map(p => <li key={p.id + p.nombre} className="text-text-secondary dark:text-light-silver">{p.cantidad}x {p.nombre}</li>)}
                                            </ul>
                                            <button onClick={() => onInitiatePayment(order)} className="w-full mt-3 bg-primary text-white font-bold py-2.5 rounded-lg shadow-md hover:bg-primary-dark transition-transform hover:-translate-y-0.5 active:scale-95">
                                                Registrar Pago
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-text-secondary dark:text-light-silver/50 text-sm">No hay cuentas de salón pendientes.</p>}
                        </div>
                        <div className="border-t border-text-primary/10 dark:border-[#45535D] my-4"></div>
                        <div>
                            <h3 className="text-lg font-semibold text-text-secondary dark:text-light-silver mb-2">Retiro en Tienda ({retiroOrdersToPay.length})</h3>
                             {retiroOrdersToPay.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {retiroOrdersToPay.map(order => (
                                        <div key={order.id} className="bg-background dark:bg-gunmetal/50 p-4 rounded-xl border border-text-primary/5 dark:border-[#45535D] flex flex-col">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-lg text-text-primary dark:text-ivory-cream">{order.cliente.nombre}</h3>
                                                    <p className="text-xs font-mono text-text-secondary dark:text-light-silver/50">{order.id}</p>
                                                </div>
                                                <p className="font-mono text-xl font-semibold text-text-primary dark:text-ivory-cream">S/.{order.total.toFixed(2)}</p>
                                            </div>
                                            <ul className="text-sm space-y-1 my-2 flex-grow">
                                                 {order.productos.map(p => <li key={p.id + p.nombre} className="text-text-secondary dark:text-light-silver">{p.cantidad}x {p.nombre}</li>)}
                                            </ul>
                                            <button onClick={() => onInitiatePayment(order)} className="w-full mt-3 bg-primary text-white font-bold py-2.5 rounded-lg shadow-md hover:bg-primary-dark transition-transform hover:-translate-y-0.5 active:scale-95">
                                                Registrar Pago
                                            </button>
                                        </div>
                                    ))}
                                </div>
                             ) : <p className="text-text-secondary dark:text-light-silver/50 text-sm">No hay pedidos de retiro pendientes de pago.</p>}
                        </div>
                         {cuentasPorCobrarSalon.length === 0 && retiroOrdersToPay.length === 0 && (
                            <div className="md:col-span-2 h-full flex flex-col items-center justify-center text-center text-text-secondary/60 dark:text-light-silver/50">
                                <CheckCircleIcon className="h-20 w-20 mb-4" />
                                <p className="text-lg font-semibold">¡Todo al día!</p>
                                <p>No hay cuentas pendientes de cobro.</p>
                            </div>
                         )}
                     </div>
                </div>
                <div className="lg:col-span-1 bg-surface dark:bg-[#34424D] rounded-2xl shadow-lg p-6 flex flex-col border border-text-primary/5 dark:border-[#45535D]">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-ivory-cream">Control de Turno</h2>
                        <button
                            onClick={() => setIsHistoryModalOpen(true)}
                            className="flex items-center gap-2 bg-text-primary/10 dark:bg-[#45535D] hover:bg-text-primary/20 dark:hover:bg-[#56656E] text-text-primary dark:text-ivory-cream font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                        >
                            <DocumentMagnifyingGlassIcon className="h-5 w-5"/>
                            <span>Historial</span>
                        </button>
                    </div>
                     <div className="flex-grow flex flex-col">
                        <div className="bg-background dark:bg-gunmetal/50 p-4 rounded-xl space-y-2 mb-4">
                            <div className="flex justify-between items-center text-sm"><span className="text-text-secondary dark:text-light-silver">Saldo Inicial</span> <span className="font-mono text-text-primary dark:text-ivory-cream">S/.{cajaSession.saldoInicial.toFixed(2)}</span></div>
                            <div className="flex justify-between items-center text-sm"><span className="text-text-secondary dark:text-light-silver">Ventas en Efectivo</span> <span className="font-mono text-success dark:text-green-400">+ S/.{(cajaSession.ventasPorMetodo.efectivo || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between items-center text-sm"><span className="text-text-secondary dark:text-light-silver">Otros Ingresos</span> <span className="font-mono text-success dark:text-green-400">+ S/.{totalIngresos.toFixed(2)}</span></div>
                            <div className="flex justify-between items-center text-sm"><span className="text-text-secondary dark:text-light-silver">Egresos / Gastos</span> <span className="font-mono text-danger dark:text-red-400">- S/.{totalEgresos.toFixed(2)}</span></div>
                            <div className="border-t border-dashed border-text-primary/20 dark:border-[#56656E] my-2"></div>
                            <div className="flex justify-between items-center text-lg font-bold"><span className="text-text-primary dark:text-ivory-cream">Efectivo Esperado</span> <span className="font-mono text-primary dark:text-orange-400">S/.{cajaSession.totalEfectivoEsperado.toFixed(2)}</span></div>
                        </div>

                         <div className="grid grid-cols-2 gap-3 mb-4">
                             <button onClick={() => setMovimientoModal('ingreso')} className="flex items-center justify-center gap-2 bg-success/10 text-success font-semibold p-2 rounded-lg hover:bg-success/20 transition-colors"><PlusCircleIcon className="h-5 w-5"/> Añadir Efectivo</button>
                             <button onClick={() => setMovimientoModal('egreso')} className="flex items-center justify-center gap-2 bg-warning/10 text-warning font-semibold p-2 rounded-lg hover:bg-warning/20 transition-colors"><MinusCircleIcon className="h-5 w-5"/> Retirar Efectivo</button>
                         </div>
                         
                         <div className="flex-grow bg-background dark:bg-gunmetal/50 p-2 rounded-xl flex flex-col">
                            <h3 className="text-sm font-semibold text-text-secondary dark:text-light-silver text-center py-1">Movimientos de Caja</h3>
                            <div className="flex-grow overflow-y-auto space-y-1 text-xs p-1">
                                {(cajaSession.movimientos || []).slice().reverse().map((mov, i) => (
                                    <div key={i} className={`p-2 rounded-md ${mov.tipo === 'ingreso' ? 'bg-success/10' : 'bg-danger/10'}`}>
                                        <div className="flex justify-between font-semibold">
                                             <span className={mov.tipo === 'ingreso' ? 'text-success' : 'text-danger'}>{mov.tipo === 'ingreso' ? 'INGRESO' : 'EGRESO'}</span>
                                             <span className="font-mono">{mov.tipo === 'ingreso' ? '+' : '-'} S/.{mov.monto.toFixed(2)}</span>
                                        </div>
                                        <p className="text-text-secondary dark:text-light-silver">{mov.descripcion}</p>
                                    </div>
                                ))}
                                {(!cajaSession.movimientos || cajaSession.movimientos.length === 0) && <p className="text-center text-text-secondary/50 dark:text-light-silver/50 pt-8">No hay movimientos.</p>}
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
