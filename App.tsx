
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initialOrders, initialProducts, cooks, deliveryDrivers, mesasDisponibles } from './constants';
import type { Pedido, EstadoPedido, Turno, UserRole, View, Toast as ToastType, AreaPreparacion, Producto, ProductoPedido, Mesa, MetodoPago } from './types';
import Header from './components/Header';
import WaitingBoard from './components/WaitingBoard';
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

type AppView = 'customer' | 'login' | 'admin';

const App: React.FC = () => {
    const [orders, setOrders] = useState<Pedido[]>(() => {
        const savedOrders = localStorage.getItem('orders');
        return savedOrders ? JSON.parse(savedOrders) : initialOrders;
    });
    const [mesas, setMesas] = useState<Mesa[]>([]);
    const [view, setView] = useState<View>('local');
    const [turno, setTurno] = useState<Turno>('tarde');
    const [posMesaActiva, setPosMesaActiva] = useState<Mesa | null>(null);

    const [appView, setAppView] = useState<AppView>('customer');
    const [loginError, setLoginError] = useState<string | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<UserRole>('cliente');
    const [toasts, setToasts] = useState<ToastType[]>([]);

    // State management for the payment and receipt flow
    const [orderForPreBill, setOrderForPreBill] = useState<Pedido | null>(null); // Order to display in the pre-bill modal
    const [orderToPay, setOrderToPay] = useState<Pedido | null>(null); // Order to process in the payment modal
    const [orderForReceipt, setOrderForReceipt] = useState<Pedido | null>(null); // Order to display in the final receipt modal

    useEffect(() => {
        localStorage.setItem('orders', JSON.stringify(orders));
        const updatedMesas = mesasDisponibles.map(n => {
            const activeOrder = orders.find(o => o.tipo === 'local' && o.cliente.mesa === n && !['entregado', 'recogido', 'cancelado', 'pagado'].includes(o.estado));
            return {
                numero: n,
                ocupada: !!activeOrder,
                pedidoId: activeOrder ? activeOrder.id : null,
            };
        });
        setMesas(updatedMesas);
    }, [orders]);
    
    useEffect(() => {
        document.body.className = appView === 'admin' ? 'bg-background text-text-primary antialiased' : 'bg-surface text-text-primary antialiased';
    }, [appView]);

    useEffect(() => {
        const interval = setInterval(() => {
            setOrders(prevOrders => 
                prevOrders.map(order => ({
                    ...order,
                    tiempoTranscurrido: Math.floor((new Date().getTime() - new Date(order.fecha).getTime()) / 1000)
                }))
            );
        }, 1000);
        return () => clearInterval(interval);
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
            'entregado': `Notificación enviada a ${cliente.nombre}: "¡Tu pedido ${id} ha sido entregado! ¡Buen provecho!"`,
            'recogido': `Notificación enviada a ${cliente.nombre}: "¡Tu pedido ${id} ha sido recogido! Gracias."`,
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

    const assignCook = useCallback((orderId: string, cookName: string) => {
        setOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === orderId ? { ...order, cocineroAsignado: cookName } : order
            )
        );
    }, []);
    
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
    
    const handleSaveOrder = (orderData: Omit<Pedido, 'id' | 'fecha' | 'turno' | 'historial' | 'tiempoTranscurrido' | 'areaPreparacion' | 'estado'>) => {
        
        const isRiskyRetiro = orderData.tipo === 'retiro' && (orderData.metodoPago === 'efectivo' || orderData.metodoPago === 'tarjeta');
        const initialState: EstadoPedido = isRiskyRetiro ? 'pendiente de confirmación' : 'nuevo';

        const newOrder: Pedido = {
            ...orderData,
            id: `PED-${String(Date.now()).slice(-4)}`,
            fecha: new Date().toISOString(),
            estado: initialState,
            turno: turno,
            historial: [{ estado: initialState, fecha: new Date().toISOString(), usuario: currentUserRole }],
            tiempoTranscurrido: 0,
            areaPreparacion: getAreaPreparacion(orderData.tipo),
        };
        setOrders(prevOrders => [newOrder, ...prevOrders]);
        showToast(isRiskyRetiro ? `Pedido ${newOrder.id} pendiente de confirmación.` : `Nuevo pedido ${newOrder.id} recibido.`, 'success');
    };
    
    const handleSavePOSOrder = (orderData: Pedido) => {
        const existingOrderIndex = orders.findIndex(o => o.id === orderData.id);
        if (existingOrderIndex > -1) {
            setOrders(currentOrders => currentOrders.map(o => o.id === orderData.id ? orderData : o));
            showToast(`Pedido ${orderData.id} actualizado y enviado a cocina.`, 'success');
        } else {
            // FIX: Explicitly type `newOrder` as `Pedido` to prevent type inference issues with `historial.usuario`.
            const newOrder: Pedido = {
                ...orderData,
                id: `PED-${String(Date.now()).slice(-4)}`,
                fecha: new Date().toISOString(),
                turno: turno,
                historial: [{ estado: orderData.estado, fecha: new Date().toISOString(), usuario: 'admin' }],
                tiempoTranscurrido: 0,
            };
            setOrders(currentOrders => [newOrder, ...currentOrders]);
            showToast(`Nuevo pedido ${newOrder.id} creado y enviado a cocina.`, 'success');
        }
    };

    // --- Payment Flow Handlers ---
    const handleGeneratePreBill = (order: Pedido) => setOrderForPreBill(order);
    const handleInitiatePayment = (order: Pedido) => setOrderToPay(order);

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

        setOrders(prevOrders => prevOrders.map(o => (o.id === orderId ? updatedOrder : o)));
        generateAndShowNotification(updatedOrder);
        setOrderToPay(null);
        setOrderForReceipt(updatedOrder);
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
    const openOrders = useMemo(() => orders.filter(o => !['pagado', 'cancelado', 'entregado', 'recogido'].includes(o.estado)), [orders]);

    const renderView = () => {
        switch (view) {
            case 'espera':
                return <WaitingBoard orders={filteredOrders} updateOrderStatus={updateOrderStatus} />;
            case 'cocina':
                return <KitchenBoard orders={filteredOrders.filter(o => ['en preparación', 'en armado', 'listo para armado'].includes(o.estado))} updateOrderStatus={updateOrderStatus} assignCook={assignCook} cooks={cooks} />;
            case 'delivery':
                return <DeliveryBoard orders={filteredOrders.filter(o => o.tipo === 'delivery' && ['listo', 'en camino', 'entregado'].includes(o.estado))} updateOrderStatus={updateOrderStatus} assignDriver={assignDriver} deliveryDrivers={deliveryDrivers} />;
            case 'retiro':
                return <RetiroBoard orders={filteredOrders.filter(o => o.tipo === 'retiro' && ['listo', 'recogido'].includes(o.estado))} updateOrderStatus={updateOrderStatus} />;
            case 'local':
                return <LocalBoard mesas={mesas} onSelectMesa={handleSelectMesa} />;
            case 'caja':
                return <CajaView orders={openOrders} onInitiatePayment={handleInitiatePayment} onGeneratePreBill={handleGeneratePreBill} />;
            case 'dashboard':
                return <Dashboard orders={filteredOrders} />;
            default:
                return <WaitingBoard orders={filteredOrders} updateOrderStatus={updateOrderStatus} />;
        }
    };

    if (appView === 'customer') {
        return <CustomerView products={initialProducts} onPlaceOrder={handleSaveOrder} onNavigateToAdmin={() => setAppView('login')} />;
    }
    
    if (appView === 'login') {
        return <Login onLogin={handleLogin} error={loginError} onNavigateToCustomerView={() => setAppView('customer')} />;
    }
    
    if (posMesaActiva !== null) {
        const activeOrder = orders.find(o => o.id === posMesaActiva.pedidoId) || null;
        return <POSView
            mesa={posMesaActiva}
            onExit={handleExitPOS}
            order={activeOrder}
            products={initialProducts}
            onSaveOrder={handleSavePOSOrder}
            onInitiatePayment={handleInitiatePayment}
            onGeneratePreBill={handleGeneratePreBill}
         />;
    }

    return (
        <div className="min-h-screen flex flex-col">
            {orderForPreBill && <PreBillModal order={orderForPreBill} onClose={() => setOrderForPreBill(null)} />}
            {orderToPay && <PaymentModal order={orderToPay} onClose={() => setOrderToPay(null)} onConfirmPayment={handleConfirmPayment} />}
            {orderForReceipt && <ReceiptModal order={orderForReceipt} onClose={handleCloseReceipt} />}
            <Header
                currentView={view}
                onNavigate={setView}
                currentTurno={turno}
                onTurnoChange={setTurno}
                onLogout={handleLogout}
            />
            <main className="flex-grow p-4 md:p-6 lg:p-8">
                {renderView()}
            </main>
             <div className="fixed top-20 right-4 z-[100] space-y-2 w-full max-w-sm">
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