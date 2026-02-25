/**
 * Auth API Service
 * Handles authentication endpoints
 */

import api, { setToken, removeToken, setUserData, removeUserData } from './api';
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

        // Store token and user data on successful login
        if (response.data.success && response.data.data.token) {
            await setToken(response.data.data.token);
            await setUserData(response.data.data.user);
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

        // Store token and user data on successful registration
        if (response.data.success && response.data.data.token) {
            await setToken(response.data.data.token);
            await setUserData(response.data.data.user);
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
            // Always remove token and user data, even if API call fails
            await removeToken();
            await removeUserData();
        }
    },

    /**
     * Get current authenticated user
     */
    getCurrentUser: async (): Promise<ApiResponse<{ user: User }>> => {
        const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
        return response.data;
    },

    /**
     * Update user profile settings
     */
    updateProfile: async (data: { preferred_ai_model?: string }): Promise<ApiResponse<{ user: User }>> => {
        const response = await api.put<ApiResponse<{ user: User }>>('/auth/me', data);

        // Update user data in cache
        if (response.data.success && response.data.data.user) {
            await setUserData(response.data.data.user);
        }

        return response.data;
    },
};

export default authApi;
