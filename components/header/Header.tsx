import React from 'react';
import {StyleSheet, View, Text, SafeAreaView, FlatList} from "react-native";
import {ThemedText} from "@/components/ThemedText";
import {ThemedView} from "@/components/ThemedView";
import {IconSymbol} from "@/components/ui/IconSymbol";

const Header = () => {
    const newNotification = false;
    const tabsItems = [
        'Accueil',
        'Mes évènements',
        'Paramètres'
    ]

    return (
        <>
            <ThemedView style={styles.containerTitle}>
                <ThemedText style={styles.text}>Bonjour</ThemedText>
                {
                    newNotification
                        ? <IconSymbol size={28} name="bell.badge.fill" color={'#fff'}/>
                        : <IconSymbol size={28} name="bell.fill" color={'#fff'}/>
                }
            </ThemedView>
            {/*<ThemedView style={styles.containerListItems}>
                <FlatList
                    data={tabsItems}
                    horizontal={true}
                    renderItem={item => (
                    <ThemedView >
                        <ThemedText>{item.item}</ThemedText>
                    </ThemedView>
                )}/>
            </ThemedView>*/}
        </>

    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderStyle: 'solid',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
    },
    containerTitle: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        padding: 20,
    },
    text: {
        fontSize: 24
    },
    /*containerListItems: {
        display: 'flex',
        justifyContent: 'flex-end',
        height: '50%',
        //paddingHorizontal: 20,
    },
    containerItem: {
        padding: 3,
        //backgroundColor: '#f1f1f1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    }*/
})

export default Header;
