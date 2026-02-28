import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DriverHeader({ title }: { title: string }) {
    const navigation: any = useNavigation();

    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.openDrawer()}>
                <MaterialIcons name="menu" size={26} color="#d6d6d6ff" />
            </TouchableOpacity>

            <Text style={styles.title}>{title}</Text>

            <View style={{ width: 26 }} />
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        backgroundColor: "#fff",
    },
    title: {
        flex: 1,
        textAlign: "center",
        fontSize: 18,
        fontWeight: "700",
    },
});
