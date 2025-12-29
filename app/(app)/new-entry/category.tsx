import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Zap, Utensils, Coffee, Fuel, Car, Smartphone, MoreHorizontal, X, FileText } from 'lucide-react-native';
import { ScreenWrapper, Button, Input } from '../../../src/components';
import { colors } from '../../../src/constants/theme';
import { useNewEntryStore } from '../../../store/newEntryStore';
import { useCategoryStore } from '../../../store/categoryStore';
import * as Haptics from 'expo-haptics';

// Map category icons from API
const categoryIcons: Record<string, any> = {
    'utensils': Utensils,
    'coffee': Coffee,
    'fuel': Fuel,
    'car': Car,
    'smartphone': Smartphone,
    'hotel': FileText,
};

const defaultColors = [
    colors.categoryFood,
    colors.categoryCoffee,
    colors.categoryFuel,
    colors.categoryTransport,
    colors.categoryTopup,
    colors.textMuted,
];

export default function CategoryScreen() {
    const router = useRouter();
    const setCategory = useNewEntryStore((state) => state.setCategory);
    const setCategoryId = useNewEntryStore((state) => state.setCategoryId);
    const selectedCategory = useNewEntryStore((state) => state.category);
    const compressionStatus = useNewEntryStore((state) => state.compressionStatus);

    const { categories, isLoading, fetchCategories } = useCategoryStore();

    const [isOtherModalVisible, setIsOtherModalVisible] = useState(false);
    const [customCategory, setCustomCategory] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSelect = (categoryId: number, categoryName: string) => {
        Haptics.selectionAsync();
        setCategoryId(categoryId);
        setCategory(categoryName);
        router.push('/(app)/new-entry/client');
    };

    const handleOtherSelect = () => {
        Haptics.selectionAsync();
        setIsOtherModalVisible(true);
    };

    const handleCustomSubmit = () => {
        if (customCategory.trim()) {
            Haptics.selectionAsync();
            setCategory(customCategory);
            setIsOtherModalVisible(false);
            router.push('/(app)/new-entry/client');
        }
    };

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
                    <View className="w-2 h-2 rounded-full bg-surface-elevated" />
                    <View className="w-2 h-2 rounded-full bg-surface-elevated" />
                </View>
            </View>

            {/* Compression Indicator - Only show if compressing */}
            {compressionStatus && (
                <View className="bg-surface px-4 py-2.5 rounded-full flex-row items-center mb-6 self-start">
                    <Zap size={16} color={colors.warning} />
                    <Text className="text-white text-xs font-medium ml-2">{compressionStatus}</Text>
                </View>
            )}

            <Text className="text-white text-3xl font-bold mb-2">Jenis pengeluaran</Text>
            <Text className="text-white text-3xl font-bold mb-8">apa?</Text>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text className="text-text-secondary mt-4">Memuat kategori...</Text>
                </View>
            ) : (
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <View className="flex-row flex-wrap justify-between">
                        {categories.map((cat, index) => {
                            const IconComponent = categoryIcons[cat.icon] || FileText;
                            const color = defaultColors[index % defaultColors.length];
                            const isSelected = selectedCategory === cat.name;

                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => handleSelect(cat.id, cat.name)}
                                    className={`w-[48%] bg-surface p-5 rounded-3xl border mb-4 ${isSelected ? 'border-primary bg-primary/10' : 'border-white/5'
                                        }`}
                                    activeOpacity={0.7}
                                >
                                    <View
                                        className={`w-12 h-12 rounded-full items-center justify-center mb-4 ${isSelected ? 'bg-primary' : ''
                                            }`}
                                        style={!isSelected ? { backgroundColor: `${color}20` } : undefined}
                                    >
                                        <IconComponent size={24} color={isSelected ? colors.background : color} />
                                    </View>
                                    <Text className={`font-bold text-lg mb-1 ${isSelected ? 'text-primary' : 'text-white'
                                        }`}>{cat.name}</Text>
                                    <Text className="text-text-secondary text-xs">{cat.description || ''}</Text>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Other/Custom Category */}
                        <TouchableOpacity
                            onPress={handleOtherSelect}
                            className="w-[48%] bg-surface p-5 rounded-3xl border border-white/5 mb-4"
                            activeOpacity={0.7}
                        >
                            <View
                                className="w-12 h-12 rounded-full items-center justify-center mb-4"
                                style={{ backgroundColor: `${colors.textMuted}20` }}
                            >
                                <MoreHorizontal size={24} color={colors.textMuted} />
                            </View>
                            <Text className="font-bold text-lg mb-1 text-white">Lainnya</Text>
                            <Text className="text-text-secondary text-xs">Kategori lain</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}

            {/* Custom Category Modal */}
            <Modal
                visible={isOtherModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsOtherModalVisible(false)}
            >
                <View className="flex-1 bg-black/80 justify-center px-5">
                    <View className="bg-surface p-6 rounded-3xl border border-white/10">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-white text-xl font-bold">Kategori Lainnya</Text>
                            <TouchableOpacity
                                onPress={() => setIsOtherModalVisible(false)}
                                className="w-8 h-8 bg-surface-elevated rounded-full items-center justify-center"
                            >
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Input
                            placeholder="Masukkan nama kategori"
                            value={customCategory}
                            onChangeText={setCustomCategory}
                            autoFocus
                            containerClassName="mb-6"
                        />

                        <Button label="Simpan" onPress={handleCustomSubmit} />
                    </View>
                </View>
            </Modal>
        </ScreenWrapper>
    );
}
