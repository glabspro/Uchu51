import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store';
import type { CajaSession, MetodoPago } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ReportesView: React.FC = () => {
    const { state } = useAppContext();
    const { cajaHistory = [] } = state;

    const today = new Date();
    const last7Days = new Date();
    last7Days.setDate(today.getDate() - 6);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [startDate, setStartDate] = useState(last7Days.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    const setDateRange = (start: Date, end: Date) => {
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    const filteredHistory = useMemo(() => {
        if (!cajaHistory || cajaHistory.length === 0) return [];
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return cajaHistory.filter(session => {
            const sessionDate = new Date(session.fechaCierre || '');
            return sessionDate >= start && sessionDate <= end;
        });
    }, [cajaHistory, startDate, endDate]);

    const summary = useMemo(() => {
        const totalVentas = filteredHistory.reduce((sum, s) => sum + s.totalVentas, 0);
        const gananciaTotal = filteredHistory.reduce((sum, s) => sum + (s.gananciaTotal || 0), 0);
        const turnosCount = filteredHistory.length;

        const ventasPorMetodo = filteredHistory.reduce((acc, session) => {
            for (const metodo in session.ventasPorMetodo) {
                acc[metodo as MetodoPago] = (acc[metodo as MetodoPago] || 0) + (session.ventasPorMetodo[metodo as MetodoPago] || 0);
            }
            return acc;
        }, {} as { [key in MetodoPago]?: number });

        const chartData = Object.entries(ventasPorMetodo).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

        return { totalVentas, gananciaTotal, turnosCount, chartData };
    }, [filteredHistory]);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-text-primary dark:text-slate-200">Reportes de Cierre de Caja</h2>
                <div className="flex items-center gap-2">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2 text-sm"/>
                    <span className="text-text-secondary dark:text-slate-400">a</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2 text-sm"/>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
                <button onClick={() => setDateRange(today, today)} className="text-sm font-semibold bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 px-3 py-1 rounded-md transition-colors">Hoy</button>
                <button onClick={() => { const yesterday = new Date(); yesterday.setDate(today.getDate() - 1); setDateRange(yesterday, yesterday); }} className="text-sm font-semibold bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 px-3 py-1 rounded-md transition-colors">Ayer</button>
                <button onClick={() => setDateRange(last7Days, today)} className="text-sm font-semibold bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 px-3 py-1 rounded-md transition-colors">Últimos 7 días</button>
                <button onClick={() => setDateRange(firstDayOfMonth, today)} className="text-sm font-semibold bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 px-3 py-1 rounded-md transition-colors">Este Mes</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-background dark:bg-slate-900/50 p-4 rounded-xl border border-text-primary/5 dark:border-slate-700 text-center">
                    <h3 className="text-sm font-semibold text-text-secondary dark:text-slate-400 uppercase">Ventas Totales</h3>
                    <p className="text-4xl font-heading font-extrabold text-primary dark:text-orange-400 mt-1">S/.{summary.totalVentas.toFixed(2)}</p>
                </div>
                <div className="bg-background dark:bg-slate-900/50 p-4 rounded-xl border border-text-primary/5 dark:border-slate-700 text-center">
                    <h3 className="text-sm font-semibold text-text-secondary dark:text-slate-400 uppercase">Ganancia Estimada</h3>
                    <p className="text-4xl font-heading font-extrabold text-text-primary dark:text-slate-100 mt-1">S/.{summary.gananciaTotal.toFixed(2)}</p>
                </div>
                 <div className="bg-background dark:bg-slate-900/50 p-4 rounded-xl border border-text-primary/5 dark:border-slate-700 text-center">
                    <h3 className="text-sm font-semibold text-text-secondary dark:text-slate-400 uppercase">Turnos Incluidos</h3>
                    <p className="text-4xl font-heading font-extrabold text-text-primary dark:text-slate-100 mt-1">{summary.turnosCount}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-background dark:bg-slate-900/50 p-4 rounded-xl border border-text-primary/5 dark:border-slate-700">
                     <h3 className="font-bold mb-4 text-text-primary dark:text-slate-100">Ventas por Método de Pago</h3>
                     <ResponsiveContainer width="100%" height={300}>
                         <BarChart data={summary.chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                             <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 109, 105, 0.1)" className="dark:stroke-slate-700" />
                             <XAxis type="number" stroke="#A8A29E" />
                             <YAxis type="category" dataKey="name" stroke="#A8A29E" width={80} tick={{fontSize: 12, fill: 'currentColor'}} className="capitalize text-text-secondary dark:text-slate-400" />
                             <Tooltip contentStyle={{ backgroundColor: 'var(--tw-bg-surface, #FFFFFF)', border: '1px solid #e7e5e4', borderRadius: '12px' }} wrapperClassName="dark:!bg-slate-800 dark:!border-slate-600" cursor={{ fill: 'rgba(253, 252, 251, 0.5)', className: 'dark:fill-slate-700/50' }} />
                             <Bar dataKey="value" name="Ventas" fill="#F97316" radius={[0, 4, 4, 0]} />
                         </BarChart>
                     </ResponsiveContainer>
                </div>

                <div className="bg-background dark:bg-slate-900/50 p-4 rounded-xl border border-text-primary/5 dark:border-slate-700 flex flex-col">
                    <h3 className="font-bold mb-4 text-text-primary dark:text-slate-100">Detalle de Sesiones</h3>
                    <div className="flex-grow overflow-y-auto max-h-80 pr-2">
                        <table className="w-full text-sm text-left">
                            <thead className="sticky top-0 bg-background dark:bg-slate-900/50">
                                <tr>
                                    <th className="p-2 font-semibold">Fecha Cierre</th>
                                    <th className="p-2 font-semibold text-right">Total</th>
                                    <th className="p-2 font-semibold text-right">Ganancia</th>
                                    <th className="p-2 font-semibold text-right">Resultado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-text-primary/5 dark:divide-slate-700">
                                {filteredHistory.length > 0 ? filteredHistory.slice().reverse().map(session => (
                                    <tr key={session.id || session.fechaCierre}>
                                        <td className="p-2">{new Date(session.fechaCierre!).toLocaleString('es-PE')}</td>
                                        <td className="p-2 text-right font-mono">S/.{session.totalVentas.toFixed(2)}</td>
                                        <td className="p-2 text-right font-mono">S/.{(session.gananciaTotal || 0).toFixed(2)}</td>
                                        <td className={`p-2 text-right font-mono font-bold ${session.diferencia === 0 ? 'text-text-secondary dark:text-slate-400' : session.diferencia! > 0 ? 'text-warning' : 'text-danger'}`}>
                                            {session.diferencia === 0 ? 'OK' : `${session.diferencia! > 0 ? '+' : ''}${session.diferencia!.toFixed(2)}`}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="text-center p-8 text-text-secondary dark:text-slate-500">No hay datos en el rango seleccionado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportesView;
