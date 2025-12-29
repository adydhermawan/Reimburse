import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Download, Eye, Search, Calendar, Share2 } from 'lucide-react-native';
import { useReportStore } from '../../../store/reportStore';
import { colors } from '../../../src/constants/theme';
import * as Haptics from 'expo-haptics';

export default function ReportsScreen() {
    const router = useRouter();
    const { reports, isLoading, isDownloading, error, fetchReports, shareReport } = useReportStore();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const onRefresh = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setRefreshing(true);
        await fetchReports();
        setRefreshing(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const handleDownload = async (reportId: number, periodStart: string) => {
        Haptics.selectionAsync();

        const periodDate = new Date(periodStart);
        const filename = `Reimburse_${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}.pdf`;

        try {
            await shareReport(reportId, filename);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', err.message || 'Gagal download laporan');
        }
    };

    const formatAmount = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('id-ID').format(num);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatPeriod = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);

        const startMonth = startDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        return startMonth;
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="px-5 pt-4 pb-4 flex-row justify-between items-center">
                <View>
                    <Text className="text-white text-2xl font-bold">Laporan PDF</Text>
                    <Text className="text-text-secondary text-sm mt-1">Daftar laporan yang sudah di-generate</Text>
                </View>
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        className="w-10 h-10 bg-surface rounded-full items-center justify-center border border-white/5 active:bg-surface-elevated"
                        onPress={() => Haptics.selectionAsync()}
                    >
                        <Search size={18} color="#8B949E" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="w-10 h-10 bg-surface rounded-full items-center justify-center border border-white/5 active:bg-surface-elevated"
                        onPress={() => Haptics.selectionAsync()}
                    >
                        <Calendar size={18} color="#8B949E" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Reports List */}
            <ScrollView
                className="flex-1 px-5"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {isLoading && reports.length === 0 ? (
                    <View className="items-center justify-center py-20">
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text className="text-text-secondary mt-4">Memuat laporan...</Text>
                    </View>
                ) : reports.length === 0 ? (
                    <View className="items-center justify-center py-20">
                        <FileText size={48} color="#6E7681" />
                        <Text className="text-text-secondary mt-4 text-center">
                            Belum ada laporan PDF
                        </Text>
                        <Text className="text-text-secondary text-sm text-center mt-2">
                            Laporan akan otomatis di-generate oleh admin setiap bulan
                        </Text>
                    </View>
                ) : (
                    reports.map((report) => (
                        <View
                            key={report.id}
                            className="bg-surface p-4 rounded-2xl border border-white/5 mb-3"
                        >
                            <View className="flex-row justify-between items-start mb-3">
                                <View className="flex-row items-center">
                                    <View className="w-12 h-12 bg-primary/20 rounded-xl items-center justify-center mr-3">
                                        <FileText size={24} color="#22D3EE" />
                                    </View>
                                    <View>
                                        <Text className="text-white font-bold text-lg">
                                            {formatPeriod(report.period_start, report.period_end)}
                                        </Text>
                                        <Text className="text-text-secondary text-xs">
                                            {formatDate(report.period_start)} - {formatDate(report.period_end)}
                                        </Text>
                                    </View>
                                </View>
                                <View className={`px-2 py-1 rounded-lg ${report.status === 'paid' ? 'bg-green-500/20' :
                                    report.status === 'generated' ? 'bg-blue-500/20' :
                                        report.status === 'submitted' ? 'bg-yellow-500/20' :
                                            'bg-gray-500/20'
                                    }`}>
                                    <Text className={`text-xs font-bold ${report.status === 'paid' ? 'text-green-400' :
                                        report.status === 'generated' ? 'text-blue-400' :
                                            report.status === 'submitted' ? 'text-yellow-400' :
                                                'text-gray-400'
                                        }`}>
                                        {report.status === 'paid' ? 'LUNAS' :
                                            report.status === 'generated' ? 'READY' :
                                                report.status === 'submitted' ? 'DIAJUKAN' :
                                                    'DRAFT'}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row justify-between items-center mb-3 px-1">
                                <View>
                                    <Text className="text-text-secondary text-xs">Entries</Text>
                                    <Text className="text-white font-bold">{report.total_entries}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-text-secondary text-xs">Total</Text>
                                    <Text className="text-white font-bold">Rp {formatAmount(report.total_amount)}</Text>
                                </View>
                            </View>

                            <View className="flex-row gap-2 mt-1">
                                <TouchableOpacity
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        router.push(`/(app)/report/${report.id}`);
                                    }}
                                    className="flex-1 bg-surface-elevated py-3 rounded-xl flex-row items-center justify-center border border-white/10 active:bg-white/10"
                                >
                                    <Eye size={16} color="#8B949E" />
                                    <Text className="text-text-secondary font-medium ml-2">Lihat</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleDownload(report.id, report.period_start)}
                                    disabled={isDownloading || !['generated', 'submitted', 'paid'].includes(report.status)}
                                    className={`flex-1 bg-primary py-3 rounded-xl flex-row items-center justify-center ${(isDownloading || !['generated', 'submitted', 'paid'].includes(report.status)) ? 'opacity-50' : ''}`}
                                >
                                    {isDownloading ? (
                                        <ActivityIndicator size="small" color="#0D1117" />
                                    ) : (
                                        <>
                                            <Share2 size={16} color="#0D1117" />
                                            <Text className="text-background font-medium ml-2">Share</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
                <View className="h-24" />
            </ScrollView>
        </SafeAreaView>
    );
}
