import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

interface CustomMarkerProps {
    type: 'pickup' | 'destination' | 'driver' | 'user' | 'car';
    color?: string;
    size?: number;
}

export default function CustomMarker({ type, color, size = 44 }: CustomMarkerProps) {
    const getMarkerConfig = () => {
        switch (type) {
            case 'pickup':
                return {
                    defaultColor: '#4FD1C5',
                    icon: 'person',
                    Pack: MaterialIcons,
                    iconSize: size * 0.5
                };
            case 'destination':
                return {
                    defaultColor: '#F56565',
                    icon: 'location-sharp',
                    Pack: Ionicons,
                    iconSize: size * 0.5
                };
            case 'driver':
            case 'car':
                return {
                    defaultColor: '#4FD1C5',
                    icon: 'car',
                    Pack: Ionicons,
                    iconSize: size * 0.5
                };
            case 'user':
                return {
                    defaultColor: '#4FD1C5',
                    icon: 'person',
                    Pack: MaterialIcons,
                    iconSize: size * 0.5
                };
            default:
                return {
                    defaultColor: '#888',
                    icon: 'radio-button-on',
                    Pack: MaterialIcons,
                    iconSize: size * 0.5
                };
        }
    };

    const config = getMarkerConfig();
    const finalColor = color || config.defaultColor;

    return (
        <View style={[styles.container, { width: size, height: size * 1.2 }]}>
            {/* Shadow for depth */}
            <View style={[styles.shadow, { width: size * 0.6, height: 6, borderRadius: 3 }]} />

            {/* Pin Shape */}
            <View style={[styles.pin, {
                backgroundColor: finalColor,
                width: size,
                height: size,
                borderRadius: size / 2, // Circle top
            }]}>
                <config.Pack name={config.icon as any} size={config.iconSize} color="white" />
            </View>

            {/* Triangle Bottom Pointer */}
            <View style={[styles.triangle, {
                borderTopColor: finalColor,
                top: size - 2, // slight overlap
            }]} />

            {/* Inner Ring for extra detail (optional) */}
            <View style={[styles.ring, {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderColor: 'rgba(255,255,255,0.3)'
            }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    pin: {
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
        borderWidth: 2,
        borderColor: 'white',
    },
    ring: {
        position: 'absolute',
        borderWidth: 1,
        zIndex: 3,
        top: 0,
    },
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 0,
        borderTopWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        zIndex: 1,
        marginTop: -1, // overlap to remove gap
    },
    shadow: {
        position: 'absolute',
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.2)',
        zIndex: 0,
    }
});
