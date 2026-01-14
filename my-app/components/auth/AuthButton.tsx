import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AuthButtonProps {
    onPress: () => void;
    title: string;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline';
    style?: ViewStyle;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
    onPress,
    title,
    loading,
    variant = 'primary',
    style
}) => {
    const getColors = () => {
        switch (variant) {
            case 'primary': return ['#454545', '#1a1a1a'] as [string, string];
            case 'secondary': return ['#D0BB95', '#C0AB85'] as [string, string];
            default: return ['transparent', 'transparent'] as [string, string];
        }
    };

    const Content = () => (
        <>
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? '#1a1a1a' : '#fff'} />
            ) : (
                <Text style={[
                    styles.text,
                    variant === 'outline' ? styles.textOutline : styles.textPrimary
                ]}>
                    {title}
                </Text>
            )}
        </>
    );

    if (variant === 'outline') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={loading}
                style={[styles.button, styles.outline, style]}
            >
                <Content />
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity onPress={onPress} disabled={loading} style={[styles.container, style]}>
            <LinearGradient
                colors={getColors()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
            >
                <Content />
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    button: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        width: '100%',
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#1a1a1a',
    },
    text: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    textPrimary: {
        color: '#FFFFFF',
    },
    textOutline: {
        color: '#1a1a1a',
    },
});
