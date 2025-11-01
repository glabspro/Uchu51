import React, { useState, useMemo, useEffect } from 'react';
import type { Pedido, Producto, ProductoPedido, Cliente, Salsa, TipoPedido, MetodoPago, Theme, ClienteLeal, LoyaltyProgram, Promocion } from '../types';
import { ShoppingBagIcon, TrashIcon, CheckCircleIcon, TruckIcon, UserIcon, CashIcon, CreditCardIcon, DevicePhoneMobileIcon, MapPinIcon, SearchIcon, AdjustmentsHorizontalIcon, MinusIcon, PlusIcon, StarIcon, SunIcon, MoonIcon, ChevronLeftIcon, ChevronRightIcon, WhatsAppIcon, ArrowDownOnSquareIcon, ArrowUpOnSquareIcon, EllipsisVerticalIcon, XMarkIcon, SparklesIcon } from './icons';
import SauceModal from './SauceModal';
import ProductDetailModal from './ProductDetailModal';
import { yapePlinInfo } from '../constants';
import { Logo } from './Logo';


interface CustomerViewProps {
    products: Producto[];
    customers: ClienteLeal[];
    loyaltyPrograms: LoyaltyProgram[];
    promotions: Promocion[];
    onPlaceOrder: (order: Omit<Pedido, 'id' | 'fecha' | 'turno' | 'historial' | 'areaPreparacion' | 'estado'>) => void;
    onNavigateToAdmin: () => void;
    theme: Theme;
    onToggleTheme: () => void;
    installPrompt: any;
    onInstallClick: () => void;
}

type CartItem = ProductoPedido & { cartItemId: number };
type Stage = 'selection' | 'catalog' | 'checkout' | 'confirmation';
type FormErrors = {
    nombre?: string;
    telefono?: string;
    direccion?: string;
    pagoConEfectivo?: string;
};
type PaymentChoice = 'payNow' | 'payLater';

