









import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type {
    Pedido, Producto, Promocion, Salsa, ClienteLeal, LoyaltyProgram, Recompensa, Mesa,
    CajaSession, MovimientoCaja, EstadoPedido, UserRole, View, Turno, Toast, MetodoPago, Action,
    AreaPreparacion,
    HistorialEstado,
    RestaurantSettings,
    AppView
} from './types';

// --- MOCK DATA ---
const MOCK_RESTAURANT_ID = 'd290f1ee-6c54-4b01-90e6-d701748f0851';

const MOCK_RESTAURANT_SETTINGS: RestaurantSettings = {
  cooks: ['Cocinero 1', 'Cocinero 2'],
  drivers: ['Driver A', 'Driver B'],
  tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  branding: {
    primaryColor: '#F97316',
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
    yape: {
        enabled: true,
        holderName: 'Uchu51 Yape',
        phoneNumber: '987654321',
        qrUrl: 'https://i.postimg.cc/d15q6qNm/yape-qr.png'
    },
    plin: {
        enabled: true,
        holderName: 'Uchu51 Plin',
        phoneNumber: '912345678',
        qrUrl: 'https://i.postimg.cc/L8W2r7D2/plin-qr.png'
    }
  }
};

const MOCK_PRODUCTS: Producto[] = [
    { id: 'prod-1', nombre: 'Hamburguesa Clásica', categoria: 'Hamburguesas', precio: 15.90, costo: 5.50, stock: 50, descripcion: 'Carne de res, lechuga, tomate, queso y papas fritas.', imagenUrl: 'https://i.postimg.cc/pX4290Nor/clasica.jpg', restaurant_id: MOCK_RESTAURANT_ID },
    { id: 'prod-2', nombre: 'Hamburguesa Royal', categoria: 'Hamburguesas', precio: 18.90, costo: 7.00, stock: 30, descripcion: 'Clásica con huevo frito y plátano.', imagenUrl: 'https://i.postimg.cc/vH4Cj2v9/royal.jpg', restaurant_id: MOCK_RESTAURANT_ID },
    { id: 'prod-3', nombre: 'Pollo Broaster (1/4)', categoria: 'Pollo Broaster', precio: 12.90, costo: 4.50, stock: 100, descripcion: 'Pollo crujiente con papas y ensalada.', imagenUrl: 'https://i.postimg.cc/k4z07x5W/broaster.jpg', restaurant_id: MOCK_RESTAURANT_ID },
    { id: 'prod-4', nombre: 'Alitas BBQ (6 und)', categoria: 'Alitas', precio: 20.00, costo: 8.00, stock: 40, descripcion: 'Alitas bañadas en salsa BBQ.', imagenUrl: 'https://i.postimg.cc/d1cLLwqv/alitas.jpg', restaurant_id: MOCK_RESTAURANT_ID },
    { id: 'prod-5', nombre: 'Salchipapa Clásica', categoria: 'Salchipapas y Mixtos', precio: 10.00, costo: 3.50, stock: 200, descripcion: 'Papas fritas con hotdog y cremas.', imagenUrl: 'https://i.postimg.cc/W3hB2L6B/salchipapa.jpg', restaurant_id: MOCK_RESTAURANT_ID },
    { id: 'prod-6', nombre: 'Inca Kola 500ml', categoria: 'Bebidas', precio: 3.50, costo: 1.50, stock: 150, descripcion: 'Bebida gaseosa personal.', imagenUrl: 'https://i.postimg.cc/W4Do3gBH/inca.jpg', restaurant_id: MOCK_RESTAURANT_ID },
    { id: 'prod-7', nombre: 'Torta de Chocolate', categoria: 'Postres', precio: 8.00, costo: 2.50, stock: 20, descripcion: 'Tajada de torta de chocolate con fudge.', imagenUrl: 'https://i.postimg.cc/8C1q23pP/torta-chocolate.jpg', restaurant_id: MOCK_RESTAURANT_ID },
];

