import React, { useState } from 'react';
import type { Producto, Salsa, ClienteLeal, LoyaltyProgram, Promocion } from '../types';
import { useAppContext } from '../store';
import ProductManager from './ProductManager';
import InventoryManager from './InventoryManager';
import CustomerManager from './CustomerManager';
import LoyaltyProgramManager from './LoyaltyProgramManager';
import PromotionsManager from './PromotionsManager';
import SauceManager from './SauceManager';
import ReportesView from './ReportesView';
import LocalSettings from './LocalSettings';
import { ShoppingBagIcon, ArchiveBoxIcon, SparklesIcon, UserGroupIcon, StarIcon, DocumentMagnifyingGlassIcon, BuildingStorefrontIcon } from './icons';

interface GestionViewProps {
}

type GestionTab = 'productos' | 'inventario' | 'promociones' | 'clientes' | 'lealtad' | 'cremas' | 'reportes' | 'ajustes';

const TabButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}> = ({ isActive, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-3 py-3 px-4 font-bold transition-colors rounded-t-lg border-b-4 ${
            isActive
                ? 'text-primary border-primary'
                : 'text-text-secondary dark:text-zinc-400 hover:bg-background/50 dark:hover:bg-zinc-800/50 border-transparent hover:border-primary/40'
        }`}
    >
        {icon}
        <span className="hidden sm:inline">{label}</span>
    </button>
);

const GestionView: React.FC<GestionViewProps> = () => {
    const { state, dispatch } = useAppContext();
    const { products, salsas, customers, loyaltyPrograms, promotions, orders, cajaHistory } = state;

    const setProducts = (payload: Producto[] | ((prev: Producto[]) => Producto[])) => {
        if (typeof payload === 'function') {
            dispatch({ type: 'SET_PRODUCTS', payload: payload(products) });
        } else {
            dispatch({ type: 'SET_PRODUCTS', payload });
        }
    };

    const setSalsas = (payload: Salsa[]) => {
        dispatch({ type: 'SET_SAUCES', payload });
    };
    
    const setPromotions = (payload: Promocion[] | ((prev: Promocion[]) => Promocion[])) => {
        if (typeof payload === 'function') {
            dispatch({ type: 'SET_PROMOTIONS', payload: payload(promotions) });
        } else {
            dispatch({ type: 'SET_PROMOTIONS', payload });
        }
    };

    const setPrograms = (payload: LoyaltyProgram[] | ((prev: LoyaltyProgram[]) => LoyaltyProgram[])) => {
        if (typeof payload === 'function') {
            dispatch({ type: 'SET_LOYALTY_PROGRAMS', payload: payload(loyaltyPrograms) });
        } else {
            dispatch({ type: 'SET_LOYALTY_PROGRAMS', payload });
        }
    };

    const [activeTab, setActiveTab] = useState<GestionTab>('productos');

    const renderContent = () => {
        switch (activeTab) {
            case 'productos':
                return <ProductManager products={products} setProducts={setProducts} />;
            case 'inventario':
                return <InventoryManager products={products} setProducts={setProducts} />;
            case 'cremas':
                return <SauceManager salsas={salsas} setSalsas={setSalsas} />;
            case 'promociones':
                return <PromotionsManager promotions={promotions} setPromotions={setPromotions} products={products} />;
            case 'clientes':
                return <CustomerManager customers={customers} />;
            case 'lealtad':
                return <LoyaltyProgramManager programs={loyaltyPrograms} setPrograms={setPrograms} products={products} />;
            case 'reportes':
                return <ReportesView orders={orders} products={products} cajaHistory={cajaHistory} />;
            case 'ajustes':
                return <LocalSettings />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <h1 className="text-3xl font-heading font-bold mb-4 text-text-primary dark:text-zinc-100">Gestión del Negocio</h1>
            <div className="bg-surface dark:bg-zinc-800 rounded-t-lg shadow-sm flex-shrink-0">
                <div className="flex space-x-1 border-b border-text-primary/5 dark:border-zinc-700 overflow-x-auto">
                    <TabButton isActive={activeTab === 'productos'} onClick={() => setActiveTab('productos')} icon={<ShoppingBagIcon className="h-6 w-6" />} label="Productos" />
                    <TabButton isActive={activeTab === 'inventario'} onClick={() => setActiveTab('inventario')} icon={<ArchiveBoxIcon className="h-6 w-6" />} label="Inventario" />
                    <TabButton isActive={activeTab === 'cremas'} onClick={() => setActiveTab('cremas')} icon={<SparklesIcon className="h-6 w-6" />} label="Cremas" />
                    <TabButton isActive={activeTab === 'promociones'} onClick={() => setActiveTab('promociones')} icon={<SparklesIcon className="h-6 w-6" />} label="Promociones" />
                    <TabButton isActive={activeTab === 'lealtad'} onClick={() => setActiveTab('lealtad')} icon={<StarIcon className="h-6 w-6" />} label="Lealtad" />
                    <TabButton isActive={activeTab === 'clientes'} onClick={() => setActiveTab('clientes')} icon={<UserGroupIcon className="h-6 w-6" />} label="Clientes" />
                    <TabButton isActive={activeTab === 'reportes'} onClick={() => setActiveTab('reportes')} icon={<DocumentMagnifyingGlassIcon className="h-6 w-6" />} label="Reportes" />
                    <TabButton isActive={activeTab === 'ajustes'} onClick={() => setActiveTab('ajustes')} icon={<BuildingStorefrontIcon className="h-6 w-6" />} label="Ajustes" />
                </div>
            </div>
            <div className="flex-grow bg-surface dark:bg-zinc-800 p-6 rounded-b-lg shadow-sm">
                {renderContent()}
            </div>
        </div>
    );
};

export default GestionView;