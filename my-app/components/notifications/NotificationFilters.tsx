import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { useSettings } from "../../context/SettingsContext";

interface NotificationFiltersProps {
    selectedFilter: 'all' | 'unread';
    onFilterChange: (filter: 'all' | 'unread') => void;
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    categories: string[];
}

export default function NotificationFilters({
    selectedFilter,
    onFilterChange,
    selectedCategory,
    onCategoryChange,
    categories
}: NotificationFiltersProps) {
    const { colors } = useSettings();

    const dynamicStyles = {
        chip: { backgroundColor: colors.card, borderColor: colors.border },
        chipText: { color: colors.subText },
    };

    return (
        <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <TouchableOpacity
                    style={[
                        styles.filterChip,
                        dynamicStyles.chip,
                        selectedFilter === 'all' && styles.filterChipActive
                    ]}
                    onPress={() => onFilterChange('all')}
                >
                    <Text style={[
                        styles.filterChipText,
                        dynamicStyles.chipText,
                        selectedFilter === 'all' && styles.filterChipTextActive
                    ]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.filterChip,
                        dynamicStyles.chip,
                        selectedFilter === 'unread' && styles.filterChipActive
                    ]}
                    onPress={() => onFilterChange('unread')}
                >
                    <Text style={[
                        styles.filterChipText,
                        dynamicStyles.chipText,
                        selectedFilter === 'unread' && styles.filterChipTextActive
                    ]}>Unread</Text>
                </TouchableOpacity>
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category}
                        style={[
                            styles.categoryChip,
                            dynamicStyles.chip,
                            selectedCategory === category && styles.categoryChipActive
                        ]}
                        onPress={() => onCategoryChange(category)}
                    >
                        <Text style={[
                            styles.categoryChipText,
                            dynamicStyles.chipText,
                            selectedCategory === category && styles.categoryChipTextActive
                        ]}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    filtersContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    filterScroll: {
        marginBottom: 8,
    },
    categoryScroll: {
        marginTop: 4,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#667eea',
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#667eea',
    },
    filterChipTextActive: {
        color: '#fff',
    },
    categoryChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(102, 126, 234, 0.08)',
        marginRight: 8,
    },
    categoryChipActive: {
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
    },
    categoryChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#667eea',
    },
    categoryChipTextActive: {
        color: '#667eea',
    },
});
