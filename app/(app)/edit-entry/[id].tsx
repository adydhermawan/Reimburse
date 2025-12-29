import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Tag, Building2, Wallet, FileText, Camera, ArrowLeft, Check, AlertCircle } from 'lucide-react-native';
import { useReimbursementStore } from '../../../store/reimbursementStore';
import { useCategoryStore } from '../../../store/categoryStore';
import { reimbursementApi } from '../../../src/services';
import { colors } from '../../../src/constants/theme';
import { Reimbursement, Category } from '../../../src/types';
import * as Haptics from 'expo-haptics';

export default function EditEntryScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const numericId = id ? parseInt(id, 10) : 0;

    // Store data
    const getEntryById = useReimbursementStore((state) => state.getEntryById);
    const fetchReimbursementById = useReimbursementStore((state) => state.fetchReimbursementById);
    const updateReimbursement = useReimbursementStore((state) => state.updateReimbursement);
    const isSubmitting = useReimbursementStore((state) => state.isSubmitting);
    const storeError = useReimbursementStore((state) => state.error);
    const { categories, fetchCategories } = useCategoryStore();

    // Local state
    const [entry, setEntry] = useState<Reimbursement | null | undefined>(getEntryById(numericId));
    const [isLoading, setIsLoading] = useState(!entry);
    const [localError, setLocalError] = useState<string | null>(null);

    // Form state
    const [clientName, setClientName] = useState('');
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');

    // Fetch entry from API if not in store
    useEffect(() => {
        fetchCategories();
        if (!entry && numericId) {
            setIsLoading(true);
            fetchReimbursementById(numericId).then((fetchedEntry) => {
                setEntry(fetchedEntry);
                setIsLoading(false);
            });
        }
    }, [numericId]);

    // Initialize form when entry loads
    useEffect(() => {
        if (entry) {
            setClientName(entry.client?.name || '');
            setCategoryId(entry.category_id);
            setAmount(entry.amount.toString());
            setNote(entry.note || '');
        }
    }, [entry]);

    const handleSubmit = async () => {
        Haptics.selectionAsync();
        setLocalError(null);

        if (!clientName.trim()) {
            setLocalError('Client harus diisi.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        if (!categoryId) {
            setLocalError('Kategori harus dipilih.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            setLocalError('Jumlah harus lebih dari 0.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        const success = await updateReimbursement(numericId, {
            client_name: clientName.trim(),
            category_id: categoryId,
            amount: parseFloat(amount),
            note: note.trim() || undefined,
        });

        if (success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Berhasil', 'Reimbursement berhasil diupdate', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setLocalError(storeError || 'Gagal update reimbursement.');
        }
    };

    const formatAmount = (value: string) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        setAmount(numericValue);
    };

    const displayedAmount = amount ? new Intl.NumberFormat('id-ID').format(parseFloat(amount)) : '';
    const imageUrl = entry?.image_path ? reimbursementApi.getImageUrl(entry.image_path) : null;
    const displayError = localError || storeError;

    if (isLoading) {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        title: 'Edit Entry',
                        headerStyle: { backgroundColor: '#161B22' },
                        headerTintColor: '#FFFFFF',
                    }}
                />
                <SafeAreaView className="flex-1 bg-background justify-center items-center">
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text className="text-text-secondary mt-4">Memuat data...</Text>
                </SafeAreaView>
            </>
        );
    }

    if (!entry) {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        title: 'Edit Entry',
                        headerStyle: { backgroundColor: '#161B22' },
                        headerTintColor: '#FFFFFF',
                    }}
                />
                <SafeAreaView className="flex-1 bg-background justify-center items-center">
                    <AlertCircle size={48} color={colors.textMuted} />
                    <Text className="text-text-secondary mt-4">Entry tidak ditemukan</Text>
                    <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-primary/20 px-4 py-2 rounded-lg">
                        <Text className="text-primary font-medium">Kembali</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </>
        );
    }

    if (entry.status !== 'pending') {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        title: 'Edit Entry',
                        headerStyle: { backgroundColor: '#161B22' },
                        headerTintColor: '#FFFFFF',
                    }}
                />
                <SafeAreaView className="flex-1 bg-background justify-center items-center px-5">
                    <AlertCircle size={48} color={colors.danger} />
                    <Text className="text-text-secondary mt-4 text-center">
                        Hanya entry dengan status PENDING yang dapat diedit.
                    </Text>
                    <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-primary/20 px-4 py-2 rounded-lg">
                        <Text className="text-primary font-medium">Kembali</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Edit Entry',
                    headerStyle: { backgroundColor: '#161B22' },
                    headerTintColor: '#FFFFFF',
                }}
            />
            <View className="flex-1 bg-background">
                <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
                    <Text className="text-text-secondary mb-6 text-center">
                        Edit data reimbursement Anda.
                    </Text>

                    {/* Error Alert */}
                    {displayError && (
                        <View className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl mb-4 flex-row items-start">
                            <AlertCircle size={20} color={colors.danger} />
                            <Text className="text-red-400 ml-3 flex-1">{displayError}</Text>
                        </View>
                    )}

                    {/* Client Input */}
                    <View className="bg-surface p-4 rounded-2xl border border-white/5 mb-3">
                        <View className="flex-row items-center mb-2">
                            <Building2 size={16} color="#8B949E" />
                            <Text className="text-text-secondary text-xs ml-2">CLIENT</Text>
                        </View>
                        <TextInput
                            className="text-white font-bold text-lg bg-transparent"
                            value={clientName}
                            onChangeText={setClientName}
                            placeholder="Nama client..."
                            placeholderTextColor="#6E7681"
                        />
                    </View>

                    {/* Category Selection */}
                    <View className="bg-surface p-4 rounded-2xl border border-white/5 mb-3">
                        <View className="flex-row items-center mb-3">
                            <Tag size={16} color="#8B949E" />
                            <Text className="text-text-secondary text-xs ml-2">KATEGORI</Text>
                        </View>
                        <View className="flex-row flex-wrap gap-2">
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setCategoryId(cat.id);
                                    }}
                                    className={`px-3 py-2 rounded-lg border ${categoryId === cat.id
                                            ? 'bg-primary border-primary'
                                            : 'bg-surface-elevated border-white/10'
                                        }`}
                                >
                                    <Text className={`text-sm font-medium ${categoryId === cat.id ? 'text-background' : 'text-white'
                                        }`}>
                                        {cat.icon} {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Amount Input */}
                    <View className="bg-surface p-4 rounded-2xl border border-white/5 mb-3">
                        <View className="flex-row items-center mb-2">
                            <Wallet size={16} color="#8B949E" />
                            <Text className="text-text-secondary text-xs ml-2">JUMLAH</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Text className="text-primary font-bold text-2xl mr-2">Rp</Text>
                            <TextInput
                                className="text-primary font-bold text-2xl bg-transparent flex-1"
                                value={displayedAmount}
                                onChangeText={formatAmount}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor="#6E7681"
                            />
                        </View>
                    </View>

                    {/* Note Input */}
                    <View className="bg-surface p-4 rounded-2xl border border-white/5 mb-3">
                        <View className="flex-row items-center mb-2">
                            <FileText size={16} color="#8B949E" />
                            <Text className="text-text-secondary text-xs ml-2">CATATAN (OPSIONAL)</Text>
                        </View>
                        <TextInput
                            className="text-white bg-transparent"
                            value={note}
                            onChangeText={setNote}
                            placeholder="Tambahkan catatan..."
                            placeholderTextColor="#6E7681"
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {/* Image Preview (Read-only) */}
                    <View className="bg-surface p-4 rounded-2xl border border-white/5 mb-6">
                        <View className="flex-row items-center mb-2">
                            <Camera size={16} color="#8B949E" />
                            <Text className="text-text-secondary text-xs ml-2">FOTO STRUK</Text>
                            <Text className="text-text-secondary text-xs ml-auto">(Tidak dapat diubah)</Text>
                        </View>
                        {imageUrl ? (
                            <Image source={{ uri: imageUrl }} className="w-full h-48 rounded-xl" resizeMode="cover" />
                        ) : (
                            <View className="w-full h-32 bg-surface-elevated rounded-xl items-center justify-center border border-white/10">
                                <Camera size={32} color="#6E7681" />
                                <Text className="text-text-secondary text-sm mt-2">Tidak ada foto</Text>
                            </View>
                        )}
                    </View>

                    <View className="h-28" />
                </ScrollView>

                {/* Submit Button */}
                <View className="absolute bottom-0 left-0 right-0 bg-surface border-t border-white/5 p-4">
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        className={`bg-primary p-4 rounded-xl flex-row items-center justify-center ${isSubmitting ? 'opacity-50' : ''}`}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="#0D1117" />
                        ) : (
                            <>
                                <Check size={20} color="#0D1117" />
                                <Text className="text-background font-bold ml-2">Simpan Perubahan</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
}
