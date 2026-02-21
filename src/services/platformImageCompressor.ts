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
        img.crossOrigin = 'anonymous';

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
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, width, height);

                // Iteratively compress
                let quality = 0.8;
                let blob: Blob | null = null;

                for (let i = 0; i < MAX_ITERATIONS; i++) {
                    onProgress?.({
                        step: 'compressing',
                        iteration: i + 1,
                        maxIterations: MAX_ITERATIONS,
                    });

                    blob = await new Promise<Blob | null>((res) =>
                        canvas.toBlob(res, 'image/jpeg', quality)
                    );

                    if (!blob) {
                        throw new Error('Canvas toBlob failed');
                    }

                    onProgress?.({
                        step: 'compressing',
                        iteration: i + 1,
                        maxIterations: MAX_ITERATIONS,
                        currentSize: blob.size,
                        targetSize: TARGET_SIZE,
                    });

                    if (blob.size <= TARGET_SIZE) break;

                    quality -= 0.1;
                    if (quality < 0.1) quality = 0.1;

                    // Also reduce dimensions if still too large
                    if (i >= 2 && blob.size > TARGET_SIZE) {
                        const shrink = 0.8;
                        canvas.width = Math.round(canvas.width * shrink);
                        canvas.height = Math.round(canvas.height * shrink);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    }
                }

                if (!blob) throw new Error('Compression produced no blob');

                const compressedUri = URL.createObjectURL(blob);
                onProgress?.({ step: 'done' });

                resolve({ uri: compressedUri, finalSize: blob.size });
            } catch (err) {
                reject(err);
            }
        };

        img.onerror = () => reject(new Error('Failed to load image for compression'));
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

    let fileInfo = await FileSystem.getInfoAsync(result.uri);
    let currentSize = fileInfo.size || 0;

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

        fileInfo = await FileSystem.getInfoAsync(result.uri);
        currentSize = fileInfo.size || 0;
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
