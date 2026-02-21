/**
 * Platform-aware Secure Storage
 * Uses expo-secure-store on native, localStorage on web
 */

import { Platform } from 'react-native';

let SecureStore: typeof import('expo-secure-store') | null = null;

if (Platform.OS !== 'web') {
    SecureStore = require('expo-secure-store');
}

export const getItemAsync = async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    }
    return SecureStore!.getItemAsync(key);
};

export const setItemAsync = async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error('localStorage setItem error:', e);
        }
        return;
    }
    return SecureStore!.setItemAsync(key, value);
};

export const deleteItemAsync = async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('localStorage removeItem error:', e);
        }
        return;
    }
    return SecureStore!.deleteItemAsync(key);
};
