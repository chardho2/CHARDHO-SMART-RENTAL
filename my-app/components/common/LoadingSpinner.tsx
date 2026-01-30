import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LoadingSpinnerProps {
    size?: 'small' | 'large';
    color?: string;
    text?: string;
}

export default function LoadingSpinner({
    size = 'large',
    color = '#4FD1C5',
    text
}: LoadingSpinnerProps) {
    return (
        <View style={styles.container}>
            <View style={styles.spinnerContainer}>
                <LinearGradient
                    colors={['rgba(79, 209, 197, 0.1)', 'rgba(102, 126, 234, 0.1)']}
                    style={styles.gradient}
                >
                    <ActivityIndicator size={size} color={color} />
                </LinearGradient>
            </View>
            {text && <Text style={styles.text}>{text}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f7f7f6',
    },
    spinnerContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
    },
    gradient: {
        padding: 32,
        borderRadius: 20,
    },
    text: {
        marginTop: 12,
        fontSize: 15,
        color: '#2C5364',
        textAlign: 'center',
        fontWeight: '500',
    },
});
