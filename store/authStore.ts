/**
 * Auth Store - Zustand store for authentication state
 * Integrates with authApi for real backend calls
 */

import { create } from 'zustand';
import { authApi, getToken, removeToken } from '../src/services';
import { User } from '../src/types';

interface AuthState {
    isAuthenticated: boolean;
    isInitialized: boolean;
    isLoading: boolean;
    user: User | null;
    token: string | null;
    error: string | null;

    // Actions
    initAuth: () => Promise<void>;
    login: (email: string, password: string) => Promise<boolean>;
    register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<boolean>;
    logout: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    isAuthenticated: false,
    isInitialized: false,
    isLoading: false,
    user: null,
    token: null,
    error: null,

    /**
     * Initialize auth state - check for existing token on app load
     */
    initAuth: async () => {
        try {
            const token = await getToken();

            if (token) {
                // Token exists, try to get current user
                try {
                    const response = await authApi.getCurrentUser();
                    if (response.success) {
                        set({
                            isAuthenticated: true,
                            user: response.data.user,
                            token,
                            isInitialized: true,
                        });
                        return;
                    }
                } catch (error) {
                    // Token invalid, remove it
                    await removeToken();
                }
            }

            set({ isInitialized: true, isAuthenticated: false });
        } catch (error) {
            set({ isInitialized: true, isAuthenticated: false });
        }
    },

    /**
     * Login user with email and password
     */
    login: async (email: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
            const response = await authApi.login(email, password);

            if (response.success) {
                set({
                    isAuthenticated: true,
                    user: response.data.user,
                    token: response.data.token,
                    isLoading: false,
                    error: null,
                });
                return true;
            } else {
                set({
                    isLoading: false,
                    error: response.message || 'Login gagal',
                });
                return false;
            }
        } catch (error: any) {
            console.log('Login Error Full:', error);
            const status = error.response?.status || 'Unknown Status';
            const url = error.config?.url || 'Unknown URL';
            const rawBody = JSON.stringify(error.response?.data || {}, null, 2);

            const detailedError = `Status: ${status}\nURL: ${url}\n\nResponse:\n${rawBody}`;

            const errorMessage =
                error.response?.data?.message ||
                error.response?.data?.errors?.email?.[0] ||
                'Email atau password salah';

            set({
                isLoading: false,
                // Combine user friendly message with debug info
                error: `${errorMessage}\n\n[DEBUG INFO]\n${detailedError}`,
            });
            return false;
        }
    },

    /**
     * Register new user
     */
    register: async (
        name: string,
        email: string,
        password: string,
        passwordConfirmation: string
    ): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
            const response = await authApi.register(name, email, password, passwordConfirmation);

            if (response.success) {
                set({
                    isAuthenticated: true,
                    user: response.data.user,
                    token: response.data.token,
                    isLoading: false,
                    error: null,
                });
                return true;
            } else {
                set({
                    isLoading: false,
                    error: response.message || 'Registrasi gagal',
                });
                return false;
            }
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                error.response?.data?.errors?.email?.[0] ||
                'Registrasi gagal, coba lagi';

            set({
                isLoading: false,
                error: errorMessage,
            });
            return false;
        }
    },

    /**
     * Logout user
     */
    logout: async () => {
        set({ isLoading: true });

        try {
            await authApi.logout();
        } catch (error) {
            // Ignore errors, we'll clear local state anyway
        } finally {
            set({
                isAuthenticated: false,
                user: null,
                token: null,
                isLoading: false,
                error: null,
            });
        }
    },

    /**
     * Clear error message
     */
    clearError: () => {
        set({ error: null });
    },
}));
