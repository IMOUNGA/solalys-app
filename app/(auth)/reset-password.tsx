import React, { useState, useEffect } from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import ScreenScroll from '@/components/ux/ScreenScroll';
import { ThemedText } from '@/components/themed-text';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TextInput } from '@/components/ui/text-input';
import { validatePassword, validatePasswordConfirmation } from '@/utils/validation';
import { ApiService } from '@/services/apiService';
import { URLS } from '@/constants/urls/apiUrls';
import { useErrorAlert } from '@/hooks/useAlert';

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
            <ScreenScroll className="" contentClassName="flex-1 px-5 justify-center py-12">
                <View className="gap-8 items-center">
                    <IconSymbol name="checkmark.circle.fill" size={80} color="#10b981" />
                    <View className="gap-3">
                        <ThemedText type="bigTitle" className="text-center">
                            Mot de passe réinitialisé !
                        </ThemedText>
                        <Text className="text-gray-500 text-lg text-center">
                            Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                        </Text>
                    </View>
                    <Pressable
                        className="bg-black py-4 px-6 rounded-xl active:opacity-80 w-full mt-4"
                        onPress={() => router.push('/(auth)/sign-in')}
                    >
                        <Text className="text-white text-center font-semibold text-lg">
                            Se connecter
                        </Text>
                    </Pressable>
                </View>
            </ScreenScroll>
        );
    }

    return (
        <ScreenScroll className="" contentClassName="flex-1 px-5 justify-between py-12">
            {/* Bouton retour en haut */}
            <Pressable
                className="flex-row items-center gap-2 active:opacity-60"
                onPress={() => router.back()}
                disabled={isLoading}
            >
                <IconSymbol name="chevron.left" size={20} color="#000" />
                <Text className="text-base">Retour</Text>
            </Pressable>

            {/* Contenu centré */}
            <View className="gap-8 flex-1 justify-center">
                {/* Titre et description */}
                <View className="gap-3">
                    <ThemedText type="bigTitle">Nouveau mot de passe</ThemedText>
                    <Text className="text-gray-500 text-lg">
                        Choisissez un nouveau mot de passe sécurisé pour votre compte.
                    </Text>
                </View>

                {/* Formulaire */}
                <View className="gap-6">
                    {/* Token - seulement visible si pas fourni dans l'URL */}
                    {!params.token && (
                        <TextInput
                            label="Token de réinitialisation"
                            placeholder="Collez le token reçu par email"
                            value={token}
                            onChangeText={(text) => {
                                setToken(text);
                                if (errors.token) setErrors({ ...errors, token: undefined });
                            }}
                            error={errors.token}
                            autoCapitalize="none"
                            icon="key"
                            editable={!isLoading}
                        />
                    )}

                    <TextInput
                        label="Nouveau mot de passe"
                        placeholder="••••••••"
                        value={newPassword}
                        onChangeText={(text) => {
                            setNewPassword(text);
                            if (errors.newPassword) setErrors({ ...errors, newPassword: undefined });
                        }}
                        error={errors.newPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        autoComplete="password-new"
                        icon="lock"
                        editable={!isLoading}
                    />

                    <TextInput
                        label="Confirmer le mot de passe"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChangeText={(text) => {
                            setConfirmPassword(text);
                            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                        }}
                        error={errors.confirmPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        autoComplete="password-new"
                        icon="lock"
                        editable={!isLoading}
                    />

                    <Pressable
                        className={`py-4 px-6 rounded-xl flex-row items-center justify-center gap-2 ${
                            isLoading ? 'bg-gray-400' : 'bg-black active:opacity-80'
                        }`}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <ActivityIndicator color="#fff" />
                                <Text className="text-white text-center font-semibold text-lg">
                                    Réinitialisation...
                                </Text>
                            </>
                        ) : (
                            <Text className="text-white text-center font-semibold text-lg">
                                Réinitialiser le mot de passe
                            </Text>
                        )}
                    </Pressable>
                </View>
            </View>

            {/* Espace vide en bas pour équilibrer */}
            <View />
        </ScreenScroll>
    );
};

export default ResetPasswordScreen;
