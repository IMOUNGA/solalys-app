import React from 'react';
import {View, Text, TextInput, Pressable} from "react-native";
import {ThemedText} from "@/components/themed-text";
import {IconSymbol} from "@/components/ui/icon-symbol";

export type HostInfoData = {
    address: string;
    postalCode: string;
    city: string;
    isCompany: boolean;
};

type Step13HostInfoProps = {
    hostInfo: HostInfoData;
    onUpdateHostInfo: (field: keyof HostInfoData, value: string | boolean) => void;
};

const Step13HostInfo = ({ hostInfo, onUpdateHostInfo }: Step13HostInfoProps) => {
    return (
        <View className="gap-6">
            <View>
                <ThemedText type="subtitle" className="mb-2">
                    Informations sur votre résidence
                </ThemedText>
                <Text className="text-gray-600 text-sm">
                    Indiquez votre adresse principale et le cadre de votre activité
                </Text>
            </View>

            <View className="gap-4">
                {/* Pays (fixe) */}
                <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                        Pays
                    </Text>
                    <View className="bg-gray-100 p-4 rounded-xl border border-gray-200">
                        <Text className="text-gray-900 font-medium">Côte d'Ivoire</Text>
                    </View>
                </View>

                {/* Adresse principale */}
                <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                        Adresse principale <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                        className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                        placeholder="Ex: 15 Boulevard de la République"
                        value={hostInfo.address}
                        onChangeText={(text) => onUpdateHostInfo('address', text)}
                        placeholderTextColor="#9ca3af"
                    />
                </View>

                {/* Code postal */}
                <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                        Code postal
                    </Text>
                    <TextInput
                        className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                        placeholder="Ex: 00225"
                        value={hostInfo.postalCode}
                        onChangeText={(text) => onUpdateHostInfo('postalCode', text)}
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                    />
                </View>

                {/* Ville */}
                <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                        Ville <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                        className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                        placeholder="Ex: Abidjan"
                        value={hostInfo.city}
                        onChangeText={(text) => onUpdateHostInfo('city', text)}
                        placeholderTextColor="#9ca3af"
                    />
                </View>

                {/* Cadre d'activité */}
                <View className="mt-4">
                    <Text className="text-sm font-medium text-gray-700 mb-3">
                        Cadre de votre activité
                    </Text>
                    <Pressable
                        onPress={() => onUpdateHostInfo('isCompany', !hostInfo.isCompany)}
                        className="bg-white border-2 border-gray-200 rounded-xl p-4 active:bg-gray-50"
                        accessibilityLabel="Hôte dans le cadre d'une entreprise"
                    >
                        <View className="flex-row items-start gap-4">
                            <View
                                className={`w-6 h-6 rounded border-2 items-center justify-center mt-0.5 ${
                                    hostInfo.isCompany
                                        ? 'bg-black border-black'
                                        : 'bg-white border-gray-400'
                                }`}
                            >
                                {hostInfo.isCompany && (
                                    <IconSymbol name="checkmark" size={14} color="#fff" />
                                )}
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-semibold text-gray-900 mb-1">
                                    Je suis hôte dans le cadre d'une entreprise
                                </Text>
                                <Text className="text-sm text-gray-600 leading-5">
                                    Cochez cette case si vous proposez ce logement en tant que professionnel ou entreprise
                                </Text>
                            </View>
                        </View>
                    </Pressable>
                </View>
            </View>

            {/* Information */}
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <View className="flex-row gap-3">
                    <IconSymbol name="info.circle.fill" size={20} color="#3b82f6" />
                    <View className="flex-1">
                        <Text className="text-sm text-blue-900 leading-5">
                            Ces informations sont confidentielles et ne seront pas partagées avec les voyageurs. Elles sont nécessaires pour la conformité réglementaire.
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default Step13HostInfo;
