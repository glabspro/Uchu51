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

            // 1. Preserve current super admin session
            const { data: { session: adminSession } } = await supabase.auth.getSession();
            if (!adminSession) {
                throw new Error("La sesión del super admin ha expirado. Por favor, inicia sesión de nuevo.");
            }

            // 2. Create the new tenant's user account
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: ownerEmail,
                password: ownerPassword,
                options: {
                    data: {
                        full_name: ownerName, // Pass owner's name to metadata
                    }
                }
            });

            if (signUpError) throw signUpError;
            if (!signUpData.user) throw new Error("No se pudo crear el usuario. El correo podría ya estar en uso.");

            const newUserId = signUpData.user.id;

            // 3. IMPORTANT: Restore super admin session to continue operations
            await supabase.auth.setSession({
                access_token: adminSession.access_token,
                refresh_token: adminSession.refresh_token,
            });

            // 4. Create the new restaurant entry
            const { data: restaurantData, error: restaurantError } = await supabase
                .from('restaurants')
                .insert({
                    name: restaurantName,
                    plan_id: 'default',
                    settings: { // Default settings for a new restaurant
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
            
            // 5. Link the new user to the new restaurant with an 'owner' role
            const { error: roleError } = await supabase
                .from('user_roles')
                .insert({
                    user_id: newUserId,
                    restaurant_id: restaurantData.id,
                    role: 'owner'
                });

            if (roleError) {
                // If role linking fails, try to clean up by deleting the created restaurant.
                await supabase.from('restaurants').delete().eq('id', restaurantData.id);
                // Note: Deleting the user requires admin privileges and is more complex.
                // For now, we'll throw the error.
                throw roleError;
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
