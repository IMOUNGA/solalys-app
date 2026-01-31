import React, { useState, useEffect } from 'react';
import { Pressable, Text, View, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { router, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TextInput } from '@/components/ui/text-input';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { setCredentialsThunk } from '@/store/thunks/authThunks';
import { validateEmail, validatePassword } from '@/utils/validation';
import { useErrorAlert } from '@/hooks/useAlert';

const { width } = Dimensions.get('window');

const SignIn = () => {
    const dispatch = useAppDispatch();
    const { user, status } = useAppSelector((state) => state.auth);
    const showErrorAlert = useErrorAlert();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    // Redirection automatique si déjà authentifié
    useEffect(() => {
        if (status === 'authenticated' && user) {
            router.replace('/(tabs)/(compte)');
        }
    }, [status, user]);

    const validateForm = (): boolean => {
        const newErrors: { email?: string; password?: string } = {};

        // Validation email
        const emailError = validateEmail(email);
        if (emailError) newErrors.email = emailError;

        // Validation password
        const passwordError = validatePassword(password);
        if (passwordError) newErrors.password = passwordError;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignIn = async () => {
        if (!validateForm()) return;

        try {
            await dispatch(setCredentialsThunk({ email, password })).unwrap();
            router.replace('/(tabs)/(trouver)');
        } catch (err: any) {
            showErrorAlert(
                err.message || 'Une erreur est survenue lors de la connexion',
                'Erreur de connexion'
            );
        }
    };

    const isLoading = status === 'loading';

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
                                <IconSymbol name="person.circle.fill" size={48} color="#fff" />
                            </View>
                            <Text className="text-white text-3xl font-bold mb-2">
                                Connexion
                            </Text>
                            <Text className="text-white/90 text-center text-base">
                                Bienvenue ! Connectez-vous pour accéder à votre compte.
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
                                        if (errors.email) setErrors({ ...errors, email: undefined });
                                    }}
                                    error={errors.email}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    icon="envelope"
                                />

                                <TextInput
                                    label="Mot de passe"
                                    placeholder="••••••••"
                                    value={password}
                                    onChangeText={(text: string) => {
                                        setPassword(text);
                                        if (errors.password) setErrors({ ...errors, password: undefined });
                                    }}
                                    error={errors.password}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoComplete="password"
                                    icon="lock"
                                />

                                {/* Lien mot de passe oublié */}
                                <Link href="/(auth)/forgot-password" asChild>
                                    <Pressable className="self-end active:opacity-60" disabled={isLoading}>
                                        <Text className="text-blue-600 text-sm font-semibold underline">
                                            Mot de passe oublié ?
                                        </Text>
                                    </Pressable>
                                </Link>

                                {/* Bouton de connexion */}
                                <Pressable
                                    className={`py-4 px-6 rounded-2xl flex-row items-center justify-center gap-2 mt-2 ${
                                        isLoading ? 'opacity-70' : 'active:opacity-80'
                                    }`}
                                    onPress={handleSignIn}
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
                                                Connexion...
                                            </Text>
                                        </>
                                    ) : (
                                        <Text className="text-white text-center font-bold text-lg">
                                            Se connecter
                                        </Text>
                                    )}
                                </Pressable>

                                {/* Lien vers inscription */}
                                <View className="flex-row items-center justify-center gap-1 mt-2">
                                    <Text className="text-gray-600 text-base">
                                        Pas encore de compte ?
                                    </Text>
                                    <Link href="/(auth)/sign-up" asChild>
                                        <Pressable className="active:opacity-60" disabled={isLoading}>
                                            <Text className="text-blue-600 font-bold text-base underline">
                                                S'inscrire
                                            </Text>
                                        </Pressable>
                                    </Link>
                                </View>
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

export default SignIn;
