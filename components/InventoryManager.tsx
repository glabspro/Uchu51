import React, { useState } from 'react';
import type { Producto } from '../types';

interface InventoryManagerProps {
    products: Producto[];
    setProducts: React.Dispatch<React.SetStateAction<Producto[]>>;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ products, setProducts }) => {
    const [stockLevels, setStockLevels] = useState<Record<string, string>>(() =>
        Object.fromEntries(products.map(p => [p.id, String(p.stock)]))
    );

    const handleStockChange = (productId: string, value: string) => {
        setStockLevels(prev => ({ ...prev, [productId]: value }));
    };

    const handleUpdateStock = (productId: string) => {
        const newStock = parseInt(stockLevels[productId], 10);
        if (!isNaN(newStock) && newStock >= 0) {
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
        } else {
            // Revert if invalid input
            const originalProduct = products.find(p => p.id === productId);
            if (originalProduct) {
                setStockLevels(prev => ({ ...prev, [productId]: String(originalProduct.stock) }));
            }
        }
    };
    
    const sortedProducts = [...products].sort((a, b) => a.stock - b.stock);

    return (
        <div>
            <h2 className="text-2xl font-bold text-text-primary dark:text-slate-200 mb-6">Inventario de Productos</h2>
            <div className="bg-background dark:bg-slate-900/50 rounded-xl border border-text-primary/5 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto max-h-[calc(100vh-20rem)]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-surface dark:bg-slate-700/50 sticky top-0">
                            <tr>
                                <th className="p-4 font-semibold">Producto</th>
                                <th className="p-4 font-semibold">Categoría</th>
                                <th className="p-4 font-semibold text-center">Stock Actual</th>
                                <th className="p-4 font-semibold">Actualizar Stock</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-text-primary/5 dark:divide-slate-700">
                            {sortedProducts.map(product => (
                                <tr key={product.id} className="hover:bg-text-primary/5 dark:hover:bg-slate-700/30">
                                    <td className="p-4 font-medium text-text-primary dark:text-slate-200">{product.nombre}</td>
                                    <td className="p-4 text-text-secondary dark:text-slate-400">{product.categoria}</td>
                                    <td className={`p-4 text-center font-bold text-lg ${product.stock < 10 ? 'text-danger' : 'text-text-primary dark:text-slate-200'}`}>
                                        {product.stock}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={stockLevels[product.id] || ''}
                                                onChange={e => handleStockChange(product.id, e.target.value)}
                                                onBlur={() => handleUpdateStock(product.id)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateStock(product.id)}
                                                className="w-24 bg-surface dark:bg-slate-700 border border-text-primary/10 dark:border-slate-600 rounded-md p-2 text-center font-mono focus:ring-2 focus:ring-primary focus:border-primary"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventoryManager;
