import {Image, StyleSheet, Platform, Animated, View} from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import {ThemedText} from '@/components/ThemedText';
import {ThemedView} from '@/components/ThemedView';
import {useEffect, useState} from "react";
import UseFetchEvents from "@/hooks/useFetchEvents";
import {EventInfos} from "@/interfaces/event";
import ScrollView = Animated.ScrollView;
import EventHomeCard from "@/components/EventHomeCard";

export default function HomeScreen() {
    const [events, setEvents] = useState<EventInfos[]>([]);
    const {loading, error, fetchAll} = UseFetchEvents();

    useEffect(() => {

        const fetchDatas = async () => {
            const data = await fetchAll();
            console.log(data);
            setEvents(data.event);
        }

        fetchDatas();

    }, []);

    useEffect(() => {
        //console.log('Events:', events);
    }, [events]);

    /*if (loading) {
        return <ThemedText>Loading...</ThemedText>;
    }*/

    if (error) {
        return <ThemedText>Error</ThemedText>;
    }

    return (
        <View style={styles.container}>
            <ScrollView>
                {events.length > 0 && events.map((event) => (
                    <EventHomeCard infos={event} key={event.id}/>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        height: '89.3%',
        padding: 10,
        /*borderStyle: 'solid',
        borderColor: 'red',
        borderWidth: 1,*/
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepContainer: {
        gap: 8,
        marginBottom: 8,
    },
    reactLogo: {
        height: 178,
        width: 290,
        bottom: 0,
        left: 0,
        position: 'absolute',
    },
});
