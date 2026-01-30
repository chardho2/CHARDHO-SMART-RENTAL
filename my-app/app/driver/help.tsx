import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Linking,
    Alert,
    StatusBar,
    TextInput,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSettings } from "../../context/SettingsContext";

interface FAQItem {
    id: string;
    question: string;
    answer: string;
    category: string;
}

interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    action: () => void;
    color: string;
}

export default function HelpSupport() {
    const { colors, darkMode } = useSettings();
    const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    const faqs: FAQItem[] = [
        {
            id: "1",
            question: "How do I start accepting rides?",
            answer: "Go to your dashboard and toggle the 'Available' switch to start receiving ride requests. Make sure your location services are enabled and you have a stable internet connection.",
            category: "Getting Started"
        },
        {
            id: "2",
            question: "How are my earnings calculated?",
            answer: "Your earnings are based on the distance traveled, time taken, and the base fare. You can view a detailed breakdown in the Earnings tab. Payments are processed weekly to your registered bank account.",
            category: "Earnings"
        },
        {
            id: "3",
            question: "What should I do if a passenger cancels?",
            answer: "If a passenger cancels after you've arrived at the pickup location, you may be eligible for a cancellation fee. This will be automatically added to your earnings.",
            category: "Rides"
        },
        {
            id: "4",
            question: "How do I update my vehicle information?",
            answer: "Go to Profile → Vehicle Information and tap the edit icon. You can update your vehicle model, color, and plate number. Changes require admin verification.",
            category: "Account"
        },
        {
            id: "5",
            question: "What documents do I need to verify my account?",
            answer: "You need a valid driver's license, vehicle registration certificate (RC), vehicle insurance, and a PAN card. Upload clear photos of these documents in the Documents section.",
            category: "Verification"
        },
        {
            id: "6",
            question: "How can I improve my rating?",
            answer: "Maintain a clean vehicle, be punctual, drive safely, be polite with passengers, and follow the suggested route. High ratings unlock rewards and priority ride requests.",
            category: "Rating"
        },
        {
            id: "7",
            question: "What if I have an issue during a ride?",
            answer: "Use the SOS button in the app for emergencies. For non-emergency issues, you can contact support through the app or call our 24/7 helpline.",
            category: "Safety"
        },
        {
            id: "8",
            question: "How do I withdraw my earnings?",
            answer: "Earnings are automatically transferred to your registered bank account every week. You can view your transaction history in the Earnings tab.",
            category: "Earnings"
        },
    ];

    const categories = ["all", ...Array.from(new Set(faqs.map(faq => faq.category)))];

    const quickActions: QuickAction[] = [
        {
            id: "1",
            title: "Call Support",
            description: "24/7 helpline available",
            icon: "call",
            color: "#4CAF50",
            action: () => {
                Linking.openURL("tel:+911234567890");
            }
        },
        {
            id: "2",
            title: "Email Us",
            description: "Get help via email",
            icon: "mail",
            color: "#2196F3",
            action: () => {
                Linking.openURL("mailto:support@chardhogo.com?subject=Driver Support Request");
            }
        },
        {
            id: "3",
            title: "WhatsApp Chat",
            description: "Quick chat support",
            icon: "logo-whatsapp",
            color: "#25D366",
            action: () => {
                Linking.openURL("whatsapp://send?phone=911234567890&text=Hello, I need help with");
            }
        },
        {
            id: "4",
            title: "Report Issue",
            description: "Submit a detailed report",
            icon: "alert-circle",
            color: "#FF9800",
            action: () => {
                Alert.alert("Report Issue", "This will open the issue reporting form.", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Continue", onPress: () => console.log("Open report form") }
                ]);
            }
        },
    ];

    const filteredFAQs = faqs.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const toggleFAQ = (id: string) => {
        setExpandedFAQ(expandedFAQ === id ? null : id);
    };

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        card: { backgroundColor: colors.card, shadowColor: darkMode ? '#000' : '#ccc' },
        text: { color: colors.text },
        subText: { color: colors.subText },
        input: {
            backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            color: colors.text
        },
    };

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

            {/* Header with Gradient */}
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>Help & Support</Text>
                        <Text style={styles.headerSubtitle}>We're here to help you 24/7</Text>
                    </View>
                    <View style={styles.headerIcon}>
                        <Ionicons name="headset" size={28} color="#fff" />
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.text]}>Quick Actions</Text>
                    <View style={styles.quickActionsGrid}>
                        {quickActions.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={[styles.quickActionCard, dynamicStyles.card]}
                                onPress={action.action}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                                    <Ionicons name={action.icon} size={28} color={action.color} />
                                </View>
                                <Text style={[styles.quickActionTitle, dynamicStyles.text]}>{action.title}</Text>
                                <Text style={[styles.quickActionDesc, dynamicStyles.subText]}>{action.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Emergency Contact */}
                <TouchableOpacity
                    style={[styles.emergencyCard, dynamicStyles.card]}
                    onPress={() => Linking.openURL("tel:112")}
                >
                    <LinearGradient
                        colors={['#f44336', '#d32f2f']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.emergencyGradient}
                    >
                        <View style={styles.emergencyIcon}>
                            <Ionicons name="warning" size={32} color="#fff" />
                        </View>
                        <View style={styles.emergencyContent}>
                            <Text style={styles.emergencyTitle}>Emergency Helpline</Text>
                            <Text style={styles.emergencyNumber}>Call 112</Text>
                            <Text style={styles.emergencyDesc}>For immediate assistance in emergencies</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
                    </LinearGradient>
                </TouchableOpacity>

                {/* FAQs Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.text]}>Frequently Asked Questions</Text>

                    {/* Search Bar */}
                    <View style={[styles.searchContainer, dynamicStyles.input]}>
                        <Ionicons name="search" size={20} color={colors.subText} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search FAQs..."
                            placeholderTextColor={colors.subText}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery("")}>
                                <Ionicons name="close-circle" size={20} color={colors.subText} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Category Filter */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryScroll}
                    >
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category}
                                style={[
                                    styles.categoryChip,
                                    selectedCategory === category && styles.categoryChipActive
                                ]}
                                onPress={() => setSelectedCategory(category)}
                            >
                                <Text style={[
                                    styles.categoryChipText,
                                    selectedCategory === category && styles.categoryChipTextActive
                                ]}>
                                    {category === "all" ? "All" : category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* FAQ List */}
                    <View style={styles.faqList}>
                        {filteredFAQs.length > 0 ? (
                            filteredFAQs.map((faq) => (
                                <TouchableOpacity
                                    key={faq.id}
                                    style={[styles.faqCard, dynamicStyles.card]}
                                    onPress={() => toggleFAQ(faq.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.faqHeader}>
                                        <View style={styles.faqIconContainer}>
                                            <Ionicons
                                                name="help-circle"
                                                size={24}
                                                color="#667eea"
                                            />
                                        </View>
                                        <View style={styles.faqQuestionContainer}>
                                            <Text style={[styles.faqCategory, dynamicStyles.subText]}>
                                                {faq.category}
                                            </Text>
                                            <Text style={[styles.faqQuestion, dynamicStyles.text]}>
                                                {faq.question}
                                            </Text>
                                        </View>
                                        <Ionicons
                                            name={expandedFAQ === faq.id ? "chevron-up" : "chevron-down"}
                                            size={20}
                                            color={colors.subText}
                                        />
                                    </View>
                                    {expandedFAQ === faq.id && (
                                        <View style={styles.faqAnswer}>
                                            <Text style={[styles.faqAnswerText, dynamicStyles.subText]}>
                                                {faq.answer}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.noResults}>
                                <Ionicons name="search-outline" size={48} color={colors.subText} />
                                <Text style={[styles.noResultsText, dynamicStyles.text]}>
                                    No FAQs found
                                </Text>
                                <Text style={[styles.noResultsSubtext, dynamicStyles.subText]}>
                                    Try adjusting your search or category filter
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Contact Info */}
                <View style={[styles.contactInfoCard, dynamicStyles.card]}>
                    <Text style={[styles.contactInfoTitle, dynamicStyles.text]}>Still need help?</Text>
                    <Text style={[styles.contactInfoText, dynamicStyles.subText]}>
                        Our support team is available 24/7 to assist you with any questions or concerns.
                    </Text>
                    <View style={styles.contactDetails}>
                        <View style={styles.contactDetailItem}>
                            <Ionicons name="mail" size={16} color="#667eea" />
                            <Text style={[styles.contactDetailText, dynamicStyles.text]}>support@chardhogo.com</Text>
                        </View>
                        <View style={styles.contactDetailItem}>
                            <Ionicons name="call" size={16} color="#667eea" />
                            <Text style={[styles.contactDetailText, dynamicStyles.text]}>+91 123 456 7890</Text>
                        </View>
                        <View style={styles.contactDetailItem}>
                            <Ionicons name="time" size={16} color="#667eea" />
                            <Text style={[styles.contactDetailText, dynamicStyles.text]}>24/7 Support Available</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 16,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    quickActionCard: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    quickActionIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    quickActionTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
        textAlign: 'center',
    },
    quickActionDesc: {
        fontSize: 11,
        textAlign: 'center',
        fontWeight: '500',
    },
    emergencyCard: {
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#f44336',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    emergencyGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        gap: 16,
    },
    emergencyIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emergencyContent: {
        flex: 1,
    },
    emergencyTitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
        marginBottom: 4,
    },
    emergencyNumber: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 2,
    },
    emergencyDesc: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 10,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    categoryScroll: {
        marginBottom: 16,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        marginRight: 8,
    },
    categoryChipActive: {
        backgroundColor: '#667eea',
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#667eea',
    },
    categoryChipTextActive: {
        color: '#fff',
    },
    faqList: {
        gap: 12,
    },
    faqCard: {
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    faqHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    faqIconContainer: {
        marginTop: 2,
    },
    faqQuestionContainer: {
        flex: 1,
    },
    faqCategory: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    faqQuestion: {
        fontSize: 15,
        fontWeight: '700',
        lineHeight: 20,
    },
    faqAnswer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(102, 126, 234, 0.1)',
    },
    faqAnswerText: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
    },
    noResults: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    noResultsText: {
        fontSize: 16,
        fontWeight: '700',
        marginTop: 12,
        marginBottom: 4,
    },
    noResultsSubtext: {
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
    },
    contactInfoCard: {
        marginHorizontal: 16,
        marginTop: 8,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    contactInfoTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 8,
    },
    contactInfoText: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
        marginBottom: 16,
    },
    contactDetails: {
        gap: 10,
    },
    contactDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    contactDetailText: {
        fontSize: 14,
        fontWeight: '600',
    },
    bottomPadding: {
        height: 24,
    },
});
