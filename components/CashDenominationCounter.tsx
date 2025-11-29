
import React, { useEffect, useState } from 'react';
import { CashIcon, PlusIcon, MinusIcon, TrashIcon } from './icons';

export interface DenominationCounts {
    [key: number]: number;
}

interface CashDenominationCounterProps {
    onTotalChange: (total: number, counts: DenominationCounts) => void;
    initialCounts?: DenominationCounts;
}

const DENOMINATIONS = [
    { value: 200, label: 'S/ 200', type: 'bill' },
    { value: 100, label: 'S/ 100', type: 'bill' },
    { value: 50, label: 'S/ 50', type: 'bill' },
    { value: 20, label: 'S/ 20', type: 'bill' },
    { value: 10, label: 'S/ 10', type: 'bill' },
    { value: 5, label: 'S/ 5.00', type: 'coin' },
    { value: 2, label: 'S/ 2.00', type: 'coin' },
    { value: 1, label: 'S/ 1.00', type: 'coin' },
    { value: 0.5, label: 'S/ 0.50', type: 'coin' },
    { value: 0.2, label: 'S/ 0.20', type: 'coin' },
    { value: 0.1, label: 'S/ 0.10', type: 'coin' },
];

const CashDenominationCounter: React.FC<CashDenominationCounterProps> = ({ onTotalChange, initialCounts = {} }) => {
    const [counts, setCounts] = useState<DenominationCounts>(initialCounts);

    useEffect(() => {
        let total = 0;
        Object.entries(counts).forEach(([value, count]) => {
            total += parseFloat(value) * (count as number);
        });
        onTotalChange(total, counts);
    }, [counts, onTotalChange]);

    const handleCountChange = (value: number, delta: number) => {
        setCounts(prev => {
            const newCount = (prev[value] || 0) + delta;
            return { ...prev, [value]: Math.max(0, newCount) };
        });
    };

    const handleInputChange = (value: number, strVal: string) => {
        const intVal = parseInt(strVal, 10);
        setCounts(prev => ({ ...prev, [value]: isNaN(intVal) ? 0 : Math.max(0, intVal) }));
    };

    const clearAll = () => setCounts({});

    const total = Object.entries(counts).reduce((sum, [val, count]) => sum + (parseFloat(val) * (count as number)), 0);

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 bg-background dark:bg-zinc-900/50 p-3 rounded-xl border border-text-primary/10 dark:border-zinc-700">
                <span className="text-sm font-semibold text-text-secondary dark:text-zinc-400">Total Contado</span>
                <span className="text-2xl font-mono font-bold text-primary dark:text-orange-400">S/.{total.toFixed(2)}</span>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 space-y-2 max-h-[400px]">
                {DENOMINATIONS.map((denom) => (
                    <div key={denom.value} className="flex items-center justify-between bg-surface dark:bg-zinc-700/30 p-2 rounded-lg border border-text-primary/5 dark:border-zinc-700">
                        <div className="flex items-center gap-3 w-1/3">
                            <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-xs shadow-sm ${
                                denom.type === 'bill' 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' 
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                            }`}>
                                {denom.type === 'bill' ? '💵' : '🪙'}
                            </div>
                            <span className="font-mono font-semibold text-text-primary dark:text-zinc-200">{denom.label}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={() => handleCountChange(denom.value, -1)} className="w-8 h-8 flex items-center justify-center bg-text-primary/10 dark:bg-zinc-600 rounded-full hover:bg-text-primary/20 transition-colors">
                                <MinusIcon className="h-4 w-4" />
                            </button>
                            <input 
                                type="number" 
                                value={counts[denom.value] || ''} 
                                onChange={(e) => handleInputChange(denom.value, e.target.value)}
                                placeholder="0"
                                className="w-16 text-center bg-transparent border-b-2 border-text-primary/20 dark:border-zinc-500 focus:border-primary focus:outline-none font-bold text-lg p-1"
                            />
                            <button onClick={() => handleCountChange(denom.value, 1)} className="w-8 h-8 flex items-center justify-center bg-text-primary/10 dark:bg-zinc-600 rounded-full hover:bg-text-primary/20 transition-colors">
                                <PlusIcon className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="w-1/4 text-right font-mono text-sm text-text-secondary dark:text-zinc-400">
                            S/.{((counts[denom.value] || 0) * denom.value).toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-2 border-t border-text-primary/10 dark:border-zinc-700">
                <button onClick={clearAll} className="text-xs text-danger font-semibold flex items-center gap-1 hover:underline">
                    <TrashIcon className="h-3 w-3" /> Limpiar conteo
                </button>
            </div>
        </div>
    );
};

export default CashDenominationCounter;
