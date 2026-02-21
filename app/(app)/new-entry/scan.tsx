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

export default function ScanScreen() {
    const router = useRouter();
    const {
        setImageUri,
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
    const [imageFile, setImageFile] = useState<File | undefined>(undefined);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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
            setImage(result.assets[0].uri);
            setImageFile(result.assets[0].file);
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
            setImage(result.assets[0].uri);
            setImageFile(result.assets[0].file);
        }
    };

    const processReceipt = async () => {
        if (!image) return;

        setIsAnalyzing(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        try {
            const response = await reimbursementApi.scanReceipt(image, imageFile);

            if (response.success && response.data) {
                const data = response.data;
                console.log('AI Response:', data);

                // Update store with extracted data
                setImageUri(image);

                if (data.total_amount) setAmount(data.total_amount.toString());
                if (data.transaction_date) setDate(new Date(data.transaction_date));
                if (data.merchant_name) setClient(data.merchant_name);
                if (data.category_prediction) {
                    setCategory(data.category_prediction);
                    const matchedCat = categories.find(
                        c => c.name.toLowerCase() === data.category_prediction.toLowerCase()
                    );
                    if (matchedCat) {
                        setCategoryId(matchedCat.id);
                    }
                }
                if (data.summary) setNote(data.summary);

                // Navigate to review
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.push('/(app)/new-entry/review');
            } else {
                throw new Error('Failed to analyze receipt');
            }
        } catch (error) {
            console.error('Scan Error:', error);
            Alert.alert('Scan Failed', 'Could not analyze receipt. Please try again or input manually.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsAnalyzing(false);
        }
    };

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
                                {isAnalyzing && (
                                    <View className="absolute inset-0 bg-black/60 items-center justify-center">
                                        <ActivityIndicator size="large" color={colors.primary} />
                                        <Text className="text-white font-bold mt-4 text-lg">Menganalisa Struk...</Text>
                                        <Text className="text-primary text-sm mt-1">Estimasi: 5-10 detik</Text>
                                    </View>
                                )}
                            </View>

                            {!isAnalyzing && (
                                <View className="w-full gap-3">
                                    <TouchableOpacity
                                        onPress={processReceipt}
                                        className="bg-primary p-4 rounded-2xl flex-row items-center justify-center mb-2"
                                        activeOpacity={0.8}
                                    >
                                        <Check size={24} color={colors.background} />
                                        <Text className="text-background font-bold text-lg ml-3">Proses Struk</Text>
                                    </TouchableOpacity>

                                    <View className="flex-row gap-3">
                                        <TouchableOpacity
                                            onPress={() => { setImage(null); setImageFile(undefined); }}
                                            className="flex-1 bg-surface-elevated p-4 rounded-2xl flex-row items-center justify-center"
                                            activeOpacity={0.8}
                                        >
                                            <RefreshCw size={20} color={colors.text} />
                                            <Text className="text-white font-bold ml-2">Ulang</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}
