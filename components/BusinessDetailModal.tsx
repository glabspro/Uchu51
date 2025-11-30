
import React, { useState } from 'react';
import type { Employee, RestaurantSettings } from '../types';
import { BuildingStorefrontIcon, UserGroupIcon, AdjustmentsHorizontalIcon, XMarkIcon, PlusIcon, TrashIcon, AdjustmentsHorizontalIcon as PencilIcon, InformationCircleIcon } from './icons';
import LocalSettings from './LocalSettings';
import EmployeeModal from './EmployeeModal';
import { useAppContext } from '../store';

interface BusinessDetailModalProps {
    restaurant: any; // Using any for mock structure flexibility
    onClose: () => void;
    onUpdate: () => void; // Trigger refresh of list
}

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ isActive, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 py-3 px-6 font-bold transition-colors border-b-2 ${
            isActive ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary dark:text-zinc-400 dark:hover:text-zinc-200'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const BusinessDetailModal: React.FC<BusinessDetailModalProps> = ({ restaurant, onClose, onUpdate }) => {
    const { state, dispatch } = useAppContext();
    const { employees, restaurantSettings: globalSettings } = state;
    const [activeTab, setActiveTab] = useState<'info' | 'staff' | 'settings'>('info');
    
    // Employee Management State within Modal
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    // Mock filtering employees for THIS restaurant (in real app, query by ID)
    const restaurantEmployees = employees.filter(e => e.restaurant_id === restaurant.id || !e.restaurant_id /* fallback for legacy */);

    const handleSaveEmployee = (emp: Employee) => {
        const empWithRestId = { ...emp, restaurant_id: restaurant.id };
        if (editingEmployee) {
            dispatch({ type: 'UPDATE_EMPLOYEE', payload: empWithRestId });
        } else {
            dispatch({ type: 'ADD_EMPLOYEE', payload: empWithRestId });
        }
        setIsEmployeeModalOpen(false);
    };

    const handleDeleteEmployee = (id: string) => {
        if (window.confirm('¿Eliminar empleado?')) {
            dispatch({ type: 'DELETE_EMPLOYEE', payload: id });
        }
    };

    const handleSettingsSave = (newSettings: RestaurantSettings) => {
        // In a real app, we would save this to the specific restaurant record in DB
        console.log("Saving settings for restaurant:", restaurant.id, newSettings);
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Configuración guardada (Simulado)', type: 'success' } });
    };

    // Prepare safe settings object by merging specific settings with global defaults/current state
    // This ensures LocalSettings never receives an empty object that causes crashes
    const defaultSettings: RestaurantSettings = {
        cooks: [], drivers: [], tables: [],
        branding: {}, modules: {}, paymentMethods: {}
    };

    const baseSettings = globalSettings || defaultSettings;

    const mergedSettings: RestaurantSettings = {
        ...baseSettings,
        ...restaurant.settings,
        tables: restaurant.settings?.tables || baseSettings.tables || [],
        modules: restaurant.settings?.modules || baseSettings.modules || {},
        paymentMethods: restaurant.settings?.paymentMethods || baseSettings.paymentMethods || {},
        branding: restaurant.settings?.branding || baseSettings.branding || {}
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            {isEmployeeModalOpen && (
                <EmployeeModal 
                    employee={editingEmployee} 
                    onSave={handleSaveEmployee} 
                    onClose={() => setIsEmployeeModalOpen(false)} 
                />
            )}
            
            <div className="bg-surface dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-fade-in-scale">
                {/* Header */}
                <div className="bg-surface dark:bg-zinc-800 border-b border-text-primary/5 dark:border-zinc-700 p-4 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <BuildingStorefrontIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-primary dark:text-zinc-100">{restaurant.name}</h2>
                            <p className="text-xs text-text-secondary dark:text-zinc-400 font-mono">ID: {restaurant.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-text-primary/10 dark:hover:bg-zinc-700 rounded-full transition-colors">
                        <XMarkIcon className="h-6 w-6 text-text-secondary" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-text-primary/5 dark:border-zinc-700 bg-surface dark:bg-zinc-800 px-4 flex-shrink-0">
                    <TabButton isActive={activeTab === 'info'} onClick={() => setActiveTab('info')} icon={<BuildingStorefrontIcon className="h-5 w-5"/>} label="Datos" />
                    <TabButton isActive={activeTab === 'staff'} onClick={() => setActiveTab('staff')} icon={<UserGroupIcon className="h-5 w-5"/>} label="Personal y PINs" />
                    <TabButton isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<AdjustmentsHorizontalIcon className="h-5 w-5"/>} label="Configuración" />
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-6 bg-background dark:bg-zinc-900">
                    {activeTab === 'info' && (
                        <div className="max-w-3xl mx-auto space-y-6">
                            <div className="bg-surface dark:bg-zinc-800 p-6 rounded-xl border border-text-primary/5 dark:border-zinc-700">
                                <h3 className="text-lg font-bold mb-4">Información General</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Nombre del Negocio</label>
                                        <input type="text" defaultValue={restaurant.name} className="w-full bg-background dark:bg-zinc-700 border border-text-primary/10 rounded-lg p-2.5" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Plan Actual</label>
                                        <select defaultValue={restaurant.plan_id} className="w-full bg-background dark:bg-zinc-700 border border-text-primary/10 rounded-lg p-2.5">
                                            <option value="basic">Básico</option>
                                            <option value="pro">Profesional</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>
                                    </div>
                                </div>
                                
                                {/* Plans Explanation Box */}
                                <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                    <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-2">
                                        <InformationCircleIcon className="h-4 w-4" />
                                        Detalle de los Planes
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-text-secondary dark:text-zinc-400">
                                        <div className="p-2 bg-white dark:bg-zinc-800 rounded border border-text-primary/5">
                                            <span className="font-bold block mb-1">Básico (Startups)</span>
                                            POS, Toma de pedidos y Ticket digital. Ideal para iniciar.
                                        </div>
                                        <div className="p-2 bg-white dark:bg-zinc-800 rounded border border-text-primary/5">
                                            <span className="font-bold block mb-1">Profesional (Estándar)</span>
                                            Incluye Inventario (Kardex), Roles de Empleados y Reportes avanzados.
                                        </div>
                                        <div className="p-2 bg-white dark:bg-zinc-800 rounded border border-text-primary/5">
                                            <span className="font-bold block mb-1">Enterprise (Cadenas)</span>
                                            API, Multi-local, Business Intelligence y Soporte prioritario.
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform active:scale-95">
                                        Guardar Cambios
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'staff' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold">Equipo de Trabajo</h3>
                                    <p className="text-sm text-text-secondary">Gestiona los accesos y roles para este local.</p>
                                </div>
                                <button 
                                    onClick={() => { setEditingEmployee(null); setIsEmployeeModalOpen(true); }}
                                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow-md"
                                >
                                    <PlusIcon className="h-5 w-5"/> Agregar Empleado
                                </button>
                            </div>

                            <div className="bg-surface dark:bg-zinc-800 rounded-xl border border-text-primary/5 dark:border-zinc-700 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-background dark:bg-zinc-700/50 text-text-secondary uppercase">
                                        <tr>
                                            <th className="p-4 font-bold">Nombre</th>
                                            <th className="p-4 font-bold">Rol</th>
                                            <th className="p-4 font-bold text-center">PIN</th>
                                            <th className="p-4 font-bold text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-text-primary/5 dark:divide-zinc-700">
                                        {restaurantEmployees.length > 0 ? restaurantEmployees.map(emp => (
                                            <tr key={emp.id} className="hover:bg-background dark:hover:bg-zinc-700/30">
                                                <td className="p-4 font-bold">{emp.name}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase
                                                        ${emp.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                                                          emp.role === 'kitchen' ? 'bg-orange-100 text-orange-700' :
                                                          emp.role === 'delivery' ? 'bg-cyan-100 text-cyan-700' : 
                                                          emp.role === 'cashier' ? 'bg-emerald-100 text-emerald-700' :
                                                          'bg-blue-100 text-blue-700'}`}>
                                                        {emp.role}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center font-mono font-bold text-lg tracking-widest">{emp.pin_code}</td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => { setEditingEmployee(emp); setIsEmployeeModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><PencilIcon className="h-4 w-4"/></button>
                                                        <button onClick={() => handleDeleteEmployee(emp.id)} className="p-2 text-danger hover:bg-red-50 rounded-lg"><TrashIcon className="h-4 w-4"/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-text-secondary">No hay empleados registrados en este local.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <LocalSettings 
                            customSettings={mergedSettings}
                            onSave={handleSettingsSave}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default BusinessDetailModal;
