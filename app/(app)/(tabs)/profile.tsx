import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Bell, Image, RefreshCw, Trash2, LogOut, ChevronRight, Settings } from 'lucide-react-native';
import { useAuthStore } from '../../../store/authStore';
import { useReimbursementStore } from '../../../store/reimbursementStore';
import { colors } from '../../../src/constants/theme';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout, isLoading: isLoggingOut } = useAuthStore();
    const { entries, summary, fetchDashboardSummary } = useReimbursementStore();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchDashboardSummary();
    }, []);

    const onRefresh = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setRefreshing(true);
        await fetchDashboardSummary();
        setRefreshing(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const formatAmount = (amount: number) => {
        if (amount >= 1000000) {
            return `Rp${(amount / 1000000).toFixed(2)}M`;
        }
        return `Rp${new Intl.NumberFormat('id-ID').format(amount)}`;
    };

    const handleLogout = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            'Logout',
            'Apakah Anda yakin ingin keluar?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/');
                    },
                },
            ]
        );
    };

    const handleClearData = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            'Hapus Data Lokal',
            'Semua data cache akan dihapus dari perangkat ini.',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: () => {
                        const { reset } = useReimbursementStore.getState();
                        reset();
                        Alert.alert('Berhasil', 'Data lokal berhasil dihapus.');
                    },
                },
            ]
        );
    };

    const handleSync = async () => {
        Haptics.selectionAsync();
        setRefreshing(true);
        await fetchDashboardSummary();
        setRefreshing(false);
        Alert.alert('Berhasil', 'Data berhasil disinkronkan dengan server.');
    };

    const menuItems = [
        { icon: Bell, label: 'Notifikasi', onPress: () => { Haptics.selectionAsync(); Alert.alert('Info', 'Pengaturan notifikasi akan tersedia segera.'); } },
        { icon: Image, label: 'Kualitas Kompresi', onPress: () => { Haptics.selectionAsync(); Alert.alert('Info', 'Pengaturan kompresi akan tersedia segera.'); } },
        { icon: RefreshCw, label: 'Sinkronisasi Data', onPress: handleSync },
        { icon: Trash2, label: 'Hapus Data Lokal', onPress: handleClearData, danger: true },
    ];

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {/* Header */}
                <View className="px-5 pt-4 pb-2 flex-row justify-between items-center">
                    <Text className="text-white text-2xl font-bold">Profil</Text>
                    <TouchableOpacity
                        className="w-10 h-10 bg-surface rounded-full items-center justify-center border border-white/5 active:bg-surface-elevated"
                        onPress={() => Haptics.selectionAsync()}
                    >
                        <Settings size={18} color="#8B949E" />
                    </TouchableOpacity>
                </View>

                {/* User Card */}
                <View className="px-5 py-6 items-center">
                    <View className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center mb-4 border-2 border-primary/50">
                        <User size={40} color="#22D3EE" />
                    </View>
                    <Text className="text-white text-xl font-bold">{user?.name || 'User'}</Text>
                    <Text className="text-text-secondary">{user?.email || 'user@company.com'}</Text>
                </View>

                {/* Stats */}
                <View className="mx-5 bg-surface rounded-2xl border border-white/5 p-4 mb-6">
                    <Text className="text-text-secondary text-sm font-medium mb-3">📊 Statistik</Text>

                    <View className="flex-row justify-between mb-3">
                        <Text className="text-text-secondary">Total Pending</Text>
                        <Text className="text-white font-bold">{summary?.pending_count || 0} entries</Text>
                    </View>
                    <View className="flex-row justify-between mb-3">
                        <Text className="text-text-secondary">Total Amount Pending</Text>
                        <Text className="text-white font-bold">{formatAmount(summary?.pending_total || 0)}</Text>
                    </View>
                    <View className="h-px bg-white/10 my-2" />
                    <View className="flex-row justify-between mb-2">
                        <View className="flex-row items-center">
                            <View className="w-2 h-2 rounded-full bg-yellow-400 mr-2" />
                            <Text className="text-text-secondary">Pending</Text>
                        </View>
                        <Text className="text-white font-bold">{summary?.pending_count || 0}</Text>
                    </View>
                    <View className="flex-row justify-between">
                        <View className="flex-row items-center">
                            <View className="w-2 h-2 rounded-full bg-primary mr-2" />
                            <Text className="text-text-secondary">All Time Total</Text>
                        </View>
                        <Text className="text-white font-bold">{formatAmount(summary?.all_time_total || 0)}</Text>
                    </View>
                </View>

                {/* Settings Menu */}
                <View className="mx-5 mb-4">
                    <Text className="text-text-secondary text-sm font-medium mb-3">⚙️ Pengaturan</Text>
                    <View className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={item.label}
                                onPress={item.onPress}
                                className={`flex-row items-center justify-between p-4 active:bg-surface-elevated ${index < menuItems.length - 1 ? 'border-b border-white/5' : ''
                                    }`}
                            >
                                <View className="flex-row items-center">
                                    <item.icon size={20} color={item.danger ? '#EF4444' : '#8B949E'} />
                                    <Text className={`ml-3 font-medium ${item.danger ? 'text-red-400' : 'text-white'}`}>
                                        {item.label}
                                    </Text>
                                </View>
                                <ChevronRight size={18} color="#6E7681" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Logout */}
                <View className="mx-5 mb-8">
                    <TouchableOpacity
                        onPress={handleLogout}
                        disabled={isLoggingOut}
                        className={`bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex-row items-center justify-center active:bg-red-500/20 ${isLoggingOut ? 'opacity-50' : ''}`}
                    >
                        {isLoggingOut ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                            <>
                                <LogOut size={20} color="#EF4444" />
                                <Text className="text-red-400 font-bold ml-2">Logout</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View className="h-24" />
            </ScrollView>
        </SafeAreaView>
    );
}
