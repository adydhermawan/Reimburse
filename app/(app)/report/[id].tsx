import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Download, Share2, FileText, CheckCircle, Clock, CreditCard } from 'lucide-react-native';
import { useReportStore } from '../../../store/reportStore';
import { colors } from '../../../src/constants/theme';
import * as Haptics from 'expo-haptics';

export default function ReportDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const {
        selectedReport: report,
        isLoading,
        isDownloading,
        error,
        fetchReportDetail,
        shareReport,
        clearSelectedReport,
    } = useReportStore();

    useEffect(() => {
        if (id) {
            fetchReportDetail(parseInt(id, 10));
        }

        return () => {
            clearSelectedReport();
        };
    }, [id]);

    const formatAmount = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('id-ID').format(num);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const handleDownload = async () => {
        if (!report) return;

        Haptics.selectionAsync();

        const periodDate = new Date(report.period_start);
        const filename = `Reimburse_${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}.pdf`;

        try {
            await shareReport(report.id, filename);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', err.message || 'Gagal download laporan');
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'paid':
                return { label: 'SUDAH DIBAYAR', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', iconColor: '#10B981' };
            case 'submitted':
                return { label: 'DIAJUKAN', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/20', iconColor: '#FBBF24' };
            case 'generated':
                return { label: 'SIAP DOWNLOAD', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/20', iconColor: '#60A5FA' };
            default:
                return { label: 'DRAFT', icon: FileText, color: 'text-gray-400', bg: 'bg-gray-500/20', iconColor: '#9CA3AF' };
        }
    };

    if (isLoading) {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        title: 'Detail Laporan',
                        headerStyle: { backgroundColor: '#161B22' },
                        headerTintColor: '#FFFFFF',
                    }}
                />
                <View className="flex-1 bg-background justify-center items-center">
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text className="text-text-secondary mt-4">Memuat detail laporan...</Text>
                </View>
            </>
        );
    }

    if (error || !report) {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        title: 'Detail Laporan',
                        headerStyle: { backgroundColor: '#161B22' },
                        headerTintColor: '#FFFFFF',
                    }}
                />
                <SafeAreaView className="flex-1 bg-background justify-center items-center">
                    <FileText size={48} color="#6E7681" />
                    <Text className="text-text-secondary mt-4">{error || 'Laporan tidak ditemukan'}</Text>
                    <TouchableOpacity onPress={() => router.back()} className="mt-4">
                        <Text className="text-primary">Kembali</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </>
        );
    }

    const statusInfo = getStatusInfo(report.status);
    const StatusIcon = statusInfo.icon;

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: `Laporan ${formatDate(report.period_start).split(' ').slice(1).join(' ')}`,
                    headerStyle: { backgroundColor: '#161B22' },
                    headerTintColor: '#FFFFFF',
                }}
            />
            <View className="flex-1 bg-background">
                <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
                    {/* PDF Preview Mockup */}
                    <View className="bg-white rounded-2xl p-6 mb-6">
                        <View className="items-center mb-4">
                            <Text className="text-black text-xl font-bold">LAPORAN REIMBURSEMENT</Text>
                            <Text className="text-gray-500 text-sm">
                                {formatDate(report.period_start)} - {formatDate(report.period_end)}
                            </Text>
                        </View>

                        <View className="border-t border-gray-200 pt-4">
                            <View className="flex-row justify-between py-2 border-b border-gray-100">
                                <Text className="text-gray-500 text-sm flex-1">No</Text>
                                <Text className="text-gray-500 text-sm flex-[2]">Deskripsi</Text>
                                <Text className="text-gray-500 text-sm flex-1 text-right">Jumlah</Text>
                            </View>

                            {report.reimbursements && report.reimbursements.length > 0 ? (
                                report.reimbursements.map((item, index) => (
                                    <View key={item.id} className="flex-row justify-between py-2 border-b border-gray-50">
                                        <Text className="text-black text-sm flex-1">{index + 1}</Text>
                                        <Text className="text-black text-sm flex-[2]">
                                            {item.category?.name || 'N/A'} - {item.client?.name || 'N/A'}
                                        </Text>
                                        <Text className="text-black text-sm flex-1 text-right">
                                            Rp {formatAmount(item.amount)}
                                        </Text>
                                    </View>
                                ))
                            ) : (
                                <View className="py-4">
                                    <Text className="text-gray-400 text-center text-sm">
                                        ... {report.total_entries} entries ...
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View className="border-t-2 border-black mt-4 pt-4 flex-row justify-between">
                            <Text className="text-black font-bold">TOTAL</Text>
                            <Text className="text-black font-bold">Rp {formatAmount(report.total_amount)}</Text>
                        </View>
                    </View>

                    {/* Status Info */}
                    <View className={`p-4 rounded-2xl mb-4 ${statusInfo.bg}`}>
                        <View className="flex-row items-center justify-center">
                            <StatusIcon size={18} color={statusInfo.iconColor} />
                            <Text className={`ml-2 font-bold ${statusInfo.color}`}>
                                {statusInfo.label}
                            </Text>
                        </View>
                        {report.payment_date && (
                            <Text className="text-green-400/70 text-xs text-center mt-1">
                                Dibayarkan pada {formatDate(report.payment_date)}
                            </Text>
                        )}
                    </View>

                    {/* Meta Info */}
                    <View className="bg-surface p-4 rounded-2xl border border-white/5 mb-6">
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-text-secondary">Periode</Text>
                            <Text className="text-white">
                                {formatDate(report.period_start)} - {formatDate(report.period_end)}
                            </Text>
                        </View>
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-text-secondary">Entries</Text>
                            <Text className="text-white">{report.total_entries} items</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-text-secondary">Status PDF</Text>
                            <Text className="text-white">
                                {report.pdf_path ? 'Tersedia' : 'Belum di-generate'}
                            </Text>
                        </View>
                    </View>

                    <View className="h-32" />
                </ScrollView>

                {/* Bottom Actions */}
                <View className="absolute bottom-0 left-0 right-0 bg-surface border-t border-white/5 p-4 flex-row gap-3">
                    <TouchableOpacity
                        onPress={handleDownload}
                        disabled={isDownloading || !report.pdf_path}
                        className={`flex-1 bg-primary p-4 rounded-xl flex-row items-center justify-center ${(isDownloading || !report.pdf_path) ? 'opacity-50' : ''}`}
                    >
                        {isDownloading ? (
                            <ActivityIndicator size="small" color="#0D1117" />
                        ) : (
                            <>
                                <Share2 size={18} color="#0D1117" />
                                <Text className="text-background font-bold ml-2">
                                    {report.pdf_path ? 'Download PDF' : 'PDF Belum Tersedia'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
}
