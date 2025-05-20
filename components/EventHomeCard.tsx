import React from 'react';
import {EventInfos} from "@/interfaces/event";
import {ThemedView} from "@/components/ThemedView";
import {ThemedText} from "@/components/ThemedText";
import {Button, StyleSheet, TouchableOpacity, View} from "react-native";

interface EventHomeCardProps {
    infos: EventInfos;
    onPress: () => void;
}

const EventHomeCard = ({infos, onPress}: EventHomeCardProps) => {

    return (
        <TouchableOpacity onPress={onPress}>
            <ThemedView style={styles.container}>
                <View style={styles.presentation}>
                    <View>
                        <ThemedText type={"subtitle"}>{infos.name}</ThemedText>
                        <ThemedText type={"defaultSemiBold"}>{infos.city}, {infos.country}</ThemedText>
                        <ThemedText type={"default"}>Petite description rapide ...</ThemedText>
                    </View>
                    <View><ThemedText>Image</ThemedText></View>
                </View>
                <View style={styles.buttonsContainer}>
                    <Button title={'Qui participe'} onPress={() => {}}/>
                    <Button title={'Participer'} onPress={() => {}}/>
                </View>
            </ThemedView>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 15,
        borderRadius: 5,
        marginBottom: 10,
    },
    presentation: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 8,
    },
    buttonsContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
    }
});

export default EventHomeCard;
