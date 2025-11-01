

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initialOrders, initialProducts, deliveryDrivers, mesasDisponibles } from './constants';
import type { Pedido, EstadoPedido, Turno, UserRole, View, Toast as ToastType, AreaPreparacion, Producto, ProductoPedido, Mesa, MetodoPago, Theme, CajaSession, MovimientoCaja } from './types';
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

type AppView = 'customer' | 'login' | 'admin';

const App: React.FC = () => {
    const [orders, setOrders] = useState<Pedido[]>(() => {
        const savedOrders = localStorage.getItem('orders');
        if (!savedOrders) return initialOrders;

        try {
            const parsed = JSON.parse(savedOrders);
            // After parsing, ensure it's an array. If not, fallback.
            if (Array.isArray(parsed)) {
                // Filter out any potential null/undefined/non-object values in the array
                return parsed.filter(o => o && typeof o === 'object');
            }
            
            console.warn('Saved orders data is not an array. Falling back to initial data.');
            return initialOrders;
        } catch (e) {
            console.error("Failed to parse orders from localStorage. Falling back to initial data.", e);
            return initialOrders;
        }
    });
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
        if (typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark') {
            return 'dark';
        }
        if (typeof window !== 'undefined' && !('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    const [cajaSession, setCajaSession] = useState<CajaSession>(() => {
        const savedSession = localStorage.getItem('cajaSession');
        return savedSession ? JSON.parse(savedSession) : { estado: 'cerrada', saldoInicial: 0, ventasPorMetodo: {}, totalVentas: 0, totalEfectivoEsperado: 0, fechaApertura: '', gananciaTotal: 0, movimientos: [] };
    });

    // State for PWA installation prompt
    const [installPrompt, setInstallPrompt] = useState<any>(null);

    // State management for the payment and receipt flow
    const [orderForPreBill, setOrderForPreBill] = useState<Pedido | null>(null); // Order to display in the pre-bill modal
    const [orderToPay, setOrderToPay] = useState<Pedido | null>(null); // Order to process in the payment modal
    const [orderForDeliveryPayment, setOrderForDeliveryPayment] = useState<Pedido | null>(null); // Order for delivery payment
    const [orderForReceipt, setOrderForReceipt] = useState<Pedido | null>(null); // Order to display in the final receipt modal

    useEffect(() => {
        localStorage.setItem('orders', JSON.stringify(orders));
        const updatedMesas = mesasDisponibles.map(n => {
            const activeOrder = orders.find(o => o.tipo === 'local' && o.cliente.mesa === n && !['cancelado', 'pagado'].includes(o.estado));
            return {
                numero: n,
                ocupada: !!activeOrder,
                pedidoId: activeOrder ? activeOrder.id : null,
                estadoPedido: activeOrder ? activeOrder.estado : undefined,
            };
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
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = () => {
        if (installPrompt) {
            installPrompt.prompt();
            // The prompt can only be used once.
            setInstallPrompt(null);
        }
    };


    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    }, []);
    
    const toggleSidebar = useCallback(() => {
        setIsSidebarCollapsed(prev => !prev);
    }, []);

    const showToast = useCallback((message: string, type: 'success' | 'info' = 'info') => {
        const id = Date.now();
        setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    const generateAndShowNotification = useCallback((order: Pedido) => {
        let message = '';
        const { id, cliente, estado, tipo } = order;

        const messages: Partial<Record<EstadoPedido, string>> = {
            'confirmado': `Notificación enviada a ${cliente.nombre}: "Tu pedido ${id} ha sido confirmado."`,
            'en preparación': `Notificación enviada a ${cliente.nombre}: "¡Tu pedido ${id} ya se está preparando!"`,
            'listo': tipo === 'delivery'
                ? `Notificación enviada a ${cliente.nombre}: "¡Tu pedido ${id} está listo para ser enviado!"`
                : tipo === 'retiro' 
                    ? `Notificación enviada a ${cliente.nombre}: "¡Tu pedido ${id} está listo para que lo recojas!"`
                    : `Notificación para ${cliente.nombre} (Mesa ${cliente.mesa}): "¡Tu pedido ${id} está listo!"`,
            'en camino': `Notificación enviada a ${cliente.nombre}: "¡Tu pedido ${id} va en camino!"`,
            'entregado': tipo === 'local' 
                ? `Pedido ${id} servido en Mesa ${cliente.mesa}.`
                : `Notificación enviada a ${cliente.nombre}: "¡Tu pedido ${id} ha sido entregado! ¡Buen provecho!"`,
            'recogido': `Notificación enviada a ${cliente.nombre}: "¡Tu pedido ${id} ha sido recogido! Gracias."`,
            'cuenta solicitada': tipo === 'local' ? `La Mesa ${cliente.mesa} solicita la cuenta. Pedido ${id} listo para cobro en Caja.` : `Pedido ${id} listo para cobro.`,
            'pagado': tipo === 'local' ? `Mesa ${cliente.mesa} pagada y liberada.` : `Pedido ${id} pagado.`,
        };
        
        message = messages[estado] || '';

        if (message) {
            showToast(message, 'info');
        }
    }, [showToast]);

    const updateOrderStatus = useCallback((orderId: string, newStatus: EstadoPedido, user: UserRole) => {
        const order = orders.find(o => o.id === orderId);
        if (order && order.estado !== newStatus) {
            const updatedOrderForNotification = { ...order, estado: newStatus };
            generateAndShowNotification(updatedOrderForNotification);
        }

        setOrders(prevOrders =>
            prevOrders.map(o =>
                o.id === orderId
                    ? {
                        ...o,
                        estado: newStatus,
                        historial: [
                            ...o.historial,
                            { estado: newStatus, fecha: new Date().toISOString(), usuario: user }
                        ]
                    }
                    : o
            )
        );
    }, [orders, generateAndShowNotification]);
    
    const assignDriver = useCallback((orderId: string, driverName: string) => {
        setOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === orderId ? { ...order, repartidorAsignado: driverName } : order
            )
        );
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
        const isRiskyRetiro = orderData.tipo === 'retiro' && (orderData.metodoPago === 'efectivo' || orderData.metodoPago === 'tarjeta');

        let initialState: EstadoPedido;
        if (isPayNow) {
            initialState = 'pendiente confirmar pago';
        } else if (isRiskyRetiro) {
            initialState = 'pendiente de confirmación';
        } else {
            initialState = 'en preparación'; // Directo a cocina
        }

        const newOrder: Pedido = {
            ...orderData,
            id: `PED-${String(Date.now()).slice(-4)}`,
            fecha: new Date().toISOString(),
            estado: initialState,
            turno: turno,
            historial: [{ estado: initialState, fecha: new Date().toISOString(), usuario: currentUserRole }],
            areaPreparacion: getAreaPreparacion(orderData.tipo),
        };

        setOrders(prevOrders => [newOrder, ...prevOrders]);

        let toastMessage = `Nuevo pedido ${newOrder.id} enviado a cocina.`;
        if (isPayNow) {
            toastMessage = `Pedido ${newOrder.id} recibido. Esperando confirmación de pago.`;
        } else if (isRiskyRetiro) {
            toastMessage = `Pedido ${newOrder.id} pendiente de confirmación.`;
        }
        showToast(toastMessage, 'success');
    };
    
    const handleSavePOSOrder = (orderData: Pedido, mesaNumero: number) => {
        const existingOrderIndex = orders.findIndex(o => o.id === orderData.id);
        if (existingOrderIndex > -1) {
            setOrders(currentOrders => currentOrders.map(o => o.id === orderData.id ? orderData : o));
            showToast(`Pedido ${orderData.id} actualizado y enviado a cocina.`, 'success');
        } else {
            const newOrder: Pedido = {
                ...orderData,
                id: `PED-${String(Date.now()).slice(-4)}`,
                fecha: new Date().toISOString(),
                turno: turno,
                historial: [{ estado: orderData.estado, fecha: new Date().toISOString(), usuario: 'admin' }],
            };
            setOrders(currentOrders => [newOrder, ...currentOrders]);
            
            // FIX: Update the active table with the new order ID to keep POS view in sync
            setPosMesaActiva(prevMesa => {
                if (prevMesa && prevMesa.numero === mesaNumero) {
                    return { ...prevMesa, ocupada: true, pedidoId: newOrder.id };
                }
                return prevMesa;
            });
    
            showToast(`Nuevo pedido ${newOrder.id} creado y enviado a cocina.`, 'success');
        }
    };

    // --- Caja Session Handlers ---
    const handleOpenCaja = (saldoInicial: number) => {
        const newSession: CajaSession = {
            estado: 'abierta',
            fechaApertura: new Date().toISOString(),
            saldoInicial: saldoInicial,
            ventasPorMetodo: {},
            totalVentas: 0,
            gananciaTotal: 0,
            totalEfectivoEsperado: saldoInicial,
            movimientos: [],
        };
        setCajaSession(newSession);
        showToast('Caja abierta con éxito.', 'success');
    };

    const handleCloseCaja = (efectivoContado: number) => {
        if (cajaSession.estado !== 'abierta') return;
        const diferencia = efectivoContado - cajaSession.totalEfectivoEsperado;
        const closedSession: CajaSession = {
            ...cajaSession,
            estado: 'cerrada',
            fechaCierre: new Date().toISOString(),
            efectivoContadoAlCierre: efectivoContado,
            diferencia: diferencia,
        };
        setCajaSession(closedSession);
        showToast(`Caja cerrada. ${diferencia === 0 ? 'Cuadre perfecto.' : (diferencia > 0 ? `Sobrante: S/.${diferencia.toFixed(2)}` : `Faltante: S/.${Math.abs(diferencia).toFixed(2)}`)}`, 'info');
    };
    
    const handleMovimientoCaja = (monto: number, descripcion: string, tipo: 'ingreso' | 'egreso') => {
        if (cajaSession.estado !== 'abierta') return;

        const newMovimiento: MovimientoCaja = {
            tipo,
            monto,
            descripcion,
            fecha: new Date().toISOString(),
        };

        setCajaSession(prevSession => {
            const nuevosMovimientos = [...(prevSession.movimientos || []), newMovimiento];
            const totalIngresos = nuevosMovimientos.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
            const totalEgresos = nuevosMovimientos.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0);
            const nuevoTotalEfectivoEsperado = prevSession.saldoInicial + (prevSession.ventasPorMetodo.efectivo || 0) + totalIngresos - totalEgresos;

            return {
                ...prevSession,
                movimientos: nuevosMovimientos,
                totalEfectivoEsperado: nuevoTotalEfectivoEsperado,
            };
        });
        showToast(`Se ${tipo === 'ingreso' ? 'agregó' : 'retiró'} S/.${monto.toFixed(2)} de la caja.`, 'info');
    };

    const registrarVentaEnCaja = useCallback((order: Pedido) => {
        if (cajaSession.estado !== 'abierta' || !order.pagoRegistrado) return;

        const { total: monto, pagoRegistrado: { metodo } } = order;

        const costoTotal = order.productos.reduce((acc, productoPedido) => {
            const productoMaestro = initialProducts.find(p => p.id === productoPedido.id);
            return acc + (productoMaestro ? productoMaestro.costo * productoPedido.cantidad : 0);
        }, 0);

        const ganancia = monto - costoTotal;

        setCajaSession(prevSession => {
            const newVentasPorMetodo = { ...prevSession.ventasPorMetodo };
            newVentasPorMetodo[metodo] = (newVentasPorMetodo[metodo] || 0) + monto;

            const newTotalVentas = prevSession.totalVentas + monto;
            const newGananciaTotal = (prevSession.gananciaTotal || 0) + ganancia;
            
            const totalIngresos = (prevSession.movimientos || []).filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
            const totalEgresos = (prevSession.movimientos || []).filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0);
            const newTotalEfectivo = prevSession.saldoInicial + (newVentasPorMetodo.efectivo || 0) + totalIngresos - totalEgresos;

            return {
                ...prevSession,
                ventasPorMetodo: newVentasPorMetodo,
                totalVentas: newTotalVentas,
                gananciaTotal: newGananciaTotal,
                totalEfectivoEsperado: newTotalEfectivo
            };
        });
    }, [cajaSession.estado, cajaSession.saldoInicial, cajaSession.movimientos]);


    // --- Payment Flow Handlers ---
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
        
        let vuelto = 0;
        if (details.metodo === 'efectivo' && details.montoPagado && details.montoPagado >= order.total) {
            vuelto = details.montoPagado - order.total;
        }

        const updatedOrder: Pedido = {
            ...order,
            estado: 'pagado',
            historial: [...order.historial, { estado: 'pagado', fecha: new Date().toISOString(), usuario: 'admin' }],
            pagoRegistrado: {
                metodo: details.metodo,
                montoTotal: order.total,
                montoPagado: details.montoPagado,
                vuelto: vuelto,
                fecha: new Date().toISOString(),
            },
        };

        registrarVentaEnCaja(updatedOrder);

        setOrders(prevOrders => prevOrders.map(o => (o.id === orderId ? updatedOrder : o)));
        generateAndShowNotification(updatedOrder);
        setOrderToPay(null);
        setOrderForReceipt(updatedOrder);
    };
    
    const handleConfirmDeliveryPayment = (orderId: string, details: { metodo: MetodoPago; montoPagado?: number }) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        let vuelto = 0;
        if (details.metodo === 'efectivo' && details.montoPagado && details.montoPagado >= order.total) {
            vuelto = details.montoPagado - order.total;
        }

        const updatedOrder: Pedido = {
            ...order,
            estado: 'pagado',
            historial: [...order.historial, { estado: 'pagado', fecha: new Date().toISOString(), usuario: 'repartidor' }],
            pagoRegistrado: {
                metodo: details.metodo,
                montoTotal: order.total,
                montoPagado: details.montoPagado,
                vuelto: vuelto,
                fecha: new Date().toISOString(),
            },
        };
        
        registrarVentaEnCaja(updatedOrder);

        setOrders(prevOrders => prevOrders.map(o => (o.id === orderId ? updatedOrder : o)));
        showToast(`Pedido ${orderId} entregado y pagado.`, 'success');
        setOrderForDeliveryPayment(null);
    };

    const handleCloseReceipt = () => setOrderForReceipt(null);

    const handleSelectMesa = (mesa: Mesa) => setPosMesaActiva(mesa);
    const handleExitPOS = () => setPosMesaActiva(null);

    const handleLogin = (password: string) => {
        if (password === 'admin123') {
            setAppView('admin');
            setCurrentUserRole('admin');
            setLoginError(null);
        } else {
            setLoginError('Contraseña incorrecta.');
        }
    };

    const handleLogout = () => {
        setAppView('customer');
        setCurrentUserRole('cliente');
    };

    const filteredOrders = useMemo(() => orders.filter(order => order.turno === turno), [orders, turno]);
    const openOrders = useMemo(() => orders.filter(o => !['pagado', 'cancelado'].includes(o.estado)), [orders]);
    const retiroOrdersToPay = useMemo(() => openOrders.filter(o => o.tipo === 'retiro' && o.estado === 'listo' && ['efectivo', 'tarjeta'].includes(o.metodoPago)), [openOrders]);

    const paidOrdersInSession = useMemo(() => {
        if (cajaSession.estado !== 'abierta') return [];
        return orders.filter(o => 
            o && // Ensure order object exists
            o.estado === 'pagado' &&
            o.pagoRegistrado &&
            typeof o.pagoRegistrado.fecha === 'string' &&
            !isNaN(new Date(o.pagoRegistrado.fecha).getTime()) &&
            !isNaN(new Date(cajaSession.fechaApertura).getTime()) &&
            new Date(o.pagoRegistrado.fecha) >= new Date(cajaSession.fechaApertura)
        );
    }, [orders, cajaSession.estado, cajaSession.fechaApertura]);

    const renderView = () => {
        switch (view) {
            case 'cocina':
                return <KitchenBoard orders={filteredOrders.filter(o => ['pendiente confirmar pago', 'en preparación', 'en armado', 'listo para armado'].includes(o.estado))} updateOrderStatus={updateOrderStatus} />;
            case 'delivery':
                return <DeliveryBoard orders={filteredOrders.filter(o => o.tipo === 'delivery' && ['listo', 'en camino', 'entregado', 'pagado'].includes(o.estado))} updateOrderStatus={updateOrderStatus} assignDriver={assignDriver} deliveryDrivers={deliveryDrivers} onInitiateDeliveryPayment={handleInitiateDeliveryPayment} />;
            case 'retiro':
                return <RetiroBoard orders={filteredOrders.filter(o => o.tipo === 'retiro' && ['pendiente confirmar pago', 'pendiente de confirmación', 'listo', 'recogido', 'pagado'].includes(o.estado))} updateOrderStatus={updateOrderStatus} />;
            case 'local':
                return <LocalBoard mesas={mesas} onSelectMesa={handleSelectMesa} />;
            case 'caja':
                return <CajaView orders={openOrders.filter(o => o.estado === 'cuenta solicitada')} retiroOrdersToPay={retiroOrdersToPay} paidOrders={paidOrdersInSession} onInitiatePayment={handleInitiatePayment} cajaSession={cajaSession} onOpenCaja={handleOpenCaja} onCloseCaja={handleCloseCaja} onAddMovimiento={handleMovimientoCaja} />;
            case 'dashboard':
                return <Dashboard orders={orders} />;
            default:
                return <Dashboard orders={orders} />;
        }
    };

    if (appView === 'customer') {
        return <CustomerView products={initialProducts} onPlaceOrder={handleSaveOrder} onNavigateToAdmin={() => setAppView('login')} theme={theme} onToggleTheme={toggleTheme} installPrompt={installPrompt} onInstallClick={handleInstallClick} />;
    }
    
    if (appView === 'login') {
        return <Login onLogin={handleLogin} error={loginError} onNavigateToCustomerView={() => setAppView('customer')} theme={theme} />;
    }
    
    if (posMesaActiva !== null) {
        const activeOrder = orders.find(o => o.id === posMesaActiva.pedidoId) || null;
        return (
            <>
                {orderForPreBill && <PreBillModal order={orderForPreBill} onClose={() => setOrderForPreBill(null)} theme={theme} />}
                {orderToPay && <PaymentModal order={orderToPay} onClose={() => setOrderToPay(null)} onConfirmPayment={handleConfirmPayment} />}
                {orderForReceipt && <ReceiptModal order={orderForReceipt} onClose={handleCloseReceipt} theme={theme} />}
                <POSView
                    mesa={posMesaActiva}
                    onExit={handleExitPOS}
                    order={activeOrder}
                    products={initialProducts}
                    onSaveOrder={handleSavePOSOrder}
                    onGeneratePreBill={handleGeneratePreBill}
                    updateOrderStatus={updateOrderStatus}
                 />
                 <div className="fixed top-4 right-4 z-[100] space-y-2 w-full max-w-sm">
                    {toasts.map(toast => (
                        <Toast
                            key={toast.id}
                            message={toast.message}
                            type={toast.type}
                            onClose={() => removeToast(toast.id)}
                        />
                    ))}
                </div>
            </>
        );
    }

    return (
        <div className="min-h-screen flex bg-background dark:bg-slate-900">
            {orderForPreBill && <PreBillModal order={orderForPreBill} onClose={() => setOrderForPreBill(null)} theme={theme} />}
            {orderToPay && <PaymentModal order={orderToPay} onClose={() => setOrderToPay(null)} onConfirmPayment={handleConfirmPayment} />}
            {orderForDeliveryPayment && <DeliveryPaymentModal order={orderForDeliveryPayment} onClose={() => setOrderForDeliveryPayment(null)} onConfirmPayment={handleConfirmDeliveryPayment} />}
            {orderForReceipt && <ReceiptModal order={orderForReceipt} onClose={handleCloseReceipt} theme={theme} />}
            
            <Sidebar 
                 currentView={view}
                 onNavigate={setView}
                 onLogout={handleLogout}
                 currentTheme={theme}
                 isCollapsed={isSidebarCollapsed}
                 onToggle={toggleSidebar}
            />
            
            <div className="flex-1 flex flex-col">
                <Header
                    currentTurno={turno}
                    onTurnoChange={setTurno}
                    currentTheme={theme}
                    onToggleTheme={toggleTheme}
                />
                <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto">
                    <div key={view} className="animate-fade-in-scale">
                        {renderView()}
                    </div>
                </main>
            </div>
             <div className="fixed top-4 right-4 z-[100] space-y-2 w-full max-w-sm">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default App;