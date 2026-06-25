import { authService } from './authServices';

export interface SaleItem {
    id: string;
    quantity: number;
    priceAtSale: number;
    product: { id: string; name: string } | null;
}

export interface Sale {
    id: string;
    totalPrice: number;
    user: { id: string };
    items: SaleItem[];
    createdAt: string;
}

export interface CreateSaleItem {
    product_id: string;
    quantity: number;
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/pymen';

async function getAuthHeaders() {
    const session = await authService.getSession();
    return {
        'Content-Type': 'application/json',
        'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        userId: session?.user?.id ?? '',
    };
}

export const saleService = {
    async getSales(): Promise<Sale[]> {
        const headers = await getAuthHeaders();
        if (!headers.userId) throw new Error('No hay sesión activa');

        const response = await fetch(`${BASE_URL}/sales/user/${headers.userId}`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) throw new Error('No se pudieron cargar las ventas');

        return await response.json();
    },

    async createSale(items: CreateSaleItem[], totalPrice: number): Promise<Sale> {
        const headers = await getAuthHeaders();
        if (!headers.userId) throw new Error('No hay sesión activa');

        const response = await fetch(`${BASE_URL}/sales`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ userId: headers.userId, totalPrice, items }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'No se pudo registrar la venta');
        }

        return await response.json();
    },
};
