import React from 'react';
import {View, TextInput, Text} from "react-native";
import {ThemedText} from "@/components/themed-text";
import {IconSymbol} from "@/components/ui/icon-symbol";

type Step10WeekPriceProps = {
    price: string;
    onUpdatePrice: (price: string) => void;
};

const Step10WeekPrice = ({ price, onUpdatePrice }: Step10WeekPriceProps) => {
    const handlePriceChange = (text: string) => {
        // Ne garder que les chiffres
        const numericValue = text.replace(/[^0-9]/g, '');
        onUpdatePrice(numericValue);
    };

    const formatPrice = (value: string) => {
        if (!value) return '';
        // Ajouter des espaces tous les 3 chiffres
        return value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    return (
        <View className="gap-8">
            <View>
                <ThemedText type="subtitle" className="mb-2 text-center">
                    Quel est votre tarif en semaine ?
                </ThemedText>
                <Text className="text-gray-600 text-sm text-center">
                    Tarif par nuit du lundi au jeudi
                </Text>
            </View>

            {/* Zone de prix centrée */}
            <View className="items-center gap-4">
                <View className="bg-white border-2 border-gray-300 rounded-2xl p-8 w-full items-center">
                    <View className="flex-row items-center justify-center gap-2">
                        <TextInput
                            className="text-4xl font-bold text-gray-900 text-center min-w-[150px]"
                            placeholder="0"
                            value={formatPrice(price)}
                            onChangeText={handlePriceChange}
                            keyboardType="numeric"
                            placeholderTextColor="#d1d5db"
                        />
                        <Text className="text-2xl font-semibold text-gray-700">
                            FCFA
                        </Text>
                    </View>
                    <Text className="text-sm text-gray-500 mt-2">
                        par nuit
                    </Text>
                </View>

                {/* Aperçu du prix */}
                {price && parseInt(price) > 0 && (
                    <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 w-full">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-sm text-blue-900">
                                Prix pour 7 nuits
                            </Text>
                            <Text className="text-base font-semibold text-blue-900">
                                {formatPrice((parseInt(price) * 7).toString())} FCFA
                            </Text>
                        </View>
                        <View className="flex-row justify-between items-center mt-2">
                            <Text className="text-sm text-blue-900">
                                Prix pour 30 nuits
                            </Text>
                            <Text className="text-base font-semibold text-blue-900">
                                {formatPrice((parseInt(price) * 30).toString())} FCFA
                            </Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Conseils */}
            <View className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <View className="flex-row items-start gap-3 mb-3">
                    <IconSymbol name="lightbulb.fill" size={20} color="#6b7280" />
                    <Text className="flex-1 text-sm font-semibold text-gray-900">
                        Conseils de tarification
                    </Text>
                </View>
                <View className="gap-2 pl-8">
                    <Text className="text-sm text-gray-700">
                        • Recherchez les prix des logements similaires dans votre zone
                    </Text>
                    <Text className="text-sm text-gray-700">
                        • Tenez compte de vos équipements et services
                    </Text>
                    <Text className="text-sm text-gray-700">
                        • Vous pourrez ajuster vos tarifs à tout moment
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default Step10WeekPrice;
