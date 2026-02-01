import React, { useEffect } from 'react';
import { Pressable, Text, View, Dimensions } from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppSelector } from '@/hooks/useRedux';

const { width } = Dimensions.get('window');

const AuthLandingScreen = () => {
    const { user, status } = useAppSelector((state) => state.auth);

    // Redirection automatique si déjà authentifié
    useEffect(() => {
        if (status === 'authenticated' && user) {
            router.replace('/(tabs)/(compte)');
        }
    }, [status, user]);

    return (
        <View className="flex-1 bg-white">
            <LinearGradient
                colors={['#3B82F6', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
            >
                <View className="flex-1 items-center justify-center px-6">
                    {/* Icon */}
                    <View className="bg-white/20 rounded-full p-6 mb-6">
                        <IconSymbol name="sparkles" size={64} color="#fff" />
                    </View>

                    {/* Titre */}
                    <Text className="text-white text-4xl font-bold mb-3 text-center">
                        Bienvenue sur Solalys
                    </Text>
                    <Text className="text-white/90 text-center text-base mb-8 leading-6">
                        Rejoignez des événements et des groupes près de chez vous
                    </Text>

                    {/* Boutons d'authentification */}
                    <View className="gap-4" style={{ width: width - 48, maxWidth: 480 }}>
                        {/* Bouton Se connecter */}
                        <Link href="/(auth)/sign-in" asChild>
                            <Pressable className="py-4 px-6 rounded-2xl active:opacity-80 shadow-lg">
                                <LinearGradient
                                    colors={['#3B82F6', '#8B5CF6']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16 }}
                                />
                                <View className="flex-row items-center justify-center gap-3">
                                    <IconSymbol name="person.circle.fill" size={24} color="#fff" />
                                    <Text className="text-white text-center font-bold text-lg">
                                        Se connecter
                                    </Text>
                                </View>
                            </Pressable>
                        </Link>

                        {/* Bouton Créer un compte */}
                        <Link href="/(auth)/sign-up" asChild>
                            <Pressable className="bg-white/95 py-4 px-6 rounded-2xl active:bg-white shadow-md">
                                <View className="flex-row items-center justify-center gap-3">
                                    <IconSymbol name="person.badge.plus.fill" size={24} color="#3B82F6" />
                                    <Text className="text-blue-600 text-center font-bold text-lg">
                                        Créer un compte
                                    </Text>
                                </View>
                            </Pressable>
                        </Link>

                        {/* Lien Mot de passe oublié */}
                        <Link href="/(auth)/forgot-password" asChild>
                            <Pressable className="py-3 active:opacity-60">
                                <Text className="text-white/90 text-center text-sm underline">
                                    Mot de passe oublié ?
                                </Text>
                            </Pressable>
                        </Link>
                    </View>

                    {/* Zone de développement - À retirer en production */}
                    {__DEV__ && (
                        <View className="mt-6 pt-6 border-t border-white/20" style={{ width: width - 48, maxWidth: 480 }}>
                            <Text className="text-xs text-white/60 text-center mb-3">
                                🔧 DEV MODE
                            </Text>
                            <Link href="/(auth)/reset-password" asChild>
                                <Pressable className="py-2 active:opacity-60">
                                    <Text className="text-white/80 text-center text-xs underline">
                                        Tester Reset Password
                                    </Text>
                                </Pressable>
                            </Link>
                        </View>
                    )}

                    {/* Séparateur */}
                    <View className="flex-row items-center gap-4 mt-6" style={{ width: width - 48, maxWidth: 480 }}>
                        <View className="flex-1 h-[1px] bg-white/30" />
                        <Text className="text-white/90 text-sm">ou</Text>
                        <View className="flex-1 h-[1px] bg-white/30" />
                    </View>

                    {/* Bouton Continuer sans compte */}
                    <Pressable
                        className="py-3 px-6 active:opacity-60 mt-4"
                        onPress={() => router.push('/(tabs)/(trouver)')}
                    >
                        <Text className="text-white text-center font-semibold text-base">
                            Continuer sans compte
                        </Text>
                    </Pressable>

                    {/* Footer */}
                    <Text className="text-white/80 text-center text-xs mt-8">
                        Solalys v1.0.0 • Made with ❤️
                    </Text>
                </View>
            </LinearGradient>
        </View>
    );
};

export default AuthLandingScreen;
