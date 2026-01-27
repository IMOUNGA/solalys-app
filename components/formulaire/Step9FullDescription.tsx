import React from 'react';
import {View, TextInput, Text} from "react-native";
import {ThemedText} from "@/components/themed-text";
import {IconSymbol} from "@/components/ui/icon-symbol";

type Step9FullDescriptionProps = {
    description: string;
    onUpdateDescription: (description: string) => void;
};

const Step9FullDescription = ({ description, onUpdateDescription }: Step9FullDescriptionProps) => {
    const minLength = 200;
    const currentLength = description.length;
    const remainingChars = minLength - currentLength;
    const hasReachedMin = currentLength >= minLength;

    return (
        <View className="gap-6">
            <View>
                <ThemedText type="subtitle" className="mb-2">
                    Décrivez votre logement
                </ThemedText>
                <Text className="text-gray-600 text-sm">
                    Donnez envie aux voyageurs de réserver en décrivant votre logement de manière détaillée (minimum 200 caractères)
                </Text>
            </View>

            {/* Champ de saisie de la description */}
            <View className="gap-2">
                <TextInput
                    className={`bg-white border-2 ${
                        currentLength > 0 && !hasReachedMin
                            ? 'border-orange-300'
                            : hasReachedMin
                            ? 'border-green-300'
                            : 'border-gray-300'
                    } rounded-xl px-4 py-4 text-gray-900 text-base min-h-[200px]`}
                    placeholder="Décrivez votre logement : son ambiance, ses équipements, son environnement, ce qui le rend unique..."
                    value={description}
                    onChangeText={onUpdateDescription}
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={10}
                    textAlignVertical="top"
                />
                <View className="flex-row justify-between items-center px-1">
                    <Text className={`text-sm font-medium ${
                        hasReachedMin ? 'text-green-600' : currentLength > 0 ? 'text-orange-600' : 'text-gray-500'
                    }`}>
                        {currentLength} / {minLength} caractères minimum
                    </Text>
                    {!hasReachedMin && currentLength > 0 && (
                        <Text className="text-sm text-orange-600">
                            Encore {remainingChars} caractères
                        </Text>
                    )}
                    {hasReachedMin && (
                        <View className="flex-row items-center gap-1">
                            <IconSymbol name="checkmark.circle.fill" size={16} color="#16a34a" />
                            <Text className="text-sm text-green-600 font-medium">
                                Objectif atteint
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Conseils */}
            <View className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <View className="flex-row items-start gap-3 mb-3">
                    <IconSymbol name="lightbulb.fill" size={20} color="#6b7280" />
                    <Text className="flex-1 text-sm font-semibold text-gray-900">
                        Comment rédiger une bonne description ?
                    </Text>
                </View>
                <View className="gap-2 pl-8">
                    <Text className="text-sm text-gray-700">
                        • Décrivez l'ambiance et le style de votre logement
                    </Text>
                    <Text className="text-sm text-gray-700">
                        • Mentionnez les équipements et services disponibles
                    </Text>
                    <Text className="text-sm text-gray-700">
                        • Parlez du quartier et des attractions à proximité
                    </Text>
                    <Text className="text-sm text-gray-700">
                        • Soyez honnête et précis dans vos descriptions
                    </Text>
                    <Text className="text-sm text-gray-700">
                        • Évoquez l'expérience que vivront vos voyageurs
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default Step9FullDescription;
