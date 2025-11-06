

import React, { useState } from 'react';
import { useAppContext } from '../store';
import { LockClosedIcon, XMarkIcon } from './icons';
import { Logo } from './Logo';
import { getSupabase } from '../utils/supabase';

interface LoginProps {
    error: string | null;
}

const ForgotPasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');
        
        try {
            const supabase = getSupabase();
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin, // Optional: redirect URL after password reset
            });

            if (error) {
                throw error;
            }

            setMessage('Se han enviado las instrucciones para restablecer tu contraseña a tu correo electrónico. Revisa también tu bandeja de spam.');
        } catch (e: any) {
            setError(e.message || 'No se pudo enviar el correo de restablecimiento. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4 animate-fade-in-scale">
            <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full relative">
                <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-text-primary/10 dark:hover:bg-slate-700">
                    <XMarkIcon className="h-6 w-6 text-text-secondary dark:text-slate-400"/>
                </button>
                <h3 className="text-xl font-heading font-bold text-text-primary dark:text-white mb-4 text-center">Recuperar Contraseña</h3>
                {message ? (
                    <div className="text-center">
                        <p className="text-green-700 dark:text-green-300 bg-green-500/10 p-3 rounded-lg font-semibold">{message}</p>
                        <button onClick={onClose} className="mt-4 w-full bg-primary text-white font-bold py-2 px-4 rounded-lg">Entendido</button>
                    </div>
                ) : (
                    <form onSubmit={handlePasswordReset}>
                        <p className="text-sm text-text-secondary dark:text-slate-400 mb-4">Ingresa tu correo y te enviaremos un enlace para que puedas elegir una nueva contraseña.</p>
                        {error && <p className="text-danger text-xs mb-2 text-center">{error}</p>}
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            className="w-full bg-background dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-lg p-3 text-sm"
                            required
                        />
                        <button type="submit" disabled={isLoading} className="mt-4 w-full bg-text-primary dark:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400">
                            {isLoading ? 'Enviando...' : 'Enviar Instrucciones'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};


const Login: React.FC<LoginProps> = ({ error }) => {
    const { dispatch } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    
    const onNavigateToCustomerView = () => dispatch({ type: 'LOGOUT' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        dispatch({ type: 'LOGIN_FAILED', payload: '' }); // Clear previous error
        try {
            const supabase = getSupabase();
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                dispatch({ type: 'LOGIN_FAILED', payload: error.message || 'Credenciales incorrectas. Inténtalo de nuevo.' });
                setPassword('');
            }
            // On success, the onAuthStateChange listener in store.tsx will handle the rest.
        } catch(e: any) {
            dispatch({ type: 'LOGIN_FAILED', payload: e.message || 'Error de configuración.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />}
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
                                <label className="block text-text-primary dark:text-slate-200 text-sm font-bold mb-2" htmlFor="email">
                                    Correo Electrónico
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    className="bg-background dark:bg-slate-700 shadow-inner appearance-none border border-text-primary/10 dark:border-slate-600 rounded-lg w-full py-3 px-4 text-text-primary dark:text-slate-200 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>
                            <div className="mb-1">
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
                                        required
                                    />
                                </div>
                            </div>
                            <div className="text-right mt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-sm font-semibold text-primary hover:underline"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                            <div className="flex items-center justify-between mt-6">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-text-primary dark:bg-slate-700 hover:bg-text-primary/90 dark:hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 shadow-lg hover:shadow-text-primary/30 hover:-translate-y-0.5 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Ingresando...' : 'Ingresar'}
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
        </>
    );
};

export default Login;