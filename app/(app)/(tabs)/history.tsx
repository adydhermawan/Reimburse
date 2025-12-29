import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Calendar, FileText, X, Check } from 'lucide-react-native';
import { useReimbursementStore } from '../../../store/reimbursementStore';
import { colors } from '../../../src/constants/theme';
import { ReimbursementFilters } from '../../../src/types';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'in_report' | 'paid' | 'all';

const tabs: { label: string; value: StatusFilter }[] = [
    { label: 'Semua', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Report', value: 'in_report' },
    { label: 'Approved', value: 'approved' },
    { label: 'Paid', value: 'paid' },
    { label: 'Rejected', value: 'rejected' },
];

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', label: 'PENDING' },
    approved: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'APPROVED' },
    rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'REJECTED' },
    in_report: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'IN REPORT' },
    paid: { bg: 'bg-green-600/20', text: 'text-green-500', label: 'PAID' },
};

export default function HistoryScreen() {
    const router = useRouter();
    const { entries, isLoading, pagination, fetchReimbursements } = useReimbursementStore();
    const [activeTab, setActiveTab] = useState<StatusFilter>('all');
    const [refreshing, setRefreshing] = useState(false);

    // Search state
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSearch, setActiveSearch] = useState('');

    // Date filter state
    const [showDateModal, setShowDateModal] = useState(false);
    const [dateFrom, setDateFrom] = useState<Date | null>(null);
    const [dateTo, setDateTo] = useState<Date | null>(null);
    const [activeDateFrom, setActiveDateFrom] = useState<Date | null>(null);
    const [activeDateTo, setActiveDateTo] = useState<Date | null>(null);
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    // Build filters and fetch
    const buildFilters = useCallback((): ReimbursementFilters => {
        const filters: ReimbursementFilters = {};
        if (activeTab !== 'all') {
            filters.status = activeTab as 'pending' | 'approved' | 'rejected' | 'in_report' | 'paid';
        }
        if (activeSearch) {
            filters.search = activeSearch;
        }
        if (activeDateFrom) {
            filters.date_from = activeDateFrom.toISOString().split('T')[0];
        }
        if (activeDateTo) {
            filters.date_to = activeDateTo.toISOString().split('T')[0];
        }
        return filters;
    }, [activeTab, activeSearch, activeDateFrom, activeDateTo]);

    // Fetch on mount and filter change
    useEffect(() => {
        fetchReimbursements(buildFilters());
    }, [activeTab, activeSearch, activeDateFrom, activeDateTo]);

    const onRefresh = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setRefreshing(true);
        await fetchReimbursements(buildFilters());
        setRefreshing(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, [buildFilters]);

    const handleTabChange = (tab: StatusFilter) => {
        Haptics.selectionAsync();
        setActiveTab(tab);
    };

    const handleSearchSubmit = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveSearch(searchQuery);
        setShowSearchModal(false);
    };

    const handleClearSearch = () => {
        Haptics.selectionAsync();
        setSearchQuery('');
        setActiveSearch('');
    };

    const handleDateApply = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveDateFrom(dateFrom);
        setActiveDateTo(dateTo);
        setShowDateModal(false);
    };

    const handleClearDates = () => {
        Haptics.selectionAsync();
        setDateFrom(null);
        setDateTo(null);
        setActiveDateFrom(null);
        setActiveDateTo(null);
    };

    const formatAmount = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('id-ID').format(num);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Hari ini';
        if (date.toDateString() === yesterday.toDateString()) return 'Kemarin';
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    const formatDateDisplay = (date: Date) => {
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const hasActiveFilters = activeSearch || activeDateFrom || activeDateTo;

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="px-5 pt-4 pb-2 flex-row justify-between items-center">
                <Text className="text-white text-2xl font-bold">Riwayat</Text>
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        className={`w-10 h-10 rounded-full items-center justify-center border active:bg-surface-elevated ${activeSearch ? 'bg-primary border-primary' : 'bg-surface border-white/5'}`}
                        onPress={() => {
                            Haptics.selectionAsync();
                            setShowSearchModal(true);
                        }}
                    >
                        <Search size={18} color={activeSearch ? '#0D1117' : '#8B949E'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`w-10 h-10 rounded-full items-center justify-center border active:bg-surface-elevated ${activeDateFrom || activeDateTo ? 'bg-primary border-primary' : 'bg-surface border-white/5'}`}
                        onPress={() => {
                            Haptics.selectionAsync();
                            setShowDateModal(true);
                        }}
                    >
                        <Calendar size={18} color={activeDateFrom || activeDateTo ? '#0D1117' : '#8B949E'} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <View className="px-5 pb-2">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {activeSearch && (
                            <TouchableOpacity
                                onPress={handleClearSearch}
                                className="bg-primary/20 border border-primary/30 px-3 py-1.5 rounded-full flex-row items-center mr-2"
                            >
                                <Search size={12} color={colors.primary} />
                                <Text className="text-primary text-xs ml-1.5 font-medium">"{activeSearch}"</Text>
                                <X size={12} color={colors.primary} className="ml-1.5" />
                            </TouchableOpacity>
                        )}
                        {(activeDateFrom || activeDateTo) && (
                            <TouchableOpacity
                                onPress={handleClearDates}
                                className="bg-primary/20 border border-primary/30 px-3 py-1.5 rounded-full flex-row items-center mr-2"
                            >
                                <Calendar size={12} color={colors.primary} />
                                <Text className="text-primary text-xs ml-1.5 font-medium">
                                    {activeDateFrom ? formatDateDisplay(activeDateFrom) : '...'} - {activeDateTo ? formatDateDisplay(activeDateTo) : '...'}
                                </Text>
                                <X size={12} color={colors.primary} className="ml-1.5" />
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>
            )}

            {/* Filter Tabs */}
            <View className="px-5 py-3">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.value}
                            onPress={() => handleTabChange(tab.value)}
                            className={`mr-2 px-4 py-2 rounded-full border ${activeTab === tab.value
                                ? 'bg-primary border-primary'
                                : 'bg-surface border-white/10'
                                }`}
                        >
                            <Text
                                className={`text-sm font-medium ${activeTab === tab.value ? 'text-background' : 'text-text-secondary'
                                    }`}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Entries List */}
            <ScrollView
                className="flex-1 px-5"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {isLoading && entries.length === 0 ? (
                    <View className="items-center justify-center py-20">
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text className="text-text-secondary mt-4">Memuat data...</Text>
                    </View>
                ) : entries.length === 0 ? (
                    <View className="items-center justify-center py-20">
                        <FileText size={48} color="#6E7681" />
                        <Text className="text-text-secondary mt-4 text-center">
                            {hasActiveFilters ? 'Tidak ada hasil untuk filter ini' : `Tidak ada riwayat${activeTab !== 'all' ? ` dengan status ${activeTab}` : ''}`}
                        </Text>
                        {hasActiveFilters && (
                            <TouchableOpacity
                                className="mt-4 bg-primary/20 px-4 py-2 rounded-lg"
                                onPress={() => {
                                    handleClearSearch();
                                    handleClearDates();
                                }}
                            >
                                <Text className="text-primary font-medium">Hapus Filter</Text>
                            </TouchableOpacity>
                        )}
                        {!hasActiveFilters && (
                            <TouchableOpacity
                                className="mt-4 bg-primary/20 px-4 py-2 rounded-lg"
                                onPress={() => router.push('/(app)/new-entry')}
                            >
                                <Text className="text-primary font-medium">Buat Entry Baru</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    entries.map((item) => {
                        const config = statusColors[item.status] || statusColors.pending;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    router.push(`/(app)/entry/${item.id}`);
                                }}
                                className="bg-surface p-4 rounded-2xl border border-white/5 mb-3 flex-row justify-between items-center active:bg-surface-elevated"
                            >
                                <View className="flex-row items-center flex-1 mr-4">
                                    <View className="w-10 h-10 bg-surface-elevated rounded-xl items-center justify-center mr-3 border border-white/5">
                                        <FileText size={20} color="#6E7681" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-white font-bold text-base" numberOfLines={1}>
                                            {item.client?.name || 'Unknown Client'}
                                        </Text>
                                        <Text className="text-text-secondary text-xs">
                                            {item.category?.name || 'No Category'} • {formatDate(item.transaction_date)}
                                        </Text>
                                    </View>
                                </View>

                                <View className="items-end">
                                    <Text className="text-white font-bold text-base mb-1">
                                        Rp {formatAmount(item.amount)}
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

                {/* Pagination info */}
                {pagination && entries.length > 0 && (
                    <View className="py-4 items-center">
                        <Text className="text-text-secondary text-sm">
                            Menampilkan {entries.length} dari {pagination.total} entries
                        </Text>
                    </View>
                )}

                <View className="h-24" />
            </ScrollView>

            {/* Search Modal */}
            <Modal
                visible={showSearchModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowSearchModal(false)}
            >
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-surface rounded-t-3xl p-5 pb-10">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-white text-xl font-bold">Cari</Text>
                            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                                <X size={24} color="#8B949E" />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            className="bg-background border border-white/10 rounded-xl px-4 py-3 text-white mb-4"
                            placeholder="Cari nama client atau catatan..."
                            placeholderTextColor="#6E7681"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                            onSubmitEditing={handleSearchSubmit}
                            returnKeyType="search"
                        />
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                className="flex-1 bg-surface-elevated border border-white/10 p-4 rounded-xl items-center"
                                onPress={() => {
                                    setSearchQuery('');
                                    setShowSearchModal(false);
                                }}
                            >
                                <Text className="text-text-secondary font-medium">Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 bg-primary p-4 rounded-xl flex-row items-center justify-center"
                                onPress={handleSearchSubmit}
                            >
                                <Search size={18} color="#0D1117" />
                                <Text className="text-background font-bold ml-2">Cari</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Date Filter Modal */}
            <Modal
                visible={showDateModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDateModal(false)}
            >
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-surface rounded-t-3xl p-5 pb-10">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-white text-xl font-bold">Filter Tanggal</Text>
                            <TouchableOpacity onPress={() => setShowDateModal(false)}>
                                <X size={24} color="#8B949E" />
                            </TouchableOpacity>
                        </View>

                        {/* Date From */}
                        <Text className="text-text-secondary text-sm mb-2">Dari Tanggal</Text>
                        <TouchableOpacity
                            className="bg-background border border-white/10 rounded-xl px-4 py-3 mb-4"
                            onPress={() => setShowFromPicker(true)}
                        >
                            <Text className={dateFrom ? 'text-white' : 'text-text-secondary'}>
                                {dateFrom ? formatDateDisplay(dateFrom) : 'Pilih tanggal mulai...'}
                            </Text>
                        </TouchableOpacity>

                        {/* Date To */}
                        <Text className="text-text-secondary text-sm mb-2">Sampai Tanggal</Text>
                        <TouchableOpacity
                            className="bg-background border border-white/10 rounded-xl px-4 py-3 mb-4"
                            onPress={() => setShowToPicker(true)}
                        >
                            <Text className={dateTo ? 'text-white' : 'text-text-secondary'}>
                                {dateTo ? formatDateDisplay(dateTo) : 'Pilih tanggal akhir...'}
                            </Text>
                        </TouchableOpacity>

                        {/* Date Pickers for iOS */}
                        {Platform.OS === 'ios' && showFromPicker && (
                            <View className="bg-background rounded-xl mb-4 overflow-hidden">
                                <DateTimePicker
                                    value={dateFrom || new Date()}
                                    mode="date"
                                    display="spinner"
                                    onChange={(event, date) => {
                                        if (date) setDateFrom(date);
                                    }}
                                    textColor="#FFFFFF"
                                />
                                <TouchableOpacity
                                    className="bg-primary p-3 items-center"
                                    onPress={() => setShowFromPicker(false)}
                                >
                                    <Text className="text-background font-bold">Selesai</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {Platform.OS === 'ios' && showToPicker && (
                            <View className="bg-background rounded-xl mb-4 overflow-hidden">
                                <DateTimePicker
                                    value={dateTo || new Date()}
                                    mode="date"
                                    display="spinner"
                                    onChange={(event, date) => {
                                        if (date) setDateTo(date);
                                    }}
                                    textColor="#FFFFFF"
                                />
                                <TouchableOpacity
                                    className="bg-primary p-3 items-center"
                                    onPress={() => setShowToPicker(false)}
                                >
                                    <Text className="text-background font-bold">Selesai</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Date Pickers for Android */}
                        {Platform.OS === 'android' && showFromPicker && (
                            <DateTimePicker
                                value={dateFrom || new Date()}
                                mode="date"
                                display="default"
                                onChange={(event, date) => {
                                    setShowFromPicker(false);
                                    if (event.type === 'set' && date) setDateFrom(date);
                                }}
                            />
                        )}

                        {Platform.OS === 'android' && showToPicker && (
                            <DateTimePicker
                                value={dateTo || new Date()}
                                mode="date"
                                display="default"
                                onChange={(event, date) => {
                                    setShowToPicker(false);
                                    if (event.type === 'set' && date) setDateTo(date);
                                }}
                            />
                        )}

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                className="flex-1 bg-surface-elevated border border-white/10 p-4 rounded-xl items-center"
                                onPress={() => {
                                    setDateFrom(null);
                                    setDateTo(null);
                                    setShowDateModal(false);
                                }}
                            >
                                <Text className="text-text-secondary font-medium">Reset</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 bg-primary p-4 rounded-xl flex-row items-center justify-center"
                                onPress={handleDateApply}
                            >
                                <Check size={18} color="#0D1117" />
                                <Text className="text-background font-bold ml-2">Terapkan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
