import {Tabs} from 'expo-router';
import React from 'react';
import {StackActions} from '@react-navigation/native';

import {HapticTab} from '@/components/haptic-tab';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {Colors} from '@/constants/theme';
import {useColorScheme} from '@/hooks/use-color-scheme';

// Retaper sur l'onglet déjà actif ramène à l'écran principal de la section
// (pop-to-top de sa pile interne) plutôt que de rester sur l'écran où on a
// navigué. Appliqué à chaque onglet via `listeners` ci-dessous.
const resetOnPress = ({navigation, route}: any) => ({
    tabPress: (e: any) => {
        const state = navigation.getState();
        const tabRoute = state.routes.find((r: any) => r.name === route.name);
        const isFocused = state.routes[state.index]?.key === tabRoute?.key;
        if (isFocused && tabRoute?.state && tabRoute.state.index > 0) {
            e.preventDefault();
            navigation.dispatch({
                ...StackActions.popToTop(),
                target: tabRoute.state.key,
            });
        }
    },
});

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#000000', // Noir pour l'onglet actif
                tabBarInactiveTintColor: '#8E8E93', // Gris pour les onglets inactifs
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarStyle: {
                    backgroundColor: 'rgb(255, 255, 255)',
                },
            }}>
            <Tabs.Screen
                name="(trouver)"
                options={{
                    title: 'Trouver',
                    tabBarIcon: ({color}) => <IconSymbol size={28} name="magnifyingglass" color={color}/>,
                }}
                listeners={resetOnPress}
            />
            <Tabs.Screen
                name="(events)"
                options={{
                    title: 'Mes évènements',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
                }}
                listeners={resetOnPress}
            />
            <Tabs.Screen
                name="(groupes)"
                options={{
                    title: 'Groupes',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="airplane.circle" color={color} />,
                }}
                listeners={resetOnPress}
            />
            {/*<Tabs.Screen
                name="(messages)"
                options={{
                    title: 'Messages',
                    headerShown: false,
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="message" color={color} />,
                }}
            />*/}
            <Tabs.Screen
                name="(compte)"
                options={{
                    title: 'Compte',
                    headerShown: false,
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle" color={color} />,
                }}
                listeners={resetOnPress}
            />
        </Tabs>
    );
}
