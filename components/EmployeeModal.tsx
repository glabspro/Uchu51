
import React, { useState, useEffect } from 'react';
import type { Employee } from '../types';
import { LockClosedIcon, UserIcon } from './icons';

interface EmployeeModalProps {
    employee: Employee | null;
    onSave: (employee: Employee) => void;
    onClose: () => void;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({ employee, onSave, onClose }) => {
    const [name, setName] = useState('');
    const [role, setRole] = useState<Employee['role']>('waiter');
    const [pinCode, setPinCode] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (employee) {
            setName(employee.name);
            setRole(employee.role);
            setPinCode(employee.pin_code);
        }
    }, [employee]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('El nombre es obligatorio');
            return;
        }
        if (!/^\d{4}$/.test(pinCode)) {
            setError('El PIN debe tener 4 dígitos numéricos');
            return;
        }

        const newEmployee: Employee = {
            id: employee?.id || '',
            name: name.trim(),
            role,
            pin_code: pinCode,
            is_active: true,
            restaurant_id: employee?.restaurant_id || ''
        };

        onSave(newEmployee);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4" onClick={onClose}>
            <div className="bg-surface dark:bg-zinc-800 rounded-2xl shadow-xl p-6 max-w-md w-full flex flex-col animate-fade-in-scale" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-heading font-bold text-text-primary dark:text-zinc-100 mb-6">
                    {employee ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-zinc-400 mb-1">Nombre Completo</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary dark:text-zinc-500" />
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-background dark:bg-zinc-700/50 border border-text-primary/10 dark:border-zinc-700 rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary focus:border-primary transition"
                                placeholder="Ej: Juan Pérez"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-zinc-400 mb-1">Rol / Cargo</label>
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value as Employee['role'])}
                            className="w-full bg-background dark:bg-zinc-700/50 border border-text-primary/10 dark:border-zinc-700 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary transition"
                        >
                            <option value="waiter">Mozo / Mesero</option>
                            <option value="cashier">Cajero</option>
                            <option value="kitchen">Cocinero / Chef</option>
                            <option value="delivery">Repartidor / Motorizado</option>
                            <option value="admin">Administrador (Local)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-zinc-400 mb-1">PIN de Acceso (4 dígitos)</label>
                        <div className="relative">
                            <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary dark:text-zinc-500" />
                            <input
                                type="text"
                                maxLength={4}
                                value={pinCode}
                                onChange={e => setPinCode(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-background dark:bg-zinc-700/50 border border-text-primary/10 dark:border-zinc-700 rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary focus:border-primary transition font-mono text-lg tracking-widest"
                                placeholder="0000"
                            />
                        </div>
                        <p className="text-xs text-text-secondary dark:text-zinc-500 mt-1">Este código se usará para iniciar sesión en el terminal.</p>
                    </div>

                    {error && <p className="text-danger text-sm font-semibold">{error}</p>}

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-text-primary/10 dark:bg-zinc-700 text-text-primary dark:text-zinc-200 font-bold py-3 rounded-xl hover:bg-text-primary/20 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmployeeModal;
