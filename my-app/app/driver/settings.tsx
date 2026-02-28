import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ScrollView,
    Modal,
    FlatList,
    Alert,
    StatusBar,
    BackHandler
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSettings } from '../../context/SettingsContext';

const LANGUAGES = [
    { id: 'en', name: 'English' },
    { id: 'hi', name: 'हिंदी (Hindi)' },
    { id: 'te', name: 'తెలుగు (Telugu)' },
    { id: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
    { id: 'ta', name: 'தமிழ் (Tamil)' },
];

export default function AppSettings() {
    const {
        notifications,
        toggleNotifications,
        soundEnabled,
        toggleSound,
        darkMode,
        toggleDarkMode,
        language,
        setLanguage,
        clearCache,
        colors
    } = useSettings();

    const [languageModalVisible, setLanguageModalVisible] = useState(false);

    const handleLanguageSelect = (lang: typeof LANGUAGES[0]) => {
        setLanguage(lang.name);
        setLanguageModalVisible(false);
    };

    useEffect(() => {
        const backAction = () => {
            router.replace('/driver/tabs/profile' as any);
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, []);

    const confirmClearCache = () => {
        Alert.alert(
            "Clear Cache",
            "Are you sure you want to clear app cache?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Clear", onPress: clearCache }
            ]
        );
    };

    // Dynamic Styles for Theme
    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        card: { backgroundColor: colors.card, shadowColor: darkMode ? '#000' : '#ccc' },
        text: { color: colors.text },
        subText: { color: colors.subText },
        border: { backgroundColor: colors.border },
    };

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
            <LinearGradient
                colors={['#0F2027', '#203A43', '#2C5364']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>App Settings</Text>
            </LinearGradient>

            <ScrollView style={styles.content}>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.text]}>Preferences</Text>
                    <View style={[styles.card, dynamicStyles.card]}>

                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Ionicons name="notifications-outline" size={22} color={colors.primary} />
                                <Text style={[styles.settingLabel, dynamicStyles.text]}>Push Notifications</Text>
                            </View>
                            <Switch
                                value={notifications}
                                onValueChange={toggleNotifications}
                                trackColor={{ false: "#ddd", true: colors.primary }}
                                thumbColor="#fff"
                            />
                        </View>

                        <View style={[styles.divider, dynamicStyles.border]} />

                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Ionicons name="volume-medium-outline" size={22} color={colors.primary} />
                                <Text style={[styles.settingLabel, dynamicStyles.text]}>Sound Effects</Text>
                            </View>
                            <Switch
                                value={soundEnabled}
                                onValueChange={toggleSound}
                                trackColor={{ false: "#ddd", true: colors.primary }}
                                thumbColor="#fff"
                            />
                        </View>

                        <View style={[styles.divider, dynamicStyles.border]} />

                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Ionicons name="moon-outline" size={22} color={colors.primary} />
                                <Text style={[styles.settingLabel, dynamicStyles.text]}>Dark Mode</Text>
                            </View>
                            <Switch
                                value={darkMode}
                                onValueChange={toggleDarkMode}
                                trackColor={{ false: "#ddd", true: colors.primary }}
                                thumbColor="#fff"
                            />
                        </View>
                    </View>
                </View>

                {/* General */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.text]}>General</Text>
                    <View style={[styles.card, dynamicStyles.card]}>
                        <TouchableOpacity style={styles.settingRow} onPress={() => setLanguageModalVisible(true)}>
                            <View style={styles.settingInfo}>
                                <Ionicons name="language-outline" size={22} color="#2196f3" />
                                <Text style={[styles.settingLabel, dynamicStyles.text]}>Language</Text>
                            </View>
                            <View style={styles.rowRight}>
                                <Text style={[styles.valueText, dynamicStyles.subText]}>{language}</Text>
                                <Ionicons name="chevron-forward" size={20} color="#999" />
                            </View>
                        </TouchableOpacity>

                        <View style={[styles.divider, dynamicStyles.border]} />

                        <TouchableOpacity style={styles.settingRow} onPress={confirmClearCache}>
                            <View style={styles.settingInfo}>
                                <Ionicons name="trash-outline" size={22} color={colors.danger} />
                                <Text style={[styles.settingLabel, dynamicStyles.text]}>Clear Cache</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#999" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* App Info */}
                <View style={styles.footer}>
                    <Text style={styles.versionText}>CharDhoGo Driver v1.0.0</Text>
                    <Text style={styles.buildText}>Build 2024.12.25</Text>
                </View>

            </ScrollView>

            {/* Language Modal */}
            <Modal
                visible={languageModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setLanguageModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, dynamicStyles.card]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, dynamicStyles.text]}>Select Language</Text>
                            <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={LANGUAGES}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.languageItem}
                                    onPress={() => handleLanguageSelect(item)}
                                >
                                    <Text style={[
                                        styles.languageText,
                                        dynamicStyles.text,
                                        language === item.name && styles.languageTextActive
                                    ]}>{item.name}</Text>
                                    {language === item.name && (
                                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={[styles.modalDivider, dynamicStyles.border]} />}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f7f6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        borderRadius: 16,
        padding: 8,
        elevation: 1,
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 12,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    settingSubLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginLeft: 46,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    valueText: {
        fontSize: 14,
    },
    footer: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 40,
    },
    versionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#999',
    },
    buildText: {
        fontSize: 12,
        color: '#ccc',
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 20,
        padding: 20,
        maxHeight: '60%',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    languageItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
    },
    languageText: {
        fontSize: 16,
    },
    languageTextActive: {
        color: '#4FD1C5',
        fontWeight: '600',
    },
    modalDivider: {
        height: 1,
    },
});