const CustomerView: React.FC<CustomerViewProps> = ({ products, customers, loyaltyPrograms, promotions, onPlaceOrder, onNavigateToAdmin, theme, onToggleTheme, installPrompt, onInstallClick }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [orderType, setOrderType] = useState<TipoPedido | null>(null);
    const [customerInfo, setCustomerInfo] = useState<Cliente>({ nombre: '', telefono: '' });
    const [stage, setStage] = useState<Stage>('selection');
    const [newOrderId, setNewOrderId] = useState('');
    const [activeCategory, setActiveCategory] = useState('Hamburguesas');
    const [paymentMethod, setPaymentMethod] = useState<MetodoPago>('efectivo');
    const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>('payNow');
    const [showInstallInstructions, setShowInstallInstructions] = useState(false);
    const [showPromosModal, setShowPromosModal] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [cashPaymentAmount, setCashPaymentAmount] = useState('');
    const [isExactCash, setIsExactCash] = useState(false);
    const [orderNotes, setOrderNotes] = useState('');
    
    const [editingCartItemForSauces, setEditingCartItemForSauces] = useState<CartItem | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);

    const [isLocating, setIsLocating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showGoBackConfirm, setShowGoBackConfirm] = useState(false);

    const [isStandalone, setIsStandalone] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);

    const [loyalCustomer, setLoyalCustomer] = useState<ClienteLeal | null>(null);
    const [isCartAnimating, setIsCartAnimating] = useState(false);
    const [promosShownThisLoad, setPromosShownThisLoad] = useState(false);

    const activeProgram = useMemo(() => loyaltyPrograms.find(p => p.isActive), [loyaltyPrograms]);
    const activePromotions = useMemo(() => promotions.filter(p => p.isActive), [promotions]);

    const nextSlide = () => {
        setCurrentSlide(prev => (prev === activePromotions.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentSlide(prev => (prev === 0 ? activePromotions.length - 1 : prev - 1));
    };

    useEffect(() => {
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));
        setIsAndroid(/android/.test(userAgent));
    }, []);

    useEffect(() => {
        if (customerInfo.telefono && /^\d{9}$/.test(customerInfo.telefono)) {
            const found = customers.find(c => c.telefono === customerInfo.telefono);
            if (found) {
                setLoyalCustomer(found);
                if (!customerInfo.nombre) {
                    setCustomerInfo(prev => ({ ...prev, nombre: found.nombre }));
                }
            } else {
                setLoyalCustomer(null);
            }
        } else {
            setLoyalCustomer(null);
        }
    }, [customerInfo.telefono, customers]);

    useEffect(() => {
        // Show promos modal once on page load if available, instead of only once per session.
        if (!promosShownThisLoad && activePromotions.length > 0) {
            setShowPromosModal(true);
            setPromosShownThisLoad(true);
        }
    }, [activePromotions, promosShownThisLoad]);

    const getPromoImageUrl = (promo: Promocion, allProducts: Producto[]): string | undefined => {
        // Prioritize the image URL set directly on the promotion object.
        if (promo.imagenUrl && promo.imagenUrl.trim() !== '') {
            return promo.imagenUrl;
        }

        // If no image is on the promotion, fall back to the main product's image.
        let productId: string | undefined;

        if (promo.tipo === 'combo_fijo' && promo.condiciones.productos && promo.condiciones.productos.length > 0) {
            productId = promo.condiciones.productos[0].productoId;
        } else if (promo.tipo === 'dos_por_uno') {
            productId = promo.condiciones.productoId_2x1;
        }

        if (productId) {
            const product = allProducts.find(p => p.id === productId);
            return product?.imagenUrl;
        }

        return undefined; // No image found
    };


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

    const filteredProducts = useMemo(() => {
        if (!searchTerm) {
            return groupedProducts[activeCategory] || [];
        }
        return products.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, searchTerm, activeCategory, groupedProducts]);

    const categories = useMemo(() => {
        const productCategories = Object.keys(groupedProducts);
        return activePromotions.length > 0 ? ['Promociones', ...productCategories] : productCategories;
    }, [groupedProducts, activePromotions]);
    
    useEffect(() => {
        setActiveCategory(activePromotions.length > 0 ? 'Promociones' : 'Hamburguesas');
    }, [activePromotions]);


    const total = useMemo(() =>
        cart.reduce((sum, item) => {
            const itemTotal = item.precio * item.cantidad;
            const saucesTotal = (item.salsas || []).reduce((sauceSum, sauce) => sauceSum + sauce.precio, 0) * item.cantidad;
            return sum + itemTotal + saucesTotal;
        }, 0),
    [cart]);

    const cartItemCount = useMemo(() => cart.reduce((sum, p) => sum + p.cantidad, 0), [cart]);

    const updateQuantity = (cartItemId: number, quantity: number) => {
         setCart(currentCart => {
             if (quantity <= 0) {
                 return currentCart.filter(item => item.cartItemId !== cartItemId);
             }
             return currentCart.map(item => item.cartItemId === cartItemId ? {...item, cantidad: quantity} : item);
         });
    };

    const handleAddToCart = (itemToAdd: Omit<CartItem, 'cartItemId'>) => {
        const getSauceKey = (salsaList: Salsa[] = []) => salsaList.map(s => s.nombre).sort().join(',');
        const newSauceKey = getSauceKey(itemToAdd.salsas);

        const existingItem = cart.find(item => item.id === itemToAdd.id && getSauceKey(item.salsas) === newSauceKey && !item.promocionId);
        
        if (existingItem) {
            updateQuantity(existingItem.cartItemId, existingItem.cantidad + itemToAdd.cantidad);
        } else {
            setCart(prev => [...prev, { ...itemToAdd, cartItemId: Date.now() }]);
        }
    };
    
    const handleAddToCartWithAnimation = (item: Omit<ProductoPedido, 'cartItemId' | 'sentToKitchen'>, imageElement: HTMLImageElement | null) => {
        const ANIMATION_DURATION = 600;

        const cartButton = document.getElementById('cart-button');

        if (imageElement && cartButton) {
            const rect = imageElement.getBoundingClientRect();
            const cartRect = cartButton.getBoundingClientRect();
            
            const flyingImage = document.createElement('img');
            flyingImage.src = imageElement.src;
            flyingImage.style.position = 'fixed';
            flyingImage.style.left = `${rect.left}px`;
            flyingImage.style.top = `${rect.top}px`;
            flyingImage.style.width = `${rect.width}px`;
            flyingImage.style.height = `${rect.height}px`;
            flyingImage.style.borderRadius = '0.75rem';
            flyingImage.style.zIndex = '110';
            flyingImage.style.transition = `left ${ANIMATION_DURATION}ms ease-in-out, top ${ANIMATION_DURATION}ms ease-in-out, transform ${ANIMATION_DURATION}ms ease-in-out, opacity ${ANIMATION_DURATION}ms ease-in-out`;
            flyingImage.style.objectFit = 'cover';

            document.body.appendChild(flyingImage);

            requestAnimationFrame(() => {
                flyingImage.style.left = `${cartRect.left + cartRect.width / 2 - 10}px`;
                flyingImage.style.top = `${cartRect.top + cartRect.height / 2 - 10}px`;
                flyingImage.style.transform = 'scale(0.1)';
                flyingImage.style.opacity = '0';
            });
            
            setTimeout(() => {
                handleAddToCart(item);
                setIsCartAnimating(true);
                setSelectedProduct(null);
                setTimeout(() => flyingImage.remove(), 100);
            }, ANIMATION_DURATION - 100);

            setTimeout(() => {
                setIsCartAnimating(false);
            }, ANIMATION_DURATION + 300);

        } else {
            handleAddToCart(item);
            setSelectedProduct(null);
        }
    };


    const handleAddPromotionToCart = (promo: Promocion) => {
        let itemsToAdd: CartItem[] = [];
        const promoId = promo.id;

        if (promo.tipo === 'combo_fijo' && promo.condiciones.productos) {
            const totalOriginalPrice = promo.condiciones.productos.reduce((sum, comboProd) => {
                const productInfo = products.find(p => p.id === comboProd.productoId);
                return sum + (productInfo ? productInfo.precio * comboProd.cantidad : 0);
            }, 0);

            const discountRatio = (promo.condiciones.precioFijo ?? totalOriginalPrice) / (totalOriginalPrice || 1);

            promo.condiciones.productos.forEach(comboProd => {
                const productInfo = products.find(p => p.id === comboProd.productoId);
                if (productInfo) {
                    for (let i = 0; i < comboProd.cantidad; i++) {
                        itemsToAdd.push({
                            id: productInfo.id,
                            cartItemId: Date.now() + Math.random(),
                            nombre: productInfo.nombre,
                            cantidad: 1,
                            precio: productInfo.precio * discountRatio,
                            precioOriginal: productInfo.precio,
                            imagenUrl: productInfo.imagenUrl,
                            salsas: [],
                            promocionId: promoId
                        });
                    }
                }
            });
        } else if (promo.tipo === 'dos_por_uno' && promo.condiciones.productoId_2x1) {
            const productInfo = products.find(p => p.id === promo.condiciones.productoId_2x1);
            if (productInfo) {
                itemsToAdd.push({
                    id: productInfo.id,
                    cartItemId: Date.now() + Math.random(),
                    nombre: productInfo.nombre,
                    cantidad: 1,
                    precio: productInfo.precio,
                    precioOriginal: productInfo.precio,
                    imagenUrl: productInfo.imagenUrl,
                    salsas: [],
                    promocionId: promoId
                });
                itemsToAdd.push({
                    id: productInfo.id,
                    cartItemId: Date.now() + Math.random(),
                    nombre: productInfo.nombre,
                    cantidad: 1,
                    precio: 0,
                    precioOriginal: productInfo.precio,
                    imagenUrl: productInfo.imagenUrl,
                    salsas: [],
                    promocionId: promoId
                });
            }
        }
        
        if (itemsToAdd.length > 0) {
            setCart(currentCart => [...currentCart, ...itemsToAdd]);
        }
    };

    const handleConfirmEditSauces = (salsas: Salsa[]) => {
        if (!editingCartItemForSauces) return;
        setCart(prevCart => prevCart.map(item =>
            item.cartItemId === editingCartItemForSauces.cartItemId
            ? { ...item, salsas }
            : item
        ));
        setEditingCartItemForSauces(null);
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
        if (paymentChoice === 'payLater' && paymentMethod === 'efectivo' && !isExactCash) {
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
        
        const effectivePaymentMethod = paymentChoice === 'payNow' ? 'yape' : paymentMethod;

        const newOrder: Omit<Pedido, 'id' | 'fecha' | 'turno' | 'historial' | 'areaPreparacion' | 'estado'> = {
            tipo: orderType,
            cliente: customerInfo,
            productos: finalCart,
            total: total,
            metodoPago: effectivePaymentMethod,
            pagoConEfectivo: (paymentChoice === 'payLater' && paymentMethod === 'efectivo' && !isExactCash) ? parseFloat(cashPaymentAmount) : undefined,
            pagoExacto: (paymentChoice === 'payLater' && paymentMethod === 'efectivo' && isExactCash) ? true : undefined,
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

     const handleGoBack = () => {
        if (cart.length > 0 && stage !== 'selection') {
            setShowGoBackConfirm(true);
        } else {
            setOrderType(null);
            setStage('selection');
        }
    };

    const confirmGoBack = () => {
        setCart([]);
        setOrderType(null);
        setStage('selection');
        setShowGoBackConfirm(false);
    };

    const handleSmartInstallClick = () => {
        if (installPrompt) {
            onInstallClick();
        } else {
            setShowInstallInstructions(true);
        }
    };

    const showInstallButton = (isIOS || isAndroid) && !isStandalone;

    const renderInstallInstructions = () => (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4 animate-fade-in-scale">
             <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full text-center relative">
                 <button onClick={() => setShowInstallInstructions(false)} className="absolute top-2 right-2 p-2 rounded-full hover:bg-text-primary/10 dark:hover:bg-slate-700">
                    <XMarkIcon className="h-6 w-6 text-text-secondary dark:text-slate-400" />
                 </button>
                 <h3 className="text-xl font-heading font-bold text-text-primary dark:text-white mb-4">Instalar Uchu51</h3>
                 {isIOS && (
                     <div className="space-y-3 text-left">
                         <p>1. Presiona el botón de **Compartir** en tu navegador.</p>
                         <div className="flex justify-center my-2"><ArrowUpOnSquareIcon className="h-10 w-10 text-primary" /></div>
                         <p>2. Desliza hacia arriba y busca la opción **"Agregar a la pantalla de inicio"**.</p>
                         <p>3. ¡Listo! La app aparecerá en tu teléfono.</p>
                     </div>
                 )}
                 {isAndroid && (
                     <div className="space-y-3 text-left">
                         <p>1. Presiona el botón de **menú** (tres puntos) en tu navegador.</p>
                         <div className="flex justify-center my-2"><EllipsisVerticalIcon className="h-10 w-10 text-primary" /></div>
                         <p>2. Busca y presiona la opción **"Agregar a la pantalla de inicio"**.</p>
                         <p>3. ¡Listo! La app aparecerá en tu teléfono.</p>
                     </div>
                 )}
            </div>
        </div>
    );
    
    const renderPromosModal = () => (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4 animate-fade-in-scale">
            <div className="bg-transparent rounded-2xl max-w-sm w-full text-center relative">
                <button onClick={() => setShowPromosModal(false)} className="absolute -top-10 right-0 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors z-20">
                    <XMarkIcon className="h-6 w-6 text-white" />
                </button>
                
                <div className="overflow-hidden relative rounded-2xl shadow-2xl">
                    <div className="flex transition-transform ease-out duration-500" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                        {activePromotions.map((promo) => {
                            const imageUrl = getPromoImageUrl(promo, products);
                            return (
                                <div key={promo.id} className="w-full flex-shrink-0 min-h-[400px] flex flex-col justify-between relative text-white p-6">
                                    {imageUrl && <img src={imageUrl} alt={promo.nombre} className="absolute inset-0 w-full h-full object-cover z-0" />}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                                    <div className="relative z-20 flex flex-col h-full justify-end text-left">
                                        <SparklesIcon className="h-8 w-8 text-white/80 mb-2" />
                                        <h3 className="text-2xl font-heading font-bold mb-1">{promo.nombre}</h3>
                                        <p className="text-sm opacity-90 mb-4 flex-grow">{promo.descripcion}</p>
                                        {promo.tipo === 'combo_fijo' && promo.condiciones.precioFijo &&
                                            <p className="text-3xl font-heading font-extrabold mb-4">S/.{promo.condiciones.precioFijo.toFixed(2)}</p>
                                        }
                                        <button 
                                           onClick={() => { 
                                               handleAddPromotionToCart(promo); 
                                               setShowPromosModal(false);
                                               if (stage === 'selection') {
                                                   setOrderType('retiro');
                                               }
                                               setStage('checkout');
                                           }} 
                                           className="bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-8 rounded-lg transition-all backdrop-blur-sm mt-auto w-full"
                                       >
                                            ¡Lo quiero!
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {activePromotions.length > 1 && (
                        <>
                            <button onClick={prevSlide} className="absolute top-1/2 left-2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 transition-colors rounded-full z-30">
                                <ChevronLeftIcon className="h-6 w-6 text-white" />
                            </button>
                            <button onClick={nextSlide} className="absolute top-1/2 right-2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 transition-colors rounded-full z-30">
                                <ChevronRightIcon className="h-6 w-6 text-white" />
                            </button>
                        </>
                    )}
                </div>

                {activePromotions.length > 1 && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                        {activePromotions.map((_, i) => (
                            <div key={i} onClick={() => setCurrentSlide(i)} className={`w-2 h-2 rounded-full cursor-pointer transition-all ${currentSlide === i ? 'bg-white scale-125' : 'bg-white/50'}`}></div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderSelectionScreen = () => (
        <div className="text-center w-full max-w-md mx-auto animate-fade-in-up flex flex-col justify-between h-full p-4">
            <div className="w-full flex justify-between items-center pt-4">
                <Logo className="h-9 w-auto" variant={theme === 'dark' ? 'light' : 'default'} />
                <button onClick={onToggleTheme} className="flex items-center justify-center h-10 w-10 rounded-full text-text-secondary dark:text-slate-400 hover:bg-surface dark:hover:bg-slate-800 hover:text-primary dark:hover:text-amber-400 transition-colors">
                    {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
                </button>
            </div>
            
            <div className="flex-grow flex flex-col items-center justify-center">
                <h1 className="font-heading text-4xl font-extrabold text-text-primary dark:text-white mb-3">El sabor que te mueve</h1>
                <p className="text-base text-text-secondary dark:text-slate-400 mb-8 max-w-sm">Pide tu comida favorita, preparada al momento con los mejores ingredientes. Rápido, fresco y delicioso.</p>
                
                <div className="space-y-4 w-full">
                    <button onClick={() => handleSelectOrderType('retiro')} className="group bg-surface dark:bg-slate-800 p-6 rounded-xl border border-text-primary/10 dark:border-slate-700 hover:shadow-xl hover:border-primary/50 dark:hover:border-primary hover:-translate-y-1 transition-all duration-300 w-full text-left flex items-center space-x-4 active:scale-95">
                        <div className="bg-primary/10 p-3 rounded-lg"><ShoppingBagIcon className="h-8 w-8 text-primary"/></div>
                        <div>
                            <h3 className="text-lg font-heading font-bold text-text-primary dark:text-white">Para Llevar</h3>
                            <p className="text-sm text-text-secondary dark:text-slate-400">Pide y recoge en tienda sin esperas.</p>
                        </div>
                    </button>
                    <button onClick={() => handleSelectOrderType('delivery')} className="group bg-surface dark:bg-slate-800 p-6 rounded-xl border border-text-primary/10 dark:border-slate-700 hover:shadow-xl hover:border-primary/50 dark:hover:border-primary hover:-translate-y-1 transition-all duration-300 w-full text-left flex items-center space-x-4 active:scale-95">
                        <div className="bg-primary/10 p-3 rounded-lg"><TruckIcon className="h-8 w-8 text-primary"/></div>
                        <div>
                            <h3 className="text-lg font-heading font-bold text-text-primary dark:text-white">Delivery</h3>
                            <p className="text-sm text-text-secondary dark:text-slate-400">Te lo llevamos caliente a tu casa.</p>
                        </div>
                    </button>
                    {showInstallButton && (
                        <button onClick={handleSmartInstallClick} className="group bg-text-primary dark:bg-slate-700 p-4 rounded-xl border border-text-primary/10 dark:border-slate-600 hover:shadow-xl hover:border-primary/50 dark:hover:border-primary hover:-translate-y-1 transition-all duration-300 w-full text-left flex items-center space-x-4 active:scale-95">
                            <div className="bg-white/10 p-3 rounded-lg"><ArrowDownOnSquareIcon className="h-8 w-8 text-white"/></div>
                            <div>
                                <h3 className="text-lg font-heading font-bold text-white">Instalar App</h3>
                                <p className="text-sm text-slate-300">Añade Uchu51 a tu pantalla de inicio.</p>
                            </div>
                        </button>
                    )}
                </div>
            </div>

            <div />
        </div>
    );

    const renderCatalog = () => (
        <div className="w-full animate-fade-in-up">
            <div className="sticky top-0 bg-background/80 dark:bg-slate-900/80 backdrop-blur-lg z-20 pt-4 pb-4">
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                    <div className="relative flex-grow">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary/50 dark:text-slate-500" />
                        <input type="search" placeholder="Buscar comida..." value={searchTerm} onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if(e.target.value) setActiveCategory('');
                            else setActiveCategory('Promociones');
                        }} className="w-full bg-surface dark:bg-slate-800 border border-text-primary/10 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-primary transition dark:text-white dark:placeholder-slate-400" />
                    </div>
                     <button className="md:flex-shrink-0 bg-surface dark:bg-slate-800 border border-text-primary/10 dark:border-slate-700 rounded-xl p-3 flex items-center justify-center transition-transform active:scale-95">
                        <AdjustmentsHorizontalIcon className="h-6 w-6 text-text-primary dark:text-slate-200" />
                    </button>
                </div>
                 <div className="mt-4">
                    <div className="flex items-center space-x-2 overflow-x-auto pb-2 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
                        {categories.map(category => (
                            <button 
                                key={category} 
                                onClick={() => {
                                    setActiveCategory(category)
                                    setSearchTerm('');
                                }}
                                className={`whitespace-nowrap py-2 px-5 rounded-full font-semibold text-sm transition-all duration-200 focus:outline-none border-2 active:scale-95 ${
                                    activeCategory === category 
                                        ? 'bg-primary text-white border-primary' 
                                        : 'bg-surface dark:bg-slate-800 text-text-primary dark:text-slate-200 border-text-primary/10 dark:border-slate-700 hover:bg-background dark:hover:bg-slate-700 hover:border-text-primary/20'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 mt-4">
                 {activeCategory === 'Promociones' && !searchTerm ? (
                    activePromotions.map((promo, i) => {
                        const imageUrl = getPromoImageUrl(promo, products);
                        return (
                            <button key={promo.id} onClick={() => { handleAddPromotionToCart(promo); setStage('checkout'); }} className={`product-card bg-surface dark:bg-slate-800 rounded-2xl border border-primary/20 dark:border-orange-500/30 overflow-hidden flex group p-4 animate-fade-in-up w-full text-left`} style={{'--delay': `${i * 30}ms`} as React.CSSProperties}>
                                 <div className="flex-grow flex flex-col">
                                     <h3 className="text-lg font-heading font-bold text-primary dark:text-orange-400 leading-tight flex items-center gap-2"><SparklesIcon className="h-5 w-5"/>{promo.nombre}</h3>
                                     <p className="text-sm text-text-secondary dark:text-slate-400 mt-1 line-clamp-2 mb-2 flex-grow">{promo.descripcion}</p>
                                     <div className="flex justify-between items-center mt-2">
                                         <p className="text-xl font-heading font-extrabold text-text-primary dark:text-white">{promo.tipo === 'combo_fijo' ? `S/.${promo.condiciones.precioFijo?.toFixed(2)}` : '¡Ofertón!'}</p>
                                         <div className="flex items-center gap-2 bg-primary rounded-lg text-white font-semibold px-4 py-2 group-hover:bg-primary-dark transition-all duration-300 shadow-lg group-hover:shadow-primary/30 transform group-hover:scale-105 active:scale-95">
                                             <PlusIcon className="h-5 w-5" /> Añadir
                                         </div>
                                     </div>
                                 </div>
                                 {imageUrl && (
                                    <div className="h-28 w-28 overflow-hidden rounded-xl ml-4 flex-shrink-0 relative">
                                        <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" src={imageUrl} alt={promo.nombre} />
                                    </div>
                                 )}
                            </button>
                        );
                    })
                ) : filteredProducts.length > 0 ? filteredProducts.map((product, i) => (
                   <button key={product.id} onClick={() => setSelectedProduct(product)} disabled={product.stock <= 0} className={`product-card bg-surface dark:bg-slate-800 rounded-2xl border border-text-primary/5 dark:border-slate-700 overflow-hidden flex group p-4 animate-fade-in-up w-full text-left ${product.stock <= 0 ? 'opacity-60' : ''}`} style={{'--delay': `${i * 30}ms`} as React.CSSProperties}>
                        <div className="flex-grow">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="text-lg font-heading font-bold text-text-primary dark:text-slate-100 leading-tight">{product.nombre}</h3>
                                <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                                    <StarIcon className="h-4 w-4 text-accent"/>
                                    <span className="text-sm font-semibold text-text-secondary dark:text-slate-400">4.8</span>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary dark:text-slate-400 mt-1 line-clamp-2 mb-2">{product.descripcion}</p>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-xl font-heading font-extrabold text-text-primary dark:text-white">S/.{product.precio.toFixed(2)}</p>
                                <div className="w-9 h-9 flex items-center justify-center bg-primary rounded-full text-white group-hover:bg-primary-dark transition-all duration-300 shadow-lg group-hover:shadow-primary/30 transform group-hover:scale-110 active:scale-95 group-disabled:bg-gray-400 group-disabled:shadow-none group-disabled:scale-100">
                                    {product.stock > 0 ? <PlusIcon className="h-5 w-5" /> : <XMarkIcon className="h-5 w-5"/>}
                                </div>
                            </div>
                        </div>
                        <div className="h-28 w-28 overflow-hidden rounded-xl ml-4 flex-shrink-0 relative">
                            <img className={`w-full h-full object-cover transition-transform duration-300 ${product.stock > 0 ? 'group-hover:scale-105' : 'filter grayscale'}`} src={product.imagenUrl} alt={product.nombre} />
                            {product.stock <= 0 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl"><span className="bg-danger text-white text-xs font-bold px-2 py-1 rounded">AGOTADO</span></div>}
                        </div>
                    </button>
                )) : (
                     <div className="col-span-full text-center py-16">
                        <p className="text-xl font-semibold text-text-secondary dark:text-slate-400">No se encontraron productos</p>
                        <p className="text-text-secondary/80 dark:text-slate-500">Intenta con otra búsqueda o categoría.</p>
                     </div>
                )}
            </div>
        </div>
    );
    
    const PaymentChoiceButton: React.FC<{
        choice: PaymentChoice;
        label: string;
        description: string;
        currentChoice: PaymentChoice;
        setChoice: (choice: PaymentChoice) => void;
    }> = ({ choice, label, description, currentChoice, setChoice }) => (
        <button
            onClick={() => setChoice(choice)}
            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 w-full ${
                currentChoice === choice
                    ? 'bg-primary/10 border-primary shadow-inner'
                    : 'bg-surface dark:bg-slate-700 border-text-primary/10 dark:border-slate-600 hover:border-primary/50'
            }`}
        >
            <p className={`font-bold text-lg ${currentChoice === choice ? 'text-primary' : 'text-text-primary dark:text-slate-100'}`}>{label}</p>
            <p className="text-sm text-text-secondary dark:text-slate-400">{description}</p>
        </button>
    );

    const renderCheckout = () => (
         <div className="bg-surface dark:bg-slate-800 rounded-3xl shadow-2xl border border-text-primary/5 dark:border-slate-700 p-4 md:p-8 max-w-5xl w-full mx-auto animate-fade-in-scale">
             <h2 className="text-4xl font-heading font-bold text-text-primary dark:text-white mb-8 text-center">Finalizar Pedido</h2>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-background dark:bg-slate-900/50 p-4 md:p-6 rounded-2xl border border-text-primary/5 dark:border-slate-700">
                    <h3 className="text-2xl font-heading font-bold text-text-primary dark:text-white mb-4">Resumen del Pedido</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {cart.length > 0 ? cart.map(item => {
                            const productInfo = products.find(p => p.id === item.id);
                            const unitPriceWithSauces = (item.precioOriginal ?? item.precio) + (item.salsas || []).reduce((sum, s) => sum + s.precio, 0);
                            const itemTotal = item.precio * item.cantidad;
                            const canHaveSauces = (productInfo && !['Bebidas', 'Postres'].includes(productInfo.categoria)) || item.promocionId;
                            
                            return (
                                <div key={item.cartItemId} className="flex items-start">
                                    <img src={item.imagenUrl} alt={item.nombre} className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover mr-4"/>
                                    <div className="flex-grow">
                                        <p className="font-bold text-text-primary dark:text-slate-100 leading-tight">{item.nombre}</p>
                                        {item.salsas && item.salsas.length > 0 && (
                                            <p className="text-xs text-primary/80 dark:text-orange-400/80 italic">
                                                + {item.salsas.map(s => s.nombre).join(', ')}
                                            </p>
                                        )}
                                        {canHaveSauces && (
                                             <button onClick={() => setEditingCartItemForSauces(item)} className="mt-2 text-sm font-bold flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary dark:bg-orange-500/20 dark:hover:bg-orange-500/30 dark:text-orange-300 py-1.5 px-3 rounded-lg transition-colors shadow-sm">
                                                <SparklesIcon className="h-4 w-4" />
                                                {item.salsas && item.salsas.length > 0 ? 'Editar Cremas' : 'Añadir Cremas'}
                                             </button>
                                        )}
                                        <p className="text-sm text-text-secondary dark:text-slate-400 mt-1">S/.{unitPriceWithSauces.toFixed(2)} c/u</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <button onClick={() => updateQuantity(item.cartItemId, item.cantidad - 1)} className="bg-text-primary/10 dark:bg-slate-700 rounded-full h-7 w-7 flex items-center justify-center font-bold text-text-primary dark:text-slate-200 hover:bg-text-primary/20 dark:hover:bg-slate-600 transition-transform active:scale-90">
                                                {item.cantidad > 1 ? <MinusIcon className="h-4 w-4"/> : <TrashIcon className="h-4 w-4 text-danger" />}
                                            </button>
                                            <span className="font-bold w-6 text-center dark:text-slate-200">{item.cantidad}</span>
                                            <button onClick={() => updateQuantity(item.cartItemId, item.cantidad + 1)} className="bg-text-primary/10 dark:bg-slate-700 rounded-full h-7 w-7 flex items-center justify-center font-bold text-text-primary dark:text-slate-200 hover:bg-text-primary/20 dark:hover:bg-slate-600 transition-transform active:scale-90"><PlusIcon className="h-4 w-4"/></button>
                                        </div>
                                    </div>
                                    <div className="w-24 text-right">
                                        <p className="font-bold text-text-primary dark:text-slate-100 text-lg">S/.{itemTotal.toFixed(2)}</p>
                                        {item.precioOriginal != null && item.precio < item.precioOriginal && (
                                            <p className="text-xs text-danger line-through">S/.{(item.precioOriginal * item.cantidad).toFixed(2)}</p>
                                        )}
                                    </div>
                                </div>
                            )
                        }) : <p className="text-text-secondary dark:text-slate-400">Tu carrito está vacío.</p>}
                    </div>
                    <div className="border-t border-text-primary/10 dark:border-slate-700 mt-4 pt-4 flex justify-between items-center text-text-primary dark:text-white">
                        <span className="text-xl font-heading font-bold">TOTAL</span>
                        <span className="text-3xl font-heading font-extrabold text-primary">S/.{total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="bg-background dark:bg-slate-900/50 p-4 md:p-6 rounded-2xl border border-text-primary/5 dark:border-slate-700 flex flex-col">
                    <h3 className="text-2xl font-heading font-bold text-text-primary dark:text-white mb-4">Tus Datos y Pago</h3>
                     <p className="bg-primary/10 text-primary font-semibold p-3 rounded-lg mb-4 text-center">
                        Pedido para: <span className="font-bold">{orderType === 'delivery' ? 'Delivery' : 'Retiro en Tienda'}</span>
                     </p>
                    <div className="space-y-4">
                        <div>
                            <input type="text" placeholder="Nombre (para llamar tu pedido)" value={customerInfo.nombre} onChange={e => setCustomerInfo({...customerInfo, nombre: e.target.value})} className={`bg-surface dark:bg-slate-700 border ${formErrors.nombre ? 'border-danger' : 'border-text-primary/10 dark:border-slate-600'} rounded-lg p-3 w-full text-text-primary dark:text-slate-200 placeholder-text-secondary/70 dark:placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary transition`} />
                            {formErrors.nombre && <p className="text-danger text-xs mt-1">{formErrors.nombre}</p>}
                        </div>
                        <div>
                            <input type="tel" placeholder="Teléfono de Contacto (9 dígitos)" value={customerInfo.telefono} onChange={e => setCustomerInfo({...customerInfo, telefono: e.target.value})} className={`bg-surface dark:bg-slate-700 border ${formErrors.telefono ? 'border-danger' : 'border-text-primary/10 dark:border-slate-600'} rounded-lg p-3 w-full text-text-primary dark:text-slate-200 placeholder-text-secondary/70 dark:placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary transition`} />
                            {formErrors.telefono && <p className="text-danger text-xs mt-1">{formErrors.telefono}</p>}
                        </div>
                        {loyalCustomer && activeProgram && (
                            <div className="bg-primary/10 text-primary dark:text-orange-300 p-4 rounded-lg animate-fade-in-up space-y-3">
                                <div className='flex justify-between items-center'>
                                    <div>
                                        <p className="font-bold">¡Hola de nuevo, {loyalCustomer.nombre}!</p>
                                        <p>Tienes <span className="font-extrabold text-lg">{loyalCustomer.puntos}</span> Puntos</p>
                                    </div>
                                    <StarIcon className="h-8 w-8 text-primary"/>
                                </div>
                                <div className="border-t border-primary/20 pt-3">
                                    <p className="font-bold text-sm mb-2">Mis Recompensas</p>
                                    <div className="space-y-2">
                                        {activeProgram.rewards.map(reward => {
                                            const progress = Math.min((loyalCustomer.puntos / reward.puntosRequeridos) * 100, 100);
                                            const canRedeem = progress >= 100;
                                            return (
                                                <div key={reward.id}>
                                                    <div className="flex justify-between items-center text-xs font-semibold mb-1">
                                                        <span>{reward.nombre}</span>
                                                        <span className={canRedeem ? 'text-primary' : 'text-primary/70'}>{loyalCustomer.puntos}/{reward.puntosRequeridos} pts</span>
                                                    </div>
                                                    <div className="w-full bg-primary/20 rounded-full h-2">
                                                        <div className={`bg-primary rounded-full h-2 ${canRedeem ? 'animate-pulse' : ''}`} style={{ width: `${progress}%` }}></div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                        {orderType === 'delivery' && (
                            <div>
                                <div className="relative flex items-center">
                                    <input 
                                        type="text" 
                                        placeholder="Dirección de Entrega" 
                                        value={customerInfo.direccion || ''} 
                                        onChange={e => setCustomerInfo({...customerInfo, direccion: e.target.value})} 
                                        className={`bg-surface dark:bg-slate-700 border ${formErrors.direccion ? 'border-danger' : 'border-text-primary/10 dark:border-slate-600'} rounded-lg p-3 w-full text-text-primary dark:text-slate-200 placeholder-text-secondary/70 dark:placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary transition pr-12`} 
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGetCurrentLocation}
                                        disabled={isLocating}
                                        className="absolute top-1/2 right-2 -translate-y-1/2 text-primary hover:text-primary-dark disabled:opacity-50 disabled:cursor-wait p-1.5 rounded-full hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
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
                            <textarea placeholder="Notas adicionales para tu pedido (ej. sin ají, tocar intercom...)" value={orderNotes} onChange={e => setOrderNotes(e.target.value)} className="bg-surface dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-lg p-3 w-full text-text-primary dark:text-slate-200 placeholder-text-secondary/70 dark:placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary transition" rows={2} />
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                           <PaymentChoiceButton choice="payNow" label="Pagar Ahora (Recomendado)" description="Con Yape/Plin para agilizar tu pedido." currentChoice={paymentChoice} setChoice={setPaymentChoice} />
                           <PaymentChoiceButton choice="payLater" label={orderType === 'delivery' ? 'Pago Contraentrega' : 'Pagar en Tienda'} description="Paga con efectivo o tarjeta al recibir." currentChoice={paymentChoice} setChoice={setPaymentChoice} />
                        </div>

                         <div className="mt-3 p-3 bg-surface/60 dark:bg-slate-700/50 rounded-lg text-sm border border-text-primary/10 dark:border-slate-600 min-h-[180px]">
                           {paymentChoice === 'payNow' ? (
                                <div className="text-center animate-fade-in-right">
                                     <p className="font-bold mb-2 text-text-primary dark:text-slate-200">¡Paga ahora y tu pedido pasará directo a cocina!</p>
                                    <img src={yapePlinInfo.qrUrl} alt="QR Code" className="mx-auto rounded-lg w-24 h-24 mb-2"/>
                                    <p className="text-text-secondary dark:text-slate-400">A nombre de: <span className="font-semibold text-text-primary dark:text-slate-200">{yapePlinInfo.nombre}</span></p>
                                    <p className="text-text-secondary dark:text-slate-400">Teléfono: <span className="font-semibold text-text-primary dark:text-slate-200">{yapePlinInfo.telefono}</span></p>
                                    <p className="mt-2 font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 p-2 rounded-md text-xs">IMPORTANTE: Envía la captura de tu pago a nuestro WhatsApp para confirmar.</p>
                                </div>
                           ) : (
                                <div className="animate-fade-in-right">
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <button onClick={() => setPaymentMethod('efectivo')} className={`flex items-center justify-center space-x-2 w-full p-2 rounded-lg border-2 transition-colors ${paymentMethod === 'efectivo' ? 'border-primary' : 'border-transparent'}`}>
                                            <CashIcon className="h-5 w-5"/><span>Efectivo</span>
                                        </button>
                                         <button onClick={() => setPaymentMethod('tarjeta')} className={`flex items-center justify-center space-x-2 w-full p-2 rounded-lg border-2 transition-colors ${paymentMethod === 'tarjeta' ? 'border-primary' : 'border-transparent'}`}>
                                            <CreditCardIcon className="h-5 w-5"/><span>Tarjeta</span>
                                        </button>
                                    </div>
                                    {paymentMethod === 'efectivo' && (
                                        <div className="space-y-2">
                                            <label className="font-semibold block text-text-primary dark:text-slate-100 text-xs">¿Con cuánto pagarás?</label>
                                            <label className="flex items-center space-x-2 bg-surface/70 dark:bg-slate-600/50 p-2 rounded-lg border border-text-primary/10 dark:border-slate-600 cursor-pointer">
                                                <input type="checkbox" checked={isExactCash} onChange={(e) => setIsExactCash(e.target.checked)} className="h-4 w-4 rounded border-text-primary/20 dark:border-slate-500 text-primary focus:ring-primary bg-transparent dark:bg-slate-800" />
                                                <span className="dark:text-slate-200 text-xs">Pagaré con el monto exacto</span>
                                            </label>
                                            {!isExactCash && (
                                                <input id="cash-amount" type="number" value={cashPaymentAmount} onChange={e => setCashPaymentAmount(e.target.value)} placeholder="Ej: 50" className={`bg-surface dark:bg-slate-700 border ${formErrors.pagoConEfectivo ? 'border-danger' : 'border-text-primary/10 dark:border-slate-600'} rounded-lg p-2 w-full text-text-primary dark:text-slate-200 placeholder-text-secondary/70 dark:placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary transition`} />
                                            )}
                                            {formErrors.pagoConEfectivo && <p className="text-danger text-xs mt-1">{formErrors.pagoConEfectivo}</p>}
                                        </div>
                                    )}
                                     {paymentMethod === 'tarjeta' && (
                                        <p className="font-semibold text-center text-text-primary dark:text-slate-200 pt-8">{orderType === 'delivery' ? 'Llevaremos un POS.' : 'Paga con POS en tienda.'}</p>
                                    )}
                                </div>
                           )}
                        </div>
                    </div>
                    <div className="mt-auto pt-6 grid grid-cols-2 gap-4">
                        <button onClick={() => setStage('catalog')} className="w-full bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-3 px-6 rounded-xl transition-all active:scale-95">Volver</button>
                        <button onClick={handlePlaceOrder} disabled={cart.length === 0} className="w-full bg-primary text-white font-bold py-3 px-6 rounded-xl disabled:bg-gray-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95">Confirmar Pedido</button>
                    </div>
                </div>
             </div>
         </div>
    );
    
    const renderConfirmation = () => {
        let confirmationMessage = '';
        let titleMessage = '¡Pedido Recibido!';
        
        const isPayNow = paymentChoice === 'payNow';
        const isRiskyRetiro = orderType === 'retiro' && paymentChoice === 'payLater';

        let whatsappUrl = '';

        if (isPayNow) {
            titleMessage = '¡Casi Listo! Confirma tu Pago';
            confirmationMessage = `Recibimos tu pedido. Para finalizar, haz clic abajo para enviarnos la captura de tu pago por WhatsApp.`;
            
            const phoneNumber = yapePlinInfo.telefono.replace(/\s/g, '');
            const fullPhoneNumber = `51${phoneNumber}`; // Peru country code
            const message = `Hola Uchu51, acabo de realizar el pedido *${newOrderId}*. En breve comparto la captura del pago. ¡Gracias!`;
            const encodedMessage = encodeURIComponent(message);
            whatsappUrl = `https://wa.me/${fullPhoneNumber}?text=${encodedMessage}`;

        } else if (isRiskyRetiro) {
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
            <div className="bg-surface dark:bg-slate-800 rounded-3xl shadow-2xl border border-text-primary/5 dark:border-slate-700 p-12 max-w-2xl mx-auto text-center animate-fade-in-scale">
                <CheckCircleIcon className="h-20 w-20 text-primary mx-auto mb-6" />
                <h2 className="text-4xl font-heading font-bold text-text-primary dark:text-white mb-3">{titleMessage}</h2>
                <p className="text-text-secondary dark:text-slate-300 text-lg mb-6">Gracias por tu compra. Tu número de referencia es <span className="font-bold text-primary">{newOrderId}</span>.</p>
                <p className="text-text-secondary dark:text-slate-400">{confirmationMessage}</p>
                
                {isPayNow ? (
                    <div className='mt-8 flex flex-col items-center'>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40 active:scale-95 text-lg"
                        >
                            <WhatsAppIcon className="h-6 w-6" />
                            Confirmar por WhatsApp
                        </a>
                        <button onClick={() => setStage('selection')} className="mt-4 bg-transparent text-text-secondary dark:text-slate-400 font-bold py-3 px-8 rounded-xl transition-all hover:bg-text-primary/10 dark:hover:bg-slate-700 active:scale-95">Hacer otro Pedido</button>
                    </div>
                ) : (
                    <button onClick={() => setStage('selection')} className="mt-8 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95">Hacer otro Pedido</button>
                )}
            </div>
        );
    };

    const isCatalogStage = stage === 'catalog' || stage === 'checkout';

    return (
        <div className="min-h-screen flex flex-col font-sans bg-background dark:bg-slate-900 text-text-primary dark:text-slate-200">
            {selectedProduct && (
                <ProductDetailModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    onAddToCart={handleAddToCartWithAnimation}
                />
            )}
            {editingCartItemForSauces && (
                <SauceModal
                    product={products.find(p => p.id === editingCartItemForSauces.id) || null}
                    initialSalsas={editingCartItemForSauces.salsas}
                    onClose={() => setEditingCartItemForSauces(null)}
                    onConfirm={handleConfirmEditSauces}
                />
            )}
            {showInstallInstructions && renderInstallInstructions()}
            {showPromosModal && renderPromosModal()}
            {showGoBackConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4">
                    <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full text-center animate-fade-in-scale">
                        <h3 className="text-xl font-heading font-bold text-text-primary dark:text-white">¿Volver al inicio?</h3>
                        <p className="text-text-secondary dark:text-slate-400 my-3">Tu pedido actual se perderá. ¿Estás seguro que quieres continuar?</p>
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <button onClick={() => setShowGoBackConfirm(false)} className="bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-2 px-4 rounded-lg transition-colors active:scale-95">Cancelar</button>
                            <button onClick={confirmGoBack} className="bg-danger hover:brightness-110 text-white font-bold py-2 px-4 rounded-lg transition-all active:scale-95">Sí, volver</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-0 flex-grow flex flex-col">
                {stage !== 'selection' && (
                    <header className="flex justify-between items-center py-4">
                       <button onClick={handleGoBack} className="flex items-center space-x-2 font-semibold text-text-secondary dark:text-slate-300 hover:text-primary dark:hover:text-orange-400 transition-colors">
                           <ChevronLeftIcon className="h-5 w-5" />
                           <span>Inicio</span>
                       </button>
                        {stage === 'catalog' && orderType && (
                            <div className="flex items-center p-1 bg-surface dark:bg-slate-800 rounded-full border border-text-primary/10 dark:border-slate-700">
                                <button onClick={() => setOrderType('retiro')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${orderType === 'retiro' ? 'bg-primary text-white' : 'text-text-secondary dark:text-slate-300 hover:bg-background dark:hover:bg-slate-700'}`}>Para Llevar</button>
                                <button onClick={() => setOrderType('delivery')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${orderType === 'delivery' ? 'bg-primary text-white' : 'text-text-secondary dark:text-slate-300 hover:bg-background dark:hover:bg-slate-700'}`}>Delivery</button>
                            </div>
                        )}
                        <button onClick={onToggleTheme} className="flex items-center justify-center h-10 w-10 rounded-full text-text-secondary dark:text-slate-400 hover:bg-surface dark:hover:bg-slate-800 hover:text-primary dark:hover:text-amber-400 transition-colors">
                            {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
                        </button>
                    </header>
                )}
                <main className={`flex-grow flex ${stage === 'catalog' ? 'flex-col items-start' : 'items-center justify-center'}`}>
                    {stage === 'selection' && renderSelectionScreen()}
                    {stage === 'catalog' && renderCatalog()}
                    {stage === 'checkout' && renderCheckout()}
                    {stage === 'confirmation' && renderConfirmation()}
                </main>
            </div>
             <footer className="text-center py-4 border-t border-text-primary/5 dark:border-slate-800 mt-auto">
                <button onClick={onNavigateToAdmin} className="text-sm text-text-secondary/80 dark:text-slate-500 hover:text-primary dark:hover:text-orange-400 hover:underline transition-colors">
                    Acceso Admin
                </button>
            </footer>

            {isCatalogStage && (
                 <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 bg-transparent transition-transform ${cart.length === 0 && 'translate-y-full'}`}>
                    <button id="cart-button" onClick={() => cart.length > 0 ? setStage('checkout') : null} className={`w-full max-w-md mx-auto bg-text-primary dark:bg-slate-700 text-white rounded-xl px-6 py-4 shadow-2xl transition-transform transform md:hover:scale-105 active:scale-95 flex items-center justify-between animate-fade-in-up ${isCartAnimating ? 'animate-cart-jiggle' : ''}`}>
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <ShoppingBagIcon className="h-6 w-6" />
                                {cartItemCount > 0 && <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-text-primary dark:border-slate-700">{cartItemCount}</span>}
                            </div>
                            <span className="font-bold">Ver Pedido</span>
                        </div>
                        <span className="font-mono text-lg">S/.{total.toFixed(2)}</span>
                    </button>
                </div>
            )}
        </div>
    );
};
export default CustomerView;