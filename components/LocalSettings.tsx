
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../store';
import type { RestaurantSettings, PaymentMethodDetail } from '../types';
import { CheckCircleIcon, ExclamationTriangleIcon, GlobeAltIcon } from './icons';
import ImageUpload from './ImageUpload';

// --- Helper Functions ---
const hexToHsl = (hex: string): { h: number; s: number; l: number } | null => {
    if (!hex || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) return null;
    let r, g, b;
    hex = hex.substring(1);
    if (hex.length === 3) {
      r = parseInt(hex.charAt(0).repeat(2), 16);
      g = parseInt(hex.charAt(1).repeat(2), 16);
      b = parseInt(hex.charAt(2).repeat(2), 16);
    } else {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};

const getLuminance = (r: number, g: number, b: number): number => {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

const getContrastRatio = (color1: string, color2: string): number => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    if (!rgb1 || !rgb2) return 1;
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
};

// --- Palette Definitions ---
const palettes = [
    { name: 'Food Safari', primary: '#F64D00', secondary: '#FFB40B', background: '#FFFFFF' },
    { name: 'Clásico Criollo', primary: '#C81E1E', secondary: '#FBBF24', background: '#FFFBEB' },
    { name: 'Costa Marina', primary: '#0D9488', secondary: '#FDE68A', background: '#F0F9FF' },
    { name: 'Andino Terroso', primary: '#E85D04', secondary: '#6B7280', background: '#F5F5F4' },
    { name: 'Nocturno Limeño', primary: '#F59E0B', secondary: '#9CA3AF', background: '#111827' },
];


// --- Sub-components ---

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

const OnlinePaymentConfigurator: React.FC<{
    label: string;
    config: PaymentMethodDetail;
    onChange: (config: PaymentMethodDetail) => void;
    placeholderPhone?: string;
    type?: 'wallet' | 'mercadopago';
}> = ({ label, config, onChange, placeholderPhone = "Número de Teléfono", type = 'wallet' }) => {
    return (
        <div className="bg-background dark:bg-gunmetal/50 rounded-lg border border-text-primary/10 dark:border-[#45535D] p-4 space-y-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => onChange({ ...config, enabled: !config.enabled })}>
                <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-text-primary dark:text-ivory-cream">{label}</h4>
                    {type === 'mercadopago' && <GlobeAltIcon className="h-5 w-5 text-blue-500" />}
                </div>
                <div className={`w-14 h-8 flex items-center rounded-full p-1 duration-300 ease-in-out ${config.enabled ? 'bg-primary' : 'bg-text-primary/20 dark:bg-[#56656E]'}`}>
                    <div className={`bg-white w-6 h-6 rounded-full shadow-md transform duration-300 ease-in-out ${config.enabled ? 'translate-x-6' : ''}`}></div>
                </div>
            </div>
            {config.enabled && (
                <div className="space-y-3 pt-3 border-t border-text-primary/10 dark:border-[#45535D] animate-fade-in-up">
                    <div>
                        <label className="text-xs font-semibold text-text-secondary dark:text-light-silver">Nombre del Titular / Negocio</label>
                        <input
                            type="text"
                            value={config.holderName || ''}
                            onChange={(e) => onChange({ ...config, holderName: e.target.value })}
                            className="w-full bg-surface dark:bg-[#34424D] p-2 mt-1 rounded-md border border-text-primary/10 dark:border-[#45535D]"
                            placeholder="Ej: Mi Restaurante SAC"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-text-secondary dark:text-light-silver">{placeholderPhone}</label>
                        <input
                            type="text"
                            value={config.phoneNumber || ''}
                            onChange={(e) => onChange({ ...config, phoneNumber: e.target.value })}
                            className="w-full bg-surface dark:bg-[#34424D] p-2 mt-1 rounded-md border border-text-primary/10 dark:border-[#45535D]"
                            placeholder={type === 'mercadopago' ? 'Opcional (si usas Alias)' : '999 999 999'}
                        />
                    </div>

                    {type === 'mercadopago' && (
                        <>
                             <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <label className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                    Link de Pago (Recomendado)
                                </label>
                                <input
                                    type="text"
                                    value={config.paymentLink || ''}
                                    onChange={(e) => onChange({ ...config, paymentLink: e.target.value })}
                                    className="w-full bg-surface dark:bg-[#34424D] p-2 mt-1 rounded-md border border-text-primary/10 dark:border-[#45535D]"
                                    placeholder="Ej: https://mpago.la/..."
                                />
                                <p className="text-[10px] text-text-secondary dark:text-light-silver mt-1">
                                    Pega aquí el link generado en tu panel de Mercado Pago. El cliente será redirigido para pagar.
                                </p>
                            </div>
                             <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                <label className="text-xs font-semibold text-text-secondary dark:text-light-silver">API Credentials (Para integración dinámica)</label>
                                <input
                                    type="text"
                                    value={config.publicKey || ''}
                                    onChange={(e) => onChange({ ...config, publicKey: e.target.value })}
                                    className="w-full bg-surface dark:bg-[#34424D] p-2 mt-2 rounded-md border border-text-primary/10 dark:border-[#45535D]"
                                    placeholder="Public Key (TEST-xxxx...)"
                                />
                                <input
                                    type="text"
                                    value={config.accessToken || ''}
                                    onChange={(e) => onChange({ ...config, accessToken: e.target.value })}
                                    className="w-full bg-surface dark:bg-[#34424D] p-2 mt-2 rounded-md border border-text-primary/10 dark:border-[#45535D]"
                                    placeholder="Access Token (TEST-xxxx...)"
                                />
                                <p className="text-[10px] text-amber-600 mt-1">Nota: Si el Access Token es bloqueado por el navegador (CORS), el sistema usará el Link de Pago como respaldo.</p>
                            </div>
                        </>
                    )}
                    
                    <ImageUpload 
                        currentImageUrl={config.qrUrl || ''} 
                        onImageChange={(url) => onChange({ ...config, qrUrl: url })}
                        label="Imagen del Código QR"
                    />
                </div>
            )}
        </div>
    );
};

const BrandingPreview: React.FC<{ primary: string; secondary: string; background: string }> = ({ primary, secondary, background }) => {
    const primaryHsl = hexToHsl(primary);
    const secondaryHsl = hexToHsl(secondary);
    
    const backgroundRgb = hexToRgb(background);
    const isDarkBg = backgroundRgb ? getLuminance(backgroundRgb.r, backgroundRgb.g, backgroundRgb.b) < 0.5 : false;
    const textColor = isDarkBg ? 'text-ivory-cream' : 'text-text-primary';
    const secondaryTextColor = isDarkBg ? 'text-light-silver' : 'text-text-secondary';

    const style = {
        ...(primaryHsl && {
            '--preview-primary-h': primaryHsl.h,
            '--preview-primary-s': `${primaryHsl.s}%`,
            '--preview-primary-l': `${primaryHsl.l}%`,
        }),
        ...(secondaryHsl && {
            '--preview-secondary-h': secondaryHsl.h,
            '--preview-secondary-s': `${secondaryHsl.s}%`,
            '--preview-secondary-l': `${secondaryHsl.l}%`,
        }),
        backgroundColor: background,
    } as React.CSSProperties;

    const primaryColorVar = 'hsl(var(--preview-primary-h), var(--preview-primary-s), var(--preview-primary-l))';
    const secondaryColorVar = 'hsl(var(--preview-secondary-h), var(--preview-secondary-s), var(--preview-secondary-l))';

    return (
        <div style={style} className={`p-4 rounded-xl border-2 border-dashed border-text-primary/10 dark:border-[#45535D] flex flex-col items-center justify-center h-full transition-colors duration-300 ${textColor}`}>
            <h4 className={`text-sm font-bold mb-4 ${secondaryTextColor}`}>Vista Previa</h4>
            <div className="space-y-4 w-full max-w-[200px]">
                <button style={{ backgroundColor: primaryColorVar }} className="w-full text-white font-bold py-2 rounded-lg shadow-md">
                    Botón Principal
                </button>
                <div className="text-center">
                    <p className="font-semibold" style={{ color: primaryColorVar }}>Texto de realce</p>
                    <p className={`text-xs ${secondaryTextColor}`}>Un texto secundario</p>
                </div>
                 <div style={{ backgroundColor: `hsla(var(--preview-secondary-h), var(--preview-secondary-s), var(--preview-secondary-l), 0.1)` }} className="flex items-center gap-2 p-2 rounded-lg">
                    <div style={{ backgroundColor: secondaryColorVar }} className="text-white p-1 rounded-md">
                        <CheckCircleIcon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: secondaryColorVar }}>Elemento de Acento</span>
                 </div>
            </div>
        </div>
    );
};

