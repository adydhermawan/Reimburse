import React from 'react';
import { TouchableOpacity, Text, View, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { twMerge } from 'tailwind-merge';
import * as Haptics from 'expo-haptics';
import { colors } from '../../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    label: string;
    loading?: boolean;
    icon?: React.ReactNode;
    className?: string;
    textClassName?: string;
    enableHaptics?: boolean;
}

export default function Button({
    variant = 'primary',
    size = 'md',
    label,
    loading = false,
    icon,
    className,
    textClassName,
    disabled,
    enableHaptics = true,
    onPress,
    ...props
}: ButtonProps) {
    const baseStyles = 'rounded-xl flex-row items-center justify-center';

    const variants = {
        primary: 'bg-primary shadow-lg shadow-cyan-500/20 active:bg-primary-dark',
        secondary: 'bg-surface-elevated border border-white/10 active:bg-white/5',
        danger: 'bg-red-500/10 border border-red-500/20 active:bg-red-500/20',
        ghost: 'bg-transparent active:bg-white/5',
    };

    const sizes = {
        sm: 'py-2 px-4',
        md: 'py-4 px-6',
        lg: 'py-5 px-8',
    };

    const textStyles = {
        primary: 'text-background font-bold',
        secondary: 'text-white font-medium',
        danger: 'text-red-400 font-bold',
        ghost: 'text-primary font-medium',
    };

    const textSizes = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
    };

    const handlePress = (e: any) => {
        if (enableHaptics) {
            Haptics.selectionAsync();
        }
        onPress?.(e);
    };

    return (
        <TouchableOpacity
            className={twMerge(
                baseStyles,
                variants[variant],
                sizes[size],
                disabled || loading ? 'opacity-50' : '',
                className
            )}
            disabled={disabled || loading}
            activeOpacity={0.7}
            onPress={handlePress}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? colors.background : colors.text} />
            ) : (
                <>
                    {icon && <View className="mr-2">{icon}</View>}
                    <Text className={twMerge(textStyles[variant], textSizes[size], textClassName)}>
                        {label}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}
