
import React, { useState, useRef, useEffect } from 'react';
import type { CajaSession, MetodoPago, MovimientoCaja } from '../types';
import { CheckCircleIcon, PrinterIcon, WhatsAppIcon, InformationCircleIcon, CalculatorIcon, ExclamationTriangleIcon, ArrowDownIcon, ArrowUpIcon } from './icons';
import CashDenominationCounter, { DenominationCounts } from './CashDenominationCounter';

interface CloseCajaModalProps {
    onClose: () => void;
    onCloseCaja: (efectivoContado: number) => void;
    session: CajaSession;
}

const OWNER_WHATSAPP_NUMBER = '51987654321'; // Reemplazar con el número real del dueño

const CloseCajaModal: React.FC<CloseCajaModalProps> = ({ onClose, onCloseCaja, session }) => {
    const [step, setStep] = useState<'count' | 'review' | 'success'>('count');
    const [efectivoContado, setEfectivoContado] = useState(0);
    const [denominationCounts, setDenominationCounts] = useState<DenominationCounts>({});
    const [justification, setJustification] = useState('');
    const printRef = useRef<HTMLDivElement>(null);

    // Si la sesión ya está cerrada al abrir el modal, ir directo a éxito/resumen
    useEffect(() => {
        if (session.estado === 'cerrada') {
            setStep('success');
        }
    }, [session.estado]);

    const handleCountChange = (total: number, counts: DenominationCounts) => {
        setEfectivoContado(total);
        setDenominationCounts(counts);
    };

    const handleConfirmCount = () => {
        setStep('review');
    };

    const handleFinalizeClose = () => {
        onCloseCaja(efectivoContado);
        setStep('success');
    };

    const handlePrint = () => {
        const handleAfterPrint = () => {
            document.body.classList.remove('uchu-printing');
            window.removeEventListener('afterprint', handleAfterPrint);
        };
        window.addEventListener('afterprint', handleAfterPrint);
        document.body.classList.add('uchu-printing');
        window.print();
    };
    
    const handleSendWhatsApp = () => {
        const { diferencia = 0, totalVentas = 0, gananciaTotal = 0, movimientos = [] } = session;
        const resultText = diferencia === 0 ? 'Cuadre Perfecto' : (diferencia > 0 ? `Sobrante: S/.${diferencia.toFixed(2)}` : `Faltante: S/.${Math.abs(diferencia).toFixed(2)}`);

        let message = `*Resumen de Cierre de Caja - ${new Date().toLocaleString()}*\n\n`;
        message += `*Venta Total:* S/.${totalVentas.toFixed(2)}\n`;
        message += `*Ganancia Estimada:* S/.${(gananciaTotal || 0).toFixed(2)}\n`;
        message += `*Resultado del Arqueo:* ${resultText}\n\n`;
        message += `*Desglose de Pagos:*\n`;
        Object.entries(session.ventasPorMetodo).forEach(([metodo, monto]) => {
            message += `- ${metodo.charAt(0).toUpperCase() + metodo.slice(1)}: S/.${(Number(monto) || 0).toFixed(2)}\n`;
        });
        message += `\n*Movimientos de Caja:*\n`;
        movimientos.forEach(mov => {
             message += `- ${mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}: S/.${mov.monto.toFixed(2)} (${mov.descripcion})\n`;
        });
        message += `\n*Resumen de Efectivo:*\n`;
        message += `Saldo Inicial: S/.${session.saldoInicial.toFixed(2)}\n`;
        message += `Efectivo Esperado: S/.${session.totalEfectivoEsperado.toFixed(2)}\n`;
        message += `Efectivo Contado: S/.${(session.efectivoContadoAlCierre || efectivoContado).toFixed(2)}\n`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    };

    const metodos: MetodoPago[] = ['efectivo', 'tarjeta', 'yape', 'plin', 'mercadopago', 'online'];

    // --- RENDER STEPS ---

    const renderCountStep = () => (
        <div className="flex flex-col h-full animate-fade-in-scale">
            <h3 className="text-xl font-heading font-bold text-text-primary dark:text-zinc-100 text-center mb-2">Arqueo de Caja</h3>
            <p className="text-sm text-text-secondary dark:text-zinc-400 text-center mb-4">Ingresa la cantidad de billetes y monedas en caja.</p>
            
            <div className="flex-grow overflow-hidden bg-background dark:bg-zinc-900/50 p-4 rounded-xl border border-text-primary/5 dark:border-zinc-700">
                <CashDenominationCounter onTotalChange={handleCountChange} />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6 pt-2 border-t border-text-primary/10 dark:border-zinc-700">
                <button onClick={onClose} className="bg-text-primary/10 dark:bg-zinc-700 hover:bg-text-primary/20 dark:hover:bg-zinc-600 text-text-primary dark:text-zinc-200 font-bold py-3 px-4 rounded-lg transition-colors active:scale-95">
                    Cancelar
                </button>
                <button onClick={handleConfirmCount} className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-all active:scale-95 shadow-md">
                    Verificar Diferencia
                </button>
            </div>
        </div>
    );

    const renderReviewStep = () => {
        const expected = session.totalEfectivoEsperado;
        const difference = efectivoContado - expected;
        const isPerfect = Math.abs(difference) < 0.1;
        const isSurplus = difference > 0;
        
        return (
            <div className="flex flex-col h-full animate-fade-in-right">
                <h3 className="text-xl font-heading font-bold text-text-primary dark:text-zinc-100 text-center mb-6">Revisión de Cierre</h3>
                
                <div className="space-y-4">
                    <div className="bg-background dark:bg-zinc-900/50 p-4 rounded-xl space-y-2 border border-text-primary/5 dark:border-zinc-700">
                        <div className="flex justify-between items-center">
                            <span className="text-text-secondary dark:text-zinc-400">Efectivo Esperado (Sistema)</span>
                            <span className="font-mono font-bold text-lg dark:text-zinc-200">S/.{expected.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-text-secondary dark:text-zinc-400">Efectivo Contado (Físico)</span>
                            <span className="font-mono font-bold text-lg dark:text-zinc-200">S/.{efectivoContado.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-dashed border-text-primary/20 dark:border-zinc-600 my-2"></div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-text-primary dark:text-zinc-100">Diferencia</span>
                            <span className={`font-mono font-extrabold text-2xl ${isPerfect ? 'text-success' : (isSurplus ? 'text-warning' : 'text-danger')}`}>
                                {difference > 0 ? '+' : ''}S/.{difference.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {!isPerfect && (
                        <div className={`p-4 rounded-xl flex items-start gap-3 ${isSurplus ? 'bg-warning/10 text-amber-800 dark:text-amber-300' : 'bg-danger/10 text-red-800 dark:text-red-300'}`}>
                            <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-sm mb-1">{isSurplus ? '¡Sobra dinero!' : '¡Falta dinero!'}</p>
                                <p className="text-xs opacity-90">
                                    {isSurplus 
                                        ? 'Verifica si no registraste algún ingreso extra o propina.' 
                                        : 'Verifica si olvidaste registrar algún gasto o dar mal un vuelto.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {!isPerfect && (
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-zinc-400 mb-1">Observación / Justificación (Opcional)</label>
                            <textarea 
                                value={justification} 
                                onChange={(e) => setJustification(e.target.value)}
                                placeholder="Ej: Error en vuelto mesa 5..."
                                className="w-full bg-surface dark:bg-zinc-700/50 border border-text-primary/10 dark:border-zinc-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary transition"
                                rows={2}
                            />
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-6 grid grid-cols-2 gap-3">
                    <button onClick={() => setStep('count')} className="bg-text-primary/10 dark:bg-zinc-700 hover:bg-text-primary/20 dark:hover:bg-zinc-600 text-text-primary dark:text-zinc-200 font-bold py-3 px-4 rounded-lg transition-colors active:scale-95">
                        <ArrowDownIcon className="inline-block h-4 w-4 mr-1 transform rotate-90" /> Recontar
                    </button>
                    <button onClick={handleFinalizeClose} className="bg-danger hover:brightness-110 text-white font-bold py-3 px-4 rounded-lg transition-all active:scale-95 shadow-lg shadow-danger/20">
                        Confirmar Cierre
                    </button>
                </div>
            </div>
        );
    };

    const renderSuccessStep = () => {
        const { diferencia = 0 } = session;
        const resultType = Math.abs(diferencia) < 0.1 ? 'success' : (diferencia > 0 ? 'warning' : 'danger');
        const resultText = Math.abs(diferencia) < 0.1 ? 'Cuadre Perfecto' : (diferencia > 0 ? `Sobrante: S/.${diferencia.toFixed(2)}` : `Faltante: S/.${Math.abs(diferencia).toFixed(2)}`);
        const totalIngresos = (session.movimientos || []).filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0);
        const totalEgresos = (session.movimientos || []).filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0);

        return (
            <div className="flex flex-col h-full animate-fade-in-scale">
                <div className="text-center mb-4">
                    <div className="bg-success/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircleIcon className="h-10 w-10 text-success" />
                    </div>
                    <h3 className="text-2xl font-heading font-bold text-text-primary dark:text-zinc-100">¡Caja Cerrada!</h3>
                    <div className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-bold bg-${resultType}/10 text-${resultType}`}>
                        {resultText}
                    </div>
                </div>

                <div ref={printRef} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 text-sm space-y-3 flex-grow overflow-y-auto printable-modal-content text-black dark:text-zinc-300">
                    <div className="flex justify-between border-b pb-2 dark:border-zinc-700">
                        <span className="font-bold">Venta Total del Turno</span>
                        <span className="font-bold">S/.{session.totalVentas.toFixed(2)}</span>
                    </div>
                    
                    <div>
                        <p className="font-semibold text-xs text-gray-500 dark:text-zinc-500 uppercase mb-1">Desglose de Ventas</p>
                        {metodos.map(metodo => ( session.ventasPorMetodo[metodo] > 0 &&
                            <div key={metodo} className="flex justify-between pl-2 text-xs">
                                <span className="capitalize">{metodo.replace(/_/g, ' ')}</span>
                                <span>S/.{(session.ventasPorMetodo[metodo] || 0).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t pt-2 dark:border-zinc-700">
                        <p className="font-semibold text-xs text-gray-500 dark:text-zinc-500 uppercase mb-1">Balance de Efectivo</p>
                        <div className="flex justify-between text-xs"><span>Saldo Inicial</span><span>S/.{session.saldoInicial.toFixed(2)}</span></div>
                        <div className="flex justify-between text-xs"><span>Ventas Efectivo</span><span>S/.{(session.ventasPorMetodo.efectivo || 0).toFixed(2)}</span></div>
                        <div className="flex justify-between text-xs text-success"><span>Ingresos Extra</span><span>+ S/.{totalIngresos.toFixed(2)}</span></div>
                        <div className="flex justify-between text-xs text-danger"><span>Gastos/Retiros</span><span>- S/.{totalEgresos.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold mt-1 pt-1 border-t border-gray-200 dark:border-zinc-700">
                            <span>Efectivo Contado</span>
                            <span>S/.{(session.efectivoContadoAlCierre || efectivoContado).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 no-print">
                    <button onClick={handlePrint} className="bg-text-primary/10 dark:bg-zinc-700 hover:bg-text-primary/20 dark:hover:bg-zinc-600 text-text-primary dark:text-zinc-200 font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm">
                        <PrinterIcon className="h-4 w-4"/> Imprimir
                    </button>
                    <button onClick={handleSendWhatsApp} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm">
                        <WhatsAppIcon className="h-4 w-4"/> WhatsApp
                    </button>
                </div>
                <button onClick={onClose} className="mt-3 w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg no-print">
                    Finalizar y Salir
                </button>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4">
            <div className="bg-surface dark:bg-zinc-800 rounded-2xl shadow-xl p-6 max-w-lg w-full h-[90vh] md:h-auto md:max-h-[90vh] flex flex-col transition-all duration-300">
                {step === 'count' && renderCountStep()}
                {step === 'review' && renderReviewStep()}
                {step === 'success' && renderSuccessStep()}
            </div>
        </div>
    );
};

export default CloseCajaModal;
