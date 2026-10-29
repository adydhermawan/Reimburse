import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Tag, Building2, Wallet, FileText, Camera, Check, AlertCircle, MoreHorizontal, X, Search, Plus, ChevronRight } from 'lucide-react-native';
import { useReimbursementStore } from '../../../store/reimbursementStore';
import { useCategoryStore } from '../../../store/categoryStore';
import { useClientStore } from '../../../store/clientStore';
import { reimbursementApi } from '../../../src/services';
import { colors } from '../../../src/constants/theme';
import { getCategoryIcon } from '../../../src/constants/categoryIcons';
import { Reimbursement } from '../../../src/types';
import * as Haptics from '../../../src/services/platformHaptics';
import { parseDateOnly, formatDateOnly } from '../../../src/utils/date';

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
    const { clients, isLoading: isLoadingClients, isCreating: isCreatingClient, fetchClients, createClient } = useClientStore();

    // Local state
    const [entry, setEntry] = useState<Reimbursement | null | undefined>(getEntryById(numericId));
    const [isLoading, setIsLoading] = useState(!entry);
    const [localError, setLocalError] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(true);

    // Form state
    const [clientName, setClientName] = useState('');
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');

    // New states for Date and Custom Category
    const [transactionDate, setTransactionDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customCategory, setCustomCategory] = useState('');
    const [isOtherModalVisible, setIsOtherModalVisible] = useState(false);
    const [isCustomCategory, setIsCustomCategory] = useState(false);

    // Client picker
    const [isClientModalVisible, setIsClientModalVisible] = useState(false);
    const [clientSearch, setClientSearch] = useState('');
    const clientSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch entry from API if not in store, or missing image_path
    useEffect(() => {
        fetchCategories();
        if ((!entry || !entry.image_path) && numericId) {
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

            if (entry.transaction_date) {
                setTransactionDate(parseDateOnly(entry.transaction_date));
            }
            if (entry.category_name && !entry.category_id) {
                setIsCustomCategory(true);
                setCustomCategory(entry.category_name);
            }
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

        if (!categoryId && !isCustomCategory) {
            setLocalError('Kategori harus dipilih.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        if (isCustomCategory && !customCategory.trim()) {
            setLocalError('Nama kategori baru harus diisi.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            setLocalError('Jumlah harus lebih dari 0.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        const payload: any = {
            client_name: clientName.trim(),
            amount: parseFloat(amount),
            transaction_date: formatDateOnly(transactionDate),
            note: note.trim() || undefined,
        };

        if (isCustomCategory && customCategory.trim()) {
            payload.category_name = customCategory.trim();
        } else {
            payload.category_id = categoryId;
        }

        const success = await updateReimbursement(numericId, payload);

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

    const openClientPicker = () => {
        Haptics.selectionAsync();
        setClientSearch('');
        fetchClients();
        setIsClientModalVisible(true);
    };

    const handleClientSearchChange = (text: string) => {
        setClientSearch(text);
        if (clientSearchTimer.current) clearTimeout(clientSearchTimer.current);
        clientSearchTimer.current = setTimeout(() => {
            fetchClients(text.trim() || undefined);
        }, 300);
    };

    const handleSelectClient = (name: string) => {
        Haptics.selectionAsync();
        setClientName(name);
        setIsClientModalVisible(false);
    };

    const handleCreateClient = async () => {
        if (!clientSearch.trim()) return;
        Haptics.selectionAsync();
        const newClient = await createClient(clientSearch.trim());
        if (newClient) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            handleSelectClient(newClient.name);
        }
    };

    const clientExactMatchExists = clients.some(
        c => c.name.toLowerCase() === clientSearch.trim().toLowerCase()
    );

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
                        <TouchableOpacity
                            onPress={openClientPicker}
                            activeOpacity={0.7}
                            className="bg-background border border-white/10 rounded-xl px-4 py-3 flex-row justify-between items-center"
                        >
                            <Text className={`font-bold text-lg flex-1 ${clientName ? 'text-white' : 'text-text-secondary'}`} numberOfLines={1}>
                                {clientName || 'Pilih client...'}
                            </Text>
                            <ChevronRight size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    {/* Category Selection */}
                    <View className="bg-surface p-4 rounded-2xl border border-white/5 mb-3">
                        <View className="flex-row items-center mb-3">
                            <Tag size={16} color="#8B949E" />
                            <Text className="text-text-secondary text-xs ml-2">KATEGORI</Text>
                        </View>
                        <View className="flex-row flex-wrap gap-2">
                            {categories.map((cat) => {
                                const isSelected = categoryId === cat.id && !isCustomCategory;
                                const IconComponent = getCategoryIcon(cat.icon);
                                return (
                                    <TouchableOpacity
                                        key={cat.id}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setCategoryId(cat.id);
                                            setIsCustomCategory(false);
                                        }}
                                        className={`px-3 py-2 rounded-lg border flex-row items-center ${isSelected
                                            ? 'bg-primary border-primary'
                                            : 'bg-surface-elevated border-white/10'
                                            }`}
                                    >
                                        <IconComponent size={14} color={isSelected ? colors.background : colors.text} />
                                        <Text className={`text-sm font-medium ml-2 ${isSelected ? 'text-background' : 'text-white'}`}>
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}

                            {/* Custom Category Button */}
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setIsOtherModalVisible(true);
                                }}
                                className={`px-3 py-2 rounded-lg border flex-row items-center ${isCustomCategory ? 'bg-primary border-primary' : 'bg-surface-elevated border-white/10'}`}
                            >
                                {isCustomCategory && customCategory ? (
                                    <Text className="text-sm font-medium text-background">
                                        ✨ {customCategory}
                                    </Text>
                                ) : (
                                    <View className="flex-row items-center">
                                        <MoreHorizontal size={14} color={colors.text} />
                                        <Text className="text-sm font-medium text-white ml-2">Lainnya</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Date Input */}
                    <View className="bg-surface p-4 rounded-2xl border border-white/5 mb-3">
                        <View className="flex-row items-center mb-2">
                            <Calendar size={16} color="#8B949E" />
                            <Text className="text-text-secondary text-xs ml-2">TANGGAL</Text>
                        </View>
                        {Platform.OS === 'web' ? (
                            React.createElement('input', {
                                type: 'date',
                                value: formatDateOnly(transactionDate),
                                onChange: (e: any) => {
                                    if (e.target.value) {
                                        setTransactionDate(parseDateOnly(e.target.value));
                                    }
                                },
                                style: {
                                    backgroundColor: 'transparent',
                                    color: 'white',
                                    fontSize: 18,
                                    fontWeight: 'bold',
                                    border: 'none',
                                    outline: 'none',
                                    width: '100%',
                                    colorScheme: 'dark',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }
                            })
                        ) : (
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                className="bg-background border border-white/10 rounded-xl px-4 py-3 flex-row justify-between items-center"
                            >
                                <Text className="text-white font-bold text-lg">
                                    {transactionDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {Platform.OS === 'ios' && showDatePicker && (
                            <View className="bg-background border border-white/10 rounded-xl mt-3 overflow-hidden">
                                <DateTimePicker
                                    value={transactionDate}
                                    mode="date"
                                    display="spinner"
                                    onChange={(event, selectedDate) => {
                                        if (selectedDate) setTransactionDate(selectedDate);
                                    }}
                                    textColor="#FFFFFF"
                                />
                                <TouchableOpacity
                                    className="bg-primary p-3 items-center"
                                    onPress={() => setShowDatePicker(false)}
                                >
                                    <Text className="text-background font-bold">Selesai</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        {Platform.OS === 'android' && showDatePicker && (
                            <DateTimePicker
                                value={transactionDate}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowDatePicker(false);
                                    if (event.type === 'set' && selectedDate) setTransactionDate(selectedDate);
                                }}
                            />
                        )}
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
                            <View className="w-full rounded-xl overflow-hidden bg-surface-elevated relative" style={{ minHeight: 300 }}>
                                <Image
                                    source={{ uri: imageUrl }}
                                    className="w-full"
                                    style={{ minHeight: 300, height: 'auto', aspectRatio: 3 / 4 }}
                                    resizeMode="contain"
                                    onLoadEnd={() => setImageLoading(false)}
                                    onError={() => setImageLoading(false)}
                                />
                                {imageLoading && (
                                    <View className="absolute inset-0 bg-surface-elevated items-center justify-center">
                                        <ActivityIndicator size="large" color={colors.primary} />
                                        <Text className="text-text-secondary text-sm mt-2">Memuat foto...</Text>
                                    </View>
                                )}
                            </View>
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

                {/* Client Picker Modal */}
                <Modal
                    visible={isClientModalVisible}
                    animationType="slide"
                    onRequestClose={() => setIsClientModalVisible(false)}
                >
                    <SafeAreaView className="flex-1 bg-background px-5 pt-4">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-white text-xl font-bold">Pilih Client</Text>
                            <TouchableOpacity
                                onPress={() => setIsClientModalVisible(false)}
                                className="w-8 h-8 bg-surface-elevated rounded-full items-center justify-center"
                            >
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View className="bg-surface border border-white/10 rounded-xl px-4 flex-row items-center mb-4">
                            <Search size={20} color={colors.textMuted} />
                            <TextInput
                                className="flex-1 text-white text-base py-3 ml-3"
                                placeholder="Cari atau tambah client..."
                                placeholderTextColor="#6E7681"
                                value={clientSearch}
                                onChangeText={handleClientSearchChange}
                                autoFocus
                            />
                        </View>

                        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {isLoadingClients ? (
                                <View className="items-center py-8">
                                    <ActivityIndicator size="small" color={colors.primary} />
                                    <Text className="text-text-secondary mt-2 text-sm">Mencari...</Text>
                                </View>
                            ) : (
                                <>
                                    {clients.map((item) => {
                                        const isSelected = item.name === clientName;
                                        return (
                                            <TouchableOpacity
                                                key={item.id}
                                                onPress={() => handleSelectClient(item.name)}
                                                className={`bg-surface p-4 rounded-2xl border mb-3 flex-row items-center ${isSelected ? 'border-primary' : 'border-white/5'}`}
                                                activeOpacity={0.7}
                                            >
                                                <View className="w-10 h-10 bg-surface-elevated rounded-full items-center justify-center mr-3">
                                                    <Building2 size={20} color={colors.textMuted} />
                                                </View>
                                                <Text className="text-white font-bold text-base flex-1">{item.name}</Text>
                                                {isSelected && <Check size={18} color={colors.primary} />}
                                            </TouchableOpacity>
                                        );
                                    })}

                                    {clientSearch.trim().length > 0 && !clientExactMatchExists && (
                                        <TouchableOpacity
                                            onPress={handleCreateClient}
                                            disabled={isCreatingClient}
                                            className={`bg-primary/10 p-4 rounded-2xl border border-primary/30 mb-3 flex-row items-center ${isCreatingClient ? 'opacity-50' : ''}`}
                                            activeOpacity={0.7}
                                        >
                                            <View className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center mr-3">
                                                {isCreatingClient ? (
                                                    <ActivityIndicator size="small" color={colors.primary} />
                                                ) : (
                                                    <Plus size={20} color={colors.primary} />
                                                )}
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-white font-bold text-base">
                                                    {isCreatingClient ? 'Menambahkan...' : `Tambah "${clientSearch.trim()}"`}
                                                </Text>
                                                <Text className="text-text-secondary text-xs">sebagai client baru</Text>
                                            </View>
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}
                        </ScrollView>
                    </SafeAreaView>
                </Modal>

                {/* Custom Category Modal */}
                <Modal
                    visible={isOtherModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setIsOtherModalVisible(false)}
                >
                    <View className="flex-1 bg-black/80 justify-center px-5">
                        <View className="bg-surface p-6 rounded-3xl border border-white/10">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-white text-xl font-bold">Kategori Lainnya</Text>
                                <TouchableOpacity
                                    onPress={() => setIsOtherModalVisible(false)}
                                    className="w-8 h-8 bg-surface-elevated rounded-full items-center justify-center"
                                >
                                    <X size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                className="bg-background border border-white/10 rounded-xl px-4 py-3 text-white text-base mb-6"
                                placeholder="Masukkan nama kategori"
                                placeholderTextColor="#6E7681"
                                value={customCategory}
                                onChangeText={setCustomCategory}
                                autoFocus
                            />

                            <TouchableOpacity
                                className="bg-primary p-4 rounded-2xl flex-row items-center justify-center active:opacity-80"
                                onPress={() => {
                                    if (customCategory.trim()) {
                                        setIsCustomCategory(true);
                                        setCategoryId(null);
                                        setIsOtherModalVisible(false);
                                    }
                                }}
                            >
                                <Text className="text-background font-bold text-lg">Simpan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View >
        </>
    );
}
