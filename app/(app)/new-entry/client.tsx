import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Plus, Building2, CheckCircle2 } from 'lucide-react-native';
import { ScreenWrapper, Input } from '../../../src/components';
import { colors } from '../../../src/constants/theme';
import { useNewEntryStore } from '../../../store/newEntryStore';
import { useClientStore } from '../../../store/clientStore';
import * as Haptics from 'expo-haptics';

export default function ClientScreen() {
    const router = useRouter();
    const setClient = useNewEntryStore((state) => state.setClient);
    const compressionStatus = useNewEntryStore((state) => state.compressionStatus);

    const { clients, isLoading, isCreating, fetchClients, createClient } = useClientStore();

    const [search, setSearch] = useState('');
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    // Fetch clients on mount
    useEffect(() => {
        fetchClients();
    }, []);

    // Debounced search
    const handleSearchChange = useCallback((text: string) => {
        setSearch(text);

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        const timer = setTimeout(() => {
            fetchClients(text.trim() || undefined);
        }, 300);

        setDebounceTimer(timer);
    }, [debounceTimer]);

    const handleSelect = (name: string) => {
        Haptics.selectionAsync();
        setClient(name);
        router.push('/(app)/new-entry/amount');
    };

    const handleCreateAndSelect = async () => {
        if (!search.trim()) return;

        Haptics.selectionAsync();
        const newClient = await createClient(search.trim());

        if (newClient) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setClient(newClient.name);
            router.push('/(app)/new-entry/amount');
        }
    };

    // Check if exact match exists
    const exactMatchExists = clients.some(
        c => c.name.toLowerCase() === search.toLowerCase()
    );

    return (
        <ScreenWrapper className="px-5 py-4">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-2">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                {/* Progress Dots */}
                <View className="flex-row gap-1.5">
                    <View className="w-2 h-2 rounded-full bg-primary" />
                    <View className="w-2 h-2 rounded-full bg-primary" />
                    <View className="w-2 h-2 rounded-full bg-primary" />
                    <View className="w-2 h-2 rounded-full bg-primary" />
                    <View className="w-2 h-2 rounded-full bg-surface-elevated" />
                </View>
            </View>

            {/* Compression Status Indicator */}
            {compressionStatus ? (
                <View className="bg-surface px-4 py-2.5 rounded-full flex-row items-center mb-6 self-start">
                    <ActivityIndicator size="small" color={colors.warning} />
                    <Text className="text-white text-xs font-medium ml-2">{compressionStatus}</Text>
                </View>
            ) : (
                <View className="bg-green-500/20 px-4 py-2.5 rounded-full flex-row items-center mb-6 self-start">
                    <CheckCircle2 size={16} color={colors.success} />
                    <Text className="text-green-400 text-xs font-bold ml-2">Gambar siap!</Text>
                </View>
            )}

            <Text className="text-white text-3xl font-bold mb-8">Untuk client mana?</Text>

            <Input
                placeholder="Cari atau tambah client..."
                value={search}
                onChangeText={handleSearchChange}
                leftIcon={<Search size={20} color={colors.textMuted} />}
                containerClassName="mb-6"
            />

            <Text className="text-text-secondary text-xs font-medium mb-4 uppercase tracking-wider">
                {search ? 'HASIL PENCARIAN' : 'SARAN'}
            </Text>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {isLoading ? (
                    <View className="items-center py-8">
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text className="text-text-secondary mt-2 text-sm">Mencari...</Text>
                    </View>
                ) : (
                    <>
                        {clients.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => handleSelect(item.name)}
                                className="bg-surface p-4 rounded-2xl border border-white/5 mb-3 flex-row items-center active:bg-surface-elevated"
                                activeOpacity={0.7}
                            >
                                <View className="w-12 h-12 bg-surface-elevated rounded-full items-center justify-center mr-4">
                                    <Building2 size={22} color={colors.textMuted} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white font-bold text-base">{item.name}</Text>
                                    {item.is_auto_registered && (
                                        <Text className="text-text-secondary text-xs">Auto-registered</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}

                        {/* Add New Client Option */}
                        {search.length > 0 && !exactMatchExists && (
                            <TouchableOpacity
                                onPress={handleCreateAndSelect}
                                disabled={isCreating}
                                className={`bg-primary/10 p-4 rounded-2xl border border-primary/30 mb-3 flex-row items-center ${isCreating ? 'opacity-50' : ''}`}
                                activeOpacity={0.7}
                            >
                                <View className="w-12 h-12 bg-primary/20 rounded-full items-center justify-center mr-4">
                                    {isCreating ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <Plus size={22} color={colors.primary} />
                                    )}
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white font-bold text-base">
                                        {isCreating ? 'Menambahkan...' : `Tambah "${search}"`}
                                    </Text>
                                    <Text className="text-text-secondary text-xs">sebagai client baru</Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        {clients.length === 0 && !search && (
                            <View className="items-center py-8">
                                <Building2 size={48} color={colors.textMuted} />
                                <Text className="text-text-secondary mt-4 text-center">
                                    Belum ada client.{'\n'}Ketik untuk menambah client baru.
                                </Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
}
