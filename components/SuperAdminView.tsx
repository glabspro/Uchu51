import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import { BuildingStorefrontIcon } from './icons';
import CreateRestaurantModal from './CreateRestaurantModal';
import { Logo } from './Logo';

// Mock data as Supabase is removed
const MOCK_RESTAURANTS = [
    { id: 'd290f1ee-6c54-4b01-90e6-d701748f0851', name: 'Uchu51 Demo Restaurant', plan_id: 'pro', created_at: new Date().toISOString(), settings: {} },
];


const SuperAdminView: React.FC = () => {
    const { dispatch } = useAppContext();
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const onLogout = () => dispatch({ type: 'LOGOUT' });

    const fetchRestaurants = () => {
        setIsLoading(true);
        setError(null);
        setTimeout(() => {
            setRestaurants(MOCK_RESTAURANTS);
            setIsLoading(false);
        }, 500);
    };

    useEffect(() => {
        fetchRestaurants();
    }, []);

    return (
        <div className="min-h-screen bg-background dark:bg-zinc-900 text-text-primary dark:text-zinc-200">
            {isModalOpen && <CreateRestaurantModal onClose={() => setIsModalOpen(false)} onCreated={fetchRestaurants} />}
            <header className="bg-surface dark:bg-zinc-800 shadow-md p-4 flex justify-between items-center border-b border-text-primary/5 dark:border-zinc-700">
                <div className="flex items-center gap-4">
                    <Logo className="h-10 w-auto" />
                    <h1 className="text-xl font-bold">Panel de Super Administrador</h1>
                </div>
                <button onClick={onLogout} className="font-semibold text-text-secondary hover:text-danger dark:text-zinc-400 dark:hover:text-red-400 transition-colors">
                    Salir
                </button>
            </header>

            <main className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-text-primary dark:text-zinc-100">Negocios Registrados ({restaurants.length})</h2>
                </div>

                {isLoading && <p>Cargando negocios...</p>}
                {error && <p className="text-danger">Error: {error}</p>}
                
                {!isLoading && !error && (
                    <div className="bg-surface dark:bg-zinc-800 rounded-xl border border-text-primary/5 dark:border-zinc-700 overflow-hidden">
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-background dark:bg-zinc-700/50">
                                    <tr>
                                        <th className="p-3 font-semibold text-left">Nombre del Restaurante</th>
                                        <th className="p-3 font-semibold text-left">Plan</th>
                                        <th className="p-3 font-semibold text-left">Fecha de Registro</th>
                                        <th className="p-3 font-semibold text-left">ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-text-primary/5 dark:divide-zinc-700">
                                    {restaurants.length > 0 ? restaurants.map(r => (
                                        <tr key={r.id} className="hover:bg-background dark:hover:bg-zinc-700/50">
                                            <td className="p-3 font-medium">{r.name}</td>
                                            <td className="p-3"><span className="bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full text-xs">{r.plan_id}</span></td>
                                            <td className="p-3 text-text-secondary dark:text-zinc-400">{new Date(r.created_at).toLocaleDateString()}</td>
                                            <td className="p-3 font-mono text-xs text-text-secondary/70 dark:text-zinc-500">{r.id}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="text-center p-16 text-text-secondary dark:text-zinc-500">
                                                <BuildingStorefrontIcon className="h-12 w-12 mx-auto mb-2"/>
                                                <p className="font-semibold">No hay negocios registrados.</p>
                                                <p className="text-xs">El super-admin debe crear un negocio para empezar.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SuperAdminView;