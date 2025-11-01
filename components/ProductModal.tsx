import React, { useState, ChangeEvent } from 'react';
import type { Producto } from '../types';

interface ProductModalProps {
    product: Producto | null;
    onSave: (product: Producto) => void;
    onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onSave, onClose }) => {
    const [formData, setFormData] = useState<Producto>({
        id: product?.id || '',
        nombre: product?.nombre || '',
        categoria: product?.categoria || 'Hamburguesas',
        precio: product?.precio || 0,
        costo: product?.costo || 0,
        stock: product?.stock || 0,
        descripcion: product?.descripcion || '',
        imagenUrl: product?.imagenUrl || '',
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        let processedValue: string | number = value;
        if (type === 'number') {
            processedValue = value === '' ? '' : parseFloat(value);
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4" onClick={onClose}>
            <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col animate-fade-in-scale" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-slate-100 mb-6">{product ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h2>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-32 h-32 rounded-lg bg-background dark:bg-slate-700/50 flex-shrink-0 flex items-center justify-center border-2 border-dashed border-text-primary/10 dark:border-slate-600 overflow-hidden">
                             {formData.imagenUrl ? (
                                <img src={formData.imagenUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-text-secondary dark:text-slate-500 text-xs text-center">Sin Imagen</span>
                            )}
                        </div>
                        <div className="flex-grow">
                             <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">URL de la Imagen</label>
                             <input 
                                type="text" 
                                name="imagenUrl" 
                                value={formData.imagenUrl} 
                                onChange={handleChange}
                                placeholder="https://i.postimg.cc/..."
                                className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2" 
                             />
                             <p className="text-xs text-text-secondary dark:text-slate-500 mt-2">Pega la URL de una imagen. Recomendamos usar <a href="https://postimages.org/" target="_blank" rel="noopener noreferrer" className="text-primary underline font-semibold">Postimages</a>.</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Nombre del Producto</label>
                        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Descripción</label>
                        <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows={2} className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Categoría</label>
                            <select name="categoria" value={formData.categoria} onChange={handleChange} className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2">
                                <option>Hamburguesas</option>
                                <option>Pollo Broaster</option>
                                <option>Alitas</option>
                                <option>Salchipapas y Mixtos</option>
                                <option>Para Picar</option>
                                <option>Bebidas</option>
                                <option>Postres</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Stock Inicial</label>
                            <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Precio de Venta (S/.)</label>
                            <input type="number" name="precio" value={formData.precio} onChange={handleChange} step="0.01" className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Costo (S/.)</label>
                            <input type="number" name="costo" value={formData.costo} onChange={handleChange} step="0.01" className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2" required />
                        </div>
                    </div>
                </form>
                <div className="pt-6 mt-auto grid grid-cols-2 gap-4">
                    <button type="button" onClick={onClose} className="w-full bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-3 px-4 rounded-lg transition-colors active:scale-95">Cancelar</button>
                    <button type="submit" onClick={handleSubmit} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-all active:scale-95 shadow-md">Guardar Producto</button>
                </div>
            </div>
        </div>
    );
};

export default ProductModal;