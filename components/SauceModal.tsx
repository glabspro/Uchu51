import React, { useState, useEffect } from 'react';
import type { Producto, Salsa } from '../types';
import { listaDeSalsas } from '../constants';

interface SauceModalProps {
    product: Producto | null;
    onClose: () => void;
    onConfirm: (salsas: Salsa[]) => void;
    initialSalsas?: Salsa[];
}

const SauceModal: React.FC<SauceModalProps> = ({ product, onClose, onConfirm, initialSalsas = [] }) => {
    const [selectedSalsas, setSelectedSalsas] = useState<Salsa[]>(initialSalsas);

    if (!product) return null;

    const handleSauceToggle = (sauce: Salsa) => {
        setSelectedSalsas(prev =>
            prev.find(s => s.nombre === sauce.nombre)
                ? prev.filter(s => s.nombre !== sauce.nombre)
                : [...prev, sauce]
        );
    };
    
    const totalSalsas = selectedSalsas.reduce((acc, s) => acc + s.precio, 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[102] p-4 font-sans" onClick={onClose}>
            <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in-scale border border-text-primary/10 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-text-primary/10 dark:border-slate-700">
                    <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-slate-100">Añade tus cremas para</h2>
                    <p className="text-primary dark:text-orange-400 font-semibold text-lg">{product.nombre}</p>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <h3 className="font-semibold text-text-secondary dark:text-slate-400">Elige tus favoritas:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {listaDeSalsas.map(sauce => (
                            <label key={sauce.nombre} className="flex items-center space-x-3 bg-background dark:bg-slate-700/50 p-3 rounded-lg cursor-pointer hover:bg-text-primary/5 dark:hover:bg-slate-700 transition-colors border border-text-primary/10 dark:border-slate-600 has-[:checked]:bg-primary/10 has-[:checked]:border-primary/50">
                                <input
                                    type="checkbox"
                                    checked={selectedSalsas.some(s => s.nombre === sauce.nombre)}
                                    onChange={() => handleSauceToggle(sauce)}
                                    className="h-5 w-5 rounded border-text-primary/20 dark:border-slate-500 text-primary focus:ring-primary bg-transparent dark:bg-slate-800"
                                />
                                <span className="flex-grow text-text-primary dark:text-slate-200 font-medium">{sauce.nombre}</span>
                                <span className="text-sm font-medium text-text-secondary dark:text-slate-400">
                                    {sauce.precio > 0 ? `+ S/.${sauce.precio.toFixed(2)}` : 'Gratis'}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="p-6 border-t border-text-primary/10 dark:border-slate-700 mt-auto bg-background dark:bg-slate-900/50 rounded-b-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-heading font-bold text-text-primary dark:text-slate-100">Total Producto:</span>
                        <span className="text-2xl font-heading font-bold text-primary dark:text-orange-400">S/.{(product.precio + totalSalsas).toFixed(2)}</span>
                    </div>
                    <button onClick={() => onConfirm(selectedSalsas)} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5">
                        Confirmar Cremas
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SauceModal;