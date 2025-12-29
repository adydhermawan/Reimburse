import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Image, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Camera as CameraIcon, Image as ImageIcon, X, RotateCcw, Check, FlipHorizontal2, FileEdit } from 'lucide-react-native';
import { ScreenWrapper, Button } from '../../../src/components';
import { colors } from '../../../src/constants/theme';
import { useNewEntryStore } from '../../../store/newEntryStore';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

interface CompressionProgress {
    step: 'resizing' | 'compressing' | 'done';
    iteration?: number;
    maxIterations?: number;
    currentSize?: number;
    targetSize?: number;
}

// Compress image to under 200kb with progress callback
async function compressImage(
    uri: string,
    onProgress?: (progress: CompressionProgress) => void
): Promise<{ uri: string; finalSize: number }> {
    let quality = 0.8;
    let compressedUri = uri;
    const targetSize = 200 * 1024; // 200kb in bytes
    const maxIterations = 5;

    // Step 1: Resize image
    onProgress?.({ step: 'resizing' });
    const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }], // Resize to max 1200px width
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );
    compressedUri = manipulated.uri;

    // Check file size and compress further if needed
    let fileInfo = await FileSystem.getInfoAsync(compressedUri);
    let iterations = 0;

    // Step 2: Iterative compression
    while (fileInfo.exists && fileInfo.size && fileInfo.size > targetSize && iterations < maxIterations) {
        onProgress?.({
            step: 'compressing',
            iteration: iterations + 1,
            maxIterations,
            currentSize: fileInfo.size,
            targetSize,
        });

        quality -= 0.15;
        if (quality < 0.1) quality = 0.1;

        const recompressed = await ImageManipulator.manipulateAsync(
            compressedUri,
            [],
            { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
        );
        compressedUri = recompressed.uri;
        fileInfo = await FileSystem.getInfoAsync(compressedUri);
        iterations++;
    }

    const finalSize = fileInfo.exists && fileInfo.size ? fileInfo.size : 0;

    // Step 3: Done
    onProgress?.({ step: 'done', currentSize: finalSize, targetSize });
    console.log(`Compressed image size: ${(finalSize / 1024).toFixed(2)}kb`);

    return { uri: compressedUri, finalSize };
}

