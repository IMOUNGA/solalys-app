import React, {useEffect, useState, useCallback} from 'react';
import {Pressable, Text, View, RefreshControl} from "react-native";
import {Link, router} from "expo-router";
import ScreenScroll from "@/components/ux/ScreenScroll";
import {ThemedText} from "@/components/themed-text";
import {IconSymbol} from "@/components/ui/icon-symbol";
import SettingItem from '@/components/ui/SettingItem';
import {useAppDispatch, useAppSelector} from '@/hooks/useRedux';
import {logoutThunk, refreshUserThunk} from '@/store/thunks/authThunks';
import {logoutState} from '@/store/slices/authSlice';

const CompteScreen = () => {
    const dispatch = useAppDispatch();
    const {user, status} = useAppSelector((state) => state.auth);
    const isAuthenticated = status === 'authenticated' && user;
    const [refreshing, setRefreshing] = useState(false);

    const handleLogout = async () => {
        try {
            await dispatch(logoutThunk()).unwrap();
            dispatch(logoutState());
            router.replace('/(tabs)/(explorer)');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const onRefresh = useCallback(async () => {
        if (!isAuthenticated) return;

        setRefreshing(true);
        try {
            await dispatch(refreshUserThunk()).unwrap();
        } catch (error) {
            console.error('Refresh error:', error);
            // Si le refresh échoue, l'utilisateur sera déconnecté automatiquement
        } finally {
            setRefreshing(false);
        }
    }, [dispatch, isAuthenticated]);

    return (
        <ScreenScroll
            className=""
            contentClassName="pt-24 flex-1"
            refreshControl={
                isAuthenticated ? (
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                ) : undefined
            }
        >
            <View className="gap-5">
                <ThemedText type='bigTitle'>Mon compte</ThemedText>

                {isAuthenticated ? (
                    <View className="gap-3">
                        <ThemedText>Bienvenue, {user.firstName} {user.lastName} !</ThemedText>
                        <Text className="text-gray-600">{user.email}</Text>
                    </View>
                ) : (
                    <>
                        <ThemedText>N&apos;attendez plus et connectez vous pour planifier votre voyage.</ThemedText>
                        <Link href="/(auth)" asChild>
                            <Pressable
                                className="bg-black py-3 px-6 rounded-lg"
                                accessibilityLabel="connexion or subscription button"
                            >
                                <Text className="text-white text-center font-semibold text-lg">
                                    Connexion ou inscription
                                </Text>
                            </Pressable>
                        </Link>
                    </>
                )}

                {/* Create Announcement Button */}
                {isAuthenticated && (
                    <Link href="/(tabs)/(compte)/create-annonce" asChild>
                        <Pressable
                            className="bg-black py-4 px-6 rounded-xl flex-row items-center justify-center gap-3 shadow-sm active:bg-blue-700"
                            accessibilityLabel="Créer une annonce"
                        >
                            <IconSymbol name="plus.circle.fill" size={24} color="#fff" />
                            <Text className="text-white text-center font-semibold text-lg">
                                Créer une annonce
                            </Text>
                        </Pressable>
                    </Link>
                )}

                {/* Settings List */}
                <View className="mt-5 rounded-xl overflow-hidden">
                    <SettingItem
                        icon="person.circle"
                        title="Gestion du compte"
                        href="/(tabs)/(compte)/account-settings"
                    />
                    <SettingItem
                        icon="questionmark.circle"
                        title="Obtenir une assistance"
                        href="/(tabs)/(compte)/support"
                    />
                    <SettingItem
                        icon="lock.shield"
                        title="Confidentialité"
                        href="/(tabs)/(compte)/privacy"
                    />
                    <SettingItem
                        icon="doc.text"
                        title="Juridique"
                        href="/(tabs)/(compte)/legal"
                    />

                    {isAuthenticated && (
                        <Pressable
                            onPress={handleLogout}
                            className="flex-row items-center gap-4 bg-white p-4 border-b border-gray-100 active:bg-gray-50"
                            accessibilityLabel="Déconnexion"
                        >
                            <IconSymbol name="arrow.right.square" size={24} color="#000" />
                            <Text className="flex-1 text-base font-medium text-red-600">
                                Déconnexion
                            </Text>
                            <IconSymbol name="chevron.right" size={20} color="#999" />
                        </Pressable>
                    )}
                </View>
            </View>

        </ScreenScroll>
    );
};

export default CompteScreen;
