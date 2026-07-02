import {apiClient} from '../api/apiClient';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: string;
}

export const userService = {
    async getProfile(): Promise<UserProfile> {
        //el backend deduce quien es por el token, no necesita ID en la URL
        const {data} = await apiClient.get<UserProfile>('/users/profile');
        return data;
    },

    async updateProfile(data: { name?: string }): Promise<UserProfile> {
        const {data: updatedUser} = await apiClient.put<UserProfile>('/users/profile', data);
        return updatedUser;
    },
};