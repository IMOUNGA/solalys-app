import {Tabs} from 'expo-router';
import React from 'react';

import {HapticTab} from '@/components/haptic-tab';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {Colors} from '@/constants/theme';
import {useColorScheme} from '@/hooks/use-color-scheme';

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
                name="(found)"
                options={{
                    title: 'Trouver',
                    tabBarIcon: ({color}) => <IconSymbol size={28} name="magnifyingglass" color={color}/>,
                }}
            />
            <Tabs.Screen
                name="(events)"
                options={{
                    title: 'Mes évènements',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart" color={color} />,
                }}
            />
            <Tabs.Screen
                name="(groupes)"
                options={{
                    title: 'Groupes',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="airplane.circle" color={color} />,
                }}
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
            />
        </Tabs>
    );
}
