
import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Logo } from './Logo';
import { LockClosedIcon, HomeIcon } from './icons';

const StaffLogin: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { employees } = state;
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleNumberClick = (num: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
            setError('');
        }
    };

    const handleClear = () => {
        setPin('');
        setError('');
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
        setError('');
    };

    const handleLogin = () => {
        const employee = employees.find(e => e.pin_code === pin && e.is_active);
        
        if (employee) {
            dispatch({ type: 'EMPLOYEE_LOGIN_SUCCESS', payload: employee });
        } else {
            setError('PIN incorrecto. Inténtalo de nuevo.');
            setPin('');
        }
    };

    const handleBackToHome = () => {
        dispatch({ type: 'LOGOUT' });
    };

    // Auto-submit when pin is 4 digits
    React.useEffect(() => {
        if (pin.length === 4) {
            handleLogin();
        }
    }, [pin]);

    return (
        <div className="min-h-screen bg-background dark:bg-gunmetal flex flex-col items-center justify-center p-4 relative">
            
            {/* Back Button positioned absolutely for desktop, relative flow for mobile */}
            <button 
                onClick={handleBackToHome}
                className="absolute top-4 left-4 flex items-center gap-2 text-text-secondary dark:text-zinc-400 hover:text-primary dark:hover:text-orange-400 transition-colors font-semibold px-4 py-2 rounded-lg hover:bg-surface dark:hover:bg-zinc-800"
            >
                <HomeIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Volver a la Tienda</span>
            </button>

            <div className="mb-8 animate-fade-in-up mt-12 sm:mt-0">
                <Logo className="h-16 w-auto" variant={state.theme === 'dark' ? 'light' : 'default'} />
                <p className="text-center text-text-secondary dark:text-zinc-400 mt-2 font-semibold">Acceso de Personal</p>
            </div>

            <div className="bg-surface dark:bg-zinc-800 p-8 rounded-3xl shadow-2xl border border-text-primary/5 dark:border-zinc-700 w-full max-w-sm animate-fade-in-scale">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-primary/10 p-4 rounded-full mb-3">
                        <LockClosedIcon className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary dark:text-white">Ingresa tu PIN</h2>
                </div>

                <div className="flex justify-center gap-4 mb-8">
                    {[0, 1, 2, 3].map((i) => (
                        <div 
                            key={i} 
                            className={`w-4 h-4 rounded-full transition-all duration-300 ${
                                pin.length > i 
                                    ? 'bg-primary scale-110' 
                                    : 'bg-text-primary/20 dark:bg-zinc-600'
                            }`} 
                        />
                    ))}
                </div>

                {error && (
                    <div className="text-danger text-center mb-4 text-sm font-bold bg-danger/10 py-2 rounded-lg animate-bounce">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num.toString())}
                            className="bg-background dark:bg-zinc-700/50 hover:bg-primary/10 dark:hover:bg-zinc-600 text-2xl font-bold text-text-primary dark:text-white py-4 rounded-xl transition-all active:scale-95 shadow-sm border border-text-primary/5 dark:border-zinc-600"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={handleClear}
                        className="bg-danger/10 hover:bg-danger/20 text-danger font-bold py-4 rounded-xl transition-all active:scale-95 text-sm"
                    >
                        Borrar
                    </button>
                    <button
                        onClick={() => handleNumberClick('0')}
                        className="bg-background dark:bg-zinc-700/50 hover:bg-primary/10 dark:hover:bg-zinc-600 text-2xl font-bold text-text-primary dark:text-white py-4 rounded-xl transition-all active:scale-95 shadow-sm border border-text-primary/5 dark:border-zinc-600"
                    >
                        0
                    </button>
                    <button
                        onClick={handleBackspace}
                        className="bg-background dark:bg-zinc-700/50 hover:bg-text-primary/10 dark:hover:bg-zinc-600 text-text-primary dark:text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-sm border border-text-primary/5 dark:border-zinc-600 flex items-center justify-center"
                    >
                        ⌫
                    </button>
                </div>
            </div>
            
            <button 
                onClick={handleBackToHome}
                className="mt-8 text-sm font-bold text-text-secondary dark:text-zinc-500 hover:text-primary dark:hover:text-white transition-colors flex items-center gap-2 sm:hidden"
            >
                <HomeIcon className="h-4 w-4" /> Volver a la Tienda
            </button>
        </div>
    );
};

export default StaffLogin;
