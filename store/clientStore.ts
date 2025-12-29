/**
 * Client Store - Zustand store for clients autocomplete
 * With offline caching support
 */

import { create } from 'zustand';
import { clientApi } from '../src/services';
import { Client } from '../src/types';
import {
    saveCachedClients,
    loadCachedClients,
    getLastClientsSync
} from '../src/services/offlineStorage';
import { isConnected } from '../src/services/networkService';

interface ClientState {
    clients: Client[];
    allClients: Client[]; // Cached full list for offline
    isLoading: boolean;
    isCreating: boolean;
    error: string | null;
    lastFetched: Date | null;
    isInitialized: boolean;

    // Actions
    fetchClients: (search?: string) => Promise<void>;
    createClient: (name: string) => Promise<Client | null>;
    clearClients: () => void;
    clearError: () => void;
    initFromCache: () => Promise<void>;
    syncAllClients: () => Promise<void>;
}

// Cache duration: 30 minutes
const CACHE_DURATION_MS = 30 * 60 * 1000;

export const useClientStore = create<ClientState>((set, get) => ({
    clients: [],
    allClients: [],
    isLoading: false,
    isCreating: false,
    error: null,
    lastFetched: null,
    isInitialized: false,

    /**
     * Initialize from cached data
     */
    initFromCache: async () => {
        const cached = await loadCachedClients();
        const lastSync = await getLastClientsSync();

        if (cached.length > 0) {
            set({
                allClients: cached as Client[],
                lastFetched: lastSync,
                isInitialized: true,
            });
        } else {
            set({ isInitialized: true });
        }
    },

    /**
     * Sync all clients to local cache
     * Called periodically or on app start when online
     */
    syncAllClients: async () => {
        const online = isConnected();
        if (!online) return;

        try {
            const response = await clientApi.getClients();

            if (response.success) {
                const fetchedClients = response.data;

                // Save to local cache
                await saveCachedClients(fetchedClients.map(c => ({
                    id: c.id,
                    name: c.name,
                })));

                set({
                    allClients: fetchedClients,
                    lastFetched: new Date(),
                });
            }
        } catch (error) {
            console.error('Failed to sync clients:', error);
        }
    },

    /**
     * Search clients for autocomplete
     * Falls back to cached data when offline
     */
    fetchClients: async (search?: string) => {
        const { allClients, isInitialized } = get();

        // Initialize from cache if not done
        if (!isInitialized) {
            await get().initFromCache();
        }

        const online = isConnected();

        if (!online) {
            // Offline: filter from cached allClients
            const cached = get().allClients.length > 0
                ? get().allClients
                : await loadCachedClients() as Client[];

            if (search) {
                const filtered = cached.filter(c =>
                    c.name.toLowerCase().includes(search.toLowerCase())
                );
                set({ clients: filtered });
            } else {
                set({ clients: cached });
            }
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const response = await clientApi.getClients(search);

            if (response.success) {
                set({
                    clients: response.data,
                    isLoading: false,
                });

                // If no search, this could be a full list - cache it
                if (!search && response.data.length > 0) {
                    await saveCachedClients(response.data.map(c => ({
                        id: c.id,
                        name: c.name,
                    })));
                    set({
                        allClients: response.data,
                        lastFetched: new Date(),
                    });
                }
            } else {
                // API failed - use cached data
                const cached = await loadCachedClients() as Client[];
                if (search) {
                    const filtered = cached.filter(c =>
                        c.name.toLowerCase().includes(search.toLowerCase())
                    );
                    set({ clients: filtered, isLoading: false });
                } else {
                    set({ clients: cached, isLoading: false });
                }
            }
        } catch (error: any) {
            // Network error - use cached data
            const cached = await loadCachedClients() as Client[];
            if (search) {
                const filtered = cached.filter(c =>
                    c.name.toLowerCase().includes(search.toLowerCase())
                );
                set({ clients: filtered, isLoading: false });
            } else {
                set({ clients: cached, isLoading: false });
            }
        }
    },

    /**
     * Create a new client
     */
    createClient: async (name: string): Promise<Client | null> => {
        set({ isCreating: true, error: null });

        const online = isConnected();

        if (!online) {
            // Offline: create a temporary local client
            const tempClient: Client = {
                id: -Date.now(), // Negative ID for local clients
                name: name,
            };

            set((state) => ({
                clients: [tempClient, ...state.clients],
                allClients: [tempClient, ...state.allClients],
                isCreating: false,
            }));

            // Save to cache
            const allClients = get().allClients;
            await saveCachedClients(allClients.map(c => ({
                id: c.id,
                name: c.name,
            })));

            return tempClient;
        }

        try {
            const response = await clientApi.createClient(name);

            if (response.success) {
                // Add new client to list
                set((state) => ({
                    clients: [response.data, ...state.clients],
                    allClients: [response.data, ...state.allClients],
                    isCreating: false,
                }));

                // Update cache
                const allClients = get().allClients;
                await saveCachedClients(allClients.map(c => ({
                    id: c.id,
                    name: c.name,
                })));

                return response.data;
            } else {
                set({
                    isCreating: false,
                    error: response.message || 'Gagal membuat client',
                });
                return null;
            }
        } catch (error: any) {
            set({
                isCreating: false,
                error: error.message || 'Gagal membuat client',
            });
            return null;
        }
    },

    /**
     * Clear clients list
     */
    clearClients: () => {
        set({ clients: [] });
    },

    /**
     * Clear error
     */
    clearError: () => {
        set({ error: null });
    },
}));
