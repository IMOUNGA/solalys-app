import React from 'react';
import {View} from 'react-native';
import ScreenScroll from '@/components/ux/ScreenScroll';
import {ThemedText} from '@/components/themed-text';

const SupportScreen = () => {
    return (
        <ScreenScroll className="" contentClassName="flex-1">
            <View className="gap-5">
                <ThemedText>
                    Besoin d&apos;aide ? Consultez notre centre d&apos;aide ou contactez notre équipe de support.
                </ThemedText>
                {/* Contenu à ajouter */}
            </View>
        </ScreenScroll>
    );
};

export default SupportScreen;
