import React from 'react';
import { StyleSheet, TextInput, View, TextInputProps, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AuthInputProps extends TextInputProps {
    icon?: keyof typeof Ionicons.glyphMap;
    isPassword?: boolean;
    showPassword?: boolean;
    onTogglePassword?: () => void;
    error?: string;
    touched?: boolean;
}

export const AuthInput: React.FC<AuthInputProps> = ({
    icon,
    isPassword,
    showPassword,
    onTogglePassword,
    style,
    error,
    touched,
    ...props
}) => {
    return (
        <View style={styles.container}>
            <View style={[
                styles.inputContainer,
                error && touched ? styles.errorBorder : null
            ]}>
                {icon && <Ionicons name={icon} size={20} color="#666" style={styles.icon} />}
                <TextInput
                    style={[styles.input, style]}
                    placeholderTextColor="#999"
                    secureTextEntry={isPassword && !showPassword}
                    {...props}
                />
                {isPassword && (
                    <TouchableOpacity onPress={onTogglePassword} style={styles.eyeIcon}>
                        <Ionicons
                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F7F6',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EFEFEF',
        paddingHorizontal: 16,
        height: 56,
    },
    errorBorder: {
        borderColor: '#EF4444',
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#1F2937',
    },
    eyeIcon: {
        padding: 4,
        marginLeft: 8,
    },
});
