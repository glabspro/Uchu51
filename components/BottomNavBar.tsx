import React from 'react';
import { useAppContext } from '../store';
import type { View } from '../types';
import { DocumentTextIcon, FireIcon, CreditCardIcon, ChartBarIcon, AdjustmentsHorizontalIcon } from './icons';

const NavItem: React.FC<{
    view: View;
    label: string;
    icon: React.ReactNode;
    currentView: View;
    onNavigate: (view: View) => void;
}> = ({ view, label, icon, currentView, onNavigate }) => {
    const isActive = currentView === view;
    return (
        <button
            onClick={() => onNavigate(view)}
            className={`relative flex flex-col items-center justify-center flex-1 py-2 transition-all duration-200 rounded-lg m-1 ${
                isActive ? 'bg-primary/10 text-primary' : 'text-text-secondary dark:text-light-silver hover:bg-text-primary/5'
            }`}
            aria-current={isActive ? 'page' : undefined}
        >
            {icon}
            <span className={`text-xs mt-1 transition-all ${isActive ? 'font-bold' : 'font-semibold'}`}>{label}</span>
        </button>
    );
};

const BottomNavBar: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const onNavigate = (view: View) => dispatch({ type: 'SET_VIEW', payload: view });

    const navItems = [
        { view: 'recepcion' as View, label: 'Pedidos', icon: <DocumentTextIcon className="h-6 w-6" /> },
        { view: 'cocina' as View, label: 'Cocina', icon: <FireIcon className="h-6 w-6" /> },
        { view: 'caja' as View, label: 'Caja', icon: <CreditCardIcon className="h-6 w-6" /> },
        { view: 'dashboard' as View, label: 'Dashboard', icon: <ChartBarIcon className="h-6 w-6" /> },
        { view: 'gestion' as View, label: 'Gestión', icon: <AdjustmentsHorizontalIcon className="h-6 w-6" /> }
    ];

    // FIX: Added missing return statement to render the component's JSX.
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-surface dark:bg-[#34424D] border-t border-text-primary/10 dark:border-[#45535D] flex md:hidden z-50">
            {navItems.map(item => (
                <NavItem
                    key={item.view}
                    view={item.view}
                    label={item.label}
                    icon={item.icon}
                    currentView={state.view}
                    onNavigate={onNavigate}
                />
            ))}
        </div>
    );
};

// FIX: Added default export to allow the component to be imported in App.tsx.
export default BottomNavBar;