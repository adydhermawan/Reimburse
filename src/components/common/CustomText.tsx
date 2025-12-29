import React from 'react';
import { Text, TextProps } from 'react-native';
import { twMerge } from 'tailwind-merge';

type TextVariant =
    | 'heading1'
    | 'heading2'
    | 'heading3'
    | 'body'
    | 'bodySmall'
    | 'label'
    | 'caption';

interface CustomTextProps extends TextProps {
    variant?: TextVariant;
    color?: 'default' | 'secondary' | 'muted' | 'primary' | 'success' | 'warning' | 'danger';
    className?: string;
    children: React.ReactNode;
}

const variantStyles: Record<TextVariant, string> = {
    heading1: 'text-4xl font-bold tracking-tight',
    heading2: 'text-3xl font-bold',
    heading3: 'text-xl font-bold',
    body: 'text-base font-normal',
    bodySmall: 'text-sm font-normal',
    label: 'text-xs font-medium uppercase tracking-wider',
    caption: 'text-xs font-normal',
};

const colorStyles: Record<NonNullable<CustomTextProps['color']>, string> = {
    default: 'text-white',
    secondary: 'text-text-secondary',
    muted: 'text-text-muted',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
};

export default function CustomText({
    variant = 'body',
    color = 'default',
    className,
    children,
    ...props
}: CustomTextProps) {
    return (
        <Text
            className={twMerge(variantStyles[variant], colorStyles[color], className)}
            {...props}
        >
            {children}
        </Text>
    );
}
