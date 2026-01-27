import React from 'react';
import {View, Pressable, Text} from "react-native";
import {ThemedText} from "@/components/themed-text";

type Step8DescriptionProps = {
    selectedDescriptions: string[];
    onToggleDescription: (description: string) => void;
};

type DescriptionBadgeProps = {
    label: string;
    isSelected: boolean;
    onToggle: () => void;
};

const DescriptionBadge = ({ label, isSelected, onToggle }: DescriptionBadgeProps) => {
    return (
        <Pressable
            onPress={onToggle}
            className={`px-4 py-3 rounded-full border-2 ${
                isSelected
                    ? 'border-black bg-black'
                    : 'border-gray-300 bg-white'
            } active:opacity-70`}
            accessibilityLabel={`${isSelected ? 'Désélectionner' : 'Sélectionner'} ${label}`}
        >
            <Text
                className={`text-sm font-medium ${
                    isSelected
                        ? 'text-white'
                        : 'text-gray-900'
                }`}
            >
                {label}
            </Text>
        </Pressable>
    );
};

const Step8Description = ({ selectedDescriptions, onToggleDescription }: Step8DescriptionProps) => {
    const descriptions = [
        // Ambiance
        "Paisible",
        "Chaleureux",
        "Élégant",
        "Unique",
        "Authentique",
        "Moderne",
        "Cosy",
        "Luxueux",
        // Caractéristiques
        "Spacieux",
        "Lumineux",
        "Climatisé",
        "Rénové",
        "Design",
        "Confortable",
        // Localisation
        "Central",
        "Vue panoramique",
        "Vue mer",
        "Calme",
        "Proche plages",
        "Bien situé",
        // Public cible
        "Adapté aux familles",
        "Parfait pour couples",
        "Idéal groupes",
        "Convivial",
        "Romantique",
        "Sécurisé"
    ];

    const isSelected = (description: string) => {
        return selectedDescriptions.includes(description);
    };

    return (
        <View className="gap-6">
            <View>
                <ThemedText type="subtitle" className="mb-2">
                    Décrivez les points forts de votre logement
                </ThemedText>
                <Text className="text-gray-600 text-sm">
                    Sélectionnez les caractéristiques qui décrivent le mieux votre bien (maximum 5)
                </Text>
            </View>

            {/* Compteur de sélections */}
            {selectedDescriptions.length > 0 && (
                <View className="bg-gray-100 border border-gray-200 rounded-xl p-3">
                    <Text className="text-sm text-gray-700 text-center">
                        {selectedDescriptions.length} / 5 {selectedDescriptions.length === 1 ? 'sélectionné' : 'sélectionnés'}
                    </Text>
                </View>
            )}

            {/* Badges de description */}
            <View className="flex-row flex-wrap gap-3">
                {descriptions.map((desc, index) => (
                    <DescriptionBadge
                        key={index}
                        label={desc}
                        isSelected={isSelected(desc)}
                        onToggle={() => {
                            // Limiter à 5 sélections
                            if (!isSelected(desc) && selectedDescriptions.length >= 5) {
                                return;
                            }
                            onToggleDescription(desc);
                        }}
                    />
                ))}
            </View>

            {/* Message d'aide */}
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <View className="flex-row gap-3">
                    <Text className="text-blue-900 text-xs">💡</Text>
                    <Text className="flex-1 text-sm text-blue-900 leading-5">
                        Choisissez des mots qui reflètent vraiment l'expérience que vous offrez. Ces descriptions aideront les voyageurs à mieux comprendre votre logement.
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default Step8Description;
