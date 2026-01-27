import React from 'react';
import {View, Text, TextInput} from "react-native";
import {ThemedText} from "@/components/themed-text";

export type AddressData = {
    batiment?: string;
    appartement?: string;
    residence?: string;
    etage?: string;
    nomBatiment?: string;
    numeroVoie: string;
    codePostal: string;
    commune: string;
};

type Step3AddressProps = {
    addressData: AddressData;
    onUpdateAddress: (field: keyof AddressData, value: string) => void;
};

const Step3Address = ({ addressData, onUpdateAddress }: Step3AddressProps) => {
    return (
        <View className="gap-6">
            <View>
                <ThemedText type="subtitle" className="mb-2">
                    Où est situé le logement ?
                </ThemedText>
                <Text className="text-gray-600 text-sm">
                    Renseignez l'adresse complète de votre bien
                </Text>
            </View>

            <View className="gap-4">
                {/* Pays */}
                <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                        Pays
                    </Text>
                    <View className="bg-gray-100 p-4 rounded-xl border border-gray-200">
                        <Text className="text-gray-900 font-medium">Côte d'Ivoire</Text>
                    </View>
                </View>

                {/* Bâtiment, Appartement, Résidence, Étage - Optional */}
                <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                        Bâtiment, Appartement, Résidence, Étage <Text className="text-gray-400">(optionnel)</Text>
                    </Text>
                    <View className="flex-row gap-2">
                        <TextInput
                            className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                            placeholder="Bât."
                            value={addressData.batiment}
                            onChangeText={(text) => onUpdateAddress('batiment', text)}
                            placeholderTextColor="#9ca3af"
                        />
                        <TextInput
                            className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                            placeholder="Appt."
                            value={addressData.appartement}
                            onChangeText={(text) => onUpdateAddress('appartement', text)}
                            placeholderTextColor="#9ca3af"
                        />
                        <TextInput
                            className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                            placeholder="Rés."
                            value={addressData.residence}
                            onChangeText={(text) => onUpdateAddress('residence', text)}
                            placeholderTextColor="#9ca3af"
                        />
                        <TextInput
                            className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                            placeholder="Ét."
                            value={addressData.etage}
                            onChangeText={(text) => onUpdateAddress('etage', text)}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                </View>

                {/* Nom du bâtiment - Optional */}
                <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                        Nom du bâtiment <Text className="text-gray-400">(optionnel)</Text>
                    </Text>
                    <TextInput
                        className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                        placeholder="Ex: Résidence Les Cocotiers"
                        value={addressData.nomBatiment}
                        onChangeText={(text) => onUpdateAddress('nomBatiment', text)}
                        placeholderTextColor="#9ca3af"
                    />
                </View>

                {/* Numéro et libellé de voie */}
                <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                        Numéro et libellé de voie <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                        className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                        placeholder="Ex: 15 Boulevard de la République"
                        value={addressData.numeroVoie}
                        onChangeText={(text) => onUpdateAddress('numeroVoie', text)}
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
                        value={addressData.codePostal}
                        onChangeText={(text) => onUpdateAddress('codePostal', text)}
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                    />
                </View>

                {/* Commune */}
                <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                        Commune <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                        className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                        placeholder="Ex: Cocody"
                        value={addressData.commune}
                        onChangeText={(text) => onUpdateAddress('commune', text)}
                        placeholderTextColor="#9ca3af"
                    />
                </View>
            </View>
        </View>
    );
};

export default Step3Address;
