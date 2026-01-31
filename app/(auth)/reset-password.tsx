import React, { useState, useEffect } from 'react';
import { Pressable, Text, View, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TextInput } from '@/components/ui/text-input';
import { validatePassword, validatePasswordConfirmation } from '@/utils/validation';
import { ApiService } from '@/services/apiService';
import { URLS } from '@/constants/urls/apiUrls';
import { useErrorAlert } from '@/hooks/useAlert';

const { width } = Dimensions.get('window');

const ResetPasswordScreen = () => {
    const showErrorAlert = useErrorAlert();
    const params = useLocalSearchParams();

    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{
        token?: string;
        newPassword?: string;
        confirmPassword?: string;
    }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);

    // Récupérer le token depuis les query params si disponible
    useEffect(() => {
        if (params.token && typeof params.token === 'string') {
            setToken(params.token);
        }
    }, [params.token]);

    const validateForm = (): boolean => {
        const newErrors: {
            token?: string;
            newPassword?: string;
            confirmPassword?: string;
        } = {};

        if (!token.trim()) {
            newErrors.token = 'Le token est requis';
        }

        const passwordError = validatePassword(newPassword);
        if (passwordError) newErrors.newPassword = passwordError;

        const confirmError = validatePasswordConfirmation(newPassword, confirmPassword);
        if (confirmError) newErrors.confirmPassword = confirmError;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            await ApiService.post(URLS.AUTH.RESET_PASSWORD, {
                token,
                newPassword,
            });
            setResetSuccess(true);
        } catch (err: any) {
            showErrorAlert(
                err?.response?.data?.message || 'Une erreur est survenue',
                'Erreur'
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (resetSuccess) {
        return (
            <View className="flex-1 bg-white">
                <LinearGradient
                    colors={['#10B981', '#3B82F6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1 }}
                >
                    <View className="flex-1 items-center justify-center px-6">
                        <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 items-center shadow-2xl" style={{ width: width - 48, maxWidth: 480 }}>
                            <View className="bg-green-100 rounded-full p-6 mb-6">
                                <IconSymbol name="checkmark.circle.fill" size={64} color="#10B981" />
                            </View>

                            <Text className="text-gray-900 text-3xl font-bold mb-3 text-center">
                                Mot de passe réinitialisé !
                            </Text>
                            <Text className="text-gray-600 text-center text-base mb-8 leading-6">
                                Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                            </Text>

                            <Pressable
                                className="py-4 px-6 rounded-2xl w-full active:opacity-80"
                                onPress={() => router.push('/(auth)/sign-in')}
                            >
                                <LinearGradient
                                    colors={['#10B981', '#3B82F6']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16 }}
                                />
                                <Text className="text-white text-center font-bold text-lg">
                                    Se connecter
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View className="flex-1">
            <LinearGradient
                colors={['#3B82F6', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <ScrollView
                        className="flex-1"
                        contentContainerStyle={{ flexGrow: 1, paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Bouton retour */}
                        <Pressable
                            className="flex-row items-center gap-2 active:opacity-60 mb-8"
                            onPress={() => router.back()}
                            disabled={isLoading}
                        >
                            <View className="bg-white/20 rounded-full p-2">
                                <IconSymbol name="chevron.left" size={20} color="#fff" />
                            </View>
                            <Text className="text-white font-semibold text-base">Retour</Text>
                        </Pressable>

                        {/* Header */}
                        <View className="items-center mb-8">
                            <View className="bg-white/20 rounded-full p-5 mb-4">
                                <IconSymbol name="lock.shield" size={48} color="#fff" />
                            </View>
                            <Text className="text-white text-3xl font-bold mb-2">
                                Nouveau mot de passe
                            </Text>
                            <Text className="text-white/90 text-center text-base">
                                Choisissez un nouveau mot de passe sécurisé pour votre compte
                            </Text>
                        </View>

                        {/* Form Card */}
                        <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
                            <View className="gap-5">
                                {/* Token - seulement visible si pas fourni dans l'URL */}
                                {!params.token && (
                                    <TextInput
                                        label="Token de réinitialisation"
                                        placeholder="Collez le token reçu par email"
                                        value={token}
                                        onChangeText={(text: string) => {
                                            setToken(text);
                                            if (errors.token) setErrors({ ...errors, token: undefined });
                                        }}
                                        error={errors.token}
                                        autoCapitalize="none"
                                        autoComplete="off"
                                        icon="key"
                                    />
                                )}

                                <TextInput
                                    label="Nouveau mot de passe"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChangeText={(text: string) => {
                                        setNewPassword(text);
                                        if (errors.newPassword) setErrors({ ...errors, newPassword: undefined });
                                    }}
                                    error={errors.newPassword}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoComplete="password-new"
                                    icon="lock"
                                />

                                <TextInput
                                    label="Confirmer le mot de passe"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChangeText={(text: string) => {
                                        setConfirmPassword(text);
                                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                                    }}
                                    error={errors.confirmPassword}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoComplete="password-new"
                                    icon="lock"
                                />

                                <Pressable
                                    className={`py-4 px-6 rounded-2xl flex-row items-center justify-center gap-2 mt-2 ${
                                        isLoading ? 'opacity-70' : 'active:opacity-80'
                                    }`}
                                    onPress={handleSubmit}
                                    disabled={isLoading}
                                >
                                    <LinearGradient
                                        colors={isLoading ? ['#9ca3af', '#9ca3af'] : ['#3B82F6', '#8B5CF6']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16 }}
                                    />
                                    {isLoading ? (
                                        <>
                                            <ActivityIndicator color="#fff" />
                                            <Text className="text-white text-center font-bold text-lg">
                                                Réinitialisation...
                                            </Text>
                                        </>
                                    ) : (
                                        <Text className="text-white text-center font-bold text-lg">
                                            Réinitialiser le mot de passe
                                        </Text>
                                    )}
                                </Pressable>
                            </View>
                        </View>

                        {/* Spacer */}
                        <View className="flex-1" />
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </View>
    );
};

export default ResetPasswordScreen;
