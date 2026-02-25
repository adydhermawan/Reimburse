import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Sparkles, Cpu, Zap, ZapOff, Fingerprint, Activity } from 'lucide-react-native';
import { colors } from '../../src/constants/theme';
import { AI_MODELS, AIModelOption } from '../../src/constants/aiModels';
import { useAuthStore } from '../../store/authStore';
import * as Haptics from '../../src/services/platformHaptics';

export default function AISettingsScreen() {
    const router = useRouter();
    const { user, updateProfile, isLoading } = useAuthStore();

    // Default to gemma-3-27b-it if user hasn't set it yet
    const currentModelId = user?.preferred_ai_model || 'gemma-3-27b-it';
    const [selectedModel, setSelectedModel] = useState<string>(currentModelId);

    const handleSelectModel = (modelId: string) => {
        setSelectedModel(modelId);
        Haptics.selectionAsync();
    };

    const handleSave = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (selectedModel === currentModelId) {
            router.back();
            return;
        }

        const success = await updateProfile({ preferred_ai_model: selectedModel });

        if (success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (Platform.OS === 'web') {
                window.alert('Preferensi AI berhasil disimpan.');
            } else {
                Alert.alert('Berhasil', 'Preferensi AI berhasil disimpan.');
            }
            router.back();
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const errorMsg = useAuthStore.getState().error || 'Gagal menyimpan preferensi';
            if (Platform.OS === 'web') {
                window.alert(errorMsg);
            } else {
                Alert.alert('Gagal', errorMsg);
            }
        }
    };

    const getIconForModel = (id: string, color: string, size: number) => {
        if (id.includes('flash-lite')) return <Zap color={color} size={size} />;
        if (id.includes('flash')) return <Zap color={color} size={size} />;
        if (id.includes('gemma')) return <Cpu color={color} size={size} />;
        return <Sparkles color={color} size={size} />;
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <View className="px-4 py-4 flex-row items-center justify-between border-b border-surface">
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                        className="mr-3 p-2 -ml-2 rounded-full"
                    >
                        <ArrowLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">Model AI</Text>
                </View>
                {isLoading ? (
                    <ActivityIndicator color={colors.primary} />
                ) : (
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={selectedModel === currentModelId}
                        activeOpacity={0.7}
                        className={`px-4 py-2 rounded-lg ${selectedModel !== currentModelId ? 'bg-primary' : 'bg-surface'}`}
                    >
                        <Text className={`font-semibold ${selectedModel !== currentModelId ? 'text-black' : 'text-text-muted'}`}>Simpan</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-5 py-6">
                    <Text className="text-text-muted text-base mb-6 leading-relaxed">
                        Pilih model AI yang akan digunakan untuk membaca struktur struk secara otomatis. Setiap model memiliki kuota Request Per Day (RPD) yang berbeda.
                    </Text>

                    <View className="space-y-4">
                        {AI_MODELS.map((model: AIModelOption) => {
                            const isSelected = selectedModel === model.id;

                            return (
                                <TouchableOpacity
                                    key={model.id}
                                    onPress={() => handleSelectModel(model.id)}
                                    activeOpacity={0.7}
                                    className={`p-4 rounded-xl border ${isSelected ? 'border-primary bg-surface/50' : 'border-surface bg-transparent'} mb-3`}
                                >
                                    <View className="flex-row items-start justify-between">
                                        <View className="flex-row flex-1">
                                            <View className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${isSelected ? 'bg-primary/20' : 'bg-surface'}`}>
                                                {getIconForModel(model.id, isSelected ? colors.primary : '#8b949e', 20)}
                                            </View>

                                            <View className="flex-1 mr-2">
                                                <View className="flex-row items-center mb-1">
                                                    <Text className="text-white font-semibold text-base mr-2">{model.name}</Text>
                                                    <View className="bg-surface px-2 py-0.5 rounded-full flex-row items-center">
                                                        <Activity color="#8b949e" size={12} className="mr-1" />
                                                        <Text className="text-text-muted text-xs font-medium">{model.limit}</Text>
                                                    </View>
                                                </View>
                                                <Text className="text-text-muted text-sm leading-snug">{model.description}</Text>
                                            </View>
                                        </View>

                                        <View className={`w-6 h-6 rounded-full border flex items-center justify-center mt-2 ${isSelected ? 'border-primary bg-primary' : 'border-text-muted'}`}>
                                            {isSelected && <Check color="#000" size={14} strokeWidth={3} />}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
