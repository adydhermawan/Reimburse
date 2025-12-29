/**
 * Category Store - Zustand store for categories
 * With offline caching support
 */

import { create } from 'zustand';
import { categoryApi } from '../src/services';
import { Category } from '../src/types';
import {
    saveCachedCategories,
    loadCachedCategories,
    getLastCategoriesSync
} from '../src/services/offlineStorage';
import { isConnected } from '../src/services/networkService';

interface CategoryState {
    categories: Category[];
    isLoading: boolean;
    error: string | null;
    lastFetched: Date | null;
    isInitialized: boolean;

    // Actions
    fetchCategories: (forceRefresh?: boolean) => Promise<void>;
    getCategoryById: (id: number) => Category | undefined;
    clearError: () => void;
    initFromCache: () => Promise<void>;
}

// Cache duration: 30 minutes
const CACHE_DURATION_MS = 30 * 60 * 1000;

export const useCategoryStore = create<CategoryState>((set, get) => ({
    categories: [],
    isLoading: false,
    error: null,
    lastFetched: null,
    isInitialized: false,

    /**
     * Initialize from cached data
     * Called on app startup
     */
    initFromCache: async () => {
        const cached = await loadCachedCategories();
        const lastSync = await getLastCategoriesSync();

        if (cached.length > 0) {
            set({
                categories: cached as Category[],
                lastFetched: lastSync,
                isInitialized: true,
            });
        } else {
            set({ isInitialized: true });
        }
    },

    /**
     * Fetch all categories from API
     * Falls back to cache when offline
     */
    fetchCategories: async (forceRefresh = false) => {
        const { lastFetched, categories, isInitialized } = get();

        // Initialize from cache if not done
        if (!isInitialized) {
            await get().initFromCache();
        }

        // Check if we have valid cached data
        if (!forceRefresh && lastFetched && categories.length > 0) {
            const cacheExpiry = new Date(Date.now() - CACHE_DURATION_MS);
            if (lastFetched > cacheExpiry) {
                return; // Use cached data
            }
        }

        // Check network connectivity
        const online = isConnected();

        if (!online) {
            // Offline: use cached data if available, otherwise show error
            if (categories.length === 0) {
                const cached = await loadCachedCategories();
                if (cached.length > 0) {
                    set({ categories: cached as Category[] });
                } else {
                    set({ error: 'Tidak ada koneksi. Data kategori tidak tersedia.' });
                }
            }
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const response = await categoryApi.getCategories();

            if (response.success) {
                const fetchedCategories = response.data;

                // Save to local cache
                await saveCachedCategories(fetchedCategories.map(c => ({
                    id: c.id,
                    name: c.name,
                    icon: c.icon,
                    description: c.description,
                })));

                set({
                    categories: fetchedCategories,
                    isLoading: false,
                    lastFetched: new Date(),
                });
            } else {
                // API failed but we might have cached data
                if (categories.length === 0) {
                    const cached = await loadCachedCategories();
                    if (cached.length > 0) {
                        set({
                            categories: cached as Category[],
                            isLoading: false,
                        });
                        return;
                    }
                }
                set({
                    isLoading: false,
                    error: 'Gagal memuat kategori',
                });
            }
        } catch (error: any) {
            // Network error: try to use cached data
            if (categories.length === 0) {
                const cached = await loadCachedCategories();
                if (cached.length > 0) {
                    set({
                        categories: cached as Category[],
                        isLoading: false,
                    });
                    return;
                }
            }
            set({
                isLoading: false,
                error: error.message || 'Gagal memuat kategori',
            });
        }
    },

    /**
     * Get category by ID
     */
    getCategoryById: (id: number) => {
        return get().categories.find(c => c.id === id);
    },

    /**
     * Clear error
     */
    clearError: () => {
        set({ error: null });
    },
}));
