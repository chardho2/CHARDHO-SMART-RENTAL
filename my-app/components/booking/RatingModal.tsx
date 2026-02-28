import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface RatingModalProps {
    visible: boolean;
    driverName: string;
    onSubmit: (rating: number, feedback: string) => Promise<void>;
    onSkip: () => void;
}

export default function RatingModal({ visible, driverName, onSubmit, onSkip }: RatingModalProps) {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            return;
        }

        try {
            setSubmitting(true);
            await onSubmit(rating, feedback);
            // Reset state
            setRating(0);
            setFeedback('');
        } catch (error) {
            console.error('Error submitting rating:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSkip = () => {
        setRating(0);
        setFeedback('');
        onSkip();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleSkip}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <LinearGradient
                        colors={['#4FD1C5', '#38B2AC']}
                        style={styles.header}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <MaterialIcons name="check-circle" size={48} color="#fff" />
                        <Text style={styles.headerTitle}>Trip Completed!</Text>
                        <Text style={styles.headerSubtitle}>How was your ride?</Text>
                    </LinearGradient>

                    {/* Content */}
                    <View style={styles.content}>
                        {/* Driver Name */}
                        <Text style={styles.driverLabel}>Rate your experience with</Text>
                        <Text style={styles.driverName}>{driverName}</Text>

                        {/* Star Rating */}
                        <View style={styles.starsContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setRating(star)}
                                    style={styles.starButton}
                                    disabled={submitting}
                                >
                                    <MaterialIcons
                                        name={star <= rating ? 'star' : 'star-border'}
                                        size={48}
                                        color={star <= rating ? '#FFB800' : '#ddd'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Rating Description */}
                        {rating > 0 && (
                            <Text style={styles.ratingDescription}>
                                {rating === 5 && '⭐ Excellent!'}
                                {rating === 4 && '👍 Great!'}
                                {rating === 3 && '😊 Good'}
                                {rating === 2 && '😐 Okay'}
                                {rating === 1 && '😞 Poor'}
                            </Text>
                        )}

                        {/* Feedback Input */}
                        <Text style={styles.feedbackLabel}>
                            Additional Feedback (Optional)
                        </Text>
                        <TextInput
                            style={styles.feedbackInput}
                            placeholder="Share your experience..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            value={feedback}
                            onChangeText={setFeedback}
                            editable={!submitting}
                            textAlignVertical="top"
                        />

                        {/* Action Buttons */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                rating === 0 && styles.submitButtonDisabled,
                            ]}
                            onPress={handleSubmit}
                            disabled={rating === 0 || submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <MaterialIcons name="send" size={20} color="#fff" />
                                    <Text style={styles.submitButtonText}>Submit Rating</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={handleSkip}
                            disabled={submitting}
                        >
                            <Text style={styles.skipButtonText}>Skip for Now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: width - 40,
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        padding: 32,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        marginTop: 16,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    content: {
        padding: 24,
    },
    driverLabel: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 4,
    },
    driverName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 24,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    starButton: {
        padding: 4,
    },
    ratingDescription: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4FD1C5',
        textAlign: 'center',
        marginBottom: 24,
    },
    feedbackLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    feedbackInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: '#333',
        minHeight: 100,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    submitButton: {
        backgroundColor: '#4FD1C5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        gap: 8,
        shadowColor: '#4FD1C5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    skipButton: {
        padding: 12,
        alignItems: 'center',
    },
    skipButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
});
