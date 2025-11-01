import React, { useState } from 'react';
import type { LoyaltyProgram, Producto } from '../types';
import { PlusIcon, TrashIcon, AdjustmentsHorizontalIcon as PencilIcon, CheckCircleIcon } from './icons';
import LoyaltyProgramModal from './LoyaltyProgramModal';

interface LoyaltyProgramManagerProps {
    programs: LoyaltyProgram[];
    setPrograms: React.Dispatch<React.SetStateAction<LoyaltyProgram[]>>;
    products: Producto[];
}

const LoyaltyProgramManager: React.FC<LoyaltyProgramManagerProps> = ({ programs, setPrograms, products }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState<LoyaltyProgram | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<LoyaltyProgram | null>(null);

    const handleAddNew = () => {
        setEditingProgram(null);
        setIsModalOpen(true);
    };

    const handleEdit = (program: LoyaltyProgram) => {
        setEditingProgram(program);
        setIsModalOpen(true);
    };

    const handleDelete = (programToDelete: LoyaltyProgram) => {
        setPrograms(prev => prev.filter(p => p.id !== programToDelete.id));
        setShowDeleteConfirm(null);
    };

    const handleSave = (programToSave: LoyaltyProgram) => {
        setPrograms(prev => {
            if (editingProgram) {
                return prev.map(p => p.id === programToSave.id ? programToSave : p);
            } else {
                const newProgram = { ...programToSave, id: `prog-${Date.now()}` };
                // If it's the only program, make it active
                if (prev.length === 0) {
                    newProgram.isActive = true;
                }
                return [...prev, newProgram];
            }
        });
        setIsModalOpen(false);
    };
    
    const handleSetActive = (programId: string) => {
        setPrograms(prev => prev.map(p => ({
            ...p,
            isActive: p.id === programId
        })));
    };

    return (
        <div>
            {isModalOpen && <LoyaltyProgramModal program={editingProgram} onSave={handleSave} onClose={() => setIsModalOpen(false)} products={products} />}
            {showDeleteConfirm && (
                 <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4">
                    <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full text-center animate-fade-in-scale">
                        <h3 className="text-xl font-heading font-bold text-text-primary dark:text-white">Eliminar Programa</h3>
                        <p className="text-text-secondary dark:text-slate-400 my-3">¿Estás seguro de que quieres eliminar <span className="font-bold">{showDeleteConfirm.name}</span>? Esta acción no se puede deshacer.</p>
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <button onClick={() => setShowDeleteConfirm(null)} className="bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                            <button onClick={() => handleDelete(showDeleteConfirm)} className="bg-danger hover:brightness-110 text-white font-bold py-2 px-4 rounded-lg">Sí, Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary dark:text-slate-200">Programas de Lealtad ({programs.length})</h2>
                <button onClick={handleAddNew} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform hover:-translate-y-0.5 active:scale-95">
                    <PlusIcon className="h-5 w-5" />
                    Crear Programa
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-h-[calc(100vh-22rem)] overflow-y-auto pr-3">
                {programs.map(program => (
                    <div key={program.id} className={`bg-background dark:bg-slate-900/50 rounded-xl shadow-sm border-2 ${program.isActive ? 'border-primary' : 'border-text-primary/5 dark:border-slate-700'} flex flex-col`}>
                        <div className="p-4 flex-grow flex flex-col">
                            {program.isActive && (
                                <div className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                    <CheckCircleIcon className="h-4 w-4" />
                                    Activo
                                </div>
                            )}
                            <h3 className="font-bold text-lg text-text-primary dark:text-slate-100 pr-16">{program.name}</h3>
                            <p className="text-sm text-text-secondary dark:text-slate-400 flex-grow mt-1">{program.description || 'Sin descripción.'}</p>
                            <div className="mt-3 pt-3 border-t border-text-primary/10 dark:border-slate-700 space-y-1">
                                <p className="text-xs text-text-secondary dark:text-slate-500 font-semibold">Regla: <span className="font-normal">{program.config.pointEarningMethod === 'monto' ? `${program.config.pointsPerMonto} pts por S/.${program.config.montoForPoints}` : `${program.config.pointsPerCompra} pts por compra`}</span></p>
                                <p className="text-xs text-text-secondary dark:text-slate-500 font-semibold">Recompensas: <span className="font-normal">{program.rewards.length}</span></p>
                            </div>
                        </div>
                        <div className="bg-background/50 dark:bg-slate-800/50 p-2 grid grid-cols-2 gap-2">
                             <button onClick={() => handleEdit(program)} className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 p-2 rounded-md transition-colors"><PencilIcon className="h-4 w-4"/> Editar</button>
                             <button onClick={() => setShowDeleteConfirm(program)} className="flex items-center justify-center gap-2 text-sm font-semibold text-danger dark:text-red-500 hover:bg-danger/10 p-2 rounded-md transition-colors"><TrashIcon className="h-4 w-4"/> Eliminar</button>
                        </div>
                        {!program.isActive && (
                             <button onClick={() => handleSetActive(program.id)} className="bg-success/20 text-success font-bold p-3 rounded-b-lg hover:bg-success/30 transition-colors w-full">
                                Activar Programa
                             </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LoyaltyProgramManager;