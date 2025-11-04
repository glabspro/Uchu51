import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Logo } from './Logo';
import { getSupabase } from '../utils/supabase';
import type { RestaurantSettings } from '../types';

const Signup: React.FC = () => {
    const { dispatch } = useAppContext();
    const [restaurantName, setRestaurantName] = useState('');
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onNavigateToLogin = () => dispatch({ type: 'GO_TO_LOGIN' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const supabase = getSupabase();

            // 1. Sign up the user
            const { data: { user }, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: userName,
                    }
                }
            });

            if (signUpError) {
                throw new Error(signUpError.message);
            }

            if (!user) {
                throw new Error("No se pudo crear el usuario. Por favor, inténtalo de nuevo.");
            }
            
            // NOTE: This multi-step process should ideally be handled in a single atomic transaction
            // using a Supabase Edge Function to prevent orphaned data in case of partial failure.
            // For this demo, we're performing the steps sequentially on the client.

            // FIX: Added default plan_id and a valid settings object to fix insert error.
            const defaultSettings: RestaurantSettings = {
                cooks: [],
                drivers: [],
                paymentInfo: { nombre: '', telefono: '', qrUrl: '' },
                tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                branding: { primaryColor: '#F97316' },
                modules: { delivery: true, local: true, retiro: true }
            };

            // 2. Create the restaurant
            const { data: restaurant, error: restaurantError } = await supabase
                .from('restaurants')
                .insert({ name: restaurantName, settings: defaultSettings, plan_id: 'basic' })
                .select()
                .single();
            
            if (restaurantError || !restaurant) {
                throw new Error(restaurantError?.message || "Error creando el restaurante.");
            }

            // 3. Link user to restaurant as 'owner'
            const { error: roleError } = await supabase
                .from('user_roles')
                .insert({
                    user_id: user.id,
                    restaurant_id: restaurant.id,
                    role: 'owner'
                });

            if (roleError) {
                throw new Error(roleError.message);
            }

            // Success! The onAuthStateChange listener in store.tsx will now take over,
            // log the user in, and fetch their data.
            dispatch({ type: 'ADD_TOAST', payload: { message: '¡Registro exitoso! Por favor, inicia sesión.', type: 'success' } });
            onNavigateToLogin();

        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                 <div className="bg-surface dark:bg-slate-800 shadow-2xl rounded-2xl overflow-hidden border border-text-primary/5 dark:border-slate-700">
                    <div className="bg-text-primary dark:bg-slate-900/50 p-10 text-center">
                        <Logo className="h-14 w-auto mx-auto" variant="light" />
                        <p className="text-white/70 mt-3 font-semibold">Crea tu cuenta de Restaurante</p>
                    </div>
                    <form onSubmit={handleSubmit} className="px-8 pt-6 pb-8 space-y-4">
                        {error && (
                            <div className="bg-danger/10 text-danger text-sm font-semibold p-3 rounded-lg text-center animate-fade-in-up">
                                {error}
                            </div>
                        )}
                        <input
                            type="text"
                            value={restaurantName}
                            onChange={(e) => setRestaurantName(e.target.value)}
                            placeholder="Nombre de tu Restaurante"
                            className="bg-background dark:bg-slate-700 shadow-inner appearance-none border border-text-primary/10 dark:border-slate-600 rounded-lg w-full py-3 px-4 text-text-primary dark:text-slate-200 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                        <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="Tu Nombre Completo"
                            className="bg-background dark:bg-slate-700 shadow-inner appearance-none border border-text-primary/10 dark:border-slate-600 rounded-lg w-full py-3 px-4 text-text-primary dark:text-slate-200 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Correo Electrónico"
                            className="bg-background dark:bg-slate-700 shadow-inner appearance-none border border-text-primary/10 dark:border-slate-600 rounded-lg w-full py-3 px-4 text-text-primary dark:text-slate-200 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                         <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Contraseña"
                            className="bg-background dark:bg-slate-700 shadow-inner appearance-none border border-text-primary/10 dark:border-slate-600 rounded-lg w-full py-3 px-4 text-text-primary dark:text-slate-200 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                            minLength={6}
                        />
                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-text-primary dark:bg-slate-700 hover:bg-text-primary/90 dark:hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 shadow-lg hover:shadow-text-primary/30 hover:-translate-y-0.5 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Registrando...' : 'Crear Cuenta'}
                            </button>
                        </div>
                    </form>
                </div>
                <p className="text-center text-text-secondary dark:text-slate-500 text-sm mt-6">
                    ¿Ya tienes una cuenta?{' '}
                    <button onClick={onNavigateToLogin} className="font-semibold hover:underline hover:text-primary dark:hover:text-orange-400 transition-colors">
                        Inicia Sesión
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Signup;