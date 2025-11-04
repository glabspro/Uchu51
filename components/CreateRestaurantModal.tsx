import React, { useState } from 'react';
import { getSupabase } from '../utils/supabase';
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
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const supabase = getSupabase();
            
            // In a real production app, this entire logic should be an atomic transaction 
            // handled by a Supabase Edge Function to ensure data integrity and security.
            // The function would use the Supabase Admin Client.
            // We are calling a placeholder function here to demonstrate the correct architecture.
            const { error: functionError } = await supabase.functions.invoke('create-new-tenant', {
                body: { 
                    restaurantName, 
                    ownerName,
                    ownerEmail, 
                    password 
                },
            });

            if (functionError) {
                // Provide a more helpful error if the function doesn't exist.
                if (functionError.message.includes("Function not found")) {
                    throw new Error("La función 'create-new-tenant' no existe en Supabase. Debes crearla para registrar nuevos negocios.");
                }
                throw functionError;
            }

            dispatch({ type: 'ADD_TOAST', payload: { message: `Negocio "${restaurantName}" creado con éxito.`, type: 'success' } });
            onCreated(); // Refresh the list
            onClose();

        } catch (e: any) {
            setError(e.message);
            dispatch({ type: 'ADD_TOAST', payload: { message: `Error: ${e.message}`, type: 'danger' } });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4" onClick={onClose}>
            <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-lg w-full flex flex-col animate-fade-in-scale" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-slate-100 mb-6">Crear Nuevo Negocio</h2>
                
                {error && (
                    <div className="bg-danger/10 text-danger text-sm font-semibold p-3 rounded-lg text-center mb-4">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)}
                        placeholder="Nombre del Restaurante"
                        className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-3" required
                    />
                    <input
                        type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="Nombre completo del Dueño"
                        className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-3" required
                    />
                    <input
                        type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)}
                        placeholder="Email del Dueño (para su login)"
                        className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-3" required
                    />
                    <input
                        type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="Contraseña Inicial para el Dueño"
                        className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-3" required minLength={6}
                    />
                    <div className="pt-4 grid grid-cols-2 gap-4">
                        <button type="button" onClick={onClose} disabled={isLoading} className="bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-3 px-4 rounded-lg">Cancelar</button>
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
