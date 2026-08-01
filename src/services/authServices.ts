import { supabase } from './supabase';
import type { SystemRole } from './userService';

export const authService = {
    async login(email: string, password: string) {
        return await supabase.auth.signInWithPassword({
            email,
            password,
        });
    },

    async register(email: string, password: string, name: string, role: SystemRole, ownerEmail?: string, businessName?: string) {
        return await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    system_role: role,
                    owner_email: ownerEmail || undefined,
                    business_name: businessName || undefined,
                },
            },
        });
    },

    async logout() {
        return await supabase.auth.signOut();
    },

    async getSession() {
        const {
            data: { session },
        } = await supabase.auth.getSession();

        return session;
    },
};
