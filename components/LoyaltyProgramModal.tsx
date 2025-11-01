import React, { useState } from 'react';
import type { LoyaltyProgram, Recompensa, Producto } from '../types';
import RewardModal from './RewardModal';
import { PlusIcon, TrashIcon, AdjustmentsHorizontalIcon as PencilIcon } from './icons';

interface LoyaltyProgramModalProps {
    program: LoyaltyProgram | null;
    onSave: (program: LoyaltyProgram) => void;
    onClose: () => void;
    products: Producto[];
}

const LoyaltyProgramModal: React.FC<LoyaltyProgramModalProps> = ({ program, onSave, onClose, products }) => {
    const [formData, setFormData] = useState<LoyaltyProgram>({
        id: program?.id || '',
        name: program?.name || '',
        description: program?.description || '',
        isActive: program?.isActive || false,
        config: program?.config || {
            pointEarningMethod: 'monto',
            pointsPerMonto: 5,
            montoForPoints: 10,
            pointsPerCompra: 5,
        },
        rewards: program?.rewards || [],
    });

    const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
    const [editingReward, setEditingReward] = useState<Recompensa | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        let processedValue: string | number = value;
        if (type === 'number') {
            processedValue = value === '' ? 0 : parseInt(value, 10);
        }
        setFormData(prev => ({ ...prev, config: { ...prev.config, [name]: processedValue } }));
    };
    
    const handleMethodChange = (method: 'monto' | 'compra') => {
        setFormData(prev => ({...prev, config: {...prev.config, pointEarningMethod: method }}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    // Reward management
    const handleAddNewReward = () => {
        setEditingReward(null);
        setIsRewardModalOpen(true);
    };

    const handleEditReward = (reward: Recompensa) => {
        setEditingReward(reward);
        setIsRewardModalOpen(true);
    };

    const handleDeleteReward = (rewardId: string) => {
        setFormData(prev => ({ ...prev, rewards: prev.rewards.filter(r => r.id !== rewardId) }));
    };

    const handleSaveReward = (rewardToSave: Recompensa) => {
        if (editingReward) {
            setFormData(prev => ({ ...prev, rewards: prev.rewards.map(r => r.id === rewardToSave.id ? rewardToSave : r) }));
        } else {
            setFormData(prev => ({ ...prev, rewards: [...prev.rewards, { ...rewardToSave, id: `rec-${Date.now()}` }] }));
        }
        setIsRewardModalOpen(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4" onClick={onClose}>
             {isRewardModalOpen && <RewardModal reward={editingReward} onSave={handleSaveReward} onClose={() => setIsRewardModalOpen(false)} products={products} />}
            <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-3xl w-full max-h-[90vh] flex flex-col animate-fade-in-scale" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-slate-100 mb-6">{program ? 'Editar Programa de Lealtad' : 'Crear Programa de Lealtad'}</h2>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Details & Rules */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg text-text-primary dark:text-slate-200 border-b border-text-primary/10 dark:border-slate-700 pb-2">Detalles y Reglas</h3>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Nombre del Programa</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Descripción (Opcional)</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2" />
                        </div>
                        <div className="space-y-3 pt-2">
                             <label className="flex flex-col gap-2 bg-background dark:bg-slate-700/50 p-3 rounded-lg cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:ring-2 has-[:checked]:ring-primary">
                                <div className="flex items-center gap-3">
                                    <input type="radio" checked={formData.config.pointEarningMethod === 'monto'} onChange={() => handleMethodChange('monto')} className="h-4 w-4 text-primary focus:ring-primary border-text-primary/20 bg-transparent" />
                                    <span className="font-semibold flex-grow">Por Monto de Compra</span>
                                </div>
                                <div className="flex items-center gap-2 pl-7">
                                    <input type="number" name="pointsPerMonto" value={formData.config.pointsPerMonto} onChange={handleConfigChange} disabled={formData.config.pointEarningMethod !== 'monto'} className="w-16 bg-surface dark:bg-slate-700 p-1 rounded-md text-center border border-text-primary/10 dark:border-slate-600 disabled:opacity-50" />
                                    <span className="text-sm">puntos por cada S/.</span>
                                    <input type="number" name="montoForPoints" value={formData.config.montoForPoints} onChange={handleConfigChange} disabled={formData.config.pointEarningMethod !== 'monto'} className="w-16 bg-surface dark:bg-slate-700 p-1 rounded-md text-center border border-text-primary/10 dark:border-slate-600 disabled:opacity-50" />
                                </div>
                            </label>
                            <label className="flex items-center gap-3 bg-background dark:bg-slate-700/50 p-3 rounded-lg cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:ring-2 has-[:checked]:ring-primary">
                                <input type="radio" checked={formData.config.pointEarningMethod === 'compra'} onChange={() => handleMethodChange('compra')} className="h-4 w-4 text-primary focus:ring-primary border-text-primary/20 bg-transparent" />
                                <span className="font-semibold flex-grow">Por Número de Compras</span>
                                <div className="flex items-center gap-2">
                                    <input type="number" name="pointsPerCompra" value={formData.config.pointsPerCompra} onChange={handleConfigChange} disabled={formData.config.pointEarningMethod !== 'compra'} className="w-16 bg-surface dark:bg-slate-700 p-1 rounded-md text-center border border-text-primary/10 dark:border-slate-600 disabled:opacity-50" />
                                    <span className="text-sm">puntos</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Right Column: Rewards */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-text-primary/10 dark:border-slate-700 pb-2">
                            <h3 className="font-bold text-lg text-text-primary dark:text-slate-200">Recompensas del Programa</h3>
                            <button type="button" onClick={handleAddNewReward} className="flex items-center gap-2 bg-primary/20 text-primary font-bold py-1 px-3 rounded-lg text-sm hover:bg-primary/30">
                                <PlusIcon className="h-4 w-4" /> Añadir
                            </button>
                        </div>
                         <div className="space-y-2">
                            {formData.rewards.length > 0 ? (
                                formData.rewards.map(reward => (
                                    <div key={reward.id} className="bg-background dark:bg-slate-700/50 p-2.5 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-text-primary dark:text-slate-200">{reward.nombre}</p>
                                            <p className="text-sm text-primary dark:text-orange-400 font-bold">{reward.puntosRequeridos} Puntos</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button type="button" onClick={() => handleEditReward(reward)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-md"><PencilIcon className="h-5 w-5"/></button>
                                            <button type="button" onClick={() => handleDeleteReward(reward.id)} className="p-2 text-danger dark:text-red-500 hover:bg-danger/10 rounded-md"><TrashIcon className="h-5 w-5"/></button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-text-secondary dark:text-slate-500 py-8 text-sm">Aún no hay recompensas en este programa.</p>
                            )}
                        </div>
                    </div>
                </form>
                <div className="pt-6 mt-auto grid grid-cols-2 gap-4">
                    <button type="button" onClick={onClose} className="w-full bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-3 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" onClick={handleSubmit} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg shadow-md">Guardar Programa</button>
                </div>
            </div>
        </div>
    );
};

export default LoyaltyProgramModal;