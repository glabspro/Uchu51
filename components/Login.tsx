import React, { useState } from 'react';
import { useAppContext } from '../store';
import { LockClosedIcon } from './icons';
import { Logo } from './Logo';
import type { UserRole } from '../types';

interface LoginProps {
    error: string | null;
}

const Login: React.FC<LoginProps> = ({ error }) => {
    const { dispatch } = useAppContext();
    const [password, setPassword] = useState('');

    const onLogin = (role: UserRole) => dispatch({ type: 'LOGIN', payload: role });
    const onLoginFailed = (message: string) => dispatch({ type: 'LOGIN_FAILED', payload: message });
    const onNavigateToCustomerView = () => dispatch({ type: 'LOGOUT' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'admin123') {
            onLogin('admin');
        } else {
            onLoginFailed('Contraseña incorrecta. Inténtalo de nuevo.');
            setPassword('');
        }
    };

    return (
        <div className="min-h-screen bg-background dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                 <div className="bg-surface dark:bg-slate-800 shadow-2xl rounded-2xl overflow-hidden border border-text-primary/5 dark:border-slate-700">
                    <div className="bg-text-primary dark:bg-slate-900/50 p-10 text-center">
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
                            <label className="block text-text-primary dark:text-slate-200 text-sm font-bold mb-2" htmlFor="password">
                                Contraseña
                            </label>
                            <div className="relative">
                                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary/50 dark:text-slate-500" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="******************"
                                    className="bg-background dark:bg-slate-700 shadow-inner appearance-none border border-text-primary/10 dark:border-slate-600 rounded-lg w-full py-3 px-12 text-text-primary dark:text-slate-200 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-6">
                            <button
                                type="submit"
                                className="w-full bg-text-primary dark:bg-slate-700 hover:bg-text-primary/90 dark:hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 shadow-lg hover:shadow-text-primary/30 hover:-translate-y-0.5"
                            >
                                Ingresar
                            </button>
                        </div>
                    </form>
                </div>
                <p className="text-center text-text-secondary dark:text-slate-500 text-sm mt-6">
                    <button onClick={onNavigateToCustomerView} className="font-semibold hover:underline hover:text-primary dark:hover:text-orange-400 transition-colors">
                        Volver a la tienda
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;