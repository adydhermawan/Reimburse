/**
 * Auth API Service
 * Handles authentication endpoints
 */

import api, { setToken, removeToken } from './api';
import { ApiResponse, AuthData, User } from '../types';

export const authApi = {
    /**
     * Login user
     */
    login: async (email: string, password: string): Promise<ApiResponse<AuthData>> => {
        const response = await api.post<ApiResponse<AuthData>>('/auth/login', {
            email,
            password,
        });

        // Store token on successful login
        if (response.data.success && response.data.data.token) {
            await setToken(response.data.data.token);
        }

        return response.data;
    },

    /**
     * Register new user
     */
    register: async (
        name: string,
        email: string,
        password: string,
        password_confirmation: string
    ): Promise<ApiResponse<AuthData>> => {
        const response = await api.post<ApiResponse<AuthData>>('/auth/register', {
            name,
            email,
            password,
            password_confirmation,
        });

        // Store token on successful registration
        if (response.data.success && response.data.data.token) {
            await setToken(response.data.data.token);
        }

        return response.data;
    },

    /**
     * Logout user
     */
    logout: async (): Promise<ApiResponse<null>> => {
        try {
            const response = await api.post<ApiResponse<null>>('/auth/logout');
            return response.data;
        } finally {
            // Always remove token, even if API call fails
            await removeToken();
        }
    },

    /**
     * Get current authenticated user
     */
    getCurrentUser: async (): Promise<ApiResponse<{ user: User }>> => {
        const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
        return response.data;
    },
};

export default authApi;
