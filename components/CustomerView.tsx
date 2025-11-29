
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '../store';
import { ShoppingBagIcon, TrashIcon, CheckCircleIcon, TruckIcon, UserIcon, CashIcon, CreditCardIcon, DevicePhoneMobileIcon, MapPinIcon, SearchIcon, AdjustmentsHorizontalIcon, MinusIcon, PlusIcon, StarIcon, SunIcon, MoonIcon, ChevronLeftIcon, ChevronRightIcon, WhatsAppIcon, ArrowDownOnSquareIcon, ArrowUpOnSquareIcon, EllipsisVerticalIcon, XMarkIcon, SparklesIcon, HomeIcon, GlobeAltIcon, LockClosedIcon } from './icons';
import SauceModal from './SauceModal';
import ProductDetailModal from './ProductDetailModal';
import PromoCustomizationModal from './PromoCustomizationModal';
import { Logo } from './Logo';
import type { Pedido, Producto, ProductoPedido, Cliente, TipoPedido, MetodoPago, ClienteLeal, Promocion, Salsa } from '../types';

interface CustomerViewProps { }

type CartItem = ProductoPedido & { cartItemId: number; category?: string };
type Stage = 'selection' | 'catalog' | 'checkout' | 'confirmation';
type PaymentChoice = 'payNow' | 'payLater';
type FormErrors = {
    nombre?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    pagoConEfectivo?: string;
};

// --- LOGOS ---
const MercadoPagoLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
       <path d="M14.07 19.33c.7.21 1.45.33 2.21.33 2.38 0 4.52-1.04 5.99-2.71l-1.57-1.57c-1.09 1.24-2.67 2.03-4.42 2.03-2.76 0-5.09-1.92-5.77-4.52h-2.28v1.78c1.37 2.73 4.19 4.66 7.46 4.66zM7.22 10.96c-.18.6-.28 1.23-.28 1.88s.1 1.28.28 1.88v-1.78h2.28c.17-2.6-1.92-4.82-4.52-5.5V5.15c-3.27 1.43-5.2 4.25-5.2 7.49s1.93 6.06 5.2 7.49v-2.29c-1.39-1.32-2.28-3.17-2.28-5.2s.89-3.88 2.28-5.2v-2.29zM16.28 4.34c1.19 0 2.28.42 3.14 1.12l2.36-2.36C20.15 1.76 18.3 1.13 16.28 1.13c-3.27 0-6.09 1.93-7.46 4.66l2.28 1.78c.68-2.6 3.01-4.52 5.77-4.52z" fill="#009EE3"/>
       <path d="M12.5 12.5h-1v-1h1v1z" fill="transparent"/>
    </svg>
);

const YapeLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.2"/>
        <path d="M8 10l3 5 5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <text x="12" y="20" fontSize="6" textAnchor="middle" fill="currentColor" fontWeight="bold">YAPE</text>
    </svg>
);

const PlinLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="20" height="16" rx="4" fill="currentColor" fillOpacity="0.2"/>
        <path d="M7 12h10M12 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <text x="12" y="19" fontSize="6" textAnchor="middle" fill="currentColor" fontWeight="bold">PLIN</text>
    </svg>
);

