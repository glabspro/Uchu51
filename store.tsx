import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { getSupabase, type Database } from './utils/supabase';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type {
    Pedido, Producto, Promocion, Salsa, ClienteLeal, LoyaltyProgram, Recompensa, Mesa,
    CajaSession, MovimientoCaja, EstadoPedido, UserRole, View, Turno, Toast, MetodoPago, Action,
    AreaPreparacion,
    HistorialEstado,
    RestaurantSettings
} from './types';

interface AppState {
    orders: Pedido[];
    products: Producto[];
    promotions: Promocion[];
    salsas: Salsa[];
    customers: ClienteLeal[];
    loyaltyPrograms: LoyaltyProgram[];
    cajaSession: CajaSession;
    cajaHistory: CajaSession[];
    view: View;
    turno: Turno;
    theme: 'light' | 'dark';
    appView: 'customer' | 'login' | 'admin';
    currentUserRole: UserRole;
    loginError: string | null;
    toasts: Toast[];
    isSidebarCollapsed: boolean;
    posMesaActiva: Mesa | null;
    orderForPreBill: Pedido | null;
    orderToPay: Pedido | null;
    orderForDeliveryPayment: Pedido | null;
    orderForReceipt: Pedido | null;
    installPrompt: any;
    mesaParaAsignarCliente: Mesa | null;
    preselectedCustomerForPOS: ClienteLeal | null;
    user: User | null;
    restaurantId: string | null;
    restaurantSettings: RestaurantSettings | null;
    isLoading: boolean;
}

const initialState: AppState = {
    orders: [],
    products: [],
    promotions: [],
    salsas: [],
    customers: [],
    loyaltyPrograms: [],
    cajaSession: { estado: 'cerrada', saldoInicial: 0, ventasPorMetodo: {}, totalVentas: 0, totalEfectivoEsperado: 0, fechaApertura: '', gananciaTotal: 0, movimientos: [], restaurant_id: '' },
    cajaHistory: [],
    view: 'recepcion',
    turno: 'tarde',
    theme: 'light',
    appView: 'login',
    currentUserRole: 'cliente',
    loginError: null,
    toasts: [],
    isSidebarCollapsed: false,
    posMesaActiva: null,
    orderForPreBill: null,
    orderToPay: null,
    orderForDeliveryPayment: null,
    orderForReceipt: null,
    installPrompt: null,
    mesaParaAsignarCliente: null,
    preselectedCustomerForPOS: null,
    user: null,
    restaurantId: null,
    restaurantSettings: null,
    isLoading: true,
};

// Add new action types for auth
type AppAction = Action | 
    { type: 'SET_SESSION'; payload: { user: User | null } } |
    { type: 'SET_LOADING'; payload: boolean };


const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction> }>({
    state: initialState,
    dispatch: () => null
});

// Helper pure function
function registrarVenta(order: Pedido, allProducts: Producto[], allCustomers: ClienteLeal[], allPrograms: LoyaltyProgram[]): {
    updatedOrder: Pedido;
    updatedProducts: Producto[];
    updatedCustomers: ClienteLeal[];
} {
    const { total: monto } = order;
    const costoTotal = order.productos.reduce((acc, p) => acc + (allProducts.find(pm => pm.id === p.id)?.costo || 0) * p.cantidad, 0);

    let pointsToAdd = 0;
    const customerPhone = order.cliente.telefono;
    const activeProgram = allPrograms.find(p => p.isActive);

    let updatedCustomers = [...allCustomers];
    if (customerPhone && /^\d{9}$/.test(customerPhone) && activeProgram) {
        const existingCustomerIndex = updatedCustomers.findIndex(c => c.telefono === customerPhone);
        const { config } = activeProgram;
        if (config.pointEarningMethod === 'monto') {
            const safeMontoForPoints = config.montoForPoints > 0 ? config.montoForPoints : 1;
            pointsToAdd = Math.floor(order.total / safeMontoForPoints) * (config.pointsPerMonto || 0);
        } else {
            pointsToAdd = config.pointsPerCompra || 0;
        }

        if (existingCustomerIndex > -1) {
            const existingCustomer = {...updatedCustomers[existingCustomerIndex]};
            existingCustomer.puntos += pointsToAdd;
            existingCustomer.historialPedidos = [...existingCustomer.historialPedidos, order];
            updatedCustomers[existingCustomerIndex] = existingCustomer;
        } else {
            const newCustomer: ClienteLeal = {
                telefono: customerPhone, nombre: order.cliente.nombre, puntos: pointsToAdd, historialPedidos: [order], restaurant_id: order.restaurant_id,
            };
            updatedCustomers.push(newCustomer);
        }
    }

    const updatedProducts = [...allProducts];
    order.productos.forEach(p => {
         if (p.isReward && !p.id.startsWith('recompensa-')) {
            const index = updatedProducts.findIndex(prod => prod.id === p.id);
            if (index > -1) updatedProducts[index].stock = Math.max(0, updatedProducts[index].stock - p.cantidad);
        } else if (!p.isReward) {
            const index = updatedProducts.findIndex(prod => prod.id === p.id);
            if (index > -1) updatedProducts[index].stock = Math.max(0, updatedProducts[index].stock - p.cantidad);
        }
    });

    return {
        updatedOrder: { ...order, puntosGanados: pointsToAdd > 0 ? pointsToAdd : undefined, gananciaEstimada: monto - costoTotal },
        updatedProducts,
        updatedCustomers,
    };
}


