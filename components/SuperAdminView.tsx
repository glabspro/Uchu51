
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import { BuildingStorefrontIcon, UserGroupIcon, PlusIcon, AdjustmentsHorizontalIcon as PencilIcon, TrashIcon, ArrowDownOnSquareIcon } from './icons';
import CreateRestaurantModal from './CreateRestaurantModal';
import EmployeeModal from './EmployeeModal';
import { Logo } from './Logo';
import type { Employee } from '../types';

// Mock data as Supabase is removed
const MOCK_RESTAURANTS = [
    { id: 'd290f1ee-6c54-4b01-90e6-d701748f0851', name: 'Uchu51 Demo Restaurant', plan_id: 'pro', created_at: new Date().toISOString(), settings: {} },
];

const SuperAdminView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { employees } = state;
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
    
    // Employee Management State
    const [activeTab, setActiveTab] = useState<'restaurants' | 'staff'>('restaurants');
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    const onLogout = () => dispatch({ type: 'LOGOUT' });
    const onGoToOperation = () => dispatch({ type: 'SET_STATE', payload: { appView: 'staff_login' } });

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

    // Employee Handlers
    const handleAddEmployee = () => {
        setEditingEmployee(null);
        setIsEmployeeModalOpen(true);
    };

    const handleEditEmployee = (emp: Employee) => {
        setEditingEmployee(emp);
        setIsEmployeeModalOpen(true);
    };

    const handleDeleteEmployee = (id: string) => {
        if (window.confirm('¿Seguro que deseas eliminar este empleado?')) {
            dispatch({ type: 'DELETE_EMPLOYEE', payload: id });
        }
    };

    const handleSaveEmployee = (emp: Employee) => {
        if (editingEmployee) {
            dispatch({ type: 'UPDATE_EMPLOYEE', payload: emp });
        } else {
            dispatch({ type: 'ADD_EMPLOYEE', payload: emp });
        }
        setIsEmployeeModalOpen(false);
    };

    return (
        <div className="min-h-screen bg-background dark:bg-zinc-900 text-text-primary dark:text-zinc-200">
            {isRestaurantModalOpen && <CreateRestaurantModal onClose={() => setIsRestaurantModalOpen(false)} onCreated={fetchRestaurants} />}
            {isEmployeeModalOpen && <EmployeeModal employee={editingEmployee} onSave={handleSaveEmployee} onClose={() => setIsEmployeeModalOpen(false)} />}
            
            <header className="bg-surface dark:bg-zinc-800 shadow-md p-4 flex justify-between items-center border-b border-text-primary/5 dark:border-zinc-700">
                <div className="flex items-center gap-4">
                    <Logo className="h-10 w-auto" />
                    <h1 className="text-xl font-bold border-l pl-4 border-gray-300 dark:border-zinc-600">Configuración Global</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onGoToOperation}
                        className="flex items-center gap-2 bg-success hover:bg-success/90 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md"
                    >
                        Ir a Operación (TPV)
                    </button>
                    <button onClick={onLogout} className="font-semibold text-text-secondary hover:text-danger dark:text-zinc-400 dark:hover:text-red-400 transition-colors">
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            <main className="p-8 max-w-7xl mx-auto">
                {/* Tabs */}
                <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-zinc-700">
                    <button
                        onClick={() => setActiveTab('restaurants')}
                        className={`pb-2 px-4 font-bold text-lg transition-colors border-b-2 ${
                            activeTab === 'restaurants' 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-text-secondary hover:text-text-primary dark:text-zinc-400 dark:hover:text-white'
                        }`}
                    >
                        Mis Negocios
                    </button>
                    <button
                        onClick={() => setActiveTab('staff')}
                        className={`pb-2 px-4 font-bold text-lg transition-colors border-b-2 ${
                            activeTab === 'staff' 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-text-secondary hover:text-text-primary dark:text-zinc-400 dark:hover:text-white'
                        }`}
                    >
                        Gestión de Personal
                    </button>
                </div>

                {activeTab === 'restaurants' && (
                    <div className="animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-text-primary dark:text-zinc-100">Negocios Registrados ({restaurants.length})</h2>
                            <button onClick={() => setIsRestaurantModalOpen(true)} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform active:scale-95">
                                <PlusIcon className="h-5 w-5" /> Nuevo Negocio
                            </button>
                        </div>

                        {isLoading && <p>Cargando negocios...</p>}
                        {error && <p className="text-danger">Error: {error}</p>}
                        
                        {!isLoading && !error && (
                            <div className="bg-surface dark:bg-zinc-800 rounded-xl border border-text-primary/5 dark:border-zinc-700 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-background dark:bg-zinc-700/50">
                                            <tr>
                                                <th className="p-4 font-semibold text-left">Nombre del Restaurante</th>
                                                <th className="p-4 font-semibold text-left">Plan</th>
                                                <th className="p-4 font-semibold text-left">Fecha de Registro</th>
                                                <th className="p-4 font-semibold text-left">ID</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-text-primary/5 dark:divide-zinc-700">
                                            {restaurants.length > 0 ? restaurants.map(r => (
                                                <tr key={r.id} className="hover:bg-background dark:hover:bg-zinc-700/50">
                                                    <td className="p-4 font-medium text-lg">{r.name}</td>
                                                    <td className="p-4"><span className="bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full text-xs uppercase">{r.plan_id}</span></td>
                                                    <td className="p-4 text-text-secondary dark:text-zinc-400">{new Date(r.created_at).toLocaleDateString()}</td>
                                                    <td className="p-4 font-mono text-xs text-text-secondary/70 dark:text-zinc-500">{r.id}</td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={4} className="text-center p-16 text-text-secondary dark:text-zinc-500">
                                                        <BuildingStorefrontIcon className="h-12 w-12 mx-auto mb-2"/>
                                                        <p className="font-semibold">No hay negocios registrados.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'staff' && (
                    <div className="animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-text-primary dark:text-zinc-100">Personal y Accesos</h2>
                                <p className="text-sm text-text-secondary dark:text-zinc-400">Crea los PINs de acceso para tus empleados.</p>
                            </div>
                            <button onClick={handleAddEmployee} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform active:scale-95">
                                <PlusIcon className="h-5 w-5" /> Nuevo Empleado
                            </button>
                        </div>

                        <div className="bg-surface dark:bg-zinc-800 rounded-xl border border-text-primary/5 dark:border-zinc-700 overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-background dark:bg-zinc-700/50 text-text-secondary dark:text-zinc-400 text-sm uppercase">
                                    <tr>
                                        <th className="p-4 font-bold">Nombre</th>
                                        <th className="p-4 font-bold">Rol</th>
                                        <th className="p-4 font-bold text-center">PIN de Acceso</th>
                                        <th className="p-4 font-bold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-text-primary/5 dark:divide-zinc-700">
                                    {employees.length > 0 ? employees.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-background dark:hover:bg-zinc-700/30">
                                            <td className="p-4 font-bold text-text-primary dark:text-zinc-200">{emp.name}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase
                                                    ${emp.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 
                                                      emp.role === 'kitchen' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                                                      emp.role === 'delivery' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' : 
                                                      emp.role === 'cashier' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                                                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                                    {emp.role === 'waiter' ? 'Mozo' : 
                                                     emp.role === 'cashier' ? 'Caja' :
                                                     emp.role === 'kitchen' ? 'Cocina' :
                                                     emp.role === 'delivery' ? 'Delivery' :
                                                     emp.role === 'admin' ? 'Admin' : emp.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="font-mono text-lg font-bold bg-gray-100 dark:bg-zinc-700 px-3 py-1 rounded tracking-widest text-text-primary dark:text-zinc-200">
                                                    {emp.pin_code}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleEditEmployee(emp)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <PencilIcon className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => handleDeleteEmployee(emp.id)} className="p-2 text-danger hover:bg-red-50 rounded-lg transition-colors">
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="p-16 text-center text-text-secondary dark:text-zinc-500">
                                                <UserGroupIcon className="h-12 w-12 mx-auto mb-2 opacity-50"/>
                                                <p>No hay empleados registrados.</p>
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
