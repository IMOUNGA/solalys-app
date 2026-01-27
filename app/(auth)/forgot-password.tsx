import React, { useState } from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import ScreenScroll from '@/components/ux/ScreenScroll';
import { ThemedText } from '@/components/themed-text';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TextInput } from '@/components/ui/text-input';
import { validateEmail } from '@/utils/validation';
import { ApiService } from '@/services/apiService';
import { URLS } from '@/constants/urls/apiUrls';
import { useErrorAlert } from '@/hooks/useAlert';
import * as Clipboard from 'expo-clipboard';

const ForgotPasswordScreen = () => {
    const showErrorAlert = useErrorAlert();
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [devToken, setDevToken] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleSubmit = async () => {
        // Validation
        const error = validateEmail(email);
        if (error) {
            setEmailError(error);
            return;
        }

        setIsLoading(true);
        try {
            const response = await ApiService.post(URLS.AUTH.FORGOT_PASSWORD, { email });
            setEmailSent(true);

            // En dev, récupérer le token depuis la réponse
            if (__DEV__ && response.data?.devToken) {
                setDevToken(response.data.devToken);
                console.log('📧 Email de reset envoyé pour:', email);
                console.log('🔐 Token (dev):', response.data.devToken);
            }
        } catch (err: any) {
            showErrorAlert(
                err?.response?.data?.message || 'Une erreur est survenue',
                'Erreur'
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (emailSent) {
        return (
            <ScreenScroll className="" contentClassName="flex-1 px-5 justify-center py-12">
                <View className="gap-8 items-center">
                    <IconSymbol name="checkmark.circle.fill" size={80} color="#10b981" />
                    <View className="gap-3">
                        <ThemedText type="bigTitle" className="text-center">
                            Email envoyé !
                        </ThemedText>
                        <Text className="text-gray-500 text-lg text-center">
                            Si un compte existe avec cette adresse, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
                        </Text>
                        <Text className="text-gray-400 text-sm text-center mt-4">
                            Vérifiez également vos spams si vous ne le trouvez pas.
                        </Text>
                    </View>
                    <Pressable
                        className="bg-black py-4 px-6 rounded-xl active:opacity-80 w-full mt-4"
                        onPress={() => router.push('/(auth)/sign-in')}
                    >
                        <Text className="text-white text-center font-semibold text-lg">
                            Retour à la connexion
                        </Text>
                    </Pressable>

                    {/* Mode dev: afficher le token et lien vers reset password */}
                    {__DEV__ && devToken && (
                        <View className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <Text className="text-yellow-800 text-sm font-semibold mb-2">
                                🔧 Mode Développement
                            </Text>
                            <Text className="text-yellow-700 text-xs mb-2">
                                Voici le token de réinitialisation :
                            </Text>

                            {/* Token avec bouton de copie */}
                            <View className="bg-white p-3 rounded border border-yellow-300 mb-3 flex-row items-center justify-between gap-2">
                                <Text className="text-xs font-mono text-gray-800 flex-1" numberOfLines={1} ellipsizeMode="middle">
                                    {devToken}
                                </Text>
                                <Pressable
                                    className={`px-3 py-2 rounded-lg flex-row items-center gap-1 ${
                                        isCopied ? 'bg-green-500' : 'bg-yellow-600'
                                    } active:opacity-80`}
                                    onPress={async () => {
                                        await Clipboard.setStringAsync(devToken);
                                        setIsCopied(true);
                                        setTimeout(() => setIsCopied(false), 2000);
                                    }}
                                >
                                    <IconSymbol
                                        name={isCopied ? "checkmark" : "doc.on.doc"}
                                        size={16}
                                        color="#fff"
                                    />
                                    <Text className="text-white text-xs font-semibold">
                                        {isCopied ? 'Copié !' : 'Copier'}
                                    </Text>
                                </Pressable>
                            </View>

                            <Text className="text-yellow-700 text-xs mb-3">
                                Cliquez sur "Copier" puis utilisez-le sur la page de réinitialisation.
                            </Text>
                            <Pressable
                                className="bg-yellow-600 py-3 px-4 rounded-lg active:opacity-80"
                                onPress={() => router.push('/(auth)/reset-password')}
                            >
                                <Text className="text-white text-center font-semibold text-sm">
                                    Aller à Reset Password →
                                </Text>
                            </Pressable>
                        </View>
                    )}
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
                    <ThemedText type="bigTitle">Mot de passe oublié ?</ThemedText>
                    <Text className="text-gray-500 text-lg">
                        Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                    </Text>
                </View>

                {/* Formulaire */}
                <View className="gap-6">
                    <TextInput
                        label="Email"
                        placeholder="exemple@email.com"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            if (emailError) setEmailError(undefined);
                        }}
                        error={emailError}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        icon="envelope"
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
                                    Envoi en cours...
                                </Text>
                            </>
                        ) : (
                            <Text className="text-white text-center font-semibold text-lg">
                                Envoyer le lien
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

export default ForgotPasswordScreen;
