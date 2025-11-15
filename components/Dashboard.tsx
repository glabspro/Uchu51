import React, { useMemo, useState } from 'react';
import type { Pedido, Producto, EstadoPedido, Turno, TipoPedido } from '../types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import {
    ShoppingBagIcon,
    DocumentMagnifyingGlassIcon,
    SearchIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ExclamationTriangleIcon,
    DocumentArrowDownIcon
} from './icons';

interface DashboardProps {
    orders: Pedido[];
    products: Producto[];
}

const MetricCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-surface dark:bg-[#34424D] p-4 rounded-2xl shadow-lg border border-text-primary/5 dark:border-[#45535D]">
        <h3 className="text-sm font-semibold text-text-secondary dark:text-light-silver uppercase tracking-wider">{title}</h3>
        <p className="text-3xl font-heading font-extrabold text-text-primary dark:text-white mt-1">{value}</p>
    </div>
);


const LowStockAlerts: React.FC<{ products: Producto[] }> = ({ products }) => {
    const lowStockProducts = useMemo(() => products.filter(p => p.stock < 10).sort((a, b) => a.stock - b.stock), [products]);

    if (lowStockProducts.length === 0) return null;

    return (
        <div className="bg-surface dark:bg-[#34424D] p-6 rounded-2xl shadow-lg border border-amber-500/30 dark:border-amber-500/50 h-full">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-amber-500/10 p-2 rounded-full">
                    <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="text-lg font-heading font-bold text-amber-600 dark:text-amber-400">Inventario Bajo</h3>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {lowStockProducts.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-background dark:bg-[#45535D]/50 p-2 rounded-lg text-sm">
                        <span className="font-semibold text-text-primary dark:text-ivory-cream">{p.nombre}</span>
                        <span className="font-bold text-danger dark:text-red-400 bg-danger/10 px-2 py-0.5 rounded-full">{p.stock} restantes</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const RecentActivityFeed: React.FC<{ orders: Pedido[] }> = ({ orders }) => {
    const recentOrders = useMemo(() => {
        return [...orders]
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
            .slice(0, 5);
    }, [orders]);

    const getStatusInfo = (status: EstadoPedido) => {
        if (['entregado', 'recogido', 'pagado'].includes(status)) return { color: 'bg-green-500' };
        if (['en preparación', 'en armado', 'listo', 'en camino'].includes(status)) return { color: 'bg-amber-500' };
        if (['cancelado'].includes(status)) return { color: 'bg-danger' };
        return { color: 'bg-blue-500' };
    };

    return (
        <div className="bg-surface dark:bg-[#34424D] p-6 rounded-2xl shadow-lg border border-text-primary/5 dark:border-[#45535D] h-full">
            <h3 className="text-lg font-heading font-bold text-text-primary dark:text-ivory-cream mb-4">Actividad Reciente</h3>
            <div className="space-y-3">
                {recentOrders.length > 0 ? recentOrders.map((order, i) => (
                    <div key={order.id} className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="flex-shrink-0">
                            <span className={`h-2.5 w-2.5 rounded-full ${getStatusInfo(order.estado).color} block`}></span>
                        </div>
                        <div className="flex-grow">
                            <p className="font-semibold text-text-primary dark:text-ivory-cream leading-tight">{order.id} - {order.cliente.nombre}</p>
                            <p className="text-xs text-text-secondary dark:text-light-silver capitalize">{order.tipo} - {new Date(order.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="font-mono font-semibold text-text-primary dark:text-ivory-cream text-right">
                            S/.{order.total.toFixed(2)}
                        </div>
                    </div>
                )) : (
                    <p className="text-sm text-center text-text-secondary dark:text-light-silver/50 py-8">No hay actividad reciente en este período.</p>
                )}
            </div>
        </div>
    );
};

const COLORS = ['#F97316', '#FB923C', '#FDBA74', '#FECACA', '#FDE68A'];

const OrderHistory: React.FC<{ orders: Pedido[] }> = ({ orders }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    const filteredOrders = useMemo(() => {
        return orders
            .filter(order => {
                if (!searchTerm) return true;
                const lowerSearchTerm = searchTerm.toLowerCase();
                const cleanPhoneNumber = order.cliente.telefono.slice(-9); // Get last 9 digits
                return (
                    order.cliente.nombre.toLowerCase().includes(lowerSearchTerm) ||
                    cleanPhoneNumber.includes(lowerSearchTerm)
                );
            })
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }, [orders, searchTerm]);

    const getStatusBadge = (status: EstadoPedido) => {
        let colorClasses = '';
        switch (status) {
            case 'pagado':
            case 'entregado':
            case 'recogido':
                colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
                break;
            case 'cancelado':
                colorClasses = 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
                break;
            case 'en camino':
                colorClasses = 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300';
                break;
            case 'en preparación':
            case 'listo':
                colorClasses = 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300';
                break;
            default:
                colorClasses = 'bg-gray-100 text-gray-800 dark:bg-[#45535D] dark:text-light-silver';
        }
        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${colorClasses}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="bg-surface dark:bg-[#34424D] p-6 rounded-2xl shadow-lg border border-text-primary/5 dark:border-[#45535D]">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <h3 className="text-xl font-heading font-bold text-text-primary dark:text-ivory-cream flex items-center gap-2">
                    <DocumentMagnifyingGlassIcon className="h-6 w-6" />
                    Historial de Pedidos
                </h3>
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary/50 dark:text-light-silver/50" />
                    <input
                        type="search"
                        placeholder="Buscar en esta vista..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-background dark:bg-[#45535D]/50 border border-text-primary/10 dark:border-[#45535D] rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary focus:border-primary transition"
                    />
                </div>
            </div>

            <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm text-left">
                    <thead className="bg-background dark:bg-[#45535D]/50 sticky top-0 z-10">
                        <tr>
                            <th className="p-3 font-semibold">Pedido</th>
                            <th className="p-3 font-semibold">Fecha</th>
                            <th className="p-3 font-semibold">Cliente</th>
                            <th className="p-3 font-semibold text-right">Total</th>
                            <th className="p-3 font-semibold text-center">Estado</th>
                            <th className="p-3 font-semibold"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-text-primary/5 dark:divide-[#45535D]">
                        {filteredOrders.length > 0 ? filteredOrders.map(order => (
                            <React.Fragment key={order.id}>
                                <tr className="hover:bg-background dark:hover:bg-[#45535D]/50">
                                    <td className="p-3 font-mono text-primary dark:text-orange-400">{order.id}</td>
                                    <td className="p-3 text-text-secondary dark:text-light-silver">{new Date(order.fecha).toLocaleString('es-PE')}</td>
                                    <td className="p-3">
                                        <div className="font-medium text-text-primary dark:text-ivory-cream">{order.cliente.nombre}</div>
                                        <div className="text-xs text-text-secondary dark:text-light-silver/50">{order.cliente.telefono.slice(-9)}</div>
                                    </td>
                                    <td className="p-3 text-right font-mono font-semibold text-text-primary dark:text-ivory-cream">S/.{order.total.toFixed(2)}</td>
                                    <td className="p-3 text-center">{getStatusBadge(order.estado)}</td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)} className="p-1 rounded-full hover:bg-text-primary/10 dark:hover:bg-[#56656E]">
                                            {expandedOrderId === order.id ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                                        </button>
                                    </td>
                                </tr>
                                {expandedOrderId === order.id && (
                                    <tr className="bg-background dark:bg-gunmetal/30">
                                        <td colSpan={6} className="p-4">
                                            <div className="animate-fade-in-up">
                                                <h4 className="font-bold mb-2 text-text-primary dark:text-ivory-cream">Detalle del Pedido:</h4>
                                                <ul className="space-y-1 text-xs pl-4 list-disc list-inside">
                                                    {order.productos.map((p, index) => (
                                                        <li key={index} className="text-text-secondary dark:text-light-silver">
                                                            <span className="font-semibold text-text-primary dark:text-ivory-cream/80">{p.cantidad}x {p.nombre}</span> - S/.{(p.cantidad * p.precio).toFixed(2)}
                                                            {p.especificaciones && <span className="italic text-amber-600 dark:text-amber-500"> ({p.especificaciones})</span>}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        )) : (
                            <tr>
                                <td colSpan={6} className="text-center p-8 text-text-secondary dark:text-light-silver/50">
                                    No se encontraron pedidos.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ orders, products }) => {
    const today = new Date();
    const last7Days = new Date(); last7Days.setDate(today.getDate() - 7);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
    const [filterTurno, setFilterTurno] = useState<Turno | 'todos'>('todos');
    const [filterTipo, setFilterTipo] = useState<TipoPedido | 'todos'>('todos');
    
    const setDateRange = (start: Date, end: Date) => {
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    const filteredOrders = useMemo(() => {
        const start = new Date(startDate); start.setHours(0,0,0,0);
        const end = new Date(endDate); end.setHours(23,59,59,999);
        return orders.filter(o => {
            const orderDate = new Date(o.fecha);
            const isInDateRange = orderDate >= start && orderDate <= end;
            const isInTurno = filterTurno === 'todos' || o.turno === filterTurno;
            const isInTipo = filterTipo === 'todos' || o.tipo === filterTipo;
            return isInDateRange && isInTurno && isInTipo;
        });
    }, [orders, startDate, endDate, filterTurno, filterTipo]);
    
    const kpis = useMemo(() => {
        const ventasTotales = filteredOrders.reduce((sum, o) => sum + o.total, 0);
        const gananciaEstimada = filteredOrders.reduce((sum, o) => sum + (o.gananciaEstimada || 0), 0);
        const pedidosTotales = filteredOrders.length;
        const ticketPromedio = pedidosTotales > 0 ? ventasTotales / pedidosTotales : 0;
        return {
            ventasTotales: `S/.${ventasTotales.toFixed(2)}`,
            gananciaEstimada: `S/.${gananciaEstimada.toFixed(2)}`,
            pedidosTotales,
            ticketPromedio: `S/.${ticketPromedio.toFixed(2)}`
        };
    }, [filteredOrders]);
    
    const salesOverTimeData = useMemo(() => {
        const salesByDay: {[key: string]: number} = {};
        filteredOrders.forEach(o => {
            const day = new Date(o.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
            salesByDay[day] = (salesByDay[day] || 0) + o.total;
        });
        return Object.entries(salesByDay).map(([name, sales]) => ({ name, sales })).reverse();
    }, [filteredOrders]);

    const salesByCategoryData = useMemo(() => {
        const sales: {[key: string]: number} = {};
        filteredOrders.forEach(o => {
            o.productos.forEach(p => {
                const productInfo = products.find(prod => prod.id === p.id);
                if(productInfo){
                    sales[productInfo.categoria] = (sales[productInfo.categoria] || 0) + (p.cantidad * p.precio);
                }
            });
        });
        return Object.entries(sales).map(([name, value]) => ({ name, value }));
    }, [filteredOrders, products]);
    
     const salesByTypeData = useMemo(() => {
        const sales: {[key in TipoPedido]: number} = { delivery: 0, local: 0, retiro: 0 };
        filteredOrders.forEach(o => {
            sales[o.tipo] = (sales[o.tipo] || 0) + o.total;
        });
        return Object.entries(sales).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
    }, [filteredOrders]);
    
    const topProducts = useMemo(() => {
        const productCounts: { [key: string]: number } = {};
        filteredOrders.forEach(order => {
            order.productos.forEach(p => {
                productCounts[p.nombre] = (productCounts[p.nombre] || 0) + p.cantidad;
            });
        });
        return Object.entries(productCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, value]) => ({ name, value }));
    }, [filteredOrders]);

    const exportToExcel = () => {
        const dataToExport = filteredOrders.map(order => ({
            'ID Pedido': order.id,
            'Fecha': new Date(order.fecha).toLocaleString('es-PE'),
            'Cliente': order.cliente.nombre,
            'Teléfono': order.cliente.telefono,
            'Tipo': order.tipo,
            'Turno': order.turno,
            'Total (S/.)': order.total,
            'Productos': order.productos.map(p => `${p.cantidad}x ${p.nombre}`).join('; '),
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        
        const columnWidths = Object.keys(dataToExport[0] || {}).map((key, i) => {
            const maxLength = Math.max(
                key.length,
                ...dataToExport.map(row => String(row[key as keyof typeof row] || '').length)
            );
            return { wch: maxLength + 2 };
        });

        ws['!cols'] = columnWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte de Ventas");
        
        XLSX.writeFile(wb, `reporte_uchu51_${startDate}_a_${endDate}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <div className="bg-surface dark:bg-[#34424D] p-4 rounded-2xl shadow-lg border border-text-primary/5 dark:border-[#45535D] space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-4">
                     <h2 className="text-xl font-heading font-bold text-text-primary dark:text-ivory-cream">Análisis de Ventas</h2>
                    <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm shadow-md hover:shadow-lg">
                        <DocumentArrowDownIcon className="h-5 w-5"/> Exportar a Excel
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <div className="col-span-2">
                        <label className="text-xs font-semibold text-text-secondary dark:text-light-silver">Rango de Fechas</label>
                        <div className="flex items-center gap-2">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-background dark:bg-[#45535D]/50 border border-text-primary/10 dark:border-[#45535D] rounded-md p-2 text-sm"/>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-background dark:bg-[#45535D]/50 border border-text-primary/10 dark:border-[#45535D] rounded-md p-2 text-sm"/>
                        </div>
                    </div>
                     <div className="col-span-2 md:col-span-2 lg:col-span-2">
                        <label className="text-xs font-semibold text-text-secondary dark:text-light-silver">Filtros Rápidos</label>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setDateRange(today, today)} className="text-xs font-semibold bg-text-primary/10 dark:bg-[#45535D]/50 hover:bg-text-primary/20 dark:hover:bg-[#56656E] px-2.5 py-1.5 rounded-md transition-colors flex-grow">Hoy</button>
                            <button onClick={() => { const y = new Date(); y.setDate(y.getDate()-1); setDateRange(y,y);}} className="text-xs font-semibold bg-text-primary/10 dark:bg-[#45535D]/50 hover:bg-text-primary/20 dark:hover:bg-[#56656E] px-2.5 py-1.5 rounded-md transition-colors flex-grow">Ayer</button>
                            <button onClick={() => setDateRange(last7Days, today)} className="text-xs font-semibold bg-text-primary/10 dark:bg-[#45535D]/50 hover:bg-text-primary/20 dark:hover:bg-[#56656E] px-2.5 py-1.5 rounded-md transition-colors flex-grow">7 Días</button>
                            <button onClick={() => setDateRange(firstDayOfMonth, today)} className="text-xs font-semibold bg-text-primary/10 dark:bg-[#45535D]/50 hover:bg-text-primary/20 dark:hover:bg-[#56656E] px-2.5 py-1.5 rounded-md transition-colors flex-grow">Mes</button>
                            <button onClick={() => setDateRange(firstDayOfLastMonth, lastDayOfLastMonth)} className="text-xs font-semibold bg-text-primary/10 dark:bg-[#45535D]/50 hover:bg-text-primary/20 dark:hover:bg-[#56656E] px-2.5 py-1.5 rounded-md transition-colors flex-grow">Mes Pasado</button>
                        </div>
                    </div>
                     <div>
                        <label className="text-xs font-semibold text-text-secondary dark:text-light-silver">Turno</label>
                        <select value={filterTurno} onChange={e => setFilterTurno(e.target.value as any)} className="w-full bg-background dark:bg-[#45535D]/50 border border-text-primary/10 dark:border-[#45535D] rounded-md p-2 text-sm">
                            <option value="todos">Todos</option><option value="mañana">Mañana</option><option value="tarde">Tarde</option><option value="noche">Noche</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-text-secondary dark:text-light-silver">Tipo Pedido</label>
                         <select value={filterTipo} onChange={e => setFilterTipo(e.target.value as any)} className="w-full bg-background dark:bg-[#45535D]/50 border border-text-primary/10 dark:border-[#45535D] rounded-md p-2 text-sm">
                            <option value="todos">Todos</option><option value="delivery">Delivery</option><option value="local">Salón</option><option value="retiro">Retiro</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Ventas Totales" value={kpis.ventasTotales} />
                <MetricCard title="Ganancia Estimada" value={kpis.gananciaEstimada} />
                <MetricCard title="Pedidos Totales" value={kpis.pedidosTotales} />
                <MetricCard title="Ticket Promedio" value={kpis.ticketPromedio} />
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-surface dark:bg-[#34424D] p-6 rounded-2xl shadow-lg border border-text-primary/5 dark:border-[#45535D]">
                    <h3 className="text-lg font-heading font-bold text-text-primary dark:text-ivory-cream mb-4">Ventas en el Tiempo</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesOverTimeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 109, 105, 0.1)" className="dark:stroke-[#45535D]" />
                            <XAxis dataKey="name" stroke="#A8A29E" tick={{fontSize: 12}} />
                            <YAxis stroke="#A8A29E" tick={{fontSize: 12}} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--tw-bg-surface)', border: '1px solid #e7e5e4', borderRadius: '12px' }} wrapperClassName="dark:!bg-[#34424D] dark:!border-[#56656E]" />
                            <Line type="monotone" dataKey="sales" name="Ventas" stroke="#F97316" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-surface dark:bg-[#34424D] p-6 rounded-2xl shadow-lg border border-text-primary/5 dark:border-[#45535D]">
                    <h3 className="text-lg font-heading font-bold text-text-primary dark:text-ivory-cream mb-4">Ventas por Categoría</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={salesByCategoryData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 109, 105, 0.1)" className="dark:stroke-[#45535D]" />
                            <XAxis dataKey="name" stroke="#A8A29E" tick={{fontSize: 10}} angle={-25} textAnchor="end" height={50} />
                            <YAxis stroke="#A8A29E" tick={{fontSize: 12}} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--tw-bg-surface)', border: '1px solid #e7e5e4', borderRadius: '12px' }} wrapperClassName="dark:!bg-[#34424D] dark:!border-[#56656E]" />
                            <Bar dataKey="value" name="Venta" fill="#F97316" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-surface dark:bg-[#34424D] p-6 rounded-2xl shadow-lg border border-text-primary/5 dark:border-[#45535D]">
                    <h3 className="text-lg font-heading font-bold text-text-primary dark:text-ivory-cream mb-4">Top 5 Productos Vendidos</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 109, 105, 0.1)" className="dark:stroke-[#45535D]" />
                            <XAxis type="number" stroke="#A8A29E" />
                            <YAxis type="category" dataKey="name" stroke="#A8A29E" width={120} tick={{fontSize: 12, fill: 'currentColor'}} className="text-text-secondary dark:text-light-silver" />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--tw-bg-surface)', border: '1px solid #e7e5e4', borderRadius: '12px' }} wrapperClassName="dark:!bg-[#34424D] dark:!border-[#56656E]" />
                            <Bar dataKey="value" name="Cantidad" fill="#FB923C" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                 <div className="lg:col-span-2 bg-surface dark:bg-[#34424D] p-6 rounded-2xl shadow-lg border border-text-primary/5 dark:border-[#45535D]">
                    <h3 className="text-lg font-heading font-bold text-text-primary dark:text-ivory-cream mb-4">Ventas por Tipo de Pedido</h3>
                     <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={salesByTypeData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} stroke="var(--tw-bg-surface)" className="dark:stroke-[#34424D]">
                                {salesByTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--tw-bg-surface)', border: '1px solid #e7e5e4', borderRadius: '12px' }} wrapperClassName="dark:!bg-[#34424D] dark:!border-[#56656E]" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <RecentActivityFeed orders={filteredOrders} />
                </div>
                <div>
                    <LowStockAlerts products={products} />
                </div>
            </div>
            
            <OrderHistory orders={filteredOrders} />
        </div>
    );
};

export default Dashboard;