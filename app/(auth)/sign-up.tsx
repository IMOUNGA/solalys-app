import React, { useState, useEffect } from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { router, Link } from 'expo-router';
import ScreenScroll from '@/components/ux/ScreenScroll';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TextInput } from '@/components/ui/text-input';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { registerThunk } from '@/store/thunks/authThunks';
import { validateFirstName, validateLastName, validateEmail, validatePassword } from '@/utils/validation';
import { useErrorAlert } from '@/hooks/useAlert';

const SignUp = () => {
    const dispatch = useAppDispatch();
    const { user, status } = useAppSelector((state) => state.auth);
    const showErrorAlert = useErrorAlert();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{
        firstName?: string;
        lastName?: string;
        email?: string;
        password?: string;
    }>({});

    // Redirection automatique si déjà authentifié
    useEffect(() => {
        if (status === 'authenticated' && user) {
            router.replace('/(tabs)/(compte)');
        }
    }, [status, user]);

    const validateForm = (): boolean => {
        const newErrors: {
            firstName?: string;
            lastName?: string;
            email?: string;
            password?: string;
        } = {};

        // Validation firstName
        const firstNameError = validateFirstName(firstName);
        if (firstNameError) newErrors.firstName = firstNameError;

        // Validation lastName
        const lastNameError = validateLastName(lastName);
        if (lastNameError) newErrors.lastName = lastNameError;

        // Validation email
        const emailError = validateEmail(email);
        if (emailError) newErrors.email = emailError;

        // Validation password
        const passwordError = validatePassword(password);
        if (passwordError) newErrors.password = passwordError;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignUp = async () => {
        if (!validateForm()) return;

        try {
            await dispatch(registerThunk({ firstName, lastName, email, password })).unwrap();
            // Navigation après succès
            router.replace('/(tabs)/(trouver)');
        } catch (err: any) {
            showErrorAlert(
                err.message || 'Une erreur est survenue lors de la création du compte',
                'Erreur'
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
                    <ThemedText type="bigTitle">Créer un compte</ThemedText>
                    <Text className="text-gray-500 text-lg">
                        Rejoignez Solalys et commencez à découvrir des événements et groupes dès maintenant.
                    </Text>
                </View>

                {/* Formulaire */}
                <View className="gap-6">
                    <TextInput
                        label="Prénom"
                        placeholder="Jean"
                        value={firstName}
                        onChangeText={(text) => {
                            setFirstName(text);
                            if (errors.firstName) setErrors({ ...errors, firstName: undefined });
                        }}
                        error={errors.firstName}
                        autoCapitalize="words"
                        autoComplete="given-name"
                        icon="person"
                    />

                    <TextInput
                        label="Nom"
                        placeholder="Dupont"
                        value={lastName}
                        onChangeText={(text) => {
                            setLastName(text);
                            if (errors.lastName) setErrors({ ...errors, lastName: undefined });
                        }}
                        error={errors.lastName}
                        autoCapitalize="words"
                        autoComplete="family-name"
                        icon="person"
                    />

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
                        autoComplete="password-new"
                        icon="lock"
                    />

                    {/* Bouton de création de compte */}
                    <Pressable
                        className={`py-4 px-6 rounded-xl flex-row items-center justify-center gap-2 ${
                            isLoading ? 'bg-gray-400' : 'bg-black active:opacity-80'
                        }`}
                        onPress={handleSignUp}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <ActivityIndicator color="#fff" />
                                <Text className="text-white text-center font-semibold text-lg">
                                    Création en cours...
                                </Text>
                            </>
                        ) : (
                            <Text className="text-white text-center font-semibold text-lg">
                                Créer mon compte
                            </Text>
                        )}
                    </Pressable>

                    {/* Lien vers connexion */}
                    <View className="flex-row items-center justify-center gap-1">
                        <Text className="text-gray-600 text-base">
                            Déjà un compte ?
                        </Text>
                        <Link href="/(auth)/sign-in" asChild>
                            <Pressable className="active:opacity-60" disabled={isLoading}>
                                <Text className="text-black font-semibold text-base underline">
                                    Se connecter
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

export default SignUp;
