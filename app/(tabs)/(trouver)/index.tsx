import React from 'react';
import {router} from 'expo-router';
import {Text, View} from 'react-native';
import {PagePresentation} from '@/components/ui/page-presentation';
import {useAppSelector} from '@/hooks/useRedux';
import ScreenScroll from '@/components/ux/ScreenScroll';
import {ThemedText} from '@/components/themed-text';

const ExplorerScreen = () => {
    const {user, status} = useAppSelector((state) => state.auth);
    const isAuthenticated = status === 'authenticated' && user;

    const handleSearch = () => {
        // TODO: Implémenter la recherche de logements
        console.log('Recherche de logements...');
    };

    const handleAuthSearch = () => {
        router.push('/(auth)');
    };

    if (isAuthenticated) {
        return (
            <ScreenScroll className="" contentClassName="pt-24 flex-1">
                <View className="gap-5">
                    <ThemedText type="bigTitle">Explorer</ThemedText>
                    <Text className="text-gray-500 text-lg">
                        Découvrez des logements pour votre prochain séjour.
                    </Text>
                    {/* TODO: Ajouter le module de recherche et la liste des logements ici */}
                    <Text className="text-gray-400 text-center mt-10">
                        Module de recherche à venir
                    </Text>
                </View>
            </ScreenScroll>
        );
    }

    return (
        <PagePresentation
            title="Explorer"
            subtitle="Commencez vos recherches pour votre prochaine destination."
            description="Vous pouvez dès maintenant commencer à chercher votre logement pour votre prochain séjour."
            buttonText="Rechercher"
            buttonAccessibilityLabel="rechercher un logement"
            onButtonPress={handleAuthSearch}
        />
    );
};

export default ExplorerScreen;
