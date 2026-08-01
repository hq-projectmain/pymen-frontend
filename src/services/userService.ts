import { authService } from './authServices';

export type SystemRole = 'platform_admin' | 'owner' | 'employee';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: string;
    fiscalRole: 'none' | 'operator' | 'admin';
    systemRole: SystemRole;
    businessOwnerId?: string | null;
    businessName?: string | null;
}

export interface RegistrationValidation {
    eligible: boolean;
    valid?: boolean;
    message?: string;
}

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    systemRole: SystemRole;
    isActive: boolean;
    createdAt: string;
}

export interface AdminBusiness {
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
    businessName: string;
    isActive: boolean;
    employeeCount: number;
    productCount: number;
    saleCount: number;
    totalRevenue: number;
    createdAt: string;
}

export interface AdminBusinessDetail {
    identity: {
        ownerId: string;
        ownerName: string;
        ownerEmail: string;
        businessName: string;
        isActive: boolean;
        createdAt: string;
    };
    employees: {
        total: number;
        active: number;
        inactive: number;
    };
    products: {
        total: number;
        active: number;
        inactive: number;
        totalStock: number;
        lowStock: number;
        lowStockThreshold: number;
    };
    sales: {
        count: number;
        totalRevenue: number;
        averageTicket: number;
        withCae: number;
        withoutCae: number;
    };
    dailyActivity: Array<{
        date: string;
        saleCount: number;
        revenue: number;
    }>;
    topProducts: Array<{
        productId: string;
        name: string;
        quantity: number;
        revenue: number;
    }>;
    recentSales: Array<{
        id: string;
        totalPrice: number;
        createdAt: string;
        hasCae: boolean;
        unitCount: number;
    }>;
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

async function parseResponse<T>(response: Response, fallback: string): Promise<T> {
    const payload = await response.json().catch(() => null) as ({ message?: string | string[] } & T) | null;
    if (!response.ok) {
        const rawMessage = payload?.message;
        const message = Array.isArray(rawMessage) ? rawMessage.join('. ') : rawMessage;
        throw new Error(message || fallback);
    }
    return payload as T;
}

export const userService = {
    async getProfile(): Promise<UserProfile> {
        const headers = await getAuthHeaders();
        const response = await fetch(`${BASE_URL}/users/profile`, { headers });
        return parseResponse<UserProfile>(response, 'No se pudo cargar el perfil');
    },

    async updateProfile(data: { name?: string; businessName?: string }): Promise<UserProfile> {
        const headers = await getAuthHeaders();
        const response = await fetch(`${BASE_URL}/users/profile`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
        return parseResponse<UserProfile>(response, 'No se pudo actualizar el perfil');
    },

    async validateRegistration(data: { email: string; systemRole: SystemRole; ownerEmail?: string }): Promise<RegistrationValidation> {
        const response = await fetch(`${BASE_URL}/users/registration/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return parseResponse<RegistrationValidation>(response, 'No se pudo validar el registro');
    },

    async createInvitation(email: string, role: SystemRole): Promise<{ message: string }> {
        const headers = await getAuthHeaders();
        const invitationPath = role === 'platform_admin' ? 'platform-admins' : 'employees';
        const response = await fetch(`${BASE_URL}/users/invitations/${invitationPath}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ email }),
        });
        return parseResponse<{ message: string }>(response, 'No se pudo crear la invitación');
    },

    async getTeam(): Promise<TeamMember[]> {
        const headers = await getAuthHeaders();
        const response = await fetch(`${BASE_URL}/users/team`, { headers });
        return parseResponse<TeamMember[]>(response, 'No se pudo cargar el equipo');
    },

    async getAdminBusinesses(): Promise<AdminBusiness[]> {
        const headers = await getAuthHeaders();
        const response = await fetch(`${BASE_URL}/users/admin/businesses`, { headers });
        return parseResponse<AdminBusiness[]>(response, 'No se pudieron cargar los negocios');
    },

    async getAdminBusinessDetail(ownerId: string): Promise<AdminBusinessDetail> {
        const headers = await getAuthHeaders();
        const response = await fetch(`${BASE_URL}/users/admin/businesses/${encodeURIComponent(ownerId)}`, { headers });
        return parseResponse<AdminBusinessDetail>(response, 'No se pudo cargar el detalle del negocio');
    },
};
