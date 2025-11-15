import React, { useState } from 'react';
import { useAppContext } from '../store';

interface CreateRestaurantModalProps {
    onClose: () => void;
    onCreated: () => void;
}

const CreateRestaurantModal: React.FC<CreateRestaurantModalProps> = ({ onClose, onCreated }) => {
    const { dispatch } = useAppContext();
    const [restaurantName, setRestaurantName] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [ownerEmail, setOwnerEmail] = useState('');
    const [ownerPassword, setOwnerPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Simulate API call without Supabase
        setTimeout(() => {
            if (!restaurantName || !ownerName || !ownerEmail || !ownerPassword) {
                setError("Todos los campos son obligatorios.");
                setIsLoading(false);
                return;
            }
             if (ownerPassword.length < 6) {
                setError("La contraseña debe tener al menos 6 caracteres.");
                setIsLoading(false);
                return;
            }

            console.log("Simulating restaurant creation:", { restaurantName, ownerName, ownerEmail });
            
            dispatch({ type: 'ADD_TOAST', payload: { message: `Negocio "${restaurantName}" creado con éxito (simulado).`, type: 'success' } });
            onCreated(); // Refresh the list
            onClose();
            setIsLoading(false);
        }, 1000);
    };


    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4" onClick={onClose}>
            <div className="bg-surface dark:bg-zinc-800 rounded-2xl shadow-xl p-6 max-w-lg w-full flex flex-col animate-fade-in-scale" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-zinc-100 mb-6">Crear Nuevo Negocio</h2>
                
                {error && (
                    <div className="bg-danger/10 text-danger text-sm font-semibold p-3 rounded-lg text-center mb-4">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-text-secondary dark:text-zinc-400 mb-1 block">Datos del Negocio</label>
                        <input
                            type="text" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)}
                            placeholder="Nombre del Restaurante"
                            className="w-full bg-background dark:bg-zinc-700 border border-text-primary/10 dark:border-zinc-600 rounded-md p-3" required
                        />
                    </div>

                    <div className="border-t border-text-primary/10 dark:border-zinc-700 pt-4">
                        <label className="text-sm font-medium text-text-secondary dark:text-zinc-400 mb-1 block">Cuenta del Dueño (Owner)</label>
                        <div className="space-y-3">
                             <input
                                type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
                                placeholder="Nombre completo del dueño"
                                className="w-full bg-background dark:bg-zinc-700 border border-text-primary/10 dark:border-zinc-600 rounded-md p-3" required
                            />
                            <input
                                type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)}
                                placeholder="Email de acceso del dueño"
                                className="w-full bg-background dark:bg-zinc-700 border border-text-primary/10 dark:border-zinc-600 rounded-md p-3" required
                            />
                            <input
                                type="password" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)}
                                placeholder="Contraseña de acceso"
                                className="w-full bg-background dark:bg-zinc-700 border border-text-primary/10 dark:border-zinc-600 rounded-md p-3" required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className="pt-4 grid grid-cols-2 gap-4">
                        <button type="button" onClick={onClose} disabled={isLoading} className="bg-text-primary/10 dark:bg-zinc-700 hover:bg-text-primary/20 dark:hover:bg-zinc-600 text-text-primary dark:text-zinc-200 font-bold py-3 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg shadow-md disabled:bg-gray-400 disabled:cursor-wait">
                            {isLoading ? 'Creando...' : 'Crear Negocio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRestaurantModal;