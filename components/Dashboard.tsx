
import React, { useMemo } from 'react';
import type { Pedido } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
    orders: Pedido[];
}

const MetricCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-primary">
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</h3>
        <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
);

const COLORS = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'];

const Dashboard: React.FC<DashboardProps> = ({ orders }) => {

    const metrics = useMemo(() => {
        const totalPedidos = orders.length;
        const pedidosCompletados = orders.filter(o => ['entregado', 'recogido', 'pagado'].includes(o.estado)).length;
        const pedidosEnProceso = orders.filter(o => !['entregado', 'recogido', 'cancelado', 'nuevo', 'pagado'].includes(o.estado)).length;
        
        const preparationTimes = orders
            .filter(o => ['entregado', 'listo', 'recogido', 'pagado'].includes(o.estado))
            .map(o => o.tiempoTranscurrido);
        
        const tiempoPromedio = preparationTimes.length > 0
            ? Math.floor(preparationTimes.reduce((a, b) => a + b, 0) / preparationTimes.length)
            : 0;

        const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

        return {
            totalPedidos,
            pedidosCompletados,
            pedidosEnProceso,
            tiempoPromedio: formatTime(tiempoPromedio),
        };
    }, [orders]);
    
    const topProducts = useMemo(() => {
        const productCounts: { [key: string]: number } = {};
        orders.forEach(order => {
            order.productos.forEach(p => {
                productCounts[p.nombre] = (productCounts[p.nombre] || 0) + p.cantidad;
            });
        });

        return Object.entries(productCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }));
    }, [orders]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total de Pedidos" value={metrics.totalPedidos} />
                <MetricCard title="Pedidos Completados" value={metrics.pedidosCompletados} />
                <MetricCard title="Pedidos en Proceso" value={metrics.pedidosEnProceso} />
                <MetricCard title="Tiempo Promedio Prep." value={metrics.tiempoPromedio} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Top 5 Productos Vendidos</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                             <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" stroke="#64748b" />
                            <YAxis type="category" dataKey="name" stroke="#64748b" width={120} tick={{fontSize: 12}} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}
                                cursor={{ fill: '#f1f5f9' }}
                            />
                            <Bar dataKey="value" name="Cantidad Vendida" fill="#10B981" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                 <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Distribución de Pedidos</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={topProducts}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                stroke="#f8fafc"
                            >
                                {topProducts.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }}/>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;