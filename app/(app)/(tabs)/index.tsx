import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { useReimbursementStore } from '../../../store/reimbursementStore';
import { useCategoryStore } from '../../../store/categoryStore';
import { useOfflineSyncStore } from '../../../store/offlineSyncStore';
import { Bell, Utensils, Coffee, Fuel, Car, Smartphone, TrendingUp, Calendar, FileText, RefreshCw, AlertCircle, CloudOff, Loader2 } from 'lucide-react-native';
import { ScreenWrapper } from '../../../src/components';
import { colors } from '../../../src/constants/theme';
import * as Haptics from 'expo-haptics';

// Map category icons
const categoryIcons: Record<string, any> = {
    'utensils': Utensils,
    'coffee': Coffee,
    'fuel': Fuel,
    'car': Car,
    'smartphone': Smartphone,
};

const defaultCategoryColors = [
    colors.categoryFood,
    colors.categoryCoffee,
    colors.categoryFuel,
    colors.categoryTransport,
    colors.categoryTopup,
];

export default function Dashboard() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const {
        entries,
        summary,
        isLoading,
        error,
        fetchReimbursements,
        fetchDashboardSummary
    } = useReimbursementStore();
    const { categories, fetchCategories } = useCategoryStore();
    const {
        isOnline,
        pendingSubmissions,
        isSyncing,
        syncPendingSubmissions
    } = useOfflineSyncStore();

    const pendingCount = pendingSubmissions.length;

    // Initial data fetch
    useEffect(() => {
        fetchDashboardSummary();
        fetchReimbursements({ page: 1 });
        fetchCategories();
    }, []);

    const onRefresh = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await Promise.all([
            fetchDashboardSummary(),
            fetchReimbursements({ page: 1 }),
            fetchCategories(),
        ]);

        // Try to sync pending items if online
        if (isOnline && pendingCount > 0) {
            syncPendingSubmissions();
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, [isOnline, pendingCount]);

    const handleCategoryPress = (categoryId: number, categoryName: string) => {
        Haptics.selectionAsync();
        router.push({ pathname: '/(app)/new-entry', params: { categoryId: String(categoryId), categoryName } });
    };

    const handleSyncPress = () => {
        Haptics.selectionAsync();
        if (pendingCount > 0) {
            if (isOnline) {
                syncPendingSubmissions();
            } else {
                Alert.alert(
                    'Tidak Ada Koneksi',
                    `${pendingCount} item menunggu untuk diupload. Data akan otomatis tersync saat terhubung ke internet.`,
                    [{ text: 'OK' }]
                );
            }
        }
    };

    // Format date
    const today = new Date();
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const formattedDate = `${dayNames[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;

    // Format amount display
    const formatAmount = (amount: number) => {
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(2)}M`;
        }
        return new Intl.NumberFormat('id-ID').format(amount);
    };

    // Get status config for display
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending':
                return { bg: 'bg-yellow-500/20', text: 'text-yellow-500', label: 'PENDING' };
            case 'approved':
                return { bg: 'bg-green-500/20', text: 'text-green-400', label: 'APPROVED' };
            case 'rejected':
                return { bg: 'bg-red-500/20', text: 'text-red-400', label: 'REJECTED' };
            default:
                return { bg: 'bg-gray-500/20', text: 'text-gray-400', label: status.toUpperCase() };
        }
    };

    // Render sync badge based on state
    const renderSyncBadge = () => {
        if (isSyncing) {
            return (
                <View className="bg-blue-500/20 px-3 py-1.5 rounded-full flex-row items-center">
                    <Loader2 size={12} color={colors.primary} />
                    <Text className="text-blue-400 text-xs font-medium ml-1">Syncing...</Text>
                </View>
            );
        }

        if (pendingCount > 0) {
            return (
                <TouchableOpacity
                    onPress={handleSyncPress}
                    className="bg-orange-500/20 px-3 py-1.5 rounded-full flex-row items-center"
                >
                    <CloudOff size={12} color={colors.warning} />
                    <Text className="text-orange-400 text-xs font-bold ml-1">{pendingCount} Pending</Text>
                </TouchableOpacity>
            );
        }

        if (!isOnline) {
            return (
                <View className="bg-red-500/20 px-3 py-1.5 rounded-full flex-row items-center">
                    <AlertCircle size={12} color={colors.danger} />
                    <Text className="text-red-400 text-xs font-medium ml-1">Offline</Text>
                </View>
            );
        }

        return (
            <View className="bg-green-500/20 px-3 py-1.5 rounded-full flex-row items-center">
                <RefreshCw size={12} color={colors.success} />
                <Text className="text-green-400 text-xs font-medium ml-1">Synced</Text>
            </View>
        );
    };

    return (
        <ScreenWrapper edges={['top']}>
            <ScrollView
                className="flex-1 px-5 pt-2"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {/* Header */}
                <View className="flex-row justify-between items-center mb-6 mt-2">
                    <View className="flex-row items-center flex-1">
                        <View className="w-12 h-12 bg-primary/20 rounded-full items-center justify-center mr-3 border-2 border-primary/30">
                            <Text className="text-xl">👤</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-text-secondary font-medium text-sm">
                                Selamat Pagi, {user?.name || 'User'}! 👋
                            </Text>
                            <Text className="text-text font-bold text-base">{formattedDate}</Text>
                        </View>
                    </View>

                    {/* Sync Badge & Notification */}
                    <View className="flex-row items-center gap-2">
                        {renderSyncBadge()}
                        <TouchableOpacity
                            className="w-10 h-10 bg-surface rounded-full items-center justify-center border border-white/5 active:bg-surface-elevated"
                            onPress={() => Haptics.selectionAsync()}
                        >
                            <Bell size={20} color={colors.text} />
                            <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full border border-surface" />
                        </TouchableOpacity>
                    </View>
                </View>


                {/* Summary Card */}
                <View className="bg-surface p-5 rounded-3xl border border-white/5 mb-8 shadow-lg shadow-black/50">
                    <View className="flex-row justify-between items-start mb-2">
                        <View>
                            <Text className="text-text-secondary mb-1 text-sm">Total Pending</Text>
                            <Text className="text-4xl font-bold text-white">
                                Rp {formatAmount(summary?.pending_total || 0)}
                            </Text>
                        </View>
                        {summary?.pending_count ? (
                            <View className="bg-yellow-500/20 px-2.5 py-1.5 rounded-lg flex-row items-center">
                                <AlertCircle size={14} color={colors.warning} />
                                <Text className="text-yellow-500 text-xs font-bold ml-1">
                                    {summary.pending_count} pending
                                </Text>
                            </View>
                        ) : (
                            <View className="bg-success/20 px-2.5 py-1.5 rounded-lg flex-row items-center">
                                <TrendingUp size={14} color={colors.success} />
                                <Text className="text-success text-xs font-bold ml-1">All clear</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Categories */}
                <View className="mb-8">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-white font-bold text-lg">Kategori</Text>
                        <TouchableOpacity onPress={() => Haptics.selectionAsync()}>
                            <Text className="text-primary text-sm font-medium">Lihat Semua</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
                        {categories.length > 0 ? (
                            categories.map((cat, index) => {
                                const IconComponent = categoryIcons[cat.icon] || FileText;
                                const color = defaultCategoryColors[index % defaultCategoryColors.length];

                                return (
                                    <TouchableOpacity
                                        key={cat.id}
                                        className="bg-surface mr-3 p-4 rounded-2xl border border-white/5 min-w-[110px] active:bg-surface-elevated"
                                        onPress={() => handleCategoryPress(cat.id, cat.name)}
                                        activeOpacity={0.7}
                                    >
                                        <View
                                            className="w-10 h-10 rounded-full items-center justify-center mb-3"
                                            style={{ backgroundColor: `${color}20` }}
                                        >
                                            <IconComponent size={20} color={color} />
                                        </View>
                                        <Text className="text-white font-bold text-base">{cat.name}</Text>
                                        <Text className="text-primary text-xs font-medium">
                                            Rp {formatAmount(summary?.category_pending?.[String(cat.id)] || 0)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                            <View className="bg-surface p-4 rounded-2xl border border-white/5 min-w-[200px]">
                                <ActivityIndicator size="small" color={colors.primary} />
                            </View>
                        )}
                    </ScrollView>
                </View>

                {/* Recent Activities */}
                <View className="mb-24">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-white font-bold text-lg">Aktivitas Terakhir</Text>
                        <TouchableOpacity onPress={() => {
                            Haptics.selectionAsync();
                            router.push('/(app)/(tabs)/history');
                        }}>
                            <Calendar size={18} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {isLoading && entries.length === 0 ? (
                        <View className="bg-surface p-8 rounded-2xl border border-white/5 items-center">
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text className="text-text-secondary mt-3">Memuat data...</Text>
                        </View>
                    ) : entries.length === 0 ? (
                        <View className="bg-surface p-8 rounded-2xl border border-white/5 items-center">
                            <FileText size={48} color={colors.textMuted} />
                            <Text className="text-text-secondary mt-3">Belum ada reimbursement</Text>
                            <TouchableOpacity
                                className="mt-4 bg-primary/20 px-4 py-2 rounded-lg"
                                onPress={() => router.push('/(app)/new-entry')}
                            >
                                <Text className="text-primary font-medium">Buat Entry Baru</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        entries.slice(0, 4).map((item) => {
                            const config = getStatusConfig(item.status);
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    className="bg-surface p-4 rounded-2xl border border-white/5 mb-3 flex-row justify-between items-center active:bg-surface-elevated"
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        router.push(`/(app)/entry/${item.id}`);
                                    }}
                                >
                                    <View className="flex-row items-center flex-1 mr-4">
                                        <View className="w-10 h-10 bg-surface-elevated rounded-xl items-center justify-center mr-3 border border-white/5">
                                            <FileText size={20} color={colors.textMuted} />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-white font-bold text-base" numberOfLines={1}>
                                                {item.client?.name || 'Unknown Client'}
                                            </Text>
                                            <Text className="text-text-secondary text-xs">
                                                {item.category?.name || 'No Category'} • {new Date(item.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="items-end">
                                        <Text className="text-white font-bold text-base mb-1">
                                            Rp {new Intl.NumberFormat('id-ID').format(parseFloat(item.amount))}
                                        </Text>
                                        <View className={`px-2 py-0.5 rounded-md ${config.bg}`}>
                                            <Text className={`text-[10px] font-bold ${config.text}`}>
                                                {config.label}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}