function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_LOADING': return { ...state, isLoading: action.payload };
        case 'SET_SESSION': {
            const { user } = action.payload;
            const restaurantId = user?.user_metadata?.restaurant_id || null;
            return {
                ...state,
                user,
                restaurantId,
                appView: user ? 'admin' : 'login',
                isLoading: false,
            };
        }
        case 'LOGOUT': {
             try {
                const supabase = getSupabase();
                supabase.auth.signOut().catch(console.error);
                return {
                    ...initialState, // Reset to initial state
                    isLoading: false,
                    appView: 'login',
                    theme: state.theme, // Persist theme preference
                };
            } catch (error) {
                return state;
            }
        }
        case 'SET_STATE': return { ...state, ...action.payload };
        case 'SET_VIEW': return { ...state, view: action.payload };
        case 'SET_TURNO': return { ...state, turno: action.payload };
        case 'TOGGLE_THEME': return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
        case 'TOGGLE_SIDEBAR': return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
        case 'LOGIN': return { ...state, appView: 'admin', currentUserRole: action.payload, loginError: null };
        case 'LOGIN_FAILED': return { ...state, loginError: action.payload };
        case 'GO_TO_LOGIN': return { ...state, appView: 'login' };
        case 'ADD_TOAST': return { ...state, toasts: [...state.toasts, { ...action.payload, id: Date.now() }] };
        case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
        case 'SET_INSTALL_PROMPT': return { ...state, installPrompt: action.payload };
        case 'INITIATE_PAYMENT': return { ...state, orderToPay: action.payload };
        case 'INITIATE_DELIVERY_PAYMENT': return { ...state, orderForDeliveryPayment: action.payload };
        case 'CLOSE_MODALS': return { ...state, orderForPreBill: null, orderToPay: null, orderForDeliveryPayment: null, orderForReceipt: null };
        case 'SELECT_MESA': return { ...state, posMesaActiva: action.payload.mesa, preselectedCustomerForPOS: action.payload.customer || null, mesaParaAsignarCliente: null };
        case 'INITIATE_ASSIGN_CUSTOMER_TO_MESA': return { ...state, mesaParaAsignarCliente: action.payload };
        case 'CANCEL_ASSIGN_CUSTOMER': return { ...state, mesaParaAsignarCliente: null };

        // Actions that use Supabase
        case 'UPDATE_ORDER_STATUS': {
            try {
                const supabase = getSupabase();
                const { orderId, newStatus, user } = action.payload;
                const order = state.orders.find(o => o.id === orderId);
                if (!order) return state;

                const newHistory: HistorialEstado = { estado: newStatus, fecha: new Date().toISOString(), usuario: user };
                // FIX: Define payload with explicit type to resolve Supabase type inference issue.
                const updatePayload: Partial<Pedido> = { estado: newHistory.estado, historial: [...order.historial, newHistory] };
                supabase
                    .from('orders')
                    .update(updatePayload)
                    .eq('id', orderId)
                    .then(({ error }) => {
                        if (error) console.error("Error updating order status:", error);
                    });
                return state; // State will be updated by real-time subscription
            } catch (error) { return state; }
        }
        case 'ASSIGN_DRIVER': {
            try {
                const supabase = getSupabase();
                const { orderId, driverName } = action.payload;
                // FIX: Define payload with explicit type to resolve Supabase type inference issue.
                const updatePayload: Partial<Pedido> = { repartidorAsignado: driverName };
                supabase.from('orders').update(updatePayload).eq('id', orderId).then(({ error }) => { if (error) console.error(error); });
                return state;
            } catch (error) { return state; }
        }
        case 'SAVE_ORDER': {
            try {
                const supabase = getSupabase();
                if (!state.restaurantId) return state;

                const orderData = action.payload;
                const isPayNow = ['yape', 'plin'].includes(orderData.metodoPago);
                const isRiskyRetiro = orderData.tipo === 'retiro' && ['efectivo', 'tarjeta'].includes(orderData.metodoPago);
                const initialState: EstadoPedido = isPayNow ? 'pendiente confirmar pago' : isRiskyRetiro ? 'pendiente de confirmación' : 'en preparación';
                const getAreaPreparacion = (tipo: Pedido['tipo']): AreaPreparacion => tipo === 'local' ? 'salon' : tipo;
                
                const newOrder: Omit<Pedido, 'id'> & { id?: string } = { 
                    ...orderData, 
                    fecha: new Date().toISOString(), 
                    estado: initialState, 
                    turno: state.turno, 
                    historial: [{ estado: initialState, fecha: new Date().toISOString(), usuario: state.currentUserRole }], 
                    areaPreparacion: getAreaPreparacion(orderData.tipo),
                    restaurant_id: state.restaurantId,
                };
                delete newOrder.id; // Let Supabase generate ID
                
// FIX: Cast the insert payload to 'any' to resolve a 'never' type error due to a type mismatch.
                supabase.from('orders').insert([newOrder] as any).then(({ error }) => { if (error) console.error(error); });

                let toastMessage = `Nuevo pedido enviado a cocina.`;
                if (isPayNow) toastMessage = `Pedido recibido. Esperando confirmación de pago.`;
                else if (isRiskyRetiro) toastMessage = `Pedido pendiente de confirmación.`;

                return { ...state, toasts: [...state.toasts, { id: Date.now(), message: toastMessage, type: 'success' }] };
            } catch (error) { return state; }
        }
        // ... (other cases need similar multi-tenant updates) ...
        default:
            return state;
    }
}


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    
    const [state, dispatch] = useReducer(appReducer, initialState);

    const fetchDataForTenant = async (restaurantId: string) => {
        if (!restaurantId) return;
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const supabase = getSupabase();
            const [
                { data: products, error: productsError },
                { data: salsas, error: salsasError },
                { data: promotions, error: promotionsError },
                { data: orders, error: ordersError },
                { data: loyaltyPrograms, error: loyaltyProgramsError },
                { data: customers, error: customersError },
                { data: cajaHistory, error: cajaHistoryError },
                { data: restaurantData, error: restaurantError },
            ] = await Promise.all([
                supabase.from('products').select('*').eq('restaurant_id', restaurantId),
                supabase.from('salsas').select('*').eq('restaurant_id', restaurantId),
                supabase.from('promotions').select('*').eq('restaurant_id', restaurantId),
                supabase.from('orders').select('*').eq('restaurant_id', restaurantId).order('fecha', { ascending: false }),
                supabase.from('loyalty_programs').select('*').eq('restaurant_id', restaurantId),
                supabase.from('customers').select('*').eq('restaurant_id', restaurantId),
                supabase.from('caja_history').select('*').eq('restaurant_id', restaurantId),
                supabase.from('restaurants').select('name, settings').eq('id', restaurantId).single(),
            ]);
            const errors = [productsError, salsasError, promotionsError, ordersError, loyaltyProgramsError, customersError, cajaHistoryError, restaurantError].filter(Boolean);
            if (errors.length > 0) throw errors;

            dispatch({
                type: 'SET_STATE',
// FIX: Add optional chaining to safely access 'settings' from 'restaurantData', which can be null.
                payload: { products, salsas, promotions, orders, loyaltyPrograms, customers, cajaHistory, restaurantSettings: restaurantData?.settings || null }
            });
        } catch (error) {
            console.error("Error fetching tenant data:", error);
            dispatch({ type: 'ADD_TOAST', payload: { message: 'Error al cargar los datos del restaurante.', type: 'danger' } });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    useEffect(() => {
        let channel: any = null;
        try {
            const supabase = getSupabase();
            
            supabase.auth.getSession().then(({ data: { session } }) => {
                const user = session?.user ?? null;
                dispatch({ type: 'SET_SESSION', payload: { user } });
                if(user?.user_metadata?.restaurant_id) {
                    fetchDataForTenant(user.user_metadata.restaurant_id);
                } else {
                    dispatch({ type: 'SET_LOADING', payload: false });
                }
            });

            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                const user = session?.user ?? null;
                dispatch({ type: 'SET_SESSION', payload: { user } });

                if (_event === 'SIGNED_IN' && user?.user_metadata?.restaurant_id) {
                    fetchDataForTenant(user.user_metadata.restaurant_id);
                } else if (_event === 'SIGNED_OUT') {
                    // State is reset by the reducer's LOGOUT case
                }
            });
            
            // Setup realtime channel
            channel = supabase
                .channel('public-tenant-channel')
                .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
                    console.log('Realtime change received!', payload);
                    if (state.restaurantId) {
                         fetchDataForTenant(state.restaurantId);
                    }
                })
                .subscribe();

            return () => {
                subscription.unsubscribe();
                if(channel) {
                    supabase.removeChannel(channel).catch(console.error);
                }
            };
        } catch (e: any) {
             dispatch({ type: 'ADD_TOAST', payload: { message: e.message, type: 'danger' } });
             dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [state.restaurantId]);


    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);