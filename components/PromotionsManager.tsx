import React, { useState } from 'react';
import type { Promocion, Producto } from '../types';
import { PlusIcon, TrashIcon, AdjustmentsHorizontalIcon as PencilIcon, SparklesIcon } from './icons';
import PromotionModal from './PromotionModal';

interface PromotionsManagerProps {
    promotions: Promocion[];
    setPromotions: React.Dispatch<React.SetStateAction<Promocion[]>>;
    products: Producto[];
}

const PromotionsManager: React.FC<PromotionsManagerProps> = ({ promotions, setPromotions, products }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState<Promocion | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<Promocion | null>(null);

    const handleAddNew = () => {
        setEditingPromotion(null);
        setIsModalOpen(true);
    };

    const handleEdit = (promo: Promocion) => {
        setEditingPromotion(promo);
        setIsModalOpen(true);
    };

    const handleDelete = (promoToDelete: Promocion) => {
        setPromotions(prev => prev.filter(p => p.id !== promoToDelete.id));
        setShowDeleteConfirm(null);
    };

    const handleSave = (promoToSave: Promocion) => {
        setPromotions(prev => {
            if (editingPromotion) {
                return prev.map(p => p.id === promoToSave.id ? promoToSave : p);
            } else {
                return [...prev, { ...promoToSave, id: `promo-${Date.now()}` }];
            }
        });
        setIsModalOpen(false);
    };

    const handleToggleActive = (promoId: string) => {
        setPromotions(prev => prev.map(p => p.id === promoId ? { ...p, isActive: !p.isActive } : p));
    };

    return (
        <div>
            {isModalOpen && <PromotionModal promotion={editingPromotion} onSave={handleSave} onClose={() => setIsModalOpen(false)} products={products} />}
            {showDeleteConfirm && (
                 <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4">
                    <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full text-center animate-fade-in-scale">
                        <h3 className="text-xl font-heading font-bold text-text-primary dark:text-white">Eliminar Promoción</h3>
                        <p className="text-text-secondary dark:text-slate-400 my-3">¿Estás seguro de que quieres eliminar <span className="font-bold">{showDeleteConfirm.nombre}</span>? Esta acción no se puede deshacer.</p>
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <button onClick={() => setShowDeleteConfirm(null)} className="bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                            <button onClick={() => handleDelete(showDeleteConfirm)} className="bg-danger hover:brightness-110 text-white font-bold py-2 px-4 rounded-lg">Sí, Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary dark:text-slate-200">Gestión de Promociones ({promotions.length})</h2>
                <button onClick={handleAddNew} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform hover:-translate-y-0.5 active:scale-95">
                    <PlusIcon className="h-5 w-5" />
                    Crear Promoción
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-h-[calc(100vh-22rem)] overflow-y-auto pr-3">
                {promotions.map(promo => (
                    <div key={promo.id} className={`bg-background dark:bg-slate-900/50 rounded-xl shadow-sm border ${promo.isActive ? 'border-primary' : 'border-text-primary/5 dark:border-slate-700'} flex flex-col overflow-hidden`}>
                        <div className="h-40 w-full bg-background dark:bg-slate-800 flex items-center justify-center text-text-secondary/20 dark:text-slate-700">
                            {promo.imagenUrl ? (
                                <img src={promo.imagenUrl} alt={promo.nombre} className="w-full h-full object-cover"/>
                            ) : (
                                <SparklesIcon className="h-16 w-16" />
                            )}
                        </div>
                        <div className="p-4 flex-grow flex flex-col">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg text-text-primary dark:text-slate-100 pr-4">{promo.nombre}</h3>
                                <div className="flex items-center gap-2">
                                     <span className={`text-xs font-bold px-2 py-1 rounded-full ${promo.isActive ? 'bg-primary/20 text-primary' : 'bg-text-primary/10 text-text-secondary'}`}>{promo.isActive ? "Activa" : "Inactiva"}</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input type="checkbox" checked={promo.isActive} onChange={() => handleToggleActive(promo.id)} className="sr-only peer" />
                                      <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary dark:text-slate-400 flex-grow mt-1">{promo.descripcion || 'Sin descripción.'}</p>
                            <div className="mt-3 pt-3 border-t border-text-primary/10 dark:border-slate-700 space-y-1">
                                <p className="text-xs text-text-secondary dark:text-slate-500 font-semibold uppercase">{promo.tipo.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <div className="bg-background/50 dark:bg-slate-800/50 p-2 grid grid-cols-2 gap-2">
                             <button onClick={() => handleEdit(promo)} className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 p-2 rounded-md transition-colors"><PencilIcon className="h-4 w-4"/> Editar</button>
                             <button onClick={() => setShowDeleteConfirm(promo)} className="flex items-center justify-center gap-2 text-sm font-semibold text-danger dark:text-red-500 hover:bg-danger/10 p-2 rounded-md transition-colors"><TrashIcon className="h-4 w-4"/> Eliminar</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PromotionsManager;