/**
 * Offline Sync Store - Manages pending submissions and sync state
 */

import { create } from 'zustand';
import { reimbursementApi } from '../src/services';
import {
    loadPendingSubmissions,
    savePendingSubmissions,
    addPendingSubmission as addToStorage,
    removePendingSubmission as removeFromStorage,
    updatePendingSubmission as updateInStorage,
    PendingSubmission,
} from '../src/services/offlineStorage';
import {
    initNetworkMonitoring,
    subscribeToNetworkChanges,
    isConnected,
    checkConnectivity,
} from '../src/services/networkService';

// Generate unique local ID
const generateLocalId = (): string => {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

interface OfflineSyncState {
    // Network status
    isOnline: boolean;

    // Pending submissions
    pendingSubmissions: PendingSubmission[];

    // Sync state
    isSyncing: boolean;
    syncError: string | null;

    // Actions
    initialize: () => Promise<void>;
    setOnlineStatus: (status: boolean) => void;
    addPendingSubmission: (data: {
        client_name: string;
        category_id: number;
        amount: number;
        transaction_date: string;
        note?: string;
    }, imageUri: string | null) => Promise<string>;
    syncPendingSubmissions: () => Promise<void>;
    removePendingSubmission: (localId: string) => Promise<void>;
    getPendingCount: () => number;
    clearError: () => void;
}

export const useOfflineSyncStore = create<OfflineSyncState>((set, get) => ({
    isOnline: true,
    pendingSubmissions: [],
    isSyncing: false,
    syncError: null,

    /**
     * Initialize the offline sync store
     * Load pending submissions and set up network monitoring
     */
    initialize: async () => {
        // Load pending submissions from storage
        const pending = await loadPendingSubmissions();
        set({ pendingSubmissions: pending });

        // Initialize network monitoring
        initNetworkMonitoring();

        // Check initial connectivity
        const online = await checkConnectivity();
        set({ isOnline: online });

        // Subscribe to network changes
        subscribeToNetworkChanges((isConnected) => {
            const wasOffline = !get().isOnline;
            set({ isOnline: isConnected });

            // If we just came online and have pending submissions, sync them
            if (isConnected && wasOffline && get().pendingSubmissions.length > 0) {
                console.log('Network restored, syncing pending submissions...');
                get().syncPendingSubmissions();
            }
        });

        // If we're online and have pending submissions, sync them
        if (online && pending.length > 0) {
            get().syncPendingSubmissions();
        }
    },

    /**
     * Set online status
     */
    setOnlineStatus: (status: boolean) => {
        set({ isOnline: status });
    },

    /**
     * Add a new pending submission
     * Returns the local ID for tracking
     */
    addPendingSubmission: async (data, imageUri) => {
        const localId = generateLocalId();
        const submission: PendingSubmission = {
            localId,
            data,
            imageUri,
            createdAt: new Date().toISOString(),
            attempts: 0,
        };

        // Save to storage
        await addToStorage(submission);

        // Update state
        set((state) => ({
            pendingSubmissions: [...state.pendingSubmissions, submission],
        }));

        return localId;
    },

    /**
     * Sync all pending submissions
     * Guard against duplicate calls
     */
    syncPendingSubmissions: async () => {
        const { pendingSubmissions, isOnline, isSyncing } = get();

        // Guard: prevent duplicate sync
        if (isSyncing) {
            console.log('Sync already in progress, skipping...');
            return;
        }

        if (!isOnline) {
            console.log('Cannot sync: offline');
            return;
        }

        if (pendingSubmissions.length === 0) {
            console.log('No pending submissions to sync');
            return;
        }

        // Take a snapshot of current pending items to avoid race conditions
        const itemsToSync = [...pendingSubmissions];

        set({ isSyncing: true, syncError: null });

        const synced: string[] = [];
        const failed: string[] = [];

        for (const submission of itemsToSync) {
            try {
                // Update attempt count
                const now = new Date().toISOString();
                await updateInStorage(submission.localId, {
                    attempts: submission.attempts + 1,
                    lastAttempt: now,
                });

                // Prepare image data if exists and file is still accessible
                let imageData = undefined;
                if (submission.imageUri) {
                    try {
                        // Import FileSystem dynamically to check if image exists
                        const FileSystem = require('expo-file-system');
                        const fileInfo = await FileSystem.getInfoAsync(submission.imageUri);

                        if (fileInfo.exists) {
                            // Extract filename from URI
                            const uriParts = submission.imageUri.split('/');
                            const filename = uriParts[uriParts.length - 1] || `receipt_${Date.now()}.jpg`;
                            const fileExtension = filename.split('.').pop()?.toLowerCase() || 'jpg';
                            const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';

                            imageData = {
                                uri: submission.imageUri,
                                type: mimeType,
                                name: filename,
                            };
                        } else {
                            console.warn(`Image file not found: ${submission.imageUri}`);
                        }
                    } catch (imgError) {
                        console.warn(`Error checking image file: ${imgError}`);
                        // Continue without image
                    }
                }

                // Submit to API
                console.log(`Syncing submission ${submission.localId}...`);
                const response = await reimbursementApi.createReimbursement({
                    ...submission.data,
                    image: imageData,
                });

                if (response.success) {
                    console.log(`Synced submission ${submission.localId}`);
                    synced.push(submission.localId);
                } else {
                    console.error(`Failed to sync ${submission.localId}:`, response.message);
                    failed.push(submission.localId);
                }
            } catch (error: any) {
                console.error(`Error syncing ${submission.localId}:`, error.message);
                failed.push(submission.localId);
            }
        }

        // Remove successfully synced submissions
        for (const localId of synced) {
            await removeFromStorage(localId);
        }

        // Update state
        const remaining = await loadPendingSubmissions();
        set({
            pendingSubmissions: remaining,
            isSyncing: false,
            syncError: failed.length > 0
                ? `Gagal sync ${failed.length} item. Akan dicoba lagi.`
                : null,
        });
    },

    /**
     * Remove a pending submission
     */
    removePendingSubmission: async (localId: string) => {
        await removeFromStorage(localId);
        set((state) => ({
            pendingSubmissions: state.pendingSubmissions.filter(s => s.localId !== localId),
        }));
    },

    /**
     * Get count of pending submissions
     */
    getPendingCount: () => {
        return get().pendingSubmissions.length;
    },

    /**
     * Clear sync error
     */
    clearError: () => {
        set({ syncError: null });
    },
}));
