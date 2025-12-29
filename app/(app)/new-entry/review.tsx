import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Tag, Building2, Wallet, FileText, Camera, CheckCircle, AlertCircle, WifiOff, Cloud } from 'lucide-react-native';
import { ScreenWrapper, Button } from '../../../src/components';
import { colors } from '../../../src/constants/theme';
import { useNewEntryStore } from '../../../store/newEntryStore';
import { useReimbursementStore } from '../../../store/reimbursementStore';
import { useCategoryStore } from '../../../store/categoryStore';
import { useOfflineSyncStore } from '../../../store/offlineSyncStore';
import * as Haptics from 'expo-haptics';

export default function ReviewScreen() {
    const router = useRouter();
    const entry = useNewEntryStore();
    const { createReimbursement, isSubmitting, error } = useReimbursementStore();
    const { categories } = useCategoryStore();
    const { isOnline, addPendingSubmission } = useOfflineSyncStore();
    const [localError, setLocalError] = useState<string | null>(null);
    const [isSavingOffline, setIsSavingOffline] = useState(false);

    // Find category ID from name
    const getCategoryId = (): number | null => {
        // First check if we have categoryId directly
        if (entry.categoryId) {
            return entry.categoryId;
        }
        // Fallback to looking up by name
        const category = categories.find(c => c.name === entry.category);
        return category?.id || null;
    };

    const handleSubmit = async () => {
        Haptics.selectionAsync();
        setLocalError(null);

        const categoryId = getCategoryId();

        if (!categoryId) {
            setLocalError('Kategori tidak valid. Silakan pilih ulang.');
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

        // Format date
        const formattedDate = entry.date.toISOString().split('T')[0];

        // Check if we're offline
        if (!isOnline) {
            // Save to offline queue
            setIsSavingOffline(true);
            try {
                await addPendingSubmission(
                    {
                        client_name: entry.client,
                        category_id: categoryId,
                        amount: parseInt(entry.amount),
                        transaction_date: formattedDate,
                        note: entry.note || undefined,
                    },
                    entry.imageUri
                );

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
            // Extract filename from URI
            const uriParts = entry.imageUri.split('/');
            const filename = uriParts[uriParts.length - 1];
            const fileExtension = filename.split('.').pop()?.toLowerCase() || 'jpg';
            const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';

            imageData = {
                uri: entry.imageUri,
                type: mimeType,
                name: filename,
            };
        }

        const result = await createReimbursement({
            client_name: entry.client,
            category_id: categoryId,
            amount: parseInt(entry.amount),
            transaction_date: formattedDate,
            note: entry.note || undefined,
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
            value: entry.date.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })
        },
        { icon: Tag, label: 'KATEGORI', value: entry.category || '-' },
        { icon: Building2, label: 'CLIENT', value: entry.client || '-' },
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
                    <View key={index} className="bg-surface p-4 rounded-2xl border border-white/5 mb-3">
                        <View className="flex-row items-center mb-2">
                            <item.icon size={16} color={colors.textSecondary} />
                            <Text className="text-text-secondary text-xs ml-2 font-medium">{item.label}</Text>
                        </View>
                        <Text className="text-white font-bold text-lg">{item.value}</Text>
                    </View>
                ))}

                {/* Amount Card - Highlighted */}
                <View className="bg-surface p-4 rounded-2xl border border-white/5 mb-3">
                    <View className="flex-row items-center mb-2">
                        <Wallet size={16} color={colors.textSecondary} />
                        <Text className="text-text-secondary text-xs ml-2 font-medium">JUMLAH</Text>
                    </View>
                    <Text className="text-primary font-bold text-2xl">
                        Rp {new Intl.NumberFormat('id-ID').format(parseInt(entry.amount || '0'))}
                    </Text>
                </View>

                {entry.note && (
                    <View className="bg-surface p-4 rounded-2xl border border-white/5 mb-3">
                        <View className="flex-row items-center mb-2">
                            <FileText size={16} color={colors.textSecondary} />
                            <Text className="text-text-secondary text-xs ml-2 font-medium">CATATAN</Text>
                        </View>
                        <Text className="text-white">{entry.note}</Text>
                    </View>
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
