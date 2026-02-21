/**
 * Platform-aware Image Picker
 * Uses expo-image-picker on native, HTML5 <input type="file"> on web
 */

import { Platform } from 'react-native';

// Common result type matching expo-image-picker
export interface ImagePickerResult {
    canceled: boolean;
    assets: Array<{
        uri: string;
        width?: number;
        height?: number;
        type?: string;
        fileName?: string;
        fileSize?: number;
        // Web-only: hold the File object for proper FormData upload
        file?: File;
    }>;
}

export const MediaTypeOptions = {
    Images: 'images' as const,
    Videos: 'videos' as const,
    All: 'all' as const,
};

// ── Web helpers ──────────────────────────────────────────────

function pickFileWeb(accept: string, capture?: string): Promise<ImagePickerResult> {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        if (capture) {
            input.setAttribute('capture', capture);
        }
        input.style.display = 'none';
        document.body.appendChild(input);

        input.onchange = () => {
            const file = input.files?.[0];
            document.body.removeChild(input);

            if (!file) {
                resolve({ canceled: true, assets: [] });
                return;
            }

            const uri = URL.createObjectURL(file);
            resolve({
                canceled: false,
                assets: [{
                    uri,
                    type: file.type,
                    fileName: file.name,
                    fileSize: file.size,
                    file, // keep reference for upload
                }],
            });
        };

        // Handle cancel (user closes file dialog)
        input.oncancel = () => {
            document.body.removeChild(input);
            resolve({ canceled: true, assets: [] });
        };

        input.click();
    });
}

// ── Exported API ─────────────────────────────────────────────

/**
 * Request camera permissions (no-op on web, browsers handle it)
 */
export const requestCameraPermissionsAsync = async (): Promise<{ status: string }> => {
    if (Platform.OS === 'web') {
        return { status: 'granted' };
    }
    const ImagePicker = require('expo-image-picker');
    return ImagePicker.requestCameraPermissionsAsync();
};

/**
 * Launch camera
 */
export const launchCameraAsync = async (
    options?: {
        allowsEditing?: boolean;
        aspect?: [number, number];
        quality?: number;
    }
): Promise<ImagePickerResult> => {
    if (Platform.OS === 'web') {
        // On web, use file input with capture="environment" to prefer rear camera
        return pickFileWeb('image/*', 'environment');
    }
    const ImagePicker = require('expo-image-picker');
    return ImagePicker.launchCameraAsync(options);
};

/**
 * Launch image library / gallery
 */
export const launchImageLibraryAsync = async (
    options?: {
        mediaTypes?: string;
        allowsEditing?: boolean;
        quality?: number;
    }
): Promise<ImagePickerResult> => {
    if (Platform.OS === 'web') {
        return pickFileWeb('image/*');
    }
    const ImagePicker = require('expo-image-picker');
    return ImagePicker.launchImageLibraryAsync(options);
};
