import "../global.css";
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';
import { colors } from '../src/constants/theme';
import { SyncProvider } from '../src/components/SyncProvider';
import { useUpdateCheck } from '../src/hooks/useUpdateCheck';
import { UpdateProgressModal } from '../src/components/UpdateProgressModal';

// ── PWA initialization (web only) ────────────────────────────
function usePWAInit() {
    useEffect(() => {
        if (Platform.OS !== 'web') return;

        // Inject manifest link
        if (!document.querySelector('link[rel="manifest"]')) {
            const link = document.createElement('link');
            link.rel = 'manifest';
            link.href = '/manifest.json';
            document.head.appendChild(link);
        }

        // Apple-specific meta tags for standalone mode
        const appleMeta = [
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
            { name: 'apple-mobile-web-app-title', content: 'Recashly' },
        ];

        appleMeta.forEach(({ name, content }) => {
            if (!document.querySelector(`meta[name="${name}"]`)) {
                const meta = document.createElement('meta');
                meta.name = name;
                meta.content = content;
                document.head.appendChild(meta);
            }
        });

        // Ensure viewport-fit=cover for safe-area-inset support on iPhone
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport && !viewport.getAttribute('content')?.includes('viewport-fit')) {
            viewport.setAttribute('content', viewport.getAttribute('content') + ', viewport-fit=cover');
        }

        // Apple touch icon
        if (!document.querySelector('link[rel="apple-touch-icon"]')) {
            const icon = document.createElement('link');
            icon.rel = 'apple-touch-icon';
            icon.href = '/icon-192.png';
            document.head.appendChild(icon);
        }

        // Theme color
        if (!document.querySelector('meta[name="theme-color"]')) {
            const theme = document.createElement('meta');
            theme.name = 'theme-color';
            theme.content = '#1a3a52';
            document.head.appendChild(theme);
        }

        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((reg) => console.log('[PWA] Service worker registered:', reg.scope))
                .catch((err) => console.warn('[PWA] SW registration failed:', err));
        }
    }, []);
}

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

        const inAuthGroup = segments.length > 0 && segments[0] === '(app)';

        if (isAuthenticated && !inAuthGroup) {
            // User is signed in but on login page (or root), redirect to app
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

    const { showDownloadModal, downloadProgress } = useUpdateCheck(true);

    // Initialize PWA meta tags and service worker (web only)
    usePWAInit();

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
            <UpdateProgressModal visible={showDownloadModal} progress={downloadProgress} />
        </SyncProvider >
    );
}
