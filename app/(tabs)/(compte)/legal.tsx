import React from 'react';
import {View} from 'react-native';
import ScreenScroll from '@/components/ux/ScreenScroll';
import {ThemedText} from '@/components/themed-text';

const LegalScreen = () => {
    return (
        <ScreenScroll className="" contentClassName="flex-1">
            <View className="gap-5">
                <ThemedText>
                    Consultez nos conditions d&apos;utilisation et nos mentions légales.
                </ThemedText>
                {/* Contenu à ajouter */}
            </View>
        </ScreenScroll>
    );
};

export default LegalScreen;
