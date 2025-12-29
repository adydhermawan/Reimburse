/**
 * Network Service - Monitors network connectivity
 * Uses @react-native-community/netinfo for reliable network state detection
 */

import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

// Singleton subscription manager
let subscription: NetInfoSubscription | null = null;
let currentState: NetInfoState | null = null;

// Listeners for network changes
type NetworkListener = (isConnected: boolean) => void;
const listeners: Set<NetworkListener> = new Set();

/**
 * Initialize network monitoring
 * Should be called once at app startup
 */
export const initNetworkMonitoring = (): void => {
    if (subscription) {
        return; // Already initialized
    }

    subscription = NetInfo.addEventListener((state) => {
        currentState = state;
        const isConnected = state.isConnected ?? false;

        // Notify all listeners
        listeners.forEach((listener) => {
            try {
                listener(isConnected);
            } catch (error) {
                console.error('Network listener error:', error);
            }
        });
    });
};

/**
 * Stop network monitoring
 * Call when app is being unmounted
 */
export const stopNetworkMonitoring = (): void => {
    if (subscription) {
        subscription();
        subscription = null;
    }
    listeners.clear();
    currentState = null;
};

/**
 * Check if currently connected to the network
 */
export const isConnected = (): boolean => {
    return currentState?.isConnected ?? false;
};

/**
 * Get current network state
 */
export const getNetworkState = (): NetInfoState | null => {
    return currentState;
};

/**
 * Fetch current network state (async)
 * Use this for initial check before subscription is set up
 */
export const checkConnectivity = async (): Promise<boolean> => {
    try {
        const state = await NetInfo.fetch();
        currentState = state;
        return state.isConnected ?? false;
    } catch (error) {
        console.error('Failed to check connectivity:', error);
        return false;
    }
};

/**
 * Subscribe to network changes
 * Returns unsubscribe function
 */
export const subscribeToNetworkChanges = (listener: NetworkListener): (() => void) => {
    listeners.add(listener);

    // Immediately notify with current state if known
    if (currentState !== null) {
        listener(currentState.isConnected ?? false);
    }

    return () => {
        listeners.delete(listener);
    };
};

/**
 * Check if we're on WiFi
 */
export const isOnWiFi = (): boolean => {
    return currentState?.type === 'wifi';
};

/**
 * Check if we're on cellular
 */
export const isOnCellular = (): boolean => {
    return currentState?.type === 'cellular';
};

export default {
    initNetworkMonitoring,
    stopNetworkMonitoring,
    isConnected,
    getNetworkState,
    checkConnectivity,
    subscribeToNetworkChanges,
    isOnWiFi,
    isOnCellular,
};
