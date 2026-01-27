import React from 'react';
import {View, Pressable, Text} from "react-native";
import {ThemedText} from "@/components/themed-text";
import {IconSymbol} from "@/components/ui/icon-symbol";

export type AccommodationType = "Logement entier" | "Chambre privée" | "Chambre partagée" | null;

type Step2AccommodationTypeProps = {
    selectedAccommodationType: AccommodationType;
    onSelectAccommodationType: (type: AccommodationType) => void;
};

const Step2AccommodationType = ({ selectedAccommodationType, onSelectAccommodationType }: Step2AccommodationTypeProps) => {
    const accommodationTypes = [
        {
            label: "Logement entier",
            icon: "house.fill",
            description: "Les voyageurs auront tout le logement pour eux seuls"
        },
        {
            label: "Chambre privée",
            icon: "door.left.hand.closed",
            description: "Les voyageurs disposent d'une chambre privée mais partagent certains espaces"
        },
        {
            label: "Chambre partagée",
            icon: "person.2.fill",
            description: "Les voyageurs dorment dans une chambre partagée avec d'autres personnes"
        }
    ];

    return (
        <View className="gap-6">
            <View>
                <ThemedText type="subtitle" className="mb-2">
                    Quel type de logement proposez-vous ?
                </ThemedText>
                <Text className="text-gray-600 text-sm">
                    Sélectionnez la configuration de votre bien
                </Text>
            </View>

            <View className="gap-4">
                {accommodationTypes.map((type, index) => (
                    <Pressable
                        key={index}
                        onPress={() => onSelectAccommodationType(type.label as AccommodationType)}
                        className={`p-5 rounded-xl border-2 ${
                            selectedAccommodationType === type.label
                                ? 'border-black bg-gray-100'
                                : 'border-gray-200 bg-white'
                        } active:opacity-70`}
                        accessibilityLabel={`Sélectionner ${type.label}`}
                    >
                        <View className="flex-row items-center gap-4">
                            <View className="items-center justify-center">
                                <IconSymbol
                                    name={type.icon}
                                    size={28}
                                    color={selectedAccommodationType === type.label ? "#000000" : "#6b7280"}
                                />
                            </View>
                            <View className="flex-1">
                                <Text
                                    className={`font-semibold text-base mb-1 ${
                                        selectedAccommodationType === type.label
                                            ? 'text-black'
                                            : 'text-gray-900'
                                    }`}
                                >
                                    {type.label}
                                </Text>
                                <Text className="text-sm text-gray-600 leading-5">
                                    {type.description}
                                </Text>
                            </View>
                        </View>
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

export default Step2AccommodationType;
