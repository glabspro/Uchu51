import React, { useState } from 'react';
import { useAppContext } from './store';
// FIX: Corrected import paths for components from the root directory.
import { LockClosedIcon } from './components/icons';
import { Logo } from './components/Logo';

interface LoginProps {
    error: string | null;
}

const Login: React.FC<LoginProps> = ({ error }) => {
    const { dispatch } = useAppContext();
    const [email, setEmail] = useState('admin@uchu.app');
    const [password, setPassword] = useState('password');
    const [isLoading, setIsLoading] = useState(false);

    const onNavigateToCustomerView = () => dispatch({ type: 'LOGOUT' });

    // FIX: Replaced Supabase authentication with mock login logic.
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        dispatch({ type: 'LOGIN_FAILED', payload: '' }); // Clear previous error

        // Simulate a network delay
        setTimeout(() => {
            if (email.toLowerCase() === 'admin@uchu.app' && password === 'password') {
                dispatch({ type: 'LOGIN_INTERNAL_SUCCESS' });
            } else {
                dispatch({ type: 'LOGIN_FAILED', payload: 'Credenciales incorrectas. Inténtalo de nuevo.' });
                setPassword('');
            }
            setIsLoading(false);
        }, 500);
    };

    return (
        <>
            <div className="min-h-screen bg-background dark:bg-zinc-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-surface dark:bg-zinc-800 shadow-2xl rounded-2xl overflow-hidden border border-text-primary/5 dark:border-zinc-700">
                        <div className="bg-text-primary dark:bg-zinc-900/50 p-10 text-center">
                            <Logo className="h-14 w-auto mx-auto" variant="light" />
                            <p className="text-white/70 mt-3 font-semibold">Acceso al panel de administración</p>
                        </div>
                        <form onSubmit={handleSubmit} className="px-8 pt-6 pb-8">
                            {error && (
                                <div className="bg-danger/10 text-danger text-sm font-semibold p-3 rounded-lg mb-4 text-center animate-fade-in-up">
                                    {error}
                                </div>
                            )}
                            <div className="mb-4">
                                <label className="block text-text-primary dark:text-zinc-200 text-sm font-bold mb-2" htmlFor="email">
                                    Correo Electrónico
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    className="bg-background dark:bg-zinc-700 shadow-inner appearance-none border border-text-primary/10 dark:border-zinc-600 rounded-lg w-full py-3 px-4 text-text-primary dark:text-zinc-200 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-text-primary dark:text-zinc-200 text-sm font-bold mb-2" htmlFor="password">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary/50 dark:text-zinc-500" />
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="******************"
                                        className="bg-background dark:bg-zinc-700 shadow-inner appearance-none border border-text-primary/10 dark:border-zinc-600 rounded-lg w-full py-3 px-12 text-text-primary dark:text-zinc-200 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-6">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-text-primary dark:bg-zinc-700 hover:bg-text-primary/90 dark:hover:bg-zinc-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 shadow-lg hover:shadow-text-primary/30 hover:-translate-y-0.5 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Ingresando...' : 'Ingresar'}
                                </button>
                            </div>
                        </form>
                    </div>
                    <p className="text-center text-text-secondary dark:text-zinc-500 text-sm mt-6">
                        <button onClick={onNavigateToCustomerView} className="font-semibold hover:underline hover:text-primary dark:hover:text-orange-400 transition-colors">
                            Volver a la tienda
                        </button>
                    </p>
                </div>
            </div>
        </>
    );
};

export default Login;