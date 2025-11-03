import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { initialOrders, initialProducts, initialPromotions, deliveryDrivers, mesasDisponibles } from './constants';
import type {
    Pedido, Producto, Promocion, ClienteLeal, LoyaltyProgram, Recompensa, Mesa,
    CajaSession, MovimientoCaja, EstadoPedido, UserRole, View, Turno, Toast, MetodoPago, Action,
    AreaPreparacion
} from './types';

interface AppState {
    orders: Pedido[];
    products: Producto[];
    promotions: Promocion[];
    customers: ClienteLeal[];
    loyaltyPrograms: LoyaltyProgram[];
    cajaSession: CajaSession;
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
}

const initialState: AppState = {
    orders: initialOrders,
    products: initialProducts,
    promotions: initialPromotions,
    customers: [],
    loyaltyPrograms: [
        {
            id: 'prog-1', name: 'Programa Estándar', description: 'Programa de lealtad por defecto.', isActive: true,
            config: { pointEarningMethod: 'monto', pointsPerMonto: 5, montoForPoints: 10, pointsPerCompra: 5, },
            rewards: [
                { id: 'rec-1', nombre: 'Gaseosa Personal Gratis', puntosRequeridos: 50, productoId: 'prod-601' },
                { id: 'rec-2', nombre: 'Papas Fritas Personales Gratis', puntosRequeridos: 80, productoId: 'prod-502' },
                { id: 'rec-3', nombre: 'S/.10 de Descuento', puntosRequeridos: 100 },
            ]
        }
    ],
    cajaSession: { estado: 'cerrada', saldoInicial: 0, ventasPorMetodo: {}, totalVentas: 0, totalEfectivoEsperado: 0, fechaApertura: '', gananciaTotal: 0, movimientos: [] },
    view: 'dashboard',
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
};


