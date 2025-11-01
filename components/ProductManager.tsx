import React, { useState } from 'react';
import type { Producto } from '../types';
import { PlusIcon, TrashIcon, AdjustmentsHorizontalIcon as PencilIcon } from './icons';
import ProductModal from './ProductModal';

interface ProductManagerProps {
    products: Producto[];
    setProducts: React.Dispatch<React.SetStateAction<Producto[]>>;
}

const ProductManager: React.FC<ProductManagerProps> = ({ products, setProducts }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<Producto | null>(null);

    const handleAddNew = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product: Producto) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = (productToDelete: Producto) => {
        setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
        setShowDeleteConfirm(null);
    };

    const handleSave = (productToSave: Producto) => {
        if (editingProduct) {
            setProducts(prev => prev.map(p => p.id === productToSave.id ? productToSave : p));
        } else {
            setProducts(prev => [...prev, { ...productToSave, id: `prod-${Date.now()}` }]);
        }
        setIsModalOpen(false);
    };

    return (
        <div>
            {isModalOpen && <ProductModal product={editingProduct} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            {showDeleteConfirm && (
                 <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4">
                    <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full text-center animate-fade-in-scale">
                        <h3 className="text-xl font-heading font-bold text-text-primary dark:text-white">Eliminar Producto</h3>
                        <p className="text-text-secondary dark:text-slate-400 my-3">¿Estás seguro de que quieres eliminar <span className="font-bold">{showDeleteConfirm.nombre}</span>? Esta acción no se puede deshacer.</p>
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <button onClick={() => setShowDeleteConfirm(null)} className="bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-2 px-4 rounded-lg transition-colors active:scale-95">Cancelar</button>
                            <button onClick={() => handleDelete(showDeleteConfirm)} className="bg-danger hover:brightness-110 text-white font-bold py-2 px-4 rounded-lg transition-all active:scale-95">Sí, Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary dark:text-slate-200">Menú de Productos ({products.length})</h2>
                <button onClick={handleAddNew} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform hover:-translate-y-0.5 active:scale-95">
                    <PlusIcon className="h-5 w-5" />
                    Añadir Producto
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[calc(100vh-22rem)] overflow-y-auto pr-3">
                {products.map(product => (
                    <div key={product.id} className="bg-background dark:bg-slate-900/50 rounded-xl overflow-hidden shadow-sm border border-text-primary/5 dark:border-slate-700 flex flex-col">
                        <img src={product.imagenUrl} alt={product.nombre} className="w-full h-40 object-cover" />
                        <div className="p-4 flex-grow flex flex-col">
                            <h3 className="font-bold text-lg text-text-primary dark:text-slate-100">{product.nombre}</h3>
                            <p className="text-sm text-text-secondary dark:text-slate-400">{product.categoria}</p>
                            <div className="mt-2 pt-2 border-t border-text-primary/10 dark:border-slate-700 flex-grow">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary dark:text-slate-400">Precio:</span>
                                    <span className="font-bold text-text-primary dark:text-slate-200">S/.{product.precio.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary dark:text-slate-400">Costo:</span>
                                    <span className="font-bold text-text-primary dark:text-slate-200">S/.{product.costo.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary dark:text-slate-400">Stock:</span>
                                    <span className={`font-bold ${product.stock < 10 ? 'text-danger' : 'text-text-primary dark:text-slate-200'}`}>{product.stock}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-background/50 dark:bg-slate-800/50 p-2 grid grid-cols-2 gap-2">
                            <button onClick={() => handleEdit(product)} className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 p-2 rounded-md transition-colors"><PencilIcon className="h-4 w-4"/> Editar</button>
                            <button onClick={() => setShowDeleteConfirm(product)} className="flex items-center justify-center gap-2 text-sm font-semibold text-danger dark:text-red-500 hover:bg-danger/10 p-2 rounded-md transition-colors"><TrashIcon className="h-4 w-4"/> Eliminar</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductManager;
