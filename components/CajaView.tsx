
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Pedido, EstadoPedido, CajaSession, MetodoPago } from '../types';
import { CheckCircleIcon, HomeIcon, TruckIcon, ShoppingBagIcon, CashIcon, CalculatorIcon, PrinterIcon } from './icons';

interface CajaViewProps {
    orders: Pedido[];
    onInitiatePayment: (order: Pedido) => void;
    onGeneratePreBill: (orderId: string) => void;
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

const CloseCajaModal: React.FC<{ onClose: () => void; onCloseCaja: (efectivo: number) => void; session: CajaSession; }> = ({ onClose, onCloseCaja, session }) => {
    const [efectivoContado, setEfectivoContado] = useState('');
    const [error, setError] = useState('');
    const [showResult, setShowResult] = useState(false);

    const handleSubmit = () => {
        const efectivoNum = parseFloat(efectivoContado);
        if (isNaN(efectivoNum) || efectivoNum < 0) {
            setError('Por favor, ingrese un monto válido.');
            return;
        }
        onCloseCaja(efectivoNum);
        setShowResult(true);
    };

    if (showResult && session.estado === 'cerrada') {
        const { diferencia = 0 } = session;
        const resultType = diferencia === 0 ? 'success' : (diferencia > 0 ? 'warning' : 'danger');
        const resultText = diferencia === 0 ? 'Cuadre Perfecto' : (diferencia > 0 ? `Sobrante de S/.${diferencia.toFixed(2)}` : `Faltante de S/.${Math.abs(diferencia).toFixed(2)}`);
        
        return (
             <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4">
                <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-sm w-full text-center animate-fade-in-scale">
                    <CheckCircleIcon className="h-16 w-16 mx-auto text-success mb-4" />
                    <h3 className="text-2xl font-heading font-bold text-text-primary dark:text-white">Caja Cerrada con Éxito</h3>
                     <div className={`mt-4 p-4 rounded-lg bg-${resultType}/10 text-${resultType}`}>
                        <p className="font-bold text-lg">{resultText}</p>
                    </div>
                    <button onClick={onClose} className="mt-6 w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-all active:scale-95">Finalizar</button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4">
            <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-md w-full animate-fade-in-scale">
                <h3 className="text-2xl font-heading font-bold text-text-primary dark:text-white text-center mb-4">Arqueo y Cierre de Caja</h3>
                <div className="bg-background dark:bg-slate-900/50 p-4 rounded-lg space-y-2 mb-4">
                    <div className="flex justify-between items-center text-text-secondary dark:text-slate-400"><span>Total Ventas del Turno:</span> <span className="font-mono font-semibold text-text-primary dark:text-slate-200">S/.{session.totalVentas.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center text-text-secondary dark:text-slate-400"><span>Ventas en Efectivo:</span> <span className="font-mono font-semibold text-text-primary dark:text-slate-200">S/.{(session.ventasPorMetodo.efectivo || 0).toFixed(2)}</span></div>
                    <div className="flex justify-between items-center font-bold text-lg text-text-primary dark:text-slate-100 pt-2 border-t border-text-primary/10 dark:border-slate-700"><span>Efectivo Esperado en Caja:</span> <span className="font-mono text-primary">S/.{session.totalEfectivoEsperado.toFixed(2)}</span></div>
                </div>
                <div>
                    <label htmlFor="efectivo-contado" className="block font-bold text-text-primary dark:text-slate-200 mb-2">Monto Contado en Efectivo</label>
                    <input
                        id="efectivo-contado"
                        type="number"
                        value={efectivoContado}
                        onChange={(e) => { setEfectivoContado(e.target.value); setError(''); }}
                        placeholder="Ej: 1250.50"
                        className="bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-lg p-3 w-full text-center text-text-primary dark:text-slate-100 placeholder-text-secondary/70 dark:placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary transition text-2xl font-mono"
                        autoFocus
                    />
                     {error && <p className="text-danger text-xs mt-1 text-center">{error}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <button onClick={onClose} className="bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-3 px-4 rounded-lg transition-colors active:scale-95">Cancelar</button>
                    <button onClick={handleSubmit} className="bg-danger hover:brightness-110 text-white font-bold py-3 px-4 rounded-lg transition-all active:scale-95">Cerrar Caja</button>
                </div>
            </div>
        </div>
    );
};

const CajaView: React.FC<CajaViewProps> = ({ orders, onInitiatePayment, onGeneratePreBill, cajaSession, onOpenCaja, onCloseCaja }) => {
    const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
    const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
    const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const cuentasPorCobrar = useMemo(() => orders.filter(o => o.estado === 'cuenta solicitada'), [orders]);

    useEffect(() => {
        if(cuentasPorCobrar.length > 0 && !cuentasPorCobrar.find(o => o.id === selectedOrder?.id)){
            setSelectedOrder(cuentasPorCobrar[0]);
        } else if (cuentasPorCobrar.length === 0) {
            setSelectedOrder(null);
        }
    }, [cuentasPorCobrar, selectedOrder]);

    const handlePrintReport = () => {
        const printableContent = printRef.current;
        if (printableContent) {
            const printWindow = window.open('', '', 'height=600,width=800');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Informe de Caja</title>');
                printWindow.document.write('<style>body { font-family: sans-serif; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; } th { background-color: #f2f2f2; }</style>');
                printWindow.document.write('</head><body>');
                printWindow.document.write(printableContent.innerHTML);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.print();
            }
        }
    };

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

    const metodos: MetodoPago[] = ['efectivo', 'tarjeta', 'yape/plin', 'online'];

    return (
        <>
            {isClosingModalOpen && <CloseCajaModal onClose={() => setIsClosingModalOpen(false)} onCloseCaja={onCloseCaja} session={cajaSession} />}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                <div className="lg:col-span-1 bg-surface dark:bg-slate-800 rounded-2xl shadow-lg p-6 flex flex-col border border-text-primary/5 dark:border-slate-700">
                    <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-slate-100 mb-4">Resumen de Caja</h2>
                    <div className="space-y-3">
                         <div className="flex justify-between items-center bg-background dark:bg-slate-900/50 p-3 rounded-lg">
                            <span className="text-text-secondary dark:text-slate-400 font-semibold">Saldo Inicial</span>
                            <span className="font-mono text-lg font-bold text-text-primary dark:text-slate-200">S/.{cajaSession.saldoInicial.toFixed(2)}</span>
                        </div>
                        {metodos.map(metodo => (
                            <div key={metodo} className="flex justify-between items-center bg-background dark:bg-slate-900/50 p-3 rounded-lg">
                                <span className="text-text-secondary dark:text-slate-400 font-semibold capitalize">{metodo.replace('yape/plin', 'Yape/Plin')}</span>
                                <span className="font-mono text-lg font-bold text-text-primary dark:text-slate-200">S/.{(cajaSession.ventasPorMetodo[metodo] || 0).toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between items-center bg-primary/10 p-4 rounded-lg mt-4">
                            <span className="text-primary font-bold text-lg">Total Efectivo en Caja</span>
                            <span className="font-mono text-2xl font-extrabold text-primary">S/.{cajaSession.totalEfectivoEsperado.toFixed(2)}</span>
                        </div>
                    </div>
                     <div ref={printRef} className="hidden">
                        <h2>Informe de Ventas del Día</h2>
                        <p><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p>
                        <p><strong>Saldo Inicial:</strong> S/.{cajaSession.saldoInicial.toFixed(2)}</p>
                        <hr/>
                        <h3>Ventas por Método de Pago</h3>
                        <table>
                            <thead><tr><th>Método</th><th>Total</th></tr></thead>
                            <tbody>
                            {metodos.map(metodo => (
                                <tr key={metodo}>
                                    <td className="capitalize">{metodo.replace('yape/plin', 'Yape/Plin')}</td>
                                    <td>S/.{(cajaSession.ventasPorMetodo[metodo] || 0).toFixed(2)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        <hr/>
                        <p><strong>Total Ventas:</strong> S/.{cajaSession.totalVentas.toFixed(2)}</p>
                        <p><strong>Total Efectivo Esperado:</strong> S/.{cajaSession.totalEfectivoEsperado.toFixed(2)}</p>
                    </div>
                    <div className="mt-auto pt-6 space-y-3">
                        <button onClick={handlePrintReport} className="w-full flex items-center justify-center gap-2 bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-3 px-4 rounded-xl transition-all active:scale-95">
                            <PrinterIcon className="h-5 w-5"/> Imprimir Informe del Día
                        </button>
                        <button onClick={() => setIsClosingModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-danger hover:brightness-110 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-95">
                            <CalculatorIcon className="h-5 w-5"/> Arqueo y Cierre de Caja
                        </button>
                    </div>
                </div>
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
             </div>
        </>
    );
};

export default CajaView;
