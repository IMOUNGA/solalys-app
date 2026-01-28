import React, { useEffect, useState, useCallback } from 'react';
import { Pressable, Text, View, RefreshControl, ScrollView, Dimensions } from "react-native";
import { Link, router } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { logoutThunk, refreshUserThunk } from '@/store/thunks/authThunks';
import { logoutState } from '@/store/slices/authSlice';

const { width } = Dimensions.get('window');

const CompteScreen = () => {
    const dispatch = useAppDispatch();
    const { user, status } = useAppSelector((state) => state.auth);
    const { myParticipations } = useAppSelector((state) => state.events);
    const { myGroups } = useAppSelector((state) => state.groups);
    const isAuthenticated = status === 'authenticated' && user;
    const [refreshing, setRefreshing] = useState(false);

    const handleLogout = async () => {
        try {
            await dispatch(logoutThunk()).unwrap();
            dispatch(logoutState());
            router.replace('/(tabs)/(trouver)');
        } catch (error) {
            // Error handled
        }
    };

    const onRefresh = useCallback(async () => {
        if (!isAuthenticated) return;
        setRefreshing(true);
        try {
            await dispatch(refreshUserThunk()).unwrap();
        } finally {
            setRefreshing(false);
        }
    }, [dispatch, isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <ThemedView className="flex-1">
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1 }}
                >
                    <View className="flex-1 items-center justify-center px-6">
                        <View className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 items-center" style={{ width: width - 48 }}>
                            <View className="bg-white/20 rounded-full p-6 mb-6">
                                <IconSymbol name="person.crop.circle.fill" size={80} color="#fff" />
                            </View>
                            <Text className="text-white text-3xl font-bold mb-3 text-center">
                                Bienvenue sur Solalys
                            </Text>
                            <Text className="text-white/80 text-center text-base mb-8 leading-6">
                                Connectez-vous pour découvrir des événements locaux et rejoindre des groupes passionnants
                            </Text>
                            <Link href="/(auth)" asChild>
                                <Pressable
                                    className="bg-white py-4 px-8 rounded-2xl w-full active:opacity-80"
                                    accessibilityLabel="connexion or subscription button"
                                >
                                    <Text className="text-purple-600 text-center font-bold text-lg">
                                        Se connecter
                                    </Text>
                                </Pressable>
                            </Link>
                        </View>
                    </View>
                </LinearGradient>
            </ThemedView>
        );
    }

    return (
        <ScrollView
            className="flex-1 bg-gray-50 dark:bg-gray-900"
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header with gradient */}
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingTop: 60, paddingBottom: 80, paddingHorizontal: 20 }}
            >
                <View className="flex-row items-center mb-6">
                    <View className="bg-white/20 rounded-full p-3 mr-4">
                        <IconSymbol name="person.crop.circle.fill" size={60} color="#fff" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-white text-2xl font-bold">
                            {user.firstname} {user.lastname}
                        </Text>
                        <Text className="text-white/80 text-base mt-1">
                            {user.email}
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Stats Cards */}
            <View className="px-5 -mt-12 mb-6">
                <View className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                    <View className="flex-row">
                        <Pressable
                            className="flex-1 p-5 items-center border-r border-gray-100 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-700"
                            onPress={() => router.push('/(tabs)/(events)')}
                        >
                            <View className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 mb-3">
                                <IconSymbol name="calendar" size={28} color="#3B82F6" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                {myParticipations?.length || 0}
                            </Text>
                            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                Événements
                            </Text>
                        </Pressable>

                        <Pressable
                            className="flex-1 p-5 items-center active:bg-gray-50 dark:active:bg-gray-700"
                            onPress={() => router.push('/(tabs)/(groupes)')}
                        >
                            <View className="bg-purple-100 dark:bg-purple-900 rounded-full p-3 mb-3">
                                <IconSymbol name="person.2.fill" size={28} color="#8B5CF6" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                {myGroups?.length || 0}
                            </Text>
                            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                Groupes
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>

            {/* Menu Items */}
            <View className="px-5 space-y-3 mb-6">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 ml-1">
                    Paramètres
                </Text>

                <Pressable
                    className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center shadow-sm active:bg-gray-50 dark:active:bg-gray-700"
                    onPress={() => router.push('/(tabs)/(compte)/account-settings')}
                >
                    <View className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 mr-4">
                        <IconSymbol name="person.circle" size={24} color="#3B82F6" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900 dark:text-white">
                            Gestion du compte
                        </Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Modifier vos informations
                        </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
                </Pressable>

                <Pressable
                    className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center shadow-sm active:bg-gray-50 dark:active:bg-gray-700"
                    onPress={() => router.push('/(tabs)/(compte)/support')}
                >
                    <View className="bg-green-100 dark:bg-green-900 rounded-full p-3 mr-4">
                        <IconSymbol name="questionmark.circle" size={24} color="#10B981" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900 dark:text-white">
                            Assistance
                        </Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Besoin d'aide ?
                        </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
                </Pressable>

                <Pressable
                    className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center shadow-sm active:bg-gray-50 dark:active:bg-gray-700"
                    onPress={() => router.push('/(tabs)/(compte)/privacy')}
                >
                    <View className="bg-yellow-100 dark:bg-yellow-900 rounded-full p-3 mr-4">
                        <IconSymbol name="lock.shield" size={24} color="#F59E0B" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900 dark:text-white">
                            Confidentialité
                        </Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Vos données en sécurité
                        </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
                </Pressable>

                <Pressable
                    className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center shadow-sm active:bg-gray-50 dark:active:bg-gray-700"
                    onPress={() => router.push('/(tabs)/(compte)/legal')}
                >
                    <View className="bg-gray-100 dark:bg-gray-700 rounded-full p-3 mr-4">
                        <IconSymbol name="doc.text" size={24} color="#6B7280" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900 dark:text-white">
                            Mentions légales
                        </Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            CGU et CGV
                        </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
                </Pressable>

                {/* Logout Button */}
                <Pressable
                    onPress={handleLogout}
                    className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 flex-row items-center mt-4 active:bg-red-100 dark:active:bg-red-900/30"
                    accessibilityLabel="Déconnexion"
                >
                    <View className="bg-red-100 dark:bg-red-900 rounded-full p-3 mr-4">
                        <IconSymbol name="arrow.right.square" size={24} color="#EF4444" />
                    </View>
                    <Text className="flex-1 text-base font-semibold text-red-600 dark:text-red-400">
                        Déconnexion
                    </Text>
                    <IconSymbol name="chevron.right" size={20} color="#EF4444" />
                </Pressable>
            </View>

            {/* App Version */}
            <View className="px-5 pb-8 items-center">
                <Text className="text-xs text-gray-400 dark:text-gray-600">
                    Solalys v1.0.0 • Made with ❤️
                </Text>
            </View>
        </ScrollView>
    );
};

export default CompteScreen;
