
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

// --- DEFAULT CATEGORY IMAGES ---
const getCategoryDefaultImage = (category: string, name: string): string => {
    const lowerName = name.toLowerCase();
    const lowerCat = category.toLowerCase();

    // Specific Name Matches
    if (lowerName.includes('lomo')) return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80';
    if (lowerName.includes('tallarin') || lowerName.includes('tallarín')) return 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80';
    if (lowerName.includes('royal')) return 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80';
    if (lowerName.includes('alitas')) return 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80';
    if (lowerName.includes('broaster')) return 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80';

    // Category Matches
    if (lowerCat.includes('hamburguesa')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';
    if (lowerCat.includes('saltado')) return 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80';
    if (lowerCat.includes('bebida')) return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80';
    if (lowerCat.includes('postre')) return 'https://images.unsplash.com/photo-1563729768474-d77dbb933a9e?auto=format&fit=crop&w=800&q=80';
    if (lowerCat.includes('picar')) return 'https://images.unsplash.com/photo-1605851868187-2c930263f336?auto=format&fit=crop&w=800&q=80';

    // Generic Fallback
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
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
    // CHANGED: Default view is now 'caja' for better workflow
    view: 'caja',
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
    { type: 'SET_CRITICAL_ERROR'; payload: string | null } |
    { type: 'UPDATE_CAJA_SESSION_DATA'; payload: Partial<CajaSession> };


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
        case 'UPDATE_CAJA_SESSION_DATA': {
             return {
                 ...state,
                 cajaSession: { ...state.cajaSession, ...action.payload }
             };
        }
        case 'OPEN_CAJA': {
            // This is optimistic UI update, DB update happens in async dispatch
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
        case 'CLOSE_CAJA': {
             // Optimistic UI update
             const effectiveCount = action.payload;
             const diff = effectiveCount - state.cajaSession.totalEfectivoEsperado;
             
             return {
                 ...state,
                 cajaSession: {
                     ...state.cajaSession,
                     estado: 'cerrada',
                     efectivoContadoAlCierre: effectiveCount,
                     diferencia: diff,
                     fechaCierre: new Date().toISOString()
                 }
             };
        }
        case 'ADD_MOVIMIENTO_CAJA': {
            const { monto, descripcion, tipo } = action.payload;
            const newMovimiento: MovimientoCaja = { monto, descripcion, tipo, fecha: new Date().toISOString() };
            const currentMovimientos = state.cajaSession.movimientos || [];
            
            // Calculate new totals locally
            let newEfectivoEsperado = state.cajaSession.totalEfectivoEsperado;
            if (tipo === 'ingreso') newEfectivoEsperado += monto;
            else newEfectivoEsperado -= monto;

            return {
                ...state,
                cajaSession: {
                    ...state.cajaSession,
                    movimientos: [...currentMovimientos, newMovimiento],
                    totalEfectivoEsperado: newEfectivoEsperado
                }
            };
        }
        case 'CONFIRM_PAYMENT':
        case 'CONFIRM_DELIVERY_PAYMENT': {
             const { orderId, details } = action.payload;
             const order = state.orders.find(o => o.id === orderId);
             
             // Logic to determine next status based on payment method and delivery type
             let newStatus: EstadoPedido = 'pagado';
             if (action.type === 'CONFIRM_DELIVERY_PAYMENT') {
                 newStatus = 'entregado';
             } else {
                 // For online payments (MP, Yape, etc), skip 'confirmado' and go straight to kitchen
                 if (['mercadopago', 'yape', 'plin'].includes(details.metodo)) {
                    newStatus = 'en preparación';
                 } else {
                     // Default for cash/card in local might be 'en preparación' as well if paid upfront
                     newStatus = 'en preparación';
                 }
             }
             
             // We rely on the realtime subscription to update the caja session totals
             // to ensure single source of truth from DB, but we can optimistically update order status here
             // The critical logic for Caja update is in the async dispatch

             const pagoRegistrado = {
                metodo: details.metodo,
                montoTotal: order ? order.total : 0,
                montoPagado: details.montoPagado || (order ? order.total : 0),
                vuelto: (order && details.montoPagado && order.total) ? details.montoPagado - order.total : 0,
                fecha: new Date().toISOString()
             };
             
             // If order is missing locally, we can't update it here, but dispatch will handle DB update
             if (!order) return state;

             return {
                ...state,
                orders: state.orders.map(o => o.id === orderId ? { ...o, estado: newStatus, pagoRegistrado } : o),
                orderToPay: null,
                orderForDeliveryPayment: null,
                orderForReceipt: { ...order, estado: newStatus, pagoRegistrado }
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
                        // AUTOMATIC FALLBACK: Use provided URL or generate a default one based on category
                        imagenUrl: p.imagen_url || getCategoryDefaultImage(p.categoria, p.nombre)
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
                
                // 7. Active Caja Session
                const { data: sessionData } = await supabase
                    .from('caja_sessions')
                    .select('*')
                    .eq('restaurant_id', RESTAURANT_ID)
                    .eq('estado', 'abierta')
                    .maybeSingle();

                if (sessionData) {
                    const mappedSession: CajaSession = {
                        id: sessionData.id,
                        estado: sessionData.estado,
                        fechaApertura: sessionData.fecha_apertura,
                        saldoInicial: sessionData.saldo_inicial,
                        totalEfectivoEsperado: sessionData.total_efectivo_esperado,
                        totalVentas: sessionData.total_ventas,
                        ventasPorMetodo: sessionData.detalles_cierre || {},
                        movimientos: sessionData.movimientos || [],
                        restaurant_id: sessionData.restaurant_id,
                        gananciaTotal: sessionData.gananciaTotal || 0
                    };
                    baseDispatch({ type: 'SET_STATE', payload: { cajaSession: mappedSession } });
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

        // Realtime Sync for Caja Sessions
        const cajaChannel = supabase.channel('public:caja_sessions')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'caja_sessions', filter: `restaurant_id=eq.${RESTAURANT_ID}` },
                (payload) => {
                     const newData = payload.new;
                     // Map snake_case to camelCase for CajaSession
                     // This ensures that when one device updates the total, all others receive it immediately.
                     const mappedSession: Partial<CajaSession> = {
                        id: newData.id,
                        estado: newData.estado,
                        fechaApertura: newData.fecha_apertura,
                        fechaCierre: newData.fecha_cierre,
                        saldoInicial: newData.saldo_inicial,
                        totalEfectivoEsperado: newData.total_efectivo_esperado,
                        totalVentas: newData.total_ventas,
                        gananciaTotal: newData.ganancia_total,
                        ventasPorMetodo: newData.detalles_cierre || {},
                        movimientos: newData.movimientos || [],
                        diferencia: newData.diferencia,
                        efectivoContadoAlCierre: newData.efectivo_contado_al_cierre
                     };
                     
                     baseDispatch({ type: 'UPDATE_CAJA_SESSION_DATA', payload: mappedSession });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(settingsChannel);
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(salsasChannel);
            supabase.removeChannel(cajaChannel);
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
                    // CHANGED LOGIC: All orders now go straight to kitchen ('en preparación')
                    // Skipping 'pendiente confirmar pago' and 'pendiente de confirmación' (Recepción)
                    const initialState: EstadoPedido = 'en preparación';
                    
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
                    
                    baseDispatch({ type: 'SAVE_POS_ORDER', payload: { orderData: newOrder, mesaNumero: 0 } });
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
                case 'OPEN_CAJA': {
                    const saldoInicial = action.payload;
                    const { data, error } = await supabase.from('caja_sessions').insert({
                        restaurant_id: RESTAURANT_ID,
                        estado: 'abierta',
                        fecha_apertura: new Date().toISOString(),
                        saldo_inicial: saldoInicial,
                        total_efectivo_esperado: saldoInicial,
                        detalles_cierre: {} // Will store ventasPorMetodo
                    }).select().single();

                    if (data) {
                         // Update local state with real DB ID
                         baseDispatch({ type: 'UPDATE_CAJA_SESSION_DATA', payload: { id: data.id } });
                    }
                    break;
                }
                case 'CLOSE_CAJA': {
                    const efectivoContado = action.payload;
                    const session = state.cajaSession;
                    if (!session.id) return;

                    const diff = efectivoContado - session.totalEfectivoEsperado;
                    
                    await supabase.from('caja_sessions').update({
                        estado: 'cerrada',
                        fecha_cierre: new Date().toISOString(),
                        diferencia: diff,
                        // Ensure final totals are synced
                        total_ventas: session.totalVentas,
                        total_efectivo_esperado: session.totalEfectivoEsperado,
                        detalles_cierre: session.ventasPorMetodo
                    }).eq('id', session.id);
                    break;
                }
                case 'ADD_MOVIMIENTO_CAJA': {
                    const { monto, descripcion, tipo } = action.payload;
                    const session = state.cajaSession;
                    if (!session.id) return;

                    const newMovimiento: MovimientoCaja = { monto, descripcion, tipo, fecha: new Date().toISOString() };
                    const updatedMovimientos = [...(session.movimientos || []), newMovimiento];
                    
                    // Calculate new totals
                    let newEfectivoEsperado = session.totalEfectivoEsperado;
                    if (tipo === 'ingreso') newEfectivoEsperado += monto;
                    else newEfectivoEsperado -= monto;

                    await supabase.from('caja_sessions').update({
                        movimientos: updatedMovimientos,
                        total_efectivo_esperado: newEfectivoEsperado
                    }).eq('id', session.id);
                    break;
                }
                case 'CONFIRM_PAYMENT':
                case 'CONFIRM_DELIVERY_PAYMENT': {
                    const { orderId, details } = action.payload;
                    
                    let total = 0;
                    // Try to find order in local state first
                    const localOrder = state.orders.find(o => o.id === orderId);
                    
                    if (localOrder) {
                        total = localOrder.total;
                    } else {
                        // If not found (e.g. reload), fetch from DB to ensure we have the total for Caja
                        const { data: dbOrder } = await supabase
                            .from('orders')
                            .select('total')
                            .eq('id', orderId)
                            .single();
                        if (dbOrder) total = dbOrder.total;
                    }
                    
                    let newStatus: EstadoPedido = 'pagado';
                    if (action.type === 'CONFIRM_DELIVERY_PAYMENT') {
                        newStatus = 'entregado';
                    } else {
                        // With Direct Kitchen flow, payments usually happen AFTER prep or at the same time
                        // We keep 'en preparación' if it's an online payment that happened early
                        // Or shift to 'pagado' if it's a counter payment
                        // User requested simplicity, so if they pay, we can just ensure it doesn't get stuck.
                        // Force 'en preparación' to be safe so it stays on kitchen board if not delivered yet.
                        if (['mercadopago', 'yape', 'plin'].includes(details.metodo)) {
                            newStatus = 'en preparación';
                        } else {
                            newStatus = 'en preparación'; 
                        }
                    }

                    const pagoRegistrado = {
                        metodo: details.metodo,
                        montoTotal: total,
                        montoPagado: details.montoPagado || total,
                        vuelto: (details.montoPagado && total) ? details.montoPagado - total : 0,
                        fecha: new Date().toISOString()
                    };
                    
                    // Update DB Status
                    const { error } = await supabase.from('orders').update({
                        estado: newStatus,
                        pago_registrado: pagoRegistrado
                    }).eq('id', orderId);

                    if (error) console.error("Failed to confirm payment in DB:", error);

                    // --- CAJA SESSION UPDATE ---
                    // Fetch the latest open session from DB to ensure we have the correct ID even after reload
                    let sessionId = state.cajaSession.id;
                    let currentSessionState = state.cajaSession;

                    if (!sessionId || state.cajaSession.estado !== 'abierta') {
                        const { data: activeSession } = await supabase
                            .from('caja_sessions')
                            .select('*')
                            .eq('restaurant_id', RESTAURANT_ID)
                            .eq('estado', 'abierta')
                            .maybeSingle();
                        
                        if (activeSession) {
                            sessionId = activeSession.id;
                            // Map basic needed fields to update logic
                            currentSessionState = {
                                ...currentSessionState,
                                id: activeSession.id,
                                ventasPorMetodo: activeSession.detalles_cierre || {},
                                totalVentas: activeSession.total_ventas || 0,
                                totalEfectivoEsperado: activeSession.total_efectivo_esperado || 0
                            };
                        }
                    }

                    if (sessionId) {
                        const currentVentasMethod = currentSessionState.ventasPorMetodo[details.metodo] || 0;
                        const newVentasMethod = currentVentasMethod + total;
                        
                        // Important: Ensure we use a new object for the update
                        const newVentasPorMetodo = {
                            ...currentSessionState.ventasPorMetodo,
                            [details.metodo]: newVentasMethod
                        };
                        
                        const newTotalVentas = currentSessionState.totalVentas + total;
                        const newTotalEfectivo = details.metodo === 'efectivo' 
                            ? currentSessionState.totalEfectivoEsperado + total 
                            : currentSessionState.totalEfectivoEsperado;

                        await supabase.from('caja_sessions').update({
                            total_ventas: newTotalVentas,
                            total_efectivo_esperado: newTotalEfectivo,
                            detalles_cierre: newVentasPorMetodo // Using this column to store the breakdown
                        }).eq('id', sessionId);
                    }

                    break;
                }
            }
        } catch (err) {
            console.error("Error syncing action to Supabase:", action, err);
            baseDispatch({ type: 'ADD_TOAST', payload: { message: 'Error de sincronización', type: 'danger' } });
        }
    }, [state.restaurantSettings, state.turno, state.orders, state.cajaSession]);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
