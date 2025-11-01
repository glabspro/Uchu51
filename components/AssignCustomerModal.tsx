import React, { useState, useMemo } from 'react';
import type { ClienteLeal } from '../types';
import { SearchIcon, UserIcon } from './icons';

interface AssignCustomerModalProps {
    customers: ClienteLeal[];
    onAssign: (customer: ClienteLeal) => void;
    onClose: () => void;
}

const AssignCustomerModal: React.FC<AssignCustomerModalProps> = ({ customers, onAssign, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return [];
        return customers.filter(c => c.telefono.includes(searchTerm));
    }, [customers, searchTerm]);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4" onClick={onClose}>
            <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-md w-full flex flex-col animate-fade-in-scale" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-slate-100 mb-4">Asignar Cliente Leal</h2>
                <div className="relative mb-4">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary/50 dark:text-slate-500" />
                    <input
                        type="tel"
                        placeholder="Buscar por teléfono..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-primary transition"
                        autoFocus
                    />
                </div>
                <div className="flex-grow overflow-y-auto min-h-[200px] space-y-2">
                    {filteredCustomers.length > 0 ? (
                        filteredCustomers.map(customer => (
                            <button
                                key={customer.telefono}
                                onClick={() => onAssign(customer)}
                                className="w-full flex items-center gap-4 text-left p-3 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
                            >
                                <div className="bg-primary/20 p-2 rounded-full">
                                    <UserIcon className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-bold text-text-primary dark:text-slate-200">{customer.nombre}</p>
                                    <p className="text-sm text-text-secondary dark:text-slate-400">{customer.telefono}</p>
                                </div>
                                <p className="ml-auto text-lg font-bold text-primary dark:text-orange-400">{customer.puntos} pts</p>
                            </button>
                        ))
                    ) : (
                        <p className="text-center text-text-secondary dark:text-slate-500 pt-8">
                            {searchTerm ? 'No se encontraron clientes.' : 'Escribe un número para buscar.'}
                        </p>
                    )}
                </div>
                <div className="pt-6 mt-auto">
                    <button type="button" onClick={onClose} className="w-full bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-3 px-4 rounded-lg transition-colors active:scale-95">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignCustomerModal;
