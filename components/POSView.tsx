
import React, { useState, useMemo, useEffect } from 'react';
import type { Pedido, Producto, ProductoPedido, Mesa, Salsa } from '../types';
import { ChevronLeftIcon, TrashIcon } from './icons';
import SauceModal from './SauceModal';

interface POSViewProps {
    mesa: Mesa;
    order: Pedido | null;
    products: Producto[];
    onExit: () => void;
    onSaveOrder: (order: Pedido) => void;
    onInitiatePayment: (order: Pedido) => void;
    onGeneratePreBill: (order: Pedido) => void;
}

const POSView: React.FC<POSViewProps> = ({ mesa, order, products, onExit, onSaveOrder, onInitiatePayment, onGeneratePreBill }) => {
    const [activeCategory, setActiveCategory] = useState('Hamburguesas');
    const [selectedItem, setSelectedItem] = useState<ProductoPedido | null>(null);
    const [currentOrder, setCurrentOrder] = useState<Pedido | null>(order);

    const [isSauceModalOpen, setIsSauceModalOpen] = useState(false);
    const [productForSauces, setProductForSauces] = useState<Producto | null>(null);

    useEffect(() => {
        setCurrentOrder(order);
    }, [order]);
    
    const groupedProducts = useMemo(() => {
        return products.reduce((acc, product) => {
            const category = product.categoria;
            if (!acc[category]) acc[category] = [];
            acc[category].push(product);
            return acc;
        }, {} as Record<string, Producto[]>);
    }, [products]);

    const categories = useMemo(() => Object.keys(groupedProducts), [groupedProducts]);

    const updateCurrentOrder = (updatedProductos: ProductoPedido[]) => {
        const newTotal = updatedProductos.reduce((sum, p) => {
            const itemTotal = p.precio * p.cantidad;
            const saucesTotal = (p.salsas || []).reduce((sauceSum, sauce) => sauceSum + sauce.precio, 0) * p.cantidad;
            return sum + itemTotal + saucesTotal;
        }, 0);

        if (currentOrder) {
            setCurrentOrder({ ...currentOrder, productos: updatedProductos, total: newTotal });
        } else {
             const newOrderShell: Pedido = {
                id: '',
                fecha: new Date().toISOString(),
                tipo: 'local',
                estado: 'nuevo',
                turno: 'tarde',
                cliente: { nombre: `Mesa ${mesa.numero}`, telefono: '', mesa: mesa.numero },
                productos: updatedProductos,
                total: newTotal,
                metodoPago: 'efectivo',
                tiempoEstimado: 15,
                tiempoTranscurrido: 0,
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
            updatedProductos = productos.map((item, index) => index === existingItemIndex ? { ...item, cantidad: item.cantidad + 1 } : item);
        } else {
            const newItem: ProductoPedido = {
                id: productForSauces.id,
                nombre: productForSauces.nombre,
                cantidad: 1,
                precio: productForSauces.precio,
                imagenUrl: productForSauces.imagenUrl,
                salsas: salsas,
            };
            updatedProductos = [...productos, newItem];
        }

        updateCurrentOrder(updatedProductos);
        setIsSauceModalOpen(false);
        setProductForSauces(null);
    };

    const handleProductClick = (product: Producto) => {
        setProductForSauces(product);
        setIsSauceModalOpen(true);
    };

    const handleQuantityChange = (itemToUpdate: ProductoPedido, change: number) => {
        if (!currentOrder) return;
        const newQuantity = itemToUpdate.cantidad + change;
        let updatedProductos;

        if (newQuantity <= 0) {
            updatedProductos = currentOrder.productos.filter(p => p !== itemToUpdate);
        } else {
            updatedProductos = currentOrder.productos.map(p => p === itemToUpdate ? { ...p, cantidad: newQuantity } : p);
        }
        updateCurrentOrder(updatedProductos);
    };
    
    const handleSendToKitchen = () => {
        if(currentOrder && currentOrder.productos.length > 0) {
            const orderToSend = { ...currentOrder, estado: 'en preparación' as const };
            onSaveOrder(orderToSend);
        }
    };

    const isSentToKitchen = currentOrder?.estado && !['nuevo', 'confirmado'].includes(currentOrder.estado);

    return (
        <div className="fixed inset-0 bg-background flex flex-col font-sans">
            {isSauceModalOpen && (
                <SauceModal product={productForSauces} onClose={() => setIsSauceModalOpen(false)} onConfirm={handleAddToCartWithSauces} />
            )}
            <header className="flex-shrink-0 bg-surface shadow-md z-10">
                <div className="flex items-center justify-between p-3 border-b border-text-primary/5">
                    <button onClick={onExit} className="flex items-center font-semibold text-text-secondary hover:text-primary transition-colors">
                        <ChevronLeftIcon className="h-6 w-6 mr-1" />
                        VOLVER AL SALÓN
                    </button>
                    <div className="text-center">
                        <h1 className="text-2xl font-heading font-bold text-text-primary">Mesa {mesa.numero}</h1>
                        {currentOrder?.id && <p className="text-sm font-mono text-text-secondary">{currentOrder.id}</p>}
                    </div>
                    <div className="w-48 text-right">
                        {currentOrder && <span className={`text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${isSentToKitchen ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                           {isSentToKitchen ? `Enviado (${currentOrder.estado})` : 'Tomando Pedido'}
                        </span>}
                    </div>
                </div>
            </header>

            <main className="flex-grow flex overflow-hidden">
                {/* Left Panel - Order */}
                <div className="w-5/12 bg-surface flex flex-col p-4 border-r border-text-primary/5">
                    <div className="flex-grow overflow-y-auto pr-2">
                        {currentOrder && currentOrder.productos.length > 0 ? (
                            currentOrder.productos.map((item, index) => (
                                <div key={index} onClick={() => setSelectedItem(item)} className={`p-3 rounded-lg cursor-pointer mb-2 relative ${selectedItem === item ? 'bg-primary/10' : 'hover:bg-background'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-grow">
                                            <p className="font-semibold text-text-primary pr-20">{item.nombre}</p>
                                             {item.salsas && item.salsas.length > 0 && (
                                                <p className="text-xs text-sky-600 italic mt-1">
                                                    + {item.salsas.map(s => s.nombre).join(', ')}
                                                </p>
                                            )}
                                            <p className="text-sm text-text-secondary">{item.cantidad} x S/.{(item.precio + (item.salsas || []).reduce((sum,s) => sum + s.precio, 0)).toFixed(2)}</p>
                                        </div>
                                        <p className="font-bold text-text-primary text-lg">S/.{((item.precio + (item.salsas || []).reduce((sum,s) => sum + s.precio, 0)) * item.cantidad).toFixed(2)}</p>
                                    </div>
                                    <div className="absolute right-3 bottom-3 flex items-center gap-2 mt-1">
                                        <button onClick={(e) => { e.stopPropagation(); handleQuantityChange(item, -1); }} className="bg-text-primary/10 rounded-full h-8 w-8 flex items-center justify-center font-bold text-text-primary hover:bg-text-primary/20">
                                            {item.cantidad > 1 ? '−' : <TrashIcon className="h-4 w-4 text-danger" />}
                                        </button>
                                        <span className="font-bold w-6 text-center text-lg">{item.cantidad}</span>
                                        <button onClick={(e) => { e.stopPropagation(); handleQuantityChange(item, 1); }} className="bg-text-primary/10 rounded-full h-8 w-8 flex items-center justify-center font-bold text-text-primary hover:bg-text-primary/20">+</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex items-center justify-center text-center text-text-secondary/60">
                                <p>Selecciona productos del menú para comenzar.</p>
                            </div>
                        )}
                    </div>
                    <div className="flex-shrink-0 pt-4 border-t border-text-primary/10">
                        <div className="flex justify-between items-center text-3xl font-heading font-extrabold mb-4">
                            <span className="text-text-primary">Total</span>
                            <span className="text-text-primary font-mono">S/.{currentOrder?.total.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="space-y-2">
                             {isSentToKitchen ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => onGeneratePreBill(currentOrder!)}
                                        className="w-full bg-text-primary text-white font-bold py-4 rounded-xl text-lg hover:bg-text-primary/90 transition-all duration-300 shadow-lg hover:shadow-text-primary/20 hover:-translate-y-0.5"
                                        aria-label="Ver o imprimir la pre-cuenta del pedido"
                                    >
                                        Ver Cuenta
                                    </button>
                                    <button
                                        onClick={() => onInitiatePayment(currentOrder!)}
                                        className="w-full bg-primary text-white font-bold py-4 rounded-xl text-lg transition-all duration-300 shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5"
                                        aria-label="Iniciar el proceso de pago para este pedido"
                                    >
                                        Pagar
                                    </button>
                                </div>
                             ) : (
                                <button
                                    onClick={handleSendToKitchen}
                                    className="w-full bg-text-primary text-white font-bold py-4 rounded-xl text-xl transition-all duration-300 shadow-lg hover:shadow-text-primary/30 hover:-translate-y-0.5 disabled:bg-gray-400 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed"
                                    disabled={!currentOrder || currentOrder.productos.length === 0}
                                >
                                    Enviar a Cocina
                                </button>
                             )}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Products */}
                <div className="w-7/12 flex flex-col p-4">
                     <div className="flex-shrink-0 mb-4">
                        <input type="search" placeholder="Buscar producto..." className="w-full p-3 rounded-lg border border-text-primary/10 bg-surface focus:ring-2 focus:ring-primary focus:border-primary" />
                    </div>
                    <div className="flex-shrink-0 border-b border-text-primary/10">
                         <div className="flex space-x-2 overflow-x-auto pb-2">
                             {categories.map(cat => (
                                 <button key={cat} onClick={() => setActiveCategory(cat)} className={`py-2 px-4 rounded-lg font-semibold whitespace-nowrap text-sm ${activeCategory === cat ? 'bg-primary text-white shadow-sm' : 'bg-surface text-text-primary hover:bg-text-primary/5'}`}>
                                     {cat}
                                 </button>
                             ))}
                         </div>
                    </div>
                    <div className="flex-grow overflow-y-auto pt-4 pr-2">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {(groupedProducts[activeCategory] || []).map(product => (
                                <button key={product.id} onClick={() => handleProductClick(product)} className="bg-surface rounded-lg shadow-md p-2 text-center transition-transform hover:-translate-y-1 hover:shadow-lg flex flex-col border border-text-primary/5">
                                    <div className="h-24 w-full bg-background rounded-md overflow-hidden">
                                        <img src={product.imagenUrl} alt={product.nombre} className="w-full h-full object-cover" />
                                    </div>
                                    <p className="font-semibold text-sm mt-2 flex-grow text-text-primary leading-tight">{product.nombre}</p>
                                    <p className="font-bold text-text-secondary mt-1">S/.{product.precio.toFixed(2)}</p>
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