import { authService } from './authServices';

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    isActive?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProductData {
    name: string;
    description: string;
    price: number;
    stock: number;
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

export const productService = {
    async getProducts(): Promise<Product[]> {
        const headers = await getAuthHeaders();
        if (!headers.userId) throw new Error('No hay sesión activa');

        const response = await fetch(`${BASE_URL}/products/user/${headers.userId}`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) throw new Error('No se pudieron cargar los productos');

        return await response.json();
    },

    async createProduct(data: CreateProductData): Promise<Product> {
        const headers = await getAuthHeaders();
        if (!headers.userId) throw new Error('No hay sesión activa');

        const response = await fetch(`${BASE_URL}/products`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ ...data, userId: headers.userId }),
        });

        if (!response.ok) throw new Error('No se pudo crear el producto');

        return await response.json();
    },

    async updateProduct(id: string, data: { name?: string; price?: number; stock?: number; isActive?: boolean; }): Promise<Product> {
        const headers = await getAuthHeaders();
        const response = await fetch(`${BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('No se pudo actualizar el producto');
        return await response.json();
    },

    async deactivateProduct(id: string): Promise<Product> {
        const headers = await getAuthHeaders();
        const response = await fetch(`${BASE_URL}/products/${id}`, {
            method: 'DELETE',
            headers,
        });
        if (!response.ok) throw new Error('No se pudo desactivar el producto');
        return await response.json();
    },
};
