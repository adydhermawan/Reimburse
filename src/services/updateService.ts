import * as Updates from 'expo-updates';
import { Alert, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

export interface AppVersionInfo {
    version: string;
    build_number: number;
    download_url: string;
    release_notes: string | null;
    is_mandatory: boolean;
}

export interface UpdateCheckResult {
    hasUpdate: boolean;
    updateType: 'ota' | 'apk' | null;
    isDownloading: boolean;
    error: string | null;
}

class UpdateService {
    private static instance: UpdateService;

    private constructor() { }

    public static getInstance(): UpdateService {
        if (!UpdateService.instance) {
            UpdateService.instance = new UpdateService();
        }
        return UpdateService.instance;
    }

    /**
     * Check for OTA (Over-The-Air) updates via EAS Update
     */
    async checkOTAUpdate(): Promise<{ available: boolean; manifest?: any }> {
        try {
            // Skip in development mode
            if (__DEV__) {
                console.log('[UpdateService] Skipping OTA check in dev mode');
                return { available: false };
            }

            const update = await Updates.checkForUpdateAsync();

            if (update.isAvailable) {
                console.log('[UpdateService] OTA update available');
                return { available: true, manifest: update.manifest };
            }

            return { available: false };
        } catch (error) {
            console.error('[UpdateService] OTA check failed:', error);
            return { available: false };
        }
    }

    /**
     * Download and apply OTA update
     */
    async applyOTAUpdate(): Promise<boolean> {
        try {
            console.log('[UpdateService] Downloading OTA update...');
            await Updates.fetchUpdateAsync();

            console.log('[UpdateService] Reloading app with new update...');
            await Updates.reloadAsync();

            return true;
        } catch (error) {
            console.error('[UpdateService] Failed to apply OTA update:', error);
            return false;
        }
    }

    /**
     * Check for APK update from backend
     */
    async checkAPKUpdate(): Promise<{ available: boolean; versionInfo?: AppVersionInfo }> {
        try {
            const currentVersion = Constants.expoConfig?.version || '1.0.0';

            const response = await api.get<{ data: AppVersionInfo }>('/api/app-version');
            const latestVersion = response.data.data;

            if (this.isNewerVersion(latestVersion.version, currentVersion)) {
                console.log('[UpdateService] APK update available:', latestVersion.version);
                return { available: true, versionInfo: latestVersion };
            }

            return { available: false };
        } catch (error) {
            console.error('[UpdateService] APK version check failed:', error);
            return { available: false };
        }
    }

    /**
     * Prompt user to download APK update
     */
    promptAPKDownload(versionInfo: AppVersionInfo): void {
        const message = versionInfo.release_notes
            ? `Versi ${versionInfo.version} tersedia!\n\n${versionInfo.release_notes}`
            : `Versi ${versionInfo.version} tersedia!`;

        const buttons = versionInfo.is_mandatory
            ? [
                {
                    text: 'Download Sekarang',
                    onPress: () => this.openDownloadUrl(versionInfo.download_url),
                },
            ]
            : [
                {
                    text: 'Nanti',
                    style: 'cancel' as const,
                },
                {
                    text: 'Download',
                    onPress: () => this.openDownloadUrl(versionInfo.download_url),
                },
            ];

        Alert.alert('Update Tersedia', message, buttons, {
            cancelable: !versionInfo.is_mandatory,
        });
    }

    /**
     * Prompt user for OTA update
     */
    promptOTAUpdate(onConfirm: () => void): void {
        Alert.alert(
            'Update Tersedia',
            'Ada pembaruan baru untuk aplikasi. Terapkan sekarang?',
            [
                {
                    text: 'Nanti',
                    style: 'cancel',
                },
                {
                    text: 'Update',
                    onPress: onConfirm,
                },
            ]
        );
    }

    /**
     * Open download URL in browser
     */
    private openDownloadUrl(url: string): void {
        if (Platform.OS === 'android') {
            Linking.openURL(url).catch((err) => {
                console.error('[UpdateService] Failed to open download URL:', err);
                Alert.alert('Error', 'Gagal membuka link download');
            });
        }
    }

    /**
     * Compare version strings (e.g., "1.0.1" > "1.0.0")
     */
    private isNewerVersion(latest: string, current: string): boolean {
        const latestParts = latest.split('.').map(Number);
        const currentParts = current.split('.').map(Number);

        for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
            const latestPart = latestParts[i] || 0;
            const currentPart = currentParts[i] || 0;

            if (latestPart > currentPart) return true;
            if (latestPart < currentPart) return false;
        }

        return false;
    }

    /**
     * Full update check - checks both OTA and APK
     */
    async checkForUpdates(): Promise<UpdateCheckResult> {
        // First, check for OTA updates (faster, no install required)
        const otaResult = await this.checkOTAUpdate();
        if (otaResult.available) {
            return {
                hasUpdate: true,
                updateType: 'ota',
                isDownloading: false,
                error: null,
            };
        }

        // Then, check for APK updates (requires manual install)
        const apkResult = await this.checkAPKUpdate();
        if (apkResult.available && apkResult.versionInfo) {
            return {
                hasUpdate: true,
                updateType: 'apk',
                isDownloading: false,
                error: null,
            };
        }

        return {
            hasUpdate: false,
            updateType: null,
            isDownloading: false,
            error: null,
        };
    }
}

export const updateService = UpdateService.getInstance();
