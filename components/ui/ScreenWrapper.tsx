import React from 'react';
import { View, ViewProps, Platform } from 'react-native';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

interface ScreenWrapperProps extends ViewProps {
    children: React.ReactNode;
    withSafeArea?: boolean;
    edges?: SafeAreaViewProps['edges'];
    className?: string;
}

export default function ScreenWrapper({
    children,
    withSafeArea = true,
    edges = ['top'],
    className = '',
    style,
    ...props
}: ScreenWrapperProps) {
    const Container = withSafeArea ? SafeAreaView : View;

    return (
        <Container
            className={`flex-1 bg-background ${className}`}
            edges={withSafeArea ? edges : undefined}
            style={style}
            {...props}
        >
            <StatusBar style="light" backgroundColor="#0D1117" />
            {children}
        </Container>
    );
}
