import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';
import { ScreenWrapper, Button } from '../../../src/components';
import { colors } from '../../../src/constants/theme';
import { useNewEntryStore } from '../../../store/newEntryStore';

export default function NoteScreen() {
    const router = useRouter();
    const entry = useNewEntryStore();
    const setNote = useNewEntryStore((state) => state.setNote);

    const [noteText, setNoteText] = useState(entry.note || '');

    const handleSave = () => {
        setNote(noteText);
        router.back();
    };

    return (
        <ScreenWrapper className="px-5 py-4">
            <View className="flex-row justify-between items-center mb-6">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text className="text-white font-bold text-lg">Catatan</Text>
                <View className="w-10" />
            </View>

            <View className="bg-surface p-4 rounded-2xl border border-white/5 flex-1 mb-4">
                <TextInput
                    className="text-white text-base leading-6 flex-1"
                    placeholder="Tulis catatan di sini..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    textAlignVertical="top"
                    value={noteText}
                    onChangeText={setNoteText}
                    autoFocus
                />
            </View>

            <Button
                label="Simpan"
                onPress={handleSave}
                icon={<Save size={20} color={colors.background} />}
            />
        </ScreenWrapper>
    );
}
