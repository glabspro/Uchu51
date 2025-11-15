import React, { useEffect, useMemo, useCallback } from 'react';
import type { Pedido, Mesa, EstadoPedido, Recompensa, ClienteLeal } from './types';
import { useAppContext } from './store';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import KitchenBoard from './components/KitchenBoard';
import DeliveryBoard from './components/DeliveryBoard';
import LocalBoard from './components/LocalBoard';
import RetiroBoard from './components/RetiroBoard';
import Dashboard from './components/Dashboard';
import WaitingBoard from './components/WaitingBoard';
import POSView from './components/POSView';
import { CustomerView } from './components/CustomerView';
import Login from './Login';
import SuperAdminView from './components/SuperAdminView';
import Toast from './components/Toast';
import CajaView from './components/CajaView';
import PaymentModal from './components/PaymentModal';
import ReceiptModal from './components/ReceiptModal';
import PreBillModal from './components/PreBillModal';
import DeliveryPaymentModal from './components/DeliveryPaymentModal';
import GestionView from './components/GestionView';
import AssignCustomerModal from './components/AssignCustomerModal';
import { LogoIcon } from './components/LogoIcon';
import BottomNavBar from './components/BottomNavBar';

const hexToHsl = (hex: string): { h: number; s: number; l: number } | null => {
    if (!hex || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
      return null;
    }
    let r, g, b;
    hex = hex.substring(1);
    if (hex.length === 3) {
      r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
      g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
      b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
    } else {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }

    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
};

