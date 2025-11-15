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

    const handleAddNew = () => {
        setEditingProgram(null);
        setIsModalOpen(true);
    };

    const handleEdit = (program: LoyaltyProgram) => {
        setEditingProgram(program);
        setIsModalOpen(true);
    };
    
    const handleSave = (programToSave: LoyaltyProgram) => {
        if (editingProgram) {
            setPrograms(prev => prev.map(p => p.id === programToSave.id ? programToSave : p));
        } else {
            setPrograms(prev => [...prev, { ...programToSave, id: `prog-${Date.now()}` }]);
        }
        setIsModalOpen(false);
    };

    const handleToggleActive = (programId: string) => {
        // Only one program can be active at a time.
        setPrograms(prev => prev.map(p => 
            p.id === programId 
            ? { ...p, isActive: true } 
            : { ...p, isActive: false }
        ));
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
                                     <button onClick={() => handleToggleActive(program.id)} className="text-sm font-semibold flex items-center gap-1 bg-success/10 text-success p-2 rounded-md hover:bg-success/20"><CheckCircleIcon className="h-4 w-4"/> Activar</button>
                                     <button onClick={() => handleEdit(program)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-md"><PencilIcon className="h-5 w-5"/></button>
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
