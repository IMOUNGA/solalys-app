import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {ThemedText} from '@/components/themed-text';
import ScreenScroll from '@/components/ux/ScreenScroll';

type PagePresentationProps = {
    /** Titre principal de la page */
    title: string;
    /** Sous-titre en gras (optionnel) */
    subtitle?: string;
    /** Description en texte gris (optionnel) */
    description?: string;
    /** Texte du bouton d'action (optionnel) */
    buttonText?: string;
    /** Action au clic du bouton (optionnel) */
    onButtonPress?: () => void;
    /** Label d'accessibilité du bouton (optionnel) */
    buttonAccessibilityLabel?: string;
    /** Largeur du bouton - par défaut "w-1/2" */
    buttonWidth?: string;
    /** Contenu personnalisé additionnel */
    children?: React.ReactNode;
    /** Espacement entre les éléments - par défaut "gap-10" */
    spacing?: string;
};

export const PagePresentation = ({
    title,
    subtitle,
    description,
    buttonText,
    onButtonPress,
    buttonAccessibilityLabel,
    buttonWidth = 'w-1/2',
    children,
    spacing = 'gap-10',
}: PagePresentationProps) => {
    return (
        <ScreenScroll className="" contentClassName="pt-24 flex-1">
            <View className={spacing}>
                {/* Titre principal */}
                <ThemedText type="bigTitle">{title}</ThemedText>

                {/* Bloc de texte (subtitle + description) */}
                {(subtitle || description) && (
                    <View className="gap-2">
                        {subtitle && (
                            <Text className="font-bold text-xl">{subtitle}</Text>
                        )}
                        {description && (
                            <Text className="text-gray-500 text-lg">{description}</Text>
                        )}
                    </View>
                )}

                {/* Bouton d'action */}
                {buttonText && onButtonPress && (
                    <Pressable
                        className={`bg-black py-3 px-6 rounded-lg ${buttonWidth}`}
                        accessibilityLabel={buttonAccessibilityLabel || buttonText}
                        onPress={onButtonPress}
                    >
                        <Text className="text-white text-center font-semibold text-lg">
                            {buttonText}
                        </Text>
                    </Pressable>
                )}

                {/* Contenu personnalisé */}
                {children}
            </View>
        </ScreenScroll>
    );
};
