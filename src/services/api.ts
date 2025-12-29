/**
 * API Client Configuration
 * Axios instance with interceptors for authentication
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';

// Storage keys
const TOKEN_KEY = 'auth_token';

// Base URL - Change this for production or physical device testing
// For physical device testing, use your computer's IP address
// Example: http://192.168.1.100:8888/api
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8888/api';

// Token storage helpers
export const getToken = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
};

export const setToken = async (token: string): Promise<void> => {
    try {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
        console.error('Error setting token:', error);
    }
};

export const removeToken = async (): Promise<void> => {
    try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
        console.error('Error removing token:', error);
    }
};

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Accept': 'application/json',

        'Content-Type': 'application/json',
        // Add fake User-Agent to bypass Cloudflare 520 errors
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await getToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
        let message = 'Terjadi kesalahan pada server. Silakan coba lagi.';

        if (!error.response) {
            // Network Error or Server Down
            message = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda atau pastikan server berjalan.';
            console.error('Network/Server Error:', error.message);
        } else {
            // Server responded with error status
            const status = error.response.status;

            if (status === 401) {
                // Token expired or invalid - clear it
                await removeToken();
                message = 'Sesi Anda telah berakhir. Silakan login kembali.';
            } else if (status === 404) {
                message = 'Data tidak ditemukan.';
            } else if (status >= 500) {
                message = 'Terjadi kesalahan internal pada server.';
            } else if (error.response.data && error.response.data.message) {
                // Use server provided message if available
                message = error.response.data.message;
            }
        }

        // Return a rejected promise with a standard error object
        return Promise.reject({
            ...error,
            message: message, // Override or add user-friendly message
            originalError: error // Keep original error if needed
        });
    }
);

export default api;
