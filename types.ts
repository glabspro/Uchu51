export type EstadoPedido = 'pendiente confirmar pago' | 'pendiente de confirmación' | 'nuevo' | 'confirmado' | 'en preparación' | 'en armado' | 'listo para armado' | 'listo' | 'en camino' | 'entregado' | 'cancelado' | 'recogido' | 'pagado' | 'cuenta solicitada';
export type TipoPedido = 'delivery' | 'local' | 'retiro';
export type Turno = 'mañana' | 'tarde' | 'noche';
export type View = 'dashboard' | 'local' | 'cocina' | 'retiro' | 'delivery' | 'gestion' | 'caja';
export type UserRole = 'admin' | 'cocinero' | 'repartidor' | 'recepcionista' | 'cliente';
export type MetodoPago = 'efectivo' | 'tarjeta' | 'yape' | 'plin' | 'online';
export type Theme = 'light' | 'dark';


export interface Cliente {
    nombre: string;
    telefono: string;
    direccion?: string;
    mesa?: number | null;
}

export interface Salsa {
    nombre: string;
    precio: number;
    isAvailable: boolean;
}

export interface ProductoPedido {
    id: string;
    nombre: string;
    cantidad: number;
    precio: number;
    especificaciones?: string;
    imagenUrl?: string;
    salsas?: Salsa[];
    sentToKitchen?: boolean;
    isReward?: boolean;
    promocionId?: string;
    precioOriginal?: number;
}

export interface Producto {
    id: string;
    nombre: string;
    categoria: string;
    precio: number;
    costo: number;
    stock: number;
    descripcion?: string;
    imagenUrl?: string;
}


export interface HistorialEstado {
    estado: EstadoPedido;
    fecha: string;
    usuario: UserRole;
}

export type AreaPreparacion = 'delivery' | 'retiro' | 'salon';

export interface Pedido {
    id: string;
    fecha: string;
    tipo: TipoPedido;
    estado: EstadoPedido;
    turno: Turno;
    cliente: Cliente;
    productos: ProductoPedido[];
    total: number;
    metodoPago: MetodoPago;
    pagoConEfectivo?: number; // Para delivery en efectivo
    pagoExacto?: boolean; // Para delivery en efectivo con monto exacto
    cocineroAsignado?: string | null;
    repartidorAsignado?: string | null;
    tiempoEstimado: number;
    notas?: string;
    historial: HistorialEstado[];
    estacion?: 'caliente' | 'fria';
    areaPreparacion?: AreaPreparacion;
    puntosGanados?: number;
    gananciaEstimada?: number; // FIX: Add missing property
    pagoRegistrado?: {
        metodo: MetodoPago;
        montoTotal: number;
        montoPagado?: number;
        vuelto?: number;
        fecha: string;
    };
}

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'info' | 'danger';
}

export interface Mesa {
    numero: number;
    ocupada: boolean;
    pedidoId: string | null;
    estadoPedido?: EstadoPedido;
}

export interface MovimientoCaja {
    tipo: 'ingreso' | 'egreso';
    monto: number;
    descripcion: string;
    fecha: string;
}

export interface CajaSession {
    estado: 'abierta' | 'cerrada';
    fechaApertura: string;
    fechaCierre?: string;
    saldoInicial: number;
    ventasPorMetodo: {
        [key in MetodoPago]?: number;
    };
    totalVentas: number;
    gananciaTotal?: number;
    totalEfectivoEsperado: number;
    efectivoContadoAlCierre?: number;
    diferencia?: number;
    movimientos?: MovimientoCaja[];
}

export interface ClienteLeal {
    telefono: string;
    nombre: string;
    puntos: number;
    historialPedidos: Pedido[];
}

export interface Recompensa {
    id: string;
    nombre: string;
    puntosRequeridos: number;
    productoId?: string;
}

export interface LoyaltyConfig {
    pointEarningMethod: 'monto' | 'compra';
    pointsPerMonto: number;
    montoForPoints: number;
    pointsPerCompra: number;
}

export interface LoyaltyProgram {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    config: LoyaltyConfig;
    rewards: Recompensa[];
}

export type TipoPromocion = 'combo_fijo' | 'descuento_porcentaje' | 'dos_por_uno';

export interface CondicionesPromocion {
    // Para combo_fijo
    productos?: { productoId: string; cantidad: number }[];
    precioFijo?: number;

    // Para descuento_porcentaje
    productoIds?: string[]; // IDs de productos a los que aplica. Vacío para toda la orden.
    porcentaje?: number;

    // Para dos_por_uno
    productoId_2x1?: string;
}

export interface Promocion {
    id: string;
    nombre: string;
    descripcion?: string;
    imagenUrl?: string;
    tipo: TipoPromocion;
    isActive: boolean;
    condiciones: CondicionesPromocion;
    diasActivos?: ('lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo')[];
    horarioActivo?: { desde: string; hasta: string };
}

export type Action =
  | { type: 'SET_VIEW'; payload: View }
  | { type: 'SET_TURNO'; payload: Turno }
  | { type: 'TOGGLE_THEME' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'LOGIN'; payload: UserRole }
  | { type: 'LOGIN_FAILED'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'GO_TO_LOGIN' }
  | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
  | { type: 'REMOVE_TOAST'; payload: number }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; newStatus: EstadoPedido; user: UserRole } }
  | { type: 'ASSIGN_DRIVER'; payload: { orderId: string; driverName: string } }
  | { type: 'SAVE_ORDER'; payload: Omit<Pedido, 'id' | 'fecha' | 'turno' | 'historial' | 'areaPreparacion' | 'estado' | 'gananciaEstimada'> }
  | { type: 'SAVE_POS_ORDER'; payload: { orderData: Pedido; mesaNumero: number } }
  | { type: 'OPEN_CAJA'; payload: number }
  | { type: 'CLOSE_CAJA'; payload: number }
  | { type: 'ADD_MOVIMIENTO_CAJA'; payload: { monto: number; descripcion: string; tipo: 'ingreso' | 'egreso' } }
  | { type: 'INITIATE_PREBILL'; payload: string }
  | { type: 'INITIATE_PAYMENT'; payload: Pedido }
  | { type: 'INITIATE_DELIVERY_PAYMENT'; payload: Pedido }
  | { type: 'CONFIRM_PAYMENT'; payload: { orderId: string; details: { metodo: MetodoPago; montoPagado?: number } } }
  | { type: 'CONFIRM_DELIVERY_PAYMENT'; payload: { orderId: string; details: { metodo: MetodoPago; montoPagado?: number } } }
  | { type: 'CLOSE_MODALS' }
  | { type: 'SELECT_MESA'; payload: { mesa: Mesa | null; customer?: ClienteLeal | null } }
  | { type: 'INITIATE_ASSIGN_CUSTOMER_TO_MESA', payload: Mesa }
  | { type: 'CANCEL_ASSIGN_CUSTOMER' }
  | { type: 'SET_PRODUCTS'; payload: Producto[] }
  | { type: 'SET_SAUCES'; payload: Salsa[] }
  | { type: 'SET_PROMOTIONS'; payload: Promocion[] }
  | { type: 'SET_LOYALTY_PROGRAMS'; payload: LoyaltyProgram[] }
  | { type: 'ADD_NEW_CUSTOMER'; payload: { telefono: string; nombre: string } }
  | { type: 'REDEEM_REWARD'; payload: { customerId: string; reward: Recompensa } }
  | { type: 'SET_INSTALL_PROMPT'; payload: any }
  | { type: 'SET_STATE'; payload: any };