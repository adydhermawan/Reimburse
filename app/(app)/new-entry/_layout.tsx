import { Stack } from 'expo-router';

export default function NewEntryLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#0D1117' },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="date" />
            <Stack.Screen name="category" />
            <Stack.Screen name="client" />
            <Stack.Screen name="amount" />
            <Stack.Screen name="review" />
        </Stack>
    );
}
