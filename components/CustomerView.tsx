import React, { useState, useMemo } from 'react';
import type { Pedido, Producto, ProductoPedido, Cliente, Salsa, TipoPedido, MetodoPago } from '../types';
import { ShoppingBagIcon, TrashIcon, CheckCircleIcon, TruckIcon, UserIcon, CashIcon, CreditCardIcon, DevicePhoneMobileIcon, MapPinIcon, SearchIcon, AdjustmentsHorizontalIcon, MinusIcon, PlusIcon, StarIcon } from './icons';
import SauceModal from './SauceModal';
import { yapePlinInfo } from '../constants';
import { Logo } from './Logo';


interface CustomerViewProps {
    products: Producto[];
    onPlaceOrder: (order: Omit<Pedido, 'id' | 'fecha' | 'turno' | 'historial' | 'tiempoTranscurrido' | 'areaPreparacion' | 'estado'>) => void;
    onNavigateToAdmin: () => void;
}

type CartItem = ProductoPedido & { cartItemId: number };
type Stage = 'selection' | 'catalog' | 'checkout' | 'confirmation';
type FormErrors = {
    nombre?: string;
    telefono?: string;
    direccion?: string;
    pagoConEfectivo?: string;
};

const CustomerView: React.FC<CustomerViewProps> = ({ products, onPlaceOrder, onNavigateToAdmin }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [orderType, setOrderType] = useState<TipoPedido | null>(null);
    const [customerInfo, setCustomerInfo] = useState<Cliente>({ nombre: '', telefono: '' });
    const [stage, setStage] = useState<Stage>('selection');
    const [newOrderId, setNewOrderId] = useState('');
    const [activeCategory, setActiveCategory] = useState('Hamburguesas');
    const [paymentMethod, setPaymentMethod] = useState<MetodoPago>('efectivo');
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [cashPaymentAmount, setCashPaymentAmount] = useState('');
    const [isExactCash, setIsExactCash] = useState(false);
    const [orderNotes, setOrderNotes] = useState('');
    
    const [isSauceModalOpen, setIsSauceModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Producto | null>(null);

    const [isLocating, setIsLocating] = useState(false);

    const groupedProducts = useMemo(() => {
        return products.reduce((acc, product) => {
            const category = product.categoria;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(product);
            return acc;
        }, {} as Record<string, Producto[]>);
    }, [products]);

    const categories = useMemo(() => Object.keys(groupedProducts), [groupedProducts]);

    const total = useMemo(() =>
        cart.reduce((sum, item) => {
            const itemTotal = item.precio * item.cantidad;
            const saucesTotal = (item.salsas || []).reduce((sauceSum, sauce) => sauceSum + sauce.precio, 0) * item.cantidad;
            return sum + itemTotal + saucesTotal;
        }, 0),
    [cart]);

    const cartItemCount = useMemo(() => cart.reduce((sum, p) => sum + p.cantidad, 0), [cart]);

    const handleOpenSauceModal = (product: Producto) => {
        setCurrentProduct(product);
        setIsSauceModalOpen(true);
    };

    const handleCloseSauceModal = () => {
        setCurrentProduct(null);
        setIsSauceModalOpen(false);
    };

    const updateQuantity = (cartItemId: number, quantity: number) => {
         setCart(currentCart => {
             if (quantity <= 0) {
                 return currentCart.filter(item => item.cartItemId !== cartItemId);
             }
             return currentCart.map(item => item.cartItemId === cartItemId ? {...item, cantidad: quantity} : item);
         });
    };

    const handleConfirmSauces = (salsas: Salsa[]) => {
        if (!currentProduct) return;
    
        const getSauceKey = (salsaList: Salsa[] = []) => {
            return salsaList.map(s => s.nombre).sort().join(',');
        };
    
        const newSauceKey = getSauceKey(salsas);
    
        const existingItem = cart.find(item =>
            item.id === currentProduct.id && getSauceKey(item.salsas) === newSauceKey
        );
    
        if (existingItem) {
            updateQuantity(existingItem.cartItemId, existingItem.cantidad + 1);
        } else {
            const newItem: CartItem = {
                id: currentProduct.id,
                cartItemId: Date.now(),
                nombre: currentProduct.nombre,
                cantidad: 1,
                precio: currentProduct.precio,
                imagenUrl: currentProduct.imagenUrl,
                salsas: salsas,
            };
            setCart(currentCart => [...currentCart, newItem]);
        }
        
        handleCloseSauceModal();
    };
    
    const validateForm = (): boolean => {
        const errors: FormErrors = {};
        if (!customerInfo.nombre.trim()) errors.nombre = 'El nombre es obligatorio.';
        if (!customerInfo.telefono.trim()) {
            errors.telefono = 'El teléfono es obligatorio.';
        } else if (!/^\d{9}$/.test(customerInfo.telefono)) {
            errors.telefono = 'El teléfono debe tener 9 dígitos.';
        }
        if (orderType === 'delivery' && !customerInfo.direccion?.trim()) {
            errors.direccion = 'La dirección es obligatoria para delivery.';
        }
        if (orderType === 'delivery' && paymentMethod === 'efectivo' && !isExactCash) {
            if (!cashPaymentAmount.trim()) {
                errors.pagoConEfectivo = 'Indica con cuánto pagarás.';
            } else if (parseFloat(cashPaymentAmount) < total) {
                errors.pagoConEfectivo = 'El monto debe ser mayor o igual al total.';
            }
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };


    const handlePlaceOrder = () => {
        if (!validateForm() || !orderType) return;
        
        const finalCart: ProductoPedido[] = cart.map(({ cartItemId, ...rest }) => rest);
        const newOrder: Omit<Pedido, 'id' | 'fecha' | 'turno' | 'historial' | 'tiempoTranscurrido' | 'areaPreparacion' | 'estado'> = {
            tipo: orderType,
            cliente: customerInfo,
            productos: finalCart,
            total: total,
            metodoPago: paymentMethod,
            pagoConEfectivo: (orderType === 'delivery' && paymentMethod === 'efectivo' && !isExactCash) ? parseFloat(cashPaymentAmount) : undefined,
            pagoExacto: (orderType === 'delivery' && paymentMethod === 'efectivo' && isExactCash) ? true : undefined,
            notas: orderNotes,
            tiempoEstimado: orderType === 'delivery' ? 30 : 15,
        };
        
        onPlaceOrder(newOrder);
        
        const generatedId = `PED-${String(Date.now()).slice(-4)}`;
        setNewOrderId(generatedId);
        setStage('confirmation');
        setCart([]);
        setCustomerInfo({ nombre: '', telefono: '' });
        setFormErrors({});
        setCashPaymentAmount('');
        setOrderNotes('');
        setIsExactCash(false);
    };

    const handleSelectOrderType = (type: TipoPedido) => {
        setOrderType(type);
        setStage('catalog');
    };
    
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            setFormErrors(prev => ({...prev, direccion: "La geolocalización no es soportada por tu navegador."}));
            return;
        }
    
        setIsLocating(true);
        setFormErrors(prev => ({...prev, direccion: undefined }));
    
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const address = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
                setCustomerInfo(prev => ({ ...prev, direccion: address }));
                setIsLocating(false);
            },
            () => {
                setFormErrors(prev => ({...prev, direccion: "No se pudo obtener la ubicación. Revisa los permisos y vuelve a intentarlo."}));
                setIsLocating(false);
            },
            { timeout: 10000 }
        );
    };

    const renderSelectionScreen = () => (
        <div className="text-center max-w-4xl mx-auto animate-fade-in-up flex flex-col items-center justify-center h-full">
            <Logo className="h-24 w-auto mx-auto mb-6" />
            <h1 className="font-heading text-5xl font-extrabold text-text-primary mb-4">El sabor que te mueve</h1>
            <p className="text-lg text-text-secondary mb-12 max-w-2xl">Pide tu comida favorita, preparada al momento con los mejores ingredientes. Rápido, fresco y delicioso.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
                <button onClick={() => handleSelectOrderType('retiro')} className="group bg-surface p-8 rounded-2xl border border-text-primary/10 hover:shadow-2xl hover:border-primary/50 hover:-translate-y-2 transition-all duration-300">
                    <ShoppingBagIcon className="h-16 w-16 mx-auto text-primary group-hover:scale-110 transition-transform"/>
                    <h3 className="text-2xl font-heading font-bold text-text-primary mt-4">Para Llevar</h3>
                    <p className="text-text-secondary mt-2">Pide y recoge en tienda sin esperas.</p>
                </button>
                 <button onClick={() => handleSelectOrderType('delivery')} className="group bg-surface p-8 rounded-2xl border border-text-primary/10 hover:shadow-2xl hover:border-primary/50 hover:-translate-y-2 transition-all duration-300">
                    <TruckIcon className="h-16 w-16 mx-auto text-primary group-hover:scale-110 transition-transform"/>
                    <h3 className="text-2xl font-heading font-bold text-text-primary mt-4">Delivery</h3>
                    <p className="text-text-secondary mt-2">Te lo llevamos caliente a tu casa.</p>
                </button>
            </div>
        </div>
    );

    const renderCatalog = () => (
        <div className="w-full animate-fade-in-up">
            <div className="mb-6">
                <h2 className="text-4xl font-heading font-extrabold text-text-primary">Nuestro Menú</h2>
                <p className="text-text-secondary text-lg">Elige tus platos favoritos</p>
            </div>

            <div className="flex space-x-4 mb-6">
                <div className="relative flex-grow">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary/50" />
                    <input type="search" placeholder="Buscar comida..." className="w-full bg-surface border border-text-primary/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-primary transition" />
                </div>
                <button className="bg-surface border border-text-primary/10 rounded-xl p-3 flex-shrink-0 hover:bg-background transition">
                    <AdjustmentsHorizontalIcon className="h-6 w-6 text-text-primary" />
                </button>
            </div>
            
            <div className="mb-6">
                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                    {categories.map(category => (
                        <button 
                            key={category} 
                            onClick={() => setActiveCategory(category)}
                            className={`whitespace-nowrap py-2 px-5 rounded-full font-semibold text-sm transition-colors focus:outline-none border-2 ${
                                activeCategory === category 
                                    ? 'bg-primary text-white border-primary' 
                                    : 'bg-surface text-text-primary border-text-primary/10 hover:bg-background hover:border-text-primary/20'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {(groupedProducts[activeCategory] || []).map((product) => (
                    <div key={product.id} className="bg-surface rounded-2xl border border-text-primary/5 overflow-hidden flex flex-col group p-4 hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1">
                       <div className="h-48 w-full overflow-hidden rounded-xl mb-4 relative">
                          <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" src={product.imagenUrl} alt={product.nombre} />
                       </div>
                       <div className="flex flex-col justify-between flex-grow">
                          <div className="flex justify-between items-start">
                             <h3 className="text-lg font-heading font-bold text-text-primary leading-tight">{product.nombre}</h3>
                             <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                                <StarIcon className="h-4 w-4 text-accent"/>
                                <span className="text-sm font-semibold text-text-secondary">4.8</span>
                             </div>
                          </div>
                           <p className="text-sm text-text-secondary mt-1 line-clamp-2 flex-grow">{product.descripcion}</p>
                           <div className="flex justify-between items-center mt-4">
                               <p className="text-2xl font-heading font-extrabold text-text-primary">S/.{product.precio.toFixed(2)}</p>
                               <button onClick={() => handleOpenSauceModal(product)} className="w-10 h-10 flex items-center justify-center bg-primary rounded-full text-white hover:bg-primary-dark transition-all duration-300 shadow-lg hover:shadow-primary/30 transform hover:scale-110">
                                   <PlusIcon className="h-6 w-6" />
                               </button>
                           </div>
                       </div>
                   </div>
                ))}
            </div>
        </div>
    );
    
    const PaymentButton: React.FC<{
        method: MetodoPago;
        label: string;
        icon: React.ReactNode;
        currentMethod: MetodoPago;
        setMethod: (method: MetodoPago) => void;
    }> = ({ method, label, icon, currentMethod, setMethod }) => (
        <button
            onClick={() => setMethod(method)}
            className={`flex items-center justify-center space-x-2 w-full p-3 rounded-xl border-2 transition-all duration-200 ${
                currentMethod === method
                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-inner'
                    : 'bg-surface border-text-primary/10 text-text-primary hover:border-primary/50'
            }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    const renderCheckout = () => (
         <div className="bg-surface rounded-3xl shadow-2xl border border-text-primary/5 p-6 md:p-8 max-w-5xl w-full mx-auto animate-fade-in-scale">
             <h2 className="text-4xl font-heading font-bold text-text-primary mb-8 text-center">Finalizar Pedido</h2>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-background p-6 rounded-2xl border border-text-primary/5">
                    <h3 className="text-2xl font-heading font-bold text-text-primary mb-4">Resumen del Pedido</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {cart.length > 0 ? cart.map(item => {
                            const unitPriceWithSauces = item.precio + (item.salsas || []).reduce((sum, s) => sum + s.precio, 0);
                            const itemTotal = unitPriceWithSauces * item.cantidad;
                            return (
                                <div key={item.cartItemId} className="flex items-start">
                                    <img src={item.imagenUrl} alt={item.nombre} className="w-20 h-20 rounded-lg object-cover mr-4"/>
                                    <div className="flex-grow">
                                        <p className="font-bold text-text-primary leading-tight">{item.nombre}</p>
                                        {item.salsas && item.salsas.length > 0 && (
                                            <p className="text-xs text-primary/80 italic">
                                                + {item.salsas.map(s => s.nombre).join(', ')}
                                            </p>
                                        )}
                                        <p className="text-sm text-text-secondary">S/.{unitPriceWithSauces.toFixed(2)} c/u</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <button onClick={() => updateQuantity(item.cartItemId, item.cantidad - 1)} className="bg-text-primary/10 rounded-full h-7 w-7 flex items-center justify-center font-bold text-text-primary hover:bg-text-primary/20">
                                                {item.cantidad > 1 ? <MinusIcon className="h-4 w-4"/> : <TrashIcon className="h-4 w-4 text-danger" />}
                                            </button>
                                            <span className="font-bold w-6 text-center">{item.cantidad}</span>
                                            <button onClick={() => updateQuantity(item.cartItemId, item.cantidad + 1)} className="bg-text-primary/10 rounded-full h-7 w-7 flex items-center justify-center font-bold text-text-primary hover:bg-text-primary/20"><PlusIcon className="h-4 w-4"/></button>
                                        </div>
                                    </div>
                                    <p className="font-bold w-24 text-right text-text-primary text-lg">S/.{itemTotal.toFixed(2)}</p>
                                </div>
                            )
                        }) : <p className="text-text-secondary">Tu carrito está vacío.</p>}
                    </div>
                    <div className="border-t border-text-primary/10 mt-4 pt-4 flex justify-between items-center text-text-primary">
                        <span className="text-xl font-heading font-bold">TOTAL</span>
                        <span className="text-3xl font-heading font-extrabold text-primary">S/.{total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="bg-background p-6 rounded-2xl border border-text-primary/5 flex flex-col">
                    <h3 className="text-2xl font-heading font-bold text-text-primary mb-4">Tus Datos y Pago</h3>
                     <p className="bg-primary/10 text-primary font-semibold p-3 rounded-lg mb-4 text-center">
                        Pedido para: <span className="font-bold">{orderType === 'delivery' ? 'Delivery' : 'Retiro en Tienda'}</span>
                     </p>
                    <div className="space-y-4">
                        <div>
                            <input type="text" placeholder="Nombre (para llamar tu pedido)" value={customerInfo.nombre} onChange={e => setCustomerInfo({...customerInfo, nombre: e.target.value})} className={`bg-surface border ${formErrors.nombre ? 'border-danger' : 'border-text-primary/10'} rounded-lg p-3 w-full text-text-primary placeholder-text-secondary/70 focus:ring-2 focus:ring-primary focus:border-primary transition`} />
                            {formErrors.nombre && <p className="text-danger text-xs mt-1">{formErrors.nombre}</p>}
                        </div>
                        <div>
                            <input type="tel" placeholder="Teléfono de Contacto (9 dígitos)" value={customerInfo.telefono} onChange={e => setCustomerInfo({...customerInfo, telefono: e.target.value})} className={`bg-surface border ${formErrors.telefono ? 'border-danger' : 'border-text-primary/10'} rounded-lg p-3 w-full text-text-primary placeholder-text-secondary/70 focus:ring-2 focus:ring-primary focus:border-primary transition`} />
                            {formErrors.telefono && <p className="text-danger text-xs mt-1">{formErrors.telefono}</p>}
                        </div>
                        {orderType === 'delivery' && (
                            <div>
                                <div className="relative flex items-center">
                                    <input 
                                        type="text" 
                                        placeholder="Dirección de Entrega" 
                                        value={customerInfo.direccion || ''} 
                                        onChange={e => setCustomerInfo({...customerInfo, direccion: e.target.value})} 
                                        className={`bg-surface border ${formErrors.direccion ? 'border-danger' : 'border-text-primary/10'} rounded-lg p-3 w-full text-text-primary placeholder-text-secondary/70 focus:ring-2 focus:ring-primary focus:border-primary transition pr-12`} 
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGetCurrentLocation}
                                        disabled={isLocating}
                                        className="absolute top-1/2 right-2 -translate-y-1/2 text-primary hover:text-primary-dark disabled:opacity-50 disabled:cursor-wait p-1.5 rounded-full hover:bg-primary/10 transition-colors"
                                        aria-label="Usar ubicación actual"
                                    >
                                        {isLocating ? (
                                            <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <MapPinIcon className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                {formErrors.direccion && <p className="text-danger text-xs mt-1">{formErrors.direccion}</p>}
                            </div>
                        )}
                        <div>
                            <textarea placeholder="Notas adicionales para tu pedido (ej. sin ají, tocar intercom...)" value={orderNotes} onChange={e => setOrderNotes(e.target.value)} className="bg-surface border border-text-primary/10 rounded-lg p-3 w-full text-text-primary placeholder-text-secondary/70 focus:ring-2 focus:ring-primary focus:border-primary transition" rows={2} />
                        </div>
                    </div>
                    <div className="mt-6">
                        <h3 className="text-xl font-heading font-bold text-text-primary mb-3">Método de Pago</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <PaymentButton method="efectivo" label="Efectivo" icon={<CashIcon className="h-5 w-5"/>} currentMethod={paymentMethod} setMethod={setPaymentMethod} />
                            <PaymentButton method="tarjeta" label="Tarjeta" icon={<CreditCardIcon className="h-5 w-5"/>} currentMethod={paymentMethod} setMethod={setPaymentMethod} />
                            <PaymentButton method="yape/plin" label="Yape/Plin" icon={<DevicePhoneMobileIcon className="h-5 w-5"/>} currentMethod={paymentMethod} setMethod={setPaymentMethod} />
                        </div>
                         <div className="mt-3 p-3 bg-surface/60 rounded-lg text-sm border border-text-primary/10">
                           {orderType === 'delivery' && (
                                <>
                                    {paymentMethod === 'efectivo' && (
                                        <div className="space-y-3">
                                            <label className="font-bold block text-text-primary">¿Con cuánto pagarás?</label>
                                            <label className="flex items-center space-x-2 bg-surface/70 p-3 rounded-lg border border-text-primary/10 cursor-pointer">
                                                <input type="checkbox" checked={isExactCash} onChange={(e) => setIsExactCash(e.target.checked)} className="h-5 w-5 rounded border-text-primary/20 text-primary focus:ring-primary" />
                                                <span>Pagaré con el monto exacto</span>
                                            </label>
                                            {!isExactCash && (
                                                <input id="cash-amount" type="number" value={cashPaymentAmount} onChange={e => setCashPaymentAmount(e.target.value)} placeholder="Ej: 50" className={`bg-surface border ${formErrors.pagoConEfectivo ? 'border-danger' : 'border-text-primary/10'} rounded-lg p-2 w-full text-text-primary placeholder-text-secondary/70 focus:ring-2 focus:ring-primary focus:border-primary transition`} />
                                            )}
                                            {formErrors.pagoConEfectivo && <p className="text-danger text-xs mt-1">{formErrors.pagoConEfectivo}</p>}
                                        </div>
                                    )}
                                    {paymentMethod === 'tarjeta' && (
                                        <p className="font-semibold text-center text-text-primary">Llevaremos un POS para que puedas efectuar el pago.</p>
                                    )}
                                </>
                           )}
                           {orderType === 'retiro' && (
                                <>
                                    {(paymentMethod === 'efectivo' || paymentMethod === 'tarjeta') && (
                                        <div className="text-center font-semibold space-y-2 text-text-primary">
                                            <p>Tu pedido será confirmado por nuestro personal en breve.</p>
                                            <p className="font-bold text-amber-700 bg-amber-500/10 p-2 rounded-md">Luego, acércate a caja para pagar y recoger tu pedido.</p>
                                        </div>
                                    )}
                                </>
                           )}
                           {paymentMethod === 'yape/plin' && (
                                <div className="text-center">
                                     {orderType === 'retiro' && <p className="font-bold mb-2 text-text-primary">¡Paga ahora y tu pedido pasará directo a cocina!</p>}
                                    <p className="font-bold mb-2 text-text-primary">Escanea para pagar:</p>
                                    <img src={yapePlinInfo.qrUrl} alt="QR Code" className="mx-auto rounded-lg w-32 h-32 mb-2"/>
                                    <p className="text-text-secondary">A nombre de: <span className="font-semibold text-text-primary">{yapePlinInfo.nombre}</span></p>
                                    <p className="text-text-secondary">Teléfono: <span className="font-semibold text-text-primary">{yapePlinInfo.telefono}</span></p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-auto pt-6 grid grid-cols-2 gap-4">
                        <button onClick={() => setStage('catalog')} className="w-full bg-text-primary/10 hover:bg-text-primary/20 text-text-primary font-bold py-3 px-6 rounded-xl transition-colors">Volver</button>
                        <button onClick={handlePlaceOrder} disabled={cart.length === 0} className="w-full bg-primary text-white font-bold py-3 px-6 rounded-xl disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5">Confirmar Pedido</button>
                    </div>
                </div>
             </div>
         </div>
    );
    
    const renderConfirmation = () => {
        let confirmationMessage = '';
        let titleMessage = '¡Pedido Recibido!';
        
        const isRiskyRetiro = orderType === 'retiro' && (paymentMethod === 'efectivo' || paymentMethod === 'tarjeta');
        if (isRiskyRetiro) {
            titleMessage = '¡Pedido en Espera!';
            confirmationMessage = `Estaremos validando tu pedido en breve. Recibirás una notificación cuando sea confirmado y comience a prepararse.`;
        } else {
             switch (orderType) {
                case 'delivery':
                    confirmationMessage = `Lo estaremos entregando en tu dirección en aproximadamente 30 minutos.`;
                    break;
                case 'retiro':
                    confirmationMessage = `Puedes pasar a recogerlo en aproximadamente 15 minutos. ¡Te notificaremos cuando esté listo!`;
                    break;
            }
        }


        return (
            <div className="bg-surface rounded-3xl shadow-2xl border border-text-primary/5 p-12 max-w-2xl mx-auto text-center animate-fade-in-scale">
                <CheckCircleIcon className="h-20 w-20 text-primary mx-auto mb-6" />
                <h2 className="text-4xl font-heading font-bold text-text-primary mb-3">{titleMessage}</h2>
                <p className="text-text-secondary text-lg mb-6">Gracias por tu compra. Tu número de referencia es <span className="font-bold text-primary">{newOrderId}</span>.</p>
                <p className="text-text-secondary">{confirmationMessage}</p>
                <button onClick={() => setStage('selection')} className="mt-8 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg shadow-primary/20 hover:shadow-primary/40">Hacer otro Pedido</button>
            </div>
        );
    };

    const isCatalogStage = stage === 'catalog' || stage === 'checkout';

    return (
        <div className="min-h-screen flex flex-col font-sans bg-background text-text-primary">
            {isSauceModalOpen && <SauceModal product={currentProduct} onClose={handleCloseSauceModal} onConfirm={handleConfirmSauces} />}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow flex flex-col">
                <header className={`flex justify-between items-center ${isCatalogStage ? 'mb-6' : ''}`}>
                     { isCatalogStage ? (
                        <div>
                            <button onClick={() => { setStage('selection'); setCart([]) }} aria-label="Volver a la selección de tipo de pedido">
                               <Logo className="h-10 w-auto" />
                            </button>
                        </div>
                     ) : (
                        <div/>
                     )}
                </header>
                <main className={`flex-grow flex items-center justify-center ${stage !== 'catalog' ? 'flex-col' : 'items-start'}`}>
                    {stage === 'selection' && renderSelectionScreen()}
                    {stage === 'catalog' && renderCatalog()}
                    {stage === 'checkout' && renderCheckout()}
                    {stage === 'confirmation' && renderConfirmation()}
                </main>
            </div>
             <footer className="text-center py-4 border-t border-text-primary/5 mt-auto">
                <button onClick={onNavigateToAdmin} className="text-sm text-text-secondary/80 hover:text-primary hover:underline transition-colors">
                    Acceso Admin
                </button>
            </footer>

            {isCatalogStage && (
                <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
                    <button onClick={() => cart.length > 0 ? setStage('checkout') : null} className="relative bg-text-primary text-white rounded-2xl px-6 py-4 shadow-2xl transition-transform transform hover:scale-105 flex items-center space-x-3">
                        <ShoppingBagIcon className="h-6 w-6" />
                        <span className="font-bold">Ver Pedido</span>
                        <span className="font-mono text-lg">S/.{total.toFixed(2)}</span>
                        {cartItemCount > 0 && <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-text-primary">{cartItemCount}</span>}
                    </button>
                </div>
            )}
        </div>
    );
};
export default CustomerView;