import React from 'react';
import {View, Pressable, Text} from "react-native";
import {ThemedText} from "@/components/themed-text";
import {IconSymbol} from "@/components/ui/icon-symbol";

export type PropertyType = "Maison" | "Appartement" | "Chambre d'hôtes" | "Bateau" | "Cabane" | "Caravane / Camping car" | "Hôtel" | "Villa" | null;

type Step1PropertyTypeProps = {
    selectedPropertyType: PropertyType;
    onSelectPropertyType: (type: PropertyType) => void;
};

const Step1PropertyType = ({ selectedPropertyType, onSelectPropertyType }: Step1PropertyTypeProps) => {
    const propertyTypes = [
        { label: "Maison", icon: "house.fill" },
        { label: "Appartement", icon: "building.2.fill" },
        { label: "Chambre d'hôtes", icon: "bed.double.fill" },
        { label: "Bateau", icon: "ferry.fill" },
        { label: "Cabane", icon: "tree.fill" },
        { label: "Caravane / Camping car", icon: "car.fill" },
        { label: "Hôtel", icon: "building.columns.fill" },
        { label: "Villa", icon: "house.lodge.fill" }
    ];

    return (
        <View className="gap-6">
            <View>
                <ThemedText type="subtitle" className="mb-2">
                    Quel type de logement proposez-vous ?
                </ThemedText>
                <Text className="text-gray-600 text-sm">
                    Sélectionnez le type qui correspond le mieux à votre bien
                </Text>
            </View>

            <View className="flex-row flex-wrap gap-3">
                {propertyTypes.map((type, index) => (
                    <Pressable
                        key={index}
                        onPress={() => onSelectPropertyType(type.label as PropertyType)}
                        className={`w-[48%] p-4 rounded-xl border-2 ${
                            selectedPropertyType === type.label
                                ? 'border-black bg-gray-100'
                                : 'border-gray-200 bg-white'
                        } active:opacity-70`}
                        accessibilityLabel={`Sélectionner ${type.label}`}
                    >
                        <View className="items-center gap-2">
                            <IconSymbol
                                name={type.icon}
                                size={32}
                                color={selectedPropertyType === type.label ? "#000000" : "#6b7280"}
                            />
                            <Text
                                className={`text-center font-medium text-sm ${
                                    selectedPropertyType === type.label
                                        ? 'text-black'
                                        : 'text-gray-900'
                                }`}
                            >
                                {type.label}
                            </Text>
                        </View>
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

export default Step1PropertyType;
