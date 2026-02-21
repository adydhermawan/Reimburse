/**
 * Platform-aware Image Compressor
 * Uses expo-image-manipulator + expo-file-system on native
 * Uses Canvas API on web
 */

import { Platform } from 'react-native';

export interface CompressionProgress {
    step: 'resizing' | 'compressing' | 'done';
    iteration?: number;
    maxIterations?: number;
    currentSize?: number;
    targetSize?: number;
}

const TARGET_SIZE = 200 * 1024; // 200KB
const MAX_DIMENSION = 1200;
const MAX_ITERATIONS = 5;

// ── Web implementation ───────────────────────────────────────

async function compressImageWeb(
    uri: string,
    onProgress?: (progress: CompressionProgress) => void
): Promise<{ uri: string; finalSize: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        // Remove strict crossOrigin requirement as it breaks local blob/data URIs
        // Only set it if it's an external http url
        if (uri.startsWith('http')) {
            img.crossOrigin = 'anonymous';
        }

        img.onload = async () => {
            try {
                onProgress?.({ step: 'resizing' });

                // Calculate new dimensions
                let { width, height } = img;
                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('Could not get canvas context');

                ctx.drawImage(img, 0, 0, width, height);

                // Iteratively compress
                let quality = 0.8;
                let finalDataUrl = '';
                let finalSize = 0;

                for (let i = 0; i < MAX_ITERATIONS; i++) {
                    onProgress?.({
                        step: 'compressing',
                        iteration: i + 1,
                        maxIterations: MAX_ITERATIONS,
                    });

                    // We use toDataURL instead of toBlob because it's more reliable synchronously on some older Web views
                    const dataUrl = canvas.toDataURL('image/jpeg', quality);

                    // Approximate size calculation for base64
                    const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
                    const padding = (dataUrl.charAt(dataUrl.length - 2) === '=') ? 2 : ((dataUrl.charAt(dataUrl.length - 1) === '=') ? 1 : 0);
                    const size = (base64Length * 0.75) - padding;

                    finalDataUrl = dataUrl;
                    finalSize = size;

                    onProgress?.({
                        step: 'compressing',
                        iteration: i + 1,
                        maxIterations: MAX_ITERATIONS,
                        currentSize: size,
                        targetSize: TARGET_SIZE,
                    });

                    if (size <= TARGET_SIZE) break;

                    quality -= 0.15; // Faster degradation
                    if (quality < 0.1) quality = 0.1;

                    // Also reduce dimensions if still too large on 3rd attempt
                    if (i >= 2 && size > TARGET_SIZE) {
                        const shrink = 0.8;
                        canvas.width = Math.round(canvas.width * shrink);
                        canvas.height = Math.round(canvas.height * shrink);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    }
                }

                if (!finalDataUrl) throw new Error('Compression produced no image data');

                onProgress?.({ step: 'done' });
                resolve({ uri: finalDataUrl, finalSize });
            } catch (err) {
                console.error("Web Compression Error:", err);
                reject(err);
            }
        };

        img.onerror = () => {
            console.error("Failed to load image into canvas helper", uri.substring(0, 100));
            reject(new Error('Failed to load image for compression'));
        };
        img.src = uri;
    });
}

// ── Native implementation ────────────────────────────────────

async function compressImageNative(
    uri: string,
    onProgress?: (progress: CompressionProgress) => void
): Promise<{ uri: string; finalSize: number }> {
    const ImageManipulator = require('expo-image-manipulator');
    const FileSystem = require('expo-file-system');

    onProgress?.({ step: 'resizing' });

    // Resize first
    let result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: MAX_DIMENSION } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    let fileInfo;
    try {
        // Try new API first using legacy import as suggested by error
        const LegacyFS = require('expo-file-system/legacy');
        fileInfo = await LegacyFS.getInfoAsync(result.uri);
    } catch (e) {
        // Fallback for older web/native mismatch
        fileInfo = await FileSystem.getInfoAsync(result.uri).catch(() => ({ size: 0 }));
    }

    let currentSize = fileInfo?.size || 0;

    // Iteratively compress if still too large
    let quality = 0.7;
    for (let i = 0; i < MAX_ITERATIONS && currentSize > TARGET_SIZE; i++) {
        onProgress?.({
            step: 'compressing',
            iteration: i + 1,
            maxIterations: MAX_ITERATIONS,
            currentSize,
            targetSize: TARGET_SIZE,
        });

        result = await ImageManipulator.manipulateAsync(
            result.uri,
            [],
            { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
        );

        try {
            const LegacyFS = require('expo-file-system/legacy');
            fileInfo = await LegacyFS.getInfoAsync(result.uri);
        } catch (e) {
            fileInfo = await FileSystem.getInfoAsync(result.uri).catch(() => ({ size: 0 }));
        }
        currentSize = fileInfo?.size || 0;
        quality -= 0.1;
        if (quality < 0.1) quality = 0.1;
    }

    onProgress?.({ step: 'done' });
    return { uri: result.uri, finalSize: currentSize };
}

// ── Public API ───────────────────────────────────────────────

export const compressImage = (
    uri: string,
    onProgress?: (progress: CompressionProgress) => void
): Promise<{ uri: string; finalSize: number }> => {
    if (Platform.OS === 'web') {
        return compressImageWeb(uri, onProgress);
    }
    return compressImageNative(uri, onProgress);
};