export default function PhotoCaptureScreen() {
    const router = useRouter();
    const { categoryId, categoryName } = useLocalSearchParams<{ categoryId?: string; categoryName?: string }>();

    const setImageUri = useNewEntryStore((state) => state.setImageUri);
    const setCategory = useNewEntryStore((state) => state.setCategory);
    const reset = useNewEntryStore((state) => state.reset);
    const setGlobalCompressionStatus = useNewEntryStore((state) => state.setCompressionStatus);
    const checkHasDraft = useNewEntryStore((state) => state.checkHasDraft);
    const loadDraft = useNewEntryStore((state) => state.loadDraft);
    const clearDraft = useNewEntryStore((state) => state.clearDraft);

    const [permission, requestPermission] = useCameraPermissions();
    const [cameraReady, setCameraReady] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [facing, setFacing] = useState<'front' | 'back'>('back');
    const [compressionStatus, setCompressionStatus] = useState<string | null>(null);
    const cameraRef = useRef<CameraView>(null);

    // Draft modal state
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [isCheckingDraft, setIsCheckingDraft] = useState(true);

    // Check for existing draft on mount
    useEffect(() => {
        const checkDraft = async () => {
            // Don't check if coming from category selection (user wants new entry)
            if (categoryId && categoryName) {
                setIsCheckingDraft(false);
                return;
            }

            const hasDraft = await checkHasDraft();
            if (hasDraft) {
                setShowDraftModal(true);
            }
            setIsCheckingDraft(false);
        };

        checkDraft();
    }, []);

    // Handle continue draft
    const handleContinueDraft = async () => {
        setShowDraftModal(false);
        const loaded = await loadDraft();
        if (loaded) {
            // Get the current step and navigate to the appropriate screen
            const step = useNewEntryStore.getState().step;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Navigate to the correct step based on saved progress
            switch (step) {
                case 2:
                    router.push('/(app)/new-entry/date');
                    break;
                case 3:
                    router.push('/(app)/new-entry/category');
                    break;
                case 4:
                    router.push('/(app)/new-entry/client');
                    break;
                case 5:
                    router.push('/(app)/new-entry/amount');
                    break;
                case 6:
                    router.push('/(app)/new-entry/review');
                    break;
                default:
                    // Stay on photo screen (step 1)
                    break;
            }
        }
    };

    // Handle discard draft
    const handleDiscardDraft = async () => {
        setShowDraftModal(false);
        await clearDraft();
        reset();
        Haptics.selectionAsync();
    };

    // Set category from params if navigating from dashboard category click
    useEffect(() => {
        if (categoryName) {
            setCategory(categoryName);
            // Store category ID for later use
            useNewEntryStore.setState({ categoryId: categoryId ? parseInt(categoryId) : undefined });
        }
    }, [categoryId, categoryName]);

    const handleTakePhoto = async () => {
        if (!cameraRef.current || !cameraReady) return;

        try {
            setIsProcessing(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                shutterSound: false, // Disable shutter sound
            });

            if (photo?.uri) {
                setCapturedPhoto(photo.uri);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Gagal mengambil foto. Silakan coba lagi.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePickFromGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setIsProcessing(true);
                Haptics.selectionAsync();
                setCapturedPhoto(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Gagal memilih gambar dari galeri.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmPhoto = async () => {
        if (!capturedPhoto) return;

        // Set initial status and navigate immediately
        setGlobalCompressionStatus('📐 Mengubah ukuran...');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Navigate to next step immediately - don't wait for compression
        router.push('/(app)/new-entry/date');

        // Run compression in background
        try {
            const result = await compressImage(capturedPhoto, (progress) => {
                let statusMsg = '';
                switch (progress.step) {
                    case 'resizing':
                        statusMsg = '📐 Mengubah ukuran...';
                        break;
                    case 'compressing':
                        const currentKb = progress.currentSize ? (progress.currentSize / 1024).toFixed(0) : '?';
                        statusMsg = `🔄 ${currentKb}kb → <200kb`;
                        break;
                    case 'done':
                        const finalKb = progress.currentSize ? (progress.currentSize / 1024).toFixed(0) : '?';
                        statusMsg = `✅ ${finalKb}kb`;
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        break;
                }
                setGlobalCompressionStatus(statusMsg);
            });

            // Save compressed image and clear status after a brief delay
            setImageUri(result.uri);
            await new Promise(resolve => setTimeout(resolve, 1500));
            setGlobalCompressionStatus(null);
        } catch (error) {
            console.error('Error compressing image:', error);
            // If compression fails, save original photo
            setImageUri(capturedPhoto);
            setGlobalCompressionStatus('⚠️ Gagal kompresi');
            await new Promise(resolve => setTimeout(resolve, 2000));
            setGlobalCompressionStatus(null);
        }
    };

    const handleRetakePhoto = () => {
        Haptics.selectionAsync();
        setCapturedPhoto(null);
    };

    const handleSkip = () => {
        Haptics.selectionAsync();
        setImageUri(null);
        router.push('/(app)/new-entry/date');
    };

    const toggleCameraFacing = () => {
        Haptics.selectionAsync();
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    // Show loading while checking for draft
    if (isCheckingDraft) {
        return (
            <ScreenWrapper className="px-5 py-4">
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text className="text-text-secondary mt-4">Memeriksa...</Text>
                </View>
            </ScreenWrapper>
        );
    }

    // Draft continuation modal
    const DraftModal = () => (
        <Modal
            visible={showDraftModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDraftModal(false)}
        >
            <View className="flex-1 bg-black/70 justify-center items-center px-6">
                <View className="bg-surface w-full rounded-3xl p-6 border border-white/10">
                    <View className="items-center mb-4">
                        <View className="w-16 h-16 bg-primary/20 rounded-full items-center justify-center mb-4">
                            <FileEdit size={32} color={colors.primary} />
                        </View>
                        <Text className="text-white text-xl font-bold text-center mb-2">
                            Lanjutkan Draft?
                        </Text>
                        <Text className="text-text-secondary text-center">
                            Anda memiliki entry yang belum selesai. Apakah ingin melanjutkan?
                        </Text>
                    </View>

                    <View className="gap-3 mt-4">
                        <Button
                            label="Lanjutkan Draft"
                            onPress={handleContinueDraft}
                            className="w-full"
                        />
                        <Button
                            label="Mulai Baru"
                            variant="secondary"
                            onPress={handleDiscardDraft}
                            className="w-full"
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );

    // Show permission request screen
    if (!permission) {
        return (
            <ScreenWrapper className="px-5 py-4">
                <DraftModal />
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </ScreenWrapper>
        );
    }

    if (!permission.granted) {
        return (
            <ScreenWrapper className="px-5 py-4">
                <View className="flex-row justify-between items-center mb-4">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <X size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text className="text-white font-bold text-lg">Foto Struk</Text>
                    <View className="w-8" />
                </View>

                <View className="flex-1 justify-center items-center px-8">
                    <CameraIcon size={64} color={colors.textMuted} />
                    <Text className="text-white text-xl font-bold mt-6 mb-2 text-center">
                        Izin Kamera Diperlukan
                    </Text>
                    <Text className="text-text-secondary text-center mb-8">
                        Untuk mengambil foto struk, aplikasi memerlukan akses ke kamera perangkat Anda.
                    </Text>
                    <Button
                        label="Izinkan Akses Kamera"
                        onPress={requestPermission}
                        className="w-full mb-4"
                    />
                    <Button
                        label="Pilih dari Galeri"
                        variant="secondary"
                        onPress={handlePickFromGallery}
                        icon={<ImageIcon size={20} color={colors.text} />}
                        className="w-full mb-4"
                    />
                    <Button
                        label="Lewati"
                        variant="ghost"
                        textClassName="text-text-secondary"
                        onPress={handleSkip}
                        className="w-full"
                    />
                </View>
            </ScreenWrapper>
        );
    }

    // Show photo preview screen
    if (capturedPhoto) {
        return (
            <ScreenWrapper className="px-5 py-4">
                <View className="flex-row justify-between items-center mb-4">
                    <TouchableOpacity onPress={handleRetakePhoto} className="p-2 -ml-2">
                        <X size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text className="text-white font-bold text-lg">Preview</Text>
                    <View className="flex-row gap-1.5">
                        <View className="w-2 h-2 rounded-full bg-primary" />
                        <View className="w-2 h-2 rounded-full bg-surface-elevated" />
                        <View className="w-2 h-2 rounded-full bg-surface-elevated" />
                        <View className="w-2 h-2 rounded-full bg-surface-elevated" />
                        <View className="w-2 h-2 rounded-full bg-surface-elevated" />
                    </View>
                </View>

                <View className="flex-1 justify-center items-center">
                    <View className="w-full aspect-[3/4] bg-surface rounded-3xl overflow-hidden mb-6">
                        <Image
                            source={{ uri: capturedPhoto }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    </View>

                    {isProcessing ? (
                        <View className="items-center py-8">
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text className="text-text-secondary mt-4">
                                {compressionStatus || 'Memproses...'}
                            </Text>
                        </View>
                    ) : (
                        <View className="flex-row w-full gap-4">
                            <Button
                                label="Ulangi"
                                variant="secondary"
                                className="flex-1"
                                icon={<RotateCcw size={20} color={colors.text} />}
                                onPress={handleRetakePhoto}
                            />
                            <Button
                                label="Gunakan"
                                className="flex-1"
                                icon={<Check size={20} color={colors.background} />}
                                onPress={handleConfirmPhoto}
                            />
                        </View>
                    )}
                </View>

                <View className="items-center mt-6 mb-4">
                    <Text className="text-text-secondary text-xs text-center px-10">
                        💡 Gambar akan dikompresi menjadi &lt;200kb secara otomatis
                    </Text>
                </View>
            </ScreenWrapper>
        );
    }

    // Show camera screen
    return (
        <ScreenWrapper className="px-5 py-4">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <X size={24} color={colors.text} />
                </TouchableOpacity>
                <Text className="text-white font-bold text-lg">Foto Struk</Text>
                {/* Progress Dots */}
                <View className="flex-row gap-1.5">
                    <View className="w-2 h-2 rounded-full bg-primary" />
                    <View className="w-2 h-2 rounded-full bg-surface-elevated" />
                    <View className="w-2 h-2 rounded-full bg-surface-elevated" />
                    <View className="w-2 h-2 rounded-full bg-surface-elevated" />
                    <View className="w-2 h-2 rounded-full bg-surface-elevated" />
                </View>
            </View>

            <View className="flex-1 justify-center items-center">
                <Text className="text-white text-xl font-bold mb-2">📸 Ambil foto struk</Text>
                <Text className="text-text-secondary text-center mb-4 px-8">
                    Posisikan struk di dalam bingkai
                </Text>

                {/* Camera View */}
                <View className="w-full aspect-[3/4] bg-surface rounded-3xl overflow-hidden mb-6">
                    <CameraView
                        ref={cameraRef}
                        style={{ flex: 1 }}
                        facing={facing}
                        onCameraReady={() => setCameraReady(true)}
                    >
                        {/* Corner guides */}
                        <View className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                        <View className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                        <View className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                        <View className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />

                        {/* Flip camera button */}
                        <TouchableOpacity
                            onPress={toggleCameraFacing}
                            className="absolute top-4 right-4 bg-black/50 p-2 rounded-full"
                            style={{ right: 48 }}
                        >
                            <FlipHorizontal2 size={20} color="white" />
                        </TouchableOpacity>
                    </CameraView>
                </View>

                {/* Shutter Button */}
                <TouchableOpacity
                    onPress={handleTakePhoto}
                    disabled={isProcessing || !cameraReady}
                    className="w-20 h-20 bg-white rounded-full items-center justify-center border-4 border-surface shadow-lg mb-6 active:scale-95"
                    activeOpacity={0.8}
                    style={{ opacity: isProcessing || !cameraReady ? 0.5 : 1 }}
                >
                    {isProcessing ? (
                        <ActivityIndicator size="small" color={colors.background} />
                    ) : (
                        <View className="w-16 h-16 bg-white rounded-full border-2 border-background" />
                    )}
                </TouchableOpacity>

                <View className="flex-row w-full gap-4">
                    <Button
                        label="Galeri"
                        variant="secondary"
                        className="flex-1"
                        icon={<ImageIcon size={20} color={colors.text} />}
                        onPress={handlePickFromGallery}
                        disabled={isProcessing}
                    />
                    <Button
                        label="Lewati"
                        variant="ghost"
                        className="flex-1"
                        textClassName="text-text-secondary"
                        onPress={handleSkip}
                    />
                </View>
            </View>

            <View className="items-center mt-4 mb-4">
                <Text className="text-text-secondary text-xs text-center px-10">
                    💡 Gambar akan dikompresi menjadi &lt;200kb secara otomatis
                </Text>
            </View>
        </ScreenWrapper>
    );
}
