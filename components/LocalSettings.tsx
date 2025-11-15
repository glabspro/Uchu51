import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import type { RestaurantSettings } from '../types';
import { CheckCircleIcon } from './icons';

const ToggleSwitch: React.FC<{
    label: string;
    description: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}> = ({ label, description, enabled, onChange }) => (
    <div
        onClick={() => onChange(!enabled)}
        className="flex items-center justify-between p-4 bg-background dark:bg-gunmetal/50 rounded-lg border border-text-primary/10 dark:border-[#45535D] cursor-pointer hover:border-primary/50 transition-colors"
    >
        <div>
            <h4 className="font-semibold text-text-primary dark:text-ivory-cream">{label}</h4>
            <p className="text-sm text-text-secondary dark:text-light-silver">{description}</p>
        </div>
        <div className={`w-14 h-8 flex items-center rounded-full p-1 duration-300 ease-in-out ${enabled ? 'bg-primary' : 'bg-text-primary/20 dark:bg-[#56656E]'}`}>
            <div className={`bg-white w-6 h-6 rounded-full shadow-md transform duration-300 ease-in-out ${enabled ? 'translate-x-6' : ''}`}></div>
        </div>
    </div>
);


const LocalSettings: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [settings, setSettings] = useState<RestaurantSettings>(state.restaurantSettings!);
    const [tablesInput, setTablesInput] = useState(state.restaurantSettings?.tables.join(', ') || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setSettings(state.restaurantSettings!);
        setTablesInput(state.restaurantSettings?.tables.join(', ') || '');
    }, [state.restaurantSettings]);

    const handleModuleChange = (module: 'delivery' | 'local' | 'retiro', value: boolean) => {
        setSettings(prev => ({
            ...prev,
            modules: {
                ...prev.modules,
                [module]: value,
            }
        }));
    };
    
    const handleBrandingChange = (field: 'primaryColor' | 'logoUrl', value: string) => {
        setSettings(prev => ({
            ...prev,
            branding: {
                ...prev.branding,
                [field]: value
            }
        }));
    };
    
    const handleSave = () => {
        setIsSaving(true);
        const tables = tablesInput.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0);
        // FIX: Explicitly typed the sort function parameters `a` and `b` as numbers. This resolves a TypeScript error where the type inference was failing, causing an issue with the arithmetic operation `a - b`.
        const uniqueTables = [...new Set(tables)].sort((a: number, b: number) => a - b);
        
        const finalSettings: RestaurantSettings = {
            ...settings,
            tables: uniqueTables
        };

        dispatch({ type: 'UPDATE_RESTAURANT_SETTINGS', payload: finalSettings });
        
        setTimeout(() => {
            setIsSaving(false);
            dispatch({ type: 'ADD_TOAST', payload: { message: 'Ajustes guardados correctamente', type: 'success' } });
        }, 500);
    };

    return (
        <div className="animate-fade-in-up space-y-8 max-h-[calc(100vh-22rem)] overflow-y-auto pr-3">
            <div>
                <h3 className="text-xl font-bold text-text-primary dark:text-ivory-cream mb-4">Módulos de Venta</h3>
                <div className="space-y-3">
                    <ToggleSwitch 
                        label="Salón / Mesas"
                        description="Gestiona pedidos para clientes que comen en el local."
                        enabled={settings.modules?.local !== false}
                        onChange={(val) => handleModuleChange('local', val)}
                    />
                     <ToggleSwitch 
                        label="Delivery"
                        description="Activa la opción para recibir y gestionar pedidos a domicilio."
                        enabled={settings.modules?.delivery !== false}
                        onChange={(val) => handleModuleChange('delivery', val)}
                    />
                     <ToggleSwitch 
                        label="Retiro en Tienda"
                        description="Permite que los clientes hagan pedidos para recoger."
                        enabled={settings.modules?.retiro !== false}
                        onChange={(val) => handleModuleChange('retiro', val)}
                    />
                </div>
            </div>

            <div>
                 <h3 className="text-xl font-bold text-text-primary dark:text-ivory-cream mb-4">Apariencia y Marca</h3>
                 <div className="bg-background dark:bg-gunmetal/50 p-4 rounded-xl border border-text-primary/5 dark:border-[#45535D] space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-light-silver mb-1">Color Principal</label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={settings.branding?.primaryColor || '#F97316'} onChange={(e) => handleBrandingChange('primaryColor', e.target.value)} className="h-10 w-10 p-1 bg-transparent border-none rounded-md cursor-pointer"/>
                                <input type="text" value={settings.branding?.primaryColor || '#F97316'} onChange={(e) => handleBrandingChange('primaryColor', e.target.value)} className="w-full bg-surface dark:bg-[#34424D] p-2 rounded-md border border-text-primary/10 dark:border-[#45535D]"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-light-silver mb-1">URL del Logo</label>
                            <input type="text" placeholder="https://ejemplo.com/logo.png" value={settings.branding?.logoUrl || ''} onChange={(e) => handleBrandingChange('logoUrl', e.target.value)} className="w-full bg-surface dark:bg-[#34424D] p-2 rounded-md border border-text-primary/10 dark:border-[#45535D]"/>
                        </div>
                    </div>
                 </div>
            </div>

            <div>
                 <h3 className="text-xl font-bold text-text-primary dark:text-ivory-cream mb-4">Configuración del Salón</h3>
                 <div className="bg-background dark:bg-gunmetal/50 p-4 rounded-xl border border-text-primary/5 dark:border-[#45535D]">
                    <label className="block text-sm font-medium text-text-secondary dark:text-light-silver mb-1">Mesas Disponibles</label>
                    <textarea 
                        value={tablesInput}
                        onChange={(e) => setTablesInput(e.target.value)}
                        rows={2}
                        className="w-full bg-surface dark:bg-[#34424D] p-2 rounded-md border border-text-primary/10 dark:border-[#45535D] font-mono"
                        placeholder="1, 2, 3, 5, 10"
                    />
                    <p className="text-xs text-text-secondary dark:text-light-silver mt-1">Separa los números de mesa con comas.</p>
                 </div>
            </div>
            
             <div className="pt-4 border-t border-text-primary/10 dark:border-[#45535D] flex justify-end">
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all hover:-translate-y-0.5 active:scale-95 disabled:bg-gray-400 disabled:cursor-wait"
                >
                    {isSaving ? (
                        <>
                         <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                        </>
                    ) : (
                        <>
                        <CheckCircleIcon className="h-5 w-5" />
                        Guardar Cambios
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default LocalSettings;
