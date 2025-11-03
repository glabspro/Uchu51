import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initialOrders, initialProducts, deliveryDrivers, mesasDisponibles, initialPromotions } from './constants';
import type { Pedido, EstadoPedido, Turno, UserRole, View, Toast as ToastType, AreaPreparacion, Producto, ProductoPedido, Mesa, MetodoPago, Theme, CajaSession, MovimientoCaja, ClienteLeal, LoyaltyProgram, Recompensa, Promocion } from './types';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import KitchenBoard from './components/KitchenBoard';
import DeliveryBoard from './components/DeliveryBoard';
import LocalBoard from './components/LocalBoard';
import RetiroBoard from './components/RetiroBoard';
import Dashboard from './components/Dashboard';
import POSView from './components/POSView';
import CustomerView from './components/CustomerView';
import Login from './components/Login';
import Toast from './components/Toast';
import CajaView from './components/CajaView';
import PaymentModal from './components/PaymentModal';
import ReceiptModal from './components/ReceiptModal';
import PreBillModal from './components/PreBillModal';
import DeliveryPaymentModal from './components/DeliveryPaymentModal';
import GestionView from './components/GestionView';

type AppView = 'customer' | 'login' | 'admin';

const App: React.FC = () => {
    const [orders, setOrders] = useState<Pedido[]>(() => {
        const savedOrders = localStorage.getItem('orders');
        if (!savedOrders) return initialOrders;
        try {
            const parsed = JSON.parse(savedOrders);
            return Array.isArray(parsed) ? parsed.filter(o => o && typeof o === 'object') : initialOrders;
        } catch (e) {
            console.error("Failed to parse orders from localStorage.", e);
            return initialOrders;
        }
    });

    const [products, setProducts] = useState<Producto[]>(() => {
        const savedProducts = localStorage.getItem('products');
        try {
            if (savedProducts) {
                return JSON.parse(savedProducts);
            }
        } catch (e) {
            console.error("Failed to parse products from localStorage", e);
        }
        return initialProducts;
    });
    
    const [promotions, setPromotions] = useState<Promocion[]>(() => {
        const saved = localStorage.getItem('promotions');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { console.error("Failed to parse promotions", e); }
        }
        return initialPromotions;
    });

    const [customers, setCustomers] = useState<ClienteLeal[]>(() => {
        const saved = localStorage.getItem('customers');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse customers from localStorage", e);
            }
        }
        return [];
    });
    
    const [loyaltyPrograms, setLoyaltyPrograms] = useState<LoyaltyProgram[]>(() => {
        const saved = localStorage.getItem('loyaltyPrograms');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { console.error("Failed to parse loyaltyPrograms", e); }
        }
        return [
            {
                id: 'prog-1',
                name: 'Programa Estándar',
                description: 'Programa de lealtad por defecto para todos los clientes.',
                isActive: true,
                config: {
                    pointEarningMethod: 'monto',
                    pointsPerMonto: 5,
                    montoForPoints: 10,
                    pointsPerCompra: 5,
                },
                rewards: [
                    { id: 'rec-1', nombre: 'Gaseosa Personal Gratis', puntosRequeridos: 50, productoId: 'prod-601' },
                    { id: 'rec-2', nombre: 'Papas Fritas Personales Gratis', puntosRequeridos: 80, productoId: 'prod-502' },
                    { id: 'rec-3', nombre: 'S/.10 de Descuento', puntosRequeridos: 100 },
                ]
            }
        ];
    });


    useEffect(() => {
        localStorage.setItem('products', JSON.stringify(products));
    }, [products]);
    
     useEffect(() => {
        localStorage.setItem('promotions', JSON.stringify(promotions));
    }, [promotions]);
    
    useEffect(() => {
        localStorage.setItem('customers', JSON.stringify(customers));
    }, [customers]);
    
    useEffect(() => {
        localStorage.setItem('loyaltyPrograms', JSON.stringify(loyaltyPrograms));
    }, [loyaltyPrograms]);


    const [mesas, setMesas] = useState<Mesa[]>([]);
    const [view, setView] = useState<View>('dashboard');
    const [turno, setTurno] = useState<Turno>('tarde');
    const [posMesaActiva, setPosMesaActiva] = useState<Mesa | null>(null);

    const [appView, setAppView] = useState<AppView>('customer');
    const [loginError, setLoginError] = useState<string | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<UserRole>('cliente');
    const [toasts, setToasts] = useState<ToastType[]>([]);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark') return 'dark';
        if (typeof window !== 'undefined' && !('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        return 'light';
    });

    const [cajaSession, setCajaSession] = useState<CajaSession>(() => {
        const savedSession = localStorage.getItem('cajaSession');
        return savedSession ? JSON.parse(savedSession) : { estado: 'cerrada', saldoInicial: 0, ventasPorMetodo: {}, totalVentas: 0, totalEfectivoEsperado: 0, fechaApertura: '', gananciaTotal: 0, movimientos: [] };
    });

    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [orderForPreBill, setOrderForPreBill] = useState<Pedido | null>(null);
    const [orderToPay, setOrderToPay] = useState<Pedido | null>(null);
    const [orderForDeliveryPayment, setOrderForDeliveryPayment] = useState<Pedido | null>(null);
    const [orderForReceipt, setOrderForReceipt] = useState<Pedido | null>(null);

    useEffect(() => {
        localStorage.setItem('orders', JSON.stringify(orders));
        const updatedMesas = mesasDisponibles.map(n => {
            const activeOrder = orders.find(o => o.tipo === 'local' && o.cliente.mesa === n && !['cancelado', 'pagado'].includes(o.estado));
            return { numero: n, ocupada: !!activeOrder, pedidoId: activeOrder ? activeOrder.id : null, estadoPedido: activeOrder ? activeOrder.estado : undefined };
        });
        setMesas(updatedMesas);
    }, [orders]);
    
    useEffect(() => {
        localStorage.setItem('cajaSession', JSON.stringify(cajaSession));
    }, [cajaSession]);
    
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => { window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt); };
    }, []);

    const handleInstallClick = () => {
        if (installPrompt) { installPrompt.prompt(); setInstallPrompt(null); }
    };

    const toggleTheme = useCallback(() => setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light'), []);
    const toggleSidebar = useCallback(() => setIsSidebarCollapsed(prev => !prev), []);

    const showToast = useCallback((message: string, type: 'success' | 'info' | 'danger' = 'info') => {
        const id = Date.now();
        setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    const generateAndShowNotification = useCallback((order: Pedido) => {
        // ... (implementation unchanged)
    }, [showToast]);

    const updateOrderStatus = useCallback((orderId: string, newStatus: EstadoPedido, user: UserRole) => {
        const order = orders.find(o => o.id === orderId);
        if (order && order.estado !== newStatus) {
            const updatedOrderForNotification = { ...order, estado: newStatus };
            generateAndShowNotification(updatedOrderForNotification);
        }
        setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, estado: newStatus, historial: [...o.historial, { estado: newStatus, fecha: new Date().toISOString(), usuario: user }] } : o));
    }, [orders, generateAndShowNotification]);
    
    const assignDriver = useCallback((orderId: string, driverName: string) => {
        setOrders(prevOrders => prevOrders.map(order => order.id === orderId ? { ...order, repartidorAsignado: driverName } : order));
    }, []);
    
    const getAreaPreparacion = (tipo: Pedido['tipo']): AreaPreparacion => {
        switch (tipo) {
            case 'local': return 'salon';
            case 'delivery': return 'delivery';
            case 'retiro': return 'retiro';
            default: return 'delivery';
        }
    };
    
    const handleSaveOrder = (orderData: Omit<Pedido, 'id' | 'fecha' | 'turno' | 'historial' | 'areaPreparacion' | 'estado'>) => {
        const isPayNow = ['yape', 'plin'].includes(orderData.metodoPago);
        const isRiskyRetiro = orderData.tipo === 'retiro' && ['efectivo', 'tarjeta'].includes(orderData.metodoPago);
        let initialState: EstadoPedido = isPayNow ? 'pendiente confirmar pago' : isRiskyRetiro ? 'pendiente de confirmación' : 'en preparación';
        const newOrder: Pedido = { ...orderData, id: `PED-${String(Date.now()).slice(-4)}`, fecha: new Date().toISOString(), estado: initialState, turno: turno, historial: [{ estado: initialState, fecha: new Date().toISOString(), usuario: currentUserRole }], areaPreparacion: getAreaPreparacion(orderData.tipo) };
        setOrders(prevOrders => [newOrder, ...prevOrders]);
        let toastMessage = `Nuevo pedido ${newOrder.id} enviado a cocina.`;
        if (isPayNow) toastMessage = `Pedido ${newOrder.id} recibido. Esperando confirmación de pago.`;
        else if (isRiskyRetiro) toastMessage = `Pedido ${newOrder.id} pendiente de confirmación.`;
        showToast(toastMessage, 'success');
    };
    
    const handleSavePOSOrder = (orderData: Pedido, mesaNumero: number) => {
        const existingOrderIndex = orders.findIndex(o => o.id === orderData.id);
        if (existingOrderIndex > -1) {
            setOrders(currentOrders => currentOrders.map(o => o.id === orderData.id ? orderData : o));
            showToast(`Pedido ${orderData.id} actualizado y enviado a cocina.`, 'success');
        } else {
            const newOrder: Pedido = { ...orderData, id: `PED-${String(Date.now()).slice(-4)}`, fecha: new Date().toISOString(), turno: turno, historial: [{ estado: orderData.estado, fecha: new Date().toISOString(), usuario: 'admin' }] };
            setOrders(currentOrders => [newOrder, ...currentOrders]);
            setPosMesaActiva(prevMesa => (prevMesa && prevMesa.numero === mesaNumero) ? { ...prevMesa, ocupada: true, pedidoId: newOrder.id } : prevMesa);
            showToast(`Nuevo pedido ${newOrder.id} creado y enviado a cocina.`, 'success');
        }
    };

    const handleOpenCaja = (saldoInicial: number) => {
        const newSession: CajaSession = { estado: 'abierta', fechaApertura: new Date().toISOString(), saldoInicial, ventasPorMetodo: {}, totalVentas: 0, gananciaTotal: 0, totalEfectivoEsperado: saldoInicial, movimientos: [] };
        setCajaSession(newSession);
        showToast('Caja abierta con éxito.', 'success');
    };

    const handleCloseCaja = (efectivoContado: number) => {
        if (cajaSession.estado !== 'abierta') return;
        const diferencia = efectivoContado - cajaSession.totalEfectivoEsperado;
        const closedSession: CajaSession = { ...cajaSession, estado: 'cerrada', fechaCierre: new Date().toISOString(), efectivoContadoAlCierre: efectivoContado, diferencia };
        setCajaSession(closedSession);
        showToast(`Caja cerrada. ${diferencia === 0 ? 'Cuadre perfecto.' : (diferencia > 0 ? `Sobrante: S/.${diferencia.toFixed(2)}` : `Faltante: S/.${Math.abs(diferencia).toFixed(2)}`)}`, 'info');
    };
    
    const handleMovimientoCaja = (monto: number, descripcion: string, tipo: 'ingreso' | 'egreso') => {
        if (cajaSession.estado !== 'abierta') return;
        const newMovimiento: MovimientoCaja = { tipo, monto, descripcion, fecha: new Date().toISOString() };
        setCajaSession(prevSession => {
            const nuevosMovimientos = [...(prevSession.movimientos || []), newMovimiento];
            const totalIngresos = nuevosMovimientos.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
            const totalEgresos = nuevosMovimientos.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0);
            return { ...prevSession, movimientos: nuevosMovimientos, totalEfectivoEsperado: prevSession.saldoInicial + (prevSession.ventasPorMetodo.efectivo || 0) + totalIngresos - totalEgresos };
        });
        showToast(`Se ${tipo === 'ingreso' ? 'agregó' : 'retiró'} S/.${monto.toFixed(2)} de la caja.`, 'info');
    };

    const registrarVentaEnCaja = useCallback((order: Pedido) => {
        if (cajaSession.estado !== 'abierta' || !order.pagoRegistrado) return order;
        const { total: monto, pagoRegistrado: { metodo } } = order;
        const costoTotal = order.productos.reduce((acc, p) => acc + (products.find(pm => pm.id === p.id)?.costo || 0) * p.cantidad, 0);
        const ganancia = monto - costoTotal;

        setCajaSession(prev => {
            const newVentas = { ...prev.ventasPorMetodo, [metodo]: (prev.ventasPorMetodo[metodo] || 0) + monto };
            const totalIngresos = (prev.movimientos || []).filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
            const totalEgresos = (prev.movimientos || []).filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0);
            return { ...prev, ventasPorMetodo: newVentas, totalVentas: prev.totalVentas + monto, gananciaTotal: (prev.gananciaTotal || 0) + ganancia, totalEfectivoEsperado: prev.saldoInicial + (newVentas.efectivo || 0) + totalIngresos - totalEgresos };
        });

        // Decrement stock
        setProducts(prevProducts => {
            const updatedProducts = [...prevProducts];
            order.productos.forEach(p => {
                 if (p.isReward && !p.id.startsWith('recompensa-')) { // Only decrement stock for product-based rewards
                    const index = updatedProducts.findIndex(prod => prod.id === p.id);
                    if (index > -1) updatedProducts[index].stock = Math.max(0, updatedProducts[index].stock - p.cantidad);
                } else if (!p.isReward) { // Decrement for regular products
                    const index = updatedProducts.findIndex(prod => prod.id === p.id);
                    if (index > -1) updatedProducts[index].stock = Math.max(0, updatedProducts[index].stock - p.cantidad);
                }
            });
            return updatedProducts;
        });
        
        // Add/update customer loyalty points
        const customerPhone = order.cliente.telefono;
        const activeProgram = loyaltyPrograms.find(p => p.isActive);
        let pointsToAdd = 0;

        if (customerPhone && /^\d{9}$/.test(customerPhone) && activeProgram) {
            setCustomers(prevCustomers => {
                const existingCustomerIndex = prevCustomers.findIndex(c => c.telefono === customerPhone);
                
                const { config } = activeProgram;
                if (config.pointEarningMethod === 'monto') {
                    const safeMontoForPoints = config.montoForPoints > 0 ? config.montoForPoints : 1;
                    pointsToAdd = Math.floor(order.total / safeMontoForPoints) * (config.pointsPerMonto || 0);
                } else {
                    pointsToAdd = config.pointsPerCompra || 0;
                }

                if (existingCustomerIndex > -1) {
                    const updatedCustomers = [...prevCustomers];
                    const existingCustomer = {...updatedCustomers[existingCustomerIndex]};
                    existingCustomer.puntos += pointsToAdd;
                    existingCustomer.historialPedidos = [...existingCustomer.historialPedidos, order];
                    updatedCustomers[existingCustomerIndex] = existingCustomer;
                    return updatedCustomers;
                } else {
                    const newCustomer: ClienteLeal = {
                        telefono: customerPhone,
                        nombre: order.cliente.nombre,
                        puntos: pointsToAdd,
                        historialPedidos: [order],
                    };
                    return [...prevCustomers, newCustomer];
                }
            });
        }
        
        return { ...order, puntosGanados: pointsToAdd > 0 ? pointsToAdd : undefined };

    }, [cajaSession.estado, cajaSession.saldoInicial, cajaSession.movimientos, products, loyaltyPrograms]);

    const redeemReward = (customerId: string, reward: Recompensa) => {
        setCustomers(prevCustomers => {
            const customerIndex = prevCustomers.findIndex(c => c.telefono === customerId);
            if (customerIndex === -1) {
                showToast('Error: No se pudo encontrar al cliente para el canje.', 'danger');
                return prevCustomers;
            }
    
            const updatedCustomers = [...prevCustomers];
            const customer = { ...updatedCustomers[customerIndex] };
    
            if (customer.puntos < reward.puntosRequeridos) {
                showToast('Error: Puntos insuficientes para canjear.', 'danger');
                return prevCustomers;
            }
    
            customer.puntos -= reward.puntosRequeridos;
            updatedCustomers[customerIndex] = customer;
            
            showToast(`'${reward.nombre}' canjeado. Puntos restantes: ${customer.puntos}.`, 'success');
            return updatedCustomers;
        });
    };

    const handleGeneratePreBill = (orderId: string) => {
        const orderToBill = orders.find(o => o.id === orderId);
        if (orderToBill) {
            updateOrderStatus(orderToBill.id, 'cuenta solicitada', 'admin');
            setOrderForPreBill(orderToBill);
        }
    };
    const handleInitiatePayment = (order: Pedido) => setOrderToPay(order);
    const handleInitiateDeliveryPayment = (order: Pedido) => setOrderForDeliveryPayment(order);

    const handleConfirmPayment = (orderId: string, details: { metodo: MetodoPago; montoPagado?: number }) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        let vuelto = (details.metodo === 'efectivo' && details.montoPagado && details.montoPagado >= order.total) ? details.montoPagado - order.total : 0;
        let updatedOrder: Pedido = { ...order, estado: 'pagado', historial: [...order.historial, { estado: 'pagado', fecha: new Date().toISOString(), usuario: 'admin' }], pagoRegistrado: { metodo: details.metodo, montoTotal: order.total, montoPagado: details.montoPagado, vuelto, fecha: new Date().toISOString() } };
        updatedOrder = registrarVentaEnCaja(updatedOrder);
        setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
        generateAndShowNotification(updatedOrder);
        setOrderToPay(null);
        setOrderForReceipt(updatedOrder);
    };
    
    const handleConfirmDeliveryPayment = (orderId: string, details: { metodo: MetodoPago; montoPagado?: number }) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        let vuelto = (details.metodo === 'efectivo' && details.montoPagado && details.montoPagado >= order.total) ? details.montoPagado - order.total : 0;
        let updatedOrder: Pedido = { ...order, estado: 'pagado', historial: [...order.historial, { estado: 'pagado', fecha: new Date().toISOString(), usuario: 'repartidor' }], pagoRegistrado: { metodo: details.metodo, montoTotal: order.total, montoPagado: details.montoPagado, vuelto, fecha: new Date().toISOString() } };
        updatedOrder = registrarVentaEnCaja(updatedOrder);
        setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
        showToast(`Pedido ${orderId} entregado y pagado.`, 'success');
        setOrderForDeliveryPayment(null);
        setOrderForReceipt(updatedOrder);
    };

    const handleCloseReceipt = () => setOrderForReceipt(null);
    const handleSelectMesa = (mesa: Mesa) => setPosMesaActiva(mesa);
    const handleExitPOS = () => setPosMesaActiva(null);

    const handleLogin = (password: string) => {
        if (password === 'admin123') { setAppView('admin'); setCurrentUserRole('admin'); setLoginError(null); } 
        else { setLoginError('Contraseña incorrecta.'); }
    };

    const handleLogout = () => { setAppView('customer'); setCurrentUserRole('cliente'); };

    const handleAddNewCustomer = (telefono: string, nombre: string) => {
        if (customers.find(c => c.telefono === telefono)) {
            showToast(`El cliente con teléfono ${telefono} ya existe.`, 'danger');
            return;
        }
        const newCustomer: ClienteLeal = {
            telefono,
            nombre,
            puntos: 0,
            historialPedidos: [],
        };
        setCustomers(prev => [...prev, newCustomer]);
        showToast(`Nuevo cliente '${nombre}' registrado con éxito.`, 'success');
    };

    const filteredOrders = useMemo(() => orders.filter(order => order.turno === turno), [orders, turno]);
    const openOrders = useMemo(() => orders.filter(o => !['pagado', 'cancelado'].includes(o.estado)), [orders]);
    const retiroOrdersToPay = useMemo(() => openOrders.filter(o => o.tipo === 'retiro' && o.estado === 'listo' && ['efectivo', 'tarjeta'].includes(o.metodoPago)), [openOrders]);
    const paidOrdersInSession = useMemo(() => (cajaSession.estado !== 'abierta') ? [] : orders.filter(o => o?.estado === 'pagado' && o.pagoRegistrado && typeof o.pagoRegistrado.fecha === 'string' && !isNaN(new Date(o.pagoRegistrado.fecha).getTime()) && !isNaN(new Date(cajaSession.fechaApertura).getTime()) && new Date(o.pagoRegistrado.fecha) >= new Date(cajaSession.fechaApertura)), [orders, cajaSession.estado, cajaSession.fechaApertura]);

    const renderView = () => {
        switch (view) {
            case 'cocina': return <KitchenBoard orders={filteredOrders.filter(o => ['pendiente confirmar pago', 'en preparación', 'en armado', 'listo para armado'].includes(o.estado))} updateOrderStatus={updateOrderStatus} />;
            case 'delivery': return <DeliveryBoard orders={filteredOrders.filter(o => o.tipo === 'delivery' && ['listo', 'en camino', 'entregado', 'pagado'].includes(o.estado))} updateOrderStatus={updateOrderStatus} assignDriver={assignDriver} deliveryDrivers={deliveryDrivers} onInitiateDeliveryPayment={handleInitiateDeliveryPayment} />;
            case 'retiro': return <RetiroBoard orders={filteredOrders.filter(o => o.tipo === 'retiro' && ['pendiente confirmar pago', 'pendiente de confirmación', 'listo', 'recogido', 'pagado'].includes(o.estado))} updateOrderStatus={updateOrderStatus} />;
            case 'local': return <LocalBoard mesas={mesas} onSelectMesa={handleSelectMesa} />;
            case 'gestion': return <GestionView products={products} setProducts={setProducts} customers={customers} programs={loyaltyPrograms} setPrograms={setLoyaltyPrograms} promotions={promotions} setPromotions={setPromotions} />;
            case 'caja': return <CajaView orders={openOrders.filter(o => o.estado === 'cuenta solicitada')} retiroOrdersToPay={retiroOrdersToPay} paidOrders={paidOrdersInSession} onInitiatePayment={handleInitiatePayment} cajaSession={cajaSession} onOpenCaja={handleOpenCaja} onCloseCaja={handleCloseCaja} onAddMovimiento={handleMovimientoCaja} />;
            case 'dashboard': return <Dashboard orders={orders} products={products} />;
            default: return <Dashboard orders={orders} products={products} />;
        }
    };

    if (appView === 'customer') return <CustomerView products={products} onPlaceOrder={handleSaveOrder} onNavigateToAdmin={() => setAppView('login')} theme={theme} onToggleTheme={toggleTheme} installPrompt={installPrompt} onInstallClick={handleInstallClick} customers={customers} loyaltyPrograms={loyaltyPrograms} promotions={promotions} />;
    if (appView === 'login') return <Login onLogin={handleLogin} error={loginError} onNavigateToCustomerView={() => setAppView('customer')} theme={theme} />;
    
    if (posMesaActiva !== null) {
        const activeOrder = orders.find(o => o.id === posMesaActiva.pedidoId) || null;
        return (
            <>
                {orderForPreBill && <PreBillModal order={orderForPreBill} onClose={() => setOrderForPreBill(null)} theme={theme} />}
                {orderToPay && <PaymentModal order={orderToPay} onClose={() => setOrderToPay(null)} onConfirmPayment={handleConfirmPayment} />}
                {orderForReceipt && <ReceiptModal order={orderForReceipt} onClose={handleCloseReceipt} theme={theme} showToast={showToast} />}
                <POSView
                    mesa={posMesaActiva}
                    onExit={handleExitPOS}
                    order={activeOrder}
                    products={products}
                    onSaveOrder={handleSavePOSOrder}
                    onGeneratePreBill={handleGeneratePreBill}
                    updateOrderStatus={updateOrderStatus}
                    customers={customers}
                    loyaltyPrograms={loyaltyPrograms}
                    redeemReward={redeemReward}
                    promotions={promotions}
                    onAddNewCustomer={handleAddNewCustomer}
                />
                <div className="fixed top-4 right-4 z-[100] space-y-2 w-full max-w-sm">{toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />)}</div>
            </>
        );
    }

    return (
        <div className="min-h-screen flex bg-background dark:bg-slate-900">
            {orderForPreBill && <PreBillModal order={orderForPreBill} onClose={() => setOrderForPreBill(null)} theme={theme} />}
            {orderToPay && <PaymentModal order={orderToPay} onClose={() => setOrderToPay(null)} onConfirmPayment={handleConfirmPayment} />}
            {orderForDeliveryPayment && <DeliveryPaymentModal order={orderForDeliveryPayment} onClose={() => setOrderForDeliveryPayment(null)} onConfirmPayment={handleConfirmDeliveryPayment} />}
            {orderForReceipt && <ReceiptModal order={orderForReceipt} onClose={handleCloseReceipt} theme={theme} showToast={showToast} />}
            <Sidebar currentView={view} onNavigate={setView} onLogout={handleLogout} currentTheme={theme} isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
            <div className="flex-1 flex flex-col">
                <Header currentTurno={turno} onTurnoChange={setTurno} currentTheme={theme} onToggleTheme={toggleTheme} />
                <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto">
                    <div key={view} className="animate-fade-in-scale">{renderView()}</div>
                </main>
            </div>
            <div className="fixed top-4 right-4 z-[100] space-y-2 w-full max-w-sm">{toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />)}</div>
        </div>
    );
};

export default App;