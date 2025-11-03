import React, { useState, useMemo, useEffect } from 'react';
import type { Pedido, Producto, ProductoPedido, Mesa, Salsa, EstadoPedido, UserRole, ClienteLeal, Recompensa, LoyaltyProgram, Promocion } from '../types';
import { ChevronLeftIcon, TrashIcon, MinusIcon, PlusIcon, CheckCircleIcon, UserIcon, StarIcon, SparklesIcon } from './icons';
import SauceModal from './SauceModal';
import AssignCustomerModal from './AssignCustomerModal';
import RedeemRewardModal from './RedeemRewardModal';
import ApplyPromotionModal from './ApplyPromotionModal';

interface POSViewProps {
    mesa: Mesa;
    order: Pedido | null;
    products: Producto[];
    promotions: Promocion[];
    onExit: () => void;
    onSaveOrder: (order: Pedido, mesaNumero: number) => void;
    onGeneratePreBill: (orderId: string) => void;
    updateOrderStatus: (orderId: string, newStatus: EstadoPedido, user: UserRole) => void;
    customers: ClienteLeal[];
    loyaltyPrograms: LoyaltyProgram[];
    redeemReward: (customerId: string, reward: Recompensa) => void;
    onAddNewCustomer: (telefono: string, nombre: string) => void;
}

const getStatusAppearance = (status: Pedido['estado']) => {
    switch (status) {
        case 'nuevo': return { color: 'bg-gray-500', label: 'Nuevo' };
        case 'confirmado': return { color: 'bg-primary', label: 'Confirmado' };
        case 'en preparación': return { color: 'bg-amber-500', label: 'En Preparación' };
        case 'en armado': return { color: 'bg-yellow-400', label: 'En Armado' };
        case 'listo': return { color: 'bg-green-500', label: 'Listo para Servir' };
        case 'entregado': return { color: 'bg-emerald-600', label: 'Servido en Mesa' };
        case 'cuenta solicitada': return { color: 'bg-blue-500', label: 'Cuenta Solicitada' };
        default: return { color: 'bg-slate-400', label: status };
    }
};

