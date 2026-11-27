import React, { useState } from 'react';
import { Pressable, Text, View, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TextInput } from '@/components/ui/text-input';
import { validateEmail } from '@/utils/validation';
import { ApiService } from '@/services/apiService';
import { URLS } from '@/constants/urls/apiUrls';
import { useErrorAlert } from '@/hooks/useAlert';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

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
            <View className="flex-1 bg-white">
                <LinearGradient
                    colors={['#2345C2', '#3A5FE0']}
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
                                Email envoyé !
                            </Text>
                            <Text className="text-gray-600 text-center text-base mb-4 leading-6">
                                Si un compte existe avec cette adresse, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
                            </Text>
                            <Text className="text-gray-500 text-sm text-center mb-6">
                                Vérifiez également vos spams si vous ne le trouvez pas.
                            </Text>

                            <Pressable
                                className="py-4 px-6 rounded-2xl w-full active:opacity-80 mt-2"
                                onPress={() => router.push('/(auth)/sign-in')}
                            >
                                <LinearGradient
                                    colors={['#2345C2', '#3A5FE0']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16 }}
                                />
                                <Text className="text-white text-center font-bold text-lg">
                                    Retour à la connexion
                                </Text>
                            </Pressable>

                            {/* Mode dev: afficher le token et lien vers reset password */}
                            {__DEV__ && devToken && (
                                <View className="mt-6 p-4 bg-brand-50 border border-brand-100 rounded-2xl w-full">
                                    <Text className="text-brand-600 text-sm font-semibold mb-2">
                                        🔧 Mode Développement
                                    </Text>
                                    <Text className="text-brand-600 text-xs mb-2">
                                        Voici le token de réinitialisation :
                                    </Text>

                                    {/* Token avec bouton de copie */}
                                    <View className="bg-white p-3 rounded-xl border border-blue-300 mb-3 flex-row items-center justify-between gap-2">
                                        <Text className="text-xs font-mono text-gray-800 flex-1" numberOfLines={1} ellipsizeMode="middle">
                                            {devToken}
                                        </Text>
                                        <Pressable
                                            className="px-3 py-2 rounded-lg flex-row items-center gap-1 active:opacity-80"
                                            style={{ backgroundColor: isCopied ? '#10b981' : '#2345C2' }}
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

                                    <Text className="text-brand-600 text-xs mb-3">
                                        Cliquez sur "Copier" puis utilisez-le sur la page de réinitialisation.
                                    </Text>
                                    <Pressable
                                        className="bg-brand py-3 px-4 rounded-xl active:opacity-80"
                                        onPress={() => router.push('/(auth)/reset-password')}
                                    >
                                        <Text className="text-white text-center font-semibold text-sm">
                                            Aller à Reset Password →
                                        </Text>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    </View>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View className="flex-1">
            <LinearGradient
                colors={['#2345C2', '#3A5FE0']}
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
                                <IconSymbol name="lock.rotation" size={48} color="#fff" />
                            </View>
                            <Text className="text-white text-3xl font-bold mb-2">
                                Mot de passe oublié ?
                            </Text>
                            <Text className="text-white/90 text-center text-base">
                                Entrez votre email pour recevoir un lien de réinitialisation
                            </Text>
                        </View>

                        {/* Form Card */}
                        <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
                            <View className="gap-5">
                                <TextInput
                                    label="Email"
                                    placeholder="exemple@email.com"
                                    value={email}
                                    onChangeText={(text: string) => {
                                        setEmail(text);
                                        if (emailError) setEmailError(undefined);
                                    }}
                                    error={emailError}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    icon="envelope"
                                />

                                <Pressable
                                    className={`py-4 px-6 rounded-2xl flex-row items-center justify-center gap-2 mt-2 ${
                                        isLoading ? 'opacity-70' : 'active:opacity-80'
                                    }`}
                                    onPress={handleSubmit}
                                    disabled={isLoading}
                                >
                                    <LinearGradient
                                        colors={isLoading ? ['#9ca3af', '#9ca3af'] : ['#2345C2', '#3A5FE0']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16 }}
                                    />
                                    {isLoading ? (
                                        <>
                                            <ActivityIndicator color="#fff" />
                                            <Text className="text-white text-center font-bold text-lg">
                                                Envoi en cours...
                                            </Text>
                                        </>
                                    ) : (
                                        <Text className="text-white text-center font-bold text-lg">
                                            Envoyer le lien
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

export default ForgotPasswordScreen;
