
import React, { useState } from 'react';
import type { ProductoPedido, Salsa } from '../types';
import { SparklesIcon, CheckCircleIcon, XMarkIcon } from './icons';
import SauceModal from './SauceModal';

interface PromoCustomizationModalProps {
    promoName: string;
    initialItems: any[]; // Using any to allow 'category' property check
    onConfirm: (finalItems: ProductoPedido[]) => void;
    onClose: () => void;
}

const PromoCustomizationModal: React.FC<PromoCustomizationModalProps> = ({ promoName, initialItems, onConfirm, onClose }) => {
    const [items, setItems] = useState<any[]>(initialItems);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

    const handleEditSauces = (index: number) => {
        setEditingItemIndex(index);
    };

    const handleSaucesConfirmed = (salsas: Salsa[]) => {
        if (editingItemIndex === null) return;
        setItems(prev => prev.map((item, idx) => 
            idx === editingItemIndex ? { ...item, salsas } : item
        ));
        setEditingItemIndex(null);
    };

    const handleConfirmAll = () => {
        // Clean up temporary properties if any before passing back
        const cleanItems = items.map(({ category, ...rest }) => rest as ProductoPedido);
        onConfirm(cleanItems);
    };

    const currentEditingItem = editingItemIndex !== null ? items[editingItemIndex] : null;
    
    // Helper to determine if an item allows sauces
    const canHaveSauces = (item: any) => {
        if (!item.category) return true; // Default to true if unknown
        return !['Bebidas', 'Postres', 'Extras'].includes(item.category);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[105] p-4 font-sans" onClick={onClose}>
            {currentEditingItem && (
                <SauceModal
                    product={currentEditingItem} 
                    initialSalsas={currentEditingItem.salsas}
                    onClose={() => setEditingItemIndex(null)}
                    onConfirm={handleSaucesConfirmed}
                />
            )}
            
            <div className="bg-surface dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-md flex flex-col animate-fade-in-scale max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-text-primary/10 dark:border-zinc-700 bg-primary/10 dark:bg-orange-500/10 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-heading font-bold text-text-primary dark:text-zinc-100 flex items-center gap-2">
                            <SparklesIcon className="h-6 w-6 text-primary dark:text-orange-400"/>
                            Personaliza tu Combo
                        </h2>
                        <p className="text-sm text-text-secondary dark:text-zinc-300 mt-1 font-medium">{promoName}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                        <XMarkIcon className="h-6 w-6 text-text-secondary dark:text-zinc-400" />
                    </button>
                </div>

                <div className="p-4 flex-grow overflow-y-auto space-y-3 bg-background dark:bg-zinc-900/50">
                    <p className="text-sm font-bold text-text-secondary dark:text-zinc-400 uppercase tracking-wider text-xs mb-2">
                        Contenido del Combo:
                    </p>
                    {items.map((item, index) => {
                        const allowsSauces = canHaveSauces(item);
                        return (
                            <div key={index} className="bg-surface dark:bg-zinc-800 p-3 rounded-xl border border-text-primary/5 dark:border-zinc-700 flex justify-between items-center shadow-sm">
                                <div>
                                    <p className="font-bold text-text-primary dark:text-zinc-200">{item.nombre}</p>
                                    {allowsSauces ? (
                                        item.salsas && item.salsas.length > 0 ? (
                                            <p className="text-xs text-primary dark:text-orange-400 mt-1 font-medium">
                                                + {item.salsas.map((s: any) => s.nombre).join(', ')}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-text-secondary dark:text-zinc-500 mt-1 italic">Sin cremas seleccionadas</p>
                                        )
                                    ) : (
                                        <p className="text-xs text-text-secondary/50 dark:text-zinc-600 mt-1">No lleva cremas</p>
                                    )}
                                </div>
                                {allowsSauces && (
                                    <button 
                                        onClick={() => handleEditSauces(index)}
                                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors border ${
                                            item.salsas && item.salsas.length > 0 
                                            ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' 
                                            : 'bg-background dark:bg-zinc-700 text-text-secondary dark:text-zinc-300 border-text-primary/10 dark:border-zinc-600 hover:bg-text-primary/5'
                                        }`}
                                    >
                                        {item.salsas && item.salsas.length > 0 ? 'Editar' : 'Elegir Cremas'}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="p-5 border-t border-text-primary/10 dark:border-zinc-700 mt-auto bg-surface dark:bg-zinc-800">
                    <button 
                        onClick={handleConfirmAll}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        <CheckCircleIcon className="h-5 w-5" />
                        Agregar al Carrito
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromoCustomizationModal;
