import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Edit3, ChevronLeft, ChevronRight, Zap } from 'lucide-react-native';
import { ScreenWrapper, Button } from '../../../src/components';
import { colors } from '../../../src/constants/theme';
import { useNewEntryStore } from '../../../store/newEntryStore';

export default function DatePickerScreen() {
    const router = useRouter();
    const date = useNewEntryStore((state) => state.date);
    const setDate = useNewEntryStore((state) => state.setDate);
    const compressionStatus = useNewEntryStore((state) => state.compressionStatus);

    // Calendar Generation Logic
    const generateCalendar = (selectedDate: Date) => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days: (Date | null)[] = [];
        const padding = firstDay.getDay(); // 0 is Sunday

        for (let i = 0; i < padding; i++) {
            days.push(null);
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(date);
        newDate.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1));
        setDate(newDate);
    };

    const calendarDays = generateCalendar(date);
    const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

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
                    <View className="w-2 h-2 rounded-full bg-surface-elevated" />
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

            <Text className="text-white text-3xl font-bold mb-2">Kapan transaksi</Text>
            <Text className="text-white text-3xl font-bold mb-8">terjadi?</Text>

            {/* Selected Date Card */}
            <View className="bg-surface p-4 rounded-2xl border border-white/5 mb-6 flex-row justify-between items-center">
                <Text className="text-white text-xl font-bold">
                    {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
                    <Edit3 size={18} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Calendar */}
            <View className="bg-surface p-4 rounded-3xl border border-white/5">
                <View className="flex-row justify-between items-center mb-6 px-2">
                    <TouchableOpacity onPress={() => navigateMonth('prev')} className="p-2">
                        <ChevronLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text className="text-white font-bold text-lg">
                        {date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    </Text>
                    <TouchableOpacity onPress={() => navigateMonth('next')} className="p-2">
                        <ChevronRight size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Week Days */}
                <View className="flex-row justify-between mb-4">
                    {weekDays.map(day => (
                        <Text key={day} className="text-text-secondary text-center w-10 font-medium text-xs">{day}</Text>
                    ))}
                </View>

                {/* Days Grid */}
                <View className="flex-row flex-wrap">
                    {calendarDays.map((day, index) => {
                        if (!day) return <View key={`pad-${index}`} className="w-[14.28%] h-10" />;

                        const isSelected = day.getDate() === date.getDate() &&
                            day.getMonth() === date.getMonth();
                        const isToday = day.toDateString() === new Date().toDateString();

                        return (
                            <TouchableOpacity
                                key={day.toISOString()}
                                className="w-[14.28%] h-10 items-center justify-center mb-1"
                                onPress={() => setDate(day)}
                            >
                                <View className={`w-9 h-9 rounded-full items-center justify-center ${isSelected ? 'bg-primary' : isToday ? 'border border-primary' : ''
                                    }`}>
                                    <Text className={`text-sm ${isSelected ? 'text-background font-bold' :
                                        isToday ? 'text-primary font-medium' : 'text-white'
                                        }`}>
                                        {day.getDate()}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View className="flex-1" />

            <Button
                label="Lanjutkan"
                onPress={() => router.push('/(app)/new-entry/category')}
                className="mb-4"
            />
        </ScreenWrapper>
    );
}
