import React from 'react';
import { View, ViewProps, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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

export default function ScreenWrapper({
    children,
    withSafeArea = true,
    edges = ['top'],
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
            className={`flex-1 bg-background ${paddingClass} ${className}`}
            edges={withSafeArea ? edges : undefined}
            style={style}
            {...props}
        >
            <StatusBar style="light" backgroundColor={colors.background} />
            {children}
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
