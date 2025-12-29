import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function AppLayout() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (!isAuthenticated) {
        return <Redirect href="/" />;
    }

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#161B22', // surface
                },
                headerTintColor: '#FFFFFF', // text
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                contentStyle: {
                    backgroundColor: '#0D1117', // background
                },
            }}
        >
            <Stack.Screen
                name="(tabs)"
                options={{
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="new-entry"
                options={{
                    headerShown: false,
                    presentation: 'modal',
                }}
            />
            <Stack.Screen
                name="entry/[id]"
                options={{
                    presentation: 'card',
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="report/[id]"
                options={{
                    presentation: 'card',
                    headerShown: false
                }}
            />
        </Stack>
    );
}
