import {TouchableOpacity, View} from "react-native";
import {ThemedText} from "@/components/ThemedText";
import {router, useLocalSearchParams} from "expo-router";
import {useAppDispatch, useAppSelector} from "@/constants/useRedux";
import {useEffect, useState} from "react";
import useFetchEvents from "@/hooks/apiHooks/useFetchEvents";
import {EventInfos} from "@/interfaces";

const PostPage = () => {
    const {id} = useLocalSearchParams();
    const fetchOne = useFetchEvents();
    const [event, setEvent] = useState<EventInfos | []>();

    useEffect(() => {
        const fetchEvent = async () => {
            if (id) {
                const eventData = await fetchOne.fetchOne(Number(id));
                if (eventData) setEvent(eventData);
                console.log('Fetched Event:', eventData);
            }
        };

        fetchEvent();
    }, []);

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