const ColorPickerSection: React.FC<{
    title: string;
    color: string;
    presets: string[];
    onChange: (color: string) => void;
    contrastCheck?: { against: string, label: string };
}> = ({ title, color, presets, onChange, contrastCheck }) => {
    const contrastRatio = useMemo(() => contrastCheck ? getContrastRatio(color, contrastCheck.against) : null, [color, contrastCheck]);
    const isContrastLow = contrastRatio !== null && contrastRatio < 4.5;

    return (
        <div>
            <label className="block text-sm font-medium text-text-secondary dark:text-light-silver mb-2">{title}</label>
            <div className="flex items-center gap-3">
                 <label className="relative h-12 w-12 rounded-md cursor-pointer border-2 border-text-primary/10 dark:border-[#56656E] overflow-hidden" style={{ backgroundColor: color }}>
                    <input type="color" value={color} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0"/>
                </label>
                <input type="text" value={color} onChange={(e) => onChange(e.target.value)} className="w-full bg-surface dark:bg-[#34424D] p-2 rounded-md border border-text-primary/10 dark:border-[#45535D] font-mono"/>
            </div>
            {isContrastLow && (
                <div className="mt-2 p-2 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs rounded-md flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <span>Bajo contraste con {contrastCheck?.label}. Puede ser difícil de leer.</span>
                </div>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
                {presets.map(presetColor => (
                    <button key={presetColor} style={{ backgroundColor: presetColor }} onClick={() => onChange(presetColor)} className={`w-8 h-8 rounded-full transition-transform hover:scale-110 border-2 ${color === presetColor ? 'border-white dark:border-ivory-cream shadow-md' : 'border-transparent'}`}></button>
                ))}
            </div>
        </div>
    );
};

const primaryPresets = ['#F64D00', '#F97316', '#EF4444', '#D97706', '#166534', '#1E40AF'];
const secondaryPresets = ['#FFB40B', '#F4D47C', '#84CC16', '#3B82F6', '#A855F7', '#6366F1', '#EC4899'];
const backgroundPresets = ['#FFFFFF', '#FDF6E3', '#F3F4F6', '#FEFCE8', '#EFF6FF', '#F0FDF4', '#111827'];

interface LocalSettingsProps {
    customSettings?: RestaurantSettings;
    onSave?: (settings: RestaurantSettings) => void;
}

const LocalSettings: React.FC<LocalSettingsProps> = ({ customSettings, onSave }) => {
    const { state, dispatch } = useAppContext();
    const activeSettings = customSettings || state.restaurantSettings || {} as RestaurantSettings;
    
    // Ensure default empty objects if activeSettings properties are missing (e.g. fresh DB record)
    const [settings, setSettings] = useState<RestaurantSettings>({
        ...activeSettings,
        tables: activeSettings.tables || [],
        branding: activeSettings.branding || {},
        modules: activeSettings.modules || {},
        paymentMethods: activeSettings.paymentMethods || {}
    });

    const [tablesInput, setTablesInput] = useState((activeSettings.tables || []).join(', '));
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'palettes' | 'custom'>('palettes');
    
    useEffect(() => {
        const sourceSettings = customSettings || state.restaurantSettings;
        if (sourceSettings) {
            setSettings({
                ...sourceSettings,
                tables: sourceSettings.tables || [],
                branding: sourceSettings.branding || {},
                modules: sourceSettings.modules || {},
                paymentMethods: sourceSettings.paymentMethods || {}
            });
            // Safe access to tables with fallback
            setTablesInput((sourceSettings.tables || []).join(', '));
        }
    }, [customSettings, state.restaurantSettings]);

    const handleModuleChange = (module: 'delivery' | 'local' | 'retiro', value: boolean) => {
        setSettings(prev => {
            const currentModules = prev.modules || { delivery: true, local: true, retiro: true };
            return {
                ...prev,
                modules: { ...currentModules, [module]: value }
            };
        });
    };
    
    const handlePaymentMethodChange = (method: 'efectivo' | 'tarjeta', value: boolean) => {
        setSettings(prev => ({ ...prev, paymentMethods: { ...prev.paymentMethods, [method]: value } }));
    };

    const handleOnlinePaymentMethodChange = (method: 'yape' | 'plin' | 'mercadopago', newConfig: PaymentMethodDetail) => {
        setSettings(prev => ({ ...prev, paymentMethods: { ...prev.paymentMethods, [method]: newConfig } }));
    };

    const handleBrandingChange = (field: 'primaryColor' | 'secondaryColor' | 'backgroundColor' | 'logoUrl', value: string) => {
        setSettings(prev => ({ ...prev, branding: { ...prev.branding, [field]: value } }));
    };
    
    const handleSelectPalette = (palette: { primary: string; secondary: string; background: string }) => {
        setSettings(prev => ({
            ...prev,
            branding: {
                ...prev.branding,
                primaryColor: palette.primary,
                secondaryColor: palette.secondary,
                backgroundColor: palette.background,
            }
        }));
    };
    
    const handleSave = () => {
        setIsSaving(true);
        // Safe split incase input is messed up, default to empty array
        const tables = tablesInput ? tablesInput.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0) : [];
        const uniqueTables = [...new Set(tables)].sort((a: number, b: number) => a - b);
        
        const finalSettings: RestaurantSettings = { ...settings, tables: uniqueTables };

        if (onSave) {
            onSave(finalSettings);
        } else {
            dispatch({ type: 'UPDATE_RESTAURANT_SETTINGS', payload: finalSettings });
            setTimeout(() => {
                dispatch({ type: 'ADD_TOAST', payload: { message: 'Ajustes guardados correctamente', type: 'success' } });
            }, 500);
        }
        
        setTimeout(() => setIsSaving(false), 500);
    };

    const branding = settings.branding || {};
    
    const isPaletteActive = (palette: typeof palettes[0]) => {
        return branding.primaryColor === palette.primary &&
               branding.secondaryColor === palette.secondary &&
               branding.backgroundColor === palette.background;
    };

    return (
        // REMOVED 'max-h' restriction class from here. This allows the parent modal to control scroll.
        <div className="animate-fade-in-up space-y-8 pr-3">
            <div>
                <h3 className="text-xl font-bold text-text-primary dark:text-ivory-cream mb-4">Apariencia y Marca</h3>
                <div className="bg-background dark:bg-gunmetal/50 p-4 rounded-xl border border-text-primary/5 dark:border-[#45535D]">
                    <div className="flex border-b border-text-primary/10 dark:border-[#45535D] mb-4">
                        <button onClick={() => setActiveTab('palettes')} className={`py-2 px-4 font-semibold border-b-2 ${activeTab === 'palettes' ? 'text-primary border-primary' : 'text-text-secondary border-transparent'}`}>Paletas</button>
                        <button onClick={() => setActiveTab('custom')} className={`py-2 px-4 font-semibold border-b-2 ${activeTab === 'custom' ? 'text-primary border-primary' : 'text-text-secondary border-transparent'}`}>Personalizado</button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {activeTab === 'palettes' ? (
                            <div className="animate-fade-in-up">
                                <h4 className="text-lg font-semibold text-text-primary dark:text-ivory-cream mb-3">Paletas Prediseñadas</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {palettes.map(palette => {
                                        const isActive = isPaletteActive(palette);
                                        return (
                                            <button key={palette.name} onClick={() => handleSelectPalette(palette)} className={`p-3 rounded-lg border-2 text-left relative transition-all ${isActive ? 'border-primary bg-primary/10' : 'border-text-primary/10 dark:border-[#45535D] bg-surface dark:bg-[#34424D] hover:border-primary/50'}`}>
                                                {isActive && <CheckCircleIcon className="h-6 w-6 text-primary absolute top-2 right-2" />}
                                                <p className="font-bold text-text-primary dark:text-ivory-cream">{palette.name}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <div style={{ backgroundColor: palette.primary }} className="h-8 flex-1 rounded"></div>
                                                    <div style={{ backgroundColor: palette.secondary }} className="h-8 flex-1 rounded"></div>
                                                    <div style={{ backgroundColor: palette.background }} className="h-8 flex-1 rounded border border-black/10"></div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                             <div className="space-y-6 animate-fade-in-up">
                                <ColorPickerSection
                                    title="Color Principal"
                                    color={branding.primaryColor || '#F64D00'}
                                    presets={primaryPresets}
                                    onChange={(color) => handleBrandingChange('primaryColor', color)}
                                    contrastCheck={{ against: '#FFFFFF', label: 'texto blanco' }}
                                />
                                <ColorPickerSection
                                    title="Color Secundario / Acento"
                                    color={branding.secondaryColor || '#FFB40B'}
                                    presets={secondaryPresets}
                                    onChange={(color) => handleBrandingChange('secondaryColor', color)}
                                />
                                <ColorPickerSection
                                    title="Color de Fondo (Modo Claro)"
                                    color={branding.backgroundColor || '#FFFFFF'}
                                    presets={backgroundPresets}
                                    onChange={(color) => handleBrandingChange('backgroundColor', color)}
                                />
                            </div>
                        )}
                        <BrandingPreview 
                            primary={branding.primaryColor || '#F64D00'}
                            secondary={branding.secondaryColor || '#FFB40B'}
                            background={branding.backgroundColor || '#FFFFFF'}
                        />
                    </div>
                     <div className="mt-6">
                        <ImageUpload 
                            currentImageUrl={branding.logoUrl || ''}
                            onImageChange={(url) => handleBrandingChange('logoUrl', url)}
                            label="Logotipo del Restaurante"
                        />
                    </div>
                </div>
            </div>

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
                <h3 className="text-xl font-bold text-text-primary dark:text-ivory-cream mb-4">Métodos de Pago</h3>
                <div className="space-y-3">
                    <ToggleSwitch
                        label="Efectivo"
                        description="Aceptar pagos en efectivo."
                        enabled={settings.paymentMethods?.efectivo !== false}
                        onChange={(val) => handlePaymentMethodChange('efectivo', val)}
                    />
                    <ToggleSwitch
                        label="Tarjeta (POS)"
                        description="Aceptar pagos con tarjeta de crédito/débito."
                        enabled={settings.paymentMethods?.tarjeta !== false}
                        onChange={(val) => handlePaymentMethodChange('tarjeta', val)}
                    />
                     <OnlinePaymentConfigurator
                        label="Yape"
                        config={settings.paymentMethods?.yape || { enabled: false }}
                        onChange={(config) => handleOnlinePaymentMethodChange('yape', config)}
                    />
                    <OnlinePaymentConfigurator
                        label="Plin"
                        config={settings.paymentMethods?.plin || { enabled: false }}
                        onChange={(config) => handleOnlinePaymentMethodChange('plin', config)}
                    />
                    <OnlinePaymentConfigurator
                        label="Mercado Pago"
                        type="mercadopago"
                        config={settings.paymentMethods?.mercadopago || { enabled: false }}
                        onChange={(config) => handleOnlinePaymentMethodChange('mercadopago', config)}
                        placeholderPhone="Alias (Opcional)"
                    />
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
