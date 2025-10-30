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
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-800">Añade tus cremas para</h2>
                    <p className="text-primary font-semibold text-lg">{product.nombre}</p>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <h3 className="font-semibold text-slate-600">Elige tus favoritas:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {listaDeSalsas.map(sauce => (
                            <label key={sauce.nombre} className="flex items-center space-x-3 bg-slate-100 p-3 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors border border-transparent has-[:checked]:bg-primary/10 has-[:checked]:border-primary/50">
                                <input
                                    type="checkbox"
                                    checked={selectedSalsas.some(s => s.nombre === sauce.nombre)}
                                    onChange={() => handleSauceToggle(sauce)}
                                    className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                                />
                                <span className="flex-grow text-slate-800 font-medium">{sauce.nombre}</span>
                                <span className="text-sm font-medium text-slate-600">
                                    {sauce.precio > 0 ? `+ S/.${sauce.precio.toFixed(2)}` : 'Gratis'}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="p-6 border-t mt-auto bg-slate-50 rounded-b-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold text-slate-800">Total Producto:</span>
                        <span className="text-xl font-bold text-primary">S/.{(product.precio + totalSalsas).toFixed(2)}</span>
                    </div>
                    <button onClick={() => onConfirm(selectedSalsas)} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg">
                        Agregar al Pedido
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SauceModal;