import React from 'react';
import {router} from 'expo-router';
import {Text, View} from 'react-native';
import {PagePresentation} from "@/components/ui/page-presentation";
import {useAppSelector} from '@/hooks/useRedux';
import ScreenScroll from '@/components/ux/ScreenScroll';
import {ThemedText} from '@/components/themed-text';

const FavorisScreen = () => {
    const {user, status} = useAppSelector((state) => state.auth);
    const isAuthenticated = status === 'authenticated' && user;

    const handleLogin = () => {
        router.push('/(auth)');
    };

    if (isAuthenticated) {
        return (
            <ScreenScroll className="" contentClassName="pt-24 flex-1">
                <View className="gap-5">
                    <ThemedText type="bigTitle">Favoris</ThemedText>
                    <Text className="text-gray-500 text-lg">
                        Sauvegardez vos logements préférés et retrouvez-les facilement.
                    </Text>
                    {/* TODO: Ajouter la liste des favoris ici */}
                    <Text className="text-gray-400 text-center mt-10">
                        Aucun favori pour le moment
                    </Text>
                </View>
            </ScreenScroll>
        );
    }

    return (
        <PagePresentation
            title="Favoris"
            subtitle="Connectez-vous pour voir vos favoris"
            description="Sauvegardez vos logements préférés et retrouvez-les facilement pour planifier votre prochain séjour."
            buttonText="Se connecter"
            buttonAccessibilityLabel="Se connecter pour voir les favoris"
            onButtonPress={handleLogin}
        />
    );
};

export default FavorisScreen;
