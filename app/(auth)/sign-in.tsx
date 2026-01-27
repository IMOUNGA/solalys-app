import React, { useState, useEffect } from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { router, Link } from 'expo-router';
import ScreenScroll from '@/components/ux/ScreenScroll';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TextInput } from '@/components/ui/text-input';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { setCredentialsThunk } from '@/store/thunks/authThunks';
import { validateEmail, validatePassword } from '@/utils/validation';
import { useErrorAlert } from '@/hooks/useAlert';

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
            // Navigation gérée par le redirect après succès
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
                {/* Titre */}
                <View className="gap-3">
                    <ThemedText type="bigTitle">Connexion</ThemedText>
                    <Text className="text-gray-500 text-lg">
                        Bienvenue ! Connectez-vous pour accéder à votre compte.
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
                        onChangeText={(text) => {
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
                            <Text className="text-gray-600 text-sm underline">
                                Mot de passe oublié ?
                            </Text>
                        </Pressable>
                    </Link>

                    {/* Bouton de connexion */}
                    <Pressable
                        className={`py-4 px-6 rounded-xl flex-row items-center justify-center gap-2 ${
                            isLoading ? 'bg-gray-400' : 'bg-black active:opacity-80'
                        }`}
                        onPress={handleSignIn}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <ActivityIndicator color="#fff" />
                                <Text className="text-white text-center font-semibold text-lg">
                                    Connexion...
                                </Text>
                            </>
                        ) : (
                            <Text className="text-white text-center font-semibold text-lg">
                                Se connecter
                            </Text>
                        )}
                    </Pressable>

                    {/* Lien vers inscription */}
                    <View className="flex-row items-center justify-center gap-1">
                        <Text className="text-gray-600 text-base">
                            Pas encore de compte ?
                        </Text>
                        <Link href="/(auth)/sign-up" asChild>
                            <Pressable className="active:opacity-60" disabled={isLoading}>
                                <Text className="text-black font-semibold text-base underline">
                                    S'inscrire
                                </Text>
                            </Pressable>
                        </Link>
                    </View>
                </View>
            </View>

            {/* Espace vide en bas pour équilibrer */}
            <View />
        </ScreenScroll>
    );
};

export default SignIn;
