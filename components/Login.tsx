import React, { useState } from 'react';
import { LockClosedIcon } from './icons';
import { Logo } from './Logo';

interface LoginProps {
    onLogin: (password: string) => void;
    error: string | null;
    onNavigateToCustomerView: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, error, onNavigateToCustomerView }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(password);
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                 <div className="bg-surface shadow-2xl rounded-2xl overflow-hidden border border-text-primary/5">
                    <div className="bg-text-primary p-10 text-center">
                        <Logo className="h-14 w-auto mx-auto" variant="light" />
                        <p className="text-white/70 mt-3 font-semibold">Acceso al panel de administración</p>
                    </div>
                    <form onSubmit={handleSubmit} className="px-8 pt-6 pb-8">
                        <div className="mb-4">
                            <label className="block text-text-primary text-sm font-bold mb-2" htmlFor="password">
                                Contraseña
                            </label>
                            <div className="relative">
                                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary/50" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="******************"
                                    className="bg-background shadow-inner appearance-none border border-text-primary/10 rounded-lg w-full py-3 px-12 text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>
                        {error && <p className="text-danger text-xs italic mb-4">{error}</p>}
                        <div className="flex items-center justify-between mt-6">
                            <button
                                type="submit"
                                className="w-full bg-text-primary hover:bg-text-primary/90 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 shadow-lg hover:shadow-text-primary/30 hover:-translate-y-0.5"
                            >
                                Ingresar
                            </button>
                        </div>
                    </form>
                </div>
                <p className="text-center text-text-secondary text-sm mt-6">
                    <button onClick={onNavigateToCustomerView} className="font-semibold hover:underline hover:text-primary transition-colors">
                        Volver a la tienda
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;