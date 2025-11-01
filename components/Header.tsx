import React from 'react';
import type { Turno, Theme } from '../types';
import { SunIcon, MoonIcon } from './icons';

interface HeaderProps {
    currentTurno: Turno;
    onTurnoChange: (turno: Turno) => void;
    currentTheme: Theme;
    onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({
    currentTurno,
    onTurnoChange,
    currentTheme,
    onToggleTheme,
}) => {
    return (
        <header className="bg-background/80 dark:bg-slate-900/80 backdrop-blur-lg text-text-primary dark:text-slate-200 shadow-sm border-b border-text-primary/5 dark:border-slate-700/50 flex-shrink-0">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-end h-16">
                    <div className="flex items-center space-x-4">
                        <button onClick={onToggleTheme} className="flex items-center justify-center h-10 w-10 rounded-full text-text-secondary hover:bg-surface dark:hover:bg-slate-700 hover:text-primary dark:text-slate-400 dark:hover:text-amber-400 transition-colors">
                            {currentTheme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
                        </button>
                        <div className="relative">
                            <select
                                id="turno"
                                value={currentTurno}
                                onChange={(e) => onTurnoChange(e.target.value as Turno)}
                                className="bg-surface dark:bg-slate-800 text-text-primary dark:text-slate-200 border-text-primary/10 dark:border-slate-700 border rounded-md py-2 pl-3 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold"
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