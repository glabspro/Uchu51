import React, { useState, useRef } from 'react';
import type { Producto, Salsa, ProductoPedido } from '../types';
import { MinusIcon, PlusIcon, XMarkIcon, SparklesIcon } from './icons';
import SauceModal from './SauceModal';

interface ProductDetailModalProps {
    product: Producto;
    onClose: () => void;
    onAddToCart: (item: Omit<ProductoPedido, 'cartItemId' | 'sentToKitchen'>, imageElement: HTMLImageElement | null) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose, onAddToCart }) => {
    const [quantity, setQuantity] = useState(1);
    const [selectedSausas, setSelectedSausas] = useState<Salsa[]>([]);
    const [isSauceModalOpen, setIsSauceModalOpen] = useState(false);
    const imageRef = useRef<HTMLImageElement>(null);

    const handleAddToCartClick = () => {
        onAddToCart({
            id: product.id,
            nombre: product.nombre,
            cantidad: quantity,
            precio: product.precio,
            imagenUrl: product.imagenUrl,
            salsas: selectedSausas,
        }, imageRef.current);
    };
    
    const handleConfirmSauces = (salsas: Salsa[]) => {
        setSelectedSausas(salsas);
        setIsSauceModalOpen(false);
    };

    const totalSaucePrice = selectedSausas.reduce((sum, s) => sum + s.precio, 0);
    const totalItemPrice = (product.precio + totalSaucePrice) * quantity;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-end sm:items-center z-[101] p-0 sm:p-4" onClick={onClose}>
            {isSauceModalOpen && (
                <SauceModal
                    product={product}
                    initialSalsas={selectedSausas}
                    onClose={() => setIsSauceModalOpen(false)}
                    onConfirm={handleConfirmSauces}
                />
            )}
            <div
                className="bg-surface dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in-up border-t sm:border border-text-primary/10 dark:border-slate-700"
                onClick={e => e.stopPropagation()}
            >
                <div className="h-48 sm:h-64 w-full relative">
                    <img ref={imageRef} src={product.imagenUrl} alt={product.nombre} className="w-full h-full object-cover rounded-t-2xl sm:rounded-t-lg" />
                     <button onClick={onClose} className="absolute top-4 right-4 bg-black/40 p-2 rounded-full text-white hover:bg-black/60 transition-colors z-10">
                        <XMarkIcon className="h-6 w-6" />
                     </button>
                </div>

                <div className="p-6 flex-grow overflow-y-auto">
                    <h2 className="text-3xl font-heading font-bold text-text-primary dark:text-slate-100">{product.nombre}</h2>
                    <p className="text-text-secondary dark:text-slate-400 mt-2">{product.descripcion}</p>
                    
                    <div className="mt-4 pt-4 border-t border-text-primary/10 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="font-semibold text-text-primary dark:text-slate-200">Cremas Seleccionadas</h3>
                             <span className="text-sm font-mono text-text-secondary dark:text-slate-400">
                                + S/.{(totalSaucePrice * quantity).toFixed(2)}
                             </span>
                        </div>
                        {selectedSausas.length > 0 ? (
                            <div className="bg-background dark:bg-slate-700/50 p-3 rounded-lg mb-3">
                                <p className="text-sm text-primary dark:text-orange-400">{selectedSausas.map(s => s.nombre).join(', ')}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-text-secondary dark:text-slate-400 mb-3">Ninguna seleccionada.</p>
                        )}
                        <button onClick={() => setIsSauceModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary dark:bg-orange-500/20 dark:hover:bg-orange-500/30 dark:text-orange-300 font-bold py-3 px-6 rounded-xl transition-all active:scale-95 border-2 border-primary/20 hover:border-primary/40 shadow-sm hover:shadow-md">
                             <SparklesIcon className="h-5 w-5"/>
                            {selectedSausas.length > 0 ? 'Editar Cremas' : 'Añade tu Crema'}
                        </button>
                    </div>
                </div>

                <div className="p-6 border-t border-text-primary/10 dark:border-slate-700 mt-auto bg-background dark:bg-slate-900/50 rounded-b-2xl sm:rounded-b-lg">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="bg-text-primary/10 dark:bg-slate-700 rounded-full h-10 w-10 flex items-center justify-center font-bold text-text-primary dark:text-slate-200 hover:bg-text-primary/20 dark:hover:bg-slate-600 transition-transform active:scale-90">
                                <MinusIcon className="h-5 w-5"/>
                            </button>
                            <span className="font-bold text-xl w-8 text-center dark:text-slate-200">{quantity}</span>
                            <button onClick={() => setQuantity(q => q + 1)} className="bg-text-primary/10 dark:bg-slate-700 rounded-full h-10 w-10 flex items-center justify-center font-bold text-text-primary dark:text-slate-200 hover:bg-text-primary/20 dark:hover:bg-slate-600 transition-transform active:scale-90">
                                <PlusIcon className="h-5 w-5"/>
                            </button>
                        </div>
                        <button onClick={handleAddToCartClick} className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95">
                            Añadir por S/.{totalItemPrice.toFixed(2)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailModal;