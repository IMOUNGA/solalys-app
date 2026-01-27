import React from 'react';
import {View, Text} from "react-native";
import {ThemedText} from "@/components/themed-text";
import {IconSymbol} from "@/components/ui/icon-symbol";

const Step14Confirmation = () => {
    return (
        <View className="gap-8 items-center py-8">
            {/* Icône de succès */}
            <View className="bg-green-100 w-24 h-24 rounded-full items-center justify-center">
                <IconSymbol name="checkmark.circle.fill" size={64} color="#16a34a" />
            </View>

            {/* Message de félicitations */}
            <View className="gap-3 items-center">
                <ThemedText type="subtitle" className="text-center">
                    Félicitations !
                </ThemedText>
                <Text className="text-gray-600 text-base text-center leading-6">
                    Votre annonce a été soumise avec succès
                </Text>
            </View>

            {/* Carte d'information */}
            <View className="bg-white border-2 border-gray-200 rounded-2xl p-6 w-full gap-4">
                <View className="flex-row items-start gap-4">
                    <View className="bg-blue-100 w-12 h-12 rounded-full items-center justify-center">
                        <IconSymbol name="hourglass" size={24} color="#3b82f6" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900 mb-2">
                            Analyse en cours
                        </Text>
                        <Text className="text-sm text-gray-600 leading-5">
                            Notre équipe examine actuellement votre annonce pour s'assurer qu'elle respecte nos standards de qualité.
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-start gap-4">
                    <View className="bg-purple-100 w-12 h-12 rounded-full items-center justify-center">
                        <IconSymbol name="bell.fill" size={24} color="#9333ea" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900 mb-2">
                            Vous serez notifié
                        </Text>
                        <Text className="text-sm text-gray-600 leading-5">
                            Nous vous informerons par email dès que votre annonce sera validée et publiée sur la plateforme.
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-start gap-4">
                    <View className="bg-orange-100 w-12 h-12 rounded-full items-center justify-center">
                        <IconSymbol name="clock.fill" size={24} color="#ea580c" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900 mb-2">
                            Délai de traitement
                        </Text>
                        <Text className="text-sm text-gray-600 leading-5">
                            Le processus de validation prend généralement entre 24 et 48 heures.
                        </Text>
                    </View>
                </View>
            </View>

            {/* Message de remerciement */}
            <View className="bg-gray-50 border border-gray-200 rounded-xl p-6 w-full">
                <Text className="text-base text-gray-900 text-center leading-6">
                    Merci de faire confiance à notre plateforme pour partager votre logement. Nous sommes impatients de vous accueillir dans notre communauté d'hôtes !
                </Text>
            </View>

            {/* Prochaines étapes */}
            <View className="w-full gap-3">
                <Text className="text-sm font-semibold text-gray-900 text-center">
                    En attendant la validation, vous pouvez :
                </Text>
                <View className="gap-2">
                    <View className="flex-row items-center gap-2">
                        <View className="w-2 h-2 rounded-full bg-gray-900" />
                        <Text className="text-sm text-gray-700">
                            Préparer des photos supplémentaires de qualité
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <View className="w-2 h-2 rounded-full bg-gray-900" />
                        <Text className="text-sm text-gray-700">
                            Consulter nos conseils pour hôtes débutants
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <View className="w-2 h-2 rounded-full bg-gray-900" />
                        <Text className="text-sm text-gray-700">
                            Configurer vos disponibilités et tarifs
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default Step14Confirmation;
