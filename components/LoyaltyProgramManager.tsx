
import React, { useState } from 'react';
import type { LoyaltyProgram, Producto } from '../types';
import { PlusIcon, TrashIcon, AdjustmentsHorizontalIcon as PencilIcon, CheckCircleIcon } from './icons';
import LoyaltyProgramModal from './LoyaltyProgramModal';
import { useAppContext } from '../store';

interface LoyaltyProgramManagerProps {
    programs: LoyaltyProgram[];
    setPrograms: React.Dispatch<React.SetStateAction<LoyaltyProgram[]>>; // Kept for type compatibility but unused with dispatch
    products: Producto[];
}

const LoyaltyProgramManager: React.FC<LoyaltyProgramManagerProps> = ({ programs, products }) => {
    const { dispatch } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState<LoyaltyProgram | null>(null);

    const handleAddNew = () => {
        setEditingProgram(null);
        setIsModalOpen(true);
    };

    const handleEdit = (program: LoyaltyProgram) => {
        setEditingProgram(program);
        setIsModalOpen(true);
    };
    
    const handleDelete = (program: LoyaltyProgram) => {
        if(window.confirm(`¿Estás seguro de eliminar el programa "${program.name}"?`)) {
            dispatch({ type: 'DELETE_LOYALTY_PROGRAM', payload: program.id });
        }
    }
    
    const handleSave = (programToSave: LoyaltyProgram) => {
        if (editingProgram) {
            dispatch({ type: 'UPDATE_LOYALTY_PROGRAM', payload: programToSave });
        } else {
            dispatch({ type: 'ADD_LOYALTY_PROGRAM', payload: programToSave });
        }
        setIsModalOpen(false);
    };

    const handleToggleActive = (program: LoyaltyProgram) => {
        // Deactivate all others first (optional, depends on if we enforce single active program in UI)
        // For now, let's just toggle this one. Ideally, trigger a DB function or multiple updates.
        // Assuming we want exclusive active program:
        
        // 1. Deactivate current active ones
        programs.filter(p => p.isActive && p.id !== program.id).forEach(p => {
             dispatch({ type: 'UPDATE_LOYALTY_PROGRAM', payload: { ...p, isActive: false } });
        });

        // 2. Activate target
        dispatch({ type: 'UPDATE_LOYALTY_PROGRAM', payload: { ...program, isActive: true } });
    };

    const activeProgram = programs.find(p => p.isActive);

    return (
        <div>
            {isModalOpen && <LoyaltyProgramModal program={editingProgram} onSave={handleSave} onClose={() => setIsModalOpen(false)} products={products} />}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary dark:text-zinc-200">Programa de Lealtad</h2>
                <button onClick={handleAddNew} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform hover:-translate-y-0.5 active:scale-95">
                    <PlusIcon className="h-5 w-5" />
                    Crear Programa
                </button>
            </div>
            {activeProgram ? (
                <div className="bg-background dark:bg-zinc-900/50 rounded-xl border border-primary p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg text-primary">{activeProgram.name}</h3>
                            <p className="text-sm text-text-secondary dark:text-zinc-400">{activeProgram.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/20 text-primary">Activo</span>
                             <button onClick={() => handleEdit(activeProgram)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-md"><PencilIcon className="h-5 w-5"/></button>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-primary/20">
                        <p className="text-sm font-semibold mb-2">Reglas:</p>
                        <ul className="text-sm list-disc list-inside text-text-secondary dark:text-zinc-400">
                           {activeProgram.config.pointEarningMethod === 'monto' 
                                ? <li>{`Gana ${activeProgram.config.pointsPerMonto} puntos por cada S/. ${activeProgram.config.montoForPoints} gastados.`}</li>
                                : <li>{`Gana ${activeProgram.config.pointsPerCompra} puntos por cada compra.`}</li>
                           }
                        </ul>
                         <p className="text-sm font-semibold mt-3 mb-2">Recompensas:</p>
                        <div className="space-y-1">
                            {activeProgram.rewards.map(reward => (
                                <div key={reward.id} className="flex justify-between text-sm">
                                    <span>{reward.nombre}</span>
                                    <span className="font-bold text-primary">{reward.puntosRequeridos} pts</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <p className="text-center text-text-secondary dark:text-zinc-500 py-8">No hay ningún programa de lealtad activo.</p>
            )}
             {programs.filter(p => !p.isActive).length > 0 && (
                 <div className="mt-6">
                    <h3 className="font-bold text-lg mb-2">Programas Inactivos</h3>
                    <div className="space-y-2">
                         {programs.filter(p => !p.isActive).map(program => (
                             <div key={program.id} className="bg-background dark:bg-zinc-900/50 rounded-xl border border-text-primary/5 dark:border-zinc-700 p-3 flex justify-between items-center">
                                 <div>
                                     <p className="font-semibold">{program.name}</p>
                                     <p className="text-sm text-text-secondary dark:text-zinc-400">{program.rewards.length} recompensas</p>
                                 </div>
                                  <div className="flex items-center gap-2">
                                     <button onClick={() => handleToggleActive(program)} className="text-sm font-semibold flex items-center gap-1 bg-success/10 text-success p-2 rounded-md hover:bg-success/20"><CheckCircleIcon className="h-4 w-4"/> Activar</button>
                                     <button onClick={() => handleEdit(program)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-md"><PencilIcon className="h-5 w-5"/></button>
                                     <button onClick={() => handleDelete(program)} className="p-2 text-danger dark:text-red-500 hover:bg-danger/10 rounded-md"><TrashIcon className="h-5 w-5"/></button>
                                </div>
                             </div>
                         ))}
                    </div>
                 </div>
             )}
        </div>
    );
};

export default LoyaltyProgramManager;
