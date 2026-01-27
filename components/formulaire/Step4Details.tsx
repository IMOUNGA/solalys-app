import React from 'react';
import {View, Pressable, Text} from "react-native";
import {ThemedText} from "@/components/themed-text";
import {IconSymbol} from "@/components/ui/icon-symbol";

export type DetailsData = {
    voyageurs: number;
    chambres: number;
    lits: number;
    sallesDeBain: number;
};

type Step4DetailsProps = {
    detailsData: DetailsData;
    onUpdateDetails: (field: keyof DetailsData, value: number) => void;
};

type CounterItemProps = {
    label: string;
    description?: string;
    value: number;
    onIncrement: () => void;
    onDecrement: () => void;
    minValue?: number;
};

const CounterItem = ({ label, description, value, onIncrement, onDecrement, minValue = 0 }: CounterItemProps) => {
    return (
        <View className="flex-row items-center justify-between py-4 border-b border-gray-200">
            <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">{label}</Text>
                {description && (
                    <Text className="text-sm text-gray-600 mt-1">{description}</Text>
                )}
            </View>

            <View className="flex-row items-center gap-4">
                <Pressable
                    onPress={onDecrement}
                    disabled={value <= minValue}
                    className={`w-10 h-10 rounded-full border-2 items-center justify-center ${
                        value <= minValue
                            ? 'border-gray-200 bg-gray-100'
                            : 'border-gray-400 bg-white active:bg-gray-50'
                    }`}
                    accessibilityLabel={`Diminuer ${label}`}
                >
                    <IconSymbol
                        name="minus"
                        size={18}
                        color={value <= minValue ? "#d1d5db" : "#6b7280"}
                    />
                </Pressable>

                <Text className="text-lg font-semibold text-gray-900 w-8 text-center">
                    {value}
                </Text>

                <Pressable
                    onPress={onIncrement}
                    className="w-10 h-10 rounded-full border-2 border-black bg-white items-center justify-center active:bg-gray-50"
                    accessibilityLabel={`Augmenter ${label}`}
                >
                    <IconSymbol name="plus" size={18} color="#000000" />
                </Pressable>
            </View>
        </View>
    );
};

const Step4Details = ({ detailsData, onUpdateDetails }: Step4DetailsProps) => {
    const handleIncrement = (field: keyof DetailsData) => {
        onUpdateDetails(field, detailsData[field] + 1);
    };

    const handleDecrement = (field: keyof DetailsData) => {
        const minValue = field === 'voyageurs' ? 1 : 0;
        if (detailsData[field] > minValue) {
            onUpdateDetails(field, detailsData[field] - 1);
        }
    };

    return (
        <View className="gap-6">
            <View>
                <ThemedText type="subtitle" className="mb-2">
                    Informations sur le logement
                </ThemedText>
                <Text className="text-gray-600 text-sm">
                    Précisez les capacités et équipements de votre bien
                </Text>
            </View>

            <View className="bg-white rounded-xl border border-gray-200 px-5">
                <CounterItem
                    label="Voyageurs"
                    description="Nombre maximum de personnes"
                    value={detailsData.voyageurs}
                    onIncrement={() => handleIncrement('voyageurs')}
                    onDecrement={() => handleDecrement('voyageurs')}
                    minValue={1}
                />

                <CounterItem
                    label="Chambres"
                    description="Nombre de chambres disponibles"
                    value={detailsData.chambres}
                    onIncrement={() => handleIncrement('chambres')}
                    onDecrement={() => handleDecrement('chambres')}
                />

                <CounterItem
                    label="Lits"
                    description="Nombre total de lits"
                    value={detailsData.lits}
                    onIncrement={() => handleIncrement('lits')}
                    onDecrement={() => handleDecrement('lits')}
                />

                <View className="flex-row items-center justify-between py-4">
                    <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900">Salles de bain</Text>
                        <Text className="text-sm text-gray-600 mt-1">Nombre de salles de bain</Text>
                    </View>

                    <View className="flex-row items-center gap-4">
                        <Pressable
                            onPress={() => handleDecrement('sallesDeBain')}
                            disabled={detailsData.sallesDeBain <= 0}
                            className={`w-10 h-10 rounded-full border-2 items-center justify-center ${
                                detailsData.sallesDeBain <= 0
                                    ? 'border-gray-200 bg-gray-100'
                                    : 'border-gray-400 bg-white active:bg-gray-50'
                            }`}
                            accessibilityLabel="Diminuer salles de bain"
                        >
                            <IconSymbol
                                name="minus"
                                size={18}
                                color={detailsData.sallesDeBain <= 0 ? "#d1d5db" : "#6b7280"}
                            />
                        </Pressable>

                        <Text className="text-lg font-semibold text-gray-900 w-8 text-center">
                            {detailsData.sallesDeBain}
                        </Text>

                        <Pressable
                            onPress={() => handleIncrement('sallesDeBain')}
                            className="w-10 h-10 rounded-full border-2 border-black bg-white items-center justify-center active:bg-gray-50"
                            accessibilityLabel="Augmenter salles de bain"
                        >
                            <IconSymbol name="plus" size={18} color="#000000" />
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default Step4Details;
