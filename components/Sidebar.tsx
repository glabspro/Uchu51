import React from 'react';
import type { View, Theme } from '../types';
import { ChartBarIcon, FireIcon, HomeIcon, TruckIcon, LogoutIcon, ShoppingBagIcon, CreditCardIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, AdjustmentsHorizontalIcon, StarIcon } from './icons';
import { Logo } from './Logo';
import { LogoIcon } from './LogoIcon';

interface SidebarProps {
    currentView: View;
    onNavigate: (view: View) => void;
    onLogout: () => void;
    currentTheme: Theme;
    isCollapsed: boolean;
    onToggle: () => void;
}

const NavButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    isCollapsed: boolean;
}> = ({ isActive, onClick, icon, label, isCollapsed }) => (
    <button
        onClick={onClick}
        title={isCollapsed ? label : undefined}
        className={`flex items-center w-full py-3 rounded-lg text-base font-semibold transition-all duration-200 group
            ${isActive ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-surface hover:text-text-primary dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white'}
            ${isCollapsed ? 'justify-center' : 'space-x-3 px-4'}
        `}
    >
        {icon}
        {!isCollapsed && <span className="transition-opacity duration-200">{label}</span>}
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({
    currentView,
    onNavigate,
    onLogout,
    currentTheme,
    isCollapsed,
    onToggle,
}) => {
    const navItems = [
        { id: 'dashboard' as View, label: 'Dashboard', icon: <ChartBarIcon className="h-6 w-6" /> },
        { id: 'local' as View, label: 'Salón', icon: <HomeIcon className="h-6 w-6" /> },
        { id: 'cocina' as View, label: 'Cocina', icon: <FireIcon className="h-6 w-6" /> },
        { id: 'retiro' as View, label: 'Retiro', icon: <ShoppingBagIcon className="h-6 w-6" /> },
        { id: 'delivery' as View, label: 'Delivery', icon: <TruckIcon className="h-6 w-6" /> },
        { id: 'gestion' as View, label: 'Gestión', icon: <AdjustmentsHorizontalIcon className="h-6 w-6" /> },
        { id: 'caja' as View, label: 'Caja', icon: <CreditCardIcon className="h-6 w-6" /> },
    ];
    
    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-surface dark:bg-slate-800 flex flex-col flex-shrink-0 border-r border-text-primary/5 dark:border-slate-700 transition-all duration-300 ease-in-out`}>
            <div className={`h-16 flex items-center border-b border-text-primary/5 dark:border-slate-700 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'px-6'}`}>
                 {isCollapsed ? <LogoIcon className="h-9 w-auto"/> : <Logo className="h-9 w-auto" variant={currentTheme === 'dark' ? 'light' : 'default'} />}
            </div>
            <nav className="flex-grow p-4 space-y-2">
                {navItems.map(item => (
                    <NavButton 
                        key={item.id}
                        isActive={currentView === item.id}
                        onClick={() => onNavigate(item.id)}
                        icon={item.icon}
                        label={item.label}
                        isCollapsed={isCollapsed}
                    />
                ))}
            </nav>
            <div className="p-4 border-t border-text-primary/5 dark:border-slate-700">
                <button
                    onClick={onToggle}
                    title={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
                    className="flex items-center justify-center w-full py-2 mb-2 rounded-lg text-text-secondary hover:bg-surface dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                >
                    <span className="sr-only">{isCollapsed ? 'Expandir menú' : 'Contraer menú'}</span>
                    {isCollapsed ? <ChevronDoubleRightIcon className="h-6 w-6" /> : <ChevronDoubleLeftIcon className="h-6 w-6" />}
                </button>
                <button
                    onClick={onLogout}
                    title={isCollapsed ? 'Salir' : undefined}
                    className={`flex items-center w-full px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200 text-text-secondary hover:bg-surface hover:text-danger dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-red-500
                        ${isCollapsed ? 'justify-center' : 'space-x-3'}
                    `}
                >
                    <LogoutIcon className="h-6 w-6" />
                    {!isCollapsed && <span>Salir</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;