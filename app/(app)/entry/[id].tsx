import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Tag, Building2, Wallet, Camera, FileText, Trash2, Edit3, AlertCircle, RefreshCw, Sparkles, ChevronRight, X, Check } from 'lucide-react-native';
import { useReimbursementStore } from '../../../store/reimbursementStore';
import { useAuthStore } from '../../../store/authStore';
import { reimbursementApi } from '../../../src/services';
import { colors } from '../../../src/constants/theme';
import { Reimbursement } from '../../../src/types';
import { AI_MODELS } from '../../../src/constants/aiModels';
import * as Haptics from '../../../src/services/platformHaptics';

// Status colors matching API status values
const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', label: '⏳ PENDING' },
    approved: { bg: 'bg-green-500/20', text: 'text-green-400', label: '✅ APPROVED' },
    rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: '❌ REJECTED' },
    in_report: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '📝 IN REPORT' },
    paid: { bg: 'bg-green-600/20', text: 'text-green-500', label: '💰 PAID' },
};

export default function EntryDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    // Convert string id to number for getEntryById
    const numericId = id ? parseInt(id, 10) : 0;

    // Get store functions and data
    const getEntryById = useReimbursementStore((state) => state.getEntryById);
    const fetchReimbursementById = useReimbursementStore((state) => state.fetchReimbursementById);
    const deleteReimbursement = useReimbursementStore((state) => state.deleteReimbursement);
    const reprocessReimbursement = useReimbursementStore((state) => state.reprocessReimbursement);
    const isSubmitting = useReimbursementStore((state) => state.isSubmitting);
    const storeError = useReimbursementStore((state) => state.error);

    // Get user and auth update profile
    const { user, updateProfile } = useAuthStore();

    // Local state for entry
    const [entry, setEntry] = useState<Reimbursement | null | undefined>(() => getEntryById(numericId));

    // Reprocessing AI States
    const [showModelModal, setShowModelModal] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>(user?.preferred_ai_model || 'gemini-3.5-flash');
    const [isReprocessing, setIsReprocessing] = useState(false);

    // Update selected model when user preferred model changes
    useEffect(() => {
        if (user?.preferred_ai_model) {
            setSelectedModel(user.preferred_ai_model);
        }
    }, [user?.preferred_ai_model]);

    // Fetch from API if not in store, or if it's missing image_path (due to list optimization)
    useEffect(() => {
        if ((!entry || !entry.image_path) && numericId) {
            setIsLoading(true);
            fetchReimbursementById(numericId).then((fetchedEntry) => {
                setEntry(fetchedEntry);
                setIsLoading(false);
            });
        }
    }, [numericId]);

    // Check if entry can be edited/deleted (only pending status)
    const canModify = entry?.status === 'pending';
    const isProcessingAI = entry && parseFloat(entry.amount) === 0 && 
        (entry.category?.name === 'Uncategorized' || entry.category_name === 'Uncategorized');

    if (isLoading) {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        title: 'Detail Entry',
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
                        title: 'Detail Entry',
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

    const formatAmount = (amount: string | number) => {
        const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('id-ID').format(numericAmount);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const performDelete = async () => {
        setIsDeleting(true);
        try {
            const success = await deleteReimbursement(numericId);
            if (success) {
                if (Platform.OS === 'web') {
                    window.alert('Reimbursement berhasil dihapus');
                    router.back();
                } else {
                    Alert.alert('Berhasil', 'Reimbursement berhasil dihapus', [
                        { text: 'OK', onPress: () => router.back() }
                    ]);
                }
            } else {
                if (Platform.OS === 'web') {
                    window.alert(storeError || 'Gagal menghapus reimbursement');
                } else {
                    Alert.alert('Gagal', storeError || 'Gagal menghapus reimbursement');
                }
            }
        } catch (e: any) {
            if (Platform.OS === 'web') {
                window.alert(e.message || 'Terjadi kesalahan');
            } else {
                Alert.alert('Error', e.message || 'Terjadi kesalahan');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleReprocess = async () => {
        if (!entry || !entry.image_path) return;
        
        setIsReprocessing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // 1. Update preferred model if changed
            if (selectedModel !== user?.preferred_ai_model) {
                const profileSuccess = await updateProfile({ preferred_ai_model: selectedModel });
                if (!profileSuccess) {
                    console.log('Failed to update preferred AI model on server, but continuing to reprocess...');
                }
            }

            // 2. Call reprocess
            const updatedEntry = await reprocessReimbursement(numericId, selectedModel, entry.image_path);
            
            if (updatedEntry) {
                setEntry(updatedEntry);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                if (Platform.OS === 'web') {
                    window.alert('Berhasil memproses ulang struk dengan AI!');
                } else {
                    Alert.alert('Berhasil', 'Berhasil memproses ulang struk dengan AI!');
                }
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                if (Platform.OS === 'web') {
                    window.alert(storeError || 'Gagal memproses ulang struk');
                } else {
                    Alert.alert('Gagal', storeError || 'Gagal memproses ulang struk');
                }
            }
        } catch (e: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            if (Platform.OS === 'web') {
                window.alert(e.message || 'Terjadi kesalahan');
            } else {
                Alert.alert('Error', e.message || 'Terjadi kesalahan');
            }
        } finally {
            setIsReprocessing(false);
        }
    };

    const handleDelete = () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm('Apakah Anda yakin ingin menghapus reimbursement ini? Tindakan ini tidak dapat dibatalkan.');
            if (confirmed) {
                performDelete();
            }
        } else {
            Alert.alert(
                'Hapus Reimbursement',
                'Apakah Anda yakin ingin menghapus reimbursement ini? Tindakan ini tidak dapat dibatalkan.',
                [
                    { text: 'Batal', style: 'cancel' },
                    {
                        text: 'Hapus',
                        style: 'destructive',
                        onPress: performDelete,
                    },
                ]
            );
        }
    };

    const handleEdit = () => {
        router.push(`/(app)/edit-entry/${numericId}`);
    };

    // Get full image URL for display
    const imageUrl = entry.image_path ? reimbursementApi.getImageUrl(entry.image_path) : null;

    // Get status info with fallback
    const statusInfo = statusColors[entry.status] || statusColors.pending;

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Detail Entry',
                    headerStyle: { backgroundColor: '#161B22' },
                    headerTintColor: '#FFFFFF',
                }}
            />
            <View className="flex-1 bg-background">
                <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
                    {/* Status Banner */}
                    <View className={`${statusInfo.bg} p-4 rounded-2xl mb-6`}>
                        <Text className={`${statusInfo.text} text-lg font-bold text-center`}>
                            {statusInfo.label}
                        </Text>
                        {entry.report_id && (
                            <Text className="text-text-secondary text-xs text-center mt-1">
                                Termasuk dalam Report #{entry.report_id}
                            </Text>
                        )}
                    </View>

                    {/* Stuck AI Warning Banner */}
                    {isProcessingAI && (
                        <View className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl mb-6 flex-row items-start">
                            <AlertCircle size={20} color="#EAB308" style={{ marginRight: 12, marginTop: 2 }} />
                            <View className="flex-1">
                                <Text className="text-yellow-500 font-bold text-sm">Analisis AI Tertunda / Gagal</Text>
                                <Text className="text-text-secondary text-xs mt-1 leading-relaxed">
                                    AI gagal mengekstrak data dari struk ini. Silakan coba proses ulang menggunakan model AI yang lebih baru di bawah ini.
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Detail Cards */}
                    <View className="bg-surface p-4 rounded-2xl border border-white/5 mb-3">
                        <View className="flex-row items-center mb-2">
                            <Calendar size={16} color="#8B949E" />
                            <Text className="text-text-secondary text-xs ml-2">TANGGAL</Text>
                        </View>
                        <Text className="text-white font-bold text-lg">{formatDate(entry.transaction_date)}</Text>
                    </View>

                    <View className="bg-surface p-4 rounded-2xl border border-white/5 mb-3">
                        <View className="flex-row items-center mb-2">
                            <Tag size={16} color="#8B949E" />
                            <Text className="text-text-secondary text-xs ml-2">KATEGORI</Text>
                        </View>
                        <Text className="text-white font-bold text-lg">{entry.category?.name || 'Tidak ada kategori'}</Text>
                    </View>

                    <View className="bg-surface p-4 rounded-2xl border border-white/5 mb-3">
                        <View className="flex-row items-center mb-2">
                            <Building2 size={16} color="#8B949E" />
                            <Text className="text-text-secondary text-xs ml-2">CLIENT</Text>
                        </View>
                        <Text className="text-white font-bold text-lg">{entry.client?.name || 'Tidak ada client'}</Text>
                    </View>

                    <View className="bg-surface p-4 rounded-2xl border border-white/5 mb-3">
                        <View className="flex-row items-center mb-2">
                            <Wallet size={16} color="#8B949E" />
                            <Text className="text-text-secondary text-xs ml-2">JUMLAH</Text>
                        </View>
                        <Text className="text-primary font-bold text-2xl">Rp {formatAmount(entry.amount)}</Text>
                    </View>

                    {entry.note && (
                        <View className="bg-surface p-4 rounded-2xl border border-white/5 mb-3">
                            <View className="flex-row items-center mb-2">
                                <FileText size={16} color="#8B949E" />
                                <Text className="text-text-secondary text-xs ml-2">CATATAN</Text>
                            </View>
                            <Text className="text-white">{entry.note}</Text>
                        </View>
                    )}

                    {/* AI Reprocessing Section */}
                    {canModify && entry.image_path && (
                        <View className="bg-surface p-4 rounded-2xl border border-white/5 mb-3">
                            <View className="flex-row items-center mb-3">
                                <Sparkles size={16} color={colors.primary} />
                                <Text className="text-text-secondary text-xs ml-2 font-bold uppercase tracking-wider">Proses Ulang AI</Text>
                            </View>
                            
                            <Text className="text-text-muted text-sm mb-4 leading-relaxed">
                                Kirim ulang struk ini ke AI untuk ekstraksi otomatis (merchant, nominal, kategori, dan tanggal).
                            </Text>

                            {/* Active Model Selector trigger */}
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setShowModelModal(true);
                                }}
                                className="bg-background border border-white/10 rounded-xl p-3 flex-row justify-between items-center mb-4"
                            >
                                <View className="flex-row items-center">
                                    <Sparkles size={16} color={colors.primary} />
                                    <View className="ml-3">
                                        <Text className="text-text-secondary text-xs">Model AI Terpilih</Text>
                                        <Text className="text-white font-bold text-sm mt-0.5">
                                            {AI_MODELS.find(m => m.id === selectedModel)?.name || selectedModel}
                                        </Text>
                                    </View>
                                </View>
                                <ChevronRight size={18} color="#8B949E" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleReprocess}
                                disabled={isReprocessing || isSubmitting}
                                className={`w-full rounded-xl flex-row items-center justify-center ${isReprocessing || isSubmitting ? 'bg-primary/50' : 'bg-primary'}`}
                                style={{ height: 50 }}
                            >
                                {isReprocessing || isSubmitting ? (
                                    <>
                                        <ActivityIndicator size="small" color="#0D1117" style={{ marginRight: 8 }} />
                                        <Text className="text-background font-bold text-base">Menganalisa Struk...</Text>
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw size={18} color="#0D1117" style={{ marginRight: 8 }} />
                                        <Text className="text-background font-bold text-base">Proses Ulang dengan AI</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    <View className="bg-surface p-4 rounded-2xl border border-white/5 mb-6">
                        <View className="flex-row items-center mb-2">
                            <Camera size={16} color="#8B949E" />
                            <Text className="text-text-secondary text-xs ml-2">FOTO STRUK</Text>
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

                    {entry.report_id && (
                        <TouchableOpacity
                            onPress={() => router.push(`/(app)/report/${entry.report_id}`)}
                            className="bg-primary/10 border border-primary/30 p-4 rounded-2xl mb-6 flex-row items-center justify-center"
                        >
                            <FileText size={18} color="#22D3EE" />
                            <Text className="text-primary font-bold ml-2">Lihat Report #{entry.report_id}</Text>
                        </TouchableOpacity>
                    )}

                    <View className="h-32" />
                </ScrollView>

                {/* Bottom Actions - Only show for pending entries */}
                {canModify && (
                    <View className="absolute bottom-0 left-0 right-0 bg-surface border-t border-white/5 p-4 flex-row gap-3">
                        <TouchableOpacity
                            onPress={handleDelete}
                            disabled={isDeleting}
                            className={`flex-1 bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex-row items-center justify-center ${isDeleting ? 'opacity-50' : ''}`}
                        >
                            {isDeleting ? (
                                <ActivityIndicator size="small" color="#EF4444" />
                            ) : (
                                <>
                                    <Trash2 size={18} color="#EF4444" />
                                    <Text className="text-red-400 font-bold ml-2">Hapus</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleEdit}
                            disabled={isDeleting}
                            className={`flex-1 bg-primary p-4 rounded-xl flex-row items-center justify-center ${isDeleting ? 'opacity-50' : ''}`}
                        >
                            <Edit3 size={18} color="#0D1117" />
                            <Text className="text-background font-bold ml-2">Edit</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Model Selection Modal */}
            <Modal
                visible={showModelModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowModelModal(false)}
            >
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-surface rounded-t-3xl p-5 pb-10" style={{ maxHeight: '80%' }}>
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-white text-xl font-bold">Pilih Model AI</Text>
                            <TouchableOpacity onPress={() => setShowModelModal(false)}>
                                <X size={24} color="#8B949E" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
                            {AI_MODELS.map((model) => {
                                const isSelected = selectedModel === model.id;
                                return (
                                    <TouchableOpacity
                                        key={model.id}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setSelectedModel(model.id);
                                        }}
                                        className={`p-4 rounded-xl border ${isSelected ? 'border-primary bg-surface-elevated' : 'border-white/5 bg-transparent'} mb-3 flex-row justify-between items-center`}
                                    >
                                        <View className="flex-1 mr-3">
                                            <View className="flex-row items-center mb-1">
                                                <Text className="text-white font-semibold text-base mr-2">{model.name}</Text>
                                                <View className="bg-surface px-2 py-0.5 rounded-full">
                                                    <Text className="text-text-secondary text-[10px] font-medium">{model.limit}</Text>
                                                </View>
                                            </View>
                                            <Text className="text-text-secondary text-xs leading-relaxed">{model.description}</Text>
                                        </View>
                                        <View className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-text-secondary'}`}>
                                            {isSelected && <Check color="#000" size={12} strokeWidth={3} />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <TouchableOpacity
                            className="bg-primary p-4 rounded-xl items-center"
                            onPress={() => setShowModelModal(false)}
                        >
                            <Text className="text-background font-bold text-base">Pilih Model Ini</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}
