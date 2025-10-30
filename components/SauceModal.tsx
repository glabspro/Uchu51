import React, { useState } from 'react';
import type { Producto, Salsa } from '../types';
import { listaDeSalsas } from '../constants';

interface SauceModalProps {
    product: Producto | null;
    onClose: () => void;
    onConfirm: (salsas: Salsa[]) => void;
}

const SauceModal: React.FC<SauceModalProps> = ({ product, onClose, onConfirm }) => {
    const [selectedSalsas, setSelectedSalsas] = useState<Salsa[]>([]);

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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100] p-4 font-sans" onClick={onClose}>
            <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in-scale border border-text-primary/10" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-text-primary/10">
                    <h2 className="text-2xl font-heading font-bold text-text-primary">Añade tus cremas para</h2>
                    <p className="text-primary font-semibold text-lg">{product.nombre}</p>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <h3 className="font-semibold text-text-secondary">Elige tus favoritas:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {listaDeSalsas.map(sauce => (
                            <label key={sauce.nombre} className="flex items-center space-x-3 bg-background p-3 rounded-lg cursor-pointer hover:bg-text-primary/5 transition-colors border border-text-primary/10 has-[:checked]:bg-primary/10 has-[:checked]:border-primary/50">
                                <input
                                    type="checkbox"
                                    checked={selectedSalsas.some(s => s.nombre === sauce.nombre)}
                                    onChange={() => handleSauceToggle(sauce)}
                                    className="h-5 w-5 rounded border-text-primary/20 text-primary focus:ring-primary"
                                />
                                <span className="flex-grow text-text-primary font-medium">{sauce.nombre}</span>
                                <span className="text-sm font-medium text-text-secondary">
                                    {sauce.precio > 0 ? `+ S/.${sauce.precio.toFixed(2)}` : 'Gratis'}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="p-6 border-t border-text-primary/10 mt-auto bg-background rounded-b-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-heading font-bold text-text-primary">Total Producto:</span>
                        <span className="text-2xl font-heading font-bold text-primary">S/.{(product.precio + totalSalsas).toFixed(2)}</span>
                    </div>
                    <button onClick={() => onConfirm(selectedSalsas)} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5">
                        Agregar al Pedido
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SauceModal;