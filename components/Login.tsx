
import React, { useState } from 'react';
import { LockClosedIcon } from './icons';

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
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                 <div className="bg-white shadow-2xl rounded-xl overflow-hidden">
                    <div className="bg-slate-800 p-8 text-center">
                        <h1 className="text-3xl font-extrabold text-white">GRAB<span className="text-primary">IT</span> <span className="font-normal text-white/80">Admin</span></h1>
                        <p className="text-slate-300 mt-2">Acceso al panel de administración</p>
                    </div>
                    <form onSubmit={handleSubmit} className="px-8 pt-6 pb-8">
                        <div className="mb-4">
                            <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="password">
                                Contraseña
                            </label>
                            <div className="relative">
                                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="******************"
                                    className="bg-slate-50 shadow-inner appearance-none border border-slate-300 rounded-lg w-full py-3 px-10 text-slate-800 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>
                        {error && <p className="text-danger text-xs italic mb-4">{error}</p>}
                        <div className="flex items-center justify-between mt-6">
                            <button
                                type="submit"
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors shadow-lg"
                            >
                                Ingresar
                            </button>
                        </div>
                    </form>
                </div>
                <p className="text-center text-slate-500 text-sm mt-6">
                    <button onClick={onNavigateToCustomerView} className="font-bold hover:underline hover:text-primary">
                        Volver a la tienda
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;