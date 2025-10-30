import type { Pedido, Producto, Salsa } from './types';

export const cooks: string[] = ['Chef Mario', 'Chef Luisa', 'Chef Carlos'];
export const deliveryDrivers: string[] = ['Juan', 'Maria', 'Pedro', 'Ana'];

export const yapePlinInfo = {
    nombre: "Restaurante UCHU51",
    telefono: "987 654 321",
    qrUrl: "https://placehold.co/200x200/png?text=QR+Yape/Plin",
};

export const listaDeSalsas: Salsa[] = [
    { nombre: 'Mayonesa', precio: 0.00 },
    { nombre: 'Kétchup', precio: 0.00 },
    { nombre: 'Mostaza', precio: 0.00 },
    { nombre: 'Crema de ají amarillo', precio: 1.00 },
    { nombre: 'Crema de rocoto', precio: 1.50 },
    { nombre: 'Crema huancaína', precio: 2.00 },
    { nombre: 'Salsa BBQ', precio: 1.50 },
    { nombre: 'Salsa tártara', precio: 1.00 },
    { nombre: 'Salsa de ajo', precio: 0.50 },
    { nombre: 'Salsa de maracuyá picante', precio: 2.00 },
    { nombre: 'Ají pollero (ají verde)', precio: 1.00 },
    { nombre: 'Salsa de culantro o guacamole', precio: 2.00 },
    { nombre: 'Salsa de queso cheddar', precio: 2.00 },
    { nombre: 'Miel de mostaza', precio: 1.50 },
];

