
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
    plin: { enabled: true },
    mercadopago: { enabled: false }
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
             
             // Note: We might not have the order in state if this runs immediately after reload,
             // but the async dispatch will handle the DB update.
             // This reducer handles optimistic UI updates if the order IS present.
             
             let newStatus: EstadoPedido = 'pagado';
             if (action.type === 'CONFIRM_DELIVERY_PAYMENT') {
                 newStatus = 'entregado';
             } else {
                 newStatus = 'en preparación';
             }
             
             const updatedCajaSession = { ...state.cajaSession };
             
             // Only update session stats if we have order details
             if (order && state.cajaSession.estado === 'abierta') {
                 const currentVentas = updatedCajaSession.ventasPorMetodo[details.metodo] || 0;
                 updatedCajaSession.ventasPorMetodo[details.metodo] = currentVentas + order.total;
                 updatedCajaSession.totalVentas += order.total;
                 updatedCajaSession.gananciaTotal = (updatedCajaSession.gananciaTotal || 0) + (order.gananciaEstimada || 0);
                 if (details.metodo === 'efectivo') {
                     updatedCajaSession.totalEfectivoEsperado += order.total;
                 }
             }

             // If order missing, return state (DB sync will handle data)
             if (!order) return state;

             const pagoRegistrado = {
                metodo: details.metodo,
                montoTotal: order.total,
                montoPagado: details.montoPagado,
                vuelto: details.montoPagado ? details.montoPagado - order.total : 0,
                fecha: new Date().toISOString()
             };

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

// --- HELPERS FOR DATA MAPPING ---
const mapOrderFromDb = (dbOrder: any): Pedido => ({
    id: dbOrder.id,
    fecha: dbOrder.fecha,
    tipo: dbOrder.tipo,
    estado: dbOrder.estado,
    turno: dbOrder.turno,
    cliente: dbOrder.cliente,
    productos: dbOrder.productos,
    total: dbOrder.total,
    metodoPago: dbOrder.metodo_pago,
    pagoConEfectivo: dbOrder.pago_con_efectivo,
    pagoExacto: dbOrder.pago_exacto,
    notas: dbOrder.notas,
    tiempoEstimado: dbOrder.tiempo_estimado,
    repartidorAsignado: dbOrder.repartidor_asignado,
    puntosGanados: dbOrder.puntos_ganados,
    gananciaEstimada: dbOrder.ganancia_estimada,
    historial: dbOrder.historial,
    pagoRegistrado: dbOrder.pago_registrado,
    restaurant_id: dbOrder.restaurant_id,
    // Derive areaPreparacion if not present, default to reasonable value based on type
    areaPreparacion: dbOrder.tipo === 'local' ? 'salon' : dbOrder.tipo,
    estacion: dbOrder.estacion 
});

