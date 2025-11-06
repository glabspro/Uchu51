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
    const [ownerUserId, setOwnerUserId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const supabase = getSupabase();
            
            // Step 1: Create the restaurant
            const { data: restaurantData, error: restaurantError } = await supabase
                .from('restaurants')
                .insert({
                    name: restaurantName,
                    plan_id: 'default', // Assuming a default plan
                    settings: { // Provide some default settings
                        tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                        cooks: ['Cocinero 1', 'Cocinero 2'],
                        drivers: ['Driver 1', 'Driver 2'],
                        paymentInfo: { nombre: 'Yape/Plin del Negocio', telefono: '987654321', qrUrl: ''},
                        modules: { delivery: true, local: true, retiro: true }
                    }
                })
                .select()
                .single();

            if (restaurantError) throw restaurantError;
            
            const newRestaurantId = restaurantData.id;

            // Step 2: Link the user role
            const { error: roleError } = await supabase
                .from('user_roles')
                .insert({
                    user_id: ownerUserId,
                    restaurant_id: newRestaurantId,
                    role: 'owner'
                });

            if (roleError) {
                // Attempt to clean up the created restaurant if role linking fails
                await supabase.from('restaurants').delete().eq('id', newRestaurantId);
                throw roleError;
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
                    <div>
                        <input
                            type="text" value={ownerUserId} onChange={(e) => setOwnerUserId(e.target.value)}
                            placeholder="ID de Usuario del Dueño"
                            className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-3" required
                        />
                         <p className="text-xs text-text-secondary dark:text-slate-500 mt-2">
                            <b>Nota:</b> Primero crea el usuario en <b>Supabase Dashboard → Authentication → Users</b>. Luego, copia y pega su UUID aquí.
                        </p>
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