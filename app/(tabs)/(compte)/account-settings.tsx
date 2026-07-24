import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView as SafeAreaViewTop } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { refreshUserThunk } from '@/store/thunks/authThunks';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TextInput } from '@/components/ui/text-input';
import { Avatar } from '@/components/Avatar';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';

const AccountSettingsScreen = () => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const showSuccess = useSuccessAlert();
    const showError = useErrorAlert();

    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [metier, setMetier] = useState('');
    const [offre, setOffre] = useState('');
    const [recherche, setRecherche] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setFirstname((user as any).firstname || '');
            setLastname((user as any).lastname || '');
            setMetier((user as any).metier || '');
            setOffre((user as any).offre || '');
            setRecherche((user as any).recherche || '');
        }
    }, [user]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiService.users.updateMe({
                firstname: firstname.trim(),
                lastname: lastname.trim(),
                metier: metier.trim(),
                offre: offre.trim(),
                recherche: recherche.trim(),
            });
            await dispatch(refreshUserThunk()).unwrap();
            showSuccess('Profil mis à jour avec succès');
        } catch (error: any) {
            showError(error?.response?.data?.message || error?.message || 'Impossible de mettre à jour le profil');
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) {
        return (
            <SafeAreaView style={{ flex: 1 }} className="items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#3B82F6" />
            </SafeAreaView>
        );
    }

    return (
        <View style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
                    {/* Header */}
                    <View>
                        <LinearGradient
                            colors={['#3B82F6', '#8B5CF6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ paddingBottom: 32 }}
                        >
                          <SafeAreaViewTop edges={['top']}>
                            <View className="flex-row items-center px-5 pt-3 pb-4">
                                <Pressable
                                    onPress={() => router.back()}
                                    className="w-9 h-9 items-center justify-center -ml-2 mr-2"
                                >
                                    <IconSymbol name="chevron.left" size={22} color="#fff" />
                                </Pressable>
                                <Text className="text-white text-lg font-bold">Mon profil</Text>
                            </View>
                            <View className="items-center">
                                <Avatar
                                    uri={(user as any).avatar}
                                    name={`${firstname} ${lastname}`}
                                    size={72}
                                    style={{ borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' }}
                                />
                            </View>
                          </SafeAreaViewTop>
                        </LinearGradient>
                    </View>

                    {/* Formulaire */}
                    <View className="px-5 pt-6 gap-5">
                        <View className="flex-row gap-3">
                            <View className="flex-1">
                                <TextInput
                                    label="Prénom"
                                    value={firstname}
                                    onChangeText={setFirstname}
                                    placeholder="Prénom"
                                    autoCapitalize="words"
                                />
                            </View>
                            <View className="flex-1">
                                <TextInput
                                    label="Nom"
                                    value={lastname}
                                    onChangeText={setLastname}
                                    placeholder="Nom"
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>

                        <View className="border-t border-gray-100 dark:border-gray-800 pt-5">
                            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                Annuaire des groupes
                            </Text>
                            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-5">
                                Ces informations sont visibles par les autres membres de vos groupes — c'est ce qui leur permet de savoir comment vous aider.
                            </Text>

                            <View className="gap-5">
                                <TextInput
                                    label="Métier / secteur d'activité"
                                    value={metier}
                                    onChangeText={setMetier}
                                    placeholder="Ex : Avocat, Développeur, Comptable..."
                                    autoCapitalize="sentences"
                                    icon="briefcase.fill"
                                />
                                <TextInput
                                    label="Ce que je propose"
                                    value={offre}
                                    onChangeText={setOffre}
                                    placeholder="Ex : Conseil juridique pour startups"
                                    autoCapitalize="sentences"
                                    icon="megaphone.fill"
                                />
                                <TextInput
                                    label="Ce que je recherche"
                                    value={recherche}
                                    onChangeText={setRecherche}
                                    placeholder="Ex : Un client SaaS B2B"
                                    autoCapitalize="sentences"
                                    icon="magnifyingglass"
                                />
                            </View>

                            {metier.trim().length > 0 && (
                                <View className="flex-row items-start gap-2 bg-blue-50 dark:bg-blue-950 rounded-xl p-3 mt-4">
                                    <IconSymbol name="info.circle.fill" size={16} color="#3B82F6" />
                                    <Text className="flex-1 text-xs text-blue-700 dark:text-blue-300 leading-4">
                                        Un seul membre par métier est autorisé par groupe. Vous ne pourrez pas rejoindre un groupe où votre métier est déjà pris.
                                    </Text>
                                </View>
                            )}
                        </View>

                        <Pressable
                            onPress={handleSave}
                            disabled={isSaving}
                            className={`rounded-2xl overflow-hidden mt-2 ${isSaving ? 'opacity-60' : 'active:opacity-90'}`}
                        >
                            <LinearGradient
                                colors={['#3B82F6', '#8B5CF6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ paddingVertical: 16 }}
                            >
                                <Text className="text-white text-center font-bold text-base">
                                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                                </Text>
                            </LinearGradient>
                        </Pressable>

                        <View className="border-t border-gray-100 dark:border-gray-800 pt-5 mt-2">
                            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                Zone dangereuse
                            </Text>
                            <Pressable
                                onPress={() => router.push('/(tabs)/(compte)/delete-account' as any)}
                                className="flex-row items-center gap-3 bg-red-50 dark:bg-red-950 rounded-2xl p-4 active:opacity-70"
                            >
                                <View className="bg-white dark:bg-gray-900 rounded-full p-2.5">
                                    <IconSymbol name="trash.fill" size={18} color="#EF4444" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-bold text-red-600 dark:text-red-400">
                                        Supprimer mon compte
                                    </Text>
                                    <Text className="text-xs text-red-500/80 dark:text-red-400/70 mt-0.5">
                                        Action définitive et irréversible
                                    </Text>
                                </View>
                                <IconSymbol name="chevron.right" size={18} color="#EF4444" />
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default AccountSettingsScreen;
