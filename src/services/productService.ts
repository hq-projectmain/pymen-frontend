import { apiClient } from '../api/apiClient';

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

export const productService = {
    async getProducts(): Promise<Product[]> {
        const { data } = await apiClient.get<Product[]>('/products');
        return data;
    },

    async createProduct(data: CreateProductData): Promise<Product> {
        const { data: newProduct } = await apiClient.post<Product>('/products', data);
        return newProduct;
    },

    async updateProduct(id: string, data: Partial<CreateProductData> & { isActive?: boolean }): Promise<Product> {
        const { data: updatedProduct } = await apiClient.put<Product>(`/products/${id}`, data);
        return updatedProduct;
    },

    async deactivateProduct(id: string): Promise<Product> {
        const { data } = await apiClient.delete<Product>(`/products/${id}`);
        return data;
    },
};