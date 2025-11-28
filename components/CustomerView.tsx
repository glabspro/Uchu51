import React, { useState, useMemo, useEffect, useRef } from 'react';
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
    email?: string;
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
    const { products, customers, loyaltyPrograms, promotions, theme, installPrompt, restaurantSettings, isLoading } = state;

    const [cart, setCart] = useState<CartItem[]>([]);
    const [orderType, setOrderType] = useState<TipoPedido | null>(null);
    const [customerInfo, setCustomerInfo] = useState<Cliente>({ nombre: '', telefono: '', email: '' });
    const [stage, setStage] = useState<Stage>('selection');
    const [newOrderId, setNewOrderId] = useState('');
    const [lastOrderTotal, setLastOrderTotal] = useState(0);
    const [activeCategory, setActiveCategory] = useState('Hamburguesas');
    const [paymentMethod, setPaymentMethod] = useState<MetodoPago>('efectivo');
    const [paymentChoice, setPaymentChoice] = useState<PaymentChoice | null>(null);
    const [showInstallInstructions, setShowInstallInstructions] = useState(false);
    const [showPromosModal, setShowPromosModal] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaymentSimulated, setIsPaymentSimulated] = useState(false);
    const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
    const [mpPaymentStatus, setMpPaymentStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
    const hasProcessedReturn = useRef(false);

    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [cashPaymentAmount, setCashPaymentAmount] = useState('');
    const [isExactCash, setIsExactCash] = useState(false);
    const [orderNotes, setOrderNotes] = useState('');
    
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);

    const [isLocating, setIsLocating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showGoBackConfirm, setShowGoBackConfirm] = useState(false);

    const [isStandalone, setIsStandalone] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);

    const [loyalCustomer, setLoyalCustomer] = useState<ClienteLeal | null>(null);
    const [isCartAnimating, setIsCartAnimating] = useState(false);

    const [logoClickCount, setLogoClickCount] = useState(0);
    const [logoClickTimer, setLogoClickTimer] = useState<number | null>(null);

    const onPlaceOrder = (order: Omit<Pedido, 'id' | 'fecha' | 'turno' | 'historial' | 'areaPreparacion' | 'estado' | 'gananciaEstimada'>) => dispatch({ type: 'SAVE_ORDER', payload: order });
    const onConfirmPayment = (orderId: string, details: { metodo: MetodoPago; montoPagado?: number }) => {
        dispatch({ type: 'CONFIRM_PAYMENT', payload: { orderId, details } });
    };
    const onToggleTheme = () => dispatch({ type: 'TOGGLE_THEME' });
    const onInstallClick = () => { if (installPrompt) { installPrompt.prompt(); }};

    // Detect Payment Return from Mercado Pago
    useEffect(() => {
        // Wait for initial data load to prevent race conditions where order doesn't exist yet in state
        if (isLoading) return;

        if (hasProcessedReturn.current) return;

        const searchParams = new URLSearchParams(window.location.search);
        const collectionStatus = searchParams.get('collection_status');
        const externalReference = searchParams.get('external_reference');
        const status = searchParams.get('status'); // Alternative param

        // If returning from Mercado Pago
        if (externalReference && (collectionStatus || status)) {
            hasProcessedReturn.current = true;
            const finalStatus = collectionStatus || status;
            
            // Restore basic state to show the confirmation screen
            setNewOrderId(externalReference);
            setStage('confirmation');
            setPaymentMethod('mercadopago');
            setPaymentChoice('payNow');

            if (finalStatus === 'approved') {
                setMpPaymentStatus('approved');
                // Automatically update system status
                onConfirmPayment(externalReference, { metodo: 'mercadopago', montoPagado: 0 }); // Amount handled in context
                setTimeout(() => setIsPaymentSimulated(true), 500); // Visual confirmation
            } else if (finalStatus === 'rejected' || finalStatus === 'failure') {
                setMpPaymentStatus('rejected');
            } else {
                setMpPaymentStatus('pending');
            }
            
            // Try to recover total from local storage if available, or default (it's visual only at this point)
            const storedTotal = localStorage.getItem(`order_total_${externalReference}`);
            if (storedTotal) {
                setLastOrderTotal(parseFloat(storedTotal));
                localStorage.removeItem(`order_total_${externalReference}`);
            }
        }
    }, [isLoading]);


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
            setLogoClickCount(0);
        } else {
            const timer = window.setTimeout(() => {
                setLogoClickCount(0); 
            }, 2000);
            setLogoClickTimer(timer);
        }
    };

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

    // Control Promotion Modal Appearance using sessionStorage
    useEffect(() => {
        const sessionKey = 'uchu_promos_shown';
        const hasShown = sessionStorage.getItem(sessionKey);
        
        // Check if returning from payment to prevent modal overlap
        const searchParams = new URLSearchParams(window.location.search);
        const isPaymentReturn = searchParams.has('external_reference') || searchParams.has('collection_status') || searchParams.has('status');

        if (!hasShown && !isPaymentReturn && activePromotions.length > 0) {
            setShowPromosModal(true);
            sessionStorage.setItem(sessionKey, 'true');
        }
    }, [activePromotions]);
    
    const showPayNow = paymentMethodsEnabled.yape || paymentMethodsEnabled.plin || paymentMethodsEnabled.mercadopago;
    const showPayLater = paymentMethodsEnabled.efectivo || paymentMethodsEnabled.tarjeta;

    useEffect(() => {
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
        if (promo.imagenUrl && promo.imagenUrl.trim() !== '') {
            return promo.imagenUrl;
        }
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
        return undefined;
    };


    const groupedProducts = useMemo(() => {
        const grouped = products.reduce((acc, product) => {
            const category = product.categoria;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(product);
            return acc;
        }, {} as Record<string, Producto[]>);

        // Inject Promotions as a pseudo-category
        if (activePromotions.length > 0) {
            const promoProducts = activePromotions.map(promo => {
                let displayPrice = 0;
                // Calculate display price for the card
                if (promo.tipo === 'combo_fijo') {
                    displayPrice = promo.condiciones.precioFijo || 0;
                } else if (promo.tipo === 'dos_por_uno' && promo.condiciones.productoId_2x1) {
                    const targetProduct = products.find(p => p.id === promo.condiciones.productoId_2x1);
                    displayPrice = targetProduct ? targetProduct.precio : 0;
                } else if (promo.tipo === 'descuento_porcentaje') {
                    // For general discount, show 0 or handle differently
                    displayPrice = 0; 
                }

                return {
                    id: promo.id,
                    nombre: promo.nombre,
                    categoria: 'Promociones',
                    precio: displayPrice,
                    costo: 0,
                    stock: 999, // Always available
                    descripcion: promo.descripcion,
                    imagenUrl: getPromoImageUrl(promo, products) || '',
                    restaurant_id: promo.restaurant_id,
                    isPromo: true, // Special flag to handle click
                    originalPromo: promo
                } as unknown as Producto;
            });
            grouped['Promociones'] = promoProducts;
        }

        return grouped;
    }, [products, activePromotions]);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) {
            return groupedProducts[activeCategory] || [];
        }
        
        // Search across all categories including promotions
        const allItems = Object.values(groupedProducts).flat();
        return allItems.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, searchTerm, activeCategory, groupedProducts]);

    const categories = useMemo(() => {
        const productCategories = Object.keys(groupedProducts).filter(c => c !== 'Promociones'); // Filter out to re-order
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

            const discountRatio = totalOriginalPrice > 0 ? (promo.condiciones.precioFijo ?? totalOriginalPrice) / totalOriginalPrice : 1;

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
            // Optional: Show animation or feedback
            setIsCartAnimating(true);
            setTimeout(() => setIsCartAnimating(false), 500);
        }
    };

    const validateForm = (): boolean => {
        const errors: FormErrors = {};
        if (!customerInfo.nombre.trim()) errors.nombre = 'El nombre es obligatorio.';
        if (!customerInfo.telefono.trim()) {
            errors.telefono = 'El teléfono es obligatorio.';
        } else if (!/^\d{9}$/.test(customerInfo.telefono)) {
            errors.telefono = 'El teléfono debe tener 9 dígitos.';
        }
        if (customerInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
             errors.email = 'El email no es válido.';
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
        
        // Persist total for recovery after MP redirect
        localStorage.setItem(`order_total_${generatedId}`, total.toString());

        setStage('confirmation');
        setIsPaymentSimulated(false);
        setMpPaymentStatus(null);
        setCart([]);
        setCustomerInfo({ nombre: '', telefono: '', email: '' });
        setFormErrors({});
        setCashPaymentAmount('');
        setOrderNotes('');
        setIsExactCash(false);
        hasProcessedReturn.current = false;
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
    const modules = restaurantSettings?.modules;
    const isOnlyDelivery = modules?.delivery !== false && modules?.retiro === false;

    // ... (Install Instructions and Promo Modal Renderers omitted for brevity, same as before) ...
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
                <nav className="flex-shrink-0 border-b border-text-primary/10 dark:border-[#45535D] p-2 sticky top-28 z-40 bg-surface/80 dark:bg-[#45535D]/80 backdrop-blur-sm">
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-20">
                    {filteredProducts.map((product, i) => (
                        <button 
                            key={product.id} 
                            onClick={() => {
                                // If it is a promo disguised as a product
                                if ((product as any).isPromo) {
                                    handleAddPromotionToCart((product as any).originalPromo);
                                } else {
                                    setSelectedProduct(product);
                                }
                            }} 
                            className="group relative bg-surface dark:bg-[#34424D] rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-primary/20 dark:hover:shadow-black/50 transition-all duration-300 transform hover:-translate-y-1 flex flex-col overflow-hidden border border-text-primary/5 dark:border-[#45535D] animate-fade-in-scale text-left disabled:opacity-70 disabled:cursor-not-allowed"
                            style={{ animationDelay: `${i * 50}ms` }}
                            disabled={product.stock <= 0}
                        >
                            <div className="h-40 w-full bg-background dark:bg-[#45535D] overflow-hidden relative">
                                <img src={product.imagenUrl} alt={product.nombre} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${product.stock <= 0 ? 'filter grayscale' : ''}`} />
                                {product.stock <= 0 && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                        <span className="bg-danger text-white font-bold text-xs px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg transform -rotate-6">Agotado</span>
                                    </div>
                                )}
                                {/* Add Button Overlay - Visible on Hover/Active */}
                                {product.stock > 0 && (
                                    <div className="absolute bottom-2 right-2 bg-white dark:bg-gunmetal text-primary rounded-full p-2 shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                        <PlusIcon className="h-5 w-5" />
                                    </div>
                                )}
                                {/* Promo Tag */}
                                {(product as any).isPromo && (
                                    <div className="absolute top-2 left-2 bg-teal-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md animate-pulse">
                                        PROMO
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="font-heading font-bold text-sm text-text-primary dark:text-ivory-cream leading-tight mb-1 line-clamp-2">{product.nombre}</h3>
                                {product.descripcion && <p className="text-xs text-text-secondary dark:text-light-silver line-clamp-2 mb-3 leading-relaxed">{product.descripcion}</p>}
                                <div className="mt-auto pt-2 flex justify-between items-center border-t border-text-primary/5 dark:border-[#56656E]">
                                    <span className="font-mono font-extrabold text-lg text-primary dark:text-orange-400">
                                        {(product as any).isPromo && product.precio === 0 ? '2x1' : `S/.${product.precio.toFixed(2)}`}
                                    </span>
                                </div>
                            </div>
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
                    {/* ADDED EMAIL FIELD */}
                    <div>
                        <input type="email" placeholder="Email (Opcional - Para pagos online)" value={customerInfo.email || ''} onChange={e => setCustomerInfo(p => ({...p, email: e.target.value}))} className={`w-full p-3 rounded-lg bg-background dark:bg-[#45535D] border ${formErrors.email ? 'border-danger' : 'border-text-primary/10 dark:border-[#56656E]'}`} />
                        {formErrors.email && <p className="text-danger text-xs mt-1">{formErrors.email}</p>}
                        <p className="text-xs text-text-secondary dark:text-light-silver mt-1">Recomendado para comprobantes y seguridad.</p>
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
             if (yapeConfig?.enabled) { onlinePaymentConfig = yapeConfig; methodLabel = 'Yape'; }
             else if (plinConfig?.enabled) { onlinePaymentConfig = plinConfig; methodLabel = 'Plin'; }
             else if (mpConfig?.enabled) { onlinePaymentConfig = mpConfig; methodLabel = 'Mercado Pago'; }
        }

        const whatsappMessage = encodeURIComponent(`Hola, acabo de realizar el pedido ${newOrderId}.`);
        const whatsappLink = `https://wa.me/51${onlinePaymentConfig?.phoneNumber || ''}?text=${whatsappMessage}`;
        
        const isMpLink = methodLabel === 'Mercado Pago' && onlinePaymentConfig?.phoneNumber?.startsWith('http');
        const mpPaymentLink = methodLabel === 'Mercado Pago' ? onlinePaymentConfig?.paymentLink : null;
        const mpPublicKey = methodLabel === 'Mercado Pago' ? onlinePaymentConfig?.publicKey : null;
        const mpAccessToken = methodLabel === 'Mercado Pago' ? onlinePaymentConfig?.accessToken : null;

        const ensureAbsoluteUrl = (url: string | undefined) => {
            if (!url) return '#';
            if (url.startsWith('http://') || url.startsWith('https://')) {
                return url;
            }
            return `https://${url}`;
        };
        
        const handleMercadoPagoCheckout = async () => {
            if (!mpAccessToken) {
                alert("No se ha configurado un Access Token. Por favor usa el Link de Pago.");
                return;
            }
            
            setIsGeneratingPayment(true);
            try {
                const items = [{
                    title: `Pedido ${newOrderId} en Uchu51`,
                    description: `Orden completa ${newOrderId}`,
                    quantity: 1,
                    currency_id: 'PEN',
                    unit_price: lastOrderTotal
                }];

                const payerInfo = {
                    name: customerInfo.nombre,
                    email: customerInfo.email || 'test_user_123456@testuser.com', // Fallback email for Sandbox testing if user doesn't provide one
                    phone: {
                        number: customerInfo.telefono
                    }
                };

                const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${mpAccessToken}`
                    },
                    body: JSON.stringify({
                        items: items,
                        payer: payerInfo,
                        // Pass Order ID to recover state on return
                        external_reference: newOrderId,
                        back_urls: {
                            success: window.location.href,
                            failure: window.location.href,
                            pending: window.location.href
                        },
                        auto_return: "approved",
                        binary_mode: false, // IMPORTANT: Must be false to allow installments
                        statement_descriptor: "UCHU51",
                        payment_methods: {
                            installments: 12, // Explicitly allow up to 12
                            default_installments: null // Ensure user can select
                        }
                    })
                });

                const data = await response.json();
                
                if (response.ok && data.init_point) {
                    window.location.href = data.init_point; 
                } else {
                    console.error("Mercado Pago Error:", data);
                    throw new Error(data.message || "Error al generar preferencia");
                }
                
            } catch (error) {
                console.error("Error generando pago:", error);
                alert("Hubo un problema conectando con Mercado Pago (Posible bloqueo CORS o datos inválidos). Por favor intenta usar el Link de Pago directo si está configurado.");
            } finally {
                setIsGeneratingPayment(false);
            }
        };


        const handleSimulatePayment = () => {
            onConfirmPayment(newOrderId, { metodo: paymentMethod, montoPagado: lastOrderTotal });
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
                         {isPaymentSimulated || mpPaymentStatus === 'approved' ? (
                             <div className="text-center py-8">
                                <CheckCircleIcon className="h-16 w-16 text-success mx-auto mb-4" />
                                <h3 className="font-bold text-lg text-success">¡Pago Confirmado!</h3>
                                <p className="text-sm text-text-secondary dark:text-light-silver">Tu pedido <span className="font-bold text-primary">{newOrderId}</span> ha sido pagado y está en preparación.</p>
                            </div>
                        ) : mpPaymentStatus === 'rejected' ? (
                            <div className="text-center py-8">
                                <XMarkIcon className="h-16 w-16 text-danger mx-auto mb-4" />
                                <h3 className="font-bold text-lg text-danger">Pago Rechazado</h3>
                                <p className="text-sm text-text-secondary dark:text-light-silver mb-4">Tu banco o Mercado Pago rechazó la transacción.</p>
                                <button onClick={() => { setMpPaymentStatus(null); setIsGeneratingPayment(false); }} className="bg-primary text-white px-4 py-2 rounded-lg">Intentar de nuevo</button>
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
                                        
                                        {methodLabel !== 'Mercado Pago' && onlinePaymentConfig?.qrUrl ? (
                                            <img src={onlinePaymentConfig?.qrUrl} alt="QR Code" className="w-40 h-40 mx-auto rounded-lg mb-2" />
                                        ) : (
                                            methodLabel !== 'Mercado Pago' && (
                                                <div className="w-40 h-40 mx-auto rounded-lg bg-gray-200 flex items-center justify-center mb-2">
                                                    <p className="text-xs text-text-secondary">Sin QR</p>
                                                </div>
                                            )
                                        )}

                                        {methodLabel !== 'Mercado Pago' && (
                                            <p className="mt-2 text-sm">Titular: <span className="font-semibold">{onlinePaymentConfig?.holderName || ''}</span></p>
                                        )}
                                        
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