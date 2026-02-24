import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Image as ImageIcon, Check, RefreshCw, ScanLine } from 'lucide-react-native';
import * as ImagePicker from '../../../src/services/platformImagePicker';
import { ScreenWrapper } from '../../../src/components';
import { colors } from '../../../src/constants/theme';
import { useNewEntryStore } from '../../../store/newEntryStore';
import { useCategoryStore } from '../../../store/categoryStore';
import reimbursementApi from '../../../src/services/reimbursementApi';
import * as Haptics from '../../../src/services/platformHaptics';
import { compressImage, CompressionProgress } from '../../../src/services/platformImageCompressor';

export default function ScanScreen() {
    const router = useRouter();
    const {
        setImageUri,
        setImageFile,
        setAmount,
        setDate,
        setClient,
        setCategory,
        setCategoryId,
        setNote,
        setStep
    } = useNewEntryStore();

    const { categories, fetchCategories } = useCategoryStore();

    const [image, setImage] = useState<string | null>(null);
    const [localImageFile, setLocalImageFile] = useState<any>(undefined);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isBackgroundAnalyzing, setIsBackgroundAnalyzing] = useState(false);

    const [compressionStatus, setCompressionStatus] = useState<string | null>(null);

    // Set step for progress indicator and ensure categories are loaded
    React.useEffect(() => {
        setStep(4);
        fetchCategories(); // Ensure categories are loaded for AI matching
    }, []);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            handleImageSelected(result.assets[0].uri, result.assets[0].file);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera permission is required to scan receipts.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: Platform.OS === 'android',
            aspect: [3, 4],
            quality: 0.8,
        });

        if (!result.canceled) {
            handleImageSelected(result.assets[0].uri, result.assets[0].file);
        }
    };

    const handleImageSelected = async (uri: string, file: any) => {
        setImage(uri);
        setLocalImageFile(file);

        setIsBackgroundAnalyzing(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        try {
            setCompressionStatus('Mempersiapkan proses otomatis...');
            let finalImageUri = uri;
            let finalImageFile = file;

            try {
                const compressed = await compressImage(uri, (progress) => {
                    if (progress.step === 'compressing') {
                        setCompressionStatus('Mengkompresi gambar...');
                    }
                });
                finalImageUri = compressed.uri;
                if (Platform.OS === 'web') {
                    const res = await fetch(compressed.uri);
                    const blob = await res.blob();
                    finalImageFile = new File([blob], file?.name || 'receipt.jpg', { type: blob.type });
                } else {
                    finalImageFile = undefined;
                }
            } catch (err) {
                console.error("Compression failed before AI scan, using original", err);
            }

            setCompressionStatus('Mengirim struk ke server...');
            const response = await reimbursementApi.draftScanReceipt(finalImageUri, finalImageFile);

            if (response.success && response.data) {
                if (response.meta) {
                    reimbursementApi.processDraftReceipt(response.data.id, response.meta)
                        .catch(err => console.error('Background async processing failed:', err));
                }

                useNewEntryStore.getState().reset();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                if (Platform.OS === 'web') {
                    window.alert('Berhasil! Struk Anda sedang diproses otomatis di layar belakang. Hasilnya akan masuk ke menu Riwayat sebentar lagi.');
                } else {
                    Alert.alert(
                        'Diproses Otomatis!',
                        'Struk Anda telah kami terima dan sedang dianalisa AI di layar belakang. Hasilnya akan segera muncul di menu Riwayat.',
                        [{ text: 'OK' }]
                    );
                }

                router.replace('/(app)/(tabs)');
            } else {
                throw new Error('Failed to initiate background scan');
            }
        } catch (error) {
            console.error('Background Scan Error:', error);
            if (Platform.OS === 'web') {
                window.alert('Gagal mengirim struk. Silakan coba lagi.');
            } else {
                Alert.alert('Gagal', 'Gagal mengirim struk ke server. Silakan coba lagi.');
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setIsBackgroundAnalyzing(false);
            setImage(null);
            setLocalImageFile(undefined);
        }
    };

    // (processReceipt and processBackground have been merged into handleImageSelected above)

    return (
        <ScreenWrapper className="px-5 py-4">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text className="text-white font-bold text-lg">Scan Struk</Text>
                <View className="w-10" />
            </View>

            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>

                {/* Main Content */}
                <View className="flex-1 items-center justify-center">

                    {!image ? (
                        <View className="w-full items-center">
                            <View className="w-24 h-24 bg-primary/20 rounded-full items-center justify-center mb-6 border border-primary/50">
                                <ScanLine size={40} color={colors.primary} />
                            </View>
                            <Text className="text-white text-2xl font-bold mb-2 text-center">
                                Foto Struk Anda
                            </Text>
                            <Text className="text-text-secondary text-center mb-10 px-4">
                                AI akan otomatis membaca Total, Tanggal, dan Merchant dari struk.
                            </Text>

                            <View className="w-full gap-4">
                                <TouchableOpacity
                                    onPress={takePhoto}
                                    className="bg-primary p-4 rounded-2xl flex-row items-center justify-center"
                                    activeOpacity={0.8}
                                >
                                    <Camera size={24} color={colors.background} />
                                    <Text className="text-background font-bold text-lg ml-3">Ambil Foto</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={pickImage}
                                    className="bg-surface p-4 rounded-2xl flex-row items-center justify-center border border-white/10"
                                    activeOpacity={0.8}
                                >
                                    <ImageIcon size={24} color={colors.text} />
                                    <Text className="text-white font-bold text-lg ml-3">Pilih dari Galeri</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View className="w-full items-center">
                            <View className="w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden mb-6 border border-white/20 relative">
                                <Image
                                    source={{ uri: image }}
                                    className="w-full h-full"
                                    resizeMode="contain"
                                />
                                {isBackgroundAnalyzing && (
                                    <View className="absolute inset-0 bg-black/60 items-center justify-center p-4">
                                        <ActivityIndicator size="large" color={colors.primary} />
                                        <Text className="text-white font-bold mt-4 text-lg text-center">{compressionStatus || 'Mempersiapkan...'}</Text>
                                        <Text className="text-primary text-sm mt-1 font-bold">Mengunggah ke server...</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}
