import { Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');

export const isDesktop = Platform.OS === 'web' && width >= 768;
export const isTablet = Platform.OS === 'web' && width >= 600 && width < 768;
export const isMobile = !isDesktop && !isTablet;

export const getResponsiveValue = (mobile: number, tablet: number, desktop: number) => {
    if (isDesktop) return desktop;
    if (isTablet) return tablet;
    return mobile;
};

export const getMaxWidth = () => {
    if (isDesktop) return 1200; // Max width for desktop
    return '100%';
};

export const getContentPadding = () => {
    return getResponsiveValue(16, 24, 32);
};

export const getGridColumns = () => {
    return getResponsiveValue(1, 2, 3);
};
