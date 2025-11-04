import React, { useState, useMemo } from 'react';
import type { Pedido, Producto, CajaSession, Turno, TipoPedido } from '../types';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { DocumentArrowDownIcon, ChevronDownIcon, ChevronUpIcon, ArrowUpIcon, ArrowDownIcon } from './icons';

interface ReportesViewProps {
    orders: Pedido[];
    products: Producto[];
    cajaHistory: CajaSession[];
}

const KPICard: React.FC<{ title: string; value: string; comparison?: number }> = ({ title, value, comparison }) => (
    <div className="bg-background dark:bg-slate-900/50 p-4 rounded-xl border border-text-primary/5 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-text-secondary dark:text-slate-400 uppercase">{title}</h3>
        <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-heading font-extrabold text-text-primary dark:text-white">{value}</p>
            {comparison !== undefined && !isNaN(comparison) && (
                <div className={`flex items-center text-sm font-bold ${comparison >= 0 ? 'text-success' : 'text-danger'}`}>
                    {comparison >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                    <span>{Math.abs(comparison).toFixed(1)}%</span>
                </div>
            )}
        </div>
    </div>
);

const OrderHistory: React.FC<{ orders: Pedido[] }> = ({ orders }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            if (!searchTerm) return true;
            const lowerSearchTerm = searchTerm.toLowerCase();
            return (
                order.id.toLowerCase().includes(lowerSearchTerm) ||
                order.cliente.nombre.toLowerCase().includes(lowerSearchTerm)
            );
        }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }, [orders, searchTerm]);

    const exportToExcel = () => {
        const dataToExport = filteredOrders.map(order => ({
            'ID Pedido': order.id, 'Fecha': new Date(order.fecha).toLocaleString('es-PE'), 'Cliente': order.cliente.nombre,
            'Teléfono': order.cliente.telefono, 'Tipo': order.tipo, 'Turno': order.turno, 'Total (S/.)': order.total,
            'Productos': order.productos.map(p => `${p.cantidad}x ${p.nombre}`).join('; '),
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transacciones");
        XLSX.writeFile(wb, `reporte_transacciones.xlsx`);
    };

    return (
        <div className="bg-background dark:bg-slate-900/50 p-4 rounded-xl border border-text-primary/5 dark:border-slate-700 flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-text-primary dark:text-slate-100">Transacciones Detalladas</h3>
                 <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-1.5 px-3 rounded-lg transition-colors text-sm">
                    <DocumentArrowDownIcon className="h-4 w-4"/> Exportar
                </button>
            </div>
             <input type="search" placeholder="Buscar por ID o cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-surface dark:bg-slate-700/50 border border-text-primary/10 dark:border-slate-700 rounded-lg p-2 mb-2"/>
            <div className="flex-grow overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-background dark:bg-slate-900/50 sticky top-0 z-10">
                        <tr>
                            <th className="p-2 font-semibold">Fecha</th>
                            <th className="p-2 font-semibold">Pedido</th>
                            <th className="p-2 font-semibold text-right">Total</th>
                            <th className="p-2"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-text-primary/5 dark:divide-slate-700">
                        {filteredOrders.map(order => (
                            <React.Fragment key={order.id}>
                                <tr className="hover:bg-text-primary/5 dark:hover:bg-slate-800">
                                    <td className="p-2 text-text-secondary dark:text-slate-400">{new Date(order.fecha).toLocaleDateString('es-PE')}</td>
                                    <td className="p-2 font-mono text-primary dark:text-orange-400">{order.id}</td>
                                    <td className="p-2 text-right font-mono font-semibold">S/.{order.total.toFixed(2)}</td>
                                    <td className="p-2 text-center">
                                        <button onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)} className="p-1 rounded-full hover:bg-text-primary/10 dark:hover:bg-slate-600">
                                            {expandedOrderId === order.id ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                                        </button>
                                    </td>
                                </tr>
                                {expandedOrderId === order.id && (
                                    <tr className="bg-surface dark:bg-slate-900/30">
                                        <td colSpan={4} className="p-3">
                                            <p><span className="font-semibold">Cliente:</span> {order.cliente.nombre}</p>
                                            <ul className="list-disc list-inside text-xs mt-1">
                                                {order.productos.map((p, i) => <li key={i}>{p.cantidad}x {p.nombre}</li>)}
                                            </ul>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const COLORS = ['#F97316', '#FB923C', '#FDBA74', '#FECACA', '#FDE68A'];

const ReportesView: React.FC<ReportesViewProps> = ({ orders, products, cajaHistory }) => {
    const today = new Date();
    const [startDate, setStartDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
    const [filterTurno, setFilterTurno] = useState<Turno | 'todos'>('todos');
    const [filterTipo, setFilterTipo] = useState<TipoPedido | 'todos'>('todos');
    const [compare, setCompare] = useState(false);
    const [observations, setObservations] = useState('');

    const getFilteredData = (start: string, end: string) => {
        const startDate = new Date(start); startDate.setHours(0,0,0,0);
        const endDate = new Date(end); endDate.setHours(23,59,59,999);
        
        const filteredOrders = orders.filter(o => {
            const orderDate = new Date(o.fecha);
            return orderDate >= startDate && orderDate <= endDate &&
                   (filterTurno === 'todos' || o.turno === filterTurno) &&
                   (filterTipo === 'todos' || o.tipo === filterTipo) &&
                   o.estado === 'pagado';
        });

        const filteredCaja = (cajaHistory || []).filter(c => {
             const closeDate = c.fechaCierre ? new Date(c.fechaCierre) : null;
             return closeDate && closeDate >= startDate && closeDate <= endDate;
        });

        const totalVentas = filteredOrders.reduce((sum, o) => sum + o.total, 0);
        const gananciaTotal = filteredOrders.reduce((sum, o) => sum + (o.gananciaEstimada || 0), 0);
        const ticketPromedio = filteredOrders.length > 0 ? totalVentas / filteredOrders.length : 0;
        const clientesUnicos = new Set(filteredOrders.map(o => o.cliente.telefono)).size;
        const balanceCaja = filteredCaja.reduce((sum, s) => sum + (s.diferencia || 0), 0);

        return { filteredOrders, filteredCaja, totalVentas, gananciaTotal, ticketPromedio, clientesUnicos, balanceCaja };
    };

    const currentPeriodData = useMemo(() => getFilteredData(startDate, endDate), [orders, cajaHistory, startDate, endDate, filterTurno, filterTipo]);
    
    const previousPeriodData = useMemo(() => {
        if (!compare) return null;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = end.getTime() - start.getTime();
        const prevEnd = new Date(start.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - diff);
        return getFilteredData(prevStart.toISOString().split('T')[0], prevEnd.toISOString().split('T')[0]);
    }, [compare, startDate, endDate, orders, cajaHistory, filterTurno, filterTipo]);

    const getComparison = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? Infinity : 0;
        return ((current - previous) / previous) * 100;
    };
    
    // Chart data
    const salesByChannel = useMemo(() => {
        const sales: {[key in TipoPedido]: number} = { delivery: 0, local: 0, retiro: 0 };
        currentPeriodData.filteredOrders.forEach(o => { sales[o.tipo] = (sales[o.tipo] || 0) + o.total; });
        return Object.entries(sales).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
    }, [currentPeriodData.filteredOrders]);

    const salesByCategory = useMemo(() => {
        const sales: {[key: string]: number} = {};
        currentPeriodData.filteredOrders.forEach(o => o.productos.forEach(p => {
            const cat = products.find(prod => prod.id === p.id)?.categoria || 'Otros';
            sales[cat] = (sales[cat] || 0) + (p.cantidad * p.precio);
        }));
        return Object.entries(sales).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [currentPeriodData.filteredOrders, products]);

    const topProducts = useMemo(() => {
        const counts: { [key: string]: number } = {};
        currentPeriodData.filteredOrders.forEach(o => o.productos.forEach(p => {
            counts[p.nombre] = (counts[p.nombre] || 0) + p.cantidad;
        }));
        return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, value]) => ({ name, value }));
    }, [currentPeriodData.filteredOrders]);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-text-primary dark:text-slate-200">Reporte Avanzado de Ventas</h2>

            {/* Filters */}
            <div className="bg-surface dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-text-primary/5 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-semibold">Rango de Fechas</label>
                        <div className="flex items-center gap-2">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2 text-sm"/>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2 text-sm"/>
                        </div>
                    </div>
                     <div>
                        <label className="text-xs font-semibold">Turno</label>
                        <select value={filterTurno} onChange={e => setFilterTurno(e.target.value as any)} className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2 text-sm">
                            <option value="todos">Todos</option><option value="mañana">Mañana</option><option value="tarde">Tarde</option><option value="noche">Noche</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold">Canal de Venta</label>
                         <select value={filterTipo} onChange={e => setFilterTipo(e.target.value as any)} className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2 text-sm">
                            <option value="todos">Todos</option><option value="delivery">Delivery</option><option value="local">Salón</option><option value="retiro">Retiro</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                        <span className="text-sm font-semibold">Comparar con período anterior</span>
                    </label>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <KPICard title="Ventas Totales" value={`S/.${currentPeriodData.totalVentas.toFixed(2)}`} comparison={previousPeriodData ? getComparison(currentPeriodData.totalVentas, previousPeriodData.totalVentas) : undefined} />
                <KPICard title="Ganancia Estimada" value={`S/.${currentPeriodData.gananciaTotal.toFixed(2)}`} comparison={previousPeriodData ? getComparison(currentPeriodData.gananciaTotal, previousPeriodData.gananciaTotal) : undefined} />
                <KPICard title="Ticket Promedio" value={`S/.${currentPeriodData.ticketPromedio.toFixed(2)}`} comparison={previousPeriodData ? getComparison(currentPeriodData.ticketPromedio, previousPeriodData.ticketPromedio) : undefined} />
                <KPICard title="Clientes Únicos" value={`${currentPeriodData.clientesUnicos}`} comparison={previousPeriodData ? getComparison(currentPeriodData.clientesUnicos, previousPeriodData.clientesUnicos) : undefined} />
                <div className={`p-4 rounded-xl border ${currentPeriodData.balanceCaja === 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-danger/10 border-danger/20'}`}>
                    <h3 className="text-sm font-semibold uppercase ${currentPeriodData.balanceCaja === 0 ? 'text-green-800 dark:text-green-300' : 'text-danger'}">Balance de Caja</h3>
                    <p className="text-3xl font-heading font-extrabold mt-1 ${currentPeriodData.balanceCaja === 0 ? 'text-green-900 dark:text-green-200' : 'text-danger'}">S/.{currentPeriodData.balanceCaja.toFixed(2)}</p>
                </div>
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="bg-background dark:bg-slate-900/50 p-4 rounded-xl border border-text-primary/5 dark:border-slate-700">
                    <h3 className="font-bold mb-4">Ventas por Canal</h3>
                     <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={salesByChannel} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} strokeWidth={2} className="stroke-background dark:stroke-slate-900/50">
                                {salesByChannel.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                 <div className="lg:col-span-2 bg-background dark:bg-slate-900/50 p-4 rounded-xl border border-text-primary/5 dark:border-slate-700">
                    <h3 className="font-bold mb-4">Ventas por Categoría</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={salesByCategory} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 109, 105, 0.1)" />
                            <XAxis dataKey="name" tick={{fontSize: 10}} angle={-20} textAnchor="end" height={40} />
                            <YAxis tick={{fontSize: 10}} />
                            <Tooltip />
                            <Bar dataKey="value" name="Venta" fill="#F97316" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <OrderHistory orders={currentPeriodData.filteredOrders} />
                 <div className="space-y-6">
                    <div className="bg-background dark:bg-slate-900/50 p-4 rounded-xl border border-text-primary/5 dark:border-slate-700">
                        <h3 className="font-bold mb-4">Top 5 Productos</h3>
                         <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={topProducts} layout="vertical" margin={{ left: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 109, 105, 0.1)" />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" tick={{fontSize: 12}} width={120} axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="value" name="Cantidad" fill="#FB923C" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: 'currentColor', fontSize: 12, className: 'dark:fill-slate-300' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-background dark:bg-slate-900/50 p-4 rounded-xl border border-text-primary/5 dark:border-slate-700">
                         <h3 className="font-bold mb-2">Observaciones y Conclusiones</h3>
                         <textarea value={observations} onChange={e => setObservations(e.target.value)} rows={3} placeholder="Anota aquí tus análisis y recomendaciones..." className="w-full bg-surface dark:bg-slate-700/50 border border-text-primary/10 dark:border-slate-700 rounded-lg p-2 text-sm"/>
                    </div>
                 </div>
            </div>

        </div>
    );
};

export default ReportesView;