const MOCK_SALSAS: Salsa[] = [
    { nombre: 'Mayonesa', precio: 0, isAvailable: true, restaurant_id: MOCK_RESTAURANT_ID },
    { nombre: 'Ketchup', precio: 0, isAvailable: true, restaurant_id: MOCK_RESTAURANT_ID },
    { nombre: 'Mostaza', precio: 0, isAvailable: true, restaurant_id: MOCK_RESTAURANT_ID },
    { nombre: 'Ají de la casa', precio: 0, isAvailable: true, restaurant_id: MOCK_RESTAURANT_ID },
    { nombre: 'Golf', precio: 0, isAvailable: true, restaurant_id: MOCK_RESTAURANT_ID },
    { nombre: 'Salsa de Aceituna', precio: 1.00, isAvailable: true, restaurant_id: MOCK_RESTAURANT_ID },
];

const MOCK_ORDERS: Pedido[] = [
    {
        id: 'PED-001', fecha: new Date(Date.now() - 5 * 60000).toISOString(), tipo: 'delivery', estado: 'en preparación', turno: 'tarde',
        cliente: { nombre: 'Juan Perez', telefono: '987654321', direccion: 'Av. Siempre Viva 123' },
        productos: [{ id: 'prod-1', nombre: 'Hamburguesa Clásica', cantidad: 2, precio: 15.90, sentToKitchen: true }],
        total: 31.80, metodoPago: 'yape', tiempoEstimado: 30, historial: [], areaPreparacion: 'delivery', restaurant_id: MOCK_RESTAURANT_ID,
    },
    {
        id: 'PED-002', fecha: new Date(Date.now() - 10 * 60000).toISOString(), tipo: 'local', estado: 'listo', turno: 'tarde',
        cliente: { nombre: 'Mesa 5', telefono: '', mesa: 5 },
        productos: [{ id: 'prod-3', nombre: 'Pollo Broaster (1/4)', cantidad: 1, precio: 12.90, sentToKitchen: true }],
        total: 12.90, metodoPago: 'efectivo', tiempoEstimado: 15, historial: [], areaPreparacion: 'salon', restaurant_id: MOCK_RESTAURANT_ID,
    },
    {
        id: 'PED-003', fecha: new Date(Date.now() - 2 * 60000).toISOString(), tipo: 'retiro', estado: 'listo', turno: 'tarde',
        cliente: { nombre: 'Ana Lopez', telefono: '912345678' },
        productos: [{ id: 'prod-5', nombre: 'Salchipapa Clásica', cantidad: 1, precio: 10.00, sentToKitchen: true }],
        total: 10.00, metodoPago: 'efectivo', tiempoEstimado: 10, historial: [], areaPreparacion: 'retiro', restaurant_id: MOCK_RESTAURANT_ID,
    },
     {
        id: 'PED-004', fecha: new Date(Date.now() - 15 * 60000).toISOString(), tipo: 'local', estado: 'cuenta solicitada', turno: 'tarde',
        cliente: { nombre: 'Mesa 8', telefono: '', mesa: 8 },
        productos: [
            { id: 'prod-2', nombre: 'Hamburguesa Royal', cantidad: 1, precio: 18.90, sentToKitchen: true },
            { id: 'prod-6', nombre: 'Inca Kola 500ml', cantidad: 1, precio: 3.50, sentToKitchen: true }
        ],
        total: 22.40, metodoPago: 'tarjeta', tiempoEstimado: 20, historial: [], areaPreparacion: 'salon', restaurant_id: MOCK_RESTAURANT_ID,
    },
    {
        id: 'PED-005', fecha: new Date(Date.now() - 1 * 60000).toISOString(), tipo: 'delivery', estado: 'confirmado', turno: 'tarde',
        cliente: { nombre: 'Carlos Ruiz', telefono: '999888777', direccion: 'Calle Falsa 456' },
        productos: [{ id: 'prod-4', nombre: 'Alitas BBQ (6 und)', cantidad: 2, precio: 20.00, sentToKitchen: true }],
        total: 40.00, metodoPago: 'plin', tiempoEstimado: 40, historial: [], areaPreparacion: 'delivery', restaurant_id: MOCK_RESTAURANT_ID,
    },
];

const MOCK_CUSTOMERS: ClienteLeal[] = [
    { telefono: '987654321', nombre: 'Juan Perez', puntos: 150, historialPedidos: [], restaurant_id: MOCK_RESTAURANT_ID },
    { telefono: '912345678', nombre: 'Ana Lopez', puntos: 80, historialPedidos: [], restaurant_id: MOCK_RESTAURANT_ID },
];

