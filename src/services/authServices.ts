import { supabase } from './supabase';

export const authService = {
    async login(email: string, password: string) {
        return await supabase.auth.signInWithPassword({
            email,
            password,
        });
    },

    async register(email: string, password: string) {
        return await supabase.auth.signUp({
            email,
            password,
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