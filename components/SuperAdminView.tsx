
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import { BuildingStorefrontIcon, PlusIcon, AdjustmentsHorizontalIcon, HomeIcon, LogoutIcon, UserGroupIcon } from './icons';
import CreateRestaurantModal from './CreateRestaurantModal';
import BusinessDetailModal from './BusinessDetailModal';
import { Logo } from './Logo';

// Mock data as Supabase is removed
const MOCK_RESTAURANTS = [
    { id: 'd290f1ee-6c54-4b01-90e6-d701748f0851', name: 'Uchu51 Demo Restaurant', plan_id: 'pro', created_at: new Date().toISOString(), settings: {} },
    // You could add more mock restaurants here to test the list
];

const SuperAdminView: React.FC = () => {
    const { dispatch } = useAppContext();
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
    
    // Management State
    const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null);

    const onLogout = () => dispatch({ type: 'LOGOUT' });
    const onGoToOperation = () => dispatch({ type: 'SET_STATE', payload: { appView: 'staff_login' } });

    const fetchRestaurants = () => {
        setIsLoading(true);
        setTimeout(() => {
            setRestaurants(MOCK_RESTAURANTS);
            setIsLoading(false);
        }, 500);
    };

    useEffect(() => {
        fetchRestaurants();
    }, []);

    return (
        <div className="min-h-screen bg-background dark:bg-zinc-900 text-text-primary dark:text-zinc-200 font-sans">
            {isRestaurantModalOpen && <CreateRestaurantModal onClose={() => setIsRestaurantModalOpen(false)} onCreated={fetchRestaurants} />}
            
            {/* The Management Modal */}
            {selectedRestaurant && (
                <BusinessDetailModal 
                    restaurant={selectedRestaurant} 
                    onClose={() => setSelectedRestaurant(null)} 
                    onUpdate={fetchRestaurants}
                />
            )}
            
            <header className="bg-surface dark:bg-zinc-800 shadow-md p-4 flex flex-col md:flex-row justify-between items-center border-b border-text-primary/5 dark:border-zinc-700 sticky top-0 z-10 gap-4">
                <div className="flex items-center gap-4">
                    <Logo className="h-10 w-auto" />
                    <div className="hidden md:block h-8 w-px bg-gray-300 dark:bg-zinc-600"></div>
                    <h1 className="text-lg font-bold text-text-secondary dark:text-zinc-400 hidden md:block">Panel Central</h1>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
                    <button 
                        onClick={onLogout}
                        className="flex items-center gap-2 text-text-secondary hover:text-primary dark:text-zinc-400 dark:hover:text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm whitespace-nowrap"
                        title="Volver a la vista de cliente"
                    >
                        <HomeIcon className="h-5 w-5" />
                        <span className="hidden sm:inline">Ir a Tienda</span>
                    </button>
                    <div className="h-6 w-px bg-gray-300 dark:bg-zinc-600 mx-1"></div>
                    <button 
                        onClick={onGoToOperation}
                        className="flex items-center gap-2 bg-success hover:bg-success/90 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md text-sm whitespace-nowrap"
                    >
                        <UserGroupIcon className="h-5 w-5" />
                        Ir a Operación (TPV)
                    </button>
                    <button 
                        onClick={onLogout} 
                        className="flex items-center gap-2 bg-text-primary/10 hover:bg-danger/10 text-text-secondary hover:text-danger dark:text-zinc-400 dark:hover:text-red-400 font-semibold py-2 px-3 rounded-lg transition-colors text-sm whitespace-nowrap"
                        title="Cerrar Sesión de Administrador"
                    >
                        <LogoutIcon className="h-5 w-5" />
                    </button>
                </div>
            </header>

            <main className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 animate-fade-in-up gap-4">
                    <div>
                        <h2 className="text-3xl font-heading font-bold text-text-primary dark:text-zinc-100">Mis Negocios</h2>
                        <p className="text-text-secondary dark:text-zinc-400 mt-1">Administra la configuración y personal de tus restaurantes.</p>
                    </div>
                    <button onClick={() => setIsRestaurantModalOpen(true)} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-transform active:scale-95 w-full md:w-auto justify-center">
                        <PlusIcon className="h-6 w-6" /> Nuevo Negocio
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                        {restaurants.length > 0 ? restaurants.map(r => (
                            <div key={r.id} className="bg-surface dark:bg-zinc-800 rounded-2xl shadow-lg border border-text-primary/5 dark:border-zinc-700 overflow-hidden hover:shadow-xl transition-shadow flex flex-col group">
                                <div className="p-6 flex-grow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="bg-primary/10 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                            <BuildingStorefrontIcon className="h-8 w-8 text-primary" />
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                            r.plan_id === 'pro' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                            {r.plan_id}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-text-primary dark:text-zinc-100 mb-1">{r.name}</h3>
                                    <p className="text-sm text-text-secondary dark:text-zinc-400">Registrado: {new Date(r.created_at).toLocaleDateString()}</p>
                                    <div className="mt-4 pt-4 border-t border-text-primary/5 dark:border-zinc-700">
                                        <p className="text-xs font-mono text-text-secondary/60 dark:text-zinc-600 truncate">ID: {r.id}</p>
                                    </div>
                                </div>
                                <div className="bg-background dark:bg-zinc-900/50 p-4 border-t border-text-primary/5 dark:border-zinc-700">
                                    <button 
                                        onClick={() => setSelectedRestaurant(r)}
                                        className="w-full flex items-center justify-center gap-2 bg-text-primary dark:bg-zinc-700 hover:bg-text-primary/90 dark:hover:bg-zinc-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-md"
                                    >
                                        <AdjustmentsHorizontalIcon className="h-5 w-5" />
                                        Gestionar
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center p-16 text-text-secondary dark:text-zinc-500 bg-surface dark:bg-zinc-800 rounded-2xl border border-dashed border-text-primary/20 dark:border-zinc-700">
                                <BuildingStorefrontIcon className="h-16 w-16 mx-auto mb-4 opacity-50"/>
                                <p className="text-lg font-semibold">No hay negocios registrados.</p>
                                <p>Crea tu primer restaurante para comenzar.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default SuperAdminView;
