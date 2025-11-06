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
    const [ownerPassword, setOwnerPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const supabase = getSupabase();

            // Call the Edge Function to handle user and restaurant creation securely
            const { data, error: functionError } = await supabase.functions.invoke('create-restaurant', {
                body: {
                    restaurantName,
                    ownerName,
                    ownerEmail,
                    ownerPassword,
                },
            });

            if (functionError) {
                // Try to parse a more specific error message from the function's response
                const errorMessage = functionError.context?.msg ? JSON.parse(functionError.context.msg).error : functionError.message;
                throw new Error(errorMessage || "Un error desconocido ocurrió en el servidor.");
            }

            if (data.error) {
                 throw new Error(data.error);
            }

            dispatch({ type: 'ADD_TOAST', payload: { message: `Negocio "${restaurantName}" creado con éxito.`, type: 'success' } });
            onCreated(); // Refresh the list of restaurants in the parent component
            onClose();

        } catch (e: any) {
            setError(e.message);
            dispatch({ type: 'ADD_TOAST', payload: { message: `Error al crear el negocio: ${e.message}`, type: 'danger' } });
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
                    <div>
                        <label className="text-sm font-medium text-text-secondary dark:text-slate-400 mb-1 block">Datos del Negocio</label>
                        <input
                            type="text" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)}
                            placeholder="Nombre del Restaurante"
                            className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-3" required
                        />
                    </div>

                    <div className="border-t border-text-primary/10 dark:border-slate-700 pt-4">
                        <label className="text-sm font-medium text-text-secondary dark:text-slate-400 mb-1 block">Cuenta del Dueño (Owner)</label>
                        <div className="space-y-3">
                             <input
                                type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
                                placeholder="Nombre completo del dueño"
                                className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-3" required
                            />
                            <input
                                type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)}
                                placeholder="Email de acceso del dueño"
                                className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-3" required
                            />
                            <input
                                type="password" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)}
                                placeholder="Contraseña de acceso"
                                className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-3" required
                                minLength={6}
                            />
                        </div>
                    </div>

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