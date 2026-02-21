import React from 'react';
import { View, ViewProps, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { twMerge } from 'tailwind-merge';
import { colors } from '../../constants/theme';

interface ScreenWrapperProps extends ViewProps {
    children: React.ReactNode;
    /** Enable SafeAreaView wrapper */
    withSafeArea?: boolean;
    /** Safe area edges to respect */
    edges?: SafeAreaViewProps['edges'];
    /** Enable keyboard avoiding behavior */
    withKeyboardAvoiding?: boolean;
    /** Additional className for styling */
    className?: string;
    /** Whether to add default horizontal padding */
    withPadding?: boolean;
}

const DEFAULT_EDGES: SafeAreaViewProps['edges'] = ['top'];

export default function ScreenWrapper({
    children,
    withSafeArea = true,
    edges = DEFAULT_EDGES,
    withKeyboardAvoiding = false,
    withPadding = false,
    className = '',
    style,
    ...props
}: ScreenWrapperProps) {
    const Container = withSafeArea ? SafeAreaView : View;
    const paddingClass = withPadding ? 'px-5' : '';

    const content = (
        <Container
            className="flex-1 bg-background"
            edges={withSafeArea ? edges : undefined}
            style={[
                style,
                Platform.OS === 'web' && withSafeArea && edges?.includes('top') && { paddingTop: 'env(safe-area-inset-top, 24px)' as any },
                Platform.OS === 'web' && withSafeArea && edges?.includes('bottom') && { paddingBottom: 'env(safe-area-inset-bottom, 24px)' as any },
            ]}
            {...props}
        >
            <StatusBar style="light" backgroundColor={colors.background} />
            <View className={twMerge('flex-1', paddingClass, className)}>
                {children}
            </View>
        </Container>
    );

    if (withKeyboardAvoiding) {
        return (
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                {content}
            </KeyboardAvoidingView>
        );
    }

    return content;
}
