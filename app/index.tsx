import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
    const router = useRouter();
    const { login, isLoading, error, clearError } = useAuthStore();

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        // Trigger a light haptic on mount
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    // Show error alert when error changes
    useEffect(() => {
        if (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Login Gagal', error, [
                { text: 'OK', onPress: clearError }
            ]);
        }
    }, [error]);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Peringatan', 'Email dan password harus diisi');
            return;
        }

        Haptics.selectionAsync();

        // DEBUG: Show API URL being used
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'UNDEFINED';
        console.log('Attempting login to:', apiUrl);
        // Optional: Alert the user to the URL being used
        // Alert.alert('Debug URL', `Connecting to: ${apiUrl}`);

        const success = await login(email.trim(), password);

        if (success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/(app)/(tabs)');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <StatusBar style="light" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                    className="px-6"
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header Section */}
                    <Animated.View
                        entering={FadeInDown.delay(100).springify()}
                        className="items-center mb-10"
                    >
                        <View className="mb-4">
                            <Image
                                source={require('../assets/splash-icon.png')}
                                style={{ width: 100, height: 100 }}
                                resizeMode="contain"
                            />
                        </View>
                        <Text className="text-3xl font-bold text-white text-center mb-2">
                            Welcome to Recashly
                        </Text>
                        <Text className="text-text-secondary text-base text-center">
                            Sign in to continue managing your expenses
                        </Text>
                    </Animated.View>

                    {/* Form Section */}
                    <Animated.View
                        entering={FadeInDown.delay(200).springify()}
                        className="space-y-4"
                    >
                        <View>
                            <Text className="text-white font-medium mb-2 ml-1">Email Address</Text>
                            <TextInput
                                className="w-full bg-surface-elevated text-white p-4 rounded-xl border border-white/10 focus:border-primary text-base"
                                placeholder="name@company.com"
                                placeholderTextColor="#6E7681"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoComplete="email"
                                editable={!isLoading}
                            />
                        </View>

                        <View>
                            <Text className="text-white font-medium mb-2 ml-1">Password</Text>
                            <TextInput
                                className="w-full bg-surface-elevated text-white p-4 rounded-xl border border-white/10 focus:border-primary text-base"
                                placeholder="Enter your password"
                                placeholderTextColor="#6E7681"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoComplete="password"
                                editable={!isLoading}
                            />
                            <TouchableOpacity className="items-end mt-2" disabled={isLoading}>
                                <Text className="text-primary text-sm font-medium">Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            className={`w-full bg-primary p-4 rounded-xl items-center mt-2 ${isLoading ? 'opacity-70' : ''} active:opacity-90`}
                            onPress={handleLogin}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#0D1117" />
                            ) : (
                                <Text className="text-background font-bold text-lg">Sign In</Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Footer Section */}
                    <Animated.View
                        entering={FadeInUp.delay(400).springify()}
                        className="flex-row justify-center mt-8"
                    >
                        <Text className="text-text-secondary">Don't have an account? </Text>
                        <TouchableOpacity disabled={isLoading}>
                            <Text className="text-primary font-bold">Sign Up</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
