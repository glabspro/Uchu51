import React from 'react';
import type { View, Turno, Theme } from '../types';
import { ChartBarIcon, ClockIcon, DocumentTextIcon, HomeIcon, TruckIcon, LogoutIcon, ShoppingBagIcon, CreditCardIcon, SunIcon, MoonIcon } from './icons';
import { Logo } from './Logo';

interface HeaderProps {
    currentView: View;
    onNavigate: (view: View) => void;
    currentTurno: Turno;
    onTurnoChange: (turno: Turno) => void;
    onLogout: () => void;
    currentTheme: Theme;
    onToggleTheme: () => void;
}

const NavButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}> = ({ isActive, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            isActive
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:bg-surface hover:text-text-primary dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
        }`}
    >
        {icon}
        <span className="hidden md:inline">{label}</span>
    </button>
);


const Header: React.FC<HeaderProps> = ({
    currentView,
    onNavigate,
    currentTurno,
    onTurnoChange,
    onLogout,
    currentTheme,
    onToggleTheme,
}) => {
    const navItems = [
        { id: 'espera' as View, label: 'En Espera', icon: <ClockIcon className="h-5 w-5" /> },
        { id: 'cocina' as View, label: 'Cocina', icon: <HomeIcon className="h-5 w-5" /> },
        { id: 'delivery' as View, label: 'Delivery', icon: <TruckIcon className="h-5 w-5" /> },
        { id: 'retiro' as View, label: 'Retiro', icon: <ShoppingBagIcon className="h-5 w-5" /> },
        { id: 'local' as View, label: 'Salón', icon: <DocumentTextIcon className="h-5 w-5" /> },
        { id: 'caja' as View, label: 'Caja', icon: <CreditCardIcon className="h-5 w-5" /> },
        { id: 'dashboard' as View, label: 'Dashboard', icon: <ChartBarIcon className="h-5 w-5" /> },
    ];
    
    return (
        <header className="bg-background/80 dark:bg-slate-900/80 backdrop-blur-lg text-text-primary dark:text-slate-200 shadow-sm border-b border-text-primary/5 dark:border-slate-700/50 sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-4">
                            <Logo className="h-9 w-auto" variant={currentTheme === 'dark' ? 'light' : 'default'} />
                            <span className="font-heading font-bold text-text-secondary dark:text-slate-400 text-lg pt-1 border-l-2 border-text-primary/10 dark:border-slate-700 pl-4">Admin Panel</span>
                        </div>
                        <nav className="hidden md:flex items-center space-x-1 bg-text-primary/5 dark:bg-slate-800 p-1 rounded-xl">
                           {navItems.map(item => (
                                <NavButton 
                                    key={item.id}
                                    isActive={currentView === item.id}
                                    onClick={() => onNavigate(item.id)}
                                    icon={item.icon}
                                    label={item.label}
                                />
                           ))}
                        </nav>
                    </div>
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
                        <button
                            onClick={onLogout}
                            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 text-text-secondary dark:text-slate-400 hover:bg-surface dark:hover:bg-slate-700 hover:text-text-primary dark:hover:text-white"
                        >
                            <LogoutIcon className="h-5 w-5" />
                            <span className="hidden md:inline">Salir</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;