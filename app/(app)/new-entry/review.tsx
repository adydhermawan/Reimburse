import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Tag, Building2, Wallet, FileText, Camera, CheckCircle, AlertCircle, WifiOff, Cloud, Edit3 } from 'lucide-react-native';
import { ScreenWrapper, Button } from '../../../src/components';
import { colors } from '../../../src/constants/theme';
import { useNewEntryStore } from '../../../store/newEntryStore';
import { useReimbursementStore } from '../../../store/reimbursementStore';
import { useCategoryStore } from '../../../store/categoryStore';
import { useOfflineSyncStore } from '../../../store/offlineSyncStore';
import * as Haptics from '../../../src/services/platformHaptics';

export default function ReviewScreen() {
    const router = useRouter();
    const entry = useNewEntryStore();
    const { createReimbursement, isSubmitting, error } = useReimbursementStore();
    const { categories } = useCategoryStore();
    const { isOnline, addPendingSubmission } = useOfflineSyncStore();
    const setStep = useNewEntryStore((state) => state.setStep);
    const [localError, setLocalError] = useState<string | null>(null);
    const [isSavingOffline, setIsSavingOffline] = useState(false);

    // Track step
    useEffect(() => {
        setStep(6);
    }, []);

    // Helper to get a valid Date object from entry.date
    const getValidDate = (): Date => {
        if (entry.date && entry.date instanceof Date && !isNaN(entry.date.getTime())) {
            return entry.date;
        }
        return new Date();
    };

    // Find category ID from name
    const getCategoryId = (): number | null => {
        // First check if we have categoryId directly
        if (entry.categoryId) {
            return entry.categoryId;
        }

        // If it's a known category name but missing ID, find it (case-insensitive)
        if (entry.category) {
            const category = categories.find(c => c.name.toLowerCase() === entry.category.toLowerCase());
            return category?.id || null;
        }

        return null;
    };

    const handleSubmit = async () => {
        Haptics.selectionAsync();
        setLocalError(null);

        const categoryId = getCategoryId();

        // Validate: categoryId is required
        if (!categoryId) {
            setLocalError('Kategori tidak ditemukan. Silakan pilih ulang dari daftar.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        if (!entry.client) {
            setLocalError('Client harus diisi.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        if (!entry.amount || parseInt(entry.amount) <= 0) {
            setLocalError('Jumlah harus lebih dari 0.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        // Format date with validation
        const validDate = getValidDate();
        const formattedDate = validDate.toISOString().split('T')[0];

        // Prepare base data
        const baseData: any = {
            client_name: entry.client,
            amount: parseInt(entry.amount),
            transaction_date: formattedDate,
            note: entry.note || undefined,
        };

        // Always send category_id (compatible with production backend)
        baseData.category_id = categoryId;

        console.log('[Review] Submitting reimbursement:', {
            hasCategoryId: !!baseData.category_id,
            category_id: baseData.category_id,
            category_name: baseData.category_name,
            client: baseData.client_name
        });

        // Check if we're offline
        if (!isOnline) {
            // Save to offline queue
            setIsSavingOffline(true);
            try {
                await addPendingSubmission(baseData, entry.imageUri);

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                entry.reset();

                Alert.alert(
                    'Tersimpan Offline',
                    'Reimbursement akan otomatis diupload saat koneksi internet tersedia.',
                    [{ text: 'OK', onPress: () => router.replace('/(app)/(tabs)') }]
                );
            } catch (err) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                setLocalError('Gagal menyimpan. Silakan coba lagi.');
            } finally {
                setIsSavingOffline(false);
            }
            return;
        }

        // Online: submit normally
        // Prepare image for upload
        let imageData = undefined;
        if (entry.imageUri) {
            let filename = `receipt_${Date.now()}.jpg`;
            let mimeType = 'image/jpeg';

            // Prevent base64 data URIs from being split incorrectly as they contain slashes
            if (!entry.imageUri.startsWith('data:')) {
                const uriParts = entry.imageUri.split('/');
                const extractedName = uriParts[uriParts.length - 1];

                // Only use the extracted name if it seems like a valid filename with an extension
                if (extractedName && extractedName.includes('.') && extractedName.length < 100) {
                    filename = extractedName;
                    const ext = filename.split('.').pop()?.toLowerCase();
                    if (ext === 'png') mimeType = 'image/png';
                }
            } else if (entry.imageUri.includes('image/png')) {
                mimeType = 'image/png';
                filename = `receipt_${Date.now()}.png`;
            }

            imageData = {
                uri: entry.imageUri,
                type: mimeType,
                name: filename,
            };
        }

        const result = await createReimbursement({
            ...baseData,
            image: imageData,
        });

        if (result) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            entry.reset();
            router.replace('/(app)/(tabs)');
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setLocalError(error || 'Gagal menyimpan reimbursement. Silakan coba lagi.');
        }
    };

    const displayError = localError || error;

    const reviewItems = [
        {
            icon: Calendar,
            label: 'TANGGAL',
            route: '/(app)/new-entry/date?from=review',
            value: getValidDate().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })
        },
        { icon: Tag, label: 'KATEGORI', route: '/(app)/new-entry/category?from=review', value: entry.category || '-' },
        { icon: Building2, label: 'CLIENT', route: '/(app)/new-entry/client?from=review', value: entry.client || '-' },
    ];

    return (
        <ScreenWrapper className="px-5 py-4">
            <View className="flex-row justify-between items-center mb-6">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text className="text-white font-bold text-lg">Review</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <Text className="text-text-secondary mb-6 text-center">
                    Pastikan semua data sudah benar sebelum submit.
                </Text>

                {/* Offline Warning */}
                {!isOnline && (
                    <View className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-2xl mb-4 flex-row items-start">
                        <WifiOff size={20} color={colors.warning} />
                        <View className="ml-3 flex-1">
                            <Text className="text-yellow-400 font-bold">Mode Offline</Text>
                            <Text className="text-yellow-400/80 text-sm">
                                Data akan disimpan lokal dan otomatis diupload saat online.
                            </Text>
                        </View>
                    </View>
                )}

                {/* Error Alert */}
                {displayError && (
                    <View className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl mb-4 flex-row items-start">
                        <AlertCircle size={20} color={colors.danger} />
                        <Text className="text-red-400 ml-3 flex-1">{displayError}</Text>
                    </View>
                )}

                {reviewItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => router.push(item.route as any)}
                        activeOpacity={0.7}
                        className="bg-surface p-4 rounded-2xl border border-white/5 mb-3"
                    >
                        <View className="flex-row items-center mb-2 justify-between">
                            <View className="flex-row items-center">
                                <item.icon size={16} color={colors.textSecondary} />
                                <Text className="text-text-secondary text-xs ml-2 font-medium">{item.label}</Text>
                            </View>
                            <Edit3 size={14} color={colors.primary} />
                        </View>
                        <Text className="text-white font-bold text-lg">{item.value}</Text>
                    </TouchableOpacity>
                ))}

                {/* Amount Card - Highlighted */}
                <TouchableOpacity
                    onPress={() => router.push('/(app)/new-entry/amount?from=review')}
                    activeOpacity={0.7}
                    className="bg-surface p-4 rounded-2xl border border-white/5 mb-3"
                >
                    <View className="flex-row items-center mb-2 justify-between">
                        <View className="flex-row items-center">
                            <Wallet size={16} color={colors.textSecondary} />
                            <Text className="text-text-secondary text-xs ml-2 font-medium">JUMLAH</Text>
                        </View>
                        <Edit3 size={14} color={colors.primary} />
                    </View>
                    <Text className="text-primary font-bold text-2xl">
                        Rp {new Intl.NumberFormat('id-ID').format(parseInt(entry.amount || '0'))}
                    </Text>
                </TouchableOpacity>

                {entry.note && (
                    <TouchableOpacity
                        onPress={() => router.push('/(app)/new-entry/note')}
                        activeOpacity={0.7}
                        className="bg-surface p-4 rounded-2xl border border-white/5 mb-3"
                    >
                        <View className="flex-row items-center mb-2 justify-between">
                            <View className="flex-row items-center">
                                <FileText size={16} color={colors.textSecondary} />
                                <Text className="text-text-secondary text-xs ml-2 font-medium">CATATAN</Text>
                            </View>
                            <Edit3 size={14} color={colors.primary} />
                        </View>
                        <Text className="text-white">{entry.note}</Text>
                    </TouchableOpacity>
                )}

                {/* Image Card */}
                <View className="bg-surface p-4 rounded-2xl border border-white/5 mb-6">
                    <View className="flex-row items-center mb-3">
                        <Camera size={16} color={colors.textSecondary} />
                        <Text className="text-text-secondary text-xs ml-2 font-medium">FOTO STRUK</Text>
                        {entry.imageUri && (
                            <View className="ml-auto bg-green-500/20 px-2 py-0.5 rounded-md">
                                <Text className="text-green-400 text-[10px] font-bold">READY</Text>
                            </View>
                        )}
                    </View>
                    {entry.imageUri ? (
                        <Image
                            source={{ uri: entry.imageUri }}
                            className="w-full h-48 rounded-xl"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-32 bg-surface-elevated rounded-xl items-center justify-center border border-white/10">
                            <Camera size={32} color={colors.textMuted} />
                            <Text className="text-text-secondary text-sm mt-2">No Image</Text>
                        </View>
                    )}
                </View>

                <View className="h-28" />
            </ScrollView>

            <View className="absolute bottom-0 left-0 right-0 bg-surface border-t border-white/5 p-4">
                <Button
                    label={isOnline ? "Submit Reimbursement" : "Simpan Offline"}
                    icon={isOnline
                        ? <CheckCircle size={20} color={colors.background} />
                        : <Cloud size={20} color={colors.background} />
                    }
                    onPress={handleSubmit}
                    loading={isSubmitting || isSavingOffline}
                />
            </View>
        </ScreenWrapper>
    );
}
