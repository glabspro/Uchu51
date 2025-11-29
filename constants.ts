
import type { UserRole, View } from './types';

export const ROLE_PERMISSIONS: Record<string, View[]> = {
    owner: ['dashboard', 'local', 'cocina', 'retiro', 'delivery', 'gestion', 'caja'],
    admin: ['dashboard', 'local', 'cocina', 'retiro', 'delivery', 'gestion', 'caja'],
    cashier: ['caja', 'dashboard', 'local', 'retiro', 'delivery'],
    waiter: ['local', 'retiro', 'dashboard'],
    kitchen: ['cocina'],
    delivery: ['delivery'],
    cliente: []
};

export const DEFAULT_VIEW_BY_ROLE: Record<string, View> = {
    owner: 'dashboard',
    admin: 'dashboard',
    cashier: 'caja',
    waiter: 'local',
    kitchen: 'cocina',
    delivery: 'delivery',
    cliente: 'local'
};
