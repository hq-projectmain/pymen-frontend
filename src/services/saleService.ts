import { apiClient } from '../api/apiClient';

export interface SaleItem {
    id: string;
    quantity: number;
    priceAtSale: number;
    product: { id: string; name: string } | null;
}

export interface Sale {
    id: string;
    totalPrice: number;
    items: SaleItem[];
    createdAt: string;
}

export interface CreateSaleItem {
    product_id: string;
    quantity: number;
}

export const saleService = {
    async getSales(): Promise<Sale[]> {
        const { data } = await apiClient.get<Sale[]>('/sales');
        return data;
    },

    async createSale(items: CreateSaleItem[], totalPrice: number): Promise<Sale> {
        const { data } = await apiClient.post<Sale>('/sales', { totalPrice, items });
        return data;
    },
};
