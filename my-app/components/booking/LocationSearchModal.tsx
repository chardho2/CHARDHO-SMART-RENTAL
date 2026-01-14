import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { LocationData } from '../../services/bookingAPI';

interface LocationSearchModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (location: LocationData) => void;
    title: string;
    placeholder: string;
    locations: LocationData[];
    loading: boolean;
    onSearch: (query: string) => void;
}

export default function LocationSearchModal({
    visible,
    onClose,
    onSelect,
    title,
    placeholder,
    locations,
    loading,
    onSearch
}: LocationSearchModalProps) {
    const [query, setQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(query);
        }, 400);
        return () => clearTimeout(timer);
    }, [query]);

    const renderLocationItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.locationItem}
            onPress={() => onSelect(item)}
        >
            <View style={styles.iconContainer}>
                <Ionicons
                    name={item.id?.toString().includes('current') ? "location" : "map-outline"}
                    size={22}
                    color="#4FD1C5"
                />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.locationName}>{item.name}</Text>
                <Text style={styles.locationAddress} numberOfLines={1}>{item.address}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
    );

    const ModalBackground = Platform.OS === 'ios' ? BlurView : View;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <ModalBackground
                    intensity={80}
                    tint="light"
                    style={[styles.container, Platform.OS !== 'ios' && { backgroundColor: '#fff' }]}
                >
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.title}>{title}</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder={placeholder}
                            value={query}
                            onChangeText={setQuery}
                            autoFocus
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => setQuery('')}>
                                <Ionicons name="close-circle" size={18} color="#ccc" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <FlatList
                        data={locations}
                        keyExtractor={(item) => item.id?.toString() || `${item.name}-${item.coordinates.latitude}`}
                        renderItem={renderLocationItem}
                        contentContainerStyle={styles.list}
                        keyboardShouldPersistTaps="handled"
                        ListFooterComponent={
                            loading && locations.length > 0 ? (
                                <ActivityIndicator style={{ marginVertical: 20 }} color="#4FD1C5" />
                            ) : null
                        }
                        ListEmptyComponent={
                            <View style={styles.centerContent}>
                                {loading ? (
                                    <ActivityIndicator size="large" color="#4FD1C5" />
                                ) : (
                                    <>
                                        {query.length > 2 && (
                                            <Ionicons name="search" size={48} color="#eee" style={{ marginBottom: 12 }} />
                                        )}
                                        <Text style={styles.emptyText}>
                                            {query.length < 2 ? "Type to search..." : "No locations found"}
                                        </Text>
                                    </>
                                )}
                            </View>
                        }
                    />
                </ModalBackground>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        height: '90%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    closeBtn: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        margin: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 50,
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    list: {
        padding: 16,
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(79, 209, 197, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    locationName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    locationAddress: {
        fontSize: 13,
        color: '#666',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
});
