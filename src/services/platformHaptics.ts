/**
 * Platform-aware Haptics
 * Uses expo-haptics on native, no-op on web
 */

import { Platform } from 'react-native';

let Haptics: typeof import('expo-haptics') | null = null;

if (Platform.OS !== 'web') {
    Haptics = require('expo-haptics');
}

// Mirror expo-haptics enum
export const NotificationFeedbackType = {
    Success: 'success' as const,
    Warning: 'warning' as const,
    Error: 'error' as const,
};

export const ImpactFeedbackStyle = {
    Light: 'light' as const,
    Medium: 'medium' as const,
    Heavy: 'heavy' as const,
};

export const notificationAsync = async (
    type: string = NotificationFeedbackType.Success
): Promise<void> => {
    if (Platform.OS === 'web') {
        // Try navigator.vibrate as a subtle fallback
        try {
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        } catch {
            // Silently ignore - haptics are non-essential
        }
        return;
    }
    if (Haptics) {
        return Haptics.notificationAsync(type as any);
    }
};

export const impactAsync = async (
    style: string = ImpactFeedbackStyle.Medium
): Promise<void> => {
    if (Platform.OS === 'web') {
        try {
            if (navigator.vibrate) {
                navigator.vibrate(30);
            }
        } catch {
            // no-op
        }
        return;
    }
    if (Haptics) {
        return Haptics.impactAsync(style as any);
    }
};

export const selectionAsync = async (): Promise<void> => {
    if (Platform.OS === 'web') {
        return;
    }
    if (Haptics) {
        return Haptics.selectionAsync();
    }
};
