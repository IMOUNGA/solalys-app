import React, { useEffect } from 'react';
import {Pressable, Text, View} from 'react-native';
import {Link, router} from 'expo-router';
import ScreenScroll from '@/components/ux/ScreenScroll';
import {ThemedText} from '@/components/themed-text';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {useAppSelector} from '@/hooks/useRedux';

const AuthLandingScreen = () => {
    const { user, status } = useAppSelector((state) => state.auth);

    // Redirection automatique si déjà authentifié
    useEffect(() => {
        if (status === 'authenticated' && user) {
            router.replace('/(tabs)/(compte)');
        }
    }, [status, user]);
    return (
        <ScreenScroll className="" contentClassName="pt-24 flex-1 px-5">
            <View className="gap-10 flex-1 justify-center">
                {/* Logo et titre */}
                <View className="gap-4 items-center">
                    <ThemedText type="bigTitle" className="text-center">
                        Bienvenue sur Solalys
                    </ThemedText>
                    <Text className="text-gray-500 text-lg text-center">
                        Rejoignez des événements et des groupes près de chez vous
                    </Text>
                </View>

                {/* Boutons d'authentification */}
                <View className="gap-4 w-full">
                    {/* Bouton Se connecter */}
                    <Link href="/(auth)/sign-in" asChild>
                        <Pressable className="bg-black py-4 px-6 rounded-xl active:opacity-80">
                            <View className="flex-row items-center justify-center gap-3">
                                <IconSymbol name="person.circle" size={24} color="#fff" />
                                <Text className="text-white text-center font-semibold text-lg">
                                    Se connecter
                                </Text>
                            </View>
                        </Pressable>
                    </Link>

                    {/* Bouton Créer un compte */}
                    <Link href="/(auth)/sign-up" asChild>
                        <Pressable className="bg-white border-2 border-black py-4 px-6 rounded-xl active:bg-gray-50">
                            <View className="flex-row items-center justify-center gap-3">
                                <IconSymbol name="person.badge.plus" size={24} color="#000" />
                                <Text className="text-black text-center font-semibold text-lg">
                                    Créer un compte
                                </Text>
                            </View>
                        </Pressable>
                    </Link>

                    {/* Lien Mot de passe oublié */}
                    <Link href="/(auth)/forgot-password" asChild>
                        <Pressable className="py-3 active:opacity-60">
                            <Text className="text-gray-600 text-center text-base underline">
                                Mot de passe oublié ?
                            </Text>
                        </Pressable>
                    </Link>
                </View>

                {/* Séparateur */}
                <View className="flex-row items-center gap-4">
                    <View className="flex-1 h-[1px] bg-gray-300" />
                    <Text className="text-gray-500 text-sm">ou</Text>
                    <View className="flex-1 h-[1px] bg-gray-300" />
                </View>

                {/* Bouton Continuer en tant qu'invité */}
                <Pressable
                    className="py-4 px-6 active:opacity-60"
                    onPress={() => router.push('/(tabs)/(trouver)')}
                >
                    <Text className="text-black text-center font-medium text-base">
                        Continuer sans compte
                    </Text>
                </Pressable>

                {/* Zone de développement - À retirer en production */}
                {__DEV__ && (
                    <View className="mt-8 pt-6 border-t border-gray-300">
                        <Text className="text-xs text-gray-400 text-center mb-3">
                            🔧 DEV MODE
                        </Text>
                        <Link href="/(auth)/reset-password" asChild>
                            <Pressable className="py-2 active:opacity-60">
                                <Text className="text-gray-500 text-center text-sm underline">
                                    Tester Reset Password
                                </Text>
                            </Pressable>
                        </Link>
                    </View>
                )}
            </View>
        </ScreenScroll>
    );
};

export default AuthLandingScreen;
