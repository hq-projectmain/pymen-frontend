import axios from 'axios';
import {supabase} from '../services/supabase';


const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

//inyecta el JWT automaticamente en cada peticion de los servicios
apiClient.interceptors.request.use(
    async (config) => {
        const {data: {session}} = await supabase.auth.getSession();

        if (session?.access_token && config.headers) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

//manejo global de errores (como sesiones expiradas)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('Sesión inválida o expirada. Saliendo...');
            supabase.auth.signOut();
        }
        return Promise.reject(error);
    }
);