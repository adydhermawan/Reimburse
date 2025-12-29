import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Tag, Building2, Wallet, Camera, FileText, Trash2, Edit3, AlertCircle } from 'lucide-react-native';
import { useReimbursementStore } from '../../../store/reimbursementStore';
import { reimbursementApi } from '../../../src/services';
import { colors } from '../../../src/constants/theme';
import { Reimbursement } from '../../../src/types';

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

    // Convert string id to number for getEntryById
    const numericId = id ? parseInt(id, 10) : 0;

    // Get store functions and data
    const getEntryById = useReimbursementStore((state) => state.getEntryById);
    const fetchReimbursementById = useReimbursementStore((state) => state.fetchReimbursementById);
    const deleteReimbursement = useReimbursementStore((state) => state.deleteReimbursement);
    const error = useReimbursementStore((state) => state.error);

    // Local state for entry
    const [entry, setEntry] = useState<Reimbursement | null | undefined>(() => getEntryById(numericId));

    // Fetch from API if not in store
    useEffect(() => {
        if (!entry && numericId) {
            setIsLoading(true);
            fetchReimbursementById(numericId).then((fetchedEntry) => {
                setEntry(fetchedEntry);
                setIsLoading(false);
            });
        }
    }, [numericId]);

    // Check if entry can be edited/deleted (only pending status)
    const canModify = entry?.status === 'pending';

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

    const handleDelete = () => {
        Alert.alert(
            'Hapus Reimbursement',
            'Apakah Anda yakin ingin menghapus reimbursement ini? Tindakan ini tidak dapat dibatalkan.',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            const success = await deleteReimbursement(numericId);
                            if (success) {
                                Alert.alert('Berhasil', 'Reimbursement berhasil dihapus', [
                                    { text: 'OK', onPress: () => router.back() }
                                ]);
                            } else {
                                Alert.alert('Gagal', error || 'Gagal menghapus reimbursement');
                            }
                        } catch (e: any) {
                            Alert.alert('Error', e.message || 'Terjadi kesalahan');
                        } finally {
                            setIsDeleting(false);
                        }
                    },
                },
            ]
        );
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

                    <View className="bg-surface p-4 rounded-2xl border border-white/5 mb-6">
                        <View className="flex-row items-center mb-2">
                            <Camera size={16} color="#8B949E" />
                            <Text className="text-text-secondary text-xs ml-2">FOTO STRUK</Text>
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
        </>
    );
}
