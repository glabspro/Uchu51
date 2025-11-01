import React, { useState } from 'react';
import type { Recompensa, Producto } from '../types';

interface RewardModalProps {
    reward: Recompensa | null;
    onSave: (reward: Recompensa) => void;
    onClose: () => void;
    products: Producto[];
}

const RewardModal: React.FC<RewardModalProps> = ({ reward, onSave, onClose, products }) => {
    const [formData, setFormData] = useState<Omit<Recompensa, 'id'>>({
        nombre: reward?.nombre || '',
        puntosRequeridos: reward?.puntosRequeridos || 0,
        productoId: reward?.productoId || undefined,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (name === 'productoId') {
            const newProductId = value === 'none' ? undefined : value;
            const selectedProduct = products.find(p => p.id === newProductId);
            setFormData(prev => ({ 
                ...prev, 
                productoId: newProductId,
                nombre: selectedProduct ? `${selectedProduct.nombre} [CANJE]` : ''
            }));
        } else {
            const processedValue = type === 'number' ? parseInt(value, 10) || 0 : value;
            setFormData(prev => ({ ...prev, [name]: processedValue }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: reward?.id || `rec-${Date.now()}` });
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[102] p-4" onClick={onClose}>
            <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-lg w-full flex flex-col animate-fade-in-scale" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-slate-100 mb-6">{reward ? 'Editar Recompensa' : 'Añadir Nueva Recompensa'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Producto Asociado (Opcional)</label>
                        <select name="productoId" value={formData.productoId || 'none'} onChange={handleChange} className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2">
                            <option value="none">Ninguno (Recompensa Genérica, ej: Descuento)</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre} - S/.{p.precio.toFixed(2)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Nombre de la Recompensa</label>
                        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej: Gaseosa Personal Gratis" className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Puntos Requeridos</label>
                        <input type="number" name="puntosRequeridos" value={formData.puntosRequeridos} onChange={handleChange} placeholder="Ej: 50" className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2" required />
                    </div>
                </form>
                <div className="pt-6 mt-auto grid grid-cols-2 gap-4">
                    <button type="button" onClick={onClose} className="w-full bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-3 px-4 rounded-lg transition-colors active:scale-95">Cancelar</button>
                    <button type="submit" onClick={handleSubmit} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-all active:scale-95 shadow-md">Guardar Recompensa</button>
                </div>
            </div>
        </div>
    );
};

export default RewardModal;