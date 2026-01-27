import React from 'react';
import {View, Pressable, Text} from "react-native";
import {ThemedText} from "@/components/themed-text";
import {IconSymbol} from "@/components/ui/icon-symbol";

export type EquipmentsData = {
    essentiels: string[];
    horsCommun: string[];
    access: string[];
    securite: string[];
};

type Step5EquipmentsProps = {
    equipmentsData: EquipmentsData;
    onToggleEquipment: (category: keyof EquipmentsData, equipment: string) => void;
};

type EquipmentCardProps = {
    label: string;
    icon: string;
    isSelected: boolean;
    onToggle: () => void;
};

const EquipmentCard = ({ label, icon, isSelected, onToggle }: EquipmentCardProps) => {
    return (
        <Pressable
            onPress={onToggle}
            className={`w-[48%] p-4 rounded-xl border-2 ${
                isSelected
                    ? 'border-black bg-gray-100'
                    : 'border-gray-200 bg-white'
            } active:opacity-70`}
            accessibilityLabel={`${isSelected ? 'Désélectionner' : 'Sélectionner'} ${label}`}
        >
            <View className="items-center gap-2">
                <IconSymbol
                    name={icon}
                    size={28}
                    color={isSelected ? "#000000" : "#6b7280"}
                />
                <Text
                    className={`text-center font-medium text-xs ${
                        isSelected
                            ? 'text-black'
                            : 'text-gray-900'
                    }`}
                    numberOfLines={2}
                >
                    {label}
                </Text>
            </View>
        </Pressable>
    );
};

const Step5Equipments = ({ equipmentsData, onToggleEquipment }: Step5EquipmentsProps) => {
    const essentiels = [
        { label: "Wifi", icon: "wifi" },
        { label: "Télévision", icon: "tv" },
        { label: "Cuisine", icon: "fork.knife" },
        { label: "Lave-linge", icon: "washer" },
        { label: "Parking gratuit", icon: "parkingsign.circle" },
        { label: "Parking payant", icon: "parkingsign.circle.fill" },
        { label: "Climatisation", icon: "snowflake" }
    ];

    const horsCommun = [
        { label: "Piscine", icon: "water.waves" },
        { label: "Jacuzzi", icon: "humidity.fill" },
        { label: "Patio", icon: "square.grid.3x3.fill" },
        { label: "Barbecue", icon: "flame.fill" },
        { label: "Repas plein air", icon: "fork.knife.circle" },
        { label: "Brasero", icon: "flame.circle" },
        { label: "Billard", icon: "circle.grid.cross.fill" },
        { label: "Piano", icon: "music.note" },
        { label: "Fitness", icon: "figure.run" },
        { label: "Douche extérieure", icon: "shower.fill" }
    ];

    const access = [
        { label: "Lac", icon: "drop.fill" },
        { label: "Plage", icon: "beach.umbrella.fill" },
        { label: "Centre-ville", icon: "building.2.fill" },
        { label: "Nature / randonnées", icon: "tree.fill" },
        { label: "Transports", icon: "bus.fill" },
    ]

    const securite = [
        { label: "Détecteur de fumée", icon: "smoke.fill" },
        { label: "Kit premiers secours", icon: "cross.case.fill" },
        { label: "Extincteur", icon: "fire.extinguisher.fill" },
        { label: "Détecteur CO", icon: "exclamationmark.triangle.fill" }
    ];

    const isSelected = (category: keyof EquipmentsData, equipment: string) => {
        return equipmentsData[category].includes(equipment);
    };

    return (
        <View className="gap-8">
            <View>
                <ThemedText type="subtitle" className="mb-2">
                    Quels équipements proposez-vous ?
                </ThemedText>
                <Text className="text-gray-600 text-sm">
                    Sélectionnez tous les équipements disponibles dans votre logement
                </Text>
            </View>

            {/* Équipements essentiels */}
            <View className="gap-4">
                <View>
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                        Équipements essentiels
                    </Text>
                    <Text className="text-sm text-gray-600">
                        Les équipements de base de votre logement
                    </Text>
                </View>
                <View className="flex-row flex-wrap gap-3">
                    {essentiels.map((equip, index) => (
                        <EquipmentCard
                            key={index}
                            label={equip.label}
                            icon={equip.icon}
                            isSelected={isSelected('essentiels', equip.label)}
                            onToggle={() => onToggleEquipment('essentiels', equip.label)}
                        />
                    ))}
                </View>
            </View>

            {/* Équipements hors du commun */}
            <View className="gap-4">
                <View>
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                        Équipements hors du commun
                    </Text>
                    <Text className="text-sm text-gray-600">
                        Ce qui rend votre logement unique
                    </Text>
                </View>
                <View className="flex-row flex-wrap gap-3">
                    {horsCommun.map((equip, index) => (
                        <EquipmentCard
                            key={index}
                            label={equip.label}
                            icon={equip.icon}
                            isSelected={isSelected('horsCommun', equip.label)}
                            onToggle={() => onToggleEquipment('horsCommun', equip.label)}
                        />
                    ))}
                </View>
            </View>

            {/* Accès */}
            <View className="gap-4">
                <View>
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                        Accès privilégiés
                    </Text>
                    <Text className="text-sm text-gray-600">
                        Les accès qui facilitent votre séjour
                    </Text>
                </View>
                <View className="flex-row flex-wrap gap-3">
                    {access.map((equip, index) => (
                        <EquipmentCard
                            key={index}
                            label={equip.label}
                            icon={equip.icon}
                            isSelected={isSelected('access', equip.label)}
                            onToggle={() => onToggleEquipment('access', equip.label)}
                        />
                    ))}
                </View>
            </View>

            {/* Équipements de sécurité */}
            <View className="gap-4">
                <View>
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                        Équipements de sécurité
                    </Text>
                    <Text className="text-sm text-gray-600">
                        Pour la sécurité de vos voyageurs
                    </Text>
                </View>
                <View className="flex-row flex-wrap gap-3">
                    {securite.map((equip, index) => (
                        <EquipmentCard
                            key={index}
                            label={equip.label}
                            icon={equip.icon}
                            isSelected={isSelected('securite', equip.label)}
                            onToggle={() => onToggleEquipment('securite', equip.label)}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
};

export default Step5Equipments;
