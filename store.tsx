
import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import type {
    Pedido, Producto, Promocion, Salsa, ClienteLeal, LoyaltyProgram, Recompensa, Mesa,
    CajaSession, MovimientoCaja, EstadoPedido, UserRole, View, Turno, Toast, MetodoPago, Action,
    AreaPreparacion,
    HistorialEstado,
    RestaurantSettings,
    AppView
} from './types';
import { supabase } from './utils/supabase';

// --- CONSTANTS ---
const RESTAURANT_ID = 'd290f1ee-6c54-4b01-90e6-d701748f0851';

// --- DEFAULT FALLBACK SETTINGS ---
const DEFAULT_SETTINGS: RestaurantSettings = {
  cooks: ['Cocinero 1', 'Cocinero 2'],
  drivers: ['Driver A', 'Driver B'],
  tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  branding: {
    primaryColor: '#F64D00',
    secondaryColor: '#FFB40B',
    backgroundColor: '#FFFFFF',
    logoUrl: null,
  },
  modules: {
    delivery: true,
    local: true,
    retiro: true,
  },
  paymentMethods: {
    efectivo: true,
    tarjeta: true,
    yape: { enabled: true },
    plin: { enabled: true }
  }
};

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
    restaurantId: string | null;
    restaurantSettings: RestaurantSettings | null;
    isLoading: boolean;
    criticalError: string | null;
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
    appView: 'customer',
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
    restaurantId: null,
    restaurantSettings: null,
    isLoading: true,
    criticalError: null,
};

type AppAction = Action | 
    { type: 'SET_STATE'; payload: Partial<AppState> } |
    { type: 'SET_LOADING'; payload: boolean } |
    { type: 'SET_CRITICAL_ERROR'; payload: string | null };


const AppContext = createContext<{ state: AppState; dispatch: (action: AppAction) => void }>({
    state: initialState,
    dispatch: () => null
});

