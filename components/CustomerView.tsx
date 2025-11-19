
import React, { useState, useMemo, useEffect } from 'react';
import type { Pedido, Producto, ProductoPedido, Cliente, Salsa, TipoPedido, MetodoPago, Theme, ClienteLeal, LoyaltyProgram, Promocion } from '../types';
import { useAppContext } from '../store';
import { ShoppingBagIcon, TrashIcon, CheckCircleIcon, TruckIcon, UserIcon, CashIcon, CreditCardIcon, DevicePhoneMobileIcon, MapPinIcon, SearchIcon, AdjustmentsHorizontalIcon, MinusIcon, PlusIcon, StarIcon, SunIcon, MoonIcon, ChevronLeftIcon, ChevronRightIcon, WhatsAppIcon, ArrowDownOnSquareIcon, ArrowUpOnSquareIcon, EllipsisVerticalIcon, XMarkIcon, SparklesIcon, HomeIcon, GlobeAltIcon, LockClosedIcon } from './icons';
import SauceModal from './SauceModal';
import ProductDetailModal from './ProductDetailModal';
import { Logo } from './Logo';


interface CustomerViewProps { }

type CartItem = ProductoPedido & { cartItemId: number };
type Stage = 'selection' | 'catalog' | 'checkout' | 'confirmation';
type FormErrors = {
    nombre?: string;
    telefono?: string;
    direccion?: string;
    pagoConEfectivo?: string;
};
type PaymentChoice = 'payNow' | 'payLater';

// Mercadopago Logo Component for this view
const MercadoPagoLogo = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.34 9.32C16.34 9.32 14.28 8.09 12 8.09C9.72 8.09 7.67 9.33 7.67 9.33C7.26 9.58 6.74 9.54 6.39 9.18L4.81 7.6C4.42 7.21 4.42 6.58 4.81 6.19C5.2 5.8 5.83 5.8 6.22 6.19L7.26 7.23C7.26 7.23 8.45 6.54 10.1 6.25V2H13.9V6.24C15.55 6.53 16.74 7.23 16.74 7.23L17.78 6.19C18.17 5.8 18.8 5.8 19.19 6.19C19.58 6.58 19.58 7.21 19.19 7.6L17.61 9.18C17.26 9.53 16.74 9.58 16.34 9.32ZM14.15 13.5C14.15 13.5 13.55 13.25 12 13.25C10.45 13.25 9.85 13.5 9.85 13.5C9.35 13.71 9 14.21 9 14.75V19H15V14.75C15 14.21 14.65 13.71 14.15 13.5ZM22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z" fillOpacity="0" />
        <path d="M12 10.5C14.66 10.5 16.93 11.63 16.93 11.63C17.33 11.89 17.85 11.84 18.2 11.49L19.78 9.91C20.17 9.52 20.17 8.89 19.78 8.5C19.39 8.11 18.76 8.11 18.37 8.5L17.33 9.54C17.33 9.54 16.14 8.84 14.49 8.55V4.31H9.51V8.54C7.86 8.84 6.67 9.53 6.67 9.53L5.63 8.49C5.24 8.1 4.61 8.1 4.22 8.49C3.83 8.88 3.83 9.51 4.22 9.9L5.8 11.48C6.15 11.83 6.67 11.88 7.07 11.62C7.07 11.62 9.34 10.5 12 10.5ZM15 14.75C15 14.21 14.65 13.71 14.15 13.5C14.15 13.5 13.55 13.25 12 13.25C10.45 13.25 9.85 13.5 9.85 13.5C9.35 13.71 9 14.21 9 14.75V19H15V14.75Z" />
    </svg>
);

