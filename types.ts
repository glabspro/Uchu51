
export type EstadoPedido = 'pendiente de confirmación' | 'nuevo' | 'confirmado' | 'en preparación' | 'en armado' | 'listo para armado' | 'listo' | 'en camino' | 'entregado' | 'cancelado' | 'recogido' | 'pagado';
export type TipoPedido = 'delivery' | 'local' | 'retiro';
export type Turno = 'mañana' | 'tarde' | 'noche';
export type View = 'espera' | 'cocina' | 'delivery' | 'local' | 'retiro' | 'dashboard' | 'caja';
export type UserRole = 'admin' | 'cocinero' | 'repartidor' | 'recepcionista' | 'cliente';
export type MetodoPago = 'efectivo' | 'tarjeta' | 'yape/plin' | 'online';


export interface Cliente {
    nombre: string;
    telefono: string;
    direccion?: string;
    mesa?: number | null;
}

export interface Salsa {
    nombre: string;
    precio: number;
}

export interface ProductoPedido {
    id: string;
    nombre: string;
    cantidad: number;
    precio: number;
    especificaciones?: string;
    imagenUrl?: string;
    salsas?: Salsa[];
}

export interface Producto {
    id: string;
    nombre: string;
    categoria: string;
    precio: number;
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
    tiempoTranscurrido: number;
    notas?: string;
    historial: HistorialEstado[];
    estacion?: 'caliente' | 'fria';
    areaPreparacion?: AreaPreparacion;
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
    type: 'success' | 'info';
}

export interface Mesa {
    numero: number;
    ocupada: boolean;
    pedidoId: string | null;
}