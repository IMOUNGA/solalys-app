import React from 'react';
import {View} from 'react-native';
import ScreenScroll from '@/components/ux/ScreenScroll';
import {ThemedText} from '@/components/themed-text';

const AccountSettingsScreen = () => {
    return (
        <ScreenScroll className="" contentClassName="flex-1">
            <View className="gap-5">
                <ThemedText>
                    Gérez vos informations personnelles, vos préférences et vos paramètres de compte.
                </ThemedText>
                {/* Contenu à ajouter */}
            </View>
        </ScreenScroll>
    );
};

export default AccountSettingsScreen;