// FIX: Change to named export to fix import issue
export const CustomerView: React.FC<CustomerViewProps> = () => {
    const { state, dispatch } = useAppContext();
    const { products, customers, loyaltyPrograms, promotions, theme, installPrompt, restaurantSettings } = state;

    const [cart, setCart] = useState<CartItem[]>([]);
    const [orderType, setOrderType] = useState<TipoPedido | null>(null);
    const [customerInfo, setCustomerInfo] = useState<Cliente>({ nombre: '', telefono: '' });
    const [stage, setStage] = useState<Stage>('selection');
    const [newOrderId, setNewOrderId] = useState('');
    const [lastOrderTotal, setLastOrderTotal] = useState(0); // NEW: Store total to display after cart clear
    const [activeCategory, setActiveCategory] = useState('Hamburguesas');
    const [paymentMethod, setPaymentMethod] = useState<MetodoPago>('efectivo');
    const [paymentChoice, setPaymentChoice] = useState<PaymentChoice | null>(null);
    const [showInstallInstructions, setShowInstallInstructions] = useState(false);
    const [showPromosModal, setShowPromosModal] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaymentSimulated, setIsPaymentSimulated] = useState(false);
    const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);

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

    const [logoClickCount, setLogoClickCount] = useState(0);
    const [logoClickTimer, setLogoClickTimer] = useState<number | null>(null);

    const onPlaceOrder = (order: Omit<Pedido, 'id' | 'fecha' | 'turno' | 'historial' | 'areaPreparacion' | 'estado' | 'gananciaEstimada'>) => dispatch({ type: 'SAVE_ORDER', payload: order });
    const onToggleTheme = () => dispatch({ type: 'TOGGLE_THEME' });
    const onInstallClick = () => { if (installPrompt) { installPrompt.prompt(); /* Can't reset prompt from here easily */ }};

    const paymentMethodsEnabled = useMemo(() => {
        const pm = restaurantSettings?.paymentMethods;
        return {
            efectivo: pm?.efectivo !== false,
            tarjeta: pm?.tarjeta !== false,
            yape: pm?.yape?.enabled === true,
            plin: pm?.plin?.enabled === true,
            mercadopago: pm?.mercadopago?.enabled === true,
        }
    }, [restaurantSettings]);

    // Detect if Mercado Pago is the ONLY enabled method
    const isOnlyMercadoPago = useMemo(() => {
        return paymentMethodsEnabled.mercadopago &&
               !paymentMethodsEnabled.efectivo &&
               !paymentMethodsEnabled.tarjeta &&
               !paymentMethodsEnabled.yape &&
               !paymentMethodsEnabled.plin;
    }, [paymentMethodsEnabled]);

    const handleLogoClick = () => {
        if (logoClickTimer) {
            clearTimeout(logoClickTimer);
        }

        const newClickCount = logoClickCount + 1;
        setLogoClickCount(newClickCount);

        if (newClickCount >= 5) {
            dispatch({ type: 'GO_TO_LOGIN' });
            setLogoClickCount(0); // Reset after navigating
        } else {
            const timer = window.setTimeout(() => {
                setLogoClickCount(0); // Reset if not tapped again within 2 seconds
            }, 2000);
            setLogoClickTimer(timer);
        }
    };

    const activeProgram = useMemo(() => loyaltyPrograms.find(p => p.isActive), [loyaltyPrograms]);
    const activePromotions = useMemo(() => promotions.filter(p => p.isActive), [promotions]);

    const nextSlide = () => {
        setCurrentSlide(prev => (prev === activePromotions.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentSlide(prev => (prev === 0 ? activePromotions.length - 1 : prev + 1));
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
    
    const showPayNow = paymentMethodsEnabled.yape || paymentMethodsEnabled.plin || paymentMethodsEnabled.mercadopago;
    const showPayLater = paymentMethodsEnabled.efectivo || paymentMethodsEnabled.tarjeta;

    useEffect(() => {
        // Set an initial choice if not set
        if (isOnlyMercadoPago) {
            setPaymentChoice('payNow');
            setPaymentMethod('mercadopago');
        } else if (paymentChoice === null) {
            if (showPayNow) {
                setPaymentChoice('payNow');
            } else if (showPayLater) {
                setPaymentChoice('payLater');
            }
        }
    }, [showPayNow, showPayLater, paymentChoice, isOnlyMercadoPago]);

    useEffect(() => {
        if (isOnlyMercadoPago) {
            setPaymentMethod('mercadopago');
            return;
        }
        if (paymentChoice === 'payLater') {
            if (paymentMethodsEnabled.efectivo) {
                setPaymentMethod('efectivo');
            } else if (paymentMethodsEnabled.tarjeta) {
                setPaymentMethod('tarjeta');
            }
        }
    }, [paymentChoice, paymentMethodsEnabled, isOnlyMercadoPago]);


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
        
        // Determine the actual online payment method if 'payNow' is selected
        let effectivePaymentMethod: MetodoPago = paymentMethod;

        if (paymentChoice === 'payNow') {
            if (isOnlyMercadoPago) {
                effectivePaymentMethod = 'mercadopago';
            } else {
                if (paymentMethodsEnabled.yape) effectivePaymentMethod = 'yape';
                else if (paymentMethodsEnabled.plin) effectivePaymentMethod = 'plin';
                else if (paymentMethodsEnabled.mercadopago) effectivePaymentMethod = 'mercadopago';
            }
        }

        // Override if specific selection made
        if (paymentChoice === 'payNow' && ['yape', 'plin', 'mercadopago'].includes(paymentMethod)) {
             effectivePaymentMethod = paymentMethod;
        }


        const newOrder: Omit<Pedido, 'id' | 'fecha' | 'turno' | 'historial' | 'areaPreparacion' | 'estado' | 'gananciaEstimada'> = {
            tipo: orderType,
            cliente: customerInfo,
            productos: finalCart,
            total: total,
            metodoPago: effectivePaymentMethod,
            pagoConEfectivo: (paymentChoice === 'payLater' && paymentMethod === 'efectivo' && !isExactCash) ? parseFloat(cashPaymentAmount) : undefined,
            pagoExacto: (paymentChoice === 'payLater' && paymentMethod === 'efectivo' && isExactCash) ? true : undefined,
            notas: orderNotes,
            tiempoEstimado: orderType === 'delivery' ? 30 : 15,
            restaurant_id: state.restaurantId!,
        };
        
        onPlaceOrder(newOrder);
        
        const generatedId = `PED-${String(Date.now()).slice(-4)}`;
        setNewOrderId(generatedId);
        setLastOrderTotal(total); // Store the total before clearing cart
        setStage('confirmation');
        setIsPaymentSimulated(false);
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
            (error: GeolocationPositionError) => {
                let errorMessage = "No se pudo obtener la ubicación. Revisa los permisos y vuelve a intentarlo.";
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Permiso de ubicación denegado. Habilítalo en los ajustes de tu navegador.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "La información de ubicación no está disponible.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Se agotó el tiempo para obtener la ubicación.";
                        break;
                }
                setFormErrors(prev => ({...prev, direccion: errorMessage}));
                setIsLocating(false);
            },
            { timeout: 10000, enableHighAccuracy: true }
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
    
    // New Logic for specific message
    const modules = restaurantSettings?.modules;
    const isOnlyDelivery = modules?.delivery !== false && modules?.retiro === false;

    const renderInstallInstructions = () => (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4 animate-fade-in-scale">
             <div className="bg-surface dark:bg-[#34424D] rounded-2xl shadow-xl p-6 max-w-sm w-full text-center relative">
                 <button onClick={() => setShowInstallInstructions(false)} className="absolute top-2 right-2 p-2 rounded-full hover:bg-text-primary/10 dark:hover:bg-[#45535D]">
                    <XMarkIcon className="h-6 w-6 text-text-secondary dark:text-light-silver" />
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
                                                    // Default to first available order type if not set
                                                    if (modules?.delivery !== false) setOrderType('delivery');
                                                    else if (modules?.retiro !== false) setOrderType('retiro');
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
        <div className="text-center w-full max-w-md mx-auto animate-fade-in-up flex flex-col flex-grow p-4">
            <div className="w-full flex justify-between items-center pt-4">
                <div onClick={handleLogoClick} className="cursor-pointer" title="Acceso de administrador">
                    <Logo className="h-9 w-auto" variant={theme === 'dark' ? 'light' : 'default'} />
                </div>
                <button onClick={onToggleTheme} className="flex items-center justify-center h-10 w-10 rounded-full text-text-secondary dark:text-light-silver hover:bg-surface dark:hover:bg-[#34424D] hover:text-primary dark:hover:text-amber-400 transition-colors">
                    {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
                </button>
            </div>
            
            <div className="flex-grow flex flex-col items-center justify-center">
                <h1 className="font-heading text-4xl font-extrabold text-text-primary dark:text-white mb-3">El sabor que te mueve</h1>
                <p className="text-base text-text-secondary dark:text-light-silver mb-8 max-w-sm">Pide tu comida favorita, preparada al momento.</p>
                
                {isOnlyDelivery && (
                     <div className="w-full bg-primary/10 dark:bg-orange-500/20 p-4 rounded-xl mb-6 text-center border-2 border-primary/20 dark:border-orange-500/30 animate-pulse-glow">
                        <h3 className="text-xl font-heading font-bold text-primary dark:text-orange-300 mb-1">¡Hoy nos quedamos en casa! 🏠</h3>
                        <p className="text-text-secondary dark:text-light-silver text-sm">Disfruta de nuestra sazón sin moverte. Te lo llevamos volando.</p>
                     </div>
                )}

                <div className="w-full space-y-4">
                    {modules?.delivery !== false && (
                         <button onClick={() => handleSelectOrderType('delivery')} className={`w-full bg-primary hover:bg-primary-dark text-white font-bold ${isOnlyDelivery ? 'py-6 text-xl' : 'py-4 text-lg'} px-8 rounded-xl transition-all duration-300 shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2`}>
                            <TruckIcon className={`${isOnlyDelivery ? 'h-8 w-8' : 'h-6 w-6'}`} />
                            Pide por Delivery
                        </button>
                    )}
                   {modules?.retiro !== false && (
                     <button onClick={() => handleSelectOrderType('retiro')} className="w-full bg-text-primary dark:bg-[#45535D] hover:bg-text-primary/90 dark:hover:bg-[#56656E] text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 shadow-lg hover:shadow-text-primary/20 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2">
                        <ShoppingBagIcon className="h-6 w-6" />
                        Para Recoger en Tienda
                    </button>
                   )}
                   {modules?.delivery === false && modules?.retiro === false && (
                       <div className="p-4 text-text-secondary dark:text-light-silver bg-surface dark:bg-gunmetal/50 rounded-lg border border-dashed border-text-primary/20">
                           <p>No hay métodos de pedido disponibles en este momento.</p>
                       </div>
                   )}
                </div>
            </div>

            <div className="pb-4">
                {showInstallButton && (
                    <button onClick={handleSmartInstallClick} className="text-sm font-semibold text-text-secondary dark:text-light-silver hover:text-primary dark:hover:text-orange-400 transition-colors flex items-center justify-center gap-2 mx-auto">
                        <ArrowDownOnSquareIcon className="h-5 w-5" />
                        Instalar app para mejor experiencia
                    </button>
                )}
            </div>
        </div>
    );

    const renderCatalogScreen = () => (
        <div className="flex flex-col h-full">
            <header className="flex-shrink-0 bg-surface/80 dark:bg-[#34424D]/80 backdrop-blur-lg p-4 shadow-sm border-b border-text-primary/5 dark:border-[#45535D] sticky top-0 z-50">
                <div className="flex items-center justify-between">
                    <button onClick={handleGoBack} className="flex items-center font-semibold text-text-secondary dark:text-light-silver hover:text-primary dark:hover:text-orange-400 transition-colors">
                        <ChevronLeftIcon className="h-6 w-6" />
                        Volver
                    </button>
                    <h2 className="font-bold text-lg capitalize">{orderType}</h2>
                    <div className="w-20"></div>
                </div>
                <div className="relative mt-4">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary/50 dark:text-light-silver/50" />
                    <input type="search" placeholder="Buscar en el menú..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 pl-10 rounded-lg border border-text-primary/10 dark:border-[#45535D] bg-background dark:bg-[#45535D]/50 focus:ring-2 focus:ring-primary focus:border-primary" />
                </div>
            </header>

            {!searchTerm && (
                <nav className="flex-shrink-0 border-b border-text-primary/10 dark:border-[#45535D] p-2 sticky top-28 z-40 bg-surface/80 dark:bg-[#34424D]/80 backdrop-blur-sm">
                    <div className="flex space-x-2 overflow-x-auto pb-1">
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setActiveCategory(cat)} className={`py-2 px-4 rounded-full font-semibold whitespace-nowrap text-sm transition-colors ${activeCategory === cat ? 'bg-primary text-white shadow-sm' : 'bg-background dark:bg-[#45535D] text-text-primary dark:text-ivory-cream hover:bg-text-primary/5'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </nav>
            )}

            <main className="flex-grow overflow-y-auto p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredProducts.map(product => (
                        <button key={product.id} onClick={() => setSelectedProduct(product)} className="bg-surface dark:bg-[#34424D] rounded-lg shadow-md p-2 text-center transition-transform hover:-translate-y-1 hover:shadow-lg flex flex-col border border-text-primary/5 dark:border-[#45535D] relative disabled:opacity-50" disabled={product.stock <= 0}>
                            <div className="h-24 w-full bg-background dark:bg-[#45535D] rounded-md overflow-hidden relative">
                                <img src={product.imagenUrl} alt={product.nombre} className={`w-full h-full object-cover product-image-${product.id}`} />
                                {product.stock <= 0 && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="bg-danger text-white font-bold text-xs px-2 py-1 rounded">AGOTADO</span></div>}
                            </div>
                            <p className="font-semibold text-sm mt-2 flex-grow text-text-primary dark:text-ivory-cream leading-tight">{product.nombre}</p>
                            <p className="font-bold text-text-secondary dark:text-light-silver mt-1">S/.{product.precio.toFixed(2)}</p>
                        </button>
                    ))}
                </div>
            </main>

            {cartItemCount > 0 && (
                 <footer className="flex-shrink-0 p-4 border-t border-text-primary/10 dark:border-[#45535D] bg-surface/90 dark:bg-[#34424D]/90 backdrop-blur-lg sticky bottom-0 z-50">
                    <button id="cart-button" onClick={() => setStage('checkout')} className={`w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl flex items-center justify-between transition-all duration-300 shadow-lg shadow-primary/30 hover:shadow-primary/40 active:scale-95 ${isCartAnimating ? 'animate-pulse' : ''}`}>
                        <div className="flex items-center gap-2">
                            <ShoppingBagIcon className="h-6 w-6"/>
                            <span>{cartItemCount} item{cartItemCount > 1 ? 's' : ''}</span>
                        </div>
                        <span>Ver Carrito - S/.{total.toFixed(2)}</span>
                    </button>
                </footer>
            )}
        </div>
    );

    const renderCheckoutScreen = () => (
         <div className="flex flex-col h-full bg-background dark:bg-gunmetal">
            <header className="flex-shrink-0 bg-surface/80 dark:bg-[#34424D]/80 backdrop-blur-lg p-4 shadow-sm border-b border-text-primary/5 dark:border-[#45535D] sticky top-0 z-50">
                <div className="flex items-center justify-between">
                    <button onClick={() => setStage('catalog')} className="flex items-center font-semibold text-text-secondary dark:text-light-silver hover:text-primary dark:hover:text-orange-400 transition-colors">
                        <ChevronLeftIcon className="h-6 w-6" />
                        Seguir Comprando
                    </button>
                    <h2 className="font-bold text-lg">Tu Pedido</h2>
                    <div className="w-32"></div>
                </div>
            </header>
            <main className="flex-grow overflow-y-auto p-4 space-y-6">
                <div className="bg-surface dark:bg-[#34424D] p-4 rounded-2xl">
                    {cart.map(item => (
                        <div key={item.cartItemId} className="flex gap-4 py-3 border-b border-text-primary/5 dark:border-[#45535D] last:border-b-0">
                            <img src={item.imagenUrl} alt={item.nombre} className="w-16 h-16 rounded-lg object-cover" />
                            <div className="flex-grow">
                                <p className="font-semibold text-text-primary dark:text-ivory-cream">{item.nombre}</p>
                                <p className="text-sm text-sky-600 dark:text-sky-400">{item.salsas?.map(s => s.nombre).join(', ')}</p>
                                <p className="font-mono text-text-secondary dark:text-light-silver">S/.{item.precio.toFixed(2)}</p>
                            </div>
                            <div className="flex flex-col items-end justify-between">
                                <p className="font-bold text-text-primary dark:text-ivory-cream">S/.{(item.precio * item.cantidad).toFixed(2)}</p>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQuantity(item.cartItemId, item.cantidad - 1)} className="bg-text-primary/10 dark:bg-[#45535D] rounded-full h-7 w-7 flex items-center justify-center font-bold">
                                        {item.cantidad > 1 ? <MinusIcon className="h-4 w-4"/> : <TrashIcon className="h-4 w-4 text-danger"/>}
                                    </button>
                                    <span className="font-bold w-5 text-center">{item.cantidad}</span>
                                    <button onClick={() => updateQuantity(item.cartItemId, item.cantidad + 1)} className="bg-text-primary/10 dark:bg-[#45535D] rounded-full h-7 w-7 flex items-center justify-center font-bold"><PlusIcon className="h-4 w-4"/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-surface dark:bg-[#34424D] p-4 rounded-2xl space-y-4">
                    <h3 className="font-bold text-lg">Tus Datos</h3>
                    <div>
                        <input type="text" placeholder="Nombre Completo" value={customerInfo.nombre} onChange={e => setCustomerInfo(p => ({...p, nombre: e.target.value}))} className={`w-full p-3 rounded-lg bg-background dark:bg-[#45535D] border ${formErrors.nombre ? 'border-danger' : 'border-text-primary/10 dark:border-[#56656E]'}`} />
                        {formErrors.nombre && <p className="text-danger text-xs mt-1">{formErrors.nombre}</p>}
                    </div>
                    <div>
                        <input type="tel" placeholder="N° de Celular (9 dígitos)" value={customerInfo.telefono} onChange={e => setCustomerInfo(p => ({...p, telefono: e.target.value.replace(/\D/g, '').slice(0, 9)}))} className={`w-full p-3 rounded-lg bg-background dark:bg-[#45535D] border ${formErrors.telefono ? 'border-danger' : 'border-text-primary/10 dark:border-[#56656E]'}`} />
                        {formErrors.telefono && <p className="text-danger text-xs mt-1">{formErrors.telefono}</p>}
                    </div>
                    {orderType === 'delivery' && (
                        <div>
                            <input type="text" placeholder="Dirección de Entrega" value={customerInfo.direccion || ''} onChange={e => setCustomerInfo(p => ({...p, direccion: e.target.value}))} className={`w-full p-3 rounded-lg bg-background dark:bg-[#45535D] border ${formErrors.direccion ? 'border-danger' : 'border-text-primary/10 dark:border-[#56656E]'}`} />
                            {formErrors.direccion && <p className="text-danger text-xs mt-1">{formErrors.direccion}</p>}
                            <button onClick={handleGetCurrentLocation} className="text-sm font-semibold text-primary mt-2 flex items-center gap-1">
                                <MapPinIcon className="h-4 w-4"/> {isLocating ? 'Obteniendo...' : 'Usar mi ubicación actual'}
                            </button>
                        </div>
                    )}
                     <textarea placeholder="¿Alguna indicación especial para tu pedido?" value={orderNotes} onChange={e => setOrderNotes(e.target.value)} rows={2} className="w-full p-3 rounded-lg bg-background dark:bg-[#45535D] border border-text-primary/10 dark:border-[#56656E]"></textarea>
                </div>
                
                 <div className="bg-surface dark:bg-[#34424D] p-4 rounded-2xl space-y-4">
                    <h3 className="font-bold text-lg text-text-primary dark:text-ivory-cream">
                        {isOnlyMercadoPago ? 'Pago Seguro' : '¿Cómo quieres pagar?'}
                    </h3>
                    
                    {/* SIMPLIFIED FLOW FOR MERCADO PAGO ONLY */}
                    {isOnlyMercadoPago ? (
                        <div className="animate-fade-in-up">
                             <div className="flex flex-col items-center p-6 bg-blue-500/5 border-2 border-blue-500/20 rounded-xl text-center">
                                <MercadoPagoLogo className="h-12 w-auto text-[#009EE3] mb-3" />
                                <p className="font-bold text-lg text-[#009EE3]">Mercado Pago</p>
                                <p className="text-sm text-text-secondary dark:text-light-silver mt-1 mb-4">
                                    Pagarás de forma rápida y segura con tu tarjeta o saldo.
                                </p>
                                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-success/80 bg-success/10 px-3 py-1 rounded-full">
                                    <LockClosedIcon className="h-3 w-3" />
                                    Pagos procesados de forma 100% segura
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* STANDARD FLOW WITH MULTIPLE OPTIONS */
                        <>
                            <div className={`grid ${showPayNow && showPayLater ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                                {showPayNow && (
                                    <button
                                        onClick={() => setPaymentChoice('payNow')}
                                        className={`p-4 rounded-xl border-2 text-center transition-colors ${
                                            paymentChoice === 'payNow'
                                                ? 'bg-primary/10 border-primary'
                                                : 'bg-background dark:bg-gunmetal/50 border-text-primary/10 dark:border-[#45535D] hover:border-primary/50'
                                        }`}
                                    >
                                        <p className={`font-bold ${paymentChoice === 'payNow' ? 'text-primary' : 'text-text-primary dark:text-ivory-cream'}`}>Pagar ahora</p>
                                        <p className="text-xs text-text-secondary dark:text-light-silver">Online (Yape/Plin/MP)</p>
                                    </button>
                                )}
                                {showPayLater && (
                                    <button
                                        onClick={() => setPaymentChoice('payLater')}
                                        className={`p-4 rounded-xl border-2 text-center transition-colors ${
                                            paymentChoice === 'payLater'
                                                ? 'bg-primary/10 border-primary'
                                                : 'bg-background dark:bg-gunmetal/50 border-text-primary/10 dark:border-[#45535D] hover:border-primary/50'
                                        }`}
                                    >
                                        <p className={`font-bold ${paymentChoice === 'payLater' ? 'text-primary' : 'text-text-primary dark:text-ivory-cream'}`}>Pagar al recibir</p>
                                        <p className="text-xs text-text-secondary dark:text-light-silver">Efectivo o Tarjeta</p>
                                    </button>
                                )}
                            </div>

                            {paymentChoice === 'payNow' && (
                                <div className="animate-fade-in-up pt-4 space-y-3 border-t border-text-primary/10 dark:border-[#45535D]">
                                    <p className="text-sm text-text-secondary dark:text-light-silver mb-2">Selecciona tu billetera digital:</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {paymentMethodsEnabled.yape && (
                                            <button onClick={() => setPaymentMethod('yape')} className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 font-semibold transition-colors ${paymentMethod === 'yape' ? 'bg-primary/10 border-primary text-primary' : 'bg-background dark:bg-gunmetal/50 border-transparent text-text-primary dark:text-ivory-cream'}`}>
                                                <DevicePhoneMobileIcon className="h-5 w-5"/> <span>Yape</span>
                                            </button>
                                        )}
                                        {paymentMethodsEnabled.plin && (
                                            <button onClick={() => setPaymentMethod('plin')} className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 font-semibold transition-colors ${paymentMethod === 'plin' ? 'bg-primary/10 border-primary text-primary' : 'bg-background dark:bg-gunmetal/50 border-transparent text-text-primary dark:text-ivory-cream'}`}>
                                                <DevicePhoneMobileIcon className="h-5 w-5"/> <span>Plin</span>
                                            </button>
                                        )}
                                        {paymentMethodsEnabled.mercadopago && (
                                            <button onClick={() => setPaymentMethod('mercadopago')} className={`col-span-2 flex items-center justify-center gap-2 p-3 rounded-lg border-2 font-semibold transition-colors ${paymentMethod === 'mercadopago' ? 'bg-primary/10 border-primary text-primary' : 'bg-background dark:bg-gunmetal/50 border-transparent text-text-primary dark:text-ivory-cream'}`}>
                                                <MercadoPagoLogo className="h-5 w-auto"/> <span>Mercado Pago</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {paymentChoice === 'payLater' && (
                                <div className="animate-fade-in-up pt-4 space-y-3 border-t border-text-primary/10 dark:border-[#45535D]">
                                    <div className="grid grid-cols-2 gap-3">
                                        {paymentMethodsEnabled.efectivo && (
                                            <button onClick={() => setPaymentMethod('efectivo')} className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 font-semibold transition-colors ${paymentMethod === 'efectivo' ? 'bg-primary/10 border-primary text-primary' : 'bg-background dark:bg-gunmetal/50 border-transparent text-text-primary dark:text-ivory-cream'}`}>
                                                <CashIcon className="h-5 w-5"/> <span>Efectivo</span>
                                            </button>
                                        )}
                                        {paymentMethodsEnabled.tarjeta && (
                                            <button onClick={() => setPaymentMethod('tarjeta')} className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 font-semibold transition-colors ${paymentMethod === 'tarjeta' ? 'bg-primary/10 border-primary text-primary' : 'bg-background dark:bg-gunmetal/50 border-transparent text-text-primary dark:text-ivory-cream'}`}>
                                                <CreditCardIcon className="h-5 w-5"/> <span>Tarjeta (POS)</span>
                                            </button>
                                        )}
                                    </div>

                                    {paymentMethod === 'efectivo' && (
                                        <div className="space-y-2 pt-2">
                                            <label className="flex items-center gap-3 p-3 bg-background dark:bg-gunmetal/50 rounded-lg cursor-pointer">
                                                <input type="checkbox" checked={isExactCash} onChange={e => setIsExactCash(e.target.checked)} className="h-5 w-5 rounded text-primary focus:ring-primary border-text-primary/20 dark:border-[#56656E] bg-surface dark:bg-gunmetal"/>
                                                <span className="font-medium text-sm text-text-primary dark:text-ivory-cream">Pagaré con el monto exacto</span>
                                            </label>
                                            {!isExactCash && (
                                                <div>
                                                    <input
                                                        type="number"
                                                        placeholder="¿Con cuánto pagarás?"
                                                        value={cashPaymentAmount}
                                                        onChange={e => setCashPaymentAmount(e.target.value)}
                                                        className={`w-full p-3 rounded-lg bg-background dark:bg-gunmetal/50 border ${formErrors.pagoConEfectivo ? 'border-danger' : 'border-text-primary/10 dark:border-[#56656E]'}`}
                                                    />
                                                    {formErrors.pagoConEfectivo && <p className="text-danger text-xs mt-1">{formErrors.pagoConEfectivo}</p>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
             <footer className="flex-shrink-0 p-4 border-t border-text-primary/10 dark:border-[#45535D] bg-surface/90 dark:bg-[#34424D]/90 backdrop-blur-lg sticky bottom-0 z-50">
                <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold">Total a Pagar</span>
                    <span className="font-bold text-2xl font-mono">S/.{total.toFixed(2)}</span>
                </div>
                <button onClick={handlePlaceOrder} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg">
                    {paymentChoice === 'payNow' ? `Ir a Pagar S/.${total.toFixed(2)}` : 'Confirmar Pedido'}
                </button>
            </footer>
        </div>
    );

    const renderConfirmationScreen = () => {
        const yapeConfig = restaurantSettings?.paymentMethods?.yape;
        const plinConfig = restaurantSettings?.paymentMethods?.plin;
        const mpConfig = restaurantSettings?.paymentMethods?.mercadopago;

        // Decide which config to use. Prioritize based on actual order method.
        
        let onlinePaymentConfig: any = null;
        let methodLabel = '';

        if (paymentMethod === 'yape') {
            onlinePaymentConfig = yapeConfig;
            methodLabel = 'Yape';
        } else if (paymentMethod === 'plin') {
            onlinePaymentConfig = plinConfig;
            methodLabel = 'Plin';
        } else if (paymentMethod === 'mercadopago') {
            onlinePaymentConfig = mpConfig;
            methodLabel = 'Mercado Pago';
        } else {
             // Fallback
             if (yapeConfig?.enabled) { onlinePaymentConfig = yapeConfig; methodLabel = 'Yape'; }
             else if (plinConfig?.enabled) { onlinePaymentConfig = plinConfig; methodLabel = 'Plin'; }
             else if (mpConfig?.enabled) { onlinePaymentConfig = mpConfig; methodLabel = 'Mercado Pago'; }
        }

        const whatsappMessage = encodeURIComponent(`Hola, acabo de realizar el pedido ${newOrderId}.`);
        const whatsappLink = `https://wa.me/51${onlinePaymentConfig?.phoneNumber || ''}?text=${whatsappMessage}`;
        
        const isMpLink = methodLabel === 'Mercado Pago' && onlinePaymentConfig?.phoneNumber?.startsWith('http');
        // Specific check for MP Payment Link field
        const mpPaymentLink = methodLabel === 'Mercado Pago' ? onlinePaymentConfig?.paymentLink : null;
        // Check for keys
        const mpPublicKey = methodLabel === 'Mercado Pago' ? onlinePaymentConfig?.publicKey : null;
        const mpAccessToken = methodLabel === 'Mercado Pago' ? onlinePaymentConfig?.accessToken : null;

        // Helper to ensure absolute URL
        const ensureAbsoluteUrl = (url: string | undefined) => {
            if (!url) return '#';
            if (url.startsWith('http://') || url.startsWith('https://')) {
                return url;
            }
            return `https://${url}`;
        };
        
        // Function to generate dynamic preference using keys
        const handleMercadoPagoCheckout = async () => {
            if (!mpAccessToken) {
                alert("No se ha configurado un Access Token. Por favor usa el Link de Pago.");
                return;
            }
            
            setIsGeneratingPayment(true);
            try {
                // Construct the item list for the preference
                const items = [{
                    title: `Pedido ${newOrderId} en Uchu51`,
                    description: `Orden completa ${newOrderId}`,
                    quantity: 1,
                    currency_id: 'PEN',
                    unit_price: lastOrderTotal
                }];

                // Call Mercado Pago API
                // NOTE: Direct calls from frontend may face CORS issues. 
                // Ideally this should go through a backend proxy.
                const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${mpAccessToken}`
                    },
                    body: JSON.stringify({
                        items: items,
                        back_urls: {
                            success: window.location.href,
                            failure: window.location.href,
                            pending: window.location.href
                        },
                        auto_return: "approved",
                    })
                });

                const data = await response.json();
                
                if (response.ok && data.init_point) {
                    // Redirect to the payment gateway
                    window.location.href = data.init_point; 
                } else {
                    throw new Error(data.message || "Error al generar preferencia");
                }
                
            } catch (error) {
                console.error("Error generando pago:", error);
                alert("Hubo un problema conectando con Mercado Pago (Posible bloqueo CORS). Por favor intenta usar el Link de Pago directo si está configurado.");
            } finally {
                setIsGeneratingPayment(false);
            }
        };


        const handleSimulatePayment = () => {
            dispatch({ type: 'CONFIRM_CUSTOMER_PAYMENT', payload: newOrderId });
            setIsPaymentSimulated(true);
        };

        return (
            <div className="flex flex-col items-center justify-center text-center h-full p-4">
                 {paymentChoice === 'payLater' ? (
                    <>
                        <CheckCircleIcon className="h-20 w-20 text-success mb-4" />
                        <h2 className="text-3xl font-heading font-bold text-text-primary dark:text-white">¡Pedido Recibido!</h2>
                        <p className="text-lg text-text-secondary dark:text-light-silver mt-2">Tu pedido <span className="font-bold text-primary">{newOrderId}</span> ya está en preparación.</p>
                    </>
                ) : (
                    <>
                         {isPaymentSimulated ? (
                             <div className="text-center py-8">
                                <CheckCircleIcon className="h-16 w-16 text-success mx-auto mb-4" />
                                <h3 className="font-bold text-lg text-success">¡Pago Confirmado!</h3>
                                <p className="text-sm text-text-secondary dark:text-light-silver">Tu pedido <span className="font-bold text-primary">{newOrderId}</span> ya está en preparación.</p>
                            </div>
                        ) : (
                            <div className="mt-6 p-6 bg-surface dark:bg-[#34424D] rounded-2xl w-full max-w-sm border border-text-primary/5 dark:border-[#45535D]">
                                <h2 className="text-xl font-heading font-bold text-text-primary dark:text-white">¡Pedido Recibido!</h2>
                                <p className="text-base text-text-secondary dark:text-light-silver mt-1 mb-6">Pedido <span className="font-bold text-primary">{newOrderId}</span></p>
                                
                                {isOnlyMercadoPago ? (
                                    // --- EXCLUSIVE MERCADO PAGO FLOW ---
                                    <div className="animate-fade-in-up">
                                        <p className="text-sm text-text-secondary dark:text-light-silver mb-2">Total a pagar:</p>
                                        <p className="text-3xl font-mono font-extrabold text-[#009EE3] mb-6">S/.{lastOrderTotal.toFixed(2)}</p>

                                        {/* Priority 1: Dynamic Checkout Button if keys exist */}
                                        {mpAccessToken ? (
                                            <button 
                                                onClick={handleMercadoPagoCheckout}
                                                disabled={isGeneratingPayment}
                                                className="w-full bg-[#009EE3] hover:bg-[#007db3] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all mb-3 disabled:opacity-70"
                                            >
                                                {isGeneratingPayment ? (
                                                    <span className="animate-pulse">Generando pasarela...</span>
                                                ) : (
                                                    <>
                                                        <MercadoPagoLogo className="h-5 w-auto"/> Pagar Ahora
                                                    </>
                                                )}
                                            </button>
                                        ) : null}

                                        {/* Priority 2: Static Payment Link if keys fail or don't exist */}
                                        {mpPaymentLink && mpPaymentLink.trim() !== '' && (
                                            <a 
                                                href={ensureAbsoluteUrl(mpPaymentLink)} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className={`block w-full font-bold py-3 px-4 rounded-xl text-center mb-4 transition-transform hover:-translate-y-0.5 border-2 border-[#009EE3] text-[#009EE3] hover:bg-[#009EE3]/10`}
                                            >
                                                {mpAccessToken ? 'Link de Pago Alternativo' : 'Pagar con Link'}
                                            </a>
                                        )}

                                        {/* Completion Action */}
                                        <button
                                            onClick={handleSimulatePayment}
                                            className="mt-6 text-sm font-semibold text-text-secondary hover:text-primary dark:text-light-silver dark:hover:text-white underline decoration-dotted underline-offset-4"
                                        >
                                            Confirmar transacción completada
                                        </button>
                                    </div>
                                ) : (
                                    // --- STANDARD FLOW (YAPE/PLIN/MIXED) ---
                                    <>
                                        <h3 className="font-bold mb-2">Paga S/.{lastOrderTotal.toFixed(2)} con {methodLabel}</h3>
                                        
                                        {/* Display QR if available and not Mercado Pago (unless specific logic) */}
                                        {methodLabel !== 'Mercado Pago' && onlinePaymentConfig?.qrUrl ? (
                                            <img src={onlinePaymentConfig?.qrUrl} alt="QR Code" className="w-40 h-40 mx-auto rounded-lg mb-2" />
                                        ) : (
                                            methodLabel !== 'Mercado Pago' && (
                                                <div className="w-40 h-40 mx-auto rounded-lg bg-gray-200 flex items-center justify-center mb-2">
                                                    <p className="text-xs text-text-secondary">Sin QR</p>
                                                </div>
                                            )
                                        )}

                                        {/* Standard Fields */}
                                        {methodLabel !== 'Mercado Pago' && (
                                            <p className="mt-2 text-sm">Titular: <span className="font-semibold">{onlinePaymentConfig?.holderName || ''}</span></p>
                                        )}
                                        
                                        {/* Phone/Link Display Logic for Non-MP or Mixed */}
                                        {(!mpPaymentLink && !mpAccessToken && methodLabel === 'Mercado Pago') || (methodLabel !== 'Mercado Pago') ? (
                                            isMpLink ? (
                                                 <a href={ensureAbsoluteUrl(onlinePaymentConfig?.phoneNumber)} target="_blank" rel="noreferrer" className="block mt-2 text-primary font-bold underline text-sm break-all">
                                                    Ir al Link de Pago
                                                 </a>
                                            ) : (
                                                 <p className="text-sm">Número: <span className="font-semibold">{onlinePaymentConfig?.phoneNumber || ''}</span></p>
                                            )
                                        ) : null}

                                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="mt-4 w-full bg-green-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
                                           <WhatsAppIcon className="h-6 w-6"/> Enviar voucher por WhatsApp
                                        </a>
                                        
                                        <button
                                            onClick={handleSimulatePayment}
                                            className="mt-2 w-full bg-transparent border-2 border-dashed border-text-secondary/50 text-text-secondary dark:text-light-silver font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors"
                                        >
                                            Ya realicé el pago
                                        </button>
                                        <p className="text-xs text-text-secondary/60 dark:text-light-silver/50 mt-1">
                                            (Al hacer clic, notificas al restaurante que pagaste)
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
                
                <button onClick={() => setStage('selection')} className="mt-8 font-semibold text-primary hover:underline">
                    Hacer otro pedido
                </button>
            </div>
        );
    }
    
    const mainContent = () => {
        switch (stage) {
            case 'catalog':
                return renderCatalogScreen();
            case 'checkout':
                return renderCheckoutScreen();
            case 'confirmation':
                return renderConfirmationScreen();
            case 'selection':
            default:
                return renderSelectionScreen();
        }
    };

    return (
        <div className="min-h-screen bg-background dark:bg-gunmetal font-sans flex flex-col relative">
            {showGoBackConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4">
                    <div className="bg-surface dark:bg-[#34424D] rounded-2xl shadow-xl p-6 max-w-sm w-full text-center">
                        <h3 className="text-xl font-bold">¿Descartar Pedido?</h3>
                        <p className="my-3">Si vuelves, se vaciará tu carrito. ¿Estás seguro?</p>
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <button onClick={() => setShowGoBackConfirm(false)} className="bg-text-primary/10 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                            <button onClick={confirmGoBack} className="bg-danger text-white font-bold py-2 px-4 rounded-lg">Sí, descartar</button>
                        </div>
                    </div>
                </div>
            )}
            {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={handleAddToCartWithAnimation} />}
            {showInstallInstructions && renderInstallInstructions()}
            {showPromosModal && renderPromosModal()}
            {mainContent()}
        </div>
    );
};