// --- MAIN COMPONENT ---

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
    const [mpPaymentStatus, setMpPaymentStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
    const hasProcessedReturn = useRef(false);

    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [cashPaymentAmount, setCashPaymentAmount] = useState('');
    const [isExactCash, setIsExactCash] = useState(false);
    const [orderNotes, setOrderNotes] = useState('');
    
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
    const [promoCustomization, setPromoCustomization] = useState<{ items: any[], name: string } | null>(null);

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
    const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);

    const onPlaceOrder = (order: Omit<Pedido, 'id' | 'fecha' | 'turno' | 'historial' | 'areaPreparacion' | 'estado' | 'gananciaEstimada'>) => dispatch({ type: 'SAVE_ORDER', payload: order });
    const onConfirmPayment = (orderId: string, details: { metodo: MetodoPago; montoPagado?: number }) => {
        dispatch({ type: 'CONFIRM_PAYMENT', payload: { orderId, details } });
    };
    const onToggleTheme = () => dispatch({ type: 'TOGGLE_THEME' });
    const onInstallClick = () => { if (installPrompt) { installPrompt.prompt(); }};
    const onGoToStaffLogin = () => dispatch({ type: 'LOCK_TERMINAL' });

    useEffect(() => {
        if (isLoading) return;
        if (hasProcessedReturn.current) return;

        const searchParams = new URLSearchParams(window.location.search);
        const collectionStatus = searchParams.get('collection_status');
        const externalReference = searchParams.get('external_reference');
        const status = searchParams.get('status');

        if (externalReference && (collectionStatus || status)) {
            hasProcessedReturn.current = true;
            const finalStatus = collectionStatus || status;
            
            setNewOrderId(externalReference);
            setStage('confirmation');
            setPaymentMethod('mercadopago');
            setPaymentChoice('payNow');

            if (finalStatus === 'approved') {
                setMpPaymentStatus('approved');
                onConfirmPayment(externalReference, { metodo: 'mercadopago', montoPagado: 0 });
                setTimeout(() => setIsPaymentSimulated(true), 500);
            } else if (finalStatus === 'rejected' || finalStatus === 'failure') {
                setMpPaymentStatus('rejected');
            } else {
                setMpPaymentStatus('pending');
            }
            
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

    useEffect(() => {
        const sessionKey = 'uchu_promos_shown';
        const hasShown = sessionStorage.getItem(sessionKey);
        
        const searchParams = new URLSearchParams(window.location.search);
        const isPaymentReturn = searchParams.has('external_reference') || searchParams.has('collection_status') || searchParams.has('status');

        if (!hasShown && !isPaymentReturn && activePromotions.length > 0) {
            setShowPromosModal(true);
            sessionStorage.setItem(sessionKey, 'true');
        }
    }, [activePromotions]);
    
    const showPayNow = paymentMethodsEnabled.yape || paymentMethodsEnabled.plin || paymentMethodsEnabled.mercadopago;
    const showPayLater = paymentMethodsEnabled.efectivo || paymentMethodsEnabled.tarjeta || paymentMethodsEnabled.yape || paymentMethodsEnabled.plin;

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

        if (activePromotions.length > 0) {
            const promoProducts = activePromotions.map(promo => {
                let displayPrice = 0;
                if (promo.tipo === 'combo_fijo') {
                    displayPrice = promo.condiciones.precioFijo || 0;
                } else if (promo.tipo === 'dos_por_uno' && promo.condiciones.productoId_2x1) {
                    const targetProduct = products.find(p => p.id === promo.condiciones.productoId_2x1);
                    displayPrice = targetProduct ? targetProduct.precio : 0;
                } else if (promo.tipo === 'descuento_porcentaje') {
                    displayPrice = 0; 
                }

                return {
                    id: promo.id,
                    nombre: promo.nombre,
                    categoria: 'Promociones',
                    precio: displayPrice,
                    costo: 0,
                    stock: 999, 
                    descripcion: promo.descripcion,
                    imagenUrl: getPromoImageUrl(promo, products) || '',
                    restaurant_id: promo.restaurant_id,
                    isPromo: true, 
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
        const allItems = Object.values(groupedProducts).flat() as Producto[];
        return allItems.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, searchTerm, activeCategory, groupedProducts]);

    const categories = useMemo(() => {
        const productCategories = Object.keys(groupedProducts).filter(c => c !== 'Promociones'); 
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
        let itemsToAdd: (CartItem & { category?: string })[] = [];
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
                            promocionId: promoId,
                            category: productInfo.categoria
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
                    promocionId: promoId,
                    category: productInfo.categoria
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
                    promocionId: promoId,
                    category: productInfo.categoria
                });
            }
        }
        
        if (itemsToAdd.length > 0) {
            setPromoCustomization({ items: itemsToAdd, name: promo.nombre });
        }
    };

    const handleConfirmPromoCart = (finalItems: ProductoPedido[]) => {
        const cartItems: CartItem[] = finalItems.map(item => ({
            ...item,
            cartItemId: Date.now() + Math.random()
        }));
        
        setCart(currentCart => [...currentCart, ...cartItems]);
        setPromoCustomization(null);
        
        setIsCartAnimating(true);
        setTimeout(() => setIsCartAnimating(false), 500);
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
        
        let effectivePaymentMethod: MetodoPago = paymentMethod;

        if (paymentChoice === 'payNow') {
            if (isOnlyMercadoPago) {
                effectivePaymentMethod = 'mercadopago';
            } else {
                if (paymentMethodsEnabled.yape && paymentMethod !== 'yape') effectivePaymentMethod = 'yape';
                if (paymentMethodsEnabled.plin && paymentMethod !== 'plin') effectivePaymentMethod = 'plin';
                if (paymentMethodsEnabled.mercadopago && paymentMethod !== 'mercadopago') effectivePaymentMethod = 'mercadopago';
                
                if (['yape', 'plin', 'mercadopago'].includes(paymentMethod)) {
                     effectivePaymentMethod = paymentMethod;
                }
            }
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
        setLastOrderTotal(total); 
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

    // --- Renderers ---

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
                <button onClick={onToggleTheme} className="flex items-center justify-center h-10 w-10 rounded-full text-text-secondary dark:text-light-silver hover:bg-surface dark:hover:bg-[#34424D] hover:text-primary dark:hover:text-orange-400 transition-colors">
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

            <div className="pb-4 space-y-3">
                {showInstallButton && (
                    <button onClick={handleSmartInstallClick} className="text-sm font-semibold text-text-secondary dark:text-light-silver hover:text-primary dark:hover:text-orange-400 transition-colors flex items-center justify-center gap-2 mx-auto">
                        <ArrowDownOnSquareIcon className="h-5 w-5" />
                        Instalar app para mejor experiencia
                    </button>
                )}
                <button onClick={onGoToStaffLogin} className="text-xs text-text-secondary/50 dark:text-light-silver/50 hover:text-text-primary dark:hover:text-white transition-colors block mx-auto underline">
                    Soy Personal del Restaurante
                </button>
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
                    <h2 className="font-heading font-black text-3xl capitalize text-transparent bg-clip-text bg-gradient-to-r from-primary to-warning drop-shadow-sm">
                        {orderType}
                    </h2>
                    <div className="w-20"></div>
                </div>
                <div className="relative mt-4">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary/50 dark:text-light-silver/50" />
                    <input type="search" placeholder="Buscar en el menú..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 pl-10 rounded-lg border border-text-primary/10 dark:border-[#45535D] bg-background dark:bg-[#45535D]/50 focus:ring-2 focus:ring-primary focus:border-primary" />
                </div>
            </header>

            {!searchTerm && (
                <nav className="flex-shrink-0 border-b border-text-primary/10 dark:border-[#45535D] p-3 sticky top-32 z-40 bg-surface/90 dark:bg-[#45535D]/90 backdrop-blur-sm">
                    <div className="flex space-x-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`
                                    relative py-2.5 px-6 rounded-full font-bold whitespace-nowrap text-sm transition-all duration-300 ease-out
                                    ${activeCategory === cat
                                        ? 'bg-gradient-to-r from-primary to-warning text-white shadow-lg shadow-primary/30 transform scale-105'
                                        : 'bg-background dark:bg-[#34424D] text-text-secondary dark:text-light-silver hover:bg-text-primary/5 border border-text-primary/5'
                                    }
                                `}
                            >
                                {cat === 'Promociones' && <SparklesIcon className="inline-block w-4 h-4 mr-1 -mt-0.5" />}
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
                                {product.stock > 0 && (
                                    <div className="absolute bottom-2 right-2 bg-white dark:bg-gunmetal text-primary rounded-full p-2 shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                        <PlusIcon className="h-5 w-5" />
                                    </div>
                                )}
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
                                        <p className="text-xs text-text-secondary dark:text-light-silver">Efectivo, Tarjeta o Billeteras</p>
                                    </button>
                                )}
                            </div>

                            {paymentChoice === 'payNow' && (
                                <div className="animate-fade-in-up pt-4 space-y-3 border-t border-text-primary/10 dark:border-[#45535D]">
                                    <p className="text-sm text-text-secondary dark:text-light-silver mb-2">Selecciona tu billetera digital:</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Yape Button */}
                                        {paymentMethodsEnabled.yape && (
                                            <button 
                                                onClick={() => setPaymentMethod('yape')} 
                                                className={`relative overflow-hidden group p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                                                    paymentMethod === 'yape' 
                                                        ? 'border-[#742284] bg-[#742284] text-white shadow-md ring-2 ring-offset-2 ring-[#742284]' 
                                                        : 'border-[#742284] bg-white dark:bg-[#742284]/10 text-[#742284] hover:bg-[#742284]/20'
                                                }`}
                                            >
                                                <div className="flex flex-col items-center justify-center gap-2 relative z-10">
                                                    <YapeLogo className={`h-8 w-auto ${paymentMethod === 'yape' ? 'text-white' : 'text-[#742284]'}`} />
                                                </div>
                                                {paymentMethod === 'yape' && (
                                                    <div className="absolute top-2 right-2">
                                                        <CheckCircleIcon className="h-5 w-5 text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        )}
                                        {/* Plin Button */}
                                        {paymentMethodsEnabled.plin && (
                                            <button 
                                                onClick={() => setPaymentMethod('plin')} 
                                                className={`relative overflow-hidden group p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                                                    paymentMethod === 'plin' 
                                                        ? 'border-[#00A1E0] bg-[#00A1E0] text-white shadow-md ring-2 ring-offset-2 ring-[#00A1E0]' 
                                                        : 'border-[#00A1E0] bg-white dark:bg-[#00A1E0]/10 text-[#00A1E0] hover:bg-[#00A1E0]/20'
                                                }`}
                                            >
                                                <div className="flex flex-col items-center justify-center gap-2 relative z-10">
                                                    <PlinLogo className={`h-8 w-auto ${paymentMethod === 'plin' ? 'text-white' : 'text-[#00A1E0]'}`} />
                                                </div>
                                                {paymentMethod === 'plin' && (
                                                    <div className="absolute top-2 right-2">
                                                        <CheckCircleIcon className="h-5 w-5 text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        )}
                                        {/* Mercado Pago Button */}
                                        {paymentMethodsEnabled.mercadopago && (
                                            <button 
                                                onClick={() => setPaymentMethod('mercadopago')} 
                                                className={`col-span-2 relative overflow-hidden group p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                                                    paymentMethod === 'mercadopago' 
                                                        ? 'border-[#009EE3] bg-[#009EE3] text-white shadow-md ring-2 ring-offset-2 ring-[#009EE3]' 
                                                        : 'border-[#009EE3] bg-white dark:bg-[#009EE3]/10 text-[#009EE3] hover:bg-[#009EE3]/20'
                                                }`}
                                            >
                                                <div className="flex flex-row items-center justify-center gap-3 relative z-10">
                                                    <MercadoPagoLogo className={`h-8 w-auto ${paymentMethod === 'mercadopago' ? 'text-white' : 'text-[#009EE3]'}`} />
                                                    <span className="font-bold text-lg">Mercado Pago</span>
                                                </div>
                                                {paymentMethod === 'mercadopago' && (
                                                    <div className="absolute top-3 right-3">
                                                        <CheckCircleIcon className="h-5 w-5 text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {paymentChoice === 'payLater' && (
                                <div className="animate-fade-in-up pt-4 space-y-3 border-t border-text-primary/10 dark:border-[#45535D]">
                                    <div className="grid grid-cols-2 gap-3">
                                        {paymentMethodsEnabled.efectivo && (
                                            <button 
                                                onClick={() => setPaymentMethod('efectivo')} 
                                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 font-semibold transition-colors ${paymentMethod === 'efectivo' ? 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400' : 'bg-background dark:bg-gunmetal/50 border-transparent text-text-primary dark:text-ivory-cream hover:border-green-500/30'}`}
                                            >
                                                <CashIcon className="h-5 w-5"/> <span>Efectivo</span>
                                            </button>
                                        )}
                                        {paymentMethodsEnabled.tarjeta && (
                                            <button 
                                                onClick={() => setPaymentMethod('tarjeta')} 
                                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 font-semibold transition-colors ${paymentMethod === 'tarjeta' ? 'bg-slate-500/10 border-slate-500 text-slate-600 dark:text-slate-300' : 'bg-background dark:bg-gunmetal/50 border-transparent text-text-primary dark:text-ivory-cream hover:border-slate-500/30'}`}
                                            >
                                                <CreditCardIcon className="h-5 w-5"/> <span>Tarjeta</span>
                                            </button>
                                        )}
                                        {paymentMethodsEnabled.yape && (
                                            <button 
                                                onClick={() => setPaymentMethod('yape')} 
                                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 font-semibold transition-colors ${paymentMethod === 'yape' ? 'bg-[#742284]/10 border-[#742284] text-[#742284]' : 'bg-background dark:bg-gunmetal/50 border-transparent text-text-primary dark:text-ivory-cream hover:border-[#742284]/30'}`}
                                            >
                                                <YapeLogo className="h-6 w-auto"/>
                                            </button>
                                        )}
                                        {paymentMethodsEnabled.plin && (
                                            <button 
                                                onClick={() => setPaymentMethod('plin')} 
                                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 font-semibold transition-colors ${paymentMethod === 'plin' ? 'bg-[#00A1E0]/10 border-[#00A1E0] text-[#00A1E0]' : 'bg-background dark:bg-gunmetal/50 border-transparent text-text-primary dark:text-ivory-cream hover:border-[#00A1E0]/30'}`}
                                            >
                                                <PlinLogo className="h-6 w-auto"/>
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
                                    
                                    {(paymentMethod === 'yape' || paymentMethod === 'plin') && (
                                        <div className="p-3 bg-background dark:bg-gunmetal/50 rounded-lg border border-dashed border-text-primary/20 text-center text-sm text-text-secondary dark:text-light-silver">
                                            <p>Ten lista tu app de {paymentMethod === 'yape' ? 'Yape' : 'Plin'} para pagar al repartidor.</p>
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
        const isMpPending = mpPaymentStatus === 'pending' || (paymentMethod === 'mercadopago' && !isPaymentSimulated);
        const isMpApproved = mpPaymentStatus === 'approved' || (paymentMethod === 'mercadopago' && isPaymentSimulated);
        
        let statusMessage = "¡Pedido Recibido!";
        let subMessage = "Tu pedido ha sido enviado a cocina.";
        let icon = <CheckCircleIcon className="h-20 w-20 text-success mx-auto mb-4" />;

        if (paymentMethod === 'mercadopago') {
            if (isMpPending) {
                statusMessage = "Completando Pago...";
                subMessage = "Por favor, termina el pago en la ventana segura.";
                icon = <GlobeAltIcon className="h-20 w-20 text-blue-500 mx-auto mb-4 animate-pulse" />;
            } else if (isMpApproved) {
                statusMessage = "¡Pago Exitoso!";
                subMessage = "Hemos recibido tu pago correctamente.";
            } else if (mpPaymentStatus === 'rejected') {
                statusMessage = "Pago Rechazado";
                subMessage = "Hubo un problema con tu pago. Inténtalo de nuevo.";
                icon = <XMarkIcon className="h-20 w-20 text-danger mx-auto mb-4" />;
            }
        } else if (['yape', 'plin'].includes(paymentMethod) && paymentChoice === 'payNow') {
             statusMessage = "¡Casi listo!";
             subMessage = `Realiza el ${paymentMethod} ahora para confirmar tu pedido.`;
        }

        const handleSimulateLocalPayment = () => {
             setIsGeneratingPayment(true);
             setTimeout(() => {
                 onConfirmPayment(newOrderId, { metodo: paymentMethod, montoPagado: 0 }); 
                 setIsPaymentSimulated(true);
                 setIsGeneratingPayment(false);
             }, 1500);
        };

        const handleMercadoPagoCheckout = async () => {
            setIsGeneratingPayment(true);
            try {
                // Construct preference items
                const items = cart.map(item => ({
                    title: item.nombre,
                    quantity: item.cantidad,
                    unit_price: item.precio,
                    currency_id: 'PEN'
                }));

                const payer = {
                    name: customerInfo.nombre,
                    email: customerInfo.email || 'test_user_123@testuser.com', 
                    phone: {
                        area_code: '',
                        number: Number(customerInfo.telefono)
                    }
                };

                const mPConfig = restaurantSettings?.paymentMethods?.mercadopago;
                
                if (mPConfig?.paymentLink && !mPConfig?.accessToken) {
                     const link = mPConfig.paymentLink.startsWith('http') ? mPConfig.paymentLink : `https://${mPConfig.paymentLink}`;
                     window.location.href = link;
                     return;
                }

                if (mPConfig?.accessToken) {
                    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${mPConfig.accessToken}`
                        },
                        body: JSON.stringify({
                            items,
                            payer,
                            external_reference: newOrderId,
                            back_urls: {
                                success: window.location.href,
                                failure: window.location.href,
                                pending: window.location.href
                            },
                            auto_return: "approved",
                            payment_methods: {
                                installments: 12,
                                default_installments: null
                            },
                            statement_descriptor: "UCHU51 RESTAURANT"
                        })
                    });
                    
                    const data = await response.json();
                    if (data.init_point) {
                        window.location.href = data.init_point;
                    } else {
                        throw new Error('No init_point');
                    }
                } else {
                     setTimeout(() => {
                        setIsPaymentSimulated(true);
                        setIsGeneratingPayment(false);
                        onConfirmPayment(newOrderId, { metodo: 'mercadopago', montoPagado: 0 });
                    }, 2000);
                }

            } catch (error) {
                console.error("MP Error", error);
                const mPConfig = restaurantSettings?.paymentMethods?.mercadopago;
                if (mPConfig?.paymentLink) {
                     const link = mPConfig.paymentLink.startsWith('http') ? mPConfig.paymentLink : `https://${mPConfig.paymentLink}`;
                     window.location.href = link;
                } else {
                    alert("Error conectando con Mercado Pago. Intenta otro método.");
                    setIsGeneratingPayment(false);
                }
            }
        };

        const ensureAbsoluteUrl = (url?: string) => {
            if (!url) return '#';
            return url.startsWith('http') ? url : `https://${url}`;
        };

        return (
            <div className="flex flex-col h-full items-center justify-center p-8 text-center animate-fade-in-scale">
                {icon}
                <h2 className="text-3xl font-heading font-extrabold text-text-primary dark:text-white mb-2">{statusMessage}</h2>
                <p className="text-text-secondary dark:text-light-silver mb-2">{subMessage}</p>
                
                <div className="bg-surface dark:bg-[#34424D] p-4 rounded-xl shadow-sm border border-text-primary/10 dark:border-[#45535D] w-full max-w-sm mb-6">
                    <p className="text-sm font-semibold text-text-secondary dark:text-light-silver">Pedido <span className="text-primary dark:text-orange-400 font-bold">{newOrderId}</span></p>
                    {isOnlyMercadoPago && !isMpApproved && (
                         <div className="mt-4 animate-fade-in-up">
                            <p className="font-bold text-lg mb-2">Paga S/.{lastOrderTotal.toFixed(2)} con Mercado Pago</p>
                            <button 
                                onClick={handleMercadoPagoCheckout}
                                disabled={isGeneratingPayment}
                                className="w-full bg-[#009EE3] hover:bg-[#007eb5] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30"
                            >
                                {isGeneratingPayment ? 'Procesando...' : (
                                    <>
                                        <GlobeAltIcon className="h-5 w-5" /> Pagar S/.{lastOrderTotal.toFixed(2)} con Mercado Pago
                                    </>
                                )}
                            </button>
                            {restaurantSettings?.paymentMethods?.mercadopago?.paymentLink && (
                                <a 
                                    href={ensureAbsoluteUrl(restaurantSettings.paymentMethods.mercadopago.paymentLink)}
                                    className="block w-full mt-3 border-2 border-[#009EE3] text-[#009EE3] font-bold py-3 px-4 rounded-xl hover:bg-[#009EE3]/10 transition-colors"
                                >
                                    Pagar con Link (Respaldo)
                                </a>
                            )}
                         </div>
                    )}
                </div>

                {isOnlyMercadoPago ? (
                     <div className="space-y-4 w-full max-w-sm">
                        <div className="flex items-center justify-center gap-2 text-xs text-text-secondary dark:text-light-silver/60">
                            <LockClosedIcon className="h-3 w-3" /> Pagos procesados de forma 100% segura
                        </div>
                        <button onClick={() => { setStage('selection'); setNewOrderId(''); setCart([]); }} className="text-primary dark:text-orange-400 font-semibold hover:underline text-sm">
                            Confirmar transacción y volver al inicio
                        </button>
                         <button onClick={() => { setStage('selection'); setNewOrderId(''); setCart([]); }} className="text-text-secondary dark:text-light-silver font-bold mt-4 hover:text-primary transition-colors">
                            Hacer otro pedido
                        </button>
                     </div>
                ) : (
                    <div className="space-y-3 w-full max-w-sm">
                        {!isPaymentSimulated && ['yape', 'plin'].includes(paymentMethod) && paymentChoice === 'payNow' && (
                             <button onClick={handleSimulateLocalPayment} disabled={isGeneratingPayment} className={`w-full bg-text-primary dark:bg-[#45535D] text-white font-bold py-3 rounded-xl shadow-lg border-2 border-dashed border-white/20 ${isGeneratingPayment ? 'opacity-70' : ''}`}>
                                {isGeneratingPayment ? 'Verificando...' : 'Ya realicé el pago'}
                                <p className="text-[10px] font-normal opacity-80">(Al hacer clic, notificas al restaurante que pagaste)</p>
                            </button>
                        )}
                        
                        <button className="w-full bg-success hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all">
                            <WhatsAppIcon className="h-5 w-5" /> Enviar voucher por WhatsApp
                        </button>
                        
                        <button onClick={() => { setStage('selection'); setNewOrderId(''); setCart([]); }} className="text-primary dark:text-orange-400 font-bold mt-4 hover:underline">
                            Hacer otro pedido
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full bg-background dark:bg-gunmetal flex flex-col font-sans">
            {selectedProduct && (
                <ProductDetailModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    onAddToCart={handleAddToCartWithAnimation}
                />
            )}
            
            {promoCustomization && (
                <PromoCustomizationModal
                    promoName={promoCustomization.name}
                    initialItems={promoCustomization.items}
                    onClose={() => setPromoCustomization(null)}
                    onConfirm={handleConfirmPromoCart}
                />
            )}

            {stage === 'selection' && renderSelectionScreen()}
            {stage === 'catalog' && renderCatalogScreen()}
            {stage === 'checkout' && renderCheckoutScreen()}
            {stage === 'confirmation' && renderConfirmationScreen()}
            {showInstallInstructions && renderInstallInstructions()}
            {showPromosModal && renderPromosModal()}
            
            {showGoBackConfirm && (
                 <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4 animate-fade-in-scale">
                    <div className="bg-surface dark:bg-[#34424D] rounded-2xl shadow-xl p-6 max-w-sm w-full text-center">
                        <h3 className="text-xl font-heading font-bold text-text-primary dark:text-white">¿Salir sin pedir?</h3>
                        <p className="text-text-secondary dark:text-light-silver my-3">Si vuelves al inicio, perderás los productos de tu carrito.</p>
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <button onClick={() => setShowGoBackConfirm(false)} className="bg-text-primary/10 dark:bg-[#45535D] hover:bg-text-primary/20 dark:hover:bg-[#56656E] text-text-primary dark:text-ivory-cream font-bold py-2 px-4 rounded-lg transition-colors">Seguir pidiendo</button>
                            <button onClick={confirmGoBack} className="bg-danger hover:brightness-110 text-white font-bold py-2 px-4 rounded-lg transition-all">Salir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
