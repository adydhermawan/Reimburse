/**
 * Offline Storage Service
 * Centralized AsyncStorage wrapper for offline data persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys
const STORAGE_KEYS = {
    DRAFT_ENTRY: '@offline:draft_entry',
    PENDING_SUBMISSIONS: '@offline:pending_submissions',
    CACHED_CATEGORIES: '@offline:cached_categories',
    CACHED_CLIENTS: '@offline:cached_clients',
    LAST_SYNC_CATEGORIES: '@offline:last_sync_categories',
    LAST_SYNC_CLIENTS: '@offline:last_sync_clients',
} as const;

// Types for stored data
export interface DraftEntry {
    step: number;
    imageUri: string | null;
    date: string; // ISO string
    category: string;
    categoryId: number | undefined;
    client: string;
    amount: string;
    note: string;
    savedAt: string; // ISO string
}

export interface PendingSubmission {
    localId: string;
    data: {
        client_name: string;
        category_id: number;
        amount: number;
        transaction_date: string;
        note?: string;
    };
    imageUri: string | null;
    createdAt: string; // ISO string
    attempts: number;
    lastAttempt?: string; // ISO string
}

export interface CachedCategory {
    id: number;
    name: string;
    icon: string;
    description?: string;
}

export interface CachedClient {
    id: number;
    name: string;
}

/**
 * Save draft entry to storage
 */
export const saveDraftEntry = async (draft: DraftEntry): Promise<void> => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.DRAFT_ENTRY, JSON.stringify(draft));
    } catch (error) {
        console.error('Failed to save draft entry:', error);
        throw error;
    }
};

/**
 * Load draft entry from storage
 */
export const loadDraftEntry = async (): Promise<DraftEntry | null> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.DRAFT_ENTRY);
        if (data) {
            return JSON.parse(data) as DraftEntry;
        }
        return null;
    } catch (error) {
        console.error('Failed to load draft entry:', error);
        return null;
    }
};

/**
 * Clear draft entry from storage
 */
export const clearDraftEntry = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEYS.DRAFT_ENTRY);
    } catch (error) {
        console.error('Failed to clear draft entry:', error);
    }
};

/**
 * Check if draft exists
 */
export const hasDraftEntry = async (): Promise<boolean> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.DRAFT_ENTRY);
        return data !== null;
    } catch (error) {
        console.error('Failed to check draft entry:', error);
        return false;
    }
};

/**
 * Save pending submissions to storage
 */
export const savePendingSubmissions = async (submissions: PendingSubmission[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SUBMISSIONS, JSON.stringify(submissions));
    } catch (error) {
        console.error('Failed to save pending submissions:', error);
        throw error;
    }
};

/**
 * Load pending submissions from storage
 */
export const loadPendingSubmissions = async (): Promise<PendingSubmission[]> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SUBMISSIONS);
        if (data) {
            return JSON.parse(data) as PendingSubmission[];
        }
        return [];
    } catch (error) {
        console.error('Failed to load pending submissions:', error);
        return [];
    }
};

/**
 * Add a pending submission
 */
export const addPendingSubmission = async (submission: PendingSubmission): Promise<void> => {
    try {
        const existing = await loadPendingSubmissions();
        existing.push(submission);
        await savePendingSubmissions(existing);
    } catch (error) {
        console.error('Failed to add pending submission:', error);
        throw error;
    }
};

/**
 * Remove a pending submission by localId
 */
export const removePendingSubmission = async (localId: string): Promise<void> => {
    try {
        const existing = await loadPendingSubmissions();
        const filtered = existing.filter(s => s.localId !== localId);
        await savePendingSubmissions(filtered);
    } catch (error) {
        console.error('Failed to remove pending submission:', error);
        throw error;
    }
};

/**
 * Update a pending submission
 */
export const updatePendingSubmission = async (
    localId: string,
    updates: Partial<PendingSubmission>
): Promise<void> => {
    try {
        const existing = await loadPendingSubmissions();
        const index = existing.findIndex(s => s.localId === localId);
        if (index >= 0) {
            existing[index] = { ...existing[index], ...updates };
            await savePendingSubmissions(existing);
        }
    } catch (error) {
        console.error('Failed to update pending submission:', error);
        throw error;
    }
};

/**
 * Save cached categories
 */
export const saveCachedCategories = async (categories: CachedCategory[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.CACHED_CATEGORIES, JSON.stringify(categories));
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC_CATEGORIES, new Date().toISOString());
    } catch (error) {
        console.error('Failed to save cached categories:', error);
    }
};

/**
 * Load cached categories
 */
export const loadCachedCategories = async (): Promise<CachedCategory[]> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_CATEGORIES);
        if (data) {
            return JSON.parse(data) as CachedCategory[];
        }
        return [];
    } catch (error) {
        console.error('Failed to load cached categories:', error);
        return [];
    }
};

/**
 * Get last categories sync time
 */
export const getLastCategoriesSync = async (): Promise<Date | null> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC_CATEGORIES);
        if (data) {
            return new Date(data);
        }
        return null;
    } catch (error) {
        return null;
    }
};

/**
 * Save cached clients
 */
export const saveCachedClients = async (clients: CachedClient[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.CACHED_CLIENTS, JSON.stringify(clients));
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC_CLIENTS, new Date().toISOString());
    } catch (error) {
        console.error('Failed to save cached clients:', error);
    }
};

/**
 * Load cached clients
 */
export const loadCachedClients = async (): Promise<CachedClient[]> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_CLIENTS);
        if (data) {
            return JSON.parse(data) as CachedClient[];
        }
        return [];
    } catch (error) {
        console.error('Failed to load cached clients:', error);
        return [];
    }
};

/**
 * Get last clients sync time
 */
export const getLastClientsSync = async (): Promise<Date | null> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC_CLIENTS);
        if (data) {
            return new Date(data);
        }
        return null;
    } catch (error) {
        return null;
    }
};

/**
 * Clear all offline storage
 */
export const clearAllOfflineStorage = async (): Promise<void> => {
    try {
        await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
        console.error('Failed to clear all offline storage:', error);
    }
};

export default {
    saveDraftEntry,
    loadDraftEntry,
    clearDraftEntry,
    hasDraftEntry,
    savePendingSubmissions,
    loadPendingSubmissions,
    addPendingSubmission,
    removePendingSubmission,
    updatePendingSubmission,
    saveCachedCategories,
    loadCachedCategories,
    getLastCategoriesSync,
    saveCachedClients,
    loadCachedClients,
    getLastClientsSync,
    clearAllOfflineStorage,
};
