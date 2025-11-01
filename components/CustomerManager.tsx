import React, { useState, useMemo } from 'react';
import type { ClienteLeal } from '../types';
import { SearchIcon, UserGroupIcon } from './icons';

interface CustomerManagerProps {
    customers: ClienteLeal[];
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ customers }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCustomers = useMemo(() => {
        const sortedCustomers = [...customers].sort((a, b) => b.puntos - a.puntos);
        if (!searchTerm) return sortedCustomers;
        return sortedCustomers.filter(
            c =>
                c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.telefono.includes(searchTerm)
        );
    }, [customers, searchTerm]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary dark:text-slate-200">
                    Clientes Leales ({filteredCustomers.length})
                </h2>
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary/50 dark:text-slate-500" />
                    <input
                        type="search"
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full max-w-xs bg-background dark:bg-slate-700/50 border border-text-primary/10 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary focus:border-primary transition"
                    />
                </div>
            </div>
            <div className="bg-background dark:bg-slate-900/50 rounded-xl border border-text-primary/5 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto max-h-[calc(100vh-22rem)]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-surface dark:bg-slate-700/50 sticky top-0">
                            <tr>
                                <th className="p-4 font-semibold">Nombre</th>
                                <th className="p-4 font-semibold">Teléfono</th>
                                <th className="p-4 font-semibold text-center">Puntos Acumulados</th>
                                <th className="p-4 font-semibold text-center">Total Gastado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-text-primary/5 dark:divide-slate-700">
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map(customer => {
                                    const totalSpent = customer.historialPedidos.reduce((sum, order) => sum + order.total, 0);
                                    return (
                                        <tr key={customer.telefono} className="hover:bg-text-primary/5 dark:hover:bg-slate-700/30">
                                            <td className="p-4 font-medium text-text-primary dark:text-slate-200">{customer.nombre}</td>
                                            <td className="p-4 text-text-secondary dark:text-slate-400 font-mono">{customer.telefono}</td>
                                            <td className="p-4 text-center font-bold text-lg text-primary dark:text-orange-400">{customer.puntos}</td>
                                            <td className="p-4 text-center font-mono text-text-secondary dark:text-slate-400">S/.{totalSpent.toFixed(2)}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-16 text-center text-text-secondary dark:text-slate-500">
                                        <UserGroupIcon className="h-12 w-12 mx-auto mb-2"/>
                                        <p className="font-semibold">{searchTerm ? 'No se encontraron clientes.' : 'Aún no hay clientes registrados.'}</p>
                                        <p className="text-xs">{searchTerm ? 'Intenta con otro término de búsqueda.' : 'Los clientes se registrarán automáticamente con su primera compra.'}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CustomerManager;
