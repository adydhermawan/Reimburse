import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
    ...props
}: InputProps) {
    return (
        <View className={containerClassName}>
            {label && (
                <Text className="text-text-secondary mb-2 font-medium ml-1 text-xs uppercase tracking-wider">
                    {label}
                </Text>
            )}
            <View className={twMerge(
                "flex-row items-center bg-surface-elevated rounded-xl border border-white/10 focus:border-primary px-4",
                error ? "border-red-500" : ""
            )}>
                {leftIcon && <View className="mr-3">{leftIcon}</View>}
                <TextInput
                    className={twMerge(
                        "flex-1 text-white py-4 text-base placeholder:text-text-muted",
                        className
                    )}
                    placeholderTextColor="#6E7681"
                    {...props}
                />
                {rightIcon && <View className="ml-3">{rightIcon}</View>}
            </View>
            {error && <Text className="text-red-400 text-xs mt-1 ml-1">{error}</Text>}
        </View>
    );
}
