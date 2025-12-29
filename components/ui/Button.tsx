import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends TouchableOpacityProps {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    label: string;
    loading?: boolean;
    icon?: React.ReactNode;
    className?: string;
    textClassName?: string;
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
    ...props
}: ButtonProps) {
    const baseStyles = 'rounded-xl flex-row items-center justify-center active:opacity-90';

    const variants = {
        primary: 'bg-primary shadow-lg shadow-cyan-500/20',
        secondary: 'bg-surface-elevated border border-white/10',
        danger: 'bg-red-500/10 border border-red-500/20',
        ghost: 'bg-transparent',
    };

    const sizes = {
        sm: 'p-2',
        md: 'p-4',
        lg: 'p-5',
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
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? '#0D1117' : '#FFFFFF'} />
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

// Helper View for Icon because it was used in JSX above but not imported
import { View } from 'react-native';
