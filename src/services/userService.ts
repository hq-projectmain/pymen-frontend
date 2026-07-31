import { authService } from './authServices';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: string;
    fiscalRole: 'none' | 'operator' | 'admin';
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

export const userService = {
    async getProfile(): Promise<UserProfile> {
        const headers = await getAuthHeaders();
        const response = await fetch(`${BASE_URL}/users/profile`, { headers });
        if (!response.ok) throw new Error('No se pudo cargar el perfil');
        return await response.json();
    },

    async updateProfile(data: { name?: string }): Promise<UserProfile> {
        const headers = await getAuthHeaders();
        const response = await fetch(`${BASE_URL}/users/profile`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('No se pudo actualizar el perfil');
        return await response.json();
    },
};
