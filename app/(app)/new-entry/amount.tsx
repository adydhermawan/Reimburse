import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Delete } from 'lucide-react-native';
import { ScreenWrapper, Button, Input } from '../../../src/components';
import { colors } from '../../../src/constants/theme';
import { useNewEntryStore } from '../../../store/newEntryStore';

export default function AmountScreen() {
    const router = useRouter();
    const setAmount = useNewEntryStore((state) => state.setAmount);
    const setNote = useNewEntryStore((state) => state.setNote);
    const client = useNewEntryStore((state) => state.client);

    const [displayAmount, setDisplayAmount] = useState('');
    const [noteText, setNoteText] = useState('');

    const handleNumberPress = (num: string) => {
        if (displayAmount.length < 12) {
            setDisplayAmount(prev => prev + num);
        }
    };

    const handleDelete = () => {
        setDisplayAmount(prev => prev.slice(0, -1));
    };

    const handleQuickAdd = (value: number) => {
        setDisplayAmount(value.toString());
    };

    const formatDisplay = (val: string) => {
        if (!val) return '0';
        return new Intl.NumberFormat('id-ID').format(parseInt(val));
    };

    const handleSubmit = () => {
        if (displayAmount && parseInt(displayAmount) > 0) {
            setAmount(displayAmount);
            setNote(noteText);
            router.push('/(app)/new-entry/review');
        }
    };

    const numpad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0'];

    return (
        <ScreenWrapper className="px-5 py-4">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                {/* Progress Dots */}
                <View className="flex-row gap-1.5">
                    <View className="w-2 h-2 rounded-full bg-primary" />
                    <View className="w-2 h-2 rounded-full bg-primary" />
                    <View className="w-2 h-2 rounded-full bg-primary" />
                    <View className="w-2 h-2 rounded-full bg-primary" />
                    <View className="w-2 h-2 rounded-full bg-primary" />
                </View>
            </View>

            {/* Amount Display */}
            <View className="items-center mt-4 mb-4">
                <Text className="text-text-secondary text-xs mb-1 uppercase tracking-wider font-medium">JUMLAH PENGELUARAN</Text>
                <Text className="text-text-secondary text-sm mb-6">Untuk {client || 'client'}</Text>
                <View className="flex-row items-baseline">
                    <Text className="text-text-secondary text-4xl font-bold mr-2">Rp.</Text>
                    <Text className="text-white text-6xl font-bold tracking-tight">
                        {formatDisplay(displayAmount)}
                    </Text>
                </View>
            </View>

            {/* Quick Amount Buttons */}
            <View className="flex-row gap-2 mb-6 justify-center">
                {[25000, 50000, 100000, 150000].map(val => (
                    <TouchableOpacity
                        key={val}
                        onPress={() => handleQuickAdd(val)}
                        className="bg-surface border border-white/10 px-4 py-2 rounded-xl"
                        activeOpacity={0.7}
                    >
                        <Text className="text-primary font-bold text-sm">{val / 1000}K</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Note Input */}
            <Input
                placeholder="Tambahkan catatan (opsional)..."
                value={noteText}
                onChangeText={setNoteText}
                containerClassName="mb-4"
            />

            {/* Numpad */}
            <View className="flex-1 justify-end pb-4">
                <View className="flex-row flex-wrap justify-between px-2 mb-6">
                    {numpad.map((num) => (
                        <TouchableOpacity
                            key={num}
                            onPress={() => handleNumberPress(num)}
                            className="w-[30%] aspect-[1.5] items-center justify-center"
                            activeOpacity={0.6}
                        >
                            <Text className="text-white text-3xl font-medium">{num}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        onPress={handleDelete}
                        className="w-[30%] aspect-[1.5] items-center justify-center"
                        activeOpacity={0.6}
                    >
                        <Delete size={32} color={colors.danger} />
                    </TouchableOpacity>
                </View>

                <Button
                    label="Review & Submit"
                    onPress={handleSubmit}
                    disabled={!displayAmount || parseInt(displayAmount) === 0}
                />
            </View>
        </ScreenWrapper>
    );
}
