import "../global.css";
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';
import { colors } from '../src/constants/theme';
import { SyncProvider } from '../src/components/SyncProvider';
import { useUpdateCheck } from '../src/hooks/useUpdateCheck';

function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const segments = useSegments();
    const { isAuthenticated, isInitialized, initAuth } = useAuthStore();

    useEffect(() => {
        // Initialize auth on app load
        initAuth();
    }, []);

    useEffect(() => {
        if (!isInitialized) return;

        const inAuthGroup = segments[0] === '(app)';

        if (isAuthenticated && !inAuthGroup) {
            // User is signed in but on login page, redirect to app
            router.replace('/(app)/(tabs)');
        } else if (!isAuthenticated && inAuthGroup) {
            // User is not signed in but trying to access protected route
            router.replace('/');
        }
    }, [isAuthenticated, isInitialized, segments]);

    if (!isInitialized) {
        // Show loading while checking auth
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return <>{children}</>;
}

export default function RootLayout() {
    // Auto-check for updates when app starts
    // The hook will automatically prompt user if update is available
    useUpdateCheck(true);

    return (
        <SyncProvider>
            <AuthProvider>
                <StatusBar style="light" backgroundColor="#0D1117" />
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
                        headerShown: false,
                    }}
                >
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="(app)" options={{ headerShown: false }} />
                </Stack>
            </AuthProvider>
        </SyncProvider>
    );
}
