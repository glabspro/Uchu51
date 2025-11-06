

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { getSupabase, type Database } from './utils/supabase';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type {
    Pedido, Producto, Promocion, Salsa, ClienteLeal, LoyaltyProgram, Recompensa, Mesa,
    CajaSession, MovimientoCaja, EstadoPedido, UserRole, View, Turno, Toast, MetodoPago, Action,
    AreaPreparacion,
    HistorialEstado,
    RestaurantSettings,
    AppView
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
    appView: AppView;
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

type AppAction = Action | 
    { type: 'SET_SESSION'; payload: { user: User | null; restaurantId?: string | null; currentUserRole?: UserRole, appView?: AppView } } |
    { type: 'SET_LOADING'; payload: boolean };


const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction> }>({
    state: initialState,
    dispatch: () => null
});

function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_LOADING': return { ...state, isLoading: action.payload };
        case 'SET_SESSION': {
            const { user, restaurantId, currentUserRole, appView } = action.payload;
            return {
                ...state,
                user,
                restaurantId: restaurantId !== undefined ? restaurantId : state.restaurantId,
                currentUserRole: currentUserRole !== undefined ? currentUserRole : state.currentUserRole,
                appView: appView || (user ? 'admin' : 'login'),
                isLoading: false,
            };
        }
        case 'LOGOUT': {
             try {
                const supabase = getSupabase();
                supabase.auth.signOut().catch(console.error);
                return {
                    ...initialState,
                    isLoading: false,
                    appView: 'login',
                    theme: state.theme,
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
        case 'LOGIN_FAILED': return { ...state, loginError: action.payload };
        case 'GO_TO_LOGIN': return { ...state, appView: 'login', loginError: null };
        case 'ADD_TOAST': return { ...state, toasts: [...state.toasts, { ...action.payload, id: Date.now() }] };
        case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
        case 'SET_INSTALL_PROMPT': return { ...state, installPrompt: action.payload };
        case 'INITIATE_PAYMENT': return { ...state, orderToPay: action.payload };
        case 'INITIATE_DELIVERY_PAYMENT': return { ...state, orderForDeliveryPayment: action.payload };
        case 'CLOSE_MODALS': return { ...state, orderForPreBill: null, orderToPay: null, orderForDeliveryPayment: null, orderForReceipt: null };
        case 'SELECT_MESA': return { ...state, posMesaActiva: action.payload.mesa, preselectedCustomerForPOS: action.payload.customer || null, mesaParaAsignarCliente: null };
        case 'INITIATE_ASSIGN_CUSTOMER_TO_MESA': return { ...state, mesaParaAsignarCliente: action.payload };
        case 'CANCEL_ASSIGN_CUSTOMER': return { ...state, mesaParaAsignarCliente: null };

        case 'UPDATE_ORDER_STATUS': {
            try {
                const supabase = getSupabase();
                const { orderId, newStatus, user } = action.payload;
                const order = state.orders.find(o => o.id === orderId);
                if (!order) return state;

                const newHistory: HistorialEstado = { estado: newStatus, fecha: new Date().toISOString(), usuario: user };
                const updatePayload: Partial<Pedido> = { estado: newHistory.estado, historial: [...order.historial, newHistory] };
                supabase
                    .from('orders')
                    // FIX: Removed 'as any' cast after fixing Supabase type definitions in utils/supabase.ts
                    .update(updatePayload)
                    .eq('id', orderId)
                    .then(({ error }) => {
                        if (error) console.error("Error updating order status:", error);
                    });
                return state;
            } catch (error) { return state; }
        }
        case 'ASSIGN_DRIVER': {
            try {
                const supabase = getSupabase();
                const { orderId, driverName } = action.payload;
                const updatePayload: Partial<Pedido> = { repartidorAsignado: driverName };
                // FIX: Removed 'as any' cast after fixing Supabase type definitions in utils/supabase.ts
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
                    historial: [{ estado: initialState, fecha: new Date().toISOString(), usuario: 'cliente' }], 
                    areaPreparacion: getAreaPreparacion(orderData.tipo),
                    restaurant_id: state.restaurantId,
                };
                
                // FIX: Removed 'as any' cast after fixing Supabase type definitions in utils/supabase.ts
                supabase.from('orders').insert([newOrder]).then(({ error }) => { if (error) console.error(error); });

                let toastMessage = `Nuevo pedido enviado a cocina.`;
                if (isPayNow) toastMessage = `Pedido recibido. Esperando confirmación de pago.`;
                else if (isRiskyRetiro) toastMessage = `Pedido pendiente de confirmación.`;

                return { ...state, toasts: [...state.toasts, { id: Date.now(), message: toastMessage, type: 'success' }] };
            } catch (error) { return state; }
        }
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
                { data: products, error: productsError }, { data: salsas, error: salsasError },
                { data: promotions, error: promotionsError }, { data: orders, error: ordersError },
                { data: loyaltyPrograms, error: loyaltyProgramsError }, { data: customers, error: customersError },
                { data: cajaHistory, error: cajaHistoryError }, { data: restaurantData, error: restaurantError },
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
                // FIX: Used explicit ternary to resolve 'possibly null' error.
                payload: { products: products || [], salsas: salsas || [], promotions: promotions || [], orders: orders || [], loyaltyPrograms: loyaltyPrograms || [], customers: customers || [], cajaHistory: cajaHistory || [], restaurantSettings: restaurantData ? (restaurantData.settings as RestaurantSettings) : null }
            });
        } catch (error) {
            console.error("Error fetching tenant data:", error);
            dispatch({ type: 'ADD_TOAST', payload: { message: 'Error al cargar los datos del restaurante.', type: 'danger' } });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const fetchUserSessionData = async (user: User) => {
        try {
            if (user.email === 'admin@uchu.app') {
                dispatch({ type: 'SET_SESSION', payload: { user, appView: 'super_admin' }});
                dispatch({ type: 'SET_LOADING', payload: false });
                return;
            }

            const supabase = getSupabase();
            const { data: userRole, error } = await supabase
                .from('user_roles')
                .select('restaurant_id, role')
                .eq('user_id', user.id)
                .single();

            if (error || !userRole) {
                throw new Error(error?.message || "No se encontró el rol del usuario. Es posible que el registro no se haya completado.");
            }

            const { restaurant_id, role } = userRole;

            dispatch({
                type: 'SET_SESSION',
                payload: { user, restaurantId: restaurant_id, currentUserRole: role as UserRole, appView: 'admin' },
            });

            await fetchDataForTenant(restaurant_id);

        } catch (e: any) {
             dispatch({ type: 'ADD_TOAST', payload: { message: e.message, type: 'danger' } });
             getSupabase().auth.signOut();
        }
    };

    useEffect(() => {
        let channel: any = null;

        const initializeSession = async () => {
            try {
                const supabase = getSupabase();
                const { data: { session } } = await supabase.auth.getSession();
                const user = session?.user ?? null;

                if (user) {
                    await fetchUserSessionData(user);
                } else {
                    dispatch({ type: 'SET_SESSION', payload: { user: null } });
                    dispatch({ type: 'SET_LOADING', payload: false });
                }
            } catch (e: any) {
                 dispatch({ type: 'ADD_TOAST', payload: { message: e.message, type: 'danger' } });
                 dispatch({ type: 'SET_LOADING', payload: false });
            }
        };

        initializeSession();

        const supabase = getSupabase();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const user = session?.user ?? null;
            if ((_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') && user) {
                await fetchUserSessionData(user);
            } else if (_event === 'SIGNED_OUT') {
                dispatch({ type: 'LOGOUT' });
            } else if (!session) {
                dispatch({ type: 'SET_SESSION', payload: { user: null }});
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    useEffect(() => {
        let channel: any = null;
        if (state.restaurantId && state.appView === 'admin') {
            const supabase = getSupabase();
            channel = supabase
                .channel(`public:orders:restaurant_id=eq.${state.restaurantId}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, 
                    () => fetchDataForTenant(state.restaurantId!)
                ).subscribe();
        }
        return () => {
            if (channel) {
                getSupabase().removeChannel(channel).catch(console.error);
            }
        }
    }, [state.restaurantId, state.appView]);


    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);