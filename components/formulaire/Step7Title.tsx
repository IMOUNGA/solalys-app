import React from 'react';
import {View, TextInput, Text} from "react-native";
import {ThemedText} from "@/components/themed-text";
import {IconSymbol} from "@/components/ui/icon-symbol";

type Step7TitleProps = {
    title: string;
    onUpdateTitle: (title: string) => void;
};

const Step7Title = ({ title, onUpdateTitle }: Step7TitleProps) => {
    const maxLength = 50;
    const remainingChars = maxLength - title.length;

    return (
        <View className="gap-6">
            <View>
                <ThemedText type="subtitle" className="mb-2">
                    Donnez un titre à votre annonce
                </ThemedText>
                <Text className="text-gray-600 text-sm">
                    Les titres courts sont généralement les plus efficaces. Vous pourrez le modifier ultérieurement.
                </Text>
            </View>

            {/* Champ de saisie du titre */}
            <View className="gap-2">
                <TextInput
                    className="bg-white border-2 border-gray-300 rounded-xl px-4 py-4 text-gray-900 text-base"
                    placeholder="Ex: Villa moderne avec piscine"
                    value={title}
                    onChangeText={onUpdateTitle}
                    placeholderTextColor="#9ca3af"
                    maxLength={maxLength}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                />
                <View className="flex-row justify-between items-center px-1">
                    <Text className="text-xs text-gray-500">
                        {title.length} / {maxLength} caractères
                    </Text>
                    <Text className={`text-xs ${remainingChars < 10 ? 'text-orange-600' : 'text-gray-500'}`}>
                        {remainingChars} restants
                    </Text>
                </View>
            </View>

            {/* Conseils */}
            <View className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <View className="flex-row items-start gap-3 mb-3">
                    <IconSymbol name="lightbulb.fill" size={20} color="#6b7280" />
                    <Text className="flex-1 text-sm font-semibold text-gray-900">
                        Conseils pour un titre efficace
                    </Text>
                </View>
                <View className="gap-2 pl-8">
                    <Text className="text-sm text-gray-700">
                        • Restez concis : les titres courts attirent plus l'attention
                    </Text>
                    <Text className="text-sm text-gray-700">
                        • Mentionnez le type de logement
                    </Text>
                    <Text className="text-sm text-gray-700">
                        • Mettez en avant 1 ou 2 points forts maximum
                    </Text>
                    <Text className="text-sm text-gray-700">
                        • Évitez les majuscules excessives
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default Step7Title;
