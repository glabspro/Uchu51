import React from 'react';
import type { ClienteLeal, Recompensa } from '../types';
import { StarIcon } from './icons';

interface RedeemRewardModalProps {
    customer: ClienteLeal;
    rewards: Recompensa[];
    onRedeem: (reward: Recompensa) => void;
    onClose: () => void;
}

const RedeemRewardModal: React.FC<RedeemRewardModalProps> = ({ customer, rewards, onRedeem, onClose }) => {
    const availableRewards = rewards.filter(r => customer.puntos >= r.puntosRequeridos);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4" onClick={onClose}>
            <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-md w-full flex flex-col animate-fade-in-scale" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-slate-100 mb-1">Canjear Recompensa</h2>
                <p className="text-text-secondary dark:text-slate-400 mb-4">Cliente: <span className="font-semibold text-text-primary dark:text-slate-200">{customer.nombre}</span></p>
                <div className="bg-primary/10 text-primary dark:bg-orange-500/20 dark:text-orange-300 p-3 rounded-xl text-center mb-4">
                    <p className="font-bold text-lg">Puntos Disponibles: {customer.puntos}</p>
                </div>

                <div className="flex-grow overflow-y-auto min-h-[200px] space-y-2">
                    {availableRewards.length > 0 ? (
                        availableRewards.map(reward => (
                            <button
                                key={reward.id}
                                onClick={() => onRedeem(reward)}
                                className="w-full flex items-center gap-4 text-left p-3 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors border border-text-primary/5 dark:border-slate-700"
                            >
                                <div className="bg-primary/20 p-2 rounded-full">
                                    <StarIcon className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-bold text-text-primary dark:text-slate-200">{reward.nombre}</p>
                                    <p className="text-sm font-bold text-primary dark:text-orange-400">{reward.puntosRequeridos} Puntos</p>
                                </div>
                            </button>
                        ))
                    ) : (
                        <p className="text-center text-text-secondary dark:text-slate-500 pt-8">
                            El cliente no tiene suficientes puntos para canjear una recompensa.
                        </p>
                    )}
                </div>
                 <div className="pt-6 mt-auto">
                    <button type="button" onClick={onClose} className="w-full bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-3 px-4 rounded-lg transition-colors active:scale-95">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RedeemRewardModal;
