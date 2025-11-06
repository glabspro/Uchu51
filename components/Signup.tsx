import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Logo } from './Logo';
import { getSupabase } from '../utils/supabase';

const Signup: React.FC = () => {
    const { dispatch } = useAppContext();
    const [email] = useState('superadmin@example.com');
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

            // Call the custom RPC function to create the super admin user
            const { error: rpcError } = await supabase.rpc('create_super_admin', {
                admin_password: password
            });

            if (rpcError) {
                // Provide a more helpful error if the function doesn't exist.
                if (rpcError.message.includes('function public.create_super_admin')) {
                     throw new Error("La función 'create_super_admin' no se encontró en la base de datos. Por favor, ejecuta el script SQL que se te proporcionó en el editor de Supabase.");
                }
                throw new Error(rpcError.message);
            }

            dispatch({ type: 'ADD_TOAST', payload: { message: '¡Cuenta de Super Admin creada! Por favor, inicia sesión.', type: 'success' } });
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
                        <p className="text-white/70 mt-3 font-semibold">Creación de la Cuenta de Super Administrador</p>
                    </div>
                    <form onSubmit={handleSubmit} className="px-8 pt-6 pb-8 space-y-4">
                        {error && (
                            <div className="bg-danger/10 text-danger text-sm font-semibold p-3 rounded-lg text-center animate-fade-in-up">
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-text-primary dark:text-slate-200 text-sm font-bold mb-2" htmlFor="email">
                                Correo del Super Admin
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                className="bg-background dark:bg-slate-700/50 shadow-inner appearance-none border border-text-primary/10 dark:border-slate-600 rounded-lg w-full py-3 px-4 text-text-secondary dark:text-slate-400 leading-tight focus:outline-none"
                                disabled
                            />
                        </div>
                         <div>
                            <label className="block text-text-primary dark:text-slate-200 text-sm font-bold mb-2" htmlFor="password">
                                Elige una Contraseña Segura
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Contraseña"
                                className="bg-background dark:bg-slate-700 shadow-inner appearance-none border border-text-primary/10 dark:border-slate-600 rounded-lg w-full py-3 px-4 text-text-primary dark:text-slate-200 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-text-primary dark:bg-slate-700 hover:bg-text-primary/90 dark:hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 shadow-lg hover:shadow-text-primary/30 hover:-translate-y-0.5 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Creando...' : 'Crear Cuenta'}
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