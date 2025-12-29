/**
 * SyncProvider - Initializes offline sync on app startup
 * Manages network monitoring, pending sync, and master data caching
 */

import React, { useEffect, ReactNode, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useOfflineSyncStore } from '../../store/offlineSyncStore';
import { useCategoryStore } from '../../store/categoryStore';
import { useClientStore } from '../../store/clientStore';

interface SyncProviderProps {
    children: ReactNode;
}

// Master data sync interval: 30 minutes
const MASTER_DATA_SYNC_INTERVAL = 30 * 60 * 1000;

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
    const initializeOfflineSync = useOfflineSyncStore((state) => state.initialize);
    const isOnline = useOfflineSyncStore((state) => state.isOnline);
    const syncPendingSubmissions = useOfflineSyncStore((state) => state.syncPendingSubmissions);

    const initCategoryCache = useCategoryStore((state) => state.initFromCache);
    const fetchCategories = useCategoryStore((state) => state.fetchCategories);

    const initClientCache = useClientStore((state) => state.initFromCache);
    const syncAllClients = useClientStore((state) => state.syncAllClients);

    const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);

    useEffect(() => {
        // Initialize on mount
        const initialize = async () => {
            // 1. Initialize offline sync (network monitoring + pending queue)
            await initializeOfflineSync();

            // 2. Initialize master data from cache
            await Promise.all([
                initCategoryCache(),
                initClientCache(),
            ]);

            // 3. Sync master data if online
            await syncMasterData();
        };

        initialize();

        // Set up periodic master data sync
        syncIntervalRef.current = setInterval(() => {
            if (isOnline) {
                syncMasterData();
            }
        }, MASTER_DATA_SYNC_INTERVAL);

        // Handle app state changes (foreground/background)
        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
            }
            subscription?.remove();
        };
    }, []);

    // Re-sync when coming back online
    useEffect(() => {
        if (isOnline) {
            // Sync pending submissions
            syncPendingSubmissions();

            // Sync master data
            syncMasterData();
        }
    }, [isOnline]);

    const syncMasterData = async () => {
        try {
            await Promise.all([
                fetchCategories(true), // Force refresh
                syncAllClients(),
            ]);
        } catch (error) {
            console.error('Master data sync failed:', error);
        }
    };

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
        // When app comes to foreground from background
        if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
            if (isOnline) {
                // Sync pending and master data when app becomes active
                syncPendingSubmissions();
                syncMasterData();
            }
        }
        appStateRef.current = nextAppState;
    };

    return <>{children}</>;
};

export default SyncProvider;
