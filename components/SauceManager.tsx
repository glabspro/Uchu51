import React, { useState } from 'react';
import type { Salsa } from '../types';
import { PlusIcon, TrashIcon, AdjustmentsHorizontalIcon as PencilIcon } from './icons';
import SauceEditorModal from './SauceEditorModal';

interface SauceManagerProps {
    salsas: Salsa[];
    setSalsas: (salsas: Salsa[]) => void;
}

const SauceManager: React.FC<SauceManagerProps> = ({ salsas, setSalsas }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSauce, setEditingSauce] = useState<Salsa | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<Salsa | null>(null);

    const handleAddNew = () => {
        setEditingSauce(null);
        setIsModalOpen(true);
    };

    const handleEdit = (sauce: Salsa) => {
        setEditingSauce(sauce);
        setIsModalOpen(true);
    };

    const handleDelete = (sauceToDelete: Salsa) => {
        setSalsas(salsas.filter(s => s.nombre !== sauceToDelete.nombre));
        setShowDeleteConfirm(null);
    };

    const handleSave = (sauceToSave: Omit<Salsa, 'isAvailable'>) => {
        if (editingSauce) {
            setSalsas(salsas.map(s => s.nombre === editingSauce.nombre ? { ...s, ...sauceToSave } : s));
        } else {
            setSalsas([...salsas, { ...sauceToSave, isAvailable: true }]);
        }
        setIsModalOpen(false);
    };

    const handleToggleAvailable = (sauceName: string) => {
        setSalsas(salsas.map(s => s.nombre === sauceName ? { ...s, isAvailable: !s.isAvailable } : s));
    };

    return (
        <div>
            {isModalOpen && <SauceEditorModal sauce={editingSauce} onSave={handleSave} onClose={() => setIsModalOpen(false)} allSalsas={salsas} />}
            {showDeleteConfirm && (
                 <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[102] p-4">
                    <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full text-center animate-fade-in-scale">
                        <h3 className="text-xl font-heading font-bold text-text-primary dark:text-white">Eliminar Crema</h3>
                        <p className="text-text-secondary dark:text-slate-400 my-3">¿Estás seguro de que quieres eliminar <span className="font-bold">{showDeleteConfirm.nombre}</span>? Esta acción no se puede deshacer.</p>
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <button onClick={() => setShowDeleteConfirm(null)} className="bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-2 px-4 rounded-lg transition-colors active:scale-95">Cancelar</button>
                            <button onClick={() => handleDelete(showDeleteConfirm)} className="bg-danger hover:brightness-110 text-white font-bold py-2 px-4 rounded-lg transition-all active:scale-95">Sí, Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary dark:text-slate-200">Gestor de Cremas ({salsas.length})</h2>
                <button onClick={handleAddNew} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform hover:-translate-y-0.5 active:scale-95">
                    <PlusIcon className="h-5 w-5" />
                    Añadir Crema
                </button>
            </div>
            <div className="bg-background dark:bg-slate-900/50 rounded-xl border border-text-primary/5 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto max-h-[calc(100vh-22rem)]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-surface dark:bg-slate-700/50 sticky top-0">
                            <tr>
                                <th className="p-4 font-semibold">Nombre</th>
                                <th className="p-4 font-semibold text-center">Precio</th>
                                <th className="p-4 font-semibold text-center">Disponible</th>
                                <th className="p-4 font-semibold text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-text-primary/5 dark:divide-slate-700">
                            {salsas.map(sauce => (
                                <tr key={sauce.nombre} className="hover:bg-text-primary/5 dark:hover:bg-slate-700/30">
                                    <td className="p-4 font-medium text-text-primary dark:text-slate-200">{sauce.nombre}</td>
                                    <td className="p-4 text-text-secondary dark:text-slate-400 font-mono text-center">S/.{sauce.precio.toFixed(2)}</td>
                                    <td className="p-4 text-center">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                          <input type="checkbox" checked={sauce.isAvailable} onChange={() => handleToggleAvailable(sauce.nombre)} className="sr-only peer" />
                                          <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                        </label>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleEdit(sauce)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"><PencilIcon className="h-5 w-5"/></button>
                                            <button onClick={() => setShowDeleteConfirm(sauce)} className="p-2 text-danger dark:text-red-500 hover:bg-danger/10 rounded-md transition-colors"><TrashIcon className="h-5 w-5"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SauceManager;
