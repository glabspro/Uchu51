import React, { useState, useEffect } from 'react';
import type { Salsa } from '../types';
import { useAppContext } from '../store';

interface SauceEditorModalProps {
    sauce: Salsa | null;
    onSave: (sauce: Omit<Salsa, 'isAvailable'>) => void;
    onClose: () => void;
    allSalsas: Salsa[];
}

const SauceEditorModal: React.FC<SauceEditorModalProps> = ({ sauce, onSave, onClose, allSalsas }) => {
    const { state } = useAppContext();
    const [nombre, setNombre] = useState(sauce?.nombre || '');
    const [precio, setPrecio] = useState(sauce?.precio || 0);
    const [error, setError] = useState('');

    useEffect(() => {
        if (sauce) {
            setNombre(sauce.nombre);
            setPrecio(sauce.precio);
        }
    }, [sauce]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!nombre.trim()) {
            setError('El nombre no puede estar vacío.');
            return;
        }
        // Check for duplicate name only if it's a new sauce or the name has changed
        if (!sauce || nombre.trim() !== sauce.nombre) {
            if (allSalsas.some(s => s.nombre.toLowerCase() === nombre.trim().toLowerCase())) {
                setError('Ya existe una crema con este nombre.');
                return;
            }
        }
        
        // FIX: Add missing 'restaurant_id' property.
        onSave({ nombre: nombre.trim(), precio, restaurant_id: sauce?.restaurant_id || state.restaurantId! });
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[102] p-4" onClick={onClose}>
            <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-md w-full flex flex-col animate-fade-in-scale" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-slate-100 mb-6">{sauce ? 'Editar Crema' : 'Añadir Nueva Crema'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Nombre de la Crema</label>
                        <input 
                            type="text" 
                            value={nombre} 
                            onChange={e => setNombre(e.target.value)}
                            className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2" 
                            required 
                            disabled={!!sauce}
                        />
                         {sauce && <p className="text-xs text-text-secondary dark:text-slate-500 mt-1">El nombre no se puede cambiar para evitar inconsistencias.</p>}
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Precio (S/.)</label>
                        <input 
                            type="number" 
                            value={precio} 
                            onChange={e => setPrecio(parseFloat(e.target.value) || 0)}
                            step="0.1"
                            min="0"
                            className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2" 
                            required 
                        />
                    </div>
                    {error && <p className="text-danger text-sm">{error}</p>}
                </form>
                <div className="pt-6 mt-auto grid grid-cols-2 gap-4">
                    <button type="button" onClick={onClose} className="w-full bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-3 px-4 rounded-lg transition-colors active:scale-95">Cancelar</button>
                    <button type="submit" onClick={handleSubmit} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-all active:scale-95 shadow-md">Guardar</button>
                </div>
            </div>
        </div>
    );
};

export default SauceEditorModal;