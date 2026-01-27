import React from 'react';
import {router} from 'expo-router';
import {Text, View} from 'react-native';
import {PagePresentation} from "@/components/ui/page-presentation";
import {useAppSelector} from '@/hooks/useRedux';
import ScreenScroll from '@/components/ux/ScreenScroll';
import {ThemedText} from '@/components/themed-text';

const ReservationsScreen = () => {
    const {user, status} = useAppSelector((state) => state.auth);
    const isAuthenticated = status === 'authenticated' && user;

    const handleLogin = () => {
        router.push('/(auth)');
    };

    if (isAuthenticated) {
        return (
            <ScreenScroll className="" contentClassName="pt-24 flex-1">
                <View className="gap-5">
                    <ThemedText type="bigTitle">Réservations</ThemedText>
                    <Text className="text-gray-500 text-lg">
                        Gérez toutes vos réservations passées et à venir en un seul endroit.
                    </Text>
                    {/* TODO: Ajouter la liste des réservations ici */}
                    <Text className="text-gray-400 text-center mt-10">
                        Aucune réservation pour le moment
                    </Text>
                </View>
            </ScreenScroll>
        );
    }

    return (
        <PagePresentation
            title="Réservations"
            subtitle="Connectez-vous pour voir vos réservations"
            description="Gérez toutes vos réservations passées et à venir en un seul endroit. Planifiez vos prochaines destinations en toute simplicité."
            buttonText="Se connecter"
            buttonAccessibilityLabel="Se connecter pour voir les réservations"
            onButtonPress={handleLogin}
        />
    );
};

export default ReservationsScreen;
