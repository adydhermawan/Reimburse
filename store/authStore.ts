/**
 * Auth Store - Zustand store for authentication state
 * Integrates with authApi for real backend calls
 */

import { create } from 'zustand';
import { authApi, getToken, setToken, removeToken, getUserData, setUserData, removeUserData } from '../src/services';
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
     * Uses cached user data for offline support
     */
    initAuth: async () => {
        try {
            const token = await getToken();
            const cachedUser = await getUserData();

            if (token) {
                // We have a token
                if (cachedUser) {
                    // We have cached user data, set authenticated state immediately
                    set({
                        isAuthenticated: true,
                        user: cachedUser,
                        token,
                        isInitialized: true,
                    });
                } else {
                    // Token exists but no cached user, set token and try to fetch user
                    // Don't set isAuthenticated yet to avoid UI flicker, or set it but show loading
                    set({ token });
                }

                // Try to refresh/fetch user data from API
                try {
                    const response = await authApi.getCurrentUser();
                    if (response.success) {
                        // Update with fresh data from server
                        set({
                            isAuthenticated: true,
                            user: response.data.user,
                            isInitialized: true,
                        });
                        await setUserData(response.data.user);
                    } else {
                        // Failed to get user, if we didn't have cached user, we must logout
                        if (!cachedUser) throw new Error('Failed to fetch user');
                    }
                } catch (error: any) {
                    // Check if error is 401 (unauthorized) - token is invalid
                    if (error.response?.status === 401) {
                        // Token is invalid, clear everything
                        await removeToken();
                        await removeUserData();
                        set({ isAuthenticated: false, user: null, token: null, isInitialized: true });
                    } else {
                        // Network error or other error
                        if (cachedUser) {
                            // Keep using cached data if we have it
                            console.log('Using cached user data due to error:', error.message);
                        } else {
                            // No cached user and failed api call - we can't authenticate
                            // But maybe don't logout for network errors? 
                            // For now, if no cache and no network, we might be stuck.
                            // Better to assume we are authenticated if we have a token, but we need user data.
                            // If we can't get user data and have no cache, we probably should logout or show retry.
                            // Let's safe fail to logout if we really can't get user.
                            set({ isInitialized: true, isAuthenticated: false });
                        }
                    }
                }
            } else {
                // No token, user needs to login
                set({ isInitialized: true, isAuthenticated: false });
            }
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
                // Persist token and user data to storage (localStorage on web, SecureStore on native)
                await setToken(response.data.token);
                await setUserData(response.data.user);

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
                // Persist token and user data to storage
                await setToken(response.data.token);
                await setUserData(response.data.user);

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
            // Clear persisted auth data from storage
            await removeToken();
            await removeUserData();

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
