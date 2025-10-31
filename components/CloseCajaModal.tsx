

import React, { useState, useRef, useEffect } from 'react';
import type { CajaSession, MetodoPago, MovimientoCaja } from '../types';
import { CheckCircleIcon, PrinterIcon, WhatsAppIcon, InformationCircleIcon } from './icons';

interface CloseCajaModalProps {
    onClose: () => void;
    onCloseCaja: (efectivoContado: number) => void;
    session: CajaSession;
}

const OWNER_WHATSAPP_NUMBER = '51987654321'; // Reemplazar con el número real del dueño

const CloseCajaModal: React.FC<CloseCajaModalProps> = ({ onClose, onCloseCaja, session }) => {
    const [efectivoContado, setEfectivoContado] = useState('');
    const [error, setError] = useState('');
    const [step, setStep] = useState<'counting' | 'result'>('counting');
    const printRef = useRef<HTMLDivElement>(null);

    const handleSubmit = () => {
        const efectivoNum = parseFloat(efectivoContado);
        if (isNaN(efectivoNum) || efectivoNum < 0) {
            setError('Por favor, ingrese un monto válido.');
            return;
        }
        onCloseCaja(efectivoNum);
        setStep('result');
    };
    
    useEffect(() => {
        if (session.estado === 'cerrada' && step === 'counting') {
             setStep('result');
        }
    }, [session.estado, step]);

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
            // FIX: Explicitly cast `monto` to a number. `Object.entries` can sometimes infer value types as `unknown`.
            // Corrected a runtime error where `Number(undefined) || 0` would result in `NaN`.
            message += `- ${metodo.charAt(0).toUpperCase() + metodo.slice(1)}: S/.${(Number(monto || 0)).toFixed(2)}\n`;
        });
        message += `\n*Movimientos de Caja:*\n`;
        movimientos.forEach(mov => {
             message += `- ${mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}: S/.${mov.monto.toFixed(2)} (${mov.descripcion})\n`;
        });
        message += `\n*Resumen de Efectivo:*\n`;
        message += `Saldo Inicial: S/.${session.saldoInicial.toFixed(2)}\n`;
        message += `Efectivo Esperado: S/.${session.totalEfectivoEsperado.toFixed(2)}\n`;
        message += `Efectivo Contado: S/.${(session.efectivoContadoAlCierre || 0).toFixed(2)}\n`;


        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    };

    const metodos: MetodoPago[] = ['efectivo', 'tarjeta', 'yape', 'plin', 'online'];

    if (step === 'result' && session.estado === 'cerrada') {
        const { diferencia = 0 } = session;
        const resultType = diferencia === 0 ? 'success' : (diferencia > 0 ? 'warning' : 'danger');
        const resultText = diferencia === 0 ? 'Cuadre Perfecto' : (diferencia > 0 ? `Sobrante de S/.${diferencia.toFixed(2)}` : `Faltante de S/.${Math.abs(diferencia).toFixed(2)}`);
        const totalIngresos = (session.movimientos || []).filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0);
        const totalEgresos = (session.movimientos || []).filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0);

        return (
             <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4 printable-modal">
                <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center animate-fade-in-scale">
                    <CheckCircleIcon className="h-16 w-16 mx-auto text-success mb-4" />
                    <h3 className="text-2xl font-heading font-bold text-text-primary dark:text-white">Caja Cerrada con Éxito</h3>
                     <div className={`mt-4 mb-6 p-4 rounded-lg bg-${resultType}/10 text-${resultType}`}>
                        <p className="font-bold text-lg">{resultText}</p>
                    </div>
                    
                    <div ref={printRef} className="text-left text-sm space-y-2 printable-modal-content">
                        <p className="text-center font-bold text-lg mb-4">Resumen del Turno</p>
                        <div className="flex justify-between"><span>Venta Total:</span><span className="font-bold">S/.{session.totalVentas.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Ganancia Estimada:</span><span className="font-bold">S/.{(session.gananciaTotal || 0).toFixed(2)}</span></div>
                        <hr className="my-2 border-dashed border-text-primary/10 dark:border-slate-600"/>
                        <p className="font-semibold">Desglose de Pagos:</p>
                        {metodos.map(metodo => ( session.ventasPorMetodo[metodo] > 0 &&
                            <div key={metodo} className="flex justify-between text-text-secondary dark:text-slate-400 pl-2">
                                <span className="capitalize">{metodo}:</span>
                                <span>S/.{(session.ventasPorMetodo[metodo] || 0).toFixed(2)}</span>
                            </div>
                        ))}
                         <hr className="my-2 border-dashed border-text-primary/10 dark:border-slate-600"/>
                         <p className="font-semibold">Resumen de Efectivo:</p>
                        <div className="flex justify-between pl-2"><span>Saldo Inicial:</span><span>S/.{session.saldoInicial.toFixed(2)}</span></div>
                        <div className="flex justify-between pl-2"><span>Ventas Efectivo:</span><span>S/.{(session.ventasPorMetodo.efectivo || 0).toFixed(2)}</span></div>
                        <div className="flex justify-between pl-2"><span>Otros Ingresos:</span><span>S/.{totalIngresos.toFixed(2)}</span></div>
                        <div className="flex justify-between pl-2"><span>Egresos:</span><span>- S/.{totalEgresos.toFixed(2)}</span></div>
                        <div className="flex justify-between font-semibold mt-1"><span>Efectivo Esperado:</span><span>S/.{session.totalEfectivoEsperado.toFixed(2)}</span></div>
                        <div className="flex justify-between font-semibold"><span>Efectivo Contado:</span><span>S/.{(session.efectivoContadoAlCierre || 0).toFixed(2)}</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6 no-print">
                        <button onClick={handlePrint} className="w-full bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-3 px-4 rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2">
                            <PrinterIcon className="h-5 w-5"/> Imprimir
                        </button>
                         <button onClick={handleSendWhatsApp} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                            <WhatsAppIcon className="h-5 w-5"/> Enviar Reporte
                        </button>
                    </div>
                    <button onClick={onClose} className="mt-3 w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-all active:scale-95 no-print">Finalizar</button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4">
            <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-lg w-full animate-fade-in-scale">
                <h3 className="text-2xl font-heading font-bold text-text-primary dark:text-white text-center mb-6">Arqueo y Cierre de Caja</h3>
                
                <div className="bg-amber-500/10 dark:bg-amber-500/20 p-4 rounded-xl text-amber-800 dark:text-amber-300 flex items-start gap-3 mb-6">
                    <InformationCircleIcon className="h-6 w-6 flex-shrink-0 mt-0.5"/>
                    <p className="text-sm"><span className="font-bold">Arqueo a Ciegas:</span> Cuenta todo el dinero en efectivo de la caja e ingresa el monto total. El sistema te mostrará el resultado después de confirmar.</p>
                </div>
                
                <div>
                    <label htmlFor="efectivo-contado" className="block font-bold text-text-primary dark:text-slate-200 mb-2 text-lg">Monto Contado en Efectivo</label>
                    <input
                        id="efectivo-contado"
                        type="number"
                        value={efectivoContado}
                        onChange={(e) => { setEfectivoContado(e.target.value); setError(''); }}
                        placeholder="Ej: 1250.50"
                        className="bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-lg p-3 w-full text-center text-text-primary dark:text-slate-100 placeholder-text-secondary/70 dark:placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary transition text-3xl font-mono"
                        autoFocus
                    />
                     {error && <p className="text-danger text-xs mt-1 text-center">{error}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-8">
                    <button onClick={onClose} className="bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-3 px-4 rounded-lg transition-colors active:scale-95">Cancelar</button>
                    <button onClick={handleSubmit} className="bg-danger hover:brightness-110 text-white font-bold py-3 px-4 rounded-lg transition-all active:scale-95">Confirmar y Cerrar Caja</button>
                </div>
            </div>
        </div>
    );
};

export default CloseCajaModal;