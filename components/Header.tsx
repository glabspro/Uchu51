
import React from 'react';
import type { Turno, View } from '../types';
import { SunIcon, MoonIcon, ArrowPathIcon } from './icons'; 
import { useAppContext } from '../store';

const viewTitles: { [key in View]: string } = {
    dashboard: 'Dashboard',
    recepcion: 'Recepción',
    local: 'Gestión de Salón',
    cocina: 'Cocina',
    retiro: 'Retiro en Tienda',
    delivery: 'Delivery',
    gestion: 'Gestión',
    caja: 'Caja',
};

const Header: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { turno, theme, view, activeEmployee } = state;

    const onTurnoChange = (newTurno: Turno) => {
        dispatch({ type: 'SET_TURNO', payload: newTurno });
    };

    const onToggleTheme = () => {
        dispatch({ type: 'TOGGLE_THEME' });
    };
    
    // Quick Switch User Action (Lock Terminal)
    const onSwitchUser = () => {
        dispatch({ type: 'LOCK_TERMINAL' });
    };
    
    const currentTitle = viewTitles[view] || 'Uchu51';

    return (
        <header className="bg-background/80 dark:bg-gunmetal/80 backdrop-blur-lg text-text-primary dark:text-ivory-cream shadow-sm border-b border-text-primary/5 dark:border-[#34424D]/50 flex-shrink-0">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between md:justify-end h-16">
                    {/* Mobile Title */}
                    <h1 className="text-xl font-bold font-heading md:hidden">{currentTitle}</h1>
                    
                    {/* Controls */}
                    <div className="flex items-center space-x-4">
                        {/* Switch User Button (Visible only when an employee is logged in) */}
                        {activeEmployee && (
                            <button 
                                onClick={onSwitchUser}
                                className="flex items-center gap-2 bg-text-primary/5 hover:bg-text-primary/10 dark:bg-[#45535D] dark:hover:bg-[#56656E] px-3 py-1.5 rounded-full transition-colors text-sm font-semibold text-text-secondary dark:text-zinc-300"
                                title="Cambiar Usuario / Bloquear"
                            >
                                <ArrowPathIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">Cambiar Usuario</span>
                            </button>
                        )}

                        <button onClick={onToggleTheme} className="flex items-center justify-center h-10 w-10 rounded-full text-text-secondary hover:bg-surface dark:hover:bg-[#45535D] hover:text-primary dark:text-light-silver dark:hover:text-amber-400 transition-colors">
                            {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
                        </button>
                        <div className="relative">
                            <select
                                id="turno"
                                value={turno}
                                onChange={(e) => onTurnoChange(e.target.value as Turno)}
                                className="bg-surface dark:bg-[#34424D] text-text-primary dark:text-ivory-cream border-text-primary/10 dark:border-[#45535D] border rounded-md py-2 pl-3 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold"
                            >
                                <option value="mañana">Mañana</option>
                                <option value="tarde">Tarde</option>
                                <option value="noche">Noche</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
