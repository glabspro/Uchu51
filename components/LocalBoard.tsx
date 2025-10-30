
import React from 'react';
import type { Mesa } from '../types';

interface LocalBoardProps {
    mesas: Mesa[];
    onSelectMesa: (mesa: Mesa) => void;
}

const LocalBoard: React.FC<LocalBoardProps> = ({ mesas, onSelectMesa }) => {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-slate-800">Gestión de Salón</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {mesas.map(mesa => (
                    <button 
                        key={mesa.numero} 
                        onClick={() => onSelectMesa(mesa)}
                        className={`group bg-white rounded-xl shadow-lg flex flex-col items-center justify-center p-6 text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 ${
                            mesa.ocupada ? 'border-2 border-primary' : 'border-2 border-transparent'
                        }`}
                    >
                        <h2 className="text-5xl font-extrabold text-slate-700 group-hover:text-primary transition-colors">
                            {mesa.numero}
                        </h2>
                        <p className="font-semibold text-slate-500 mt-1">Mesa</p>
                        <span className={`mt-4 text-xs font-semibold uppercase px-3 py-1 rounded-full ${
                            mesa.ocupada ? 'bg-primary/20 text-primary' : 'bg-slate-200 text-slate-600'
                        }`}>
                            {mesa.ocupada ? 'Ocupada' : 'Libre'}
                        </span>
                        {mesa.ocupada && (
                            <span className="mt-2 text-xs font-mono text-slate-400">{mesa.pedidoId}</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LocalBoard;