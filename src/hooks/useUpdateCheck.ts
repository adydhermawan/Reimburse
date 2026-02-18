import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { updateService, AppVersionInfo } from '../services/updateService';

interface UseUpdateCheckResult {
    isChecking: boolean;
    hasUpdate: boolean;
    updateType: 'ota' | 'apk' | null;
    apkVersionInfo: AppVersionInfo | null;
    isApplying: boolean;
    error: string | null;
    checkForUpdates: () => Promise<void>;
    applyOTAUpdate: () => Promise<void>;
    promptAPKDownload: () => void;
    // New properties
    showDownloadModal: boolean;
    downloadProgress: number;
    startDownload: () => void;
    cancelDownload: () => void;
}

/**
 * Hook untuk mengecek dan mengelola app updates
 * @param autoCheck - Apakah auto check saat mount (default: true)
 */
export function useUpdateCheck(autoCheck: boolean = true): UseUpdateCheckResult {
    const [isChecking, setIsChecking] = useState(false);
    const [hasUpdate, setHasUpdate] = useState(false);
    const [updateType, setUpdateType] = useState<'ota' | 'apk' | null>(null);
    const [apkVersionInfo, setApkVersionInfo] = useState<AppVersionInfo | null>(null);
    const [isApplying, setIsApplying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // New state
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    const checkForUpdates = useCallback(async () => {
        setIsChecking(true);
        setError(null);

        try {
            // Check OTA first
            const otaResult = await updateService.checkOTAUpdate();
            if (otaResult.available) {
                setHasUpdate(true);
                setUpdateType('ota');
                // Auto-prompt for OTA updates
                updateService.promptOTAUpdate(async () => {
                    await applyOTAUpdate();
                });
                setIsChecking(false);
                return;
            }

            // Then check APK
            const apkResult = await updateService.checkAPKUpdate();
            if (apkResult.available && apkResult.versionInfo) {
                setHasUpdate(true);
                setUpdateType('apk');
                setApkVersionInfo(apkResult.versionInfo);
                // Auto-prompt for APK updates
                updateService.promptAPKDownload(apkResult.versionInfo);
                setIsChecking(false);
                return;
            }

            setHasUpdate(false);
            setUpdateType(null);
        } catch (err) {
            console.error('[useUpdateCheck] Error:', err);
            setError(err instanceof Error ? err.message : 'Update check failed');
        } finally {
            setIsChecking(false);
        }
    }, []);

    const applyOTAUpdate = useCallback(async () => {
        setIsApplying(true);
        try {
            await updateService.applyOTAUpdate();
            // App will reload, so this won't run
        } catch (err) {
            console.error('[useUpdateCheck] Apply error:', err);
            setError(err instanceof Error ? err.message : 'Failed to apply update');
            setIsApplying(false);
        }
    }, []);

    const promptAPKDownload = useCallback(() => {
        if (apkVersionInfo) {
            // Updated to allow user to choose download
            Alert.alert(
                'Update Tersedia',
                apkVersionInfo.release_notes
                    ? `Versi ${apkVersionInfo.version} tersedia!\n\n${apkVersionInfo.release_notes}`
                    : `Versi ${apkVersionInfo.version} tersedia!`,
                [
                    { text: 'Nanti', style: 'cancel' },
                    {
                        text: 'Download & Install',
                        onPress: () => {
                            setShowDownloadModal(true);
                            startDownload();
                        }
                    }
                ],
                { cancelable: !apkVersionInfo.is_mandatory }
            );
        }
    }, [apkVersionInfo]);

    const startDownload = useCallback(async () => {
        if (!apkVersionInfo) return;

        try {
            setDownloadProgress(0);
            await updateService.downloadAndInstallAPK(
                apkVersionInfo.download_url,
                (progress) => setDownloadProgress(progress)
            );
            // Close modal after success (native intent will take over)
            setTimeout(() => setShowDownloadModal(false), 1000);
        } catch (err) {
            setShowDownloadModal(false);
            setError('Gagal mendownload update');
        }
    }, [apkVersionInfo]);

    const cancelDownload = useCallback(() => {
        // Note: Expo FileSystem download cancellation not implemented in this simple version
        setShowDownloadModal(false);
    }, []);

    useEffect(() => {
        if (autoCheck) {
            // Delay check slightly to let app fully mount
            const timer = setTimeout(() => {
                checkForUpdates();
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [autoCheck, checkForUpdates]);

    return {
        isChecking,
        hasUpdate,
        updateType,
        apkVersionInfo,
        isApplying,
        error,
        checkForUpdates,
        applyOTAUpdate,
        promptAPKDownload,
        showDownloadModal,
        downloadProgress,
        startDownload,
        cancelDownload,
    };
}