export const initialProducts: Producto[] = [
    // Hamburguesas
    { id: 'prod-101', nombre: 'Clásica Norteña', categoria: 'Hamburguesas', precio: 10.00, descripcion: 'Hamburguesa artesanal con lechuga fresca, tomate y cremas de la casa.', imagenUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=600&h=400&auto=format&fit=crop' },
    { id: 'prod-102', nombre: 'Queso Power', categoria: 'Hamburguesas', precio: 12.00, descripcion: 'Nuestra clásica con una generosa capa de queso Edam fundido.', imagenUrl: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?q=80&w=600&h=400&auto=format&fit=crop' },
    { id: 'prod-103', nombre: 'Doble Norteña', categoria: 'Hamburguesas', precio: 16.00, descripcion: 'Doble carne, doble queso, para un apetito voraz. ¡Contundente!', imagenUrl: 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?q=80&w=600&h=400&auto=format&fit=crop' },
    { id: 'prod-104', nombre: 'BBQ Urbana', categoria: 'Hamburguesas', precio: 15.00, descripcion: 'Carne jugosa bañada en nuestra salsa BBQ casera con aros de cebolla.', imagenUrl: 'https://images.unsplash.com/photo-1550950158-d09217a1f1b2?q=80&w=600&h=400&auto=format&fit=crop' },
    { id: 'prod-105', nombre: 'Crispy Chicken Boom', categoria: 'Hamburguesas', precio: 13.50, descripcion: 'Filete de pollo empanizado y frito, con lechuga y mayonesa especial.', imagenUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=600&h=400&auto=format&fit=crop' },
    { id: 'prod-106', nombre: 'A lo Pobre Burger', categoria: 'Hamburguesas', precio: 13.00, descripcion: 'La combinación perfecta: hamburguesa, huevo frito y jamón.', imagenUrl: 'https://images.unsplash.com/photo-1551984318-5a82c6a7532a?q=80&w=600&h=400&auto=format&fit=crop' },

    // Pollo Broaster
    { id: 'prod-201', nombre: 'Combo Broaster Personal', categoria: 'Pollo Broaster', precio: 14.00, descripcion: '1 pieza de nuestro jugoso pollo broaster + papas fritas crujientes.', imagenUrl: 'https://images.unsplash.com/photo-1569058242253-92a9c5552db3?q=80&w=600&h=400&auto=format&fit=crop' },
    { id: 'prod-202', nombre: 'Combo Dúo Broaster', categoria: 'Pollo Broaster', precio: 22.00, descripcion: '2 piezas de pollo broaster, papas fritas y tu bebida personal favorita.', imagenUrl: 'https://images.unsplash.com/photo-1626082933429-0526385a4358?q=80&w=600&h=400&auto=format&fit=crop' },
    { id: 'prod-203', nombre: '1/4 Pollo Broaster', categoria: 'Pollo Broaster', precio: 25.00, descripcion: 'Un cuarto de pollo broaster acompañado de papas y ensalada fresca.', imagenUrl: 'https://images.unsplash.com/photo-1626645737594-c62831804b8a?q=80&w=600&h=400&auto=format&fit=crop' },
    { id: 'prod-204', nombre: 'Combo Familiar Broaster', categoria: 'Pollo Broaster', precio: 52.00, descripcion: '6 piezas de pollo, porción familiar de papas y gaseosa de 1 litro.', imagenUrl: 'https://images.unsplash.com/photo-1585550259798-86013a34a994?q=80&w=600&h=400&auto=format&fit=crop' },

    // Alitas
    { id: 'prod-301', nombre: 'Alitas BBQ x4', categoria: 'Alitas', precio: 18.00, descripcion: '4 alitas bañadas en nuestra salsa BBQ, acompañadas de papas fritas.', imagenUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b70a6?q=80&w=600&h=400&auto=format&fit=crop' },
    { id: 'prod-302', nombre: 'Alitas Picantes x6', categoria: 'Alitas', precio: 22.00, descripcion: '6 alitas con nuestro toque picante especial. ¡Solo para valientes!', imagenUrl: 'https://images.unsplash.com/photo-1600891964095-f09b2b513c36?q=80&w=600&h=400&auto=format&fit=crop' },

    // Salchipapas y Mixtos
    { id: 'prod-401', nombre: 'Salchipapa Clásica', categoria: 'Salchipapas y Mixtos', precio: 10.00, descripcion: 'Papas fritas crocantes con hotdog en rodajas y todas las cremas.', imagenUrl: 'https://images.unsplash.com/photo-1613564282832-213d2f9393a4?q=80&w=600&h=400&auto=format&fit=crop' },
    { id: 'prod-402', nombre: 'Salchipapa a lo Pobre', categoria: 'Salchipapas y Mixtos', precio: 12.00, descripcion: 'Nuestra salchipapa clásica coronada con un huevo frito montado.', imagenUrl: 'https://plus.unsplash.com/premium_photo-1673822216835-f716d3330182?q=80&w=600&h=400&auto=format&fit=crop' },
    { id: 'prod-403', nombre: 'SalchiBroaster', categoria: 'Salchipapas y Mixtos', precio: 18.00, descripcion: '¡La combinación ganadora! 1/8 de pollo broaster, papas y salchicha.', imagenUrl: 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?q=80&w=600&h=400&auto=format&fit=crop' },
    { id: 'prod-404', nombre: 'Mostrito Clásico', categoria: 'Salchipapas y Mixtos', precio: 20.00, descripcion: '1/4 de pollo broaster servido con arroz chaufa y papas fritas.', imagenUrl: 'https://images.unsplash.com/photo-1615634289452-bd82ad38a7a8?q=80&w=600&h=400&auto=format&fit=crop' },
    
    // Para Picar
    { id: 'prod-501', nombre: 'Nuggets de Pollo x6', categoria: 'Para Picar', precio: 15.00, descripcion: '6 crujientes nuggets de pollo con papas fritas.', imagenUrl: 'https://images.unsplash.com/photo-1562967914-e8b3d3da05b5?q=80&w=600&h=400&auto=format&fit=crop' },
    { id: 'prod-502', nombre: 'Papas Fritas Personales', categoria: 'Para Picar', precio: 6.00, descripcion: 'Una porción personal de nuestras papas crujientes.', imagenUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=600&h=400&auto=format&fit=crop' },
    
    // Bebidas
    { id: 'prod-601', nombre: 'Gaseosa Personal', categoria: 'Bebidas', precio: 4.00, descripcion: 'Elige tu gaseosa favorita para acompañar tu pedido.', imagenUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?q=80&w=600&h=400&auto=format&fit=crop' },
    { id: 'prod-602', nombre: 'Maracuyá Natural 500ml', categoria: 'Bebidas', precio: 6.00, descripcion: 'Refresco de maracuyá natural, preparado al momento.', imagenUrl: 'https://images.unsplash.com/photo-1602153508753-5e7448b5ab3d?q=80&w=600&h=400&auto=format&fit=crop' },
    { id: 'prod-603', nombre: 'Chicha Morada 500ml', categoria: 'Bebidas', precio: 6.00, descripcion: 'Nuestra tradicional chicha morada, ¡bien helada!', imagenUrl: 'https://images.unsplash.com/photo-1623932371904-7ab79e8a0ada?q=80&w=600&h=400&auto=format&fit=crop' },

    // Postres
    { id: 'prod-701', nombre: 'Pie de Manzana Casero', categoria: 'Postres', precio: 8.00, descripcion: 'Una porción de nuestro delicioso pie de manzana hecho en casa.', imagenUrl: 'https://images.unsplash.com/photo-1535146032232-2c253b3f2732?q=80&w=600&h=400&auto=format&fit=crop' },
];

export const mesasDisponibles: number[] = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16
];

export const initialOrders: Pedido[] = [
    {
        id: 'PED-001',
        fecha: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        tipo: 'delivery',
        estado: 'nuevo',
        turno: 'tarde',
        cliente: {
            nombre: 'Luis Quispe',
            telefono: '+51999888777',
            direccion: 'Urb. El Pinar, Comas',
        },
        productos: [
            { id: 'prod-103', nombre: 'Doble Norteña', cantidad: 1, precio: 16.00, especificaciones: 'Sin ají', salsas: [{ nombre: 'Mayonesa', precio: 0.00 }, { nombre: 'Kétchup', precio: 0.00 }], imagenUrl: 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?q=80&w=600&h=400&auto=format&fit=crop' },
            { id: 'prod-502', nombre: 'Papas Fritas Personales', cantidad: 1, precio: 6.00, imagenUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=600&h=400&auto=format&fit=crop' },
            { id: 'prod-601', nombre: 'Gaseosa Personal', cantidad: 1, precio: 4.00, imagenUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?q=80&w=600&h=400&auto=format&fit=crop' },
        ],
        total: 26.00,
        metodoPago: 'efectivo',
        pagoConEfectivo: 50.00,
        cocineroAsignado: null,
        repartidorAsignado: null,
        tiempoEstimado: 25,
        tiempoTranscurrido: 120,
        notas: 'Tocar el intercomunicador 102',
        historial: [{ estado: 'nuevo', fecha: new Date(Date.now() - 2 * 60 * 1000).toISOString(), usuario: 'cliente' }],
        estacion: 'caliente',
        areaPreparacion: 'delivery',
    },
    {
        id: 'PED-002',
        fecha: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        tipo: 'local',
        estado: 'confirmado',
        turno: 'tarde',
        cliente: {
            nombre: 'Mariela Torres',
            telefono: '+51987654321',
            mesa: 8
        },
        productos: [
            { id: 'prod-404', nombre: 'Mostrito Clásico', cantidad: 1, precio: 20.00, salsas: [{ nombre: 'Ají pollero (ají verde)', precio: 1.00 }, { nombre: 'Crema de rocoto', precio: 1.50 }], imagenUrl: 'https://images.unsplash.com/photo-1615634289452-bd82ad38a7a8?q=80&w=600&h=400&auto=format&fit=crop' },
            { id: 'prod-603', nombre: 'Chicha Morada 500ml', cantidad: 1, precio: 6.00, imagenUrl: 'https://images.unsplash.com/photo-1623932371904-7ab79e8a0ada?q=80&w=600&h=400&auto=format&fit=crop' },
        ],
        total: 28.50,
        metodoPago: 'tarjeta',
        cocineroAsignado: null,
        repartidorAsignado: null,
        tiempoEstimado: 20,
        tiempoTranscurrido: 300,
        historial: [
            { estado: 'nuevo', fecha: new Date(Date.now() - 5 * 60 * 1000).toISOString(), usuario: 'recepcionista' },
            { estado: 'confirmado', fecha: new Date(Date.now() - 4 * 60 * 1000).toISOString(), usuario: 'recepcionista' }
        ],
        estacion: 'caliente',
        areaPreparacion: 'salon',
    },
    {
        id: 'PED-003',
        fecha: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        tipo: 'delivery',
        estado: 'en preparación',
        turno: 'tarde',
        cliente: {
            nombre: 'Jorge Chavez',
            telefono: '+51912345678',
            direccion: 'Av. Universitaria 123, Los Olivos',
        },
        productos: [
            { id: 'prod-204', nombre: 'Combo Familiar Broaster', cantidad: 1, precio: 52.00, salsas: [{ nombre: 'Salsa de ajo', precio: 0.50 }, { nombre: 'Salsa de ajo', precio: 0.50 }, { nombre: 'Salsa BBQ', precio: 1.50 }], imagenUrl: 'https://images.unsplash.com/photo-1585550259798-86013a34a994?q=80&w=600&h=400&auto=format&fit=crop' },
        ],
        total: 54.50,
        metodoPago: 'online',
        cocineroAsignado: 'Chef Mario',
        repartidorAsignado: null,
        tiempoEstimado: 40,
        tiempoTranscurrido: 720,
        historial: [
            { estado: 'nuevo', fecha: new Date(Date.now() - 12 * 60 * 1000).toISOString(), usuario: 'cliente' },
            { estado: 'confirmado', fecha: new Date(Date.now() - 11 * 60 * 1000).toISOString(), usuario: 'admin' },
            { estado: 'en preparación', fecha: new Date(Date.now() - 10 * 60 * 1000).toISOString(), usuario: 'cocinero' }
        ],
        estacion: 'caliente',
        areaPreparacion: 'delivery',
    },
     {
        id: 'PED-004',
        fecha: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
        tipo: 'retiro',
        estado: 'listo',
        turno: 'tarde',
        cliente: {
            nombre: 'Sofia Solano',
            telefono: '+51911223344',
        },
        productos: [
            { id: 'prod-301', nombre: 'Alitas BBQ x4', cantidad: 2, precio: 18.00, imagenUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b70a6?q=80&w=600&h=400&auto=format&fit=crop' },
        ],
        total: 36.00,
        metodoPago: 'efectivo',
        cocineroAsignado: 'Chef Luisa',
        repartidorAsignado: null,
        tiempoEstimado: 20,
        tiempoTranscurrido: 960,
        historial: [],
        estacion: 'caliente',
        areaPreparacion: 'retiro',
    },
    {
        id: 'PED-005',
        fecha: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        tipo: 'delivery',
        estado: 'en camino',
        turno: 'tarde',
        cliente: {
            nombre: 'Carlos Mendoza',
            telefono: '+51955667788',
            direccion: 'Jr. Las Palmeras 456, SMP',
        },
        productos: [
            { id: 'prod-403', nombre: 'SalchiBroaster', cantidad: 1, precio: 18.00, imagenUrl: 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?q=80&w=600&h=400&auto=format&fit=crop' },
            { id: 'prod-101', nombre: 'Clásica Norteña', cantidad: 1, precio: 10.00, especificaciones: "Mucha mayonesa", imagenUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=600&h=400&auto=format&fit=crop' },
        ],
        total: 28.00,
        metodoPago: 'online',
        cocineroAsignado: 'Chef Carlos',
        repartidorAsignado: 'Pedro',
        tiempoEstimado: 35,
        tiempoTranscurrido: 1500,
        historial: [],
        estacion: 'caliente',
        areaPreparacion: 'delivery',
    },
];