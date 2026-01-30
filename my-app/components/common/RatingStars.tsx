import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
    rating?: number;             // decimal allowed (4.5)
    size?: number;               // star size
    interactive?: boolean;       // can user tap to rate?
    onRate?: (value: number) => void;
}

export default function RatingStars({
    rating = 0,
    size = 20,
    interactive = false,
    onRate,
}: Props) {
    const [animatedValue] = useState(new Animated.Value(rating));

    // animate when rating changes
    useEffect(() => {
        Animated.spring(animatedValue, {
            toValue: rating,
            useNativeDriver: false,
            speed: 12,
            bounciness: 8,
        }).start();
    }, [rating]);

    const renderStar = (index: number) => {
        const integerPart = Math.floor(rating);
        const hasHalf = rating - integerPart >= 0.5;

        let icon = "star-border";
        if (index <= integerPart) icon = "star";
        if (index === integerPart + 1 && hasHalf) icon = "star-half";

        const starElement = (
            <Animated.View
                style={{
                    transform: [
                        {
                            scale: animatedValue.interpolate({
                                inputRange: [0, 5],
                                outputRange: [1, 1.15],
                            }),
                        },
                    ],
                }}
            >
                <MaterialIcons name={icon} size={size} color="#f4b400" />
            </Animated.View>
        );

        if (!interactive)
            return <View key={index} style={styles.starWrapper}>{starElement}</View>;

        // interactive tap rating
        return (
            <TouchableOpacity
                key={index}
                onPress={() => onRate && onRate(index)}
                activeOpacity={0.6}
                style={styles.starWrapper}
            >
                {starElement}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.row}>
            {[1, 2, 3, 4, 5].map((i) => renderStar(i))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    starWrapper: {
        marginRight: 2,
    },
});
