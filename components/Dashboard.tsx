import React, { useMemo, useState } from 'react';
import type { Pedido, Producto, EstadoPedido } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
    ShoppingBagIcon,
    CheckCircleIcon,
    ClockIcon,
    FireIcon,
    ExclamationTriangleIcon,
    DocumentMagnifyingGlassIcon,
    SearchIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from './icons';

interface DashboardProps {
    orders: Pedido[];
    products: Producto[];
}

const MetricCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-surface dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-text-primary/5 dark:border-slate-700">
        <div className="flex items-center gap-4">
            <div className="bg-background dark:bg-slate-700/50 p-3 rounded-full">
                {icon}
            </div>
            <div>
                <h3 className="text-sm font-semibold text-text-secondary dark:text-slate-400 uppercase tracking-wider">{title}</h3>
                <p className="text-4xl font-heading font-extrabold text-text-primary dark:text-white mt-1">{value}</p>
            </div>
        </div>
    </div>
);


const LowStockAlerts: React.FC<{ products: Producto[] }> = ({ products }) => {
    const lowStockProducts = useMemo(() => products.filter(p => p.stock < 10).sort((a, b) => a.stock - b.stock), [products]);

    if (lowStockProducts.length === 0) return null;

    return (
        <div className="bg-surface dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-amber-500/30 dark:border-amber-500/50 h-full">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-amber-500/10 p-2 rounded-full">
                    <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="text-lg font-heading font-bold text-amber-600 dark:text-amber-400">Inventario Bajo</h3>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {lowStockProducts.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-background dark:bg-slate-700/50 p-2 rounded-lg text-sm">
                        <span className="font-semibold text-text-primary dark:text-slate-200">{p.nombre}</span>
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
        <div className="bg-surface dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-text-primary/5 dark:border-slate-700 h-full">
            <h3 className="text-lg font-heading font-bold text-text-primary dark:text-slate-100 mb-4">Actividad Reciente</h3>
            <div className="space-y-3">
                {recentOrders.length > 0 ? recentOrders.map((order, i) => (
                    <div key={order.id} className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="flex-shrink-0">
                            <span className={`h-2.5 w-2.5 rounded-full ${getStatusInfo(order.estado).color} block`}></span>
                        </div>
                        <div className="flex-grow">
                            <p className="font-semibold text-text-primary dark:text-slate-200 leading-tight">{order.id} - {order.cliente.nombre}</p>
                            <p className="text-xs text-text-secondary dark:text-slate-400 capitalize">{order.tipo} - {new Date(order.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="font-mono font-semibold text-text-primary dark:text-slate-200 text-right">
                            S/.{order.total.toFixed(2)}
                        </div>
                    </div>
                )) : (
                    <p className="text-sm text-center text-text-secondary dark:text-slate-500 py-8">No hay actividad reciente.</p>
                )}
            </div>
        </div>
    );
};

const COLORS = ['#F97316', '#FB923C', '#FDBA74', '#FECACA', '#FDE68A'];

const OrderHistory: React.FC<{ orders: Pedido[] }> = ({ orders }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    const filteredOrders = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return orders
            .filter(order => {
                const orderDate = new Date(order.fecha);
                return orderDate >= start && orderDate <= end;
            })
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
    }, [orders, searchTerm, startDate, endDate]);

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
                colorClasses = 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300';
        }
        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${colorClasses}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="bg-surface dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-text-primary/5 dark:border-slate-700">
            <h3 className="text-xl font-heading font-bold text-text-primary dark:text-slate-100 mb-4 flex items-center gap-2">
                <DocumentMagnifyingGlassIcon className="h-6 w-6" />
                Historial de Pedidos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Buscar por cliente</label>
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary/50 dark:text-slate-500" />
                        <input
                            type="search"
                            placeholder="Nombre o 9 dígitos del teléfono..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-background dark:bg-slate-700/50 border border-text-primary/10 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary focus:border-primary transition"
                        />
                    </div>
                </div>
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Desde</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-background dark:bg-slate-700/50 border border-text-primary/10 dark:border-slate-700 rounded-lg p-2"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Hasta</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-background dark:bg-slate-700/50 border border-text-primary/10 dark:border-slate-700 rounded-lg p-2"/>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm text-left">
                    <thead className="bg-background dark:bg-slate-700/50 sticky top-0 z-10">
                        <tr>
                            <th className="p-3 font-semibold">Pedido</th>
                            <th className="p-3 font-semibold">Fecha</th>
                            <th className="p-3 font-semibold">Cliente</th>
                            <th className="p-3 font-semibold text-right">Total</th>
                            <th className="p-3 font-semibold text-center">Estado</th>
                            <th className="p-3 font-semibold"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-text-primary/5 dark:divide-slate-700">
                        {filteredOrders.length > 0 ? filteredOrders.map(order => (
                            <React.Fragment key={order.id}>
                                <tr className="hover:bg-background dark:hover:bg-slate-700/50">
                                    <td className="p-3 font-mono text-primary dark:text-orange-400">{order.id}</td>
                                    <td className="p-3 text-text-secondary dark:text-slate-400">{new Date(order.fecha).toLocaleString('es-PE')}</td>
                                    <td className="p-3">
                                        <div className="font-medium text-text-primary dark:text-slate-200">{order.cliente.nombre}</div>
                                        <div className="text-xs text-text-secondary dark:text-slate-500">{order.cliente.telefono.slice(-9)}</div>
                                    </td>
                                    <td className="p-3 text-right font-mono font-semibold text-text-primary dark:text-slate-200">S/.{order.total.toFixed(2)}</td>
                                    <td className="p-3 text-center">{getStatusBadge(order.estado)}</td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)} className="p-1 rounded-full hover:bg-text-primary/10 dark:hover:bg-slate-600">
                                            {expandedOrderId === order.id ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                                        </button>
                                    </td>
                                </tr>
                                {expandedOrderId === order.id && (
                                    <tr className="bg-background dark:bg-slate-900/30">
                                        <td colSpan={6} className="p-4">
                                            <div className="animate-fade-in-up">
                                                <h4 className="font-bold mb-2 text-text-primary dark:text-slate-200">Detalle del Pedido:</h4>
                                                <ul className="space-y-1 text-xs pl-4 list-disc list-inside">
                                                    {order.productos.map((p, index) => (
                                                        <li key={index} className="text-text-secondary dark:text-slate-400">
                                                            <span className="font-semibold text-text-primary dark:text-slate-300">{p.cantidad}x {p.nombre}</span> - S/.{(p.cantidad * p.precio).toFixed(2)}
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
                                <td colSpan={6} className="text-center p-8 text-text-secondary dark:text-slate-500">
                                    No se encontraron pedidos con los filtros seleccionados.
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
    const metrics = useMemo(() => {
        const totalPedidos = orders.length;
        const pedidosCompletados = orders.filter(o => ['entregado', 'recogido', 'pagado'].includes(o.estado)).length;
        const pedidosEnProceso = orders.filter(o => !['entregado', 'recogido', 'cancelado', 'nuevo', 'pagado'].includes(o.estado)).length;
        
        const preparationTimes = orders
            .map(o => {
                const creationEvent = o.historial.find(h => ['nuevo', 'confirmado'].includes(h.estado));
                const completionEvent = o.historial.find(h => ['listo', 'recogido'].includes(h.estado));
                if (creationEvent && completionEvent) return (new Date(completionEvent.fecha).getTime() - new Date(creationEvent.fecha).getTime()) / 1000;
                return null;
            })
            .filter((t): t is number => t !== null && t > 0);
        
        const tiempoPromedio = preparationTimes.length > 0 ? Math.floor(preparationTimes.reduce((a, b) => a + b, 0) / preparationTimes.length) : 0;
        const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

        return { totalPedidos, pedidosCompletados, pedidosEnProceso, tiempoPromedio: formatTime(tiempoPromedio) };
    }, [orders]);
    
    const topProducts = useMemo(() => {
        const productCounts: { [key: string]: number } = {};
        orders.forEach(order => {
            order.productos.forEach(p => {
                productCounts[p.nombre] = (productCounts[p.nombre] || 0) + Number(p.cantidad || 0);
            });
        });
        return Object.entries(productCounts).sort(([, a], [, b]) => Number(b) - Number(a)).slice(0, 5).map(([name, value]) => ({ name, value }));
    }, [orders]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total de Pedidos" value={metrics.totalPedidos} icon={<ShoppingBagIcon className="h-7 w-7 text-sky-500" />} />
                <MetricCard title="Pedidos Completados" value={metrics.pedidosCompletados} icon={<CheckCircleIcon className="h-7 w-7 text-green-500" />} />
                <MetricCard title="Pedidos en Proceso" value={metrics.pedidosEnProceso} icon={<ClockIcon className="h-7 w-7 text-amber-500" />} />
                <MetricCard title="Tiempo Promedio Prep." value={metrics.tiempoPromedio} icon={<FireIcon className="h-7 w-7 text-red-500" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <RecentActivityFeed orders={orders} />
                </div>
                <div>
                    <LowStockAlerts products={products} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-surface dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-text-primary/5 dark:border-slate-700">
                    <h3 className="text-lg font-heading font-bold text-text-primary dark:text-slate-100 mb-4">Top 5 Productos Vendidos</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                             <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 109, 105, 0.2)" className="dark:stroke-slate-600" />
                            <XAxis type="number" stroke="#A8A29E" />
                            <YAxis type="category" dataKey="name" stroke="#A8A29E" width={120} tick={{fontSize: 12, fill: 'currentColor'}} className="text-text-secondary dark:text-slate-400" />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--tw-bg-surface, #FFFFFF)', border: '1px solid #e7e5e4', color: '#1c1917', borderRadius: '12px' }} wrapperClassName="dark:!bg-slate-700 dark:!border-slate-600 dark:text-slate-200" cursor={{ fill: 'rgba(253, 252, 251, 0.5)', className: 'dark:fill-slate-700/50' }} />
                            <Bar dataKey="value" name="Cantidad Vendida" fill="#F97316" radius={[0, 8, 8, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                 <div className="lg:col-span-2 bg-surface dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-text-primary/5 dark:border-slate-700">
                    <h3 className="text-lg font-heading font-bold text-text-primary dark:text-slate-100 mb-4">Distribución de Pedidos</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={topProducts} cx="50%" cy="50%" labelLine={false} outerRadius={120} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${((Number(percent) || 0) * 100).toFixed(0)}%`} stroke="var(--tw-bg-surface, #FFFFFF)" className="dark:stroke-slate-800">
                                {topProducts.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--tw-bg-surface, #FFFFFF)', border: '1px solid #e7e5e4', borderRadius: '12px' }} wrapperClassName="dark:!bg-slate-700 dark:!border-slate-600" />
                            <Legend wrapperStyle={{ color: 'var(--tw-text-primary, #44281D)' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <OrderHistory orders={orders} />
        </div>
    );
};

export default Dashboard;