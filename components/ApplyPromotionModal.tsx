import React, { useMemo } from 'react';
import type { Pedido, Promocion, Producto } from '../types';
import { SparklesIcon } from './icons';

interface ApplyPromotionModalProps {
    order: Pedido | null;
    promotions: Promocion[];
    products: Producto[];
    onApply: (promotion: Promocion) => void;
    onClose: () => void;
}

const getApplicablePromotions = (order: Pedido | null, promotions: Promocion[], products: Producto[]): Promocion[] => {
    if (!order) return [];

    const activePromos = promotions.filter(p => p.isActive);
    const applicable = [];

    for (const promo of activePromos) {
        const orderProductCounts: { [key: string]: number } = {};
        order.productos.forEach(p => {
            if (!p.promocionId) { // Only consider items without a promo
                orderProductCounts[p.id] = (orderProductCounts[p.id] || 0) + p.cantidad;
            }
        });

        switch (promo.tipo) {
            case 'dos_por_uno':
                const productId = promo.condiciones.productoId_2x1;
                if (productId && orderProductCounts[productId] >= 2) {
                    applicable.push(promo);
                }
                break;
            case 'combo_fijo':
                const comboProducts = promo.condiciones.productos || [];
                const isApplicable = comboProducts.every(
                    comboProd => (orderProductCounts[comboProd.productoId] || 0) >= comboProd.cantidad
                );
                if (isApplicable) {
                     applicable.push(promo);
                }
                break;
            // More promotion types can be checked here
        }
    }

    return applicable;
};


const ApplyPromotionModal: React.FC<ApplyPromotionModalProps> = ({ order, promotions, products, onApply, onClose }) => {
    const applicablePromotions = useMemo(() => getApplicablePromotions(order, promotions, products), [order, promotions, products]);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4" onClick={onClose}>
            <div className="bg-surface dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-md w-full flex flex-col animate-fade-in-scale" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-slate-100 mb-4">Aplicar Promoción</h2>
                
                <div className="flex-grow overflow-y-auto min-h-[200px] space-y-2">
                    {applicablePromotions.length > 0 ? (
                        applicablePromotions.map(promo => (
                            <button
                                key={promo.id}
                                onClick={() => onApply(promo)}
                                className="w-full flex items-center gap-4 text-left p-3 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors border border-text-primary/5 dark:border-slate-700"
                            >
                                <div className="bg-primary/20 p-2 rounded-full">
                                    <SparklesIcon className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-bold text-text-primary dark:text-slate-200">{promo.nombre}</p>
                                    <p className="text-sm text-text-secondary dark:text-slate-400">{promo.descripcion}</p>
                                </div>
                            </button>
                        ))
                    ) : (
                        <p className="text-center text-text-secondary dark:text-slate-500 pt-8">
                           No hay promociones aplicables para los productos en este pedido.
                        </p>
                    )}
                </div>
                 <div className="pt-6 mt-auto">
                    <button type="button" onClick={onClose} className="w-full bg-text-primary/10 dark:bg-slate-700 hover:bg-text-primary/20 dark:hover:bg-slate-600 text-text-primary dark:text-slate-200 font-bold py-3 px-4 rounded-lg transition-colors active:scale-95">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApplyPromotionModal;
