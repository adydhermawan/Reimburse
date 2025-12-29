import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { colors } from '../../constants/theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerClassName?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export default function Input({
    label,
    error,
    containerClassName,
    className,
    leftIcon,
    rightIcon,
    onFocus,
    onBlur,
    ...props
}: InputProps) {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    return (
        <View className={containerClassName}>
            {label && (
                <Text className="text-text-secondary mb-2 font-medium ml-1 text-xs uppercase tracking-wider">
                    {label}
                </Text>
            )}
            <View
                className={twMerge(
                    'flex-row items-center bg-surface-elevated rounded-xl border px-4 transition-colors',
                    error ? 'border-red-500' : isFocused ? 'border-primary' : 'border-white/10'
                )}
            >
                {leftIcon && <View className="mr-3">{leftIcon}</View>}
                <TextInput
                    className={twMerge(
                        'flex-1 text-white py-4 text-base',
                        className
                    )}
                    placeholderTextColor={colors.textMuted}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...props}
                />
                {rightIcon && <View className="ml-3">{rightIcon}</View>}
            </View>
            {error && <Text className="text-red-400 text-xs mt-1 ml-1">{error}</Text>}
        </View>
    );
}
