import React from 'react';
import {View} from 'react-native';
import ScreenScroll from '@/components/ux/ScreenScroll';
import {ThemedText} from '@/components/themed-text';

const PrivacyScreen = () => {
    return (
        <ScreenScroll className="" contentClassName="flex-1">
            <View className="gap-5">
                <ThemedText>
                    Découvrez comment nous protégeons vos données personnelles et comment nous utilisons vos informations.
                </ThemedText>
                {/* Contenu à ajouter */}
            </View>
        </ScreenScroll>
    );
};

export default PrivacyScreen;
