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
    if (!session?.access_token) throw new Error('No hay sesión activa');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
    };
}

export const saleService = {
    async getSales(): Promise<Sale[]> {
        const headers = await getAuthHeaders();

        const response = await fetch(`${BASE_URL}/sales`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) throw new Error('No se pudieron cargar las ventas');

        return await response.json();
    },

    async createSale(items: CreateSaleItem[], totalPrice: number): Promise<Sale> {
        const headers = await getAuthHeaders();

        const response = await fetch(`${BASE_URL}/sales`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ totalPrice, items }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'No se pudo registrar la venta');
        }

        return await response.json();
    },
};
