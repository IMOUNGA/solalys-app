import React from 'react';
import {View, Pressable, Text} from "react-native";
import {ThemedText} from "@/components/themed-text";
import {IconSymbol} from "@/components/ui/icon-symbol";

export type SecurityData = {
    cameras: boolean;
    noiseSensors: boolean;
    weapons: boolean;
    dangerousAnimals: boolean;
};

type Step12SecurityProps = {
    securityData: SecurityData;
    onToggleSecurity: (field: keyof SecurityData) => void;
};

type CheckboxItemProps = {
    label: string;
    description: string;
    isChecked: boolean;
    onToggle: () => void;
    warning?: boolean;
};

const CheckboxItem = ({ label, description, isChecked, onToggle, warning }: CheckboxItemProps) => {
    return (
        <Pressable
            onPress={onToggle}
            className={`bg-white border-2 ${
                warning && isChecked ? 'border-orange-300' : 'border-gray-200'
            } rounded-xl p-4 active:bg-gray-50`}
            accessibilityLabel={`${isChecked ? 'Décocher' : 'Cocher'} ${label}`}
        >
            <View className="flex-row items-start gap-4">
                <View
                    className={`w-6 h-6 rounded border-2 items-center justify-center mt-0.5 ${
                        isChecked
                            ? 'bg-black border-black'
                            : 'bg-white border-gray-400'
                    }`}
                >
                    {isChecked && (
                        <IconSymbol name="checkmark" size={14} color="#fff" />
                    )}
                </View>
                <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                        {label}
                    </Text>
                    <Text className="text-sm text-gray-600 leading-5">
                        {description}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
};

const Step12Security = ({ securityData, onToggleSecurity }: Step12SecurityProps) => {
    return (
        <View className="gap-6">
            <View>
                <ThemedText type="subtitle" className="mb-2">
                    Informations de sécurité
                </ThemedText>
                <Text className="text-gray-600 text-sm">
                    Informez vos voyageurs de la présence d'appareils ou d'éléments de sécurité
                </Text>
            </View>

            {/* Avertissement caméras */}
            <View className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <View className="flex-row gap-3">
                    <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#ea580c" />
                    <View className="flex-1">
                        <Text className="text-sm font-semibold text-orange-900 mb-1">
                            Important : Caméras de surveillance
                        </Text>
                        <Text className="text-sm text-orange-800 leading-5">
                            Les caméras intérieures sont strictement interdites et doivent être éteintes. Seules les caméras extérieures sont autorisées, à condition d'être clairement indiquées aux voyageurs.
                        </Text>
                    </View>
                </View>
            </View>

            {/* Cases à cocher */}
            <View className="gap-3">
                <CheckboxItem
                    label="Caméras de surveillance (extérieures uniquement)"
                    description="Présence de caméras de surveillance à l'extérieur du logement (jardin, parking, entrée, etc.)"
                    isChecked={securityData.cameras}
                    onToggle={() => onToggleSecurity('cameras')}
                    warning={true}
                />

                <CheckboxItem
                    label="Sonomètres"
                    description="Présence d'appareils de mesure du bruit pour contrôler le niveau sonore"
                    isChecked={securityData.noiseSensors}
                    onToggle={() => onToggleSecurity('noiseSensors')}
                />

                <CheckboxItem
                    label="Armes"
                    description="Présence d'armes sur la propriété (même sécurisées ou non accessibles)"
                    isChecked={securityData.weapons}
                    onToggle={() => onToggleSecurity('weapons')}
                    warning={true}
                />

                <CheckboxItem
                    label="Animaux potentiellement dangereux"
                    description="Présence d'animaux qui pourraient représenter un danger (chiens de garde, etc.)"
                    isChecked={securityData.dangerousAnimals}
                    onToggle={() => onToggleSecurity('dangerousAnimals')}
                    warning={true}
                />
            </View>

            {/* Information importante */}
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <View className="flex-row gap-3">
                    <IconSymbol name="info.circle.fill" size={20} color="#3b82f6" />
                    <View className="flex-1">
                        <Text className="text-sm text-blue-900 leading-5">
                            La transparence sur ces éléments est essentielle pour la sécurité et la confiance des voyageurs. Le non-respect de ces règles peut entraîner la suspension de votre annonce.
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default Step12Security;
