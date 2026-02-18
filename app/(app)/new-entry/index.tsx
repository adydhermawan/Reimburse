import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Camera, ScanLine, ArrowLeft, X } from 'lucide-react-native';
import { ScreenWrapper } from '../../../src/components';
import { colors } from '../../../src/constants/theme';
import * as Haptics from 'expo-haptics';

export default function MethodSelectionScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const handleManual = () => {
        Haptics.selectionAsync();
        // Pass validation params if they exist
        router.push({
            pathname: '/(app)/new-entry/manual-photo',
            params: params as any
        });
    };

    const handleScan = () => {
        Haptics.selectionAsync();
        router.push('/(app)/new-entry/scan');
    };

    return (
        <ScreenWrapper className="px-5 py-4">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-8">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <X size={24} color={colors.text} />
                </TouchableOpacity>
                <Text className="text-white font-bold text-lg">Buat Reimbursement</Text>
                <View className="w-8" />
            </View>

            <View className="flex-1 justify-center">
                <Text className="text-white text-3xl font-bold mb-2 text-center">
                    Pilih Metode
                </Text>
                <Text className="text-text-secondary text-center mb-10 px-8">
                    Bagaimana Anda ingin memasukkan data struk?
                </Text>

                <View className="gap-4">
                    {/* Method 1: AI Scan */}
                    <TouchableOpacity
                        onPress={handleScan}
                        className="bg-primary p-6 rounded-3xl border border-primary/50 relative overflow-hidden active:bg-primary/90"
                        activeOpacity={0.8}
                    >
                        <View className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10" />

                        <View className="flex-row items-center mb-4">
                            <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                                <ScanLine size={24} color={colors.background} />
                            </View>
                            <View className="ml-3 bg-white/20 px-3 py-1 rounded-full">
                                <Text className="text-white text-xs font-bold">REKOMENDASI AI ✨</Text>
                            </View>
                        </View>

                        <Text className="text-background font-bold text-xl mb-1">Scan Struk Otomatis</Text>
                        <Text className="text-background/80 leading-5">
                            AI akan membaca foto struk dan mengisi data otomatis (Tanggal, Total, Merchant).
                        </Text>
                    </TouchableOpacity>

                    {/* Method 2: Manual */}
                    <TouchableOpacity
                        onPress={handleManual}
                        className="bg-surface p-6 rounded-3xl border border-white/10 active:bg-surface-elevated"
                        activeOpacity={0.8}
                    >
                        <View className="flex-row items-center mb-4">
                            <View className="w-12 h-12 bg-surface-elevated rounded-full items-center justify-center border border-white/5">
                                <Camera size={24} color={colors.text} />
                            </View>
                        </View>

                        <Text className="text-white font-bold text-xl mb-1">Input Manual</Text>
                        <Text className="text-text-secondary leading-5">
                            Ambil foto dan isi data satu per satu secara manual seperti biasa.
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View className="h-10" />
        </ScreenWrapper>
    );
}
