import React, { Dispatch, SetStateAction } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput } from "react-native";
import { useSettings } from "../../context/SettingsContext";

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: () => void;
    editType: 'name' | 'phone';
    editValue: string;
    setEditValue: Dispatch<SetStateAction<string>>;
}

export default function EditProfileModal({
    visible,
    onClose,
    onSave,
    editType,
    editValue,
    setEditValue
}: EditProfileModalProps) {
    const { colors, darkMode } = useSettings();

    const dynamicStyles = {
        card: { backgroundColor: colors.card, borderColor: colors.border },
        text: { color: colors.text },
        subText: { color: colors.subText },
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, dynamicStyles.card]}>
                    <Text style={[styles.modalTitle, dynamicStyles.text]}>
                        Update {editType === 'name' ? 'Name' : 'Phone Number'}
                    </Text>
                    <Text style={[styles.modalSubtitle, dynamicStyles.subText]}>
                        Enter your new {editType === 'name' ? 'name' : 'phone number'}
                    </Text>

                    <TextInput
                        style={[styles.modalInput, dynamicStyles.text, { backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#f9f9f9', borderColor: colors.border }]}
                        value={editValue}
                        onChangeText={setEditValue}
                        placeholder={editType === 'name' ? 'Enter your name' : 'Enter phone number'}
                        placeholderTextColor={colors.subText}
                        keyboardType={editType === 'phone' ? 'phone-pad' : 'default'}
                        autoFocus={true}
                    />

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalCancelButton, { backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : '#f5f5f5', borderColor: colors.border }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.modalCancelText, dynamicStyles.subText]}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalSaveButton]}
                            onPress={onSave}
                        >
                            <Text style={styles.modalSaveText}>Update</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#1a1a1a',
        backgroundColor: '#f9f9f9',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCancelButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    modalCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    modalSaveButton: {
        backgroundColor: '#4FD1C5',
    },
    modalSaveText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
