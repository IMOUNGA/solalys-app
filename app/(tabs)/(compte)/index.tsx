import React, { useEffect, useState, useCallback } from 'react';
import { Pressable, Text, View, RefreshControl, ScrollView, Dimensions, SafeAreaView } from "react-native";
import { Link, router } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { logoutThunk, refreshUserThunk } from '@/store/thunks/authThunks';
import { logoutState } from '@/store/slices/authSlice';
import { fetchMyGroupsThunk } from '@/store/thunks/groupsThunks';
import { fetchMyParticipationsThunk } from '@/store/thunks/eventsThunks';

const { width } = Dimensions.get('window');

const CompteScreen = () => {
    const dispatch = useAppDispatch();
    const { user, status } = useAppSelector((state) => state.auth);
    const { myParticipations } = useAppSelector((state) => state.events);
    const { myGroups } = useAppSelector((state) => state.groups);
    const isAuthenticated = status === 'authenticated' && user;
    const [refreshing, setRefreshing] = useState(false);

    // Charger les données utilisateur au montage
    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchMyGroupsThunk());
            dispatch(fetchMyParticipationsThunk());
        }
    }, [isAuthenticated, dispatch]);

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
            await Promise.all([
                dispatch(refreshUserThunk()).unwrap(),
                dispatch(fetchMyGroupsThunk()).unwrap(),
                dispatch(fetchMyParticipationsThunk()).unwrap(),
            ]);
        } finally {
            setRefreshing(false);
        }
    }, [dispatch, isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <View className="flex-1 bg-white">
                <LinearGradient
                    colors={['#3B82F6', '#8B5CF6', '#FFFFFF']}
                    locations={[0, 0.5, 1]}
                    style={{ flex: 1 }}
                >
                    <SafeAreaView className="flex-1">
                        <View className="flex-1 items-center justify-center px-6">
                            <View className="bg-white/20 backdrop-blur-xl rounded-full p-6 mb-6">
                                <IconSymbol name="person.crop.circle.fill" size={64} color="#fff" />
                            </View>
                            <Text className="text-white text-2xl font-bold text-center mb-3">
                                Bienvenue sur Solalys
                            </Text>
                            <Text className="text-white/90 text-center text-base mb-8 leading-6">
                                Connectez-vous pour découvrir des événements locaux et rejoindre des groupes
                            </Text>
                            <Link href="/(auth)" asChild>
                                <Pressable
                                    className="px-8 py-4 rounded-2xl active:opacity-80"
                                    accessibilityLabel="connexion or subscription button"
                                >
                                    <LinearGradient
                                        colors={['#FFFFFF', '#F3F4F6']}
                                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16 }}
                                    />
                                    <Text className="text-blue-600 font-bold text-lg relative z-10">
                                        Se connecter
                                    </Text>
                                </Pressable>
                            </Link>
                        </View>
                    </SafeAreaView>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <LinearGradient
                colors={['#3B82F6', '#8B5CF6', '#FFFFFF']}
                locations={[0, 0.4, 0.8]}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }}
            />

            <SafeAreaView className="flex-1">
                <ScrollView
                    className="flex-1"
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#fff"
                        />
                    }
                >
                    {/* Header */}
                    <View className="px-6 pt-4 pb-8">
                        <View className="flex-row items-center">
                            <View className="bg-white/20 backdrop-blur-xl rounded-full p-3 mr-4">
                                <IconSymbol name="person.crop.circle.fill" size={56} color="#fff" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white text-2xl font-bold">
                                    {user.firstname} {user.lastname}
                                </Text>
                                <Text className="text-white/90 text-base mt-1">
                                    {user.email}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Stats Cards */}
                    <View className="px-6 mb-6">
                        <View className="bg-white rounded-2xl overflow-hidden"
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 12,
                                elevation: 5,
                            }}
                        >
                            <View className="flex-row">
                                <Pressable
                                    className="flex-1 p-5 items-center border-r border-gray-100 active:bg-gray-50"
                                    onPress={() => router.push('/(tabs)/(events)')}
                                >
                                    <View className="bg-violet-100 rounded-full p-3 mb-3">
                                        <IconSymbol name="calendar" size={28} color="#8B5CF6" />
                                    </View>
                                    <Text className="text-2xl font-bold text-gray-900 mb-1">
                                        {myParticipations?.length || 0}
                                    </Text>
                                    <Text className="text-sm text-gray-600 text-center">
                                        Événements
                                    </Text>
                                </Pressable>

                                <Pressable
                                    className="flex-1 p-5 items-center active:bg-gray-50"
                                    onPress={() => router.push('/(tabs)/(groupes)')}
                                >
                                    <View className="bg-green-100 rounded-full p-3 mb-3">
                                        <IconSymbol name="person.2.fill" size={28} color="#10B981" />
                                    </View>
                                    <Text className="text-2xl font-bold text-gray-900 mb-1">
                                        {myGroups?.length || 0}
                                    </Text>
                                    <Text className="text-sm text-gray-600 text-center">
                                        Groupes
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    {/* Menu Items */}
                    <View className="px-6 mb-6">
                        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 ml-1">
                            Paramètres
                        </Text>

                        <View>
                            <Pressable
                                className="bg-white rounded-2xl p-4 flex-row items-center active:opacity-70 mb-3"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 8,
                                    elevation: 2,
                                }}
                                onPress={() => router.push('/(tabs)/(compte)/account-settings')}
                            >
                                <View className="bg-blue-50 rounded-full p-3 mr-4">
                                    <IconSymbol name="person.circle" size={24} color="#3B82F6" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-semibold text-gray-900">
                                        Gestion du compte
                                    </Text>
                                    <Text className="text-sm text-gray-600 mt-0.5">
                                        Modifier vos informations
                                    </Text>
                                </View>
                                <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
                            </Pressable>

                            <Pressable
                                className="bg-white rounded-2xl p-4 flex-row items-center active:opacity-70 mb-3"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 8,
                                    elevation: 2,
                                }}
                                onPress={() => router.push('/(tabs)/(compte)/support')}
                            >
                                <View className="bg-green-50 rounded-full p-3 mr-4">
                                    <IconSymbol name="questionmark.circle" size={24} color="#10B981" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-semibold text-gray-900">
                                        Assistance
                                    </Text>
                                    <Text className="text-sm text-gray-600 mt-0.5">
                                        Besoin d'aide ?
                                    </Text>
                                </View>
                                <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
                            </Pressable>

                            <Pressable
                                className="bg-white rounded-2xl p-4 flex-row items-center active:opacity-70 mb-3"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 8,
                                    elevation: 2,
                                }}
                                onPress={() => router.push('/(tabs)/(compte)/privacy')}
                            >
                                <View className="bg-amber-50 rounded-full p-3 mr-4">
                                    <IconSymbol name="lock.shield" size={24} color="#F59E0B" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-semibold text-gray-900">
                                        Confidentialité
                                    </Text>
                                    <Text className="text-sm text-gray-600 mt-0.5">
                                        Vos données en sécurité
                                    </Text>
                                </View>
                                <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
                            </Pressable>

                            <Pressable
                                className="bg-white rounded-2xl p-4 flex-row items-center active:opacity-70 mb-3"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 8,
                                    elevation: 2,
                                }}
                                onPress={() => router.push('/(tabs)/(compte)/legal')}
                            >
                                <View className="bg-gray-100 rounded-full p-3 mr-4">
                                    <IconSymbol name="doc.text" size={24} color="#6B7280" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-semibold text-gray-900">
                                        Mentions légales
                                    </Text>
                                    <Text className="text-sm text-gray-600 mt-0.5">
                                        CGU et CGV
                                    </Text>
                                </View>
                                <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
                            </Pressable>

                            {/* Logout Button */}
                            <Pressable
                                onPress={handleLogout}
                                className="bg-red-50 rounded-2xl p-4 flex-row items-center mt-3 active:opacity-70"
                                style={{
                                    shadowColor: '#EF4444',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 8,
                                    elevation: 2,
                                }}
                                accessibilityLabel="Déconnexion"
                            >
                                <View className="bg-red-100 rounded-full p-3 mr-4">
                                    <IconSymbol name="arrow.right.square" size={24} color="#EF4444" />
                                </View>
                                <Text className="flex-1 text-base font-semibold text-red-600">
                                    Déconnexion
                                </Text>
                                <IconSymbol name="chevron.right" size={20} color="#EF4444" />
                            </Pressable>
                        </View>
                    </View>

                    {/* App Version */}
                    <View className="px-6 pb-8 items-center">
                        <Text className="text-xs text-gray-400">
                            Solalys v1.0.0
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default CompteScreen;
