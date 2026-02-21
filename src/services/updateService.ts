import { Alert, Linking, Platform } from 'react-native';
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
     * Skipped on web — PWA updates handled by service worker
     */
    async checkOTAUpdate(): Promise<{ available: boolean; manifest?: any }> {
        if (Platform.OS === 'web' || __DEV__) {
            return { available: false };
        }

        try {
            const Updates = require('expo-updates');
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
     * Download and apply OTA update (native only)
     */
    async applyOTAUpdate(): Promise<boolean> {
        if (Platform.OS === 'web') return false;

        try {
            const Updates = require('expo-updates');
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
     * Check for APK update from backend (Android only)
     */
    async checkAPKUpdate(): Promise<{ available: boolean; versionInfo?: AppVersionInfo }> {
        if (Platform.OS === 'web') return { available: false };

        try {
            const Constants = require('expo-constants').default;
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
     * Prompt user to download APK update (Android only)
     */
    promptAPKDownload(versionInfo: AppVersionInfo): void {
        if (Platform.OS === 'web') return;

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
        if (Platform.OS === 'web') return;

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
     * Download and install APK (Android only)
     */
    async downloadAndInstallAPK(url: string, onProgress: (progress: number) => void): Promise<void> {
        if (Platform.OS !== 'android') {
            return;
        }

        try {
            const FileSystem = require('expo-file-system');
            const IntentLauncher = require('expo-intent-launcher');

            const downloadResumable = FileSystem.createDownloadResumable(
                url,
                ((FileSystem as any).documentDirectory || '') + 'app-update.apk',
                {},
                (downloadProgress: any) => {
                    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                    onProgress(progress);
                }
            );

            const result = await downloadResumable.downloadAsync();

            if (result && result.uri) {
                const contentUri = await FileSystem.getContentUriAsync(result.uri);

                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: contentUri,
                    flags: 1,
                    type: 'application/vnd.android.package-archive',
                });
            }
        } catch (error) {
            console.error('[UpdateService] Failed to download/install APK:', error);
            Alert.alert('Error', 'Gagal mendownload update. Silakan coba lagi.');
            this.openDownloadUrl(url);
        }
    }

    /**
     * Open download URL in browser
     */
    public openDownloadUrl(url: string): void {
        if (Platform.OS === 'web') {
            window.open(url, '_blank');
            return;
        }
        Linking.openURL(url).catch((err) => {
            console.error('[UpdateService] Failed to open download URL:', err);
        });
    }

    /**
     * Compare version strings
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
     * Full update check — on web, always returns no update
     */
    async checkForUpdates(): Promise<UpdateCheckResult> {
        if (Platform.OS === 'web') {
            return {
                hasUpdate: false,
                updateType: null,
                isDownloading: false,
                error: null,
            };
        }

        const otaResult = await this.checkOTAUpdate();
        if (otaResult.available) {
            return {
                hasUpdate: true,
                updateType: 'ota',
                isDownloading: false,
                error: null,
            };
        }

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
