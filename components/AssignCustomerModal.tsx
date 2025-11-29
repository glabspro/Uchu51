
import React, { useState, useMemo, useEffect } from 'react';
import type { ClienteLeal } from '../types';
import { SearchIcon, UserIcon, PlusIcon, StarIcon, MapPinIcon } from './icons';
import { useAppContext } from '../store';

interface AssignCustomerModalProps {
    customers: ClienteLeal[];
    onAssign: (customer: ClienteLeal) => void;
    onClose: () => void;
    onAddNewCustomer: (telefono: string, nombre: string) => void; // Keeps the signature for simplicity in types, but logic is handled here
}

const AssignCustomerModal: React.FC<AssignCustomerModalProps> = ({ customers, onAssign, onClose, onAddNewCustomer }) => {
    const { state, dispatch } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    
    // Detailed form state
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [newCustomerEmail, setNewCustomerEmail] = useState('');
    const [newCustomerAddress, setNewCustomerAddress] = useState('');
    const [newCustomerNotes, setNewCustomerNotes] = useState('');

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return [];
        const lowerTerm = searchTerm.toLowerCase();
        return customers.filter(c => 
            c.telefono.includes(searchTerm) || 
            c.nombre.toLowerCase().includes(lowerTerm)
        ).slice(0, 5); // Limit results
    }, [customers, searchTerm]);
    
    const isPhoneSearch = /^\d+$/.test(searchTerm);

    useEffect(() => {
        if (isPhoneSearch && searchTerm.length === 9) {
            // Auto-populate phone if starting creation from a full search
            setNewCustomerPhone(searchTerm);
        }
    }, [searchTerm, isPhoneSearch]);

    const handleCreateAndAssign = () => {
        if (!newCustomerName.trim() || !newCustomerPhone.trim()) return;
        
        // Use the store's action which now supports full object creation logic via Supabase
        // We pass the full object, even though the type definition in props might be simpler
        const newCustomer: ClienteLeal = {
            telefono: newCustomerPhone.trim(),
            nombre: newCustomerName.trim(),
            email: newCustomerEmail.trim(),
            direccion: newCustomerAddress.trim(),
            notas: newCustomerNotes.trim(),
            puntos: 0,
            nivel: 'bronce',
            historialPedidos: [],
            restaurant_id: state.restaurantId || '',
        };
        
        dispatch({ type: 'ADD_NEW_CUSTOMER', payload: newCustomer });
        
        // Optimistically assign
        onAssign(newCustomer);
    };

    const startCreation = () => {
        setIsCreating(true);
        if (isPhoneSearch) {
            setNewCustomerPhone(searchTerm);
        } else {
            setNewCustomerName(searchTerm);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4 font-sans" onClick={onClose}>
            <div className="bg-surface dark:bg-zinc-800 rounded-2xl shadow-xl p-6 max-w-md w-full flex flex-col animate-fade-in-scale max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-zinc-100 mb-1">
                    {isCreating ? 'Registrar Nuevo Cliente' : 'Buscar Cliente'}
                </h2>
                <p className="text-sm text-text-secondary dark:text-zinc-400 mb-4">
                    {isCreating ? 'Completa los datos para el programa de lealtad.' : 'Ingresa nombre o teléfono (9 dígitos).'}
                </p>

                {!isCreating ? (
                    <>
                        <div className="relative mb-4">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary/50 dark:text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-background dark:bg-zinc-700 border border-text-primary/10 dark:border-zinc-600 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-primary transition text-lg"
                                autoFocus
                            />
                        </div>

                        <div className="flex-grow overflow-y-auto min-h-[200px] space-y-2">
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map(customer => (
                                    <button
                                        key={customer.id || customer.telefono}
                                        onClick={() => onAssign(customer)}
                                        className="w-full flex items-center gap-4 text-left p-3 rounded-xl hover:bg-primary/5 dark:hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all group"
                                    >
                                        <div className="bg-primary/10 text-primary dark:bg-primary/20 p-3 rounded-full group-hover:scale-110 transition-transform">
                                            <UserIcon className="h-6 w-6" />
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-bold text-text-primary dark:text-zinc-200 text-lg leading-tight">{customer.nombre}</p>
                                            <p className="text-sm text-text-secondary dark:text-zinc-400 font-mono">{customer.telefono}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 justify-end text-primary dark:text-orange-400 font-bold">
                                                <StarIcon className="h-4 w-4" />
                                                <span>{customer.puntos}</span>
                                            </div>
                                            <span className="text-xs text-text-secondary dark:text-zinc-500 uppercase font-semibold">{customer.nivel || 'Bronce'}</span>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    {searchTerm ? (
                                        <div className="animate-fade-in-up">
                                            <p className="text-text-secondary dark:text-zinc-400 mb-4">No encontramos a "{searchTerm}"</p>
                                            <button 
                                                onClick={startCreation}
                                                className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/30 transition-transform active:scale-95 flex items-center gap-2 mx-auto"
                                            >
                                                <PlusIcon className="h-5 w-5" /> Registrar Nuevo Cliente
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-text-secondary dark:text-zinc-500">Empieza a escribir para buscar...</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="space-y-4 overflow-y-auto pr-2 animate-fade-in-right">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-text-secondary dark:text-zinc-400 mb-1 uppercase">Nombre Completo *</label>
                                <input
                                    type="text"
                                    value={newCustomerName}
                                    onChange={e => setNewCustomerName(e.target.value)}
                                    className="w-full bg-background dark:bg-zinc-700 border border-text-primary/10 dark:border-zinc-600 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="Ej: Juan Pérez"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-secondary dark:text-zinc-400 mb-1 uppercase">Teléfono *</label>
                                <input
                                    type="tel"
                                    value={newCustomerPhone}
                                    onChange={e => setNewCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                    className="w-full bg-background dark:bg-zinc-700 border border-text-primary/10 dark:border-zinc-600 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none font-mono"
                                    placeholder="999 999 999"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-secondary dark:text-zinc-400 mb-1 uppercase">Email (Opcional)</label>
                                <input
                                    type="email"
                                    value={newCustomerEmail}
                                    onChange={e => setNewCustomerEmail(e.target.value)}
                                    className="w-full bg-background dark:bg-zinc-700 border border-text-primary/10 dark:border-zinc-600 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="cliente@email.com"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-text-secondary dark:text-zinc-400 mb-1 uppercase">Dirección (Opcional)</label>
                                <div className="relative">
                                    <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary/50" />
                                    <input
                                        type="text"
                                        value={newCustomerAddress}
                                        onChange={e => setNewCustomerAddress(e.target.value)}
                                        className="w-full bg-background dark:bg-zinc-700 border border-text-primary/10 dark:border-zinc-600 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="Av. Principal 123, Dpto 401"
                                    />
                                </div>
                            </div>
                             <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-text-secondary dark:text-zinc-400 mb-1 uppercase">Notas / Preferencias</label>
                                <textarea
                                    value={newCustomerNotes}
                                    onChange={e => setNewCustomerNotes(e.target.value)}
                                    className="w-full bg-background dark:bg-zinc-700 border border-text-primary/10 dark:border-zinc-600 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none resize-none"
                                    rows={2}
                                    placeholder="Ej: Alérgico al maní, prefiere sin picante..."
                                />
                            </div>
                        </div>
                        
                        <div className="pt-4 flex gap-3">
                            <button 
                                onClick={() => setIsCreating(false)}
                                className="flex-1 bg-text-primary/10 dark:bg-zinc-700 text-text-primary dark:text-zinc-200 font-bold py-3 rounded-xl hover:bg-text-primary/20 transition-colors"
                            >
                                Volver
                            </button>
                            <button
                                onClick={handleCreateAndAssign}
                                disabled={!newCustomerName.trim() || newCustomerPhone.length < 9}
                                className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Guardar y Asignar
                            </button>
                        </div>
                    </div>
                )}

                <div className="pt-4 mt-auto border-t border-text-primary/5 dark:border-zinc-700">
                    <button type="button" onClick={onClose} className="w-full text-text-secondary dark:text-zinc-500 hover:text-primary dark:hover:text-zinc-300 font-semibold text-sm py-2">
                        Cerrar sin asignar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignCustomerModal;
