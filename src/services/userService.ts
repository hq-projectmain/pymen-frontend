import { authService } from './authServices';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: string;
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

export const userService = {
    async getProfile(): Promise<UserProfile> {
        const headers = await getAuthHeaders();
        if (!headers.userId) throw new Error('No hay sesión activa');
        const response = await fetch(`${BASE_URL}/users/${headers.userId}`, { headers });
        if (!response.ok) throw new Error('No se pudo cargar el perfil');
        return await response.json();
    },

    async updateProfile(data: { name?: string }): Promise<UserProfile> {
        const headers = await getAuthHeaders();
        if (!headers.userId) throw new Error('No hay sesión activa');
        const response = await fetch(`${BASE_URL}/users/${headers.userId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('No se pudo actualizar el perfil');
        return await response.json();
    },
};