const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> }>({
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
                telefono: customerPhone, nombre: order.cliente.nombre, puntos: pointsToAdd, historialPedidos: [order],
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


function appReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET_STATE': return { ...state, ...action.payload };
        case 'SET_VIEW': return { ...state, view: action.payload };
        case 'SET_TURNO': return { ...state, turno: action.payload };
        case 'TOGGLE_THEME': return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
        case 'TOGGLE_SIDEBAR': return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
        case 'LOGIN': return { ...state, appView: 'admin', currentUserRole: action.payload, loginError: null };
        case 'LOGIN_FAILED': return { ...state, loginError: action.payload };
        case 'LOGOUT': return { ...state, appView: 'customer', currentUserRole: 'cliente' };
        case 'GO_TO_LOGIN': return { ...state, appView: 'login' };
        case 'ADD_TOAST': return { ...state, toasts: [...state.toasts, { ...action.payload, id: Date.now() }] };
        case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
        case 'SET_INSTALL_PROMPT': return { ...state, installPrompt: action.payload };
        
        case 'UPDATE_ORDER_STATUS': {
            const { orderId, newStatus, user } = action.payload;
            // FIX: Explicitly typing the updated order object prevents TypeScript from incorrectly
            // widening the `EstadoPedido` type to a generic `string`, which was causing a type error.
            return {
                ...state,
                orders: state.orders.map(o => {
                    if (o.id === orderId) {
                        const updatedOrder: Pedido = {
                            ...o,
                            estado: newStatus,
                            historial: [...o.historial, { estado: newStatus, fecha: new Date().toISOString(), usuario: user }]
                        };
                        return updatedOrder;
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
            const newOrder: Pedido = { ...orderData, id: `PED-${String(Date.now()).slice(-4)}`, fecha: new Date().toISOString(), estado: initialState, turno: state.turno, historial: [{ estado: initialState, fecha: new Date().toISOString(), usuario: state.currentUserRole }], areaPreparacion: getAreaPreparacion(orderData.tipo) };
            
            let toastMessage = `Nuevo pedido ${newOrder.id} enviado a cocina.`;
            if (isPayNow) toastMessage = `Pedido ${newOrder.id} recibido. Esperando confirmación de pago.`;
            else if (isRiskyRetiro) toastMessage = `Pedido ${newOrder.id} pendiente de confirmación.`;

            return { ...state, orders: [newOrder, ...state.orders], toasts: [...state.toasts, { id: Date.now(), message: toastMessage, type: 'success' }] };
        }
        case 'SAVE_POS_ORDER': {
            const { orderData, mesaNumero } = action.payload;
            const existingOrderIndex = state.orders.findIndex(o => o.id === orderData.id);
            let newOrders: Pedido[];
            let toastMessage: string;
            let newOrderForTable: Pedido | null = null;
            if (existingOrderIndex > -1) {
                newOrders = state.orders.map(o => o.id === orderData.id ? orderData : o);
                toastMessage = `Pedido ${orderData.id} actualizado y enviado a cocina.`;
            } else {
                newOrderForTable = { ...orderData, id: `PED-${String(Date.now()).slice(-4)}`, fecha: new Date().toISOString(), turno: state.turno, historial: [{ estado: orderData.estado, fecha: new Date().toISOString(), usuario: 'admin' }] };
                newOrders = [newOrderForTable, ...state.orders];
                toastMessage = `Nuevo pedido ${newOrderForTable.id} creado y enviado a cocina.`;
            }
            const updatedMesa = (state.posMesaActiva && state.posMesaActiva.numero === mesaNumero && newOrderForTable) ? { ...state.posMesaActiva, ocupada: true, pedidoId: newOrderForTable.id } : state.posMesaActiva;
            return { ...state, orders: newOrders, posMesaActiva: updatedMesa, preselectedCustomerForPOS: null, toasts: [...state.toasts, { id: Date.now(), message: toastMessage, type: 'success' }] };
        }
        case 'OPEN_CAJA': {
            const newSession: CajaSession = { estado: 'abierta', fechaApertura: new Date().toISOString(), saldoInicial: action.payload, ventasPorMetodo: {}, totalVentas: 0, gananciaTotal: 0, totalEfectivoEsperado: action.payload, movimientos: [] };
            return { ...state, cajaSession: newSession, toasts: [...state.toasts, { id: Date.now(), message: 'Caja abierta con éxito.', type: 'success' }] };
        }
        case 'CLOSE_CAJA': {
            if (state.cajaSession.estado !== 'abierta') return state;
            const diferencia = action.payload - state.cajaSession.totalEfectivoEsperado;
            const closedSession: CajaSession = { ...state.cajaSession, estado: 'cerrada', fechaCierre: new Date().toISOString(), efectivoContadoAlCierre: action.payload, diferencia };
            const toastMessage = `Caja cerrada. ${diferencia === 0 ? 'Cuadre perfecto.' : (diferencia > 0 ? `Sobrante: S/.${diferencia.toFixed(2)}` : `Faltante: S/.${Math.abs(diferencia).toFixed(2)}`)}`;
            return { ...state, cajaSession: closedSession, toasts: [...state.toasts, { id: Date.now(), message: toastMessage, type: 'info' }] };
        }
        case 'ADD_MOVIMIENTO_CAJA': {
             if (state.cajaSession.estado !== 'abierta') return state;
            const { monto, descripcion, tipo } = action.payload;
            const newMovimiento: MovimientoCaja = { tipo, monto, descripcion, fecha: new Date().toISOString() };
            const nuevosMovimientos = [...(state.cajaSession.movimientos || []), newMovimiento];
            const totalIngresos = nuevosMovimientos.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
            const totalEgresos = nuevosMovimientos.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0);
            const newCajaSession = { ...state.cajaSession, movimientos: nuevosMovimientos, totalEfectivoEsperado: state.cajaSession.saldoInicial + (state.cajaSession.ventasPorMetodo.efectivo || 0) + totalIngresos - totalEgresos };
            const toastMessage = `Se ${tipo === 'ingreso' ? 'agregó' : 'retiró'} S/.${monto.toFixed(2)} de la caja.`;
            return { ...state, cajaSession: newCajaSession, toasts: [...state.toasts, { id: Date.now(), message: toastMessage, type: 'info' }] };
        }
        // FIX: Replaced `||` with fall-through cases to handle both actions correctly
        case 'CONFIRM_PAYMENT':
        case 'CONFIRM_DELIVERY_PAYMENT': {
             const { orderId, details } = action.payload;
             const order = state.orders.find(o => o.id === orderId);
             if (!order) return state;
             if (state.cajaSession.estado !== 'abierta' || !details.metodo) return state;

             let vuelto = (details.metodo === 'efectivo' && details.montoPagado && details.montoPagado >= order.total) ? details.montoPagado - order.total : 0;
             let updatedOrderShell: Pedido = { ...order, estado: 'pagado', historial: [...order.historial, { estado: 'pagado', fecha: new Date().toISOString(), usuario: 'admin' }], pagoRegistrado: { metodo: details.metodo, montoTotal: order.total, montoPagado: details.montoPagado, vuelto, fecha: new Date().toISOString() } };
             
             const { updatedOrder, updatedProducts, updatedCustomers } = registrarVenta(updatedOrderShell, state.products, state.customers, state.loyaltyPrograms);
             
             const { total: monto, pagoRegistrado } = updatedOrder;
             if (!pagoRegistrado) return state; // type guard
             const { metodo } = pagoRegistrado;
             const {gananciaEstimada} = updatedOrder;
             const newVentas = { ...state.cajaSession.ventasPorMetodo, [metodo]: (state.cajaSession.ventasPorMetodo[metodo] || 0) + monto };
             const totalIngresos = (state.cajaSession.movimientos || []).filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
             const totalEgresos = (state.cajaSession.movimientos || []).filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0);

             const updatedCaja = {
                 ...state.cajaSession,
                 ventasPorMetodo: newVentas,
                 totalVentas: state.cajaSession.totalVentas + monto,
                 gananciaTotal: (state.cajaSession.gananciaTotal || 0) + (gananciaEstimada || 0),
                 totalEfectivoEsperado: state.cajaSession.saldoInicial + (newVentas.efectivo || 0) + totalIngresos - totalEgresos
             };

             const updatedOrders = state.orders.map(o => o.id === orderId ? updatedOrder : o);
             
             const isDelivery = action.type === 'CONFIRM_DELIVERY_PAYMENT';
             
             return {
                 ...state,
                 orders: updatedOrders,
                 products: updatedProducts,
                 customers: updatedCustomers,
                 cajaSession: updatedCaja,
                 orderToPay: null,
                 orderForDeliveryPayment: null,
                 orderForReceipt: updatedOrder,
                 toasts: [...state.toasts, {id: Date.now(), message: isDelivery ? `Pedido ${orderId} entregado y pagado.` : `Pago de ${orderId} confirmado.`, type: 'success'}]
             };
        }
        case 'INITIATE_PREBILL': {
            const order = state.orders.find(o => o.id === action.payload);
            if (!order) return state;
            const updatedOrders = state.orders.map(o => {
                if (o.id === action.payload) {
                    // FIX: Explicitly typed the updated order object to prevent TypeScript from widening
                    // the `EstadoPedido` type to a generic `string`, which causes a type error.
                    const updatedOrder: Pedido = {
                        ...o,
                        estado: 'cuenta solicitada',
                        historial: [...o.historial, { estado: 'cuenta solicitada', fecha: new Date().toISOString(), usuario: 'admin' }]
                    };
                    return updatedOrder;
                }
                return o;
            });
            return { ...state, orders: updatedOrders, orderForPreBill: order };
        }
        case 'INITIATE_PAYMENT': return { ...state, orderToPay: action.payload };
        case 'INITIATE_DELIVERY_PAYMENT': return { ...state, orderForDeliveryPayment: action.payload };
        case 'CLOSE_MODALS': return { ...state, orderForPreBill: null, orderToPay: null, orderForDeliveryPayment: null, orderForReceipt: null };
        case 'SELECT_MESA': {
            return {
                ...state,
                posMesaActiva: action.payload.mesa,
                preselectedCustomerForPOS: action.payload.customer || null,
                mesaParaAsignarCliente: null, // Cierra el modal de asignación al proceder
            };
        }
        case 'INITIATE_ASSIGN_CUSTOMER_TO_MESA':
            return { ...state, mesaParaAsignarCliente: action.payload };
        case 'CANCEL_ASSIGN_CUSTOMER':
            return { ...state, mesaParaAsignarCliente: null };
        case 'SET_PRODUCTS': return { ...state, products: action.payload };
        case 'SET_PROMOTIONS': return { ...state, promotions: action.payload };
        case 'SET_LOYALTY_PROGRAMS': return { ...state, loyaltyPrograms: action.payload };
        case 'ADD_NEW_CUSTOMER': {
            const { telefono, nombre } = action.payload;
            if (state.customers.find(c => c.telefono === telefono)) {
                return { ...state, toasts: [...state.toasts, { id: Date.now(), message: `El cliente con teléfono ${telefono} ya existe.`, type: 'danger' }]};
            }
            const newCustomer: ClienteLeal = { telefono, nombre, puntos: 0, historialPedidos: [] };
            return { ...state, customers: [...state.customers, newCustomer], toasts: [...state.toasts, { id: Date.now(), message: `Nuevo cliente '${nombre}' registrado con éxito.`, type: 'success' }]};
        }
        case 'REDEEM_REWARD': {
            const { customerId, reward } = action.payload;
            const customerIndex = state.customers.findIndex(c => c.telefono === customerId);
            if (customerIndex === -1) {
                 return { ...state, toasts: [...state.toasts, { id: Date.now(), message: 'Error: No se pudo encontrar al cliente para el canje.', type: 'danger' }]};
            }
            const updatedCustomers = [...state.customers];
            const customer = { ...updatedCustomers[customerIndex] };
            if (customer.puntos < reward.puntosRequeridos) {
                return { ...state, toasts: [...state.toasts, { id: Date.now(), message: 'Error: Puntos insuficientes para canjear.', type: 'danger' }]};
            }
            customer.puntos -= reward.puntosRequeridos;
            updatedCustomers[customerIndex] = customer;
            return { ...state, customers: updatedCustomers, toasts: [...state.toasts, { id: Date.now(), message: `'${reward.nombre}' canjeado. Puntos restantes: ${customer.puntos}.`, type: 'success' }]};
        }
        default:
            return state;
    }
}

const LOCAL_STORAGE_KEY = 'uchu51-state';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    
    const initializer = (initial: AppState) => {
        try {
            const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedState) {
                const parsed = JSON.parse(storedState);
                // Combine stored state with initial state to avoid missing properties
                return { ...initial, ...parsed, installPrompt: null, toasts: [] };
            }
        } catch (e) {
            console.error("Failed to parse state from localStorage.", e);
        }
        return initial;
    };

    const [state, dispatch] = useReducer(appReducer, initialState, initializer);

    useEffect(() => {
        // Save state to localStorage, excluding non-serializable parts
        const stateToSave = { ...state, installPrompt: null, toasts: [] };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    }, [state]);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);