
import React from 'react';
import type { View, Theme } from '../types';
import { ChartBarIcon, FireIcon, HomeIcon, TruckIcon, LogoutIcon, ShoppingBagIcon, CreditCardIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, AdjustmentsHorizontalIcon, DocumentTextIcon, LockClosedIcon, UserIcon } from './icons';
import { Logo } from './Logo';
import { LogoIcon } from './LogoIcon';
import { useAppContext } from '../store';
import { ROLE_PERMISSIONS } from '../constants';

interface SidebarProps {}

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
            ${isActive ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-surface hover:text-text-primary dark:text-light-silver dark:hover:bg-[#45535D] dark:hover:text-white'}
            ${isCollapsed ? 'justify-center' : 'space-x-3 px-4'}
        `}
    >
        {icon}
        {!isCollapsed && <span className="transition-opacity duration-200">{label}</span>}
    </button>
);

const Sidebar: React.FC<SidebarProps> = () => {
    const { state, dispatch } = useAppContext();
    const { view, theme, isSidebarCollapsed, restaurantSettings, activeEmployee } = state;

    const onNavigate = (view: View) => dispatch({ type: 'SET_VIEW', payload: view });
    const onLogout = () => dispatch({ type: 'LOGOUT' });
    const onLock = () => dispatch({ type: 'LOCK_TERMINAL' });
    const onToggle = () => dispatch({ type: 'TOGGLE_SIDEBAR' });
    
    const allNavItems = [
        { id: 'caja' as View, label: 'Caja', icon: <CreditCardIcon className="h-6 w-6" /> },
        { id: 'dashboard' as View, label: 'Dashboard', icon: <ChartBarIcon className="h-6 w-6" /> },
        { id: 'local' as View, label: 'Salón', icon: <HomeIcon className="h-6 w-6" /> },
        { id: 'delivery' as View, label: 'Delivery', icon: <TruckIcon className="h-6 w-6" /> },
        { id: 'retiro' as View, label: 'Retiro', icon: <ShoppingBagIcon className="h-6 w-6" /> },
        { id: 'cocina' as View, label: 'Cocina', icon: <FireIcon className="h-6 w-6" /> },
        { id: 'gestion' as View, label: 'Gestión', icon: <AdjustmentsHorizontalIcon className="h-6 w-6" /> },
    ];

    const currentRole = activeEmployee?.role || 'admin';
    const allowedViews = ROLE_PERMISSIONS[currentRole] || [];

    const enabledModules = restaurantSettings?.modules;

    const visibleNavItems = allNavItems.filter(item => {
        // First check RBAC
        if (!allowedViews.includes(item.id)) return false;

        // Then check Module Configuration
        if (enabledModules) {
            if (item.id === 'local') return enabledModules.local !== false;
            if (item.id === 'delivery') return enabledModules.delivery !== false;
            if (item.id === 'retiro') return enabledModules.retiro !== false;
        }
        return true;
    });
    
    const getRoleColorClass = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200';
            case 'kitchen': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
            case 'delivery': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200';
            case 'cashier': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
            default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'; // Waiter/Default
        }
    };
    
    return (
        <aside className={`hidden md:flex ${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-surface dark:bg-[#34424D] flex-col flex-shrink-0 border-r border-text-primary/5 dark:border-[#45535D] transition-all duration-300 ease-in-out`}>
            <div className={`h-16 flex items-center border-b border-text-primary/5 dark:border-[#45535D] transition-all duration-300 ${isSidebarCollapsed ? 'justify-center px-2' : 'px-6'}`}>
                 {isSidebarCollapsed 
                    ? <LogoIcon className="h-9 w-auto"/> 
                    : <Logo logoUrl={restaurantSettings?.branding?.logoUrl} className="h-9 w-auto" variant={theme === 'dark' ? 'light' : 'default'} />}
            </div>
            
            {/* Active User Info */}
            {!isSidebarCollapsed && activeEmployee && (
                <div className="px-4 pt-4 pb-2">
                    <div className={`rounded-lg p-3 flex items-center gap-3 ${getRoleColorClass(activeEmployee.role)}`}>
                        <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                            <UserIcon className="h-4 w-4" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">{activeEmployee.name}</p>
                            <p className="text-xs opacity-80 capitalize">
                                {activeEmployee.role === 'waiter' ? 'Mozo' : 
                                 activeEmployee.role === 'cashier' ? 'Caja' :
                                 activeEmployee.role === 'kitchen' ? 'Cocina' :
                                 activeEmployee.role === 'delivery' ? 'Delivery' :
                                 activeEmployee.role === 'admin' ? 'Admin' : activeEmployee.role}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                {visibleNavItems.map(item => (
                    <NavButton 
                        key={item.id}
                        isActive={view === item.id}
                        onClick={() => onNavigate(item.id)}
                        icon={item.icon}
                        label={item.label}
                        isCollapsed={isSidebarCollapsed}
                    />
                ))}
            </nav>
            <div className="p-4 border-t border-text-primary/5 dark:border-[#45535D]">
                <button
                    onClick={onToggle}
                    title={isSidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
                    className="flex items-center justify-center w-full py-2 mb-2 rounded-lg text-text-secondary hover:bg-surface dark:text-light-silver dark:hover:bg-[#45535D] transition-colors"
                >
                    <span className="sr-only">{isSidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}</span>
                    {isSidebarCollapsed ? <ChevronDoubleRightIcon className="h-6 w-6" /> : <ChevronDoubleLeftIcon className="h-6 w-6" />}
                </button>
                
                {/* Lock Terminal Button */}
                <button
                    onClick={onLock}
                    title={isSidebarCollapsed ? 'Bloquear' : undefined}
                    className={`flex items-center w-full px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200 text-text-secondary hover:bg-surface hover:text-primary dark:text-light-silver dark:hover:bg-[#45535D] dark:hover:text-primary mb-2
                        ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}
                    `}
                >
                    <LockClosedIcon className="h-6 w-6" />
                    {!isSidebarCollapsed && <span>Bloquear</span>}
                </button>

                <button
                    onClick={onLogout}
                    title={isSidebarCollapsed ? 'Salir' : undefined}
                    className={`flex items-center w-full px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200 text-text-secondary hover:bg-surface hover:text-danger dark:text-light-silver dark:hover:bg-[#45535D] dark:hover:text-red-500
                        ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}
                    `}
                >
                    <LogoutIcon className="h-6 w-6" />
                    {!isSidebarCollapsed && <span>Cerrar Sistema</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
