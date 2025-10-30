import React from 'react';
import type { View, Turno } from '../types';
import { ChartBarIcon, ClockIcon, DocumentTextIcon, HomeIcon, TruckIcon, LogoutIcon, ShoppingBagIcon, CreditCardIcon, FireIcon } from './icons';

interface HeaderProps {
    currentView: View;
    onNavigate: (view: View) => void;
    currentTurno: Turno;
    onTurnoChange: (turno: Turno) => void;
    onLogout: () => void;
}

const NavButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}> = ({ isActive, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            isActive
                ? 'bg-primary text-white shadow-md'
                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
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
        <header className="bg-white/80 backdrop-blur-md text-stone-800 shadow-sm border-b border-stone-200 sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-6">
                        <h1 className="text-xl font-extrabold text-stone-800 flex items-center space-x-2">
                            <FireIcon className="h-6 w-6 text-primary" />
                            <span>UCHU51 <span className="font-normal text-stone-500">Admin</span></span>
                        </h1>
                        <nav className="hidden md:flex items-center space-x-1 bg-stone-100/50 p-1 rounded-xl">
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
                        <div className="relative">
                            <select
                                id="turno"
                                value={currentTurno}
                                onChange={(e) => onTurnoChange(e.target.value as Turno)}
                                className="bg-stone-100 text-stone-700 border-stone-300 border rounded-md py-2 pl-3 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold"
                            >
                                <option value="mañana">Mañana</option>
                                <option value="tarde">Tarde</option>
                                <option value="noche">Noche</option>
                            </select>
                        </div>
                        <button
                            onClick={onLogout}
                            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
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