function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_CRITICAL_ERROR': return { ...state, criticalError: action.payload, isLoading: false };
        case 'SET_LOADING': return { ...state, isLoading: action.payload };
        case 'LOGIN_INTERNAL_SUCCESS':
            return {
                ...state,
                appView: 'admin',
                currentUserRole: 'admin',
                restaurantId: RESTAURANT_ID,
                loginError: null,
            };
        case 'LOGOUT': {
            return {
                ...state,
                appView: 'customer',
                // Keep data loaded
            };
        }
        case 'SET_STATE': return { ...state, ...action.payload };
        case 'SET_VIEW': return { ...state, view: action.payload };
        case 'SET_TURNO': return { ...state, turno: action.payload };
        case 'TOGGLE_THEME': {
            const newTheme = state.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            return { ...state, theme: newTheme };
        }
        case 'TOGGLE_SIDEBAR': return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
        case 'LOGIN_FAILED': return { ...state, loginError: action.payload };
        case 'GO_TO_LOGIN': return { ...state, appView: 'login', loginError: null };
        case 'ADD_TOAST': return { ...state, toasts: [...state.toasts, { ...action.payload, id: Date.now() }] };
        case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
        case 'SET_INSTALL_PROMPT': return { ...state, installPrompt: action.payload };
        case 'INITIATE_PREBILL': {
            const orderForPreBill = state.orders.find(o => o.id === action.payload) || null;
            return { ...state, orderForPreBill };
        }
        case 'INITIATE_PAYMENT': return { ...state, orderToPay: action.payload };
        case 'INITIATE_DELIVERY_PAYMENT': return { ...state, orderForDeliveryPayment: action.payload };
        case 'CLOSE_MODALS': return { ...state, orderForPreBill: null, orderToPay: null, orderForDeliveryPayment: null, orderForReceipt: null };
        case 'SELECT_MESA': return { ...state, posMesaActiva: action.payload.mesa, preselectedCustomerForPOS: action.payload.customer || null, mesaParaAsignarCliente: null };
        case 'INITIATE_ASSIGN_CUSTOMER_TO_MESA': return { ...state, mesaParaAsignarCliente: action.payload };
        case 'CANCEL_ASSIGN_CUSTOMER': return { ...state, mesaParaAsignarCliente: null };
        case 'SET_PRODUCTS': return { ...state, products: action.payload };
        case 'SET_SAUCES': return { ...state, salsas: action.payload };
        case 'SET_PROMOTIONS': return { ...state, promotions: action.payload };
        case 'SET_LOYALTY_PROGRAMS': return { ...state, loyaltyPrograms: action.payload };
        case 'UPDATE_RESTAURANT_SETTINGS': {
            const newSettings: RestaurantSettings = {
                ...state.restaurantSettings!,
                ...action.payload,
            };
            return {
                ...state,
                restaurantSettings: newSettings,
            };
        }
        case 'UPDATE_ORDER_STATUS': {
            const { orderId, newStatus, user } = action.payload;
            return {
                ...state,
                orders: state.orders.map(o => {
                    if (o.id === orderId) {
                        const newHistory: HistorialEstado = { estado: newStatus, fecha: new Date().toISOString(), usuario: user };
                        return { ...o, estado: newStatus, historial: [...o.historial, newHistory] };
                    }
                    return o;
                })
            };
        }
        case 'ASSIGN_DRIVER': {
            const { orderId, driverName } = action.payload;
            return { ...state, orders: state.orders.map(o => o.id === orderId ? { ...o, repartidorAsignado: driverName } : o) };
        }
        case 'SAVE_ORDER': {
            // Note: This case handles local optimistic updates for 'SAVE_ORDER' dispatch
            // But we also use 'SAVE_POS_ORDER' for DB-synced orders.
            const orderData = action.payload;
            // If no ID is present, generate a temp one (UI only)
            const tempId = `PED-${String(Date.now()).slice(-4)}`; 
            const newOrder: Pedido = { 
                ...orderData, 
                id: tempId,
                fecha: new Date().toISOString(), 
                estado: 'nuevo', // Default, wrapper logic might override
                turno: state.turno, 
                historial: [{ estado: 'nuevo', fecha: new Date().toISOString(), usuario: 'cliente' }], 
                areaPreparacion: orderData.tipo === 'local' ? 'salon' : orderData.tipo,
                restaurant_id: state.restaurantId!,
            };
            
            return { 
                ...state, 
                orders: [newOrder, ...state.orders],
                toasts: [...state.toasts, { id: Date.now(), message: `Pedido enviado.`, type: 'success' }] 
            };
        }
        case 'SAVE_POS_ORDER': {
            const { orderData } = action.payload;
            const existingIndex = state.orders.findIndex(o => o.id === orderData.id);
            const isNew = existingIndex === -1;

            const orderToSave = isNew 
                ? (orderData.id ? orderData : { ...orderData, id: `PED-${String(Date.now()).slice(-4)}`, restaurant_id: state.restaurantId! })
                : orderData;

            return {
                ...state,
                orders: isNew 
                    ? [orderToSave, ...state.orders]
                    : state.orders.map(o => o.id === orderToSave.id ? orderToSave : o),
                posMesaActiva: null
            };
        }
        case 'ADD_NEW_CUSTOMER': {
            const { telefono, nombre } = action.payload;
            const newCustomer: ClienteLeal = {
                telefono, nombre, puntos: 0, historialPedidos: [],
                restaurant_id: state.restaurantId!
            };
            return {
                ...state,
                customers: [...state.customers, newCustomer]
            };
        }
        case 'CONFIRM_CUSTOMER_PAYMENT': {
            const orderId = action.payload;
            return {
                ...state,
                orders: state.orders.map(o => {
                    if (o.id === orderId && o.estado === 'pendiente confirmar pago') {
                        const newStatus: EstadoPedido = 'en preparación';
                        const newHistory: HistorialEstado = { estado: newStatus, fecha: new Date().toISOString(), usuario: 'cliente' };
                        return { ...o, estado: newStatus, historial: [...o.historial, newHistory] };
                    }
                    return o;
                }),
                toasts: [...state.toasts, { id: Date.now(), message: `Pago del pedido ${orderId} confirmado.`, type: 'success' }]
            };
        }
        case 'OPEN_CAJA': {
            const newSession: CajaSession = {
                estado: 'abierta',
                fechaApertura: new Date().toISOString(),
                saldoInicial: action.payload,
                totalEfectivoEsperado: action.payload,
                ventasPorMetodo: {},
                totalVentas: 0,
                gananciaTotal: 0,
                movimientos: [],
                restaurant_id: state.restaurantId!
            };
            return { ...state, cajaSession: newSession };
        }
        case 'CONFIRM_PAYMENT':
        case 'CONFIRM_DELIVERY_PAYMENT': {
             const { orderId, details } = action.payload;
             const order = state.orders.find(o => o.id === orderId);
             if (!order) return state;

             const newStatus: EstadoPedido = action.type === 'CONFIRM_DELIVERY_PAYMENT' ? 'entregado' : 'pagado';
             const pagoRegistrado = {
                metodo: details.metodo,
                montoTotal: order.total,
                montoPagado: details.montoPagado,
                vuelto: details.montoPagado ? details.montoPagado - order.total : 0,
                fecha: new Date().toISOString()
             };
            
             const updatedCajaSession = { ...state.cajaSession };
             if (state.cajaSession.estado === 'abierta') {
                 const currentVentas = updatedCajaSession.ventasPorMetodo[details.metodo] || 0;
                 updatedCajaSession.ventasPorMetodo[details.metodo] = currentVentas + order.total;
                 updatedCajaSession.totalVentas += order.total;
                 updatedCajaSession.gananciaTotal = (updatedCajaSession.gananciaTotal || 0) + (order.gananciaEstimada || 0);
                 if (details.metodo === 'efectivo') {
                     updatedCajaSession.totalEfectivoEsperado += order.total;
                 }
             }

             return {
                ...state,
                orders: state.orders.map(o => o.id === orderId ? { ...o, estado: newStatus, pagoRegistrado } : o),
                orderToPay: null,
                orderForDeliveryPayment: null,
                orderForReceipt: { ...order, estado: newStatus, pagoRegistrado },
                cajaSession: updatedCajaSession
             };
        }
        default:
            return state;
    }
}


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, baseDispatch] = useReducer(appReducer, initialState);

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchInitialData = async () => {
            baseDispatch({ type: 'SET_LOADING', payload: true });
            try {
                // 1. Restaurant Settings
                const { data: restaurantData, error: restError } = await supabase
                    .from('restaurants')
                    .select('*')
                    .eq('id', RESTAURANT_ID)
                    .single();

                if (restError) throw restError;
                if (restaurantData) {
                    const fetchedSettings: RestaurantSettings = {
                        branding: restaurantData.branding || DEFAULT_SETTINGS.branding,
                        modules: restaurantData.modules || DEFAULT_SETTINGS.modules,
                        paymentMethods: restaurantData.payment_methods || DEFAULT_SETTINGS.paymentMethods,
                        tables: restaurantData.tables || DEFAULT_SETTINGS.tables,
                        cooks: DEFAULT_SETTINGS.cooks,
                        drivers: DEFAULT_SETTINGS.drivers,
                    };
                    baseDispatch({ type: 'SET_STATE', payload: { restaurantSettings: fetchedSettings } });
                }

                // 2. Products
                const { data: productsData } = await supabase.from('products').select('*').eq('restaurant_id', RESTAURANT_ID);
                if (productsData) baseDispatch({ type: 'SET_PRODUCTS', payload: productsData });

                // 3. Salsas
                const { data: salsasData } = await supabase.from('salsas').select('*').eq('restaurant_id', RESTAURANT_ID);
                if (salsasData) baseDispatch({ type: 'SET_SAUCES', payload: salsasData });
                
                // 4. Orders (Active only for now/optimization)
                const { data: ordersData } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('restaurant_id', RESTAURANT_ID)
                    .order('fecha', { ascending: false })
                    .limit(100); // Limit to last 100 for performance
                if (ordersData) {
                    // Parse jsonb fields if necessary (Supabase client usually handles it)
                     baseDispatch({ type: 'SET_STATE', payload: { orders: ordersData } });
                }

                // 5. Customers
                const { data: customersData } = await supabase.from('customers').select('*').eq('restaurant_id', RESTAURANT_ID);
                if(customersData) baseDispatch({ type: 'SET_STATE', payload: { customers: customersData } });

                baseDispatch({ type: 'SET_STATE', payload: { restaurantId: RESTAURANT_ID } });

            } catch (error: any) {
                console.error("Error fetching initial data:", error);
                baseDispatch({ type: 'SET_CRITICAL_ERROR', payload: `Error al conectar con la base de datos: ${error.message}` });
            } finally {
                baseDispatch({ type: 'SET_LOADING', payload: false });
            }
        };

        fetchInitialData();
        
        // Load theme from local storage
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme === 'dark' || storedTheme === 'light') {
            baseDispatch({ type: 'SET_STATE', payload: { theme: storedTheme } });
        }

    }, []);

    // --- REALTIME SUBSCRIPTIONS ---
    useEffect(() => {
        // Subscribe to Restaurant Settings changes
        const settingsChannel = supabase.channel('public:restaurants')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'restaurants', filter: `id=eq.${RESTAURANT_ID}` },
                (payload) => {
                    const newData = payload.new;
                    const newSettings: RestaurantSettings = {
                         branding: newData.branding,
                         modules: newData.modules,
                         paymentMethods: newData.payment_methods,
                         tables: newData.tables,
                         cooks: DEFAULT_SETTINGS.cooks, // Fallbacks
                         drivers: DEFAULT_SETTINGS.drivers,
                    };
                    console.log("Settings updated from remote:", newSettings);
                    baseDispatch({ type: 'SET_STATE', payload: { restaurantSettings: newSettings } });
                }
            )
            .subscribe();

         // Subscribe to Orders changes
         const ordersChannel = supabase.channel('public:orders')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${RESTAURANT_ID}` },
                (payload) => {
                     if (payload.eventType === 'INSERT') {
                         // Avoid adding if we already have it (optimistic update)
                         // But the ID might differ if we let DB generate it.
                         // With our logic, we generate ID locally and send it.
                         const newOrder = payload.new as Pedido;
                         // Simple check to avoid dupes if ID matches
                         baseDispatch({ type: 'SAVE_POS_ORDER', payload: { orderData: newOrder, mesaNumero: 0 } });
                     } else if (payload.eventType === 'UPDATE') {
                         const updatedOrder = payload.new as Pedido;
                         // Find and update
                         baseDispatch({ type: 'SAVE_POS_ORDER', payload: { orderData: updatedOrder, mesaNumero: 0 } });
                     }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(settingsChannel);
            supabase.removeChannel(ordersChannel);
        };
    }, []);


    // --- ENHANCED DISPATCH FOR SYNC ---
    const dispatch = useCallback(async (action: AppAction) => {
        // 1. Optimistic Update
        baseDispatch(action);

        // 2. Async Side Effects (Fire & Forget or Await)
        try {
            switch (action.type) {
                case 'UPDATE_RESTAURANT_SETTINGS': {
                    // We need the combined settings. Since state inside callback might be stale,
                    // we ideally fetch current from state but useReducer doesn't expose it here easily.
                    // However, React state updates are batched. 
                    // We will assume the payload contains the diff.
                    // To be safe, we read the latest from DB or local state ref if we had one.
                    // For now, we'll do a robust update by spreading.
                    // Note: 'action.payload' is Partial<RestaurantSettings>.
                    
                    // We can't easily access the *result* of the reducer here without a ref.
                    // Simplest fix: We update the DB with the specific fields present in payload.
                    const updates: any = {};
                    if (action.payload.branding) updates.branding = action.payload.branding;
                    if (action.payload.modules) updates.modules = action.payload.modules;
                    if (action.payload.paymentMethods) updates.payment_methods = action.payload.paymentMethods;
                    if (action.payload.tables) updates.tables = action.payload.tables;
                    
                    if (Object.keys(updates).length > 0) {
                         await supabase.from('restaurants').update(updates).eq('id', RESTAURANT_ID);
                    }
                    break;
                }
                case 'SAVE_ORDER': {
                    const orderData = action.payload;
                    const isPayNow = ['yape', 'plin'].includes(orderData.metodoPago);
                    const isRiskyRetiro = orderData.tipo === 'retiro' && ['efectivo', 'tarjeta'].includes(orderData.metodoPago);
                    const initialState: EstadoPedido = isPayNow ? 'pendiente confirmar pago' : isRiskyRetiro ? 'pendiente de confirmación' : 'en preparación';
                    const getAreaPreparacion = (tipo: Pedido['tipo']): AreaPreparacion => tipo === 'local' ? 'salon' : tipo;
                    
                    const generatedId = `PED-${String(Date.now()).slice(-4)}`;
                    const newOrder: Pedido = { 
                        ...orderData, 
                        id: generatedId,
                        fecha: new Date().toISOString(), 
                        estado: initialState, 
                        turno: state.turno, 
                        historial: [{ estado: initialState, fecha: new Date().toISOString(), usuario: 'cliente' }], 
                        areaPreparacion: getAreaPreparacion(orderData.tipo),
                        restaurant_id: RESTAURANT_ID,
                    };
                    
                    // Correct fix: dispatch SAVE_POS_ORDER to utilize its ID-preserving logic for the optimistic update
                    // Since SAVE_ORDER in reducer ignores ID passed in payload and generates new one.
                    baseDispatch({ type: 'SAVE_POS_ORDER', payload: { orderData: newOrder, mesaNumero: 0 } });
                    
                    await supabase.from('orders').insert(newOrder);
                    break;
                }
                case 'SAVE_POS_ORDER': {
                    // This is usually an update or a new order from POS with ID already handled
                    const { orderData } = action.payload;
                    
                    // Check if it exists to decide insert/update
                    const { data: existing } = await supabase.from('orders').select('id').eq('id', orderData.id).single();
                    
                    if (existing) {
                         await supabase.from('orders').update(orderData).eq('id', orderData.id);
                    } else {
                         await supabase.from('orders').insert(orderData);
                    }
                    break;
                }
                case 'UPDATE_ORDER_STATUS': {
                    const { orderId, newStatus, user } = action.payload;
                    // We need to append to history. Fetch current, then update?
                    // Or just push a jsonb update. Supabase supports appending to array? Not easily in one go without RPC.
                    // We'll read-modify-write or just rely on the component passing correct history? 
                    // The reducer updates history optimistically. We can construct the new history entry here.
                    
                    // To keep it simple: Fetch current order to get history, then append.
                    const { data: currentOrder } = await supabase.from('orders').select('historial').eq('id', orderId).single();
                    const currentHist = currentOrder?.historial || [];
                    const newHistoryEntry: HistorialEstado = { estado: newStatus, fecha: new Date().toISOString(), usuario: user };
                    
                    await supabase.from('orders').update({
                        estado: newStatus,
                        historial: [...currentHist, newHistoryEntry]
                    }).eq('id', orderId);
                    break;
                }
                case 'SET_PRODUCTS': {
                    // Bulk update not implemented in this snippet, usually products are saved individually via ProductManager
                    break;
                }
                // Add handlers for other data types (products, salsas, etc) as needed
                // For now, focusing on Settings and Orders as per request.
            }
        } catch (err) {
            console.error("Error syncing action to Supabase:", action, err);
            // Optionally dispatch an error toast
            baseDispatch({ type: 'ADD_TOAST', payload: { message: 'Error de sincronización', type: 'danger' } });
        }
    }, [state.restaurantSettings, state.turno]); // Deps might need tuning

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
