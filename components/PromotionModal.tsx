import React, { useState } from 'react';
import type { Promocion, Producto, TipoPromocion } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface PromotionModalProps {
    promotion: Promocion | null;
    onSave: (promotion: Promocion) => void;
    onClose: () => void;
    products: Producto[];
}

const PromotionModal: React.FC<PromotionModalProps> = ({ promotion, onSave, onClose, products }) => {
    const [formData, setFormData] = useState<Omit<Promocion, 'id'>>({
        nombre: promotion?.nombre || '',
        descripcion: promotion?.descripcion || '',
        imagenUrl: promotion?.imagenUrl || '',
        tipo: promotion?.tipo || 'combo_fijo',
        isActive: promotion?.isActive || false,
        condiciones: promotion?.condiciones || {},
    });

    const handleTypeChange = (tipo: TipoPromocion) => {
        setFormData(prev => ({ ...prev, tipo, condiciones: {} }));
    };
    
    const handleConditionChange = (field: string, value: any) => {
        setFormData(prev => ({...prev, condiciones: { ...prev.condiciones, [field]: value }}));
    };
    
    const handleComboProductChange = (index: number, field: 'productoId' | 'cantidad', value: string) => {
        const updatedProductos = [...(formData.condiciones.productos || [])];
        updatedProductos[index] = { ...updatedProductos[index], [field]: field === 'cantidad' ? parseInt(value) || 1 : value };
        handleConditionChange('productos', updatedProductos);
    };

    const addComboProduct = () => {
        const updatedProductos = [...(formData.condiciones.productos || []), { productoId: '', cantidad: 1 }];
        handleConditionChange('productos', updatedProductos);
    };
    
    const removeComboProduct = (index: number) => {
        const updatedProductos = (formData.condiciones.productos || []).filter((_, i) => i !== index);
        handleConditionChange('productos', updatedProductos);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: promotion?.id || `promo-${Date.now()}` });
    };

    const renderConditions = () => {
        switch (formData.tipo) {
            case 'combo_fijo':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Productos del Combo</label>
                            {(formData.condiciones.productos || []).map((p, index) => (
                                <div key={index} className="flex items-center gap-2 mb-2">
                                    <select value={p.productoId} onChange={e => handleComboProductChange(index, 'productoId', e.target.value)} className="w-full bg-surface dark:bg-slate-700 p-2 rounded-md border border-text-primary/10 dark:border-slate-600">
                                        <option value="">Seleccionar producto</option>
                                        {products.map(prod => <option key={prod.id} value={prod.id}>{prod.nombre}</option>)}
                                    </select>
                                    <input type="number" value={p.cantidad} onChange={e => handleComboProductChange(index, 'cantidad', e.target.value)} min="1" className="w-20 bg-surface dark:bg-slate-700 p-2 rounded-md border border-text-primary/10 dark:border-slate-600 text-center" />
                                    <button type="button" onClick={() => removeComboProduct(index)} className="p-2 text-danger hover:bg-danger/10 rounded-full"><TrashIcon className="h-5 w-5"/></button>
                                </div>
                            ))}
                            <button type="button" onClick={addComboProduct} className="text-sm font-semibold text-primary flex items-center gap-1"><PlusIcon className="h-4 w-4"/> Añadir producto</button>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Precio Fijo del Combo (S/.)</label>
                            <input type="number" value={formData.condiciones.precioFijo || ''} onChange={e => handleConditionChange('precioFijo', parseFloat(e.target.value))} className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2" />
                        </div>
                    </div>
                );
            case 'dos_por_uno':
                return (
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Producto para 2x1</label>
                         <select value={formData.condiciones.productoId_2x1 || ''} onChange={e => handleConditionChange('productoId_2x1', e.target.value)} className="w-full bg-background dark:bg-slate-700 p-2 rounded-md border border-text-primary/10 dark:border-slate-600">
                            <option value="">Seleccionar producto</option>
                            {products.map(prod => <option key={prod.id} value={prod.id}>{prod.nombre}</option>)}
                        </select>
                    </div>
                );
            case 'descuento_porcentaje':
                 return (
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Descuento (%)</label>
                        <input type="number" value={formData.condiciones.porcentaje || ''} onChange={e => handleConditionChange('porcentaje', parseInt(e.target.value))} className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2" />
                         <p className="text-xs text-text-secondary dark:text-slate-500 mt-1">Se aplicará a toda la orden. La selección por producto se añadirá próximamente.</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[102] p-4" onClick={onClose}>
            <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col animate-fade-in-scale" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-slate-100 mb-6">{promotion ? 'Editar Promoción' : 'Crear Promoción'}</h2>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Nombre</label>
                        <input type="text" value={formData.nombre} onChange={e => setFormData(p => ({...p, nombre: e.target.value}))} className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Descripción</label>
                        <input type="text" value={formData.descripcion} onChange={e => setFormData(p => ({...p, descripcion: e.target.value}))} className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">URL de la Imagen</label>
                        <input type="text" value={formData.imagenUrl} onChange={e => setFormData(p => ({...p, imagenUrl: e.target.value}))} className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Tipo de Promoción</label>
                        <select value={formData.tipo} onChange={e => handleTypeChange(e.target.value as TipoPromocion)} className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2">
                            <option value="combo_fijo">Combo a Precio Fijo</option>
                            <option value="dos_por_uno">2x1 en Producto</option>
                            <option value="descuento_porcentaje">Descuento en %</option>
                        </select>
                    </div>
                    <div className="p-4 bg-background dark:bg-slate-700/50 rounded-lg">
                        <h3 className="font-semibold mb-2">Condiciones</h3>
                        {renderConditions()}
                    </div>
                </form>
                <div className="pt-6 mt-auto grid grid-cols-2 gap-4">
                    <button type="button" onClick={onClose} className="w-full bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-3 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" onClick={handleSubmit} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg shadow-md">Guardar Promoción</button>
                </div>
            </div>
        </div>
    );
};

export default PromotionModal;