import {TouchableOpacity, View} from "react-native";
import {ThemedText} from "@/components/ThemedText";
import {router, useLocalSearchParams} from "expo-router";

const PostPage = () => {
    const {id} = useLocalSearchParams();

    return (
        <View>
            <TouchableOpacity onPress={() => router.back()}>
                <ThemedText>Retour</ThemedText>
            </TouchableOpacity>
            <ThemedText>Hello</ThemedText>
            <ThemedText>Post ID: {id}</ThemedText>
        </View>
    );
};

export default PostPage;
