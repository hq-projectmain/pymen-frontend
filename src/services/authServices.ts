import { supabase } from './supabase';

export const authService = {
    async login(email: string, password: string) {
        return await supabase.auth.signInWithPassword({
            email,
            password,
        });
    },

    async register(email: string, password: string, name: string) {
        return await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
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