const MOCK_LOYALTY_PROGRAMS: LoyaltyProgram[] = [
    {
        id: 'prog-1', name: 'Clientes Frecuentes Uchu51', isActive: true,
        config: { pointEarningMethod: 'monto', pointsPerMonto: 1, montoForPoints: 1, pointsPerCompra: 0 },
        rewards: [
            { id: 'rew-1', nombre: 'Inca Kola 500ml Gratis', puntosRequeridos: 30, productoId: 'prod-6' },
            { id: 'rew-2', nombre: 'Descuento S/.10', puntosRequeridos: 100 },
        ],
        restaurant_id: MOCK_RESTAURANT_ID
    }
];

const MOCK_PROMOTIONS: Promocion[] = [
    {
        id: 'promo-1', nombre: '2x1 en Clásicas', tipo: 'dos_por_uno', isActive: true,
        condiciones: { productoId_2x1: 'prod-1' },
        descripcion: 'Compra una Hamburguesa Clásica y llévate la segunda gratis.',
        restaurant_id: MOCK_RESTAURANT_ID,
    },
    {
        id: 'promo-2', nombre: 'Combo Royal', tipo: 'combo_fijo', isActive: true,
        condiciones: {
            productos: [
                { productoId: 'prod-2', cantidad: 1 },
                { productoId: 'prod-6', cantidad: 1 },
            ],
            precioFijo: 20.00
        },
        descripcion: 'Una Hamburguesa Royal con tu Inca Kola a un precio especial.',
        restaurant_id: MOCK_RESTAURANT_ID
    }
];

// --- END MOCK DATA ---

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


const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction> }>({
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
                restaurantId: MOCK_RESTAURANT_ID,
                loginError: null,
            };
        case 'LOGOUT': {
            return {
                ...initialState,
                isLoading: false,
                appView: 'customer',
                theme: state.theme,
            };
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
            const orderData = action.payload;
            const isPayNow = ['yape', 'plin'].includes(orderData.metodoPago);
            const isRiskyRetiro = orderData.tipo === 'retiro' && ['efectivo', 'tarjeta'].includes(orderData.metodoPago);
            const initialState: EstadoPedido = isPayNow ? 'pendiente confirmar pago' : isRiskyRetiro ? 'pendiente de confirmación' : 'en preparación';
            const getAreaPreparacion = (tipo: Pedido['tipo']): AreaPreparacion => tipo === 'local' ? 'salon' : tipo;
            
            const newOrder: Pedido = { 
                ...orderData, 
                id: `PED-${String(Date.now()).slice(-4)}`,
                fecha: new Date().toISOString(), 
                estado: initialState, 
                turno: state.turno, 
                historial: [{ estado: initialState, fecha: new Date().toISOString(), usuario: 'cliente' }], 
                areaPreparacion: getAreaPreparacion(orderData.tipo),
                restaurant_id: state.restaurantId!,
            };
            
            let toastMessage = `Nuevo pedido ${newOrder.id} enviado a cocina.`;
            if (isPayNow) toastMessage = `Pedido ${newOrder.id} recibido. Esperando confirmación de pago.`;
            else if (isRiskyRetiro) toastMessage = `Pedido ${newOrder.id} pendiente de confirmación.`;

            return { 
                ...state, 
                orders: [newOrder, ...state.orders],
                toasts: [...state.toasts, { id: Date.now(), message: toastMessage, type: 'success' }] 
            };
        }
        case 'SAVE_POS_ORDER': {
            const { orderData } = action.payload;
            const isNew = !orderData.id;
            const orderToSave = isNew 
                ? { ...orderData, id: `PED-${String(Date.now()).slice(-4)}`, restaurant_id: state.restaurantId! }
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
        // Simplified actions for local state
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
    
    const [state, dispatch] = useReducer(appReducer, initialState);
    
    useEffect(() => {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Simulate fetching data
        setTimeout(() => {
            dispatch({
                type: 'SET_STATE',
                payload: {
                    products: MOCK_PRODUCTS,
                    salsas: MOCK_SALSAS,
                    promotions: MOCK_PROMOTIONS,
                    orders: MOCK_ORDERS,
                    loyaltyPrograms: MOCK_LOYALTY_PROGRAMS,
                    customers: MOCK_CUSTOMERS,
                    cajaHistory: [],
                    restaurantSettings: MOCK_RESTAURANT_SETTINGS,
                    restaurantId: MOCK_RESTAURANT_ID,
                    isLoading: false,
                }
            });
        }, 1000); // 1-second delay
    }, []);


    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);