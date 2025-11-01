import React, { useMemo, useState, useEffect } from 'react';
import type { Pedido, MetodoPago, Producto, EstadoPedido } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PrinterIcon, DocumentArrowDownIcon, ShoppingBagIcon, CheckCircleIcon, ClockIcon, FireIcon, ExclamationTriangleIcon } from './icons';

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

interface ReportFilters {
    startDate: string;
    endDate: string;
    paymentMethods: MetodoPago[];
    productId: string;
}

const ReportPrintView: React.FC<{ data: Pedido[], filters: ReportFilters, products: Producto[] }> = ({ data, filters, products }) => {
    const total = data.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const product = products.find(p => p.id === filters.productId);

    return (
        <div className="printable-report">
            <h1 className="text-2xl font-bold mb-2">Informe de Pagos POS</h1>
            <div className="text-sm mb-4">
                <p><strong>Periodo:</strong> {new Date(filters.startDate).toLocaleDateString()} - {new Date(filters.endDate).toLocaleDateString()}</p>
                <p><strong>Métodos de Pago:</strong> {filters.paymentMethods.join(', ') || 'Todos'}</p>
                <p><strong>Producto:</strong> {product?.nombre || 'Todos'}</p>
            </div>
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2 border">Fecha</th>
                        <th className="p-2 border">Pedido ID</th>
                        <th className="p-2 border">Mesa</th>
                        <th className="p-2 border">Productos</th>
                        <th className="p-2 border">Método</th>
                        <th className="p-2 border">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(order => (
                        <tr key={order.id}>
                            <td className="p-2 border">{order.pagoRegistrado ? new Date(order.pagoRegistrado.fecha).toLocaleString() : ''}</td>
                            <td className="p-2 border">{order.id}</td>
                            <td className="p-2 border">{order.cliente.mesa}</td>
                            <td className="p-2 border">{order.productos.map(p => `${p.cantidad}x ${p.nombre}`).join(', ')}</td>
                            <td className="p-2 border">{order.pagoRegistrado?.metodo}</td>
                            <td className="p-2 border text-right">S/.{order.total.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="font-bold bg-gray-100">
                        <td colSpan={5} className="p-2 border text-right">Total General</td>
                        <td className="p-2 border text-right">S/.{total.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ orders, products }) => {
    const [reportData, setReportData] = useState<Pedido[] | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [filters, setFilters] = useState<ReportFilters>({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        paymentMethods: [],
        productId: 'todos',
    });

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
    
     const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFilters(prev => ({ ...prev, paymentMethods: checked ? [...prev.paymentMethods, value as MetodoPago] : prev.paymentMethods.filter(m => m !== value) }));
        } else {
            setFilters(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleGenerateReport = (e: React.FormEvent) => {
        e.preventDefault();
        const filtered = orders.filter(order => {
            if (order.tipo !== 'local' || order.estado !== 'pagado' || !order.pagoRegistrado) return false;
            const paymentDate = new Date(order.pagoRegistrado.fecha);
            const startDate = new Date(filters.startDate);
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999); 
            const inDateRange = paymentDate >= startDate && paymentDate <= endDate;
            const hasPaymentMethod = filters.paymentMethods.length === 0 || filters.paymentMethods.includes(order.pagoRegistrado.metodo);
            const hasProduct = filters.productId === 'todos' || order.productos.some(p => p.id === filters.productId);
            return inDateRange && hasPaymentMethod && hasProduct;
        });
        setReportData(filtered);
    };
    
    const handleExportCSV = () => {
        if (!reportData) return;
        const csvRows = [];
        const headers = ['Fecha Pago', 'Pedido ID', 'Mesa', 'Productos', 'Metodo de Pago', 'Total'];
        csvRows.push(headers.join(','));
        for (const order of reportData) {
            if (!order.pagoRegistrado) continue;
            const values = [ new Date(order.pagoRegistrado.fecha).toLocaleString(), order.id, order.cliente.mesa, `"${order.productos.map(p => `${p.cantidad}x ${p.nombre}`).join('; ')}"`, order.pagoRegistrado.metodo, order.total.toFixed(2) ].join(',');
            csvRows.push(values);
        }
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'informe_pagos_pos.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handlePrintPDF = () => setIsPrinting(true);
    
    useEffect(() => {
        if (isPrinting) {
            const handleAfterPrint = () => { document.body.classList.remove('uchu-printing'); setIsPrinting(false); window.removeEventListener('afterprint', handleAfterPrint); };
            window.addEventListener('afterprint', handleAfterPrint);
            document.body.classList.add('uchu-printing');
            window.print();
        }
    }, [isPrinting]);

    const reportTotal = useMemo(() => {
        if (!reportData) return 0;
        return reportData.reduce((sum, order) => sum + Number(order.total || 0), 0);
    }, [reportData]);

    const paymentMethods: MetodoPago[] = ['efectivo', 'tarjeta', 'yape', 'plin', 'online'];

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

            <div className="bg-surface dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-text-primary/5 dark:border-slate-700">
                <h3 className="text-xl font-heading font-bold text-text-primary dark:text-slate-100 mb-4">Informes de Pagos POS (Salón)</h3>
                <form onSubmit={handleGenerateReport}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Desde</label>
                            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Hasta</label>
                            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Producto</label>
                            <select name="productId" value={filters.productId} onChange={handleFilterChange} className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2">
                                <option value="todos">Todos los productos</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-md transition-all">Generar Informe</button>
                        </div>
                        <div className="md:col-span-2 lg:col-span-4">
                            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-2">Método de Pago</label>
                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                {paymentMethods.map(method => (
                                <label key={method} className="flex items-center space-x-2">
                                    <input type="checkbox" name="paymentMethods" value={method} checked={filters.paymentMethods.includes(method)} onChange={handleFilterChange} className="h-4 w-4 rounded border-text-primary/20 dark:border-slate-500 text-primary focus:ring-primary bg-transparent dark:bg-slate-800" />
                                    <span className="capitalize">{method}</span>
                                </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </form>

                {reportData && (
                     <div className="mt-6 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-bold">Resultados del Informe ({reportData.length} registros)</h4>
                            <div className="flex items-center space-x-2">
                                <button onClick={handleExportCSV} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-md text-sm"><DocumentArrowDownIcon className="h-4 w-4" /><span>Excel (CSV)</span></button>
                                <button onClick={handlePrintPDF} className="flex items-center space-x-2 bg-text-primary dark:bg-slate-600 hover:bg-text-primary/80 text-white font-semibold py-2 px-3 rounded-md text-sm"><PrinterIcon className="h-4 w-4"/><span>Imprimir PDF</span></button>
                            </div>
                        </div>
                         <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-background dark:bg-slate-700 sticky top-0">
                                    <tr>
                                        <th className="p-2">Fecha</th>
                                        <th className="p-2">Pedido</th>
                                        <th className="p-2">Mesa</th>
                                        <th className="p-2">Método</th>
                                        <th className="p-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-text-primary/5 dark:divide-slate-700">
                                {reportData.map(order => (
                                    <tr key={order.id} className="hover:bg-background dark:hover:bg-slate-700/50">
                                        <td className="p-2">{new Date(order.pagoRegistrado!.fecha).toLocaleDateString()}</td>
                                        <td className="p-2 font-mono">{order.id}</td>
                                        <td className="p-2">{order.cliente.mesa}</td>
                                        <td className="p-2 capitalize">{order.pagoRegistrado!.metodo}</td>
                                        <td className="p-2 text-right font-mono">S/.{order.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                         </div>
                         <div className="mt-4 text-right font-bold text-lg pr-2">
                            Total del Informe: <span className="font-mono text-primary dark:text-orange-400">S/.{reportTotal.toFixed(2)}</span>
                        </div>
                     </div>
                )}
            </div>
            {isPrinting && reportData && <ReportPrintView data={reportData} filters={filters} products={products} />}
        </div>
    );
};

export default Dashboard;