const POSView: React.FC<POSViewProps> = ({ mesa, order, products, promotions, onExit, onSaveOrder, onGeneratePreBill, updateOrderStatus, customers, loyaltyPrograms, redeemReward, onAddNewCustomer }) => {
    const [activeCategory, setActiveCategory] = useState('Hamburguesas');
    const [selectedItem, setSelectedItem] = useState<ProductoPedido | null>(null);
    const [currentOrder, setCurrentOrder] = useState<Pedido | null>(order);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [isSauceModalOpen, setIsSauceModalOpen] = useState(false);
    const [productForSauces, setProductForSauces] = useState<Producto | null>(null);

    const [isAssignCustomerModalOpen, setIsAssignCustomerModalOpen] = useState(false);
    const [isRedeemRewardModalOpen, setIsRedeemRewardModalOpen] = useState(false);
    const [isApplyPromotionModalOpen, setIsApplyPromotionModalOpen] = useState(false);
    const [assignedCustomer, setAssignedCustomer] = useState<ClienteLeal | null>(null);
    
    useEffect(() => {
        setCurrentOrder(order);
        if (order?.cliente.telefono) {
            const customer = customers.find(c => c.telefono === order.cliente.telefono);
            if(customer) setAssignedCustomer(customer);
        } else {
            setAssignedCustomer(null);
        }
        setIsSubmitting(false);
    }, [order, customers]);

    const hasUnsavedChanges = useMemo(() => {
        if (!currentOrder) return false;

        // 1. Check for new products that haven't been sent to kitchen
        if (currentOrder.productos.some(p => !p.sentToKitchen)) {
            return true;
        }

        // This is a brand new order (no original `order` prop)
        if (!order) {
            // If it has products or an assigned customer, it's an unsaved change
            return currentOrder.productos.length > 0 || !!currentOrder.cliente.telefono;
        }

        // An existing order has been modified
        // Customer was added, removed, or changed. Check both phone and name for robustness.
        if (order.cliente.telefono !== currentOrder.cliente.telefono || order.cliente.nombre !== currentOrder.cliente.nombre) {
            return true;
        }

        return false;
    }, [currentOrder, order]);
    
    const groupedProducts = useMemo(() => {
        return products.reduce((acc, product) => {
            const category = product.categoria;
            if (!acc[category]) acc[category] = [];
            acc[category].push(product);
            return acc;
        }, {} as Record<string, Producto[]>);
    }, [products]);

    const categories = useMemo(() => Object.keys(groupedProducts), [groupedProducts]);
    const activeProgram = useMemo(() => loyaltyPrograms.find(p => p.isActive), [loyaltyPrograms]);
    
    const calculateTotal = (productos: ProductoPedido[]): number => {
        return productos.reduce((sum, p) => {
            const itemPrice = p.precio;
            const saucesTotal = (p.salsas || []).reduce((sauceSum, sauce) => sauceSum + sauce.precio, 0);
            return sum + (itemPrice + saucesTotal) * p.cantidad;
        }, 0);
    };

    const updateCurrentOrder = (updatedProductos: ProductoPedido[]) => {
        const newTotal = calculateTotal(updatedProductos);

        if (currentOrder) {
            setCurrentOrder({ ...currentOrder, productos: updatedProductos, total: newTotal });
        } else {
             const newOrderShell: Pedido = {
                id: '',
                fecha: new Date().toISOString(),
                tipo: 'local',
                estado: 'nuevo',
                turno: 'tarde',
                cliente: {
                    nombre: assignedCustomer?.nombre || `Mesa ${mesa.numero}`,
                    telefono: assignedCustomer?.telefono || '',
                    mesa: mesa.numero
                },
                productos: updatedProductos,
                total: newTotal,
                metodoPago: 'efectivo',
                tiempoEstimado: 15,
                historial: [],
                areaPreparacion: 'salon',
             };
             setCurrentOrder(newOrderShell);
        }
    };
    
    const handleAddToCartWithSauces = (salsas: Salsa[]) => {
        if (!productForSauces) return;

        const getSauceKey = (salsaList: Salsa[] = []) => salsaList.map(s => s.nombre).sort().join(',');
        const newSauceKey = getSauceKey(salsas);
        const productos = currentOrder?.productos || [];

        const existingItemIndex = productos.findIndex(item => item.id === productForSauces.id && getSauceKey(item.salsas) === newSauceKey);

        let updatedProductos;
        if (existingItemIndex > -1) {
            updatedProductos = productos.map((item, index) => index === existingItemIndex ? { ...item, cantidad: item.cantidad + 1, sentToKitchen: false } : item);
        } else {
            const newItem: ProductoPedido = {
                id: productForSauces.id,
                nombre: productForSauces.nombre,
                cantidad: 1,
                precio: productForSauces.precio,
                imagenUrl: productForSauces.imagenUrl,
                salsas: salsas,
                sentToKitchen: false,
            };
            updatedProductos = [...productos, newItem];
        }

        updateCurrentOrder(updatedProductos);
        setIsSauceModalOpen(false);
        setProductForSauces(null);
    };

    const handleProductClick = (product: Producto) => {
        if (product.stock <= 0) return;

        if (['Bebidas', 'Postres'].includes(product.categoria)) {
            const newItem: ProductoPedido = {
                id: product.id,
                nombre: product.nombre,
                cantidad: 1,
                precio: product.precio,
                imagenUrl: product.imagenUrl,
                salsas: [],
                sentToKitchen: false,
            };
            const existingItem = (currentOrder?.productos || []).find(p => p.id === newItem.id && (!p.salsas || p.salsas.length === 0));
            if (existingItem) {
                handleQuantityChange(existingItem, 1);
            } else {
                updateCurrentOrder([...(currentOrder?.productos || []), newItem]);
            }
        } else {
            setProductForSauces(product);
            setIsSauceModalOpen(true);
        }
    };

    const handleQuantityChange = (itemToUpdate: ProductoPedido, change: number) => {
        if (!currentOrder) return;
        const newQuantity = itemToUpdate.cantidad + change;
        let updatedProductos;

        if (newQuantity <= 0) {
            updatedProductos = currentOrder.productos.filter(p => p !== itemToUpdate);
        } else {
            updatedProductos = currentOrder.productos.map(p => p === itemToUpdate ? { ...p, cantidad: newQuantity, sentToKitchen: false } : p);
        }
        updateCurrentOrder(updatedProductos);
    };
    
    const handleSendToKitchen = () => {
        if(isSubmitting || !currentOrder || currentOrder.productos.length === 0) {
            return;
        }
        setIsSubmitting(true);

        const productosEnviados = currentOrder.productos.map(p => ({...p, sentToKitchen: true}));
        const newStatus: EstadoPedido = 'en preparación';
        
        const orderToSend: Pedido = { 
            ...currentOrder, 
            productos: productosEnviados,
            estado: newStatus,
            historial: [
                ...currentOrder.historial,
                { estado: newStatus, fecha: new Date().toISOString(), usuario: 'admin' }
            ],
        };
        
        onSaveOrder(orderToSend, mesa.numero);
    };

    const handleAssignCustomer = (customer: ClienteLeal) => {
        setAssignedCustomer(customer);
        setIsAssignCustomerModalOpen(false);
        setCurrentOrder(prevOrder => {
            const baseOrder = prevOrder || {
                id: '',
                fecha: new Date().toISOString(),
                tipo: 'local',
                estado: 'nuevo',
                turno: 'tarde',
                cliente: {
                    nombre: `Mesa ${mesa.numero}`,
                    telefono: '',
                    mesa: mesa.numero
                },
                productos: [],
                total: 0,
                metodoPago: 'efectivo',
                tiempoEstimado: 15,
                historial: [],
                areaPreparacion: 'salon',
            };
            return {
                ...baseOrder,
                cliente: {
                    ...baseOrder.cliente,
                    nombre: customer.nombre,
                    telefono: customer.telefono,
                }
            };
        });
    };

    const handleRemoveCustomer = () => {
        setAssignedCustomer(null);
        if (currentOrder) {
            setCurrentOrder(prevOrder => {
                if (!prevOrder) return null;
                return {
                    ...prevOrder,
                    cliente: {
                        ...prevOrder.cliente,
                        nombre: `Mesa ${mesa.numero}`,
                        telefono: ''
                    }
                };
            });
        }
    };

    const handleRedeemReward = (reward: Recompensa) => {
        if (!assignedCustomer || !currentOrder) return;
    
        redeemReward(assignedCustomer.telefono, reward);
    
        let redeemedProduct: ProductoPedido;
        const productFromCatalog = reward.productoId ? products.find(p => p.id === reward.productoId) : null;
    
        if (productFromCatalog) {
            redeemedProduct = {
                id: productFromCatalog.id,
                nombre: `${productFromCatalog.nombre} [CANJE]`,
                cantidad: 1,
                precio: 0,
                isReward: true,
                imagenUrl: productFromCatalog.imagenUrl,
                salsas: [],
                sentToKitchen: false,
            };
        } else {
            redeemedProduct = {
                id: `recompensa-${reward.id}`,
                nombre: `${reward.nombre} [CANJE]`,
                cantidad: 1,
                precio: 0,
                isReward: true,
                sentToKitchen: false,
            };
        }
    
        updateCurrentOrder([...currentOrder.productos, redeemedProduct]);
        setIsRedeemRewardModalOpen(false);
    };

    const handleApplyPromotion = (promotion: Promocion) => {
        if (!currentOrder) return;
        let updatedProductos = [...currentOrder.productos];
    
        switch (promotion.tipo) {
            case 'dos_por_uno': {
                const productId = promotion.condiciones.productoId_2x1;
                if (!productId) break;
    
                const productIndices = updatedProductos
                    .map((p, index) => ({ p, index }))
                    .filter(({ p }) => p.id === productId && !p.promocionId)
                    .map(({ index }) => index);
    
                if (productIndices.length >= 2) {
                    const originalProduct = products.find(p => p.id === productId);
                    if(!originalProduct) break;

                    const freeItemIndex = productIndices[1];
                    updatedProductos[freeItemIndex] = {
                        ...updatedProductos[freeItemIndex],
                        precio: 0,
                        precioOriginal: originalProduct.precio,
                        promocionId: promotion.id,
                        sentToKitchen: false,
                    };
                     const firstItemIndex = productIndices[0];
                     updatedProductos[firstItemIndex] = {
                        ...updatedProductos[firstItemIndex],
                        promocionId: promotion.id,
                        sentToKitchen: false,
                    };
                }
                break;
            }
            case 'combo_fijo': {
                const { productos: comboProducts = [], precioFijo = 0 } = promotion.condiciones;
                const totalOriginalPrice = comboProducts.reduce((sum, comboProd) => {
                    const productInfo = products.find(p => p.id === comboProd.productoId);
                    return sum + (productInfo ? productInfo.precio * comboProd.cantidad : 0);
                }, 0);
                
                const discountRatio = precioFijo / totalOriginalPrice;
    
                comboProducts.forEach(comboProd => {
                    let remainingQty = comboProd.cantidad;
                    updatedProductos = updatedProductos.map(orderProd => {
                        if (remainingQty > 0 && orderProd.id === comboProd.productoId && !orderProd.promocionId) {
                            const originalProduct = products.find(p => p.id === comboProd.productoId);
                            if(originalProduct){
                                remainingQty -= orderProd.cantidad; // simplistic; assumes whole item gets promo
                                return {
                                    ...orderProd,
                                    precio: originalProduct.precio * discountRatio,
                                    precioOriginal: originalProduct.precio,
                                    promocionId: promotion.id,
                                    sentToKitchen: false,
                                };
                            }
                        }
                        return orderProd;
                    });
                });
                break;
            }
            // Add other promotion types here
        }
        
        updateCurrentOrder(updatedProductos);
        setIsApplyPromotionModalOpen(false);
    };
    
    const handleExitClick = () => {
        if (hasUnsavedChanges) {
            setShowExitConfirm(true);
        } else {
            onExit();
        }
    };

    return (
        <div className="fixed inset-0 bg-background dark:bg-slate-900 flex flex-col font-sans">
            {isSauceModalOpen && <SauceModal product={productForSauces} onClose={() => setIsSauceModalOpen(false)} onConfirm={handleAddToCartWithSauces} />}
            {isAssignCustomerModalOpen && <AssignCustomerModal customers={customers} onAssign={handleAssignCustomer} onClose={() => setIsAssignCustomerModalOpen(false)} onAddNewCustomer={onAddNewCustomer} />}
            {isRedeemRewardModalOpen && assignedCustomer && activeProgram && <RedeemRewardModal customer={assignedCustomer} rewards={activeProgram.rewards} onRedeem={handleRedeemReward} onClose={() => setIsRedeemRewardModalOpen(false)} />}
            {isApplyPromotionModalOpen && <ApplyPromotionModal order={currentOrder} promotions={promotions} products={products} onApply={handleApplyPromotion} onClose={() => setIsApplyPromotionModalOpen(false)} />}

            {showExitConfirm && (
                 <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4">
                    <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full text-center animate-fade-in-scale">
                        <h3 className="text-xl font-heading font-bold text-text-primary dark:text-white">Cambios sin guardar</h3>
                        <p className="text-text-secondary dark:text-slate-400 my-3">Tienes items sin enviar a cocina. Si sales, se perderán. ¿Deseas salir de todas formas?</p>
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <button onClick={() => setShowExitConfirm(false)} className="bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-2 px-4 rounded-lg transition-colors active:scale-95">Cancelar</button>
                            <button onClick={onExit} className="bg-danger hover:brightness-110 text-white font-bold py-2 px-4 rounded-lg transition-all active:scale-95">Salir sin guardar</button>
                        </div>
                    </div>
                </div>
            )}
            <header className="flex-shrink-0 bg-surface dark:bg-slate-800 shadow-md z-10">
                <div className="flex items-center justify-between p-3 border-b border-text-primary/5 dark:border-slate-700">
                    <button onClick={handleExitClick} className="flex items-center font-semibold text-text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-orange-400 transition-colors">
                        <ChevronLeftIcon className="h-6 w-6 mr-1" />
                        VOLVER AL SALÓN
                    </button>
                    <div className="text-center">
                        <h1 className="text-2xl font-heading font-bold text-text-primary dark:text-slate-100">Mesa {mesa.numero}</h1>
                        {currentOrder?.id && <p className="text-sm font-mono text-text-secondary dark:text-slate-500">{currentOrder.id}</p>}
                    </div>
                     <div className="w-48 text-right">
                        {currentOrder ? (() => {
                            const statusInfo = getStatusAppearance(currentOrder.estado);
                            return (
                                <span className={`text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-full text-white ${statusInfo.color}`}>
                                    {statusInfo.label}
                                </span>
                            );
                        })() : (
                             <span className={`text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-gray-400/10 text-gray-500`}>
                                Tomando Pedido
                            </span>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                {/* Left Panel - Order */}
                <div className="w-full lg:w-5/12 bg-surface dark:bg-slate-800 flex flex-col p-4 border-r border-text-primary/5 dark:border-slate-700">
                    <div className="flex-shrink-0 mb-4">
                        {assignedCustomer ? (
                            <div className="p-3 bg-background dark:bg-slate-900/50 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-text-primary dark:text-slate-200">{assignedCustomer.nombre}</p>
                                    <p className="text-sm text-text-secondary dark:text-slate-400">{assignedCustomer.telefono}</p>
                                    <p className="text-sm font-bold text-primary dark:text-orange-400">{assignedCustomer.puntos} Puntos</p>
                                </div>
                                <button onClick={handleRemoveCustomer} className="text-xs font-semibold text-danger hover:underline">Quitar</button>
                            </div>
                        ) : (
                            <div className="p-4 bg-primary/10 dark:bg-orange-500/20 rounded-lg border-2 border-dashed border-primary/30 dark:border-orange-500/40 text-center">
                                <h3 className="font-bold text-lg text-primary dark:text-orange-300 mb-2">Programa de Lealtad</h3>
                                <p className="text-sm text-text-secondary dark:text-slate-400 mb-3">Busca o registra al cliente para acumular puntos y acceder a promociones.</p>
                                <button onClick={() => setIsAssignCustomerModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded-lg transition-all shadow-md shadow-primary/20 hover:shadow-primary/30">
                                    <UserIcon className="h-5 w-5" /> Buscar / Registrar Cliente
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex-grow overflow-y-auto pr-2">
                        {currentOrder && currentOrder.productos.length > 0 ? (
                            currentOrder.productos.map((item, index) => (
                                <div key={index} onClick={() => setSelectedItem(item)} className={`p-3 rounded-lg cursor-pointer mb-2 relative ${selectedItem === item ? 'bg-primary/10' : 'hover:bg-background dark:hover:bg-slate-700/50'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-grow">
                                            <div className="flex items-center flex-wrap">
                                                <p className="font-semibold text-text-primary dark:text-slate-200 pr-2">{item.nombre}</p>
                                                {item.sentToKitchen && <span className="text-xs font-bold bg-success/20 text-success dark:bg-green-500/20 dark:text-green-300 rounded-full px-2 py-0.5 mr-2">Enviado</span>}
                                                {item.isReward && <span className="text-xs font-bold bg-primary/20 text-primary dark:bg-orange-500/20 dark:text-orange-300 rounded-full px-2 py-0.5">Canje</span>}
                                                {item.promocionId && <span className="text-xs font-bold bg-teal-500/20 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300 rounded-full px-2 py-0.5">Promo</span>}
                                            </div>
                                             {item.salsas && item.salsas.length > 0 && (
                                                <p className="text-xs text-sky-600 dark:text-sky-400 italic mt-1">
                                                    + {item.salsas.map(s => s.nombre).join(', ')}
                                                </p>
                                            )}
                                            <p className="text-sm text-text-secondary dark:text-slate-400">{item.cantidad} x S/.{(item.precioOriginal ?? item.precio).toFixed(2)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-text-primary dark:text-slate-100 text-lg">S/.{((item.precio + (item.salsas || []).reduce((sum,s) => sum + s.precio, 0)) * item.cantidad).toFixed(2)}</p>
                                            {item.precioOriginal && <p className="text-xs text-danger dark:text-red-400 line-through">S/.{(item.precioOriginal * item.cantidad).toFixed(2)}</p>}
                                        </div>
                                    </div>
                                    <div className="absolute right-3 bottom-3 flex items-center gap-2 mt-1">
                                        <button onClick={(e) => { e.stopPropagation(); handleQuantityChange(item, -1); }} className="bg-text-primary/10 dark:bg-slate-700 rounded-full h-8 w-8 flex items-center justify-center font-bold text-text-primary dark:text-slate-200 hover:bg-text-primary/20 dark:hover:bg-slate-600 transition-transform active:scale-90">
                                            {item.cantidad > 1 ? <MinusIcon className="h-5 w-5"/> : <TrashIcon className="h-4 w-4 text-danger" />}
                                        </button>
                                        <span className="font-bold w-6 text-center text-lg dark:text-slate-200">{item.cantidad}</span>
                                        <button onClick={(e) => { e.stopPropagation(); handleQuantityChange(item, 1); }} className="bg-text-primary/10 dark:bg-slate-700 rounded-full h-8 w-8 flex items-center justify-center font-bold text-text-primary dark:text-slate-200 hover:bg-text-primary/20 dark:hover:bg-slate-600 transition-transform active:scale-90"><PlusIcon className="h-5 w-5" /></button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex items-center justify-center text-center text-text-secondary/60 dark:text-slate-500">
                                <p>Selecciona productos del menú para comenzar.</p>
                            </div>
                        )}
                    </div>
                    <div className="flex-shrink-0 pt-4 border-t border-text-primary/10 dark:border-slate-700">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            {assignedCustomer && activeProgram && (
                                <button
                                    onClick={() => setIsRedeemRewardModalOpen(true)}
                                    className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary dark:bg-orange-500/20 dark:text-orange-300 font-bold py-3 rounded-xl text-base hover:bg-primary/20 transition-colors"
                                >
                                    <StarIcon className="h-5 w-5" /> Canjear Recompensa
                                </button>
                            )}
                            <button
                                onClick={() => setIsApplyPromotionModalOpen(true)}
                                className={`w-full flex items-center justify-center gap-2 bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300 font-bold py-3 rounded-xl text-base hover:bg-teal-500/20 transition-colors ${!assignedCustomer ? 'col-span-2' : ''}`}
                            >
                                <SparklesIcon className="h-5 w-5" /> Aplicar Promoción
                            </button>
                        </div>
                        <div className="flex justify-between items-center text-3xl font-heading font-extrabold mb-4">
                            <span className="text-text-primary dark:text-slate-100">Total</span>
                            <span className="text-text-primary dark:text-slate-100 font-mono">S/.{currentOrder?.total.toFixed(2) || '0.00'}</span>
                        </div>
                         {currentOrder?.estado === 'listo' && (
                            <button
                                onClick={() => updateOrderStatus(currentOrder!.id, 'entregado', 'admin')}
                                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-base mb-3 transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-95"
                                aria-label="Marcar el pedido como servido en la mesa"
                            >
                                <CheckCircleIcon className="inline-block h-5 w-5 mr-2" />
                                Marcar como Servido en Mesa
                            </button>
                        )}
                        <div className="space-y-3">
                             {currentOrder?.id ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => onGeneratePreBill(currentOrder!.id)}
                                        disabled={hasUnsavedChanges}
                                        className="w-full bg-text-primary/80 dark:bg-slate-600 text-white font-bold py-3 rounded-xl text-base hover:bg-text-primary/90 dark:hover:bg-slate-500 transition-all duration-300 shadow-lg hover:shadow-text-primary/20 hover:-translate-y-0.5 active:scale-95 disabled:bg-gray-400/50 dark:disabled:bg-slate-700 disabled:text-text-secondary dark:disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
                                        aria-label="Ver o imprimir la pre-cuenta del pedido"
                                    >
                                        Ver Cuenta
                                    </button>
                                    <button
                                        onClick={handleSendToKitchen}
                                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-base transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:scale-95 disabled:bg-gray-400 dark:disabled:bg-slate-700 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed"
                                        disabled={isSubmitting || !hasUnsavedChanges}
                                    >
                                        {isSubmitting ? 'Enviando...' : 'Adicionar y Enviar'}
                                    </button>
                                </div>
                             ) : (
                                <button
                                    onClick={handleSendToKitchen}
                                    className="w-full bg-success text-white font-bold py-4 rounded-xl text-xl transition-all duration-300 shadow-lg shadow-success/30 hover:shadow-success/40 hover:-translate-y-0.5 active:scale-95 disabled:bg-gray-400 dark:disabled:bg-slate-700 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed"
                                    disabled={isSubmitting || !currentOrder || currentOrder.productos.length === 0}
                                >
                                    {isSubmitting ? 'Enviando...' : 'Enviar a Cocina'}
                                </button>
                             )}
                              {hasUnsavedChanges && (
                                <p className="text-xs text-center text-warning dark:text-yellow-400 mt-2 animate-fade-in-up">
                                    Tienes cambios sin guardar. Haz clic en "Adicionar y Enviar".
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Products */}
                <div className="w-full lg:w-7/12 flex flex-col p-4">
                     <div className="flex-shrink-0 mb-4">
                        <input type="search" placeholder="Buscar producto..." className="w-full p-3 rounded-lg border border-text-primary/10 dark:border-slate-700 bg-surface dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary dark:text-slate-200 dark:placeholder-slate-400" />
                    </div>
                    <div className="flex-shrink-0 border-b border-text-primary/10 dark:border-slate-700">
                         <div className="flex space-x-2 overflow-x-auto pb-2">
                             {categories.map(cat => (
                                 <button key={cat} onClick={() => setActiveCategory(cat)} className={`py-2 px-4 rounded-lg font-semibold whitespace-nowrap text-sm ${activeCategory === cat ? 'bg-primary text-white shadow-sm' : 'bg-surface dark:bg-slate-800 text-text-primary dark:text-slate-200 hover:bg-text-primary/5 dark:hover:bg-slate-700/50'}`}>
                                     {cat}
                                 </button>
                             ))}
                         </div>
                    </div>
                    <div className="flex-grow overflow-y-auto pt-4 pr-2">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {(groupedProducts[activeCategory] || []).map(product => (
                                <button key={product.id} onClick={() => handleProductClick(product)} className="bg-surface dark:bg-slate-800 rounded-lg shadow-md p-2 text-center transition-transform hover:-translate-y-1 hover:shadow-lg flex flex-col border border-text-primary/5 dark:border-slate-700 relative disabled:opacity-50 disabled:cursor-not-allowed" disabled={product.stock <= 0}>
                                    <div className="h-24 w-full bg-background dark:bg-slate-700 rounded-md overflow-hidden relative">
                                        <img src={product.imagenUrl} alt={product.nombre} className={`w-full h-full object-cover ${product.stock <= 0 ? 'filter grayscale' : ''}`} />
                                         {product.stock <= 0 && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-md">
                                                <span className="bg-danger text-white font-bold text-xs px-2 py-1 rounded">AGOTADO</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="font-semibold text-sm mt-2 flex-grow text-text-primary dark:text-slate-200 leading-tight">{product.nombre}</p>
                                    <p className="font-bold text-text-secondary dark:text-slate-400 mt-1">S/.{product.precio.toFixed(2)}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default POSView;