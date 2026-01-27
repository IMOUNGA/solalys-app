import React, {useState, useEffect} from 'react';
import {View, TextInput, Text} from "react-native";
import Slider from '@react-native-community/slider';
import {ThemedText} from "@/components/themed-text";
import {IconSymbol} from "@/components/ui/icon-symbol";

type Step11WeekendPriceProps = {
    price: string;
    weekPrice: string;
    onUpdatePrice: (price: string) => void;
};

const Step11WeekendPrice = ({ price, weekPrice, onUpdatePrice }: Step11WeekendPriceProps) => {
    const [percentage, setPercentage] = useState(3);

    useEffect(() => {
        // Si pas de prix week-end défini mais qu'on a un prix semaine, initialiser avec +3%
        if (!price && weekPrice && parseInt(weekPrice) > 0) {
            const initialPrice = Math.round(parseInt(weekPrice) * 1.03);
            onUpdatePrice(initialPrice.toString());
            setPercentage(3);
        }
        // Sinon, calculer le pourcentage actuel si un prix est déjà défini
        else if (price && weekPrice && parseInt(weekPrice) > 0) {
            const currentPercentage = ((parseInt(price) - parseInt(weekPrice)) / parseInt(weekPrice)) * 100;
            setPercentage(Math.round(currentPercentage));
        }
    }, [weekPrice]);

    const handlePercentageChange = (value: number) => {
        setPercentage(Math.round(value));
        if (weekPrice && parseInt(weekPrice) > 0) {
            const calculatedPrice = Math.round(parseInt(weekPrice) * (1 + value / 100));
            onUpdatePrice(calculatedPrice.toString());
        }
    };

    const handlePriceChange = (text: string) => {
        // Ne garder que les chiffres
        const numericValue = text.replace(/[^0-9]/g, '');
        onUpdatePrice(numericValue);

        // Recalculer le pourcentage
        if (numericValue && weekPrice && parseInt(weekPrice) > 0) {
            const newPercentage = ((parseInt(numericValue) - parseInt(weekPrice)) / parseInt(weekPrice)) * 100;
            setPercentage(Math.round(newPercentage));
        }
    };

    const formatPrice = (value: string) => {
        if (!value) return '';
        // Ajouter des espaces tous les 3 chiffres
        return value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    const basePrice = weekPrice && parseInt(weekPrice) > 0 ? parseInt(weekPrice) : 0;
    const suggestedPrice = Math.round(basePrice * 1.03);

    return (
        <View className="gap-8">
            <View>
                <ThemedText type="subtitle" className="mb-2 text-center">
                    Quel est votre tarif week-end ?
                </ThemedText>
                <Text className="text-gray-600 text-sm text-center">
                    Tarif par nuit du vendredi au dimanche
                </Text>
            </View>

            {/* Conseil 3% */}
            {basePrice > 0 && (
                <View className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <View className="flex-row items-start gap-3">
                        <Text className="text-green-900 text-lg">💡</Text>
                        <View className="flex-1">
                            <Text className="text-sm font-semibold text-green-900 mb-1">
                                Conseil : Augmentez de 3%
                            </Text>
                            <Text className="text-sm text-green-800 leading-5">
                                Une légère augmentation de 3% pour le week-end est recommandée. Cela représente {formatPrice(suggestedPrice.toString())} FCFA par nuit.
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Slider de pourcentage */}
            {basePrice > 0 && (
                <View className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <Text className="text-sm font-semibold text-gray-900 mb-3 text-center">
                        Ajustement par rapport au tarif semaine
                    </Text>
                    <View className="items-center mb-3">
                        <Text className="text-3xl font-bold text-blue-600">
                            {percentage > 0 ? '+' : ''}{percentage}%
                        </Text>
                    </View>
                    <Slider
                        style={{width: '100%', height: 40}}
                        minimumValue={-20}
                        maximumValue={50}
                        step={1}
                        value={percentage}
                        onValueChange={handlePercentageChange}
                        minimumTrackTintColor="#000000"
                        maximumTrackTintColor="#d1d5db"
                        thumbTintColor="#000000"
                    />
                    <View className="flex-row justify-between mt-2">
                        <Text className="text-xs text-gray-600">-20%</Text>
                        <Text className="text-xs text-gray-600">+50%</Text>
                    </View>
                </View>
            )}

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
                                Prix pour un week-end (3 nuits)
                            </Text>
                            <Text className="text-base font-semibold text-blue-900">
                                {formatPrice((parseInt(price) * 3).toString())} FCFA
                            </Text>
                        </View>
                        <View className="flex-row justify-between items-center mt-2">
                            <Text className="text-sm text-blue-900">
                                Prix pour 4 week-ends (12 nuits)
                            </Text>
                            <Text className="text-base font-semibold text-blue-900">
                                {formatPrice((parseInt(price) * 12).toString())} FCFA
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
                        • Les week-ends ont généralement une demande plus forte
                    </Text>
                    <Text className="text-sm text-gray-700">
                        • Vous pouvez pratiquer un tarif légèrement supérieur
                    </Text>
                    <Text className="text-sm text-gray-700">
                        • Adaptez vos prix selon la saisonnalité
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default Step11WeekendPrice;
