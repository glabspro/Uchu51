import React, { useState } from 'react';
import type { Producto, ClienteLeal, LoyaltyProgram } from '../types';
import ProductManager from './ProductManager';
import InventoryManager from './InventoryManager';
import CustomerManager from './CustomerManager';
import LoyaltyProgramManager from './LoyaltyProgramManager';
import { ShoppingBagIcon, ArchiveBoxIcon, SparklesIcon, UserGroupIcon, StarIcon } from './icons';

interface GestionViewProps {
    products: Producto[];
    setProducts: React.Dispatch<React.SetStateAction<Producto[]>>;
    customers: ClienteLeal[];
    programs: LoyaltyProgram[];
    setPrograms: React.Dispatch<React.SetStateAction<LoyaltyProgram[]>>;
}

type GestionTab = 'productos' | 'inventario' | 'promociones' | 'clientes' | 'lealtad';

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
                : 'text-text-secondary dark:text-slate-400 hover:bg-background/50 dark:hover:bg-slate-800/50 border-transparent hover:border-primary/40'
        }`}
    >
        {icon}
        <span className="hidden sm:inline">{label}</span>
    </button>
);

const PromotionsManager: React.FC = () => (
    <div className="text-center p-12 bg-background dark:bg-slate-800/50 rounded-lg">
        <h2 className="text-2xl font-bold text-text-primary dark:text-slate-200">Gestión de Promociones</h2>
        <p className="text-text-secondary dark:text-slate-400 mt-2">Este módulo para crear y gestionar combos y promociones está en desarrollo.</p>
    </div>
);


const GestionView: React.FC<GestionViewProps> = ({ products, setProducts, customers, programs, setPrograms }) => {
    const [activeTab, setActiveTab] = useState<GestionTab>('productos');

    const renderContent = () => {
        switch (activeTab) {
            case 'productos':
                return <ProductManager products={products} setProducts={setProducts} />;
            case 'inventario':
                return <InventoryManager products={products} setProducts={setProducts} />;
            case 'promociones':
                return <PromotionsManager />;
            case 'clientes':
                return <CustomerManager customers={customers} />;
            case 'lealtad':
                return <LoyaltyProgramManager programs={programs} setPrograms={setPrograms} products={products} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <h1 className="text-3xl font-heading font-bold mb-4 text-text-primary dark:text-slate-100">Gestión del Negocio</h1>
            <div className="bg-surface dark:bg-slate-800 rounded-t-lg shadow-sm flex-shrink-0">
                <div className="flex space-x-1 border-b border-text-primary/5 dark:border-slate-700">
                    <TabButton isActive={activeTab === 'productos'} onClick={() => setActiveTab('productos')} icon={<ShoppingBagIcon className="h-6 w-6" />} label="Productos" />
                    <TabButton isActive={activeTab === 'inventario'} onClick={() => setActiveTab('inventario')} icon={<ArchiveBoxIcon className="h-6 w-6" />} label="Inventario" />
                    <TabButton isActive={activeTab === 'lealtad'} onClick={() => setActiveTab('lealtad')} icon={<StarIcon className="h-6 w-6" />} label="Lealtad" />
                    <TabButton isActive={activeTab === 'clientes'} onClick={() => setActiveTab('clientes')} icon={<UserGroupIcon className="h-6 w-6" />} label="Clientes" />
                    <TabButton isActive={activeTab === 'promociones'} onClick={() => setActiveTab('promociones')} icon={<SparklesIcon className="h-6 w-6" />} label="Promociones" />
                </div>
            </div>
            <div className="flex-grow bg-surface dark:bg-slate-800 p-6 rounded-b-lg shadow-sm">
                {renderContent()}
            </div>
        </div>
    );
};

export default GestionView;