
import React from 'react';
import type { Mesa } from '../types';

interface LocalBoardProps {
    mesas: Mesa[];
    onSelectMesa: (mesa: Mesa) => void;
}

const LocalBoard: React.FC<LocalBoardProps> = ({ mesas, onSelectMesa }) => {
    return (
        <div>
            <h1 className="text-3xl font-heading font-bold mb-8 text-text-primary">Gestión de Salón</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {mesas.map((mesa, i) => (
                    <button 
                        key={mesa.numero} 
                        onClick={() => onSelectMesa(mesa)}
                        style={{ '--delay': `${i * 30}ms` } as React.CSSProperties}
                        className={`group animate-fade-in-up bg-surface rounded-2xl shadow-lg flex flex-col items-center justify-center p-6 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 border-2 ${
                            mesa.ocupada ? 'border-primary/50' : 'border-transparent'
                        }`}
                    >
                        <h2 className="text-5xl font-heading font-extrabold text-text-primary group-hover:text-primary transition-colors">
                            {mesa.numero}
                        </h2>
                        <p className="font-semibold text-text-secondary mt-1">Mesa</p>
                        <span className={`mt-4 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                            mesa.ocupada ? 'bg-primary/10 text-primary' : 'bg-text-primary/10 text-text-primary'
                        }`}>
                            {mesa.ocupada ? 'Ocupada' : 'Libre'}
                        </span>
                        {mesa.ocupada && (
                            <span className="mt-2 text-xs font-mono text-text-secondary/60">{mesa.pedidoId}</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LocalBoard;