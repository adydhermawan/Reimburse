/**
 * Network Service - Monitors network connectivity
 * Uses @react-native-community/netinfo on native, navigator.onLine on web
 */

import { Platform } from 'react-native';

// Listeners for network changes
type NetworkListener = (isConnected: boolean) => void;
const listeners: Set<NetworkListener> = new Set();

let _isConnected: boolean = true;
let _networkType: string = 'unknown';
let _initialized = false;

// ── Web implementation ───────────────────────────────────────

function initWeb(): void {
    if (_initialized) return;
    _initialized = true;

    _isConnected = navigator.onLine;

    const handler = () => {
        _isConnected = navigator.onLine;
        listeners.forEach((listener) => {
            try {
                listener(_isConnected);
            } catch (error) {
                console.error('Network listener error:', error);
            }
        });
    };

    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
}

// ── Native implementation (lazy import) ──────────────────────

let nativeSubscription: (() => void) | null = null;

function initNative(): void {
    if (_initialized) return;
    _initialized = true;

    const NetInfo = require('@react-native-community/netinfo').default;

    nativeSubscription = NetInfo.addEventListener((state: any) => {
        _isConnected = state.isConnected ?? false;
        _networkType = state.type ?? 'unknown';

        listeners.forEach((listener) => {
            try {
                listener(_isConnected);
            } catch (error) {
                console.error('Network listener error:', error);
            }
        });
    });
}

// ── Public API ───────────────────────────────────────────────

/**
 * Initialize network monitoring
 * Should be called once at app startup
 */
export const initNetworkMonitoring = (): void => {
    if (Platform.OS === 'web') {
        initWeb();
    } else {
        initNative();
    }
};

/**
 * Stop network monitoring
 */
export const stopNetworkMonitoring = (): void => {
    if (Platform.OS !== 'web' && nativeSubscription) {
        nativeSubscription();
        nativeSubscription = null;
    }
    listeners.clear();
    _initialized = false;
};

/**
 * Check if currently connected to the network
 */
export const isConnected = (): boolean => {
    return _isConnected;
};

/**
 * Get current network state
 */
export const getNetworkState = (): { isConnected: boolean; type: string } => {
    return { isConnected: _isConnected, type: _networkType };
};

/**
 * Fetch current network state (async)
 */
export const checkConnectivity = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
        _isConnected = navigator.onLine;
        return _isConnected;
    }

    try {
        const NetInfo = require('@react-native-community/netinfo').default;
        const state = await NetInfo.fetch();
        _isConnected = state.isConnected ?? false;
        return _isConnected;
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

    // Immediately notify with current state
    listener(_isConnected);

    return () => {
        listeners.delete(listener);
    };
};

/**
 * Check if we're on WiFi
 */
export const isOnWiFi = (): boolean => {
    if (Platform.OS === 'web') {
        // Web can't reliably detect WiFi vs cellular
        return navigator.onLine;
    }
    return _networkType === 'wifi';
};

/**
 * Check if we're on cellular
 */
export const isOnCellular = (): boolean => {
    if (Platform.OS === 'web') {
        return false; // Can't detect on web
    }
    return _networkType === 'cellular';
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