const App: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { 
        orders, 
        products, 
        promotions,
        customers,
        loyaltyPrograms,
        cajaSession,
        view, 
        turno, 
        theme, 
        appView, 
        loginError, 
        toasts, 
        posMesaActiva,
        orderForPreBill,
        orderToPay,
        orderForDeliveryPayment,
        orderForReceipt,
        installPrompt,
        mesaParaAsignarCliente,
        isLoading,
        criticalError,
        restaurantSettings,
    } = state;

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        const root = window.document.documentElement;
        const branding = restaurantSettings?.branding;

        const primary = hexToHsl(branding?.primaryColor || '#FF5B04');
        const secondary = hexToHsl(branding?.secondaryColor || '#F4D47C');
        const background = hexToHsl(branding?.backgroundColor || '#FDF6E3');

        if (primary) {
            root.style.setProperty('--color-primary-h', `${primary.h}`);
            root.style.setProperty('--color-primary-s', `${primary.s}%`);
            root.style.setProperty('--color-primary-l', `${primary.l}%`);
        }
        if (secondary) {
            root.style.setProperty('--color-secondary-h', `${secondary.h}`);
            root.style.setProperty('--color-secondary-s', `${secondary.s}%`);
            root.style.setProperty('--color-secondary-l', `${secondary.l}%`);
        }
        if (background) {
            root.style.setProperty('--color-background-h', `${background.h}`);
            root.style.setProperty('--color-background-s', `${background.s}%`);
            root.style.setProperty('--color-background-l', `${background.l}%`);
        }
    }, [restaurantSettings]);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            dispatch({ type: 'SET_INSTALL_PROMPT', payload: e });
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, [dispatch]);

    const mesas = useMemo<Mesa[]>(() => {
        const mesasDisponibles = restaurantSettings?.tables || [];
        return mesasDisponibles.map(n => {
            const activeOrder = orders.find(o => o.tipo === 'local' && o.cliente.mesa === n && !['cancelado', 'pagado'].includes(o.estado));
            return { numero: n, ocupada: !!activeOrder, pedidoId: activeOrder ? activeOrder.id : null, estadoPedido: activeOrder ? activeOrder.estado : undefined };
        });
    }, [orders, restaurantSettings]);

    const openOrders = useMemo(() => orders.filter(o => !['pagado', 'cancelado'].includes(o.estado)), [orders]);
    const retiroOrdersToPay = useMemo(() => openOrders.filter(o => o.tipo === 'retiro' && o.estado === 'listo' && ['efectivo', 'tarjeta'].includes(o.metodoPago)), [openOrders]);
    const paidOrdersInSession = useMemo(() => (cajaSession.estado !== 'abierta') ? [] : orders.filter(o => o?.estado === 'pagado' && o.pagoRegistrado && typeof o.pagoRegistrado.fecha === 'string' && !isNaN(new Date(o.pagoRegistrado.fecha).getTime()) && !isNaN(new Date(cajaSession.fechaApertura).getTime()) && new Date(o.pagoRegistrado.fecha) >= new Date(cajaSession.fechaApertura)), [orders, cajaSession.estado, cajaSession.fechaApertura]);

    const removeToast = useCallback((id: number) => {
        dispatch({ type: 'REMOVE_TOAST', payload: id });
    }, [dispatch]);

    const onExitPOS = useCallback(() => {
        dispatch({ type: 'SELECT_MESA', payload: { mesa: null } });
    }, [dispatch]);

    const onSavePOSOrder = useCallback((orderData: Pedido, mesaNumero: number) => {
        dispatch({ type: 'SAVE_POS_ORDER', payload: { orderData, mesaNumero } });
    }, [dispatch]);

    const onGeneratePreBill = useCallback((orderId: string) => {
        dispatch({ type: 'INITIATE_PREBILL', payload: orderId });
    }, [dispatch]);

    const updateOrderStatus = useCallback((orderId: string, newStatus: EstadoPedido) => {
        dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, newStatus, user: state.currentUserRole } });
    }, [dispatch, state.currentUserRole]);

    const redeemReward = useCallback((customerId: string, reward: Recompensa) => {
        dispatch({ type: 'REDEEM_REWARD', payload: { customerId, reward } });
    }, [dispatch]);

    const onAddNewCustomer = useCallback((telefono: string, nombre: string) => {
        dispatch({ type: 'ADD_NEW_CUSTOMER', payload: { telefono, nombre } });
    }, [dispatch]);

    const renderView = () => {
        const modules = restaurantSettings?.modules;
        switch (view) {
            case 'recepcion': return <WaitingBoard />;
            case 'cocina': return <KitchenBoard />;
            case 'delivery': return modules?.delivery !== false ? <DeliveryBoard /> : null;
            case 'retiro': return modules?.retiro !== false ? <RetiroBoard /> : null;
            case 'local': return modules?.local !== false ? <LocalBoard mesas={mesas} /> : null;
            case 'gestion': return <GestionView />;
            case 'caja': return <CajaView orders={openOrders.filter(o => o.estado === 'cuenta solicitada')} retiroOrdersToPay={retiroOrdersToPay} paidOrders={paidOrdersInSession} />;
            case 'dashboard': return <Dashboard orders={orders} products={products} />;
            default: return <WaitingBoard />;
        }
    };

    if (criticalError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gunmetal p-4 font-sans text-text-primary">
                <div className="bg-surface dark:bg-[#34424D] p-8 rounded-2xl shadow-2xl max-w-2xl w-full border border-danger/20">
                    <h1 className="text-2xl font-heading font-bold text-danger mb-4 text-center">Error Crítico de Conexión</h1>
                    <pre className="text-left bg-background dark:bg-[#45535D] p-4 rounded-lg whitespace-pre-wrap text-sm text-text-secondary dark:text-light-silver font-mono leading-relaxed">
                        {criticalError}
                    </pre>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gunmetal">
                <LogoIcon className="h-16 w-16 animate-pulse" />
            </div>
        );
    }
    
    if (appView === 'super_admin') return <SuperAdminView />;
    if (appView === 'customer') return <CustomerView />;
    if (appView === 'login') return <Login error={loginError} />;
    
    if (appView === 'admin') {
        if (posMesaActiva !== null) {
            const activeOrder = orders.find(o => o.id === posMesaActiva.pedidoId) || null;
            return (
                <>
                    {orderForPreBill && <PreBillModal order={orderForPreBill} />}
                    {orderToPay && <PaymentModal order={orderToPay} />}
                    {orderForReceipt && <ReceiptModal order={orderForReceipt} />}
                    <POSView
                        mesa={posMesaActiva}
                        order={activeOrder}
                        products={products}
                        customers={customers}
                        loyaltyPrograms={loyaltyPrograms}
                        promotions={promotions}
                        onExit={onExitPOS}
                        onSaveOrder={onSavePOSOrder}
                        onGeneratePreBill={onGeneratePreBill}
                        updateOrderStatus={updateOrderStatus}
                        redeemReward={redeemReward}
                        onAddNewCustomer={onAddNewCustomer}
                    />
                    <div className="fixed top-4 right-4 z-[100] space-y-2 w-full max-w-sm">{toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />)}</div>
                </>
            );
        }

        return (
            <div className="min-h-screen flex bg-background dark:bg-gunmetal">
                {orderForPreBill && <PreBillModal order={orderForPreBill} />}
                {orderToPay && <PaymentModal order={orderToPay} />}
                {orderForDeliveryPayment && <DeliveryPaymentModal order={orderForDeliveryPayment} />}
                {orderForReceipt && <ReceiptModal order={orderForReceipt} />}
                {mesaParaAsignarCliente && (
                    <AssignCustomerModal
                        customers={customers}
                        onAssign={(customer: ClienteLeal) => {
                            dispatch({ type: 'SELECT_MESA', payload: { mesa: mesaParaAsignarCliente, customer } });
                        }}
                        onClose={() => {
                            dispatch({ type: 'SELECT_MESA', payload: { mesa: mesaParaAsignarCliente, customer: null } });
                        }}
                        onAddNewCustomer={onAddNewCustomer}
                    />
                )}
                <Sidebar />
                <div className="flex-1 flex flex-col">
                    <Header />
                    <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto pb-20 md:pb-6 lg:p-8">
                        <div key={view} className="animate-fade-in-scale">{renderView()}</div>
                    </main>
                </div>
                <div className="fixed top-4 right-4 z-[100] space-y-2 w-full max-w-sm">{toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />)}</div>
                <BottomNavBar />
            </div>
        );
    }

    return <Login error={loginError} />; // Fallback
};

export default App;