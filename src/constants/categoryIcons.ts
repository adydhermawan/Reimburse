import { Utensils, Coffee, Fuel, Car, Smartphone, FileText } from 'lucide-react-native';
import { colors } from './theme';

// Map category icon names from API to lucide components
export const categoryIcons: Record<string, any> = {
    'utensils': Utensils,
    'coffee': Coffee,
    'fuel': Fuel,
    'car': Car,
    'smartphone': Smartphone,
    'hotel': FileText,
};

export const getCategoryIcon = (icon?: string | null) => (icon && categoryIcons[icon]) || FileText;

export const categoryColors = [
    colors.categoryFood,
    colors.categoryCoffee,
    colors.categoryFuel,
    colors.categoryTransport,
    colors.categoryTopup,
    colors.textMuted,
];