const mapOrderToDb = (order: Pedido): any => ({
    id: order.id,
    restaurant_id: order.restaurant_id,
    fecha: order.fecha,
    tipo: order.tipo,
    estado: order.estado,
    turno: order.turno,
    cliente: order.cliente,
    productos: order.productos,
    total: order.total,
    metodo_pago: order.metodoPago,
    pago_con_efectivo: order.pagoConEfectivo,
    pago_exacto: order.pagoExacto,
    notas: order.notas,
    tiempo_estimado: order.tiempoEstimado,
    repartidor_asignado: order.repartidorAsignado,
    puntos_ganados: order.puntosGanados,
    ganancia_estimada: order.gananciaEstimada,
    historial: order.historial,
    pago_registrado: order.pagoRegistrado
});

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
                if (productsData) {
                    const mappedProducts = productsData.map((p: any) => ({
                        ...p,
                        imagenUrl: p.imagen_url 
                    }));
                    baseDispatch({ type: 'SET_PRODUCTS', payload: mappedProducts });
                }

                // 3. Salsas
                const { data: salsasData } = await supabase.from('salsas').select('*').eq('restaurant_id', RESTAURANT_ID);
                if (salsasData) {
                    const mappedSalsas = salsasData.map((s: any) => ({
                        ...s,
                        isAvailable: s.is_available
                    }));
                    baseDispatch({ type: 'SET_SAUCES', payload: mappedSalsas });
                }
                
                // 4. Orders
                const { data: ordersData } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('restaurant_id', RESTAURANT_ID)
                    .order('fecha', { ascending: false })
                    .limit(100);
                
                if (ordersData) {
                    // USE MAPPER HERE
                     const mappedOrders = ordersData.map(mapOrderFromDb);
                     baseDispatch({ type: 'SET_STATE', payload: { orders: mappedOrders } });
                }

                // 5. Customers
                const { data: customersData } = await supabase.from('customers').select('*').eq('restaurant_id', RESTAURANT_ID);
                if(customersData) baseDispatch({ type: 'SET_STATE', payload: { customers: customersData } });

                 // 6. Promotions
                const { data: promotionsData } = await supabase.from('promotions').select('*').eq('restaurant_id', RESTAURANT_ID);
                if (promotionsData) {
                    const mappedPromotions = promotionsData.map((p: any) => ({
                        ...p,
                        isActive: p.is_active,
                        imagenUrl: p.imagen_url
                    }));
                    baseDispatch({ type: 'SET_PROMOTIONS', payload: mappedPromotions });
                }

                baseDispatch({ type: 'SET_STATE', payload: { restaurantId: RESTAURANT_ID } });

            } catch (error: any) {
                console.error("Error fetching initial data:", error);
                baseDispatch({ type: 'SET_CRITICAL_ERROR', payload: `Error al conectar con la base de datos: ${error.message}` });
            } finally {
                baseDispatch({ type: 'SET_LOADING', payload: false });
            }
        };

        fetchInitialData();
        
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme === 'dark' || storedTheme === 'light') {
            baseDispatch({ type: 'SET_STATE', payload: { theme: storedTheme } });
        }

    }, []);

    // --- REALTIME SUBSCRIPTIONS ---
    useEffect(() => {
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
                         cooks: DEFAULT_SETTINGS.cooks, 
                         drivers: DEFAULT_SETTINGS.drivers,
                    };
                    baseDispatch({ type: 'SET_STATE', payload: { restaurantSettings: newSettings } });
                }
            )
            .subscribe();

         const ordersChannel = supabase.channel('public:orders')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${RESTAURANT_ID}` },
                (payload) => {
                     // USE MAPPER HERE TOO
                     if (payload.eventType === 'INSERT') {
                         const newOrder = mapOrderFromDb(payload.new);
                         baseDispatch({ type: 'SAVE_POS_ORDER', payload: { orderData: newOrder, mesaNumero: 0 } });
                     } else if (payload.eventType === 'UPDATE') {
                         const updatedOrder = mapOrderFromDb(payload.new);
                         baseDispatch({ type: 'SAVE_POS_ORDER', payload: { orderData: updatedOrder, mesaNumero: 0 } });
                     }
                }
            )
            .subscribe();
            
        const salsasChannel = supabase.channel('public:salsas')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'salsas', filter: `restaurant_id=eq.${RESTAURANT_ID}` },
                async () => {
                     const { data: salsasData } = await supabase.from('salsas').select('*').eq('restaurant_id', RESTAURANT_ID);
                     if (salsasData) {
                        const mappedSalsas = salsasData.map((s: any) => ({
                            ...s,
                            isAvailable: s.is_available
                        }));
                        baseDispatch({ type: 'SET_SAUCES', payload: mappedSalsas });
                     }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(settingsChannel);
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(salsasChannel);
        };
    }, []);


    // --- ENHANCED DISPATCH FOR SYNC ---
    const dispatch = useCallback(async (action: AppAction) => {
        baseDispatch(action);

        try {
            switch (action.type) {
                case 'UPDATE_RESTAURANT_SETTINGS': {
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
                    const isPayNow = ['yape', 'plin', 'mercadopago'].includes(orderData.metodoPago);
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
                    
                    // Update local state immediately
                    baseDispatch({ type: 'SAVE_POS_ORDER', payload: { orderData: newOrder, mesaNumero: 0 } });
                    
                    // Sync to DB using MAPPER
                    const dbPayload = mapOrderToDb(newOrder);
                    await supabase.from('orders').insert(dbPayload);
                    break;
                }
                case 'SAVE_POS_ORDER': {
                    const { orderData } = action.payload;
                    const dbPayload = mapOrderToDb(orderData);
                    const { error } = await supabase.from('orders').upsert(dbPayload);
                    if (error) console.error("Error upserting order:", error);
                    break;
                }
                case 'UPDATE_ORDER_STATUS': {
                    const { orderId, newStatus, user } = action.payload;
                    const { data: currentOrder } = await supabase.from('orders').select('historial').eq('id', orderId).single();
                    const currentHist = currentOrder?.historial || [];
                    const newHistoryEntry: HistorialEstado = { estado: newStatus, fecha: new Date().toISOString(), usuario: user };
                    
                    await supabase.from('orders').update({
                        estado: newStatus,
                        historial: [...currentHist, newHistoryEntry]
                    }).eq('id', orderId);
                    break;
                }
                case 'CONFIRM_PAYMENT':
                case 'CONFIRM_DELIVERY_PAYMENT': {
                    const { orderId, details } = action.payload;
                    
                    // Fetch local or remote order data to ensure we have totals
                    let total = 0;
                    const localOrder = state.orders.find(o => o.id === orderId);
                    
                    if (localOrder) {
                        total = localOrder.total;
                    } else {
                        // Fetch from DB if not in local state (e.g. fresh reload)
                        const { data: dbOrder } = await supabase
                            .from('orders')
                            .select('total')
                            .eq('id', orderId)
                            .single();
                        if (dbOrder) {
                            total = dbOrder.total;
                        }
                    }
                    
                    // Determine new status
                    let newStatus: EstadoPedido = 'pagado';
                    if (action.type === 'CONFIRM_DELIVERY_PAYMENT') {
                        newStatus = 'entregado';
                    } else {
                        newStatus = 'en preparación';
                    }

                    const pagoRegistrado = {
                        metodo: details.metodo,
                        montoTotal: total,
                        montoPagado: details.montoPagado || total, // Fallback to total if unspecified
                        vuelto: (details.montoPagado && total) ? details.montoPagado - total : 0,
                        fecha: new Date().toISOString()
                    };
                    
                    // MAP TO SNAKE CASE FOR DB UPDATE
                    const { error } = await supabase.from('orders').update({
                        estado: newStatus,
                        pago_registrado: pagoRegistrado
                    }).eq('id', orderId);

                    if (error) {
                        console.error("Failed to confirm payment in DB:", error);
                    }
                    break;
                }
            }
        } catch (err) {
            console.error("Error syncing action to Supabase:", action, err);
            baseDispatch({ type: 'ADD_TOAST', payload: { message: 'Error de sincronización', type: 'danger' } });
        }
    }, [state.restaurantSettings, state.turno, state.orders, state.cajaSession]); // Added dependencies